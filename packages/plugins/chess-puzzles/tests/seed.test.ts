import { describe, expect, it } from "vitest";

import { puzzlesSeedHandler } from "../src/handlers/seed.js";

describe("Chess Puzzles Seed Handler", () => {
	it("seeds 18 puzzles with 6 levels idempotently (3 per level)", async () => {
		const store = new Map<string, Record<string, unknown>>();

		const mockContent = {
			list: async (_collection: string) => {
				return {
					items: Array.from(store.values()).map((p) => ({
						id: p.id as string,
						data: p,
					})),
				};
			},
			create: async (_collection: string, data: Record<string, unknown>) => {
				const slug = data.slug as string;
				const entry = { id: `puzzle-${slug}`, ...data };
				store.set(slug, entry);
				return entry;
			},
		};

		const ctx = {
			content: mockContent,
			user: { id: "user-admin-1", role: "admin" },
		} as any;

		// Lần 1: Tạo mới 18 câu đố
		const res1 = await puzzlesSeedHandler(ctx);
		expect(res1.success).toBe(true);
		expect(res1.createdCount).toBe(18);
		expect(res1.skippedCount).toBe(0);
		expect(res1.created).toHaveLength(18);

		// Kiểm tra phân bổ đủ 6 cấp độ
		const levels = Array.from(store.values()).map((p) => p.level);
		expect(levels.filter((l) => l === "tot")).toHaveLength(3);
		expect(levels.filter((l) => l === "ma")).toHaveLength(3);
		expect(levels.filter((l) => l === "tuong")).toHaveLength(3);
		expect(levels.filter((l) => l === "xe")).toHaveLength(3);
		expect(levels.filter((l) => l === "hau")).toHaveLength(3);
		expect(levels.filter((l) => l === "vua")).toHaveLength(3);

		// Lần 2: Chạy lại phải giữ nguyên và bỏ qua
		const res2 = await puzzlesSeedHandler(ctx);
		expect(res2.success).toBe(true);
		expect(res2.createdCount).toBe(0);
		expect(res2.skippedCount).toBe(18);
	});
});
