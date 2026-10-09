/**
 * Members API Routes
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

import type { Member } from "../types.js";

const COLLECTION = "memberships";

export const membersRouteInputSchema = z.object({
	action: z.enum(["list", "get", "create", "update", "cancel"]),
	id: z.string().optional(),
	userId: z.string().optional(),
	planId: z.string().optional(),
	data: z.record(z.string(), z.unknown()).optional(),
});

export type MembersRouteInput = z.infer<typeof membersRouteInputSchema>;

export async function membersRoute(ctx: RouteContext) {
	const { action, id, userId, planId, data } = (ctx.input || {}) as MembersRouteInput;

	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	switch (action) {
		case "list":
			return listMembers(ctx, { userId, planId });
		case "get":
			if (!id) throw PluginRouteError.badRequest("Member ID required");
			return getMember(ctx, id);
		case "create":
			if (!userId || !planId) throw PluginRouteError.badRequest("User ID and Plan ID required");
			return createMember(ctx, userId, planId, data as Partial<Member>);
		case "update":
			if (!id || !data) throw PluginRouteError.badRequest("Member ID and data required");
			return updateMember(ctx, id, data as Partial<Member>);
		case "cancel":
			if (!id) throw PluginRouteError.badRequest("Member ID required");
			return cancelMember(ctx, id);
		default:
			throw PluginRouteError.badRequest(`Unknown action: ${action}`);
	}
}

async function listMembers(ctx: RouteContext, filters: { userId?: string; planId?: string }) {
	const fieldFilters: Record<string, string> = {};
	if (filters.userId) fieldFilters.user_id = filters.userId;
	if (filters.planId) fieldFilters.plan_id = filters.planId;

	const result = await ctx.content!.list(COLLECTION, {
		where: Object.keys(fieldFilters).length > 0 ? { fieldFilters } : undefined,
		orderBy: { created_at: "desc" },
	});

	return { items: result.items.map((item) => ({ id: item.id, ...item.data })) };
}

async function getMember(ctx: RouteContext, id: string) {
	const item = await ctx.content!.get(COLLECTION, id);
	if (!item) throw PluginRouteError.notFound("Member not found");
	return { id: item.id, ...item.data };
}

async function createMember(
	ctx: RouteContext,
	userId: string,
	planId: string,
	data?: Partial<Member>,
) {
	if (!ctx.content?.create) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	// Check if user already has an active membership using indexed field filter
	const existingResult = await ctx.content.list(COLLECTION, {
		where: {
			fieldFilters: {
				user_id: userId,
				status: "active",
			},
		},
		limit: 1,
	});

	if (existingResult.items.length > 0) {
		throw PluginRouteError.conflict("User already has active membership");
	}

	const now = new Date().toISOString();
	const memberData = {
		user_id: userId,
		plan_id: planId,
		status: "active",
		started_at: now,
		expires_at: data?.expires_at,
		payment_provider: data?.payment_provider,
		subscription_id: data?.subscription_id,
	};

	const item = await ctx.content.create(COLLECTION, memberData);
	return { id: item.id, ...item.data };
}

async function updateMember(ctx: RouteContext, id: string, data: Partial<Member>) {
	if (!ctx.content?.update) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const existing = await ctx.content.get(COLLECTION, id);
	if (!existing) throw PluginRouteError.notFound("Member not found");

	const item = await ctx.content.update(COLLECTION, id, data as Record<string, unknown>);
	return { id: item.id, ...item.data };
}

async function cancelMember(ctx: RouteContext, id: string) {
	if (!ctx.content?.update) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const existing = await ctx.content.get(COLLECTION, id);
	if (!existing) throw PluginRouteError.notFound("Member not found");

	const now = new Date().toISOString();
	const item = await ctx.content.update(COLLECTION, id, {
		status: "cancelled",
		cancelled_at: now,
	});

	return { id: item.id, ...item.data };
}
