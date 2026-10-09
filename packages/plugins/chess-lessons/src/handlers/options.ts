import { PluginRouteError } from "emdash";
import type { RouteContext } from "emdash";
import { z } from "zod";

export const lecturesOptionsInputSchema = z
	.object({
		search: z.string().optional(),
		level: z.string().optional(),
		limit: z.number().int().min(1).max(100).optional().default(50),
	})
	.optional();

export type LecturesOptionsInput = {
	search?: string;
	level?: string;
	limit?: number;
};

export interface LectureOptionItem {
	id: string;
	name: string;
	level?: string;
	summary?: string;
	course?: string;
}

export interface LecturesOptionsResponse {
	items: LectureOptionItem[];
}

/**
 * Route: lectures/options
 * Yêu cầu quyền: `content:create`
 */
export async function lecturesOptionsHandler(ctx: RouteContext): Promise<LecturesOptionsResponse> {
	if (!ctx.content) {
		throw new PluginRouteError("NO_CONTENT_ACCESS", "Thiếu quyền truy cập nội dung", 500);
	}

	const input = (ctx.input as LecturesOptionsInput | undefined) || {};
	const limit = input.limit ?? 50;
	const searchKeyword = input.search?.toLowerCase().trim();
	const targetLevel = input.level?.trim();

	try {
		const result = await ctx.content.list("chess_lectures", {
			limit: 100,
			orderBy: { created_at: "desc" },
		});

		let filtered = result.items;

		// Lọc theo level nếu có
		if (targetLevel) {
			filtered = filtered.filter((item) => {
				const lvl = item.data?.level as string | undefined;
				return lvl === targetLevel;
			});
		}

		// Lọc theo từ khóa tìm kiếm nếu có
		if (searchKeyword) {
			filtered = filtered.filter((item) => {
				const title = String(item.data?.title || "").toLowerCase();
				const summary = String(item.data?.summary || "").toLowerCase();
				return title.includes(searchKeyword) || summary.includes(searchKeyword);
			});
		}

		const items: LectureOptionItem[] = filtered.slice(0, limit).map((item) => {
			const data = item.data || {};
			const title = (data.title as string) || `Bài giảng #${item.id}`;
			const level = (data.level as string) || undefined;
			const summary = (data.summary as string) || undefined;
			const course = (data.course as string) || undefined;

			return {
				id: item.id,
				name: level ? `[${level.toUpperCase()}] ${title}` : title,
				level,
				summary,
				course,
			};
		});

		return { items };
	} catch (err) {
		ctx.log?.warn?.(
			`[chess-lessons] Lỗi khi lấy danh sách options bài giảng: ${err instanceof Error ? err.message : String(err)}`,
		);
		return { items: [] };
	}
}
