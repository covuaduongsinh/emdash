import { parsePgn } from "@duongsinh/chess-kit/core";

import type { PuzzleImportItem } from "../types.js";
import { ratingToLevel } from "./rating-level.js";

export interface ParsePgnPuzzlesResult {
	items: PuzzleImportItem[];
	errors: Array<{ line: number; error: string }>;
}

export function parsePgnPuzzles(pgnContent: string): ParsePgnPuzzlesResult {
	const items: PuzzleImportItem[] = [];
	const errors: Array<{ line: number; error: string }> = [];

	// Tách các ván PGN bằng [Event hoặc dòng trống kép
	const rawGames = pgnContent
		.split(/(?=\[Event\s+)/gi)
		.map((g) => g.trim())
		.filter(Boolean);

	if (rawGames.length === 0 && pgnContent.trim()) {
		rawGames.push(pgnContent.trim());
	}

	let gameIndex = 0;
	for (const rawGame of rawGames) {
		gameIndex++;
		try {
			const parsed = parsePgn(rawGame);
			const headers = parsed.headers || {};
			const eventName = headers.Event;
			const whiteName = headers.White;
			const blackName = headers.Black;
			const ratingStr = headers.Rating || headers.WhiteElo || headers.BlackElo;
			const rating = ratingStr ? Number.parseInt(ratingStr, 10) : undefined;

			const title =
				eventName && eventName !== "?"
					? eventName
					: whiteName && blackName
						? `${whiteName} vs ${blackName}`
						: `Câu đố PGN #${gameIndex}`;

			const startFen =
				parsed.startFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
			const uciMoves = parsed.tree.moves.map((m) => m.uci).filter(Boolean);

			if (uciMoves.length === 0) {
				errors.push({
					line: gameIndex,
					error: `Ván cờ #${gameIndex} không có nước đi nào`,
				});
				continue;
			}

			const turn = startFen.split(" ")[1] === "w" ? "Trắng" : "Đen";

			items.push({
				title,
				fen: startFen,
				moves: uciMoves,
				rating: Number.isNaN(rating) ? undefined : rating,
				level: ratingToLevel(rating),
				prompt: `${turn} đi trước, tìm nước đi tốt nhất`,
				source: "PGN Import",
			});
		} catch (err) {
			errors.push({
				line: gameIndex,
				error: `Lỗi PGN #${gameIndex}: ${err instanceof Error ? err.message : String(err)}`,
			});
		}
	}

	return { items, errors };
}
