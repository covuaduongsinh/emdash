import { describe, expect, it } from "vitest";

import { LMS_COLLECTIONS, runLmsSetup } from "../src/schema/setup.js";

describe("LMS Schema Setup Runner", () => {
	it("LMS_COLLECTIONS defines all 16 required collections", () => {
		expect(LMS_COLLECTIONS.length).toBe(16);
		const slugs = LMS_COLLECTIONS.map((c) => c.slug);
		expect(slugs).toContain("membership_plans");
		expect(slugs).toContain("course_categories");
		expect(slugs).toContain("courses");
		expect(slugs).toContain("modules");
		expect(slugs).toContain("lessons");
		expect(slugs).toContain("quizzes");
		expect(slugs).toContain("questions");
		expect(slugs).toContain("coupons");
		expect(slugs).toContain("course_reviews");
		expect(slugs).toContain("certificate_templates");
		expect(slugs).toContain("memberships");
		expect(slugs).toContain("orders");
		expect(slugs).toContain("enrollments");
		expect(slugs).toContain("lesson_progress");
		expect(slugs).toContain("quiz_submissions");
		expect(slugs).toContain("certificates");
	});

	it("runLmsSetup: registers orphaned tables and creates missing collections idempotently", async () => {
		// Mock registry state simulating D1 production with 5 orphaned tables
		const existingCollections = new Map<string, { id: string; slug: string }>();
		const existingFields = new Map<string, Array<{ id: string; slug: string; type: string }>>();
		const orphanedTables = [
			{ slug: "memberships", tableName: "ec_memberships", rowCount: 0 },
			{ slug: "lesson_progress", tableName: "ec_lesson_progress", rowCount: 0 },
			{ slug: "quiz_submissions", tableName: "ec_quiz_submissions", rowCount: 0 },
			{ slug: "certificates", tableName: "ec_certificates", rowCount: 0 },
			{ slug: "certificate_templates", tableName: "ec_certificate_templates", rowCount: 0 },
		];

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
				return { id: `f-${fieldDef.slug}`, ...fieldDef };
			},
			updateField: async () => {},
		};

		// Run 1: Initial sync
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res1 = await runLmsSetup(mockRegistry as any);
		expect(res1.success).toBe(true);
		expect(res1.orphanedTablesRegistered).toEqual([
			"certificate_templates",
			"memberships",
			"lesson_progress",
			"quiz_submissions",
			"certificates",
		]);
		expect(res1.collectionsCreated.length).toBe(11);
		expect(res1.totalCollections).toBe(16);
		expect(existingCollections.size).toBe(16);

		// Run 2: Idempotent run (should not register or create anything new)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res2 = await runLmsSetup(mockRegistry as any);
		expect(res2.success).toBe(true);
		expect(res2.orphanedTablesRegistered.length).toBe(0);
		expect(res2.collectionsCreated.length).toBe(0);
		expect(res2.fieldsAdded.length).toBe(0);
		expect(existingCollections.size).toBe(16);
	});
});
