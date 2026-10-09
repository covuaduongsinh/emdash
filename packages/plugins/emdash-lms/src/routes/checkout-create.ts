/**
 * Checkout Create API Route
 * Handles creating a pending order and generating SePay VietQR payment info
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

import { generateVietQrUrl } from "../providers/sepay.js";

export const checkoutCreateInputSchema = z.object({
	itemId: z.string().min(1),
	type: z.enum(["membership", "course"]),
	couponCode: z.string().optional(),
});

export type CheckoutCreateInput = z.infer<typeof checkoutCreateInputSchema>;

function generateOrderCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No ambiguous chars (0, O, 1, I)
	let result = "";
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return `LMS-${result}`;
}

export async function checkoutCreateRoute(ctx: RouteContext) {
	const userId = ctx.user?.id;
	if (!userId) {
		throw PluginRouteError.unauthorized("Authentication required to create checkout order");
	}

	if (!ctx.content?.create) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const input = (ctx.input || {}) as CheckoutCreateInput;
	const { itemId, type } = input;

	let itemName = "";
	let amount = 0;
	let realItemId = itemId;

	if (type === "membership") {
		// Look up membership plan by id or slug
		let planItem = await ctx.content.get("membership_plans", itemId).catch(() => null);
		if (!planItem) {
			const list = await ctx.content.list("membership_plans", {
				where: { fieldFilters: { slug: itemId } },
				limit: 1,
			});
			planItem = list.items[0];
		}

		if (!planItem) {
			throw PluginRouteError.notFound("Membership plan not found");
		}

		const planData = planItem.data as Record<string, unknown>;
		realItemId = planItem.id;
		itemName = (planData.name as string) || "Thẻ Thư Viện";
		amount = (planData.sale_price as number) ?? (planData.price as number) ?? 0;
	} else {
		// Look up course by id or slug
		let courseItem = await ctx.content.get("courses", itemId).catch(() => null);
		if (!courseItem) {
			const list = await ctx.content.list("courses", {
				where: { fieldFilters: { slug: itemId } },
				limit: 1,
			});
			courseItem = list.items[0];
		}

		if (!courseItem) {
			throw PluginRouteError.notFound("Course not found");
		}

		const courseData = courseItem.data as Record<string, unknown>;
		realItemId = courseItem.id;
		itemName = (courseData.title as string) || "Chuyên đề cờ vua";
		amount = (courseData.sale_price as number) ?? (courseData.price as number) ?? 0;
	}

	if (amount < 0) {
		throw PluginRouteError.badRequest("Invalid price calculation");
	}

	// Fetch payment settings from KV / env
	const bankCode =
		((await ctx.kv?.get("settings:bank_code")) as string | null) ||
		process.env.SEPAY_BANK_CODE ||
		"MB";

	const bankAccount =
		((await ctx.kv?.get("settings:bank_account")) as string | null) ||
		process.env.SEPAY_BANK_ACCOUNT ||
		"";

	const accountName =
		((await ctx.kv?.get("settings:account_name")) as string | null) ||
		process.env.SEPAY_ACCOUNT_NAME ||
		"";

	const qrTemplate = ((await ctx.kv?.get("settings:qr_template")) as string | null) || "compact";

	const expiresInHours = Number(
		((await ctx.kv?.get("settings:expires_in_hours")) as number | string | null) || 24,
	);

	const orderCode = generateOrderCode();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();

	const orderData: Record<string, unknown> = {
		slug: orderCode.toLowerCase(),
		user_id: userId,
		type,
		item_id: realItemId,
		amount,
		currency: "VND",
		status: "pending",
		payment_provider: "sepay",
		metadata: {
			order_code: orderCode,
			item_name: itemName,
			expires_at: expiresAt,
			created_at: now.toISOString(),
		},
	};

	const createdOrder = await ctx.content.create("orders", orderData);

	const qrUrl = generateVietQrUrl({
		bankCode,
		bankAccount,
		amount,
		description: orderCode,
		template: qrTemplate,
	});

	return {
		orderId: createdOrder.id,
		orderCode,
		itemName,
		amount,
		currency: "VND",
		bankCode,
		bankAccount,
		accountName,
		content: orderCode,
		qrUrl,
		expiresAt,
	};
}
