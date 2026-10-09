import type { SchemaRegistry } from "emdash";

import { CHESS_PUZZLES_COLLECTION } from "./definitions.js";

export interface ChessPuzzlesSetupResult {
	success: boolean;
	orphanedTablesRegistered: string[];
	collectionsCreated: string[];
	fieldsAdded: string[];
	fieldsUpdated: string[];
}

/**
 * Cài đặt và đồng bộ cấu trúc bảng/collection cho Plugin chess-puzzles (idempotent).
 */
export async function runChessPuzzlesSetup(
	registry: SchemaRegistry,
): Promise<ChessPuzzlesSetupResult> {
	const orphaned = await registry.discoverOrphanedTables();
	const orphanedSet = new Set(orphaned.map((o) => o.slug));

	const orphanedTablesRegistered: string[] = [];
	const collectionsCreated: string[] = [];
	const fieldsAdded: string[] = [];
	const fieldsUpdated: string[] = [];

	const colDef = CHESS_PUZZLES_COLLECTION;
	let collection = await registry.getCollection(colDef.slug);

	if (!collection) {
		if (orphanedSet.has(colDef.slug)) {
			// Bảng ec_chess_puzzles đã có sẵn nhưng chưa đăng ký collection
			collection = await registry.registerOrphanedTable(colDef.slug, {
				label: colDef.label,
				labelSingular: colDef.labelSingular,
				description: colDef.description,
			});
			orphanedTablesRegistered.push(colDef.slug);
		} else {
			// Tạo mới collection và bảng ec_chess_puzzles
			collection = await registry.createCollection({
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

	// Đảm bảo tất cả các field được tạo đầy đủ
	const existingFields = await registry.listFields(collection.id);
	const existingFieldMap = new Map(existingFields.map((f) => [f.slug, f]));

	for (const fieldDef of colDef.fields) {
		const existingField = existingFieldMap.get(fieldDef.slug);
		if (!existingField) {
			await registry.createField(colDef.slug, fieldDef);
			fieldsAdded.push(`${colDef.slug}.${fieldDef.slug}`);
		} else {
			const shouldUpdateType =
				fieldDef.type === "select" &&
				existingField.type === "string" &&
				fieldDef.validation?.options;

			const shouldUpdateValidation =
				fieldDef.validation &&
				JSON.stringify(fieldDef.validation) !== JSON.stringify(existingField.validation);

			if (shouldUpdateType || shouldUpdateValidation) {
				try {
					await registry.updateField(colDef.slug, fieldDef.slug, {
						type: fieldDef.type,
						validation: fieldDef.validation,
						options: fieldDef.options,
					});
					fieldsUpdated.push(`${colDef.slug}.${fieldDef.slug}`);
				} catch {
					// Bỏ qua lỗi nếu field cấu hình cố định không thể sửa
				}
			}
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
