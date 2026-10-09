import { describe, expect, it } from "vitest";

import type { LectureStep } from "../src/types.js";

/**
 * Mô phỏng logic lọc dữ liệu Server-Side của LecturePresenter.astro
 */
function prepareLectureStepsForUser(
	rawSteps: LectureStep[],
	user?: { role?: string } | null,
): { steps: LectureStep[]; isTeacher: boolean } {
	const isTeacher =
		!!user && ["admin", "super_admin", "editor", "contributor"].includes(user.role || "");

	const steps = isTeacher
		? rawSteps
		: rawSteps.map((s) => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { teacherNotes, ...safeStep } = s;
				return safeStep as LectureStep;
			});

	return { steps, isTeacher };
}

describe("LecturePresenter Server-Side Access Control", () => {
	const sampleSteps: LectureStep[] = [
		{
			id: "step_1",
			title: "Khai cuộc",
			fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
			narration: "Nước mở đầu e4.",
			teacherNotes:
				"GHI CHÚ BÍ MẬT DÀNH CHO HUẤN LUYỆN VIÊN: Chú ý quan sát sự tập trung của học sinh.",
			orientation: "white",
		},
		{
			id: "step_2",
			title: "Chiến thuật",
			fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
			narration: "Nước e5.",
			teacherNotes: "GHI CHÚ SƯ PHẠM: Giải thích vì sao ô d4 quan trọng.",
			orientation: "white",
		},
	];

	it("loại bỏ triệt để teacherNotes khi người dùng là Khách ẩn danh (Guest)", () => {
		const result = prepareLectureStepsForUser(sampleSteps, null);
		expect(result.isTeacher).toBe(false);

		for (const step of result.steps) {
			expect(step.teacherNotes).toBeUndefined();
			expect("teacherNotes" in step).toBe(false);
		}

		// Kiểm tra chuỗi JSON không chứa bất kỳ từ khóa bí mật nào
		const serialized = JSON.stringify(result.steps);
		expect(serialized).not.toContain("GHI CHÚ BÍ MẬT DÀNH CHO HUẤN LUYỆN VIÊN");
		expect(serialized).not.toContain("GHI CHÚ SƯ PHẠM");
	});

	it("loại bỏ triệt để teacherNotes khi người dùng là Học viên (Subscriber)", () => {
		const subscriberUser = { role: "subscriber" };
		const result = prepareLectureStepsForUser(sampleSteps, subscriberUser);
		expect(result.isTeacher).toBe(false);

		for (const step of result.steps) {
			expect(step.teacherNotes).toBeUndefined();
			expect("teacherNotes" in step).toBe(false);
		}

		const serialized = JSON.stringify(result.steps);
		expect(serialized).not.toContain("GHI CHÚ BÍ MẬT DÀNH CHO HUẤN LUYỆN VIÊN");
	});

	it("giữ nguyên teacherNotes khi người dùng là Huấn Luyện Viên / Giáo viên (Contributor, Editor, Admin)", () => {
		const contributorUser = { role: "contributor" };
		const contributorResult = prepareLectureStepsForUser(sampleSteps, contributorUser);
		expect(contributorResult.isTeacher).toBe(true);
		expect(contributorResult.steps[0]?.teacherNotes).toBe(
			"GHI CHÚ BÍ MẬT DÀNH CHO HUẤN LUYỆN VIÊN: Chú ý quan sát sự tập trung của học sinh.",
		);

		const editorUser = { role: "editor" };
		const editorResult = prepareLectureStepsForUser(sampleSteps, editorUser);
		expect(editorResult.isTeacher).toBe(true);
		expect(editorResult.steps[0]?.teacherNotes).toBeDefined();

		const adminUser = { role: "admin" };
		const adminResult = prepareLectureStepsForUser(sampleSteps, adminUser);
		expect(adminResult.isTeacher).toBe(true);
		expect(adminResult.steps[0]?.teacherNotes).toBeDefined();
	});
});
