import { Chess } from "chess.js";

import type { PuzzleImportItem } from "../types.js";
import { ratingToLevel } from "./rating-level.js";

export interface ParseEpdResult {
	items: PuzzleImportItem[];
	errors: Array<{ line: number; error: string }>;
}

const LINE_SPLIT_REGEX = /\r?\n/;
const WHITESPACE_SPLIT_REGEX = /\s+/;
const IDENTIFIER_OR_OPCODE_REGEX = /^[a-z0-9_]+$/i;
const DIGITS_ONLY_REGEX = /^[0-9]+$/;
const BM_OPCODE_REGEX = /bm\s+([^;]+);?/i;
const ID_OPCODE_REGEX = /id\s+"?([^";]+)"?;?/i;
const C0_OPCODE_REGEX = /c0\s+"?([^";]+)"?;?/i;

export function parseEpd(epdContent: string): ParseEpdResult {
	const lines = epdContent.split(LINE_SPLIT_REGEX);
	const items: PuzzleImportItem[] = [];
	const errors: Array<{ line: number; error: string }> = [];

	let lineNumber = 0;
	for (const rawLine of lines) {
		lineNumber++;
		const line = rawLine.trim();
		if (!line || line.startsWith("#") || line.startsWith("//")) continue;

		// EPD bắt đầu bằng 4-6 phần tử FEN, tiếp theo là các opcode (bm, id, c0, pm, ...)
		const parts = line.split(WHITESPACE_SPLIT_REGEX);
		if (parts.length < 4) {
			errors.push({
				line: lineNumber,
				error: "Cú pháp EPD không đủ phần tử thế cờ",
			});
			continue;
		}

		// Tìm vị trí bắt đầu của opcode đầu tiên (bm, id, am, sm, ...)
		let opcodeIndex = -1;
		for (let i = 4; i < parts.length; i++) {
			const part = parts[i];
			if (part && IDENTIFIER_OR_OPCODE_REGEX.test(part) && !DIGITS_ONLY_REGEX.test(part)) {
				// Nếu là bm, id, c0...
				if (["bm", "id", "c0", "c1", "am", "pm"].includes(part.toLowerCase())) {
					opcodeIndex = i;
					break;
				}
			}
		}

		let fenParts: string[];
		let opcodesStr = "";
		if (opcodeIndex !== -1) {
			fenParts = parts.slice(0, opcodeIndex);
			opcodesStr = parts.slice(opcodeIndex).join(" ");
		} else {
			// Giả định 4-6 phần tử đầu là FEN
			const part4 = parts[4];
			const part5 = parts[5];
			if (
				parts.length >= 6 &&
				part4 &&
				part5 &&
				DIGITS_ONLY_REGEX.test(part4) &&
				DIGITS_ONLY_REGEX.test(part5)
			) {
				fenParts = parts.slice(0, 6);
				opcodesStr = parts.slice(6).join(" ");
			} else {
				fenParts = parts.slice(0, 4);
				opcodesStr = parts.slice(4).join(" ");
			}
		}

		// Nếu FEN chỉ có 4 phần, thêm nửa nước và số nước đi tiêu chuẩn: 0 1
		if (fenParts.length === 4) {
			fenParts.push("0", "1");
		} else if (fenParts.length === 5) {
			fenParts.push("1");
		}

		const fen = fenParts.join(" ");

		// Trích xuất bm (best move)
		const bmMatch = opcodesStr.match(BM_OPCODE_REGEX);
		// Trích xuất id
		const idMatch = opcodesStr.match(ID_OPCODE_REGEX);
		// Trích xuất chú thích c0
		const c0Match = opcodesStr.match(C0_OPCODE_REGEX);

		const rawBm = bmMatch?.[1] ? bmMatch[1].trim() : "";
		const id = idMatch?.[1] ? idMatch[1].trim() : `EPD-${lineNumber}`;
		const comment = c0Match?.[1] ? c0Match[1].trim() : undefined;

		if (!rawBm) {
			errors.push({
				line: lineNumber,
				error: "Không tìm thấy opcode 'bm' (nước đi tốt nhất)",
			});
			continue;
		}

		try {
			const game = new Chess(fen);
			// bm có thể là SAN hoặc UCI (ví dụ: Nxe5, Nf3, e2e4)
			const moveSanOrUci = rawBm.split(WHITESPACE_SPLIT_REGEX)[0];
			if (!moveSanOrUci) {
				errors.push({
					line: lineNumber,
					error: "Không tìm thấy nước đi trong opcode 'bm'",
				});
				continue;
			}

			let moveObj: ReturnType<typeof game.move> | null = null;
			try {
				moveObj = game.move(moveSanOrUci);
			} catch {
				// Thử dạng UCI
			}

			if (!moveObj && moveSanOrUci.length >= 4) {
				const from = moveSanOrUci.slice(0, 2);
				const to = moveSanOrUci.slice(2, 4);
				const promotion =
					moveSanOrUci.length > 4 ? moveSanOrUci.slice(4, 5).toLowerCase() : undefined;
				try {
					moveObj = game.move({ from, to, promotion });
				} catch {
					// Bỏ qua
				}
			}

			if (!moveObj) {
				errors.push({
					line: lineNumber,
					error: `Nước đi ${moveSanOrUci} không hợp lệ trong thế cờ FEN`,
				});
				continue;
			}

			const uciMove = `${moveObj.from}${moveObj.to}${moveObj.promotion || ""}`;
			const turn = fenParts[1] === "w" ? "Trắng" : "Đen";

			items.push({
				title: id,
				fen,
				moves: [uciMove],
				prompt: comment || `${turn} đi trước, tìm nước đi tốt nhất`,
				level: ratingToLevel(1200),
				source: "EPD Import",
			});
		} catch (err) {
			errors.push({
				line: lineNumber,
				error: `Lỗi thế cờ FEN: ${err instanceof Error ? err.message : String(err)}`,
			});
		}
	}

	return { items, errors };
}
