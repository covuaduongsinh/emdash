import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseEpd } from "../src/importers/epd.js";
import { parseLichessCsv } from "../src/importers/lichess-csv.js";
import { parsePgnPuzzles } from "../src/importers/pgn.js";
import { ratingToLevel } from "../src/importers/rating-level.js";

describe("Chess Puzzles Importers", () => {
	it("maps Elo ratings to 6 Duong Sinh chess levels", () => {
		expect(ratingToLevel(null)).toBe("tot");
		expect(ratingToLevel(750)).toBe("tot");
		expect(ratingToLevel(1100)).toBe("ma");
		expect(ratingToLevel(1450)).toBe("tuong");
		expect(ratingToLevel(1750)).toBe("xe");
		expect(ratingToLevel(2050)).toBe("hau");
		expect(ratingToLevel(2350)).toBe("vua");
	});

	it("parses 20 puzzles from Lichess sample CSV fixture", () => {
		const fixturePath = resolve(__dirname, "fixtures/lichess_sample.csv");
		const csvContent = readFileSync(fixturePath, "utf-8");

		const { items, errors } = parseLichessCsv(csvContent);
		expect(errors).toHaveLength(0);
		expect(items).toHaveLength(20);

		// Kiểm tra câu đố đầu tiên
		const first = items[0];
		expect(first).toBeDefined();
		if (!first) throw new Error("First item missing");

		expect(first.title).toContain("00008");
		expect(first.level).toBe("xe");
		expect(first.moves).toEqual(["h6f8"]); // Lời giải sau nước dẫn e7e6
		expect(first.prompt).toContain("chiếu hết");

		// Kiểm tra các cấp độ khác nhau xuất hiện trong 20 câu
		const levels = new Set(items.map((i) => i.level));
		expect(levels.has("tot")).toBe(true);
		expect(levels.has("ma")).toBe(true);
		expect(levels.has("tuong")).toBe(true);
		expect(levels.has("xe")).toBe(true);
		expect(levels.has("hau")).toBe(true);
		expect(levels.has("vua")).toBe(true);
	});

	it("parses EPD puzzle format", () => {
		const epd = `1k1r4/pp1b1R2/8/4p2p/2B1P1nP/2N5/PPP5/2K5 b - - 0 1 bm Ne3; id "Puzzle-EPD-1"; c0 "Đen đi trước";`;
		const { items, errors } = parseEpd(epd);

		expect(errors).toHaveLength(0);
		expect(items).toHaveLength(1);
		const item = items[0];
		expect(item).toBeDefined();
		if (!item) throw new Error("Item missing");
		expect(item.title).toBe("Puzzle-EPD-1");
		expect(item.moves).toEqual(["g4e3"]);
	});

	it("parses PGN puzzle format", () => {
		const pgn = `[Event "Mate in 2"]
[Site "Duong Sinh Studio"]
[Date "2026.10.09"]
[White "Teacher"]
[Black "Student"]
[Result "*"]
[SetUp "1"]
[FEN "8/8/8/8/8/5K2/4R3/5k2 w - - 0 1"]

1. Re8 Kg1 2. Re1# *`;

		const { items, errors } = parsePgnPuzzles(pgn);
		expect(errors).toHaveLength(0);
		expect(items).toHaveLength(1);
		const item = items[0];
		expect(item).toBeDefined();
		if (!item) throw new Error("Item missing");
		expect(item.title).toBe("Mate in 2");
		expect(item.moves).toEqual(["e2e8", "f1g1", "e8e1"]);
	});
});
