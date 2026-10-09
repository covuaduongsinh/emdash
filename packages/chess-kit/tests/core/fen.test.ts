import { describe, expect, it } from "vitest";

import { parseFen, validateFen } from "../../src/core/fen.js";

describe("FEN validation and parsing", () => {
	it("validates standard starting position FEN", () => {
		const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
		const result = validateFen(startFen);
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns Vietnamese error messages for invalid FEN", () => {
		const invalidFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
		const result = validateFen(invalidFen);
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
		expect(typeof result.error).toBe("string");
		expect(result.error!.length).toBeGreaterThan(0);
	});

	it("parses valid FEN components correctly", () => {
		const fen = "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
		const parsed = parseFen(fen);
		expect(parsed.piecePlacement).toBe("r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R");
		expect(parsed.activeColor).toBe("w");
		expect(parsed.castlingRights).toBe("KQkq");
		expect(parsed.enPassant).toBe("-");
		expect(parsed.halfmoveClock).toBe(2);
		expect(parsed.fullmoveNumber).toBe(3);
	});
});
