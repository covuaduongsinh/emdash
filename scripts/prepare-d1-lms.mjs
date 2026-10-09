import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("demos/dsc-edu-vn/data.db");

// Get all tables starting with ec_
const tables = db
	.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name LIKE 'ec_%'")
	.all();
const collections = db
	.prepare(
		"SELECT * FROM _emdash_collections WHERE slug IN ('membership_plans', 'courses', 'course_categories', 'modules', 'lessons', 'quizzes', 'questions', 'coupons', 'course_reviews', 'enrollments', 'orders', 'subscriptions')",
	)
	.all();
const fields = db
	.prepare(
		"SELECT * FROM _emdash_fields WHERE collection_id IN (SELECT id FROM _emdash_collections WHERE slug IN ('membership_plans', 'courses', 'course_categories', 'modules', 'lessons', 'quizzes', 'questions', 'coupons', 'course_reviews', 'enrollments', 'orders', 'subscriptions'))",
	)
	.all();

let sqlScript = "PRAGMA foreign_keys = OFF;\n\n";

// 1. Tables first
sqlScript += "-- 1. Tables\n";
for (const t of tables) {
	if (t.sql && t.name !== "ec_posts" && t.name !== "ec_pages") {
		const createIf = t.sql.replace('CREATE TABLE "', 'CREATE TABLE IF NOT EXISTS "');
		sqlScript += `${createIf};\n\n`;
	}
}

// 2. Collections
sqlScript += "-- 2. Collections\n";
for (const col of collections) {
	sqlScript += `INSERT OR REPLACE INTO _emdash_collections (id, slug, label, label_singular, icon, supports, sort_order, created_at, updated_at) VALUES ('${col.id}', '${col.slug}', '${col.label}', '${col.label_singular}', '${col.icon || ""}', '${col.supports || "[]"}', ${col.sort_order || 0}, '${col.created_at}', '${col.updated_at}');\n`;
}

// Map field types to SQLite column_type
const TYPE_TO_COL = {
	string: "text",
	text: "text",
	number: "real",
	integer: "integer",
	boolean: "integer",
	datetime: "text",
	json: "json",
	image: "text",
	reference: "text",
	portableText: "json",
};

// 3. Fields
sqlScript += "\n-- 3. Fields\n";
for (const f of fields) {
	const colType = f.column_type || TYPE_TO_COL[f.type] || "text";
	sqlScript += `INSERT OR REPLACE INTO _emdash_fields (id, collection_id, slug, label, type, column_type, required, options, sort_order, default_value, created_at) VALUES ('${f.id}', '${f.collection_id}', '${f.slug}', '${f.label}', '${f.type}', '${colType}', ${f.required ? 1 : 0}, '${(f.options || "").replace(/'/g, "''")}', ${f.sort_order || 0}, ${f.default_value ? `'${f.default_value.replace(/'/g, "''")}'` : "NULL"}, '${f.created_at}');\n`;
}

// 4. Seed Data from dsc-edu-vn/data.db
const lmsTables = [
	"ec_course_categories",
	"ec_membership_plans",
	"ec_courses",
	"ec_modules",
	"ec_lessons",
];
for (const tbl of lmsTables) {
	const rows = db.prepare(`SELECT * FROM ${tbl}`).all();
	if (rows.length > 0) {
		sqlScript += `\n-- Seed ${tbl}\n`;
		for (const row of rows) {
			const keys = Object.keys(row);
			const cols = keys.map((k) => `"${k}"`).join(", ");
			const vals = keys
				.map((k) => {
					const v = row[k];
					if (v === null || v === undefined) return "NULL";
					if (typeof v === "number") return v;
					return `'${String(v).replace(/'/g, "''")}'`;
				})
				.join(", ");
			sqlScript += `INSERT OR REPLACE INTO ${tbl} (${cols}) VALUES (${vals});\n`;
		}
	}
}

sqlScript += "\nPRAGMA foreign_keys = ON;\n";

fs.writeFileSync("demos/cloudflare/scripts/remote-lms-seed.sql", sqlScript);
console.log(
	"Successfully generated demos/cloudflare/scripts/remote-lms-seed.sql with PRAGMA foreign_keys = OFF",
);
