import { describe, expect, it } from "vitest";

import { sanToUci, sanToVi, uciToSan, viToSan } from "../../src/core/notation.js";

describe("Chess notation converters", () => {
	it("translates SAN to Vietnamese notation (sanToVi)", () => {
		// N -> M (Mã), B -> T (Tượng), R -> X (Xe), Q -> H (Hậu), K -> V (Vua)
		expect(sanToVi("Nf3")).toBe("Mf3");
		expect(sanToVi("Bb5+")).toBe("Tb5+");
		expect(sanToVi("Rxd8#")).toBe("Xxd8#");
		expect(sanToVi("Qh5")).toBe("Hh5");
		expect(sanToVi("Ke2")).toBe("Ve2");
		expect(sanToVi("e4")).toBe("e4");
		expect(sanToVi("O-O")).toBe("O-O");
		expect(sanToVi("O-O-O")).toBe("O-O-O");
		expect(sanToVi("exd8=Q#")).toBe("exd8=H#");
		expect(sanToVi("Nbd7")).toBe("Mbd7");
		expect(sanToVi("R1e2")).toBe("X1e2");
	});

	it("translates Vietnamese notation to standard SAN (viToSan)", () => {
		expect(viToSan("Mf3")).toBe("Nf3");
		expect(viToSan("Tb5+")).toBe("Bb5+");
		expect(viToSan("Xxd8#")).toBe("Rxd8#");
		expect(viToSan("Hh5")).toBe("Qh5");
		expect(viToSan("Ve2")).toBe("Ke2");
		expect(viToSan("e4")).toBe("e4");
		expect(viToSan("O-O")).toBe("O-O");
		expect(viToSan("O-O-O")).toBe("O-O-O");
		expect(viToSan("exd8=H#")).toBe("exd8=Q#");
		expect(viToSan("Mbd7")).toBe("Nbd7");
		expect(viToSan("X1e2")).toBe("R1e2");
	});

	it("converts UCI to SAN with given FEN context", () => {
		const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
		expect(uciToSan(startFen, "e2e4")).toBe("e4");
		expect(uciToSan(startFen, "g1f3")).toBe("Nf3");

		const castlingFen = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5";
		expect(uciToSan(castlingFen, "e1g1")).toBe("O-O");

		const promoFen = "8/4P3/8/8/8/8/8/4K2k w - - 0 1";
		expect(uciToSan(promoFen, "e7e8q")).toBe("e8=Q");
	});

	it("converts SAN to UCI with given FEN context", () => {
		const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
		expect(sanToUci(startFen, "e4")).toBe("e2e4");
		expect(sanToUci(startFen, "Nf3")).toBe("g1f3");

		const promoFen = "8/4P3/8/8/8/8/8/4K2k w - - 0 1";
		expect(sanToUci(promoFen, "e8=Q")).toBe("e7e8q");
	});
});
