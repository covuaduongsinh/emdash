import { Chess } from "chess.js";

import type { PuzzleImportItem } from "../types.js";
import { ratingToLevel } from "./rating-level.js";

export interface ParseCsvResult {
	items: PuzzleImportItem[];
	errors: Array<{ line: number; error: string }>;
}

const LINE_SPLIT_REGEX = /\r?\n/;
const WHITESPACE_SPLIT_REGEX = /\s+/;

export function parseLichessCsv(csvContent: string): ParseCsvResult {
	const lines = csvContent.split(LINE_SPLIT_REGEX);
	const items: PuzzleImportItem[] = [];
	const errors: Array<{ line: number; error: string }> = [];

	let lineNumber = 0;
	for (const rawLine of lines) {
		lineNumber++;
		const line = rawLine.trim();
		if (!line) continue;

		// Bỏ qua header
		if (lineNumber === 1 && line.toLowerCase().startsWith("puzzleid,")) {
			continue;
		}

		// Split bằng dấu phẩy
		const cols = line.split(",");
		if (cols.length < 3) {
			errors.push({
				line: lineNumber,
				error: "Dòng không đủ số cột tối thiểu (PuzzleId, FEN, Moves)",
			});
			continue;
		}

		const puzzleId = cols[0]?.trim() || "";
		const rawFen = cols[1]?.trim() || "";
		const rawMoves = cols[2]?.trim() || "";
		const rating = cols[3] ? Number.parseInt(cols[3].trim(), 10) : undefined;
		const themes = cols[7] ? cols[7].trim() : undefined;
		const gameUrl = cols[8] ? cols[8].trim() : undefined;

		if (!rawFen || !rawMoves) {
			errors.push({
				line: lineNumber,
				error: "FEN hoặc dãy nước đi (Moves) bị trống",
			});
			continue;
		}

		const moves = rawMoves.split(WHITESPACE_SPLIT_REGEX).filter(Boolean);
		if (moves.length === 0) {
			errors.push({
				line: lineNumber,
				error: "Không tìm thấy nước đi hợp lệ trong Moves",
			});
			continue;
		}

		try {
			const game = new Chess(rawFen);
			let startFen = rawFen;
			let solutionMoves = moves;

			// Trong Lichess CSV, nước đi đầu tiên thường là nước dẫn của đối thủ
			if (moves.length >= 2 && moves[0]) {
				const leadMove = moves[0];
				const from = leadMove.slice(0, 2);
				const to = leadMove.slice(2, 4);
				const promotion = leadMove.length > 4 ? leadMove.slice(4, 5).toLowerCase() : undefined;

				const res = game.move({ from, to, promotion });
				if (res) {
					startFen = game.fen();
					solutionMoves = moves.slice(1);
				}
			}

			const level = ratingToLevel(rating);
			const turn = game.turn() === "w" ? "Trắng" : "Đen";
			let prompt = `${turn} đi trước, tìm nước đi tốt nhất`;
			if (themes?.includes("mateIn1")) {
				prompt = `${turn} đi trước và chiếu hết sau 1 nước`;
			} else if (themes?.includes("mateIn2")) {
				prompt = `${turn} đi trước và chiếu hết sau 2 nước`;
			} else if (themes?.includes("mateIn3")) {
				prompt = `${turn} đi trước và chiếu hết sau 3 nước`;
			}

			items.push({
				title: `Câu đố #${puzzleId}${themes ? ` (${themes.split(" ")[0]})` : ""}`,
				fen: startFen,
				moves: solutionMoves,
				rating: Number.isNaN(rating) ? undefined : rating,
				level,
				themes,
				prompt,
				source: gameUrl || (puzzleId ? `Lichess #${puzzleId}` : "Lichess"),
			});
		} catch (err) {
			errors.push({
				line: lineNumber,
				error: `Lỗi FEN hoặc nước đi không hợp lệ: ${err instanceof Error ? err.message : String(err)}`,
			});
		}
	}

	return { items, errors };
}
