/**
 * Student Me Enroll API Route
 *
 * Enrolls the authenticated user into a free course.
 * Uses ctx.user.id strictly.
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

import type { Course } from "../types.js";

export const meEnrollInputSchema = z.object({
	courseId: z.string(),
});

export type MeEnrollInput = z.infer<typeof meEnrollInputSchema>;

export async function meEnrollRoute(ctx: RouteContext) {
	if (!ctx.user?.id) {
		throw PluginRouteError.unauthorized("Authentication required");
	}

	if (!ctx.content?.create) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const userId = ctx.user.id;
	const input = (ctx.input ?? {}) as MeEnrollInput;
	const { courseId } = input;

	if (!courseId) {
		throw PluginRouteError.badRequest("courseId is required");
	}

	// Fetch course
	const courseItem = await ctx.content.get("courses", courseId);
	if (!courseItem) {
		throw PluginRouteError.notFound("Course not found");
	}
	const course = { id: courseItem.id, ...courseItem.data } as Course;

	// Only free courses can be self-enrolled directly without payment/membership
	if (course.access_level !== "free") {
		throw PluginRouteError.forbidden("This course requires a library membership or purchase");
	}

	// Check existing enrollment
	const existingResult = await ctx.content.list("enrollments", {
		where: {
			fieldFilters: {
				user_id: userId,
				course_id: courseId,
			},
		},
		limit: 1,
	});

	if (existingResult.items.length > 0) {
		const existing = existingResult.items[0];
		return {
			success: true,
			enrolled: true,
			enrollment: { id: existing.id, ...existing.data },
		};
	}

	// Create enrollment record
	const now = new Date().toISOString();
	const enrollmentData = {
		user_id: userId,
		course_id: courseId,
		source: "membership",
		progress: 0,
		started_at: now,
	};

	const created = await ctx.content.create("enrollments", enrollmentData);

	return {
		success: true,
		enrolled: true,
		enrollment: { id: created.id, ...created.data },
	};
}
