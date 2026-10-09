import { describe, expect, it } from "vitest";

import { puzzlesSeedHandler } from "../src/handlers/seed.js";

describe("Chess Puzzles Seed Handler", () => {
	it("seeds 6 puzzles with 6 levels idempotently", async () => {
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

		// Lần 1: Tạo mới 6 câu đố
		const res1 = await puzzlesSeedHandler(ctx);
		expect(res1.success).toBe(true);
		expect(res1.createdCount).toBe(6);
		expect(res1.skippedCount).toBe(0);
		expect(res1.created).toHaveLength(6);

		// Kiểm tra 6 cấp độ
		const levels = Array.from(store.values()).map((p) => p.level);
		expect(levels).toEqual(["tot", "ma", "tuong", "xe", "hau", "vua"]);

		// Lần 2: Chạy lại phải giữ nguyên và bỏ qua
		const res2 = await puzzlesSeedHandler(ctx);
		expect(res2.success).toBe(true);
		expect(res2.createdCount).toBe(0);
		expect(res2.skippedCount).toBe(6);
	});
});
