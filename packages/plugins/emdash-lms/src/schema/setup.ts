import { SchemaRegistry } from "emdash";

import { LMS_COLLECTIONS, type LmsCollectionDefinition } from "./definitions.js";

export interface SetupResult {
	success: boolean;
	orphanedTablesRegistered: string[];
	collectionsCreated: string[];
	fieldsAdded: string[];
	fieldsUpdated: string[];
	totalCollections: number;
}

/**
 * Idempotent schema synchronization for EmDash LMS.
 *
 * Ensures all 16 LMS collections and their fields exist in `_emdash_collections`
 * and `_emdash_fields`. Registers any orphaned `ec_*` tables that were created
 * manually without modifying, deleting, or re-creating existing tables or data.
 */
export async function runLmsSetup(registry: SchemaRegistry): Promise<SetupResult> {
	const orphaned = await registry.discoverOrphanedTables();
	const orphanedSet = new Set(orphaned.map((o) => o.slug));

	const orphanedTablesRegistered: string[] = [];
	const collectionsCreated: string[] = [];
	const fieldsAdded: string[] = [];
	const fieldsUpdated: string[] = [];

	for (const colDef of LMS_COLLECTIONS) {
		let collection = await registry.getCollection(colDef.slug);

		if (!collection) {
			if (orphanedSet.has(colDef.slug)) {
				// Table exists in DB (orphaned) -> register it
				collection = await registry.registerOrphanedTable(colDef.slug, {
					label: colDef.label,
					labelSingular: colDef.labelSingular,
					description: colDef.description,
				});
				orphanedTablesRegistered.push(colDef.slug);
			} else {
				// Neither table nor collection exists -> create collection + ec_* table
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

		// Ensure all fields exist and are up to date
		const existingFields = await registry.listFields(collection.id);
		const existingFieldMap = new Map(existingFields.map((f) => [f.slug, f]));

		for (const fieldDef of colDef.fields) {
			const existingField = existingFieldMap.get(fieldDef.slug);
			if (!existingField) {
				await registry.createField(colDef.slug, fieldDef);
				fieldsAdded.push(`${colDef.slug}.${fieldDef.slug}`);
			} else {
				// Normalize select fields that were previously created as string + choices
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
						// Ignore update failures on immutable field configurations
					}
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
		totalCollections: LMS_COLLECTIONS.length,
	};
}

export { LMS_COLLECTIONS, type LmsCollectionDefinition };
