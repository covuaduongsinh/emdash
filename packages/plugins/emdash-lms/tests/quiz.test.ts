/**
 * Quiz & Chess Question Test Suite (Phase 3)
 */

import type { RouteContext } from "emdash";
import { describe, expect, it, vi } from "vitest";

import { createPlugin } from "../src/index.js";
import {
	adminQuestionDeleteRoute,
	adminQuestionReorderRoute,
	adminQuestionSaveRoute,
	adminQuizDeleteRoute,
	adminQuizListRoute,
	adminQuizOptionsRoute,
	adminQuizSaveRoute,
} from "../src/routes/admin-quiz.js";
import { quizPresentRoute } from "../src/routes/quiz-present.js";
import { meQuizSubmitRoute, quizSubmitRoute } from "../src/routes/quiz-submit.js";
import { LMS_COLLECTIONS } from "../src/schema/definitions.js";

function createMockContent(initialData: Record<string, any[]> = {}) {
	const db: Record<string, Map<string, any>> = {
		quizzes: new Map(),
		questions: new Map(),
		quiz_submissions: new Map(),
		lessons: new Map(),
		courses: new Map(),
	};

	for (const [col, items] of Object.entries(initialData)) {
		if (!db[col]) db[col] = new Map();
		for (const item of items) {
			db[col].set(item.id, item);
		}
	}

	return {
		get: vi.fn(async (col: string, id: string) => {
			const item = db[col]?.get(id);
			return item ? { id: item.id, data: { ...item } } : null;
		}),
		list: vi.fn(async (col: string, options?: any) => {
			const items = [...(db[col]?.values() || [])];
			let filtered = items;
			if (options?.where?.fieldFilters) {
				filtered = items.filter((item) => {
					for (const [k, v] of Object.entries(options.where.fieldFilters)) {
						if (item[k] !== v && item.data?.[k] !== v) {
							return false;
						}
					}
					return true;
				});
			}
			return {
				items: filtered.map((item) => ({ id: item.id, data: { ...item } })),
				nextCursor: undefined,
			};
		}),
		create: vi.fn(async (col: string, data: any) => {
			const id = `rec_${Math.random().toString(36).slice(2, 9)}`;
			const record = { id, ...data };
			if (!db[col]) db[col] = new Map();
			db[col].set(id, record);
			return { id, data: record };
		}),
		update: vi.fn(async (col: string, id: string, data: any) => {
			const existing = db[col]?.get(id);
			if (!existing) throw new Error(`Not found in ${col}: ${id}`);
			const updated = { ...existing, ...data };
			db[col].set(id, updated);
			return { id, data: updated };
		}),
		delete: vi.fn(async (col: string, id: string) => {
			if (!db[col]) return false;
			return db[col].delete(id);
		}),
		_db: db,
	};
}

describe("Phase 3: Quiz & Chess Question Suite", () => {
	describe("1. Schema Definition", () => {
		it("includes 'chess' option in questions.type validation options", () => {
			const questionsCol = LMS_COLLECTIONS.find((c) => c.slug === "questions");
			expect(questionsCol).toBeDefined();

			const typeField = questionsCol?.fields.find((f) => f.slug === "type");
			expect(typeField).toBeDefined();
			expect(typeField?.type).toBe("select");
			expect(typeField?.validation?.options).toContain("chess");
			expect(typeField?.validation?.options).toEqual([
				"single",
				"multiple",
				"text",
				"fill_blank",
				"chess",
			]);
		});
	});

	describe("2. Admin Quiz & Question CRUD Routes", () => {
		it("admin lists quizzes with question counts", async () => {
			const content = createMockContent({
				quizzes: [
					{ id: "quiz_1", title: "Kiểm tra Khai cuộc", passmark: 80, lesson_id: "les_1" },
					{ id: "quiz_2", title: "Chiến thuật Tốt", passmark: 70, lesson_id: "les_2" },
				],
				questions: [
					{ id: "q1", quiz_id: "quiz_1", question: "Câu 1", type: "single" },
					{ id: "q2", quiz_id: "quiz_1", question: "Câu 2", type: "chess" },
					{ id: "q3", quiz_id: "quiz_2", question: "Câu 1", type: "text" },
				],
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				input: {},
			};

			const res = await adminQuizListRoute(ctx as RouteContext);
			expect(res.items.length).toBe(2);
			const q1 = res.items.find((item) => item.id === "quiz_1");
			expect(q1?.questionCount).toBe(2);
			const q2 = res.items.find((item) => item.id === "quiz_2");
			expect(q2?.questionCount).toBe(1);
		});

		it("admin creates and updates a quiz", async () => {
			const content = createMockContent();
			const ctx: Partial<RouteContext> = {
				content: content as any,
				input: {
					title: "Quiz Chiếu Hết Hàng Cuối",
					lesson_id: "les_backrank",
					passmark: 80,
					timer_minutes: 10,
					allow_reset: true,
				},
			};

			const created = await adminQuizSaveRoute(ctx as RouteContext);
			expect(created.id).toBeDefined();
			expect(created.title).toBe("Quiz Chiếu Hết Hàng Cuối");
			expect(created.passmark).toBe(80);

			// Update quiz
			ctx.input = {
				id: created.id,
				title: "Quiz Chiếu Hết Hàng Cuối (Đã sửa)",
				lesson_id: "les_backrank",
				passmark: 90,
			};
			const updated = await adminQuizSaveRoute(ctx as RouteContext);
			expect(updated.id).toBe(created.id);
			expect(updated.title).toBe("Quiz Chiếu Hết Hàng Cuối (Đã sửa)");
			expect(updated.passmark).toBe(90);
		});

		it("admin deletes a quiz and its cascading questions", async () => {
			const content = createMockContent({
				quizzes: [{ id: "quiz_del", title: "Quiz to delete", lesson_id: "les_del" }],
				questions: [
					{ id: "q_del_1", quiz_id: "quiz_del", question: "Q1" },
					{ id: "q_del_2", quiz_id: "quiz_del", question: "Q2" },
				],
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				input: { id: "quiz_del" },
			};

			const res = await adminQuizDeleteRoute(ctx as RouteContext);
			expect(res).toEqual({ success: true });
			expect(content._db.quizzes.has("quiz_del")).toBe(false);
			expect(content._db.questions.has("q_del_1")).toBe(false);
			expect(content._db.questions.has("q_del_2")).toBe(false);
		});

		it("admin saves, reorders, and deletes questions", async () => {
			const content = createMockContent({
				quizzes: [{ id: "quiz_q", title: "Quiz Q", lesson_id: "les_1" }],
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				input: {
					quiz_id: "quiz_q",
					question: "Trắng đi và chiếu hết sau 1 nước",
					type: "chess",
					answers: {
						fen: "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1",
						solution: ["a1a8"],
						orientation: "white",
						prompt: "Nước cờ nào chiếu hết ngay lập tức?",
					},
					grade: 2,
					sort_order: 0,
				},
			};

			const qCreated = await adminQuestionSaveRoute(ctx as RouteContext);
			expect(qCreated.id).toBeDefined();
			expect(qCreated.type).toBe("chess");
			expect(qCreated.grade).toBe(2);

			// Reorder
			ctx.input = {
				questionIds: [qCreated.id],
			};
			const reorderRes = await adminQuestionReorderRoute(ctx as RouteContext);
			expect(reorderRes).toEqual({ success: true });

			// Delete
			ctx.input = { id: qCreated.id };
			const delRes = await adminQuestionDeleteRoute(ctx as RouteContext);
			expect(delRes).toEqual({ success: true });
			expect(content._db.questions.has(qCreated.id)).toBe(false);
		});

		it("provides admin options for Block Kit select", async () => {
			const content = createMockContent({
				quizzes: [
					{ id: "qz_1", title: "Khai cuộc cơ bản" },
					{ id: "qz_2", title: "Đòn Ghim quân" },
				],
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				input: {},
			};

			const res = await adminQuizOptionsRoute(ctx as RouteContext);
			expect(res.items.length).toBe(2);
			expect(res.items[0]).toEqual({
				id: "qz_1",
				name: "Khai cuộc cơ bản (qz_1)",
			});
		});
	});

	describe("3. Public Quiz Presentation (quiz/present)", () => {
		it("presents quiz and strips solutions, correct answers, and explanations", async () => {
			const content = createMockContent({
				quizzes: [
					{
						id: "quiz_sample",
						title: "Kiểm tra tổng hợp",
						description: "Bài kiểm tra 3 câu hỏi",
						passmark: 70,
						timer_minutes: 15,
						allow_reset: true,
						random_order: false,
					},
				],
				questions: [
					{
						id: "q_single",
						quiz_id: "quiz_sample",
						question: "Quân Mã đi như thế nào?",
						type: "single",
						answers: [
							{ id: "opt_1", text: "Đi thẳng", is_correct: false },
							{ id: "opt_2", text: "Đi hình chữ L", is_correct: true },
						],
						explanation: "Mã đi theo hình chữ L 2 ô rồi 1 ô.",
						grade: 1,
						sort_order: 0,
					},
					{
						id: "q_text",
						quiz_id: "quiz_sample",
						question: "Tên đại kiện tướng cờ vua đầu tiên của Việt Nam là gì?",
						type: "text",
						answers: "Đào Thiên Hải",
						explanation: "ĐKT Đào Thiên Hải đạt danh hiệu năm 1995.",
						grade: 1,
						sort_order: 1,
					},
					{
						id: "q_chess",
						quiz_id: "quiz_sample",
						question: "Trắng đi và chiếu hết sau 1 nước",
						type: "chess",
						answers: {
							fen: "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1",
							solution: ["a1a8"],
							orientation: "white",
							prompt: "Tìm nước đi quyết định",
						},
						explanation: "Xe a1 lên a8 chiếu hết hàng ngang số 8.",
						grade: 2,
						sort_order: 2,
					},
				],
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				input: { quizId: "quiz_sample" },
			};

			const presented = await quizPresentRoute(ctx as RouteContext);

			expect(presented.id).toBe("quiz_sample");
			expect(presented.title).toBe("Kiểm tra tổng hợp");
			expect(presented.questionCount).toBe(3);
			expect(presented.passmark).toBe(70);
			expect(presented.timer_minutes).toBe(15);

			// Check question 1 (Single)
			const q1 = presented.questions.find((q) => q.id === "q_single");
			expect(q1).toBeDefined();
			expect((q1 as any).explanation).toBeUndefined(); // Explanation stripped
			expect(Array.isArray(q1?.answers)).toBe(true);
			const answers = (q1?.answers || []) as any[];
			for (const opt of answers) {
				expect(opt.is_correct).toBeUndefined(); // is_correct stripped!
				expect(opt.text).toBeDefined();
				expect(opt.id).toBeDefined();
			}

			// Check question 2 (Text)
			const q2 = presented.questions.find((q) => q.id === "q_text");
			expect(q2).toBeDefined();
			expect(q2?.answers).toBeNull(); // Correct text answer stripped!
			expect((q2 as any).explanation).toBeUndefined();

			// Check question 3 (Chess)
			const q3 = presented.questions.find((q) => q.id === "q_chess");
			expect(q3).toBeDefined();
			const chessAns = q3?.answers as any;
			expect(chessAns.fen).toBe("6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1");
			expect(chessAns.orientation).toBe("white");
			expect(chessAns.prompt).toBe("Tìm nước đi quyết định");
			expect(chessAns.solution).toBeUndefined(); // CRITICAL: Solution stripped!
			expect((q3 as any).explanation).toBeUndefined();
		});
	});

	describe("4. Quiz Submission & Server-side Grading (Guest & Authenticated)", () => {
		const quizData = {
			id: "quiz_exam",
			title: "Bài thi Chiến thuật Cờ vua",
			passmark: 75,
			timer_minutes: 5,
			allow_reset: true,
			lesson_id: "les_101",
		};

		const questionsData = [
			{
				id: "q_single",
				quiz_id: "quiz_exam",
				question: "Quân Xe đi như thế nào?",
				type: "single",
				answers: [
					{ id: "ans_s1", text: "Đi chéo", is_correct: false },
					{ id: "ans_s2", text: "Đi ngang và dọc", is_correct: true },
				],
				explanation: "Xe đi ngang và dọc tùy ý số ô.",
				grade: 1,
			},
			{
				id: "q_multi",
				quiz_id: "quiz_exam",
				question: "Những quân nào có thể đi chéo?",
				type: "multiple",
				answers: [
					{ id: "ans_m1", text: "Tượng", is_correct: true },
					{ id: "ans_m2", text: "Hậu", is_correct: true },
					{ id: "ans_m3", text: "Xe", is_correct: false },
				],
				explanation: "Cả Tượng và Hậu đều có thể đi chéo.",
				grade: 1,
			},
			{
				id: "q_text",
				quiz_id: "quiz_exam",
				question: "Nước đi đầu tiên phổ biến nhất của Trắng?",
				type: "text",
				answers: "e4",
				explanation: "1.e4 là nước đi vua mở cờ phổ biến nhất.",
				grade: 1,
			},
			{
				id: "q_chess",
				quiz_id: "quiz_exam",
				question: "Trắng đi và chiếu hết sau 1 nước",
				type: "chess",
				answers: {
					fen: "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1",
					solution: ["a1a8"],
				},
				explanation: "Xe a1 lên a8 chiếu hết.",
				grade: 1,
			},
		];

		it("grades guest quiz submission accurately across all question types (quiz/submit)", async () => {
			const content = createMockContent({
				quizzes: [quizData],
				questions: questionsData,
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				input: {
					quizId: "quiz_exam",
					answers: [
						{ questionId: "q_single", selectedAnswerIds: ["ans_s2"] }, // Correct
						{ questionId: "q_multi", selectedAnswerIds: ["ans_m1", "ans_m2"] }, // Correct
						{ questionId: "q_text", textAnswer: "  E4  " }, // Correct (case & trim normalized)
						{ questionId: "q_chess", playedUci: ["a1a8"] }, // Correct
					],
				},
			};

			const res = await quizSubmitRoute(ctx as RouteContext);

			expect(res.score).toBe(4);
			expect(res.maxScore).toBe(4);
			expect(res.percentage).toBe(100);
			expect(res.passed).toBe(true);
			expect(res.details.length).toBe(4);
			expect(res.details.every((d) => d.isCorrect)).toBe(true);

			// Guest submission does not write to DB
			expect(content._db.quiz_submissions.size).toBe(0);
		});

		it("correctly fails submission when chess move or choices are wrong", async () => {
			const content = createMockContent({
				quizzes: [quizData],
				questions: questionsData,
			});

			const ctx: Partial<RouteContext> = {
				content: content as any,
				input: {
					quizId: "quiz_exam",
					answers: [
						{ questionId: "q_single", selectedAnswerIds: ["ans_s1"] }, // Wrong
						{ questionId: "q_multi", selectedAnswerIds: ["ans_m1"] }, // Incomplete (Missing ans_m2)
						{ questionId: "q_text", textAnswer: "d4" }, // Wrong
						{ questionId: "q_chess", playedUci: ["e1e2"] }, // Wrong chess move
					],
				},
			};

			const res = await quizSubmitRoute(ctx as RouteContext);

			expect(res.score).toBe(0);
			expect(res.maxScore).toBe(4);
			expect(res.percentage).toBe(0);
			expect(res.passed).toBe(false);
			expect(res.details.every((d) => !d.isCorrect)).toBe(true);
		});

		it("fails submission and gives 0 points when timer has expired", async () => {
			const content = createMockContent({
				quizzes: [quizData], // 5 minutes timer
				questions: questionsData,
			});

			// Started 10 minutes ago
			const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

			const ctx: Partial<RouteContext> = {
				content: content as any,
				input: {
					quizId: "quiz_exam",
					startedAt: tenMinutesAgo,
					answers: [
						{ questionId: "q_single", selectedAnswerIds: ["ans_s2"] },
						{ questionId: "q_multi", selectedAnswerIds: ["ans_m1", "ans_m2"] },
						{ questionId: "q_text", textAnswer: "e4" },
						{ questionId: "q_chess", playedUci: ["a1a8"] },
					],
				},
			};

			const res = await quizSubmitRoute(ctx as RouteContext);

			expect(res.score).toBe(0);
			expect(res.passed).toBe(false);
			expect(res.details[0].reason).toContain("Hết thời gian");
		});

		it("saves quiz_submission record for authenticated students (me/quiz/submit)", async () => {
			const content = createMockContent({
				quizzes: [quizData],
				questions: questionsData,
			});

			const ctx: Partial<RouteContext> = {
				user: {
					id: "usr_student_chess",
					email: "student@dsc.edu.vn",
					role: 1,
					name: "Student",
					createdAt: new Date(),
				},
				content: content as any,
				input: {
					quizId: "quiz_exam",
					lessonId: "les_101",
					courseId: "crs_chess_tactics",
					answers: [
						{ questionId: "q_single", selectedAnswerIds: ["ans_s2"] },
						{ questionId: "q_multi", selectedAnswerIds: ["ans_m1", "ans_m2"] },
						{ questionId: "q_text", textAnswer: "e4" },
						{ questionId: "q_chess", playedUci: ["a1a8"] },
					],
				},
			};

			const res = await meQuizSubmitRoute(ctx as RouteContext);

			expect(res.passed).toBe(true);
			expect(res.score).toBe(4);

			// Check DB record
			const submissions = [...content._db.quiz_submissions.values()];
			expect(submissions.length).toBe(1);
			expect(submissions[0].user_id).toBe("usr_student_chess");
			expect(submissions[0].quiz_id).toBe("quiz_exam");
			expect(submissions[0].lesson_id).toBe("les_101");
			expect(submissions[0].passed).toBe(true);
			expect(submissions[0].score).toBe(4);
		});

		it("rejects retry submission when allow_reset is false", async () => {
			const noResetQuiz = {
				...quizData,
				id: "quiz_no_reset",
				allow_reset: false,
			};

			const content = createMockContent({
				quizzes: [noResetQuiz],
				questions: questionsData,
				quiz_submissions: [
					{
						id: "sub_prev",
						user_id: "usr_locked_student",
						quiz_id: "quiz_no_reset",
						passed: true,
						score: 4,
					},
				],
			});

			const ctx: Partial<RouteContext> = {
				user: {
					id: "usr_locked_student",
					email: "locked@dsc.edu.vn",
					role: 1,
					name: "Student",
					createdAt: new Date(),
				},
				content: content as any,
				input: {
					quizId: "quiz_no_reset",
					answers: [],
				},
			};

			await expect(meQuizSubmitRoute(ctx as RouteContext)).rejects.toMatchObject({
				status: 400,
				code: "BAD_REQUEST",
			});
		});
	});

	describe("5. Plugin Route Registration", () => {
		it("registers all quiz routes and portable text blocks in createPlugin()", () => {
			const plugin = createPlugin();
			const routes = (plugin as any).routes;

			expect(routes["admin/quiz/list"]).toBeDefined();
			expect(routes["admin/quiz/get"]).toBeDefined();
			expect(routes["admin/quiz/save"]).toBeDefined();
			expect(routes["admin/quiz/delete"]).toBeDefined();
			expect(routes["admin/question/save"]).toBeDefined();
			expect(routes["admin/question/delete"]).toBeDefined();
			expect(routes["admin/question/reorder"]).toBeDefined();
			expect(routes["admin/quiz/options"]).toBeDefined();
			expect(routes["quiz/present"]).toBeDefined();
			expect(routes["quiz/present"].public).toBe(true);
			expect(routes["quiz/submit"]).toBeDefined();
			expect(routes["quiz/submit"].public).toBe(true);
			expect(routes["me/quiz/submit"]).toBeDefined();

			const ptBlocks = (plugin as any).admin.portableTextBlocks;
			expect(ptBlocks).toBeDefined();
			const quizBlock = ptBlocks.find((b: any) => b.type === "lms-quiz");
			expect(quizBlock).toBeDefined();
			expect(quizBlock.fields[0].optionsRoute).toBe("admin/quiz/options");
		});
	});
});
