import { Chess } from "chess.js";

const EN_TO_VI_PIECES: Record<string, string> = {
	N: "M", // Mã
	B: "T", // Tượng
	R: "X", // Xe
	Q: "H", // Hậu
	K: "V", // Vua
};

const VI_TO_EN_PIECES: Record<string, string> = {
	M: "N",
	T: "B",
	X: "R",
	H: "Q",
	V: "K",
};

const EN_PIECE_START_REGEX = /^[NBRQK]/;
const PROMOTION_EN_REGEX = /=([NBRQ])/g;
const VI_PIECE_START_REGEX = /^[MTXHV]/;
const PROMOTION_VI_REGEX = /=([MTXHV])/g;

/**
 * Chuyển đổi ký hiệu SAN chuẩn quốc tế sang ký hiệu tiếng Việt (V/H/X/T/M)
 * Ví dụ: Nf3 -> Mf3, Bb5+ -> Tb5+, Rxd8# -> Xxd8#, exd8=Q -> exd8=H
 */
export function sanToVi(san: string): string {
	if (!san) return "";
	let result = san;

	if (EN_PIECE_START_REGEX.test(result)) {
		const firstChar = result.charAt(0);
		const viChar = EN_TO_VI_PIECES[firstChar] ?? firstChar;
		result = viChar + result.slice(1);
	}

	result = result.replace(PROMOTION_EN_REGEX, (_match, piece) => {
		return `=${EN_TO_VI_PIECES[piece] ?? piece}`;
	});

	return result;
}

/**
 * Chuyển đổi ký hiệu tiếng Việt sang ký hiệu SAN quốc tế chuẩn
 * Ví dụ: Mf3 -> Nf3, Tb5+ -> Bb5+, Xxd8# -> Rxd8#, exd8=H -> exd8=Q
 */
export function viToSan(vi: string): string {
	if (!vi) return "";
	let result = vi;

	if (VI_PIECE_START_REGEX.test(result)) {
		const firstChar = result.charAt(0);
		const enChar = VI_TO_EN_PIECES[firstChar] ?? firstChar;
		result = enChar + result.slice(1);
	}

	result = result.replace(PROMOTION_VI_REGEX, (_match, piece) => {
		return `=${VI_TO_EN_PIECES[piece] ?? piece}`;
	});

	return result;
}

/**
 * Chuyển đổi nước đi dạng UCI (vd: "e2e4", "e7e8q") sang SAN dựa vào FEN hiện tại
 */
export function uciToSan(fen: string, uci: string): string {
	const game = new Chess(fen);
	const from = uci.slice(0, 2);
	const to = uci.slice(2, 4);
	const promotion = uci.length > 4 ? uci.slice(4, 5).toLowerCase() : undefined;

	const move = game.move({ from, to, promotion });
	if (!move) {
		throw new Error(`Nước đi UCI không hợp lệ: '${uci}' cho thế cờ FEN '${fen}'`);
	}
	return move.san;
}

/**
 * Chuyển đổi nước đi dạng SAN sang UCI (vd: "e4" -> "e2e4") dựa vào FEN hiện tại
 */
export function sanToUci(fen: string, san: string): string {
	const game = new Chess(fen);
	const cleanSan = viToSan(san.trim());
	const move = game.move(cleanSan);
	if (!move) {
		throw new Error(`Nước đi SAN không hợp lệ: '${san}' cho thế cờ FEN '${fen}'`);
	}
	return `${move.from}${move.to}${move.promotion || ""}`;
}
