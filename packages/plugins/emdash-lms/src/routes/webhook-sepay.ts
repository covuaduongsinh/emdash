/**
 * SePay Webhook Route (Official & Secure)
 * Handles incoming VietQR bank transfer webhooks from SePay with strict API Key authentication,
 * idempotency, amount verification, expiration check, and automatic fulfillment.
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

import { extractLmsOrderCode, verifySepayApiKey } from "../providers/sepay.js";

export const webhookSepayInputSchema = z
	.object({
		id: z.union([z.number(), z.string()]),
		gateway: z.string().optional(),
		transactionDate: z.string().optional(),
		accountNumber: z.string().optional(),
		subAccount: z.string().nullable().optional(),
		code: z.string().nullable().optional(),
		content: z.string().optional().default(""),
		transferType: z.enum(["in", "out"]).optional().default("in"),
		description: z.string().nullable().optional(),
		transferAmount: z.number().optional().default(0),
		accumulated: z.number().optional(),
		referenceCode: z.string().nullable().optional(),
	})
	.passthrough();

export type WebhookSepayInput = z.infer<typeof webhookSepayInputSchema>;

export async function webhookSepayRoute(ctx: RouteContext) {
	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	// 1. Authenticate SePay API Key (Mandatory security check)
	const authHeader =
		ctx.request.headers.get("authorization") ||
		ctx.request.headers.get("x-sepay-api-key") ||
		ctx.request.headers.get("x-api-key");

	const configuredKey =
		((await ctx.kv?.get("settings:sepay_api_key")) as string | null) ||
		process.env.SEPAY_API_KEY;

	if (!verifySepayApiKey(authHeader, configuredKey)) {
		ctx.log?.warn?.("SePay webhook: unauthorized request rejected (missing or invalid API key)");
		throw PluginRouteError.unauthorized("Missing or invalid SePay API Key");
	}

	const input = (ctx.input || {}) as WebhookSepayInput;

	// 2. Validate transfer direction
	if (input.transferType !== "in" || input.transferAmount <= 0) {
		return { success: true, message: "Ignored outgoing or non-positive transfer" };
	}

	// 3. Extract LMS-XXXXXXXX order code
	const fullContent = `${input.content || ""} ${input.description || ""} ${input.code || ""}`;
	const orderCode = extractLmsOrderCode(fullContent);

	if (!orderCode) {
		ctx.log?.info?.("SePay webhook: No LMS order code found in transaction content", {
			transactionId: input.id,
			gateway: input.gateway,
		});
		return { success: true, message: "No matching LMS order code found in transfer content" };
	}

	// 4. Lookup order in database
	let orderItem = (await ctx.content.get("orders", orderCode).catch(() => null)) as {
		id: string;
		data: Record<string, unknown>;
	} | null;

	if (!orderItem) {
		const list = await ctx.content.list("orders", {
			where: { fieldFilters: { slug: orderCode.toLowerCase() } },
			limit: 1,
		});
		orderItem = list.items[0] || null;
	}

	if (!orderItem) {
		const allPending = await ctx.content.list("orders", {
			where: { fieldFilters: { status: "pending" } },
			limit: 50,
		});
		orderItem =
			allPending.items.find((item) => {
				const meta = item.data.metadata as Record<string, unknown> | undefined;
				return meta?.order_code === orderCode;
			}) || null;
	}

	// If not found in pending, check if already completed for idempotency
	if (!orderItem) {
		const allCompleted = await ctx.content.list("orders", {
			where: { fieldFilters: { status: "completed" } },
			limit: 50,
		});
		const completedMatch = allCompleted.items.find((item) => {
			const meta = item.data.metadata as Record<string, unknown> | undefined;
			return (
				meta?.order_code === orderCode ||
				meta?.sepay_transaction_id === input.id ||
				String(item.data.payment_id) === String(input.id)
			);
		});

		if (completedMatch) {
			ctx.log?.info?.("SePay webhook: Order already completed (idempotent replay)", {
				orderCode,
				transactionId: input.id,
			});
			return { success: true, message: "Order already completed" };
		}

		ctx.log?.info?.("SePay webhook: Order not found for code", { orderCode });
		return { success: true, message: "Order not found" };
	}

	const orderData = orderItem.data as Record<string, unknown>;

	// 5. Idempotency check on existing order
	if (orderData.status === "completed") {
		return { success: true, message: "Order already completed" };
	}

	// 6. Check receiving bank account (if configured)
	const configuredAccount =
		((await ctx.kv?.get("settings:bank_account")) as string | null) ||
		process.env.SEPAY_BANK_ACCOUNT;

	if (
		configuredAccount &&
		input.accountNumber &&
		input.accountNumber.trim() !== configuredAccount.trim()
	) {
		ctx.log?.warn?.("SePay webhook: receiving account mismatch", {
			received: input.accountNumber,
			expected: configuredAccount,
		});
		return { success: true, message: "Receiving account mismatch" };
	}

	// 7. Check payment amount
	const requiredAmount = (orderData.amount as number) || 0;
	if (input.transferAmount < requiredAmount) {
		ctx.log?.warn?.("SePay webhook: underpaid transfer", {
			orderId: orderItem.id,
			orderCode,
			required: requiredAmount,
			received: input.transferAmount,
		});
		return { success: true, message: "Underpaid transfer" };
	}

	// 8. Check order expiration
	const metadata = (orderData.metadata || {}) as Record<string, unknown>;
	if (metadata.expires_at && new Date() > new Date(metadata.expires_at as string)) {
		ctx.log?.warn?.("SePay webhook: order expired", {
			orderId: orderItem.id,
			orderCode,
			expiresAt: metadata.expires_at,
		});
		if (ctx.content.update) {
			await ctx.content.update("orders", orderItem.id, { status: "expired" });
		}
		return { success: true, message: "Order has expired" };
	}

	// 9. Fulfill order (Activate membership or course enrollment)
	const now = new Date().toISOString();
	const userId = orderData.user_id as string;
	const itemId = orderData.item_id as string;

	if (orderData.type === "membership") {
		const planItem = await ctx.content.get("membership_plans", itemId).catch(() => null);
		const planData = (planItem?.data || {}) as Record<string, unknown>;
		const billingPeriod = (planData.billing_period as string) || "monthly";

		let expiresAt: string | undefined;
		const expDate = new Date();
		if (billingPeriod === "monthly") {
			expDate.setMonth(expDate.getMonth() + 1);
			expiresAt = expDate.toISOString();
		} else if (billingPeriod === "quarterly") {
			expDate.setMonth(expDate.getMonth() + 3);
			expiresAt = expDate.toISOString();
		} else if (billingPeriod === "yearly") {
			expDate.setFullYear(expDate.getFullYear() + 1);
			expiresAt = expDate.toISOString();
		} else if (billingPeriod === "lifetime") {
			expDate.setFullYear(expDate.getFullYear() + 100);
			expiresAt = expDate.toISOString();
		}

		if (ctx.content.create) {
			await ctx.content.create("memberships", {
				user_id: userId,
				plan_id: itemId,
				membership_type: "loyalty",
				status: "active",
				started_at: now,
				expires_at: expiresAt,
				payment_provider: "sepay",
				subscription_id: String(input.id),
			});
		}
	} else if (orderData.type === "course") {
		if (ctx.content.create) {
			await ctx.content.create("enrollments", {
				user_id: userId,
				course_id: itemId,
				source: "purchase",
				order_id: orderItem.id,
				progress: 0,
				started_at: now,
			});
		}
	}

	// 10. Mark order completed
	if (ctx.content.update) {
		await ctx.content.update("orders", orderItem.id, {
			status: "completed",
			payment_provider: "sepay",
			payment_id: String(input.id),
			metadata: {
				...metadata,
				sepay_transaction_id: input.id,
				reference_code: input.referenceCode,
				gateway: input.gateway,
				transfer_amount: input.transferAmount,
				paid_at: now,
			},
		});
	}

	ctx.log?.info?.("SePay webhook: order fulfilled successfully", {
		orderId: orderItem.id,
		orderCode,
		type: orderData.type,
	});

	return { success: true };
}
