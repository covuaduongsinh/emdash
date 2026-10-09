/**
 * Student Order Get API Route
 * Allows authenticated students to check the status of their own orders (IDOR safe)
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

export const meOrdersGetInputSchema = z.object({
	orderId: z.string().min(1),
});

export type MeOrdersGetInput = z.infer<typeof meOrdersGetInputSchema>;

export async function meOrdersGetRoute(ctx: RouteContext) {
	const userId = ctx.user?.id;
	if (!userId) {
		throw PluginRouteError.unauthorized("Authentication required");
	}

	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	const input = (ctx.input || {}) as MeOrdersGetInput;
	const { orderId } = input;

	// Try getting by ID directly
	let orderItem = await ctx.content.get("orders", orderId).catch(() => null);

	// If not found by ID, try searching by slug (lms-xxxxxxxx)
	if (!orderItem) {
		const list = await ctx.content.list("orders", {
			where: { fieldFilters: { slug: orderId.toLowerCase() } },
			limit: 1,
		});
		orderItem = list.items[0];
	}

	if (!orderItem) {
		throw PluginRouteError.notFound("Order not found");
	}

	const orderData = orderItem.data as Record<string, unknown>;

	// Strict IDOR protection: only the owner can view this order
	if (orderData.user_id !== userId) {
		throw PluginRouteError.forbidden("Access denied to this order");
	}

	return {
		id: orderItem.id,
		...orderData,
	};
}
