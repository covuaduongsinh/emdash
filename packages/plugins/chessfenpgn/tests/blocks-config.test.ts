import { describe, it, expect } from "vitest";

import { chessfenpgnPlugin, createPlugin } from "../src/index.js";

describe("chessfenpgn plugin definition & block configuration", () => {
	it("exports proper plugin descriptors", () => {
		const desc = chessfenpgnPlugin();
		expect(desc.id).toBe("chessfenpgn");
		expect(desc.entrypoint).toBe("@emdash-cms/plugin-chessfenpgn");
		expect(desc.adminEntry).toBe("@emdash-cms/plugin-chessfenpgn/admin");
		expect(desc.componentsEntry).toBe("@emdash-cms/plugin-chessfenpgn/astro");

		const plugin = createPlugin();
		expect(plugin.id).toBe("chessfenpgn");
		expect(plugin.admin?.pages).toBeDefined();
		expect(plugin.admin?.pages).toEqual([{ path: "/editor", label: "Bàn cờ", icon: "grid" }]);
	});

	it("declares portableTextBlocks with category 'Cờ vua' and additive fields", () => {
		const plugin = createPlugin();
		const blocks = plugin.admin?.portableTextBlocks || [];
		expect(blocks.length).toBe(2);

		const fenBlock = blocks.find((b) => b.type === "chess-fen");
		expect(fenBlock).toBeDefined();
		expect(fenBlock?.category).toBe("Cờ vua");
		expect(fenBlock?.label).toBe("Chess (FEN)");

		const fenFieldNames = fenBlock?.fields?.map((f: any) => f.action_id);
		expect(fenFieldNames).toContain("fen");
		expect(fenFieldNames).toContain("orientation");
		expect(fenFieldNames).toContain("caption");
		expect(fenFieldNames).toContain("arrows");
		expect(fenFieldNames).toContain("highlights");
		expect(fenFieldNames).toContain("size");

		const pgnBlock = blocks.find((b) => b.type === "chess-pgn");
		expect(pgnBlock).toBeDefined();
		expect(pgnBlock?.category).toBe("Cờ vua");
		expect(pgnBlock?.label).toBe("Chess (PGN)");

		const pgnFieldNames = pgnBlock?.fields?.map((f: any) => f.action_id);
		expect(pgnFieldNames).toContain("pgn");
		expect(pgnFieldNames).toContain("orientation");
		expect(pgnFieldNames).toContain("startPly");
		expect(pgnFieldNames).toContain("showHeaders");
		expect(pgnFieldNames).toContain("caption");
	});

	it("declares chess-board field widget supporting string, text, json", () => {
		const plugin = createPlugin();
		const widgets = plugin.admin?.fieldWidgets || [];
		const chessWidget = widgets.find((w) => w.name === "chess-board");
		expect(chessWidget).toBeDefined();
		expect(chessWidget?.fieldTypes).toEqual(["string", "text", "json"]);
	});
});
