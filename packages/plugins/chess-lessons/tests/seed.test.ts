import type { RouteContext } from "emdash";
import { describe, expect, it, vi } from "vitest";

import {
	seedCurriculumHandler,
	seedDemoDataHandler,
	seedSampleLessonHandler,
} from "../src/handlers/seed.js";

function createMockContentService() {
	const db = new Map<string, Map<string, any>>();

	const getCollectionStore = (col: string) => {
		if (!db.has(col)) db.set(col, new Map());
		return db.get(col)!;
	};

	return {
		list: vi.fn(async (col: string) => {
			const store = getCollectionStore(col);
			return {
				items: Array.from(store.values(), (data) => ({
					id: data.id,
					data,
				})),
				nextCursor: undefined,
			};
		}),
		get: vi.fn(async (col: string, id: string) => {
			const store = getCollectionStore(col);
			const data = store.get(id);
			if (!data) return null;
			return { id, data };
		}),
		create: vi.fn(async (col: string, data: any) => {
			const store = getCollectionStore(col);
			store.set(data.id, { ...data });
			return { id: data.id, data };
		}),
		update: vi.fn(async (col: string, id: string, data: any) => {
			const store = getCollectionStore(col);
			const existing = store.get(id) || {};
			const updated = { ...existing, ...data };
			store.set(id, updated);
			return { id, data: updated };
		}),
	};
}

describe("Chess Lessons Seed Handlers", () => {
	it("seedCurriculum tạo đủ 6 khóa học 6 cấp độ và idempotent khi chạy lần 2", async () => {
		const mockContent = createMockContentService();
		const ctx = { content: mockContent as any } as RouteContext;

		// Lần 1: Tạo mới 6 khóa
		const result1 = await seedCurriculumHandler(ctx);
		expect(result1.success).toBe(true);
		expect(result1.createdCourses.length).toBe(6);
		expect(result1.createdCourses).toEqual([
			"tot-nhap-mon",
			"ma-so-cap",
			"tuong-trung-cap",
			"xe-nang-cao",
			"hau-chuyen-sau",
			"vua-kien-tuong",
		]);

		// Lần 2: Chạy lại -> Bỏ qua toàn bộ 6 khóa đã có
		const result2 = await seedCurriculumHandler(ctx);
		expect(result2.success).toBe(true);
		expect(result2.createdCourses.length).toBe(0);
		expect(result2.skippedCourses.length).toBe(6);
	});

	it("seedSampleLesson tạo 1 bài học 5 bước chuẩn sư phạm", async () => {
		const mockContent = createMockContentService();
		const ctx = { content: mockContent as any } as RouteContext;

		const result = await seedSampleLessonHandler(ctx);
		expect(result.success).toBe(true);
		expect(result.title).toBe("Bài học mẫu: Đòn Tấn Công Đôi Của Quân Mã");
		expect(result.slug).toBe("don-tan-cong-doi-cua-quan-ma");

		const lesson = await mockContent.get("lessons", result.lessonId);
		expect(lesson?.data.content.length).toBeGreaterThanOrEqual(8);
		expect(lesson?.data.level).toBe("ma");
	});

	it("seedDemoData nạp trọn bộ dữ liệu demo và idempotent khi chạy nhiều lần", async () => {
		const mockContent = createMockContentService();
		const ctx = { content: mockContent as any } as RouteContext;

		const result1 = await seedDemoDataHandler(ctx);
		expect(result1.success).toBe(true);
		expect(result1.createdLessons.length).toBe(3);

		const result2 = await seedDemoDataHandler(ctx);
		expect(result2.success).toBe(true);

		// Kiểm tra số lượng khóa học không bị nhân đôi
		const courses = await mockContent.list("courses");
		expect(courses.items.length).toBe(1);

		// Kiểm tra 4 bài giảng mẫu không bị nhân đôi
		const lectures = await mockContent.list("chess_lectures");
		expect(lectures.items.length).toBe(4);
	});
});
