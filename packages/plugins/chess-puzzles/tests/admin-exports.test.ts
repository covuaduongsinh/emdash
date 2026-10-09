import { describe, expect, it } from "vitest";

import * as adminExports from "../src/admin.js";
import { chessPuzzlesPlugin, createPlugin } from "../src/index.js";

describe("Chess Puzzles Admin & Plugin Contract Exports", () => {
	it("admin entrypoint exports named 'pages' and 'fields' objects matching EmDash plugin contract", () => {
		expect(adminExports.pages).toBeDefined();
		expect(typeof adminExports.pages).toBe("object");
		expect(typeof adminExports.pages["/puzzles"]).toBe("function");
		expect(typeof adminExports.pages["/import"]).toBe("function");

		expect(adminExports.fields).toBeDefined();
		expect(typeof adminExports.fields).toBe("object");
		expect(typeof adminExports.fields["puzzle-editor"]).toBe("function");
		expect(typeof adminExports.fields["chess-puzzles:puzzle-editor"]).toBe("function");
	});

	it("declares portableTextBlocks with category 'Cờ vua' and select optionsRoute", () => {
		const descriptor = chessPuzzlesPlugin();
		expect(descriptor.id).toBe("chess-puzzles");
		expect(descriptor.capabilities).toEqual(["content:read", "content:write"]);
		expect(descriptor.portableTextBlocks).toBeDefined();
		expect(descriptor.portableTextBlocks).toHaveLength(1);

		const block = descriptor.portableTextBlocks?.[0];
		expect(block).toBeDefined();
		if (!block) throw new Error("Block missing");

		expect(block.type).toBe("chess-puzzle");
		expect(block.category).toBe("Cờ vua");

		const puzzleSelectField = block.fields?.find(
			(f: { action_id?: string }) => f.action_id === "puzzle",
		) as { options_route?: string } | undefined;
		expect(puzzleSelectField).toBeDefined();
		expect(puzzleSelectField?.options_route).toBe("puzzles/options");
	});

	it("declares admin pages in createPlugin", () => {
		const plugin = createPlugin();
		expect(plugin.admin?.pages).toBeDefined();
		expect(plugin.admin?.pages).toEqual([
			{ path: "/puzzles", label: "Câu đố", icon: "sparkle" },
			{ path: "/import", label: "Nhập câu đố", icon: "upload" },
		]);
	});
});
