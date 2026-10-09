import React from "react";
import { describe, it, expect } from "vitest";

import { ChessBoardIsland } from "../src/ChessBoardIsland.js";

describe("ChessBoardIsland component structure and props", () => {
	it("renders properly with FEN props and options", () => {
		const fen = "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2";
		const element = React.createElement(ChessBoardIsland, {
			fen,
			orientation: "black",
			caption: "Khai cuộc Sicilian",
			arrows: "c7c5 g1f3",
			highlights: "c5 f3",
			size: "M",
		});

		expect(element).toBeDefined();
		expect(element.props.fen).toBe(fen);
		expect(element.props.orientation).toBe("black");
		expect(element.props.caption).toBe("Khai cuộc Sicilian");
		expect(element.props.arrows).toBe("c7c5 g1f3");
		expect(element.props.highlights).toBe("c5 f3");
		expect(element.props.size).toBe("M");
	});

	it("renders properly with PGN props and options", () => {
		const pgn = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6";
		const element = React.createElement(ChessBoardIsland, {
			pgn,
			orientation: "white",
			startPly: 2,
			showHeaders: true,
			caption: "Ruy Lopez, Morphy Defense",
		});

		expect(element).toBeDefined();
		expect(element.props.pgn).toBe(pgn);
		expect(element.props.orientation).toBe("white");
		expect(element.props.startPly).toBe(2);
		expect(element.props.showHeaders).toBe(true);
	});
});
