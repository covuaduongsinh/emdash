import { Chess } from "chess.js";

export interface ParsedFen {
	piecePlacement: string;
	activeColor: "w" | "b";
	castlingRights: string;
	enPassant: string;
	halfmoveClock: number;
	fullmoveNumber: number;
}

export interface FenValidationResult {
	valid: boolean;
	error?: string;
}

const SPLIT_WHITESPACE_REGEX = /\s+/;
const PIECE_CHAR_REGEX = /^[rnbqkpRNBQKP]$/;
const CASTLING_REGEX = /^(-|[KQkq]+)$/;
const EN_PASSANT_REGEX = /^[a-h][36]$/;

export function validateFen(fen: string): FenValidationResult {
	if (!fen || typeof fen !== "string") {
		return { valid: false, error: "Chuỗi FEN không được để trống" };
	}

	const trimmed = fen.trim();
	const parts = trimmed.split(SPLIT_WHITESPACE_REGEX);
	if (parts.length !== 6) {
		return {
			valid: false,
			error:
				"Chuỗi FEN phải có đúng 6 trường (thế cờ, lượt đi, quyền nhập thành, ô bắt tốt qua đường, số nước 50, số nước đi)",
		};
	}

	const [placement, activeColor, castling, ep, halfmove, fullmove] = parts;

	const rows = placement?.split("/");
	if (!rows || rows.length !== 8) {
		return { valid: false, error: "Thế cờ phải có đúng 8 hàng cách nhau bởi dấu /" };
	}

	let whiteKings = 0;
	let blackKings = 0;

	for (const row of rows) {
		let count = 0;
		for (const char of row) {
			if (char >= "1" && char <= "8") {
				count += Number.parseInt(char, 10);
			} else if (PIECE_CHAR_REGEX.test(char)) {
				count += 1;
				if (char === "K") whiteKings += 1;
				if (char === "k") blackKings += 1;
			} else {
				return { valid: false, error: `Ký tự không hợp lệ trong thế cờ: '${char}'` };
			}
		}
		if (count !== 8) {
			return { valid: false, error: "Mỗi hàng trên bàn cờ phải có đúng 8 ô" };
		}
	}

	if (whiteKings !== 1 || blackKings !== 1) {
		return { valid: false, error: "Thế cờ phải có chính xác 1 Vua Trắng và 1 Vua Đen" };
	}

	if (activeColor !== "w" && activeColor !== "b") {
		return { valid: false, error: "Lượt đi phải là 'w' (Trắng) hoặc 'b' (Đen)" };
	}

	if (!CASTLING_REGEX.test(castling ?? "")) {
		return { valid: false, error: "Quyền nhập thành không hợp lệ (phải là KQkq hoặc -)" };
	}

	if (ep !== "-" && !EN_PASSANT_REGEX.test(ep ?? "")) {
		return { valid: false, error: "Ô bắt tốt qua đường không hợp lệ" };
	}

	const half = Number.parseInt(halfmove ?? "", 10);
	const full = Number.parseInt(fullmove ?? "", 10);
	if (Number.isNaN(half) || half < 0) {
		return { valid: false, error: "Số nước đếm luật 50 nước không hợp lệ" };
	}
	if (Number.isNaN(full) || full < 1) {
		return { valid: false, error: "Số thứ tự nước đi phải là số nguyên dương" };
	}

	// Double check with chess.js validation
	try {
		const chess = new Chess();
		chess.load(trimmed);
		return { valid: true };
	} catch (e) {
		return {
			valid: false,
			error: e instanceof Error ? e.message : "Thế cờ không hợp lệ trong cờ vua",
		};
	}
}

export function parseFen(fen: string): ParsedFen {
	const validation = validateFen(fen);
	if (!validation.valid) {
		throw new Error(validation.error || "Invalid FEN");
	}

	const [placement, activeColor, castling, ep, halfmove, fullmove] = fen
		.trim()
		.split(SPLIT_WHITESPACE_REGEX);

	return {
		piecePlacement: placement!,
		activeColor: activeColor as "w" | "b",
		castlingRights: castling!,
		enPassant: ep!,
		halfmoveClock: Number.parseInt(halfmove!, 10),
		fullmoveNumber: Number.parseInt(fullmove!, 10),
	};
}
