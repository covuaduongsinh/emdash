import type { PluginContext, RouteContext } from "emdash";
import { describe, expect, it } from "vitest";

import { snapshotsRefreshHandler, traverseAndSnapshot } from "../src/handlers/snapshots.js";

describe("Chess Puzzles Snapshots", () => {
	it("snapshots puzzle metadata into portable text blocks from published records", async () => {
		const mockPuzzles = new Map<string, { id: string; data: Record<string, unknown> }>();
		mockPuzzles.set("puz-101", {
			id: "puz-101",
			data: {
				title: "Chiếu hết sau 1 nước",
				prompt: "Trắng đi trước và chiếu hết sau 1 nước",
				hint: "Chú ý đường chéo của Hậu",
				level: "tot",
				explanation: "Hậu f7 chiếu hết vì được Tượng c4 bảo vệ",
				puzzle: {
					fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5",
					solution: ["d1e2", "d7d5", "c4b5"],
					orientation: "white",
				},
			},
		});

		const mockContext = {
			content: {
				get: async (collection: string, id: string) => {
					if (collection === "chess_puzzles") {
						return mockPuzzles.get(id) || null;
					}
					return null;
				},
			},
			log: {
				warn: () => {},
			},
		} as unknown as PluginContext;

		const sampleContent = {
			title: "Bài 1: Làm quen với đòn phối hợp",
			body: [
				{
					_type: "block",
					children: [{ _type: "span", text: "Dưới đây là câu đố thực hành:" }],
				},
				{
					_type: "chess-puzzle",
					puzzle: "puz-101",
					// Chưa có snapshot FEN/solution
				},
			],
		};

		const updatedCount = await traverseAndSnapshot(sampleContent, mockContext);
		expect(updatedCount).toBe(1);

		const puzzleNode = sampleContent.body[1] as Record<string, unknown>;
		expect(puzzleNode.fen).toBe(
			"r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5",
		);
		expect(puzzleNode.solution).toEqual(["d1e2", "d7d5", "c4b5"]);
		expect(puzzleNode.prompt).toBe("Trắng đi trước và chiếu hết sau 1 nước");
		expect(puzzleNode.hint).toBe("Chú ý đường chéo của Hậu");
		expect(puzzleNode.level).toBe("tot");
		expect(puzzleNode.title).toBe("Chiếu hết sau 1 nước");
	});

	it("gracefully leaves block untouched if puzzle record is missing", async () => {
		const mockContext = {
			content: {
				get: async () => null,
			},
			log: {
				warn: () => {},
			},
		} as unknown as PluginContext;

		const sampleContent = {
			body: [
				{
					_type: "chess-puzzle",
					puzzle: "non-existent-id",
					fen: "original-fen",
				},
			],
		};

		const updatedCount = await traverseAndSnapshot(sampleContent, mockContext);
		expect(updatedCount).toBe(0);

		const puzzleNode = sampleContent.body[0] as Record<string, unknown>;
		expect(puzzleNode.fen).toBe("original-fen");
	});

	it("snapshots/refresh route updates lessons and posts with latest puzzle data", async () => {
		const mockPuzzles = new Map<string, { id: string; data: Record<string, unknown> }>();
		mockPuzzles.set("puz-202", {
			id: "puz-202",
			data: {
				title: "Đòn ghim quân",
				puzzle: {
					fen: "8/8/8/8/8/5K2/4R3/5k2 w - - 0 1",
					solution: ["e2e8", "f1g1", "e8e1"],
				},
				level: "tuong",
			},
		});

		const mockStore = new Map<string, Array<{ id: string; data: Record<string, unknown> }>>();
		mockStore.set("lessons", [
			{
				id: "les-1",
				data: {
					title: "Bài học 1",
					content: [
						{
							_type: "chess-puzzle",
							puzzle: "puz-202",
						},
					],
				},
			},
		]);

		const mockRouteContext = {
			content: {
				list: async (col: string) => ({ items: mockStore.get(col) || [] }),
				get: async (col: string, id: string) => {
					if (col === "chess_puzzles") return mockPuzzles.get(id) || null;
					return null;
				},
				update: async (col: string, id: string, item: { data: Record<string, unknown> }) => {
					const list = mockStore.get(col) || [];
					const found = list.find((i) => i.id === id);
					if (found) found.data = item.data;
				},
			},
			log: { warn: () => {} },
			input: { collections: ["lessons"] },
		} as unknown as RouteContext;

		const result = await snapshotsRefreshHandler(mockRouteContext);
		expect(result.success).toBe(true);
		expect(result.updatedCount).toBe(1);

		const updatedLesson = mockStore.get("lessons")?.[0];
		expect(updatedLesson).toBeDefined();
		if (!updatedLesson) throw new Error("Updated lesson missing");

		const puzzleBlock = (updatedLesson.data.content as Array<Record<string, unknown>>)?.[0];
		expect(puzzleBlock).toBeDefined();
		if (!puzzleBlock) throw new Error("Puzzle block missing");

		expect(puzzleBlock.fen).toBe("8/8/8/8/8/5K2/4R3/5k2 w - - 0 1");
		expect(puzzleBlock.level).toBe("tuong");
	});
});
