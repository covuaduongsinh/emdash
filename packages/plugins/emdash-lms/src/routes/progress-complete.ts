/**
 * Progress Complete API Route
 *
 * Marks a lesson as completed for the authenticated user and updates course enrollment progress.
 * Strictly uses ctx.user.id.
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

import type { Lesson } from "../types.js";

export const progressCompleteInputSchema = z.object({
	lessonId: z.string(),
	courseId: z.string().optional(),
});

export type ProgressCompleteInput = z.infer<typeof progressCompleteInputSchema>;

export async function progressCompleteRoute(ctx: RouteContext) {
	if (!ctx.user?.id) {
		throw PluginRouteError.unauthorized("Authentication required");
	}

	if (!ctx.content?.create || !ctx.content?.update) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const userId = ctx.user.id;
	const input = (ctx.input ?? {}) as ProgressCompleteInput;
	const { lessonId } = input;

	if (!lessonId) {
		throw PluginRouteError.badRequest("lessonId is required");
	}

	// Fetch lesson to verify and get course_id
	const lessonItem = await ctx.content.get("lessons", lessonId);
	if (!lessonItem) {
		throw PluginRouteError.notFound("Lesson not found");
	}
	const lesson = { id: lessonItem.id, ...lessonItem.data } as Lesson;
	const courseId = input.courseId || lesson.course_id;

	const now = new Date().toISOString();

	// 1. Update or create lesson_progress record
	const progressResult = await ctx.content.list("lesson_progress", {
		where: {
			fieldFilters: {
				user_id: userId,
				lesson_id: lessonId,
			},
		},
		limit: 1,
	});

	if (progressResult.items.length > 0) {
		const existingProg = progressResult.items[0];
		await ctx.content.update("lesson_progress", existingProg.id, {
			completed: true,
			completed_at: now,
			course_id: courseId,
		});
	} else {
		await ctx.content.create("lesson_progress", {
			user_id: userId,
			lesson_id: lessonId,
			course_id: courseId,
			completed: true,
			completed_at: now,
		});
	}

	// 2. Recalculate course enrollment progress if courseId exists
	let progressPercentage = 100;
	let completedCount = 1;
	let totalLessons = 1;

	if (courseId) {
		// Get all lessons in this course
		const courseLessonsResult = await ctx.content.list("lessons", {
			where: { fieldFilters: { course_id: courseId } },
			limit: 500,
		});
		totalLessons = courseLessonsResult.items.length || 1;

		// Get all completed lesson progress records for this user in this course
		const completedLessonsResult = await ctx.content.list("lesson_progress", {
			where: {
				fieldFilters: {
					user_id: userId,
					course_id: courseId,
					completed: true,
				},
			},
			limit: 500,
		});
		completedCount = completedLessonsResult.items.length;
		progressPercentage = Math.min(100, Math.round((completedCount / totalLessons) * 100));

		// Find enrollment record
		const enrollmentsResult = await ctx.content.list("enrollments", {
			where: {
				fieldFilters: {
					user_id: userId,
					course_id: courseId,
				},
			},
			limit: 1,
		});

		if (enrollmentsResult.items.length > 0) {
			const enrollment = enrollmentsResult.items[0];
			const isComplete = progressPercentage >= 100;
			await ctx.content.update("enrollments", enrollment.id, {
				progress: progressPercentage,
				completed_at: isComplete ? now : (enrollment.data as Record<string, unknown>).completed_at,
			});
		} else {
			// Auto-create enrollment if user is accessing via library pass
			const isComplete = progressPercentage >= 100;
			await ctx.content.create("enrollments", {
				user_id: userId,
				course_id: courseId,
				source: "membership",
				progress: progressPercentage,
				started_at: now,
				completed_at: isComplete ? now : undefined,
			});
		}
	}

	return {
		success: true,
		lessonId,
		courseId,
		progress: progressPercentage,
		completedCount,
		totalLessons,
	};
}
