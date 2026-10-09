/**
 * Orders API Routes
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

import type { Order } from "../types.js";

const COLLECTION = "orders";

export const ordersRouteInputSchema = z.object({
	action: z.enum(["list", "get", "create"]),
	id: z.string().optional(),
	userId: z.string().optional(),
	data: z.record(z.string(), z.unknown()).optional(),
});

export type OrdersRouteInput = z.infer<typeof ordersRouteInputSchema>;

export async function ordersRoute(ctx: RouteContext) {
	const { action, id, userId, data } = (ctx.input || {}) as OrdersRouteInput;

	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	switch (action) {
		case "list":
			return listOrders(ctx, userId);
		case "get":
			if (!id) throw PluginRouteError.badRequest("Order ID required");
			return getOrder(ctx, id);
		case "create":
			if (!data) throw PluginRouteError.badRequest("Order data required");
			return createOrder(ctx, data as Partial<Order>);
		default:
			throw PluginRouteError.badRequest(`Unknown action: ${action}`);
	}
}

async function listOrders(ctx: RouteContext, userId?: string) {
	const result = await ctx.content!.list(COLLECTION, {
		where: userId ? { fieldFilters: { user_id: userId } } : undefined,
		orderBy: { created_at: "desc" },
	});

	return { items: result.items.map((item) => ({ id: item.id, ...item.data })) };
}

async function getOrder(ctx: RouteContext, id: string) {
	const item = await ctx.content!.get(COLLECTION, id);
	if (!item) throw PluginRouteError.notFound("Order not found");
	return { id: item.id, ...item.data };
}

async function createOrder(ctx: RouteContext, data: Partial<Order>) {
	if (!ctx.content?.create) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	if (!data.user_id || !data.type || !data.item_id || data.amount === undefined) {
		throw PluginRouteError.badRequest("Missing required order fields");
	}

	const orderData = {
		user_id: data.user_id,
		type: data.type,
		item_id: data.item_id,
		amount: data.amount,
		currency: data.currency || "VND",
		status: "pending",
		payment_provider: data.payment_provider || "",
		metadata: data.metadata,
	};

	const item = await ctx.content.create(COLLECTION, orderData as Record<string, unknown>);
	return { id: item.id, ...item.data };
}
