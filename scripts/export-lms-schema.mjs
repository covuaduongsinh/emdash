import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("demos/dsc-edu-vn/data.db");
const tables = db
	.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name LIKE 'ec_%'")
	.all();
const collections = db
	.prepare(
		"SELECT * FROM _emdash_collections WHERE slug IN ('membership_plans', 'courses', 'course_categories', 'modules', 'lessons', 'user_course_access', 'user_membership_subscriptions', 'lms_orders')",
	)
	.all();
const fields = db
	.prepare(
		"SELECT * FROM _emdash_fields WHERE collection_id IN (SELECT id FROM _emdash_collections WHERE slug IN ('membership_plans', 'courses', 'course_categories', 'modules', 'lessons', 'user_course_access', 'user_membership_subscriptions', 'lms_orders'))",
	)
	.all();

let sqlScript = "-- LMS Schema for Cloudflare D1\n\n";

// 1. Collections
for (const col of collections) {
	sqlScript += `INSERT OR IGNORE INTO _emdash_collections (id, slug, label, label_singular, icon, supports, group_name, sort_order, created_at, updated_at) VALUES ('${col.id}', '${col.slug}', '${col.label}', '${col.label_singular}', '${col.icon || ""}', '${col.supports || "[]"}', '${col.group_name || "LMS"}', ${col.sort_order || 0}, '${col.created_at}', '${col.updated_at}');\n`;
}

// 2. Fields
for (const f of fields) {
	sqlScript += `INSERT OR IGNORE INTO _emdash_fields (id, collection_id, slug, label, type, required, options, sort_order, default_value, group_name, created_at, updated_at) VALUES ('${f.id}', '${f.collection_id}', '${f.slug}', '${f.label}', '${f.type}', ${f.required ? 1 : 0}, '${(f.options || "").replace(/'/g, "''")}', ${f.sort_order || 0}, ${f.default_value ? `'${f.default_value}'` : "NULL"}, ${f.group_name ? `'${f.group_name}'` : "NULL"}, '${f.created_at}', '${f.updated_at}');\n`;
}

sqlScript += "\n-- Tables\n";
for (const t of tables) {
	if (t.sql) {
		sqlScript += `${t.sql};\n\n`;
	}
}

fs.writeFileSync("demos/cloudflare/scripts/lms-schema.sql", sqlScript);
console.log("Exported LMS schema to demos/cloudflare/scripts/lms-schema.sql");
