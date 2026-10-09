import { PluginRouteError } from "emdash";
import type { RouteContext } from "emdash";

export interface PuzzlesStatsResponse {
	total: number;
	levels: {
		tot: number;
		ma: number;
		tuong: number;
		xe: number;
		hau: number;
		vua: number;
		[key: string]: number;
	};
}

/**
 * Route: puzzles/stats
 * Yêu cầu quyền: `content:read`
 */
export async function puzzlesStatsHandler(ctx: RouteContext): Promise<PuzzlesStatsResponse> {
	if (!ctx.content) {
		throw new PluginRouteError("NO_CONTENT_ACCESS", "Thiếu quyền truy cập nội dung", 500);
	}

	try {
		const result = await ctx.content.list("chess_puzzles", { limit: 500 });
		const levels: PuzzlesStatsResponse["levels"] = {
			tot: 0,
			ma: 0,
			tuong: 0,
			xe: 0,
			hau: 0,
			vua: 0,
		};

		let total = 0;
		for (const item of result.items) {
			total++;
			const lvl = (item.data?.level as string) || "tot";
			levels[lvl] = (levels[lvl] || 0) + 1;
		}

		return {
			total,
			levels,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "Không thể lấy thống kê câu đố";
		throw new PluginRouteError("STATS_ERROR", message, 500);
	}
}
