/**
 * Student Me Progress API Route
 *
 * Retrieves progress details and completed lesson IDs for the authenticated user for a course.
 * Strictly uses ctx.user.id.
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

export const meProgressInputSchema = z.object({
	courseId: z.string(),
});

export type MeProgressInput = z.infer<typeof meProgressInputSchema>;

export async function meProgressRoute(ctx: RouteContext) {
	if (!ctx.user?.id) {
		throw PluginRouteError.unauthorized("Authentication required");
	}

	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	const userId = ctx.user.id;
	const input = (ctx.input ?? {}) as MeProgressInput;
	const { courseId } = input;

	if (!courseId) {
		throw PluginRouteError.badRequest("courseId is required");
	}

	// Fetch all completed lessons for this course
	const completedProgressResult = await ctx.content.list("lesson_progress", {
		where: {
			fieldFilters: {
				user_id: userId,
				course_id: courseId,
				completed: true,
			},
		},
		limit: 500,
	});

	const completedLessonIds = completedProgressResult.items.map(
		(item) => (item.data as Record<string, unknown>).lesson_id as string,
	);

	// Fetch enrollment
	const enrollmentResult = await ctx.content.list("enrollments", {
		where: {
			fieldFilters: {
				user_id: userId,
				course_id: courseId,
			},
		},
		limit: 1,
	});

	const enrollment = enrollmentResult.items[0]
		? { id: enrollmentResult.items[0].id, ...enrollmentResult.items[0].data }
		: null;

	const progress = enrollment
		? (((enrollment as Record<string, unknown>).progress as number) ?? 0)
		: 0;

	return {
		success: true,
		courseId,
		progress,
		completedLessonIds,
		enrollment,
	};
}
