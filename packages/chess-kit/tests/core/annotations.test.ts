import { describe, expect, it } from "vitest";

import { parseArrows, parseSquares } from "../../src/core/annotations.js";

describe("Chess diagram annotations (arrows and squares)", () => {
	it("parses arrow strings into react-chessboard compatible format", () => {
		const arrowsStr = "e2e4 g1f3:red d7d5:green:large";
		const arrows = parseArrows(arrowsStr);
		expect(arrows.length).toBe(3);
		expect(arrows[0]).toEqual({ from: "e2", to: "e4", color: undefined });
		expect(arrows[1]).toEqual({ from: "g1", to: "f3", color: "red" });
		expect(arrows[2]).toEqual({ from: "d7", to: "d5", color: "green" });
	});

	it("handles empty or malformed arrow strings gracefully", () => {
		expect(parseArrows("")).toEqual([]);
		expect(parseArrows("invalid")).toEqual([]);
	});

	it("parses square highlight strings", () => {
		const squaresStr = "e4 d5:yellow f7:red";
		const squares = parseSquares(squaresStr);
		expect(squares).toEqual({
			e4: { color: undefined },
			d5: { color: "yellow" },
			f7: { color: "red" },
		});
	});
});
