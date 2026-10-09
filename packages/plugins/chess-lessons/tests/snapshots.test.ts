import { describe, expect, it, vi } from "vitest";

import { snapshotLectureNode, traverseAndSnapshot } from "../src/handlers/snapshots.js";

describe("Chess Lecture Snapshots", () => {
	it("tự động snapshot các bước bài giảng và LOẠI BỎ HOÀN TOÀN teacherNotes", async () => {
		const mockLectureRecord = {
			id: "lec_123",
			data: {
				title: "Khai Cuộc Ý Cơ Bản",
				summary: "Bài giảng 5 bước kinh điển",
				level: "ma",
				script: {
					steps: [
						{
							id: "step_1",
							title: "Bước 1",
							fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
							arrows: "e2e4",
							narration: "Trắng mở đầu với e4.",
							teacherNotes: "GHI CHÚ BẢO MẬT: Nhắc học sinh chiếm trung tâm.",
							orientation: "white",
						},
						{
							id: "step_2",
							title: "Bước 2",
							fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
							arrows: "e7e5",
							narration: "Đen đáp trả e5.",
							teacherNotes: "GHI CHÚ BẢO MẬT: Nhắc học sinh cẩn thận.",
							orientation: "white",
						},
					],
				},
			},
		};

		const mockCtx = {
			content: {
				get: vi.fn(async (_col: string, id: string) => {
					if (id === "lec_123") return mockLectureRecord;
					return null;
				}),
			} as any,
			log: {
				warn: vi.fn(),
				debug: vi.fn(),
				info: vi.fn(),
				error: vi.fn(),
			} as any,
		};

		const blockNode: Record<string, unknown> = {
			_type: "chess-lecture",
			_key: "block_key_1",
			lecture: "lec_123",
		};

		const success = await snapshotLectureNode(blockNode, mockCtx);

		expect(success).toBe(true);
		expect(blockNode.title).toBe("Khai Cuộc Ý Cơ Bản");
		expect(blockNode.summary).toBe("Bài giảng 5 bước kinh điển");
		expect(blockNode.level).toBe("ma");

		const steps = blockNode.steps as any[];
		expect(steps).toBeDefined();
		expect(steps.length).toBe(2);

		// KIỂM CHỨNG BẢO MẬT: teacherNotes phải bị xóa khỏi tất cả các bước
		for (const step of steps) {
			expect(step.teacherNotes).toBeUndefined();
			expect("teacherNotes" in step).toBe(false);
			expect(step.narration).toBeDefined();
			expect(step.fen).toBeDefined();
		}
	});

	it("duyệt đệ quy cây Portable Text phức tạp và snapshot tất cả các khối bài giảng", async () => {
		const mockCtx = {
			content: {
				get: vi.fn(async () => ({
					id: "lec_abc",
					data: {
						title: "Bài giảng mẫu",
						script: {
							steps: [
								{ fen: "8/8/8/8/8/8/8/8 w - - 0 1", narration: "Trống", teacherNotes: "Bí mật" },
							],
						},
					},
				})),
			} as any,
			log: {
				warn: vi.fn(),
				debug: vi.fn(),
				info: vi.fn(),
				error: vi.fn(),
			} as any,
		};

		const complexContent = [
			{
				_type: "block",
				style: "h2",
				children: [{ _type: "span", text: "Tiêu đề" }],
			},
			{
				_type: "chess-lecture",
				lecture: "lec_abc",
			},
			{
				_type: "nested-container",
				items: [
					{
						_type: "chess-lecture",
						lecture: "lec_abc",
					},
				],
			},
		];

		const count = await traverseAndSnapshot(complexContent, mockCtx);
		expect(count).toBe(2);
		expect((complexContent[1] as any).title).toBe("Bài giảng mẫu");
		expect((complexContent[2] as any).items[0].title).toBe("Bài giảng mẫu");
		expect((complexContent[1] as any).steps[0].teacherNotes).toBeUndefined();
	});
});
