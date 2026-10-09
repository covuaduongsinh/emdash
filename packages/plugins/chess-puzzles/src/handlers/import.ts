import { PluginRouteError } from "emdash";
import type { RouteContext } from "emdash";
import { z } from "zod";

import { parseEpd } from "../importers/epd.js";
import { parseLichessCsv } from "../importers/lichess-csv.js";
import { parsePgnPuzzles } from "../importers/pgn.js";
import type { PuzzleImportItem, PuzzleImportResult } from "../types.js";

export const puzzlesImportInputSchema = z.object({
	format: z.enum(["csv", "epd", "pgn"]),
	data: z.string().min(1, "Nội dung dữ liệu không được trống"),
	defaultLevel: z.string().optional(),
	autoPublish: z.boolean().optional().default(false),
});

export type PuzzlesImportInput = z.infer<typeof puzzlesImportInputSchema>;

/**
 * Route: puzzles/import
 * Yêu cầu quyền: `content:create`
 */
export async function puzzlesImportHandler(ctx: RouteContext): Promise<PuzzleImportResult> {
	if (
		!ctx.content ||
		typeof (ctx.content as unknown as { create?: unknown }).create !== "function"
	) {
		throw new PluginRouteError("NO_CONTENT_WRITE_ACCESS", "Thiếu quyền ghi nội dung", 500);
	}

	const input = ctx.input as PuzzlesImportInput;
	let parsedItems: PuzzleImportItem[] = [];
	let parseErrors: Array<{ line: number; error: string }> = [];

	if (input.format === "csv") {
		const res = parseLichessCsv(input.data);
		parsedItems = res.items;
		parseErrors = res.errors;
	} else if (input.format === "epd") {
		const res = parseEpd(input.data);
		parsedItems = res.items;
		parseErrors = res.errors;
	} else if (input.format === "pgn") {
		const res = parsePgnPuzzles(input.data);
		parsedItems = res.items;
		parseErrors = res.errors;
	}

	// Giới hạn số lượng tối đa 500 câu đố trong 1 lần nhập
	if (parsedItems.length > 500) {
		parsedItems = parsedItems.slice(0, 500);
		parseErrors.push({
			line: 501,
			error: "Đã vượt quá giới hạn 500 câu/lô, chỉ xử lý 500 câu đầu tiên",
		});
	}

	const contentWithWrite = ctx.content as unknown as {
		create: (
			collection: string,
			item: { data: Record<string, unknown>; status?: string },
		) => Promise<{ id: string }>;
	};

	let imported = 0;
	const errors = [...parseErrors];

	let index = 0;
	// Tạo các câu đố theo lô
	for (const item of parsedItems) {
		index++;
		const level = item.level || input.defaultLevel || "tot";
		const fen = item.fen;
		const moves = item.moves;
		const turn = fen.split(" ")[1] === "w" ? "white" : "black";

		try {
			await contentWithWrite.create("chess_puzzles", {
				data: {
					title: item.title || `Câu đố #${index}`,
					puzzle: {
						fen,
						moves,
						solution: moves,
						orientation: turn,
					},
					prompt: item.prompt,
					level,
					themes: item.themes,
					rating: item.rating,
					hint: item.hint,
					source: item.source,
				},
				status: input.autoPublish ? "published" : "draft",
			});
			imported++;
		} catch (err) {
			errors.push({
				line: index,
				error: `Lỗi lưu câu đố ${item.title}: ${err instanceof Error ? err.message : String(err)}`,
			});
		}
	}

	return {
		totalParsed: parsedItems.length,
		imported,
		errors,
	};
}
