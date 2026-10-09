import { describe, expect, it } from "vitest";

import * as adminExports from "../src/admin.js";
import { chessLessonsPlugin, createPlugin } from "../src/index.js";

describe("Chess Lessons Admin & Plugin Contract Exports", () => {
	it("admin entrypoint exports named 'pages' and 'fields' matching EmDash plugin contract", () => {
		expect(adminExports.pages).toBeDefined();
		expect(typeof adminExports.pages).toBe("object");
		expect(typeof adminExports.pages["/lessons"]).toBe("function");
		expect(typeof adminExports.pages["/import-obsidian"]).toBe("function");

		expect(adminExports.fields).toBeDefined();
		expect(typeof adminExports.fields).toBe("object");
		expect(typeof adminExports.fields["lecture-builder"]).toBe("function");
		expect(typeof adminExports.fields["chess-lessons:lecture-builder"]).toBe("function");
	});

	it("plugin descriptor định nghĩa chính xác id, route, capabilities và blocks", () => {
		const descriptor = chessLessonsPlugin();
		expect(descriptor.id).toBe("chess-lessons");
		expect(descriptor.capabilities).toContain("content:read");
		expect(descriptor.capabilities).toContain("content:write");
		expect(descriptor.portableTextBlocks?.[0]?.type).toBe("chess-lecture");

		const plugin = createPlugin();
		expect(plugin.id).toBe("chess-lessons");
		expect(plugin.routes?.["setup/run"]).toBeDefined();
		expect(plugin.routes?.["lectures/options"]).toBeDefined();
		expect(plugin.routes?.["snapshots/refresh"]).toBeDefined();
		expect(plugin.routes?.["lessons/seed-curriculum"]).toBeDefined();
		expect(plugin.routes?.["lessons/seed-sample-lesson"]).toBeDefined();
		expect(plugin.routes?.["lessons/seed-demo-data"]).toBeDefined();
		expect(plugin.routes?.["lessons/import-obsidian"]).toBeDefined();
		expect(plugin.hooks?.["content:beforeSave"]).toBeDefined();
	});
});
