import { describe, expect, it } from "vitest";

import { parsePgn, replayPositions } from "../../src/core/pgn.js";

describe("PGN parser and position replayer", () => {
	it("parses standard mainline PGN with headers", () => {
		const pgn = `[Event "World Championship"]
[Site "London"]
[Date "2018.11.09"]
[White "Carlsen, Magnus"]
[Black "Caruana, Fabiano"]
[Result "1/2-1/2"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 1/2-1/2`;

		const parsed = parsePgn(pgn);
		expect(parsed.headers.Event).toBe("World Championship");
		expect(parsed.headers.White).toBe("Carlsen, Magnus");
		expect(parsed.headers.Result).toBe("1/2-1/2");
		expect(parsed.tree.moves.length).toBe(8);
		expect(parsed.tree.moves[0]?.san).toBe("e4");
		expect(parsed.tree.moves[1]?.san).toBe("e5");
	});

	it("correctly replays PGN with custom start position [SetUp] and [FEN]", () => {
		// Custom tactic position with pawns f, g, h
		const customFen = "5rk1/5p1p/6p1/8/8/6Q1/5PPP/R5K1 w - - 0 1";
		const pgn = `[SetUp "1"]
[FEN "${customFen}"]

1. h4 h5 2. f4 f5`;

		const parsed = parsePgn(pgn);
		expect(parsed.startFen).toBe(customFen);
		expect(parsed.headers.FEN).toBe(customFen);

		const positions = replayPositions(pgn);
		// positions[0] should be the custom initial FEN
		expect(positions[0]).toBe(customFen);
		expect(positions.length).toBe(5); // start + 4 moves
	});

	it("parses comments, NAGs, and variations", () => {
		const pgn = `1. e4 {Good opening move} e5 2. Nf3 $1 (2. f4 exf4 3. Nf3) 2... Nc6`;
		const parsed = parsePgn(pgn);
		expect(parsed.tree.moves[0]?.comment).toContain("Good opening move");
		expect(parsed.tree.moves[2]?.nag).toBe("$1");
		expect(parsed.tree.moves[2]?.variations?.length).toBe(1);
		expect(parsed.tree.moves[2]?.variations?.[0]?.moves[0]?.san).toBe("f4");
	});

	it("handles PGN with multiple comments and NAGs smoothly", () => {
		const pgn = `1. d4 d5 2. c4 e6 {Queen's Gambit} 3. Nc3 Nf6 4. Bg5`;
		const positions = replayPositions(pgn);
		expect(positions.length).toBe(8);
	});
});
