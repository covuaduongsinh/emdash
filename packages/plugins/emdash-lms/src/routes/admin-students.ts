/**
 * Admin Students Management API Route
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

export const adminStudentsInputSchema = z.object({
	action: z.enum(["list", "enrollManual", "listCourses"]),
	courseId: z.string().optional(),
	email: z.string().optional(),
	userId: z.string().optional(),
});

export type AdminStudentsInput = z.infer<typeof adminStudentsInputSchema>;

export async function adminStudentsRoute(ctx: RouteContext) {
	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	const { action, courseId, email, userId } = (ctx.input || {}) as AdminStudentsInput;

	switch (action) {
		case "list": {
			const where = courseId ? { fieldFilters: { course_id: courseId } } : undefined;
			const enrollmentsResult = await ctx.content.list("enrollments", {
				where,
				orderBy: { created_at: "desc" },
				limit: 100,
			});

			const items = await Promise.all(
				enrollmentsResult.items.map(async (item) => {
					const data = item.data as Record<string, unknown>;
					let studentName: string | null = null;
					let studentEmail: string | null = null;

					if (ctx.users && data.user_id) {
						try {
							const user = await ctx.users.get(data.user_id as string);
							if (user) {
								studentName = user.name;
								studentEmail = user.email;
							}
						} catch {
							// Ignore user lookup failure
						}
					}

					return {
						id: item.id,
						...data,
						studentName: studentName || data.user_id,
						studentEmail: studentEmail || "N/A",
					};
				}),
			);

			return { items };
		}

		case "listCourses": {
			const coursesResult = await ctx.content.list("courses", {
				orderBy: { created_at: "desc" },
				limit: 200,
			});
			return {
				items: coursesResult.items.map((item) => ({
					id: item.id,
					title: (item.data as Record<string, unknown>).title || item.slug,
					slug: item.slug,
				})),
			};
		}

		case "enrollManual": {
			if (!ctx.content.create) {
				throw PluginRouteError.forbidden("Content write access not available");
			}

			if (!courseId) {
				throw PluginRouteError.badRequest("courseId is required");
			}

			let targetUserId = userId;

			if (!targetUserId && email && ctx.users?.getByEmail) {
				const user = await ctx.users.getByEmail(email);
				if (!user) {
					throw PluginRouteError.notFound(`User with email "${email}" not found`);
				}
				targetUserId = user.id;
			}

			if (!targetUserId) {
				throw PluginRouteError.badRequest("email or userId is required");
			}

			// Check existing enrollment
			const existingResult = await ctx.content.list("enrollments", {
				where: {
					fieldFilters: {
						user_id: targetUserId,
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
					alreadyEnrolled: true,
					enrollment: { id: existing.id, ...existing.data },
				};
			}

			const now = new Date().toISOString();
			const created = await ctx.content.create("enrollments", {
				user_id: targetUserId,
				course_id: courseId,
				source: "membership",
				progress: 0,
				started_at: now,
			});

			return {
				success: true,
				enrolled: true,
				alreadyEnrolled: false,
				enrollment: { id: created.id, ...created.data },
			};
		}

		default:
			throw PluginRouteError.badRequest(`Unknown action: ${action}`);
	}
}
