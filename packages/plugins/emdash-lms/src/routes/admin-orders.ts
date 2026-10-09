/**
 * Admin Orders API Routes
 * Handlers for listing orders and manual order confirmation by coaches/administrators
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

export const adminOrdersListInputSchema = z.object({
	status: z.enum(["all", "pending", "completed", "cancelled", "expired"]).optional(),
	limit: z.number().min(1).max(100).optional(),
	cursor: z.string().optional(),
});

export type AdminOrdersListInput = z.infer<typeof adminOrdersListInputSchema>;

export async function adminOrdersListRoute(ctx: RouteContext) {
	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	const input = (ctx.input || {}) as AdminOrdersListInput;
	const status = input.status && input.status !== "all" ? input.status : undefined;

	const result = await ctx.content.list("orders", {
		where: status ? { fieldFilters: { status } } : undefined,
		orderBy: { created_at: "desc" },
		limit: input.limit || 50,
		cursor: input.cursor,
	});

	return {
		items: result.items.map((item) => ({
			id: item.id,
			...item.data,
		})),
		nextCursor: (result as { nextCursor?: string }).nextCursor,
	};
}

export const adminOrdersConfirmInputSchema = z.object({
	orderId: z.string().min(1),
	reason: z.string().min(1, "Lý do xác nhận là bắt buộc"),
});

export type AdminOrdersConfirmInput = z.infer<typeof adminOrdersConfirmInputSchema>;

export async function adminOrdersConfirmRoute(ctx: RouteContext) {
	const adminId = ctx.user?.id;
	if (!adminId) {
		throw PluginRouteError.unauthorized("Authentication required");
	}

	if (!ctx.content?.update || !ctx.content?.create) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const input = (ctx.input || {}) as AdminOrdersConfirmInput;
	const { orderId, reason } = input;

	const orderItem = await ctx.content.get("orders", orderId);
	if (!orderItem) {
		throw PluginRouteError.notFound("Order not found");
	}

	const orderData = orderItem.data as Record<string, unknown>;
	if (orderData.status !== "pending") {
		throw PluginRouteError.badRequest(`Order is not pending (current status: ${orderData.status})`);
	}

	const now = new Date().toISOString();
	const userId = orderData.user_id as string;
	const itemId = orderData.item_id as string;
	const metadata = (orderData.metadata || {}) as Record<string, unknown>;

	// Fulfill order
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

		await ctx.content.create("memberships", {
			user_id: userId,
			plan_id: itemId,
			membership_type: "loyalty",
			status: "active",
			started_at: now,
			expires_at: expiresAt,
			payment_provider: "manual",
			subscription_id: `manual-${Date.now()}`,
		});
	} else if (orderData.type === "course") {
		await ctx.content.create("enrollments", {
			user_id: userId,
			course_id: itemId,
			source: "purchase",
			order_id: orderItem.id,
			progress: 0,
			started_at: now,
		});
	}

	// Update order to completed with manual audit record
	await ctx.content.update("orders", orderItem.id, {
		status: "completed",
		payment_provider: "manual",
		payment_id: `manual-confirm-${Date.now()}`,
		metadata: {
			...metadata,
			manual_confirmed_by: adminId,
			manual_confirmed_by_email: ctx.user?.email,
			manual_confirm_reason: reason,
			manual_confirmed_at: now,
		},
	});

	ctx.log?.info?.("Admin manually confirmed order", {
		orderId: orderItem.id,
		adminId,
		reason,
	});

	return { success: true };
}
