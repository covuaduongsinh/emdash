import { describe, expect, it } from "vitest";

import { checkPuzzleMove, gradeChessAnswer } from "../../src/core/puzzle.js";

describe("Puzzle verification and grading", () => {
	// Standard Scholar's Mate puzzle: White to move and mate in 1 (Qxf7#)
	// FEN: r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1
	const scholarFen = "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1";

	it("identifies correct solution move and finishes single-move puzzle", () => {
		const result = checkPuzzleMove(scholarFen, ["f3f7"], 0, "f3f7");
		expect(result.correct).toBe(true);
		expect(result.done).toBe(true);
		expect(result.opponentReply).toBeUndefined();
	});

	it("rejects incorrect move", () => {
		const result = checkPuzzleMove(scholarFen, ["f3f7"], 0, "f3e4");
		expect(result.correct).toBe(false);
		expect(result.done).toBe(false);
	});

	it("accepts ANY checkmate move if solution finishes with checkmate (alternative mate)", () => {
		// Back rank mate where both Qd8# and Re8# or Qh8# are checkmate
		// FEN: 6k1/5ppp/8/8/8/8/8/3R2KQ w - - 0 1 (White: Rook d1, King g1, Queen h1)
		// Solution in puzzle DB happens to say d1d8
		const backRankFen = "6k1/5ppp/8/8/8/8/8/3R2KQ w - - 0 1";
		const solution = ["d1d8"];

		// Player plays h1a8 instead of d1d8 (both are checkmate!)
		const playerMove = "h1a8";
		const result = checkPuzzleMove(backRankFen, solution, 0, playerMove);
		expect(result.correct).toBe(true);
		expect(result.done).toBe(true);
	});

	it("provides automatic opponent reply on multi-move puzzles", () => {
		// 1. Qc8+ (f5c8) Kg7 (g8g7) 2. Qc3 (c8c3)
		const twoMoveFen = "6k1/5p1p/6p1/5Q2/8/8/5PPP/6K1 w - - 0 1";
		const solution = ["f5c8", "g8g7", "c8c3"];

		const step1 = checkPuzzleMove(twoMoveFen, solution, 0, "f5c8");
		expect(step1.correct).toBe(true);
		expect(step1.done).toBe(false);
		expect(step1.opponentReply).toBe("g8g7");

		// After opponent reply at ply 1 (Kg7), it is White's turn again in afterOpponentFen
		const afterOpponentFen = "2Q5/5pkp/6p1/8/8/8/5PPP/6K1 w - - 1 1";
		const step2 = checkPuzzleMove(afterOpponentFen, solution, 2, "c8c3");
		expect(step2.correct).toBe(true);
		expect(step2.done).toBe(true);
	});

	it("grades full chess answer on server side (gradeChessAnswer)", () => {
		const puzzle = {
			fen: scholarFen,
			solution: ["f3f7"],
		};

		// Correct move
		const grade1 = gradeChessAnswer(puzzle, ["f3f7"]);
		expect(grade1.correct).toBe(true);

		// Incorrect move
		const grade2 = gradeChessAnswer(puzzle, ["f3e4"]);
		expect(grade2.correct).toBe(false);
		expect(grade2.reason).toBeDefined();

		// Incomplete moves
		const multiPuzzle = {
			fen: "6k1/5p1p/6p1/5Q2/8/8/5PPP/6K1 w - - 0 1",
			solution: ["f5c8", "g8g7", "c8c3"],
		};
		const grade3 = gradeChessAnswer(multiPuzzle, ["f5c8"]);
		expect(grade3.correct).toBe(false);
		expect(grade3.reason).toContain("chưa hoàn thành");
	});
});
