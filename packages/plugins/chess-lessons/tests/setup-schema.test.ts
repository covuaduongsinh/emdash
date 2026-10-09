import type { CreateCollectionInput, CreateFieldInput, SchemaRegistry } from "emdash";
import { describe, expect, it, vi } from "vitest";

import {
	CHESS_LECTURES_COLLECTION,
	COURSE_EXTRA_FIELDS,
	LESSON_EXTRA_FIELDS,
} from "../src/schema/definitions.js";
import { runChessLessonsSetup } from "../src/schema/setup.js";

// Mock SchemaRegistry để kiểm thử độc lập
function createMockRegistry(
	initialCollections: Record<string, { id: string; slug: string }> = {},
	initialFields: Record<string, CreateFieldInput[]> = {},
	orphanedTables: { slug: string }[] = [],
) {
	const collections = new Map<string, { id: string; slug: string }>(
		Object.entries(initialCollections),
	);
	const fields = new Map<string, CreateFieldInput[]>();
	for (const [id, fList] of Object.entries(initialFields)) {
		fields.set(id, [...fList]);
	}

	return {
		discoverOrphanedTables: vi.fn(async () => orphanedTables),
		getCollection: vi.fn(async (slug: string) => collections.get(slug) || null),
		registerOrphanedTable: vi.fn(async (slug: string, def: any) => {
			const id = `col_${slug}`;
			const record = { id, slug, ...def };
			collections.set(slug, record);
			fields.set(id, []);
			return record;
		}),
		createCollection: vi.fn(async (def: CreateCollectionInput) => {
			const id = `col_${def.slug}`;
			const record = { id, ...def };
			collections.set(def.slug, record);
			fields.set(id, []);
			return record;
		}),
		listFields: vi.fn(async (collectionId: string) => fields.get(collectionId) || []),
		createField: vi.fn(async (collectionSlug: string, fieldDef: CreateFieldInput) => {
			const col = collections.get(collectionSlug);
			if (!col) throw new Error(`Collection not found: ${collectionSlug}`);
			const existing = fields.get(col.id) || [];
			existing.push(fieldDef);
			fields.set(col.id, existing);
			return fieldDef;
		}),
		updateField: vi.fn(async () => {}),
	} as unknown as SchemaRegistry;
}

describe("Chess Lessons Schema Setup", () => {
	it("báo lỗi nếu các collection LMS cơ sở chưa được cài đặt", async () => {
		const emptyRegistry = createMockRegistry();
		await expect(runChessLessonsSetup(emptyRegistry)).rejects.toThrow(
			"Các collection LMS cơ sở (courses, modules, lessons) chưa tồn tại",
		);
	});

	it("chạy cài đặt schema lần đầu: thêm field vào courses, lessons và tạo chess_lectures", async () => {
		const registry = createMockRegistry({
			courses: { id: "col_courses", slug: "courses" },
			modules: { id: "col_modules", slug: "modules" },
			lessons: { id: "col_lessons", slug: "lessons" },
		});

		const result = await runChessLessonsSetup(registry);

		expect(result.success).toBe(true);
		expect(result.collectionsCreated).toContain("chess_lectures");
		expect(result.fieldsAdded).toContain("courses.level");
		expect(result.fieldsAdded).toContain("courses.sessions");
		expect(result.fieldsAdded).toContain("courses.age_range");
		expect(result.fieldsAdded).toContain("lessons.level");
		expect(result.fieldsAdded).toContain("lessons.themes");
		expect(result.fieldsAdded).toContain("lessons.objectives");
		expect(result.fieldsAdded).toContain("chess_lectures.title");
		expect(result.fieldsAdded).toContain("chess_lectures.script");
	});

	it("chạy cài đặt lần 2 (idempotent): không tạo thêm hay trùng lặp dữ liệu", async () => {
		// Chuẩn bị registry đã có đầy đủ collection và field
		const registry = createMockRegistry(
			{
				courses: { id: "col_courses", slug: "courses" },
				modules: { id: "col_modules", slug: "modules" },
				lessons: { id: "col_lessons", slug: "lessons" },
				chess_lectures: { id: "col_chess_lectures", slug: "chess_lectures" },
			},
			{
				col_courses: COURSE_EXTRA_FIELDS,
				col_lessons: LESSON_EXTRA_FIELDS,
				col_chess_lectures: CHESS_LECTURES_COLLECTION.fields,
			},
		);

		const result = await runChessLessonsSetup(registry);

		expect(result.success).toBe(true);
		expect(result.collectionsCreated.length).toBe(0);
		expect(result.orphanedTablesRegistered.length).toBe(0);
		expect(result.fieldsAdded.length).toBe(0);
	});
});
