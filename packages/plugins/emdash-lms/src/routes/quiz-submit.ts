/**
 * Quiz Submit API Routes
 * Evaluates student quiz answers server-side with support for chess puzzles.
 * - `quiz/submit`: Public route for guest users (does not save to DB)
 * - `me/quiz/submit`: Authenticated route for logged-in students (saves to `quiz_submissions`)
 */

import { gradeChessAnswer } from "@duongsinh/chess-kit/core";
import { PluginRouteError, type RouteContext } from "emdash";
import { z } from "zod";

export const quizSubmitInputSchema = z.object({
	quizId: z.string().min(1, "Quiz ID là bắt buộc"),
	lessonId: z.string().optional(),
	courseId: z.string().optional(),
	startedAt: z.string().optional(),
	answers: z.array(
		z.object({
			questionId: z.string().min(1),
			selectedAnswerIds: z.array(z.string()).optional(),
			textAnswer: z.string().optional(),
			playedUci: z.array(z.string()).optional(),
		}),
	),
});

export type QuizSubmitInput = z.infer<typeof quizSubmitInputSchema>;

interface EvaluatedQuestionDetail {
	questionId: string;
	isCorrect: boolean;
	score: number;
	maxScore: number;
	explanation?: string;
	reason?: string;
}

interface EvaluationResult {
	quizId: string;
	score: number;
	maxScore: number;
	percentage: number;
	passed: boolean;
	timeSpentSeconds: number;
	submittedAt: string;
	details: EvaluatedQuestionDetail[];
}

function normalizeText(text: string): string {
	return text.trim().toLowerCase().replaceAll(/\s+/g, " ");
}

/**
 * Common evaluation engine for both guest and authenticated submissions
 */
async function evaluateQuizSubmission(
	ctx: RouteContext,
	input: QuizSubmitInput,
): Promise<{ quizData: Record<string, unknown>; result: EvaluationResult }> {
	if (!ctx.content) {
		throw PluginRouteError.internal("Content access not available");
	}

	const quizItem = await ctx.content.get("quizzes", input.quizId);
	if (!quizItem) {
		throw PluginRouteError.notFound("Quiz không tồn tại");
	}

	const quizData = quizItem.data as Record<string, unknown>;

	// Calculate time spent
	let elapsedSeconds = 0;
	let isTimedOut = false;

	if (input.startedAt) {
		const startTime = new Date(input.startedAt).getTime();
		if (!Number.isNaN(startTime)) {
			elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
			const timerMinutes = Number(quizData.timer_minutes) || 0;
			if (timerMinutes > 0) {
				// Allow 30 seconds network buffer
				const maxAllowedSeconds = timerMinutes * 60 + 30;
				if (elapsedSeconds > maxAllowedSeconds) {
					isTimedOut = true;
				}
			}
		}
	}

	// Fetch all questions for this quiz
	const questionsResult = await ctx.content.list("questions", {
		where: { fieldFilters: { quiz_id: quizItem.id } },
		limit: 100,
	});

	const submittedMap = new Map(input.answers.map((a) => [a.questionId, a]));
	const details: EvaluatedQuestionDetail[] = [];

	let totalScore = 0;
	let totalMaxScore = 0;

	for (const qItem of questionsResult.items) {
		const q = qItem.data as Record<string, unknown>;
		const qId = qItem.id;
		const qType = q.type as string;
		const maxScore = Number(q.grade) || 1;
		totalMaxScore += maxScore;

		const userAns = submittedMap.get(qId);
		let isCorrect = false;
		let reason: string | undefined;

		if (isTimedOut) {
			isCorrect = false;
			reason = "Hết thời gian làm bài";
		} else if (!userAns) {
			isCorrect = false;
			reason = "Chưa trả lời câu hỏi";
		} else if (qType === "single") {
			const answers = (Array.isArray(q.answers) ? q.answers : []) as Array<{
				id: string;
				is_correct?: boolean;
			}>;
			const correctOption = answers.find((a) => a.is_correct === true);
			const selectedId = userAns.selectedAnswerIds?.[0];
			isCorrect = !!correctOption && !!selectedId && correctOption.id === selectedId;
			if (!isCorrect) reason = "Đáp án lựa chọn chưa chính xác";
		} else if (qType === "multiple") {
			const answers = (Array.isArray(q.answers) ? q.answers : []) as Array<{
				id: string;
				is_correct?: boolean;
			}>;
			const correctIds = new Set(answers.filter((a) => a.is_correct === true).map((a) => a.id));
			const selectedIds = new Set(userAns.selectedAnswerIds || []);

			if (
				correctIds.size === selectedIds.size &&
				[...correctIds].every((id) => selectedIds.has(id))
			) {
				isCorrect = true;
			} else {
				isCorrect = false;
				reason = "Lựa chọn các đáp án đúng chưa đầy đủ hoặc có đáp án sai";
			}
		} else if (qType === "text" || qType === "fill_blank") {
			const rawAnswer = q.answers;
			const userText = normalizeText(userAns.textAnswer || "");

			if (typeof rawAnswer === "string") {
				isCorrect = normalizeText(rawAnswer) === userText;
			} else if (Array.isArray(rawAnswer)) {
				isCorrect = rawAnswer.some((ans) => {
					if (typeof ans === "string") return normalizeText(ans) === userText;
					if (typeof ans === "object" && ans && "text" in ans) {
						return normalizeText(String(ans.text)) === userText;
					}
					return false;
				});
			}
			if (!isCorrect) reason = "Câu trả lời chưa chính xác";
		} else if (qType === "chess") {
			const chessData = (q.answers || {}) as {
				fen?: string;
				solution?: string[];
			};
			const fen = chessData.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
			const solution = Array.isArray(chessData.solution) ? chessData.solution : [];

			const gradeResult = gradeChessAnswer({ fen, solution }, userAns.playedUci || []);
			isCorrect = gradeResult.correct;
			reason = gradeResult.reason;
		}

		const earnedScore = isCorrect ? maxScore : 0;
		totalScore += earnedScore;

		details.push({
			questionId: qId,
			isCorrect,
			score: earnedScore,
			maxScore,
			explanation: q.explanation as string | undefined,
			reason,
		});
	}

	const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 100;
	const passmark = typeof quizData.passmark === "number" ? quizData.passmark : 70;
	const passed = percentage >= passmark;

	const result: EvaluationResult = {
		quizId: quizItem.id,
		score: totalScore,
		maxScore: totalMaxScore,
		percentage,
		passed,
		timeSpentSeconds: elapsedSeconds,
		submittedAt: new Date().toISOString(),
		details,
	};

	return { quizData, result };
}

/**
 * Public Quiz Submission Route (Guests)
 */
export async function quizSubmitRoute(ctx: RouteContext) {
	const input = (ctx.input || {}) as QuizSubmitInput;
	const { result } = await evaluateQuizSubmission(ctx, input);
	return result;
}

/**
 * Authenticated Quiz Submission Route (Logged-in Students)
 */
export async function meQuizSubmitRoute(ctx: RouteContext) {
	const userId = ctx.user?.id;
	if (!userId) {
		throw PluginRouteError.unauthorized("Authentication required");
	}

	if (!ctx.content?.create) {
		throw PluginRouteError.forbidden("Content write access not available");
	}

	const input = (ctx.input || {}) as QuizSubmitInput;
	const { quizData, result } = await evaluateQuizSubmission(ctx, input);

	// Check allow_reset
	const allowReset = quizData.allow_reset !== false;
	if (!allowReset) {
		const existingSubmissions = await ctx.content.list("quiz_submissions", {
			where: { fieldFilters: { user_id: userId, quiz_id: input.quizId } },
			limit: 1,
		});

		if (existingSubmissions.items.length > 0) {
			throw PluginRouteError.badRequest("Quiz này không cho phép nộp bài lại");
		}
	}

	// Save to quiz_submissions
	await ctx.content.create("quiz_submissions", {
		user_id: userId,
		quiz_id: input.quizId,
		lesson_id: input.lessonId || (quizData.lesson_id as string) || "",
		course_id: input.courseId || "",
		score: result.score,
		max_score: result.maxScore,
		percentage: result.percentage,
		passed: result.passed,
		answers: result.details.map((d) => ({
			question_id: d.questionId,
			is_correct: d.isCorrect,
			score: d.score,
		})),
		started_at: input.startedAt || result.submittedAt,
		submitted_at: result.submittedAt,
		time_spent_seconds: result.timeSpentSeconds,
	});

	return result;
}
