/**
 * Quiz Present API Route (Public)
 * Strips all correct answers/solutions before sending to client.
 */

import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

export const quizPresentInputSchema = z.object({
	quizId: z.string().min(1, "Quiz ID là bắt buộc"),
});

export type QuizPresentInput = z.infer<typeof quizPresentInputSchema>;

function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export async function quizPresentRoute(ctx: RouteContext) {
	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	const input = (ctx.input || {}) as QuizPresentInput;
	const quizItem = await ctx.content.get("quizzes", input.quizId);
	if (!quizItem) {
		throw PluginRouteError.notFound("Quiz không tồn tại");
	}

	const quizData = quizItem.data as Record<string, unknown>;

	// Fetch questions
	const questionsResult = await ctx.content.list("questions", {
		where: { fieldFilters: { quiz_id: quizItem.id } },
		limit: 100,
	});

	const questions = questionsResult.items
		.map((item) => {
			const data = (item.data || {}) as Record<string, unknown>;
			return {
				id: item.id,
				quiz_id: (data.quiz_id as string) || "",
				question: (data.question as string) || "",
				question_image: data.question_image as string | undefined,
				type: (data.type as string) || "single",
				answers: data.answers,
				grade: (data.grade as number) ?? 1,
				sort_order: (data.sort_order as number) ?? 0,
				random_order: Boolean(data.random_order),
			};
		})
		.toSorted((a, b) => a.sort_order - b.sort_order);

	// Strip solutions and answers from questions
	const strippedQuestions = questions.map((q) => {
		const type = q.type;
		let safeAnswers: unknown = null;

		if (type === "single" || type === "multiple") {
			const rawAnswers = (Array.isArray(q.answers) ? q.answers : []) as Array<
				Record<string, unknown>
			>;
			let strippedAnswers = rawAnswers.map((ans, idx) => ({
				id: String(ans.id || `ans-${idx}`),
				text: String(ans.text || ""),
				sort_order: Number(ans.sort_order) || idx,
			}));

			if (q.random_order) {
				strippedAnswers = shuffleArray(strippedAnswers);
			} else {
				strippedAnswers.sort((a, b) => a.sort_order - b.sort_order);
			}
			safeAnswers = strippedAnswers;
		} else if (type === "chess") {
			const chessAns = (q.answers || {}) as Record<string, unknown>;
			safeAnswers = {
				fen: chessAns.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
				orientation: chessAns.orientation || "white",
				prompt: chessAns.prompt || "",
				// TUYỆT ĐỐI KHÔNG trả về `solution`
			};
		} else {
			// text or fill_blank: KHÔNG trả về đáp án đúng
			safeAnswers = null;
		}

		return {
			id: q.id,
			quiz_id: q.quiz_id,
			question: q.question,
			question_image: q.question_image,
			type: q.type,
			answers: safeAnswers,
			grade: q.grade ?? 1,
			sort_order: q.sort_order ?? 0,
			// KHÔNG trả về explanation trước khi submit
		};
	});

	const finalQuestions = quizData.random_order
		? shuffleArray(strippedQuestions)
		: strippedQuestions;

	return {
		id: quizItem.id,
		title: quizData.title,
		description: quizData.description,
		passmark: quizData.passmark ?? 70,
		pass_required: quizData.pass_required ?? false,
		timer_minutes: quizData.timer_minutes,
		allow_reset: quizData.allow_reset ?? true,
		questionCount: finalQuestions.length,
		questions: finalQuestions,
	};
}
