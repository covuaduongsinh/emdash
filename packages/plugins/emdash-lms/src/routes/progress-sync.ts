/**
 * Progress Sync API Route
 *
 * Syncs guest / client-side progress (from @duongsinh/chess-kit drainForSync)
 * into server-side lesson_progress and enrollments upon student login.
 * Strictly uses ctx.user.id.
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

import type { Lesson } from "../types.js";

export const progressSyncInputSchema = z.object({
	progress: z
		.object({
			puzzles: z.record(z.string(), z.unknown()).optional(),
			lectures: z.record(z.string(), z.unknown()).optional(),
			lessons: z.record(z.string(), z.unknown()).optional(),
		})
		.optional(),
});

export type ProgressSyncInput = z.infer<typeof progressSyncInputSchema>;

export async function progressSyncRoute(ctx: RouteContext) {
	if (!ctx.user?.id) {
		throw PluginRouteError.unauthorized("Authentication required");
	}

	if (!ctx.content?.create || !ctx.content?.update) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const userId = ctx.user.id;
	const input = (ctx.input ?? {}) as ProgressSyncInput;
	const syncPayload = input.progress || {};
	const syncedLessons: string[] = [];

	const clientLessons = syncPayload.lessons || {};
	const lessonIds = Object.keys(clientLessons);

	if (lessonIds.length === 0) {
		return { success: true, syncedCount: 0, syncedLessons: [] };
	}

	const now = new Date().toISOString();

	for (const lessonId of lessonIds) {
		const clientData = clientLessons[lessonId] as
			| { completed?: boolean; completedAt?: string }
			| undefined;
		if (!clientData?.completed) continue;

		// Fetch lesson to verify and get course_id
		const lessonItem = await ctx.content.get("lessons", lessonId);
		if (!lessonItem) continue;
		const lesson = { id: lessonItem.id, ...lessonItem.data } as Lesson;
		const courseId = lesson.course_id;

		// Check if record exists
		const existingResult = await ctx.content.list("lesson_progress", {
			where: {
				fieldFilters: {
					user_id: userId,
					lesson_id: lessonId,
				},
			},
			limit: 1,
		});

		const completedAt = clientData.completedAt || now;

		if (existingResult.items.length > 0) {
			const existing = existingResult.items[0];
			if (!(existing.data as Record<string, unknown>).completed) {
				await ctx.content.update("lesson_progress", existing.id, {
					completed: true,
					completed_at: completedAt,
					course_id: courseId,
				});
				syncedLessons.push(lessonId);
			}
		} else {
			await ctx.content.create("lesson_progress", {
				user_id: userId,
				lesson_id: lessonId,
				course_id: courseId,
				completed: true,
				completed_at: completedAt,
			});
			syncedLessons.push(lessonId);
		}
	}

	return {
		success: true,
		syncedCount: syncedLessons.length,
		syncedLessons,
	};
}
