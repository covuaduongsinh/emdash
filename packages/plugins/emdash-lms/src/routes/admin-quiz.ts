/**
 * Admin Quiz API Routes
 * Handlers for Quiz and Question management (CRUD, reordering, options)
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

// =============================================================================
// Admin Quiz List
// =============================================================================

export const adminQuizListInputSchema = z.object({
	lessonId: z.string().optional(),
	search: z.string().optional(),
	limit: z.number().min(1).max(100).optional(),
	cursor: z.string().optional(),
});

export type AdminQuizListInput = z.infer<typeof adminQuizListInputSchema>;

export async function adminQuizListRoute(ctx: RouteContext) {
	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	const input = (ctx.input || {}) as AdminQuizListInput;
	const lessonId = input.lessonId;

	const result = await ctx.content.list("quizzes", {
		where: lessonId ? { fieldFilters: { lesson_id: lessonId } } : undefined,
		orderBy: { created_at: "desc" },
		limit: input.limit || 50,
		cursor: input.cursor,
	});

	// Get questions count per quiz
	const quizzesWithCounts = await Promise.all(
		result.items.map(async (item) => {
			const qRes = await ctx.content!.list("questions", {
				where: { fieldFilters: { quiz_id: item.id } },
				limit: 100,
			});
			return {
				id: item.id,
				...item.data,
				questionCount: qRes.items.length,
			};
		}),
	);

	return {
		items: quizzesWithCounts,
		nextCursor: (result as { nextCursor?: string }).nextCursor,
	};
}

// =============================================================================
// Admin Quiz Get
// =============================================================================

export const adminQuizGetInputSchema = z.object({
	id: z.string().min(1),
});

export type AdminQuizGetInput = z.infer<typeof adminQuizGetInputSchema>;

export async function adminQuizGetRoute(ctx: RouteContext) {
	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	const input = (ctx.input || {}) as AdminQuizGetInput;
	const quizItem = await ctx.content.get("quizzes", input.id);
	if (!quizItem) {
		throw PluginRouteError.notFound("Quiz not found");
	}

	const questionsResult = await ctx.content.list("questions", {
		where: { fieldFilters: { quiz_id: input.id } },
		limit: 100,
	});

	const questions = questionsResult.items
		.map((item) => {
			const data = item.data as Record<string, unknown>;
			return {
				id: item.id,
				...data,
			};
		})
		.toSorted(
			(a, b) =>
				(Number((a as Record<string, unknown>).sort_order) || 0) -
				(Number((b as Record<string, unknown>).sort_order) || 0),
		);

	const quizData = quizItem.data as Record<string, unknown>;
	return {
		quiz: {
			id: quizItem.id,
			...quizData,
		},
		questions,
	};
}

// =============================================================================
// Admin Quiz Save (Create or Update)
// =============================================================================

export const adminQuizSaveInputSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, "Tiêu đề quiz là bắt buộc"),
	lesson_id: z.string().min(1, "Bài học đính kèm là bắt buộc"),
	description: z.string().optional(),
	passmark: z.number().min(0).max(100).optional().default(70),
	pass_required: z.boolean().optional().default(false),
	timer_minutes: z.number().min(0).optional(),
	allow_reset: z.boolean().optional().default(true),
	random_order: z.boolean().optional().default(false),
	grade_type: z.enum(["auto", "manual"]).optional().default("auto"),
	status: z.enum(["published", "draft"]).optional().default("published"),
});

export type AdminQuizSaveInput = z.infer<typeof adminQuizSaveInputSchema>;

export async function adminQuizSaveRoute(ctx: RouteContext) {
	if (!ctx.content?.create || !ctx.content?.update) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const input = (ctx.input || {}) as AdminQuizSaveInput;
	const { id, ...data } = input;

	if (id) {
		const existing = await ctx.content.get("quizzes", id);
		if (!existing) {
			throw PluginRouteError.notFound("Quiz not found");
		}
		const updated = await ctx.content.update("quizzes", id, data);
		return {
			id: updated.id,
			...updated.data,
		};
	}

	const created = await ctx.content.create("quizzes", data);
	return {
		id: created.id,
		...created.data,
	};
}

// =============================================================================
// Admin Quiz Delete
// =============================================================================

export const adminQuizDeleteInputSchema = z.object({
	id: z.string().min(1),
});

export type AdminQuizDeleteInput = z.infer<typeof adminQuizDeleteInputSchema>;

export async function adminQuizDeleteRoute(ctx: RouteContext) {
	if (!ctx.content?.delete) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const input = (ctx.input || {}) as AdminQuizDeleteInput;
	const quizItem = await ctx.content.get("quizzes", input.id);
	if (!quizItem) {
		throw PluginRouteError.notFound("Quiz not found");
	}

	// Delete associated questions
	const questionsResult = await ctx.content.list("questions", {
		where: { fieldFilters: { quiz_id: input.id } },
		limit: 100,
	});

	for (const q of questionsResult.items) {
		await ctx.content.delete("questions", q.id).catch(() => {});
	}

	await ctx.content.delete("quizzes", input.id);
	return { success: true };
}

// =============================================================================
// Admin Question Save (Create or Update)
// =============================================================================

export const adminQuestionSaveInputSchema = z.object({
	id: z.string().optional(),
	quiz_id: z.string().min(1, "Quiz ID là bắt buộc"),
	question: z.string().min(1, "Nội dung câu hỏi là bắt buộc"),
	question_image: z.string().optional(),
	type: z.enum(["single", "multiple", "text", "fill_blank", "chess"]),
	answers: z.unknown(),
	grade: z.number().min(0).optional().default(1),
	sort_order: z.number().optional().default(0),
	explanation: z.string().optional(),
	random_order: z.boolean().optional().default(false),
});

export type AdminQuestionSaveInput = z.infer<typeof adminQuestionSaveInputSchema>;

export async function adminQuestionSaveRoute(ctx: RouteContext) {
	if (!ctx.content?.create || !ctx.content?.update) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const input = (ctx.input || {}) as AdminQuestionSaveInput;
	const { id, ...data } = input;

	if (id) {
		const existing = await ctx.content.get("questions", id);
		if (!existing) {
			throw PluginRouteError.notFound("Question not found");
		}
		const updated = await ctx.content.update("questions", id, data);
		return {
			id: updated.id,
			...updated.data,
		};
	}

	const created = await ctx.content.create("questions", data);
	return {
		id: created.id,
		...created.data,
	};
}

// =============================================================================
// Admin Question Delete
// =============================================================================

export const adminQuestionDeleteInputSchema = z.object({
	id: z.string().min(1),
});

export type AdminQuestionDeleteInput = z.infer<typeof adminQuestionDeleteInputSchema>;

export async function adminQuestionDeleteRoute(ctx: RouteContext) {
	if (!ctx.content?.delete) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const input = (ctx.input || {}) as AdminQuestionDeleteInput;
	const questionItem = await ctx.content.get("questions", input.id);
	if (!questionItem) {
		throw PluginRouteError.notFound("Question not found");
	}

	await ctx.content.delete("questions", input.id);
	return { success: true };
}

// =============================================================================
// Admin Question Reorder
// =============================================================================

export const adminQuestionReorderInputSchema = z.object({
	questionIds: z.array(z.string().min(1)),
});

export type AdminQuestionReorderInput = z.infer<typeof adminQuestionReorderInputSchema>;

export async function adminQuestionReorderRoute(ctx: RouteContext) {
	if (!ctx.content?.update) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const input = (ctx.input || {}) as AdminQuestionReorderInput;

	await Promise.all(
		input.questionIds.map((id, index) =>
			ctx.content!.update!("questions", id, { sort_order: index }),
		),
	);

	return { success: true };
}

// =============================================================================
// Admin Quiz Options (For Block Kit Select)
// =============================================================================

export const adminQuizOptionsInputSchema = z.object({
	search: z.string().optional(),
	limit: z.number().optional().default(50),
});

export type AdminQuizOptionsInput = z.infer<typeof adminQuizOptionsInputSchema>;

export async function adminQuizOptionsRoute(ctx: RouteContext) {
	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	const result = await ctx.content.list("quizzes", {
		orderBy: { created_at: "desc" },
		limit: 100,
	});

	return {
		items: result.items.map((item) => {
			const data = item.data as Record<string, unknown>;
			return {
				id: item.id,
				name: `${data.title || "Quiz"} (${item.id})`,
			};
		}),
	};
}
