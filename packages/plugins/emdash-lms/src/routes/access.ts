/**
 * Access Control API Route (Legacy compatibility)
 *
 * For new code, prefer "me/access" which strictly binds to ctx.user.id.
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

import {
	buildUserAccess,
	checkCourseAccess,
	checkLessonAccess,
	filterAccessibleCourses,
} from "../access-control.js";
import type { Course, CourseEnrollment, Lesson, Member, MembershipPlan } from "../types.js";

export const accessRouteInputSchema = z.object({
	action: z.enum(["check-course", "check-lesson", "list-accessible", "user-access"]),
	courseId: z.string().optional(),
	lessonId: z.string().optional(),
	userId: z.string().optional(),
});

export type AccessRouteInput = z.infer<typeof accessRouteInputSchema>;

export async function accessRoute(ctx: RouteContext) {
	const input = (ctx.input ?? {}) as AccessRouteInput;
	const { action, courseId, lessonId } = input;

	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	// Always prioritize authenticated user's ID to prevent IDOR
	const currentUserId = ctx.user?.id || input.userId;
	if (!currentUserId) {
		throw PluginRouteError.unauthorized("Authentication required");
	}

	switch (action) {
		case "check-course":
			if (!courseId) throw PluginRouteError.badRequest("Course ID required");
			return checkCourseAccessRoute(ctx, currentUserId, courseId);

		case "check-lesson":
			if (!courseId || !lessonId)
				throw PluginRouteError.badRequest("Course ID and Lesson ID required");
			return checkLessonAccessRoute(ctx, currentUserId, courseId, lessonId);

		case "list-accessible":
			return listAccessibleCourses(ctx, currentUserId);

		case "user-access":
			return getUserAccess(ctx, currentUserId);

		default:
			throw PluginRouteError.badRequest(`Unknown action: ${action}`);
	}
}

async function checkCourseAccessRoute(ctx: RouteContext, userId: string, courseId: string) {
	const [course, userAccess, plans] = await Promise.all([
		getCourse(ctx, courseId),
		buildUserAccessFromContent(ctx, userId),
		getPlans(ctx),
	]);

	if (!course) {
		throw PluginRouteError.notFound("Course not found");
	}

	return checkCourseAccess(course, userAccess, plans);
}

async function checkLessonAccessRoute(
	ctx: RouteContext,
	userId: string,
	courseId: string,
	lessonId: string,
) {
	const [course, lesson, userAccess, plans] = await Promise.all([
		getCourse(ctx, courseId),
		getLesson(ctx, lessonId),
		buildUserAccessFromContent(ctx, userId),
		getPlans(ctx),
	]);

	if (!course) throw PluginRouteError.notFound("Course not found");
	if (!lesson) throw PluginRouteError.notFound("Lesson not found");

	return checkLessonAccess(lesson, course, userAccess, plans);
}

async function listAccessibleCourses(ctx: RouteContext, userId: string) {
	const [courses, userAccess, plans] = await Promise.all([
		getAllCourses(ctx),
		buildUserAccessFromContent(ctx, userId),
		getPlans(ctx),
	]);

	const accessible = filterAccessibleCourses(courses, userAccess, plans);
	return { items: accessible };
}

async function getUserAccess(ctx: RouteContext, userId: string) {
	return buildUserAccessFromContent(ctx, userId);
}

async function buildUserAccessFromContent(ctx: RouteContext, userId: string) {
	const membersResult = await ctx.content!.list("memberships", {
		where: {
			fieldFilters: {
				user_id: userId,
				status: "active",
			},
		},
		limit: 1,
	});
	const memberItem = membersResult.items[0];
	const membership = memberItem ? ({ id: memberItem.id, ...memberItem.data } as Member) : null;

	const enrollmentsResult = await ctx.content!.list("enrollments", {
		where: {
			fieldFilters: {
				user_id: userId,
			},
		},
		limit: 500,
	});
	const enrollments = enrollmentsResult.items.map((item) => ({
		id: item.id,
		...item.data,
	})) as CourseEnrollment[];

	return buildUserAccess(userId, membership, enrollments);
}

async function getPlans(ctx: RouteContext): Promise<MembershipPlan[]> {
	const result = await ctx.content!.list("membership_plans", {
		where: { fieldFilters: { status: "published" } },
	});
	return result.items.map((item) => ({ id: item.id, ...item.data })) as MembershipPlan[];
}

async function getCourse(ctx: RouteContext, courseId: string): Promise<Course | null> {
	const item = await ctx.content!.get("courses", courseId);
	if (!item) return null;
	return { id: item.id, ...item.data } as Course;
}

async function getLesson(ctx: RouteContext, lessonId: string): Promise<Lesson | null> {
	const item = await ctx.content!.get("lessons", lessonId);
	if (!item) return null;
	return { id: item.id, ...item.data } as Lesson;
}

async function getAllCourses(ctx: RouteContext): Promise<Course[]> {
	const result = await ctx.content!.list("courses", {
		where: { fieldFilters: { status: "published" } },
	});
	return result.items.map((item) => ({ id: item.id, ...item.data })) as Course[];
}
