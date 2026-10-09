/**
 * Student Me Access API Route
 *
 * Checks access permissions for the currently authenticated user.
 * Strictly uses ctx.user.id (never accepts userId from input to prevent IDOR).
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

import { checkCourseAccess, checkLessonAccess } from "../access-control.js";
import type {
	Course,
	CourseEnrollment,
	Lesson,
	Member,
	MembershipPlan,
	UserAccess,
} from "../types.js";

export const meAccessInputSchema = z.object({
	courseId: z.string(),
	lessonId: z.string().optional(),
});

export type MeAccessInput = z.infer<typeof meAccessInputSchema>;

export async function meAccessRoute(ctx: RouteContext) {
	if (!ctx.user?.id) {
		throw PluginRouteError.unauthorized("Authentication required");
	}

	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	const userId = ctx.user.id;
	const input = (ctx.input ?? {}) as MeAccessInput;
	const { courseId, lessonId } = input;

	if (!courseId) {
		throw PluginRouteError.badRequest("courseId is required");
	}

	// Fetch course
	const courseItem = await ctx.content.get("courses", courseId);
	if (!courseItem) {
		throw PluginRouteError.notFound("Course not found");
	}
	const course = { id: courseItem.id, ...courseItem.data } as Course;

	// Fetch user's active membership (using indexed field filters)
	const membersResult = await ctx.content.list("memberships", {
		where: {
			fieldFilters: {
				user_id: userId,
				status: "active",
			},
		},
		limit: 1,
	});

	const activeMemberItem = membersResult.items[0];
	const membership = activeMemberItem
		? ({ id: activeMemberItem.id, ...activeMemberItem.data } as Member)
		: null;

	// Check expiration if present
	const isMembershipValid =
		membership &&
		(!membership.expires_at || new Date(membership.expires_at).getTime() > Date.now());

	// Fetch user's enrollments for this course
	const enrollmentsResult = await ctx.content.list("enrollments", {
		where: {
			fieldFilters: {
				user_id: userId,
				course_id: courseId,
			},
		},
		limit: 1,
	});

	const enrollments = enrollmentsResult.items.map((item) => ({
		id: item.id,
		...item.data,
	})) as CourseEnrollment[];

	// Fetch published plans
	const plansResult = await ctx.content.list("membership_plans", {
		where: { fieldFilters: { status: "published" } },
	});
	const plans = plansResult.items.map((item) => ({
		id: item.id,
		...item.data,
	})) as MembershipPlan[];

	const userAccess: UserAccess = {
		userId,
		activeMembership: isMembershipValid && membership ? (membership as Member) : undefined,
		purchasedCourseIds: enrollments.map((e) => e.course_id),
	};

	if (lessonId) {
		const lessonItem = await ctx.content.get("lessons", lessonId);
		if (!lessonItem) {
			throw PluginRouteError.notFound("Lesson not found");
		}
		const lesson = { id: lessonItem.id, ...lessonItem.data } as Lesson;
		const access = checkLessonAccess(lesson, course, userAccess, plans);
		return { hasAccess: access.allowed, ...access, userAccess };
	}

	const access = checkCourseAccess(course, userAccess, plans);
	return { hasAccess: access.allowed, ...access, userAccess };
}
