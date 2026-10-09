/**
 * Membership Plans API Route
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

import type { MembershipPlan } from "../types.js";

const COLLECTION = "membership_plans";

export const plansRouteInputSchema = z.object({
	action: z.enum(["list", "get", "create", "update", "delete"]),
	id: z.string().optional(),
	data: z.record(z.string(), z.unknown()).optional(),
});

export type PlansRouteInput = z.infer<typeof plansRouteInputSchema>;

export async function plansRoute(ctx: RouteContext) {
	const { action, id, data } = (ctx.input || {}) as PlansRouteInput;

	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	switch (action) {
		case "list":
			return listPlans(ctx);
		case "get":
			if (!id) throw PluginRouteError.badRequest("Plan ID required");
			return getPlan(ctx, id);
		case "create":
			if (!data) throw PluginRouteError.badRequest("Plan data required");
			return createPlan(ctx, data as Partial<MembershipPlan>);
		case "update":
			if (!id || !data) throw PluginRouteError.badRequest("Plan ID and data required");
			return updatePlan(ctx, id, data as Partial<MembershipPlan>);
		case "delete":
			if (!id) throw PluginRouteError.badRequest("Plan ID required");
			return deletePlan(ctx, id);
		default:
			throw PluginRouteError.badRequest(`Unknown action: ${action}`);
	}
}

async function listPlans(ctx: RouteContext) {
	const result = await ctx.content!.list(COLLECTION, {
		orderBy: { sort_order: "asc" },
	});
	return { items: result.items.map((item) => ({ id: item.id, ...item.data })) };
}

async function getPlan(ctx: RouteContext, id: string) {
	const item = await ctx.content!.get(COLLECTION, id);
	if (!item) throw PluginRouteError.notFound("Plan not found");
	return { id: item.id, ...item.data };
}

async function createPlan(ctx: RouteContext, data: Partial<MembershipPlan>) {
	if (!ctx.content?.create) {
		throw PluginRouteError.forbidden("Content write access not available");
	}
	const item = await ctx.content.create(COLLECTION, data as Record<string, unknown>);
	return { id: item.id, ...item.data };
}

async function updatePlan(ctx: RouteContext, id: string, data: Partial<MembershipPlan>) {
	if (!ctx.content?.update) {
		throw PluginRouteError.forbidden("Content write access not available");
	}
	const item = await ctx.content.update(COLLECTION, id, data as Record<string, unknown>);
	return { id: item.id, ...item.data };
}

async function deletePlan(ctx: RouteContext, id: string) {
	if (!ctx.content?.delete) {
		throw PluginRouteError.forbidden("Content write access not available");
	}
	const deleted = await ctx.content.delete(COLLECTION, id);
	return { deleted };
}
