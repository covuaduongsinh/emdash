import type { SchemaRegistry } from "emdash";
import { describe, expect, it } from "vitest";

import { CHESS_PUZZLES_COLLECTION } from "../src/schema/definitions.js";
import { runChessPuzzlesSetup } from "../src/schema/setup.js";

describe("Chess Puzzles Schema Setup", () => {
	it("defines collection schema with 6 levels and required fields", () => {
		expect(CHESS_PUZZLES_COLLECTION.slug).toBe("chess_puzzles");
		expect(CHESS_PUZZLES_COLLECTION.urlPattern).toBe("/cau-do/{slug}");
		expect(CHESS_PUZZLES_COLLECTION.supports).toContain("drafts");
		expect(CHESS_PUZZLES_COLLECTION.supports).toContain("revisions");

		const fieldSlugs = CHESS_PUZZLES_COLLECTION.fields.map((f) => f.slug);
		expect(fieldSlugs).toContain("title");
		expect(fieldSlugs).toContain("puzzle");
		expect(fieldSlugs).toContain("prompt");
		expect(fieldSlugs).toContain("level");
		expect(fieldSlugs).toContain("themes");
		expect(fieldSlugs).toContain("rating");
		expect(fieldSlugs).toContain("hint");
		expect(fieldSlugs).toContain("explanation");
		expect(fieldSlugs).toContain("source");

		const levelField = CHESS_PUZZLES_COLLECTION.fields.find((f) => f.slug === "level");
		expect(levelField?.type).toBe("select");
		const options = levelField?.validation?.options || [];
		expect(options).toEqual(["tot", "ma", "tuong", "xe", "hau", "vua"]);
	});

	it("runs setup idempotently: creates collection on run 1, no duplicate on run 2", async () => {
		const existingCollections = new Map<string, { id: string; slug: string }>();
		const existingFields = new Map<string, Array<{ id: string; slug: string; type: string }>>();
		const orphanedTables: Array<{ slug: string; tableName: string; rowCount: number }> = [];

		const mockRegistry = {
			discoverOrphanedTables: async () =>
				orphanedTables.filter((o) => !existingCollections.has(o.slug)),
			getCollection: async (slug: string) => existingCollections.get(slug) ?? null,
			registerOrphanedTable: async (slug: string) => {
				const col = { id: `col-${slug}`, slug };
				existingCollections.set(slug, col);
				existingFields.set(col.id, []);
				return col;
			},
			createCollection: async (def: { slug: string }) => {
				const col = { id: `col-${def.slug}`, slug: def.slug };
				existingCollections.set(def.slug, col);
				existingFields.set(col.id, []);
				return col;
			},
			listFields: async (collectionId: string) => existingFields.get(collectionId) || [],
			createField: async (collectionSlug: string, fieldDef: { slug: string; type: string }) => {
				const col = existingCollections.get(collectionSlug);
				if (col) {
					const fields = existingFields.get(col.id) || [];
					fields.push({ id: `f-${fieldDef.slug}`, slug: fieldDef.slug, type: fieldDef.type });
					existingFields.set(col.id, fields);
				}
			},
			updateField: async () => {},
		} as unknown as SchemaRegistry;

		// Lần 1: Cài đặt mới
		const result1 = await runChessPuzzlesSetup(mockRegistry);
		expect(result1.success).toBe(true);
		expect(result1.collectionsCreated).toContain("chess_puzzles");
		expect(result1.fieldsAdded.length).toBe(CHESS_PUZZLES_COLLECTION.fields.length);

		// Lần 2: Chạy lại phải giữ nguyên (idempotent)
		const result2 = await runChessPuzzlesSetup(mockRegistry);
		expect(result2.success).toBe(true);
		expect(result2.collectionsCreated).toHaveLength(0);
		expect(result2.fieldsAdded).toHaveLength(0);
	});

	it("registers orphaned table if ec_chess_puzzles already exists in database", async () => {
		const existingCollections = new Map<string, { id: string; slug: string }>();
		const existingFields = new Map<string, Array<{ id: string; slug: string; type: string }>>();
		const orphanedTables = [{ slug: "chess_puzzles", tableName: "ec_chess_puzzles", rowCount: 10 }];

		const mockRegistry = {
			discoverOrphanedTables: async () =>
				orphanedTables.filter((o) => !existingCollections.has(o.slug)),
			getCollection: async (slug: string) => existingCollections.get(slug) ?? null,
			registerOrphanedTable: async (slug: string) => {
				const col = { id: `col-${slug}`, slug };
				existingCollections.set(slug, col);
				existingFields.set(col.id, []);
				return col;
			},
			createCollection: async (def: { slug: string }) => {
				const col = { id: `col-${def.slug}`, slug: def.slug };
				existingCollections.set(def.slug, col);
				existingFields.set(col.id, []);
				return col;
			},
			listFields: async (collectionId: string) => existingFields.get(collectionId) || [],
			createField: async (collectionSlug: string, fieldDef: { slug: string; type: string }) => {
				const col = existingCollections.get(collectionSlug);
				if (col) {
					const fields = existingFields.get(col.id) || [];
					fields.push({ id: `f-${fieldDef.slug}`, slug: fieldDef.slug, type: fieldDef.type });
					existingFields.set(col.id, fields);
				}
			},
			updateField: async () => {},
		} as unknown as SchemaRegistry;

		const result = await runChessPuzzlesSetup(mockRegistry);
		expect(result.success).toBe(true);
		expect(result.orphanedTablesRegistered).toContain("chess_puzzles");
		expect(result.collectionsCreated).toHaveLength(0);
	});
});
