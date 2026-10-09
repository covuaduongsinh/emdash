import { parsePgn, replayPositions } from "@duongsinh/chess-kit/core";
import { describe, it, expect } from "vitest";

describe("Regression test: PGN with custom FEN and SetUp tag", () => {
	it("replays from custom starting FEN when SetUp tag is present", () => {
		const customFen = "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4";
		const pgnWithFen = `[Event "Tactics Test"]
[Site "Duong Sinh"]
[Date "2026.10.09"]
[SetUp "1"]
[FEN "${customFen}"]

4. d4 exd4 5. O-O *`;

		const parsed = parsePgn(pgnWithFen);
		expect(parsed.headers.SetUp).toBe("1");
		expect(parsed.headers.FEN).toBe(customFen);
		expect(parsed.startFen).toBe(customFen);

		const fens = replayPositions(pgnWithFen);
		expect(fens.length).toBe(4); // start, 4. d4, 4... exd4, 5. O-O
		// Vị trí đầu tiên BẮT BUỘC phải là customFen chứ không phải bàn cờ xuất phát chuẩn
		expect(fens[0]).toBe(customFen);
		expect(fens[0]).not.toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
	});

	it("handles standard PGN without FEN tag starting from standard position", () => {
		const standardPgn = `1. e4 e5 2. Nf3 Nc6 *`;
		const parsed = parsePgn(standardPgn);
		expect(parsed.startFen).toBeUndefined();

		const fens = replayPositions(standardPgn);
		expect(fens[0]).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
		expect(fens.length).toBe(5); // start, e4, e5, Nf3, Nc6
	});

	it("handles PGN with comments, NAGs, and alternative variations", () => {
		const pgnWithVariations = `1. e4 e5 { King's Pawn Game } 2. Nf3 (2. f4 $1 exf4) 2... Nc6 *`;
		const parsed = parsePgn(pgnWithVariations);
		expect(parsed.tree.moves.length).toBeGreaterThanOrEqual(3);
		expect(parsed.tree.moves[1].comment).toContain("King's Pawn Game");
		expect(parsed.tree.moves[2].variations?.length).toBe(1);
	});
});
