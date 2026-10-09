import type { SchemaRegistry } from "emdash";

import {
	CHESS_LECTURES_COLLECTION,
	COURSE_EXTRA_FIELDS,
	LESSON_EXTRA_FIELDS,
} from "./definitions.js";

export interface ChessLessonsSetupResult {
	success: boolean;
	orphanedTablesRegistered: string[];
	collectionsCreated: string[];
	fieldsAdded: string[];
	fieldsUpdated: string[];
}

/**
 * Cài đặt và đồng bộ cấu trúc bảng/collection cho Plugin chess-lessons (idempotent).
 */
export async function runChessLessonsSetup(
	registry: SchemaRegistry,
): Promise<ChessLessonsSetupResult> {
	// 1. Kiểm tra các collection LMS cơ sở đã tồn tại chưa
	const coursesCol = await registry.getCollection("courses");
	const modulesCol = await registry.getCollection("modules");
	const lessonsCol = await registry.getCollection("lessons");

	if (!coursesCol || !modulesCol || !lessonsCol) {
		throw new Error(
			"Các collection LMS cơ sở (courses, modules, lessons) chưa tồn tại. Vui lòng chạy LMS Setup trước khi cài đặt chess-lessons.",
		);
	}

	const orphaned = await registry.discoverOrphanedTables();
	const orphanedSet = new Set(orphaned.map((o) => o.slug));

	const orphanedTablesRegistered: string[] = [];
	const collectionsCreated: string[] = [];
	const fieldsAdded: string[] = [];
	const fieldsUpdated: string[] = [];

	// 2. Thêm các trường cờ vua vào collection `courses`
	const existingCourseFields = await registry.listFields(coursesCol.id);
	const existingCourseFieldMap = new Map(existingCourseFields.map((f) => [f.slug, f]));

	for (const fieldDef of COURSE_EXTRA_FIELDS) {
		const existing = existingCourseFieldMap.get(fieldDef.slug);
		if (!existing) {
			await registry.createField("courses", fieldDef);
			fieldsAdded.push(`courses.${fieldDef.slug}`);
		} else {
			const shouldUpdate =
				fieldDef.validation &&
				JSON.stringify(fieldDef.validation) !== JSON.stringify(existing.validation);
			if (shouldUpdate) {
				try {
					await registry.updateField("courses", fieldDef.slug, {
						type: fieldDef.type,
						validation: fieldDef.validation,
					});
					fieldsUpdated.push(`courses.${fieldDef.slug}`);
				} catch {
					// Bỏ qua lỗi cập nhật field nếu không cần thiết
				}
			}
		}
	}

	// 3. Thêm các trường cờ vua vào collection `lessons`
	const existingLessonFields = await registry.listFields(lessonsCol.id);
	const existingLessonFieldMap = new Map(existingLessonFields.map((f) => [f.slug, f]));

	for (const fieldDef of LESSON_EXTRA_FIELDS) {
		const existing = existingLessonFieldMap.get(fieldDef.slug);
		if (!existing) {
			await registry.createField("lessons", fieldDef);
			fieldsAdded.push(`lessons.${fieldDef.slug}`);
		} else {
			const shouldUpdate =
				fieldDef.validation &&
				JSON.stringify(fieldDef.validation) !== JSON.stringify(existing.validation);
			if (shouldUpdate) {
				try {
					await registry.updateField("lessons", fieldDef.slug, {
						type: fieldDef.type,
						validation: fieldDef.validation,
					});
					fieldsUpdated.push(`lessons.${fieldDef.slug}`);
				} catch {
					// Bỏ qua lỗi cập nhật field
				}
			}
		}
	}

	// 4. Tạo hoặc đăng ký collection `chess_lectures`
	const colDef = CHESS_LECTURES_COLLECTION;
	let lectureCol = await registry.getCollection(colDef.slug);

	if (!lectureCol) {
		if (orphanedSet.has(colDef.slug)) {
			lectureCol = await registry.registerOrphanedTable(colDef.slug, {
				label: colDef.label,
				labelSingular: colDef.labelSingular,
				description: colDef.description,
			});
			orphanedTablesRegistered.push(colDef.slug);
		} else {
			lectureCol = await registry.createCollection({
				slug: colDef.slug,
				label: colDef.label,
				labelSingular: colDef.labelSingular,
				description: colDef.description,
				icon: colDef.icon,
				supports: colDef.supports,
				sortOrder: colDef.sortOrder,
			});
			collectionsCreated.push(colDef.slug);
		}
	}

	// Đảm bảo tất cả các field của chess_lectures được tạo đầy đủ
	const existingLectureFields = await registry.listFields(lectureCol.id);
	const existingLectureFieldMap = new Map(existingLectureFields.map((f) => [f.slug, f]));

	for (const fieldDef of colDef.fields) {
		const existing = existingLectureFieldMap.get(fieldDef.slug);
		if (!existing) {
			await registry.createField(colDef.slug, fieldDef);
			fieldsAdded.push(`${colDef.slug}.${fieldDef.slug}`);
		}
	}

	return {
		success: true,
		orphanedTablesRegistered,
		collectionsCreated,
		fieldsAdded,
		fieldsUpdated,
	};
}
