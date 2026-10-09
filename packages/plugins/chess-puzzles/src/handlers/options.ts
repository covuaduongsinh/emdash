import { PluginRouteError } from "emdash";
import type { RouteContext } from "emdash";
import { z } from "zod";

export const puzzlesOptionsInputSchema = z
	.object({
		search: z.string().optional(),
		level: z.string().optional(),
		limit: z.number().int().min(1).max(100).optional().default(50),
	})
	.optional();

export type PuzzlesOptionsInput = {
	search?: string;
	level?: string;
	limit?: number;
};

export interface PuzzleOptionItem {
	id: string;
	name: string;
	level?: string;
	prompt?: string;
	fen?: string;
}

export interface PuzzlesOptionsResponse {
	items: PuzzleOptionItem[];
}

/**
 * Route: puzzles/options
 * Yêu cầu quyền: `content:create`
 */
export async function puzzlesOptionsHandler(ctx: RouteContext): Promise<PuzzlesOptionsResponse> {
	if (!ctx.content) {
		throw new PluginRouteError("NO_CONTENT_ACCESS", "Thiếu quyền truy cập nội dung", 500);
	}

	const input = (ctx.input as PuzzlesOptionsInput | undefined) || {};
	const limit = input.limit ?? 50;
	const searchKeyword = input.search?.toLowerCase().trim();
	const targetLevel = input.level?.trim();

	try {
		const result = await ctx.content.list("chess_puzzles", {
			limit: 100, // Lấy tập dữ liệu để lọc nếu có tìm kiếm
			orderBy: { created_at: "desc" },
		});

		let filtered = result.items;

		// Lọc theo level nếu được yêu cầu
		if (targetLevel) {
			filtered = filtered.filter((item) => {
				const lvl = item.data?.level as string | undefined;
				return lvl === targetLevel;
			});
		}

		// Lọc theo từ khóa tìm kiếm (tiêu đề, prompt, id)
		if (searchKeyword) {
			filtered = filtered.filter((item) => {
				const title = String(item.data?.title || item.slug || "").toLowerCase();
				const prompt = String(item.data?.prompt || "").toLowerCase();
				const id = item.id.toLowerCase();
				return (
					title.includes(searchKeyword) ||
					prompt.includes(searchKeyword) ||
					id.includes(searchKeyword)
				);
			});
		}

		const items: PuzzleOptionItem[] = filtered.slice(0, limit).map((item) => {
			const data = item.data || {};
			const puzzleObj = data.puzzle as { fen?: string } | undefined;
			const title = String(data.title || item.slug || `Câu đố #${item.id}`);
			const level = data.level ? String(data.level) : undefined;
			const prompt = data.prompt ? String(data.prompt) : undefined;
			const fen = puzzleObj?.fen ? String(puzzleObj.fen) : undefined;

			return {
				id: item.id,
				name: level ? `[${level.toUpperCase()}] ${title}` : title,
				level,
				prompt,
				fen,
			};
		});

		return { items };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Không thể tải danh sách câu đố";
		throw new PluginRouteError("PUZZLES_OPTIONS_ERROR", message, 500);
	}
}
