import { PluginRouteError } from "emdash";
import type { PluginContext, RouteContext } from "emdash";
import { z } from "zod";

export const snapshotsRefreshInputSchema = z
	.object({
		collections: z.array(z.string()).optional(),
		contentId: z.string().optional(),
	})
	.optional();

export type SnapshotsRefreshInput = z.infer<typeof snapshotsRefreshInputSchema>;

export interface SnapshotsRefreshResult {
	success: boolean;
	updatedCount: number;
	collectionsScanned: string[];
}

/**
 * Cập nhật snapshot cho một node khối Portable Text `chess-puzzle`.
 */
export async function snapshotPuzzleNode(
	node: Record<string, unknown>,
	ctx: { content?: PluginContext["content"]; log?: PluginContext["log"] },
): Promise<boolean> {
	if (node._type !== "chess-puzzle") return false;

	const puzzleId = (node.puzzle as string) || (node.puzzleId as string);
	if (!puzzleId || !ctx.content) return false;

	try {
		const puzzleRecord = await ctx.content.get("chess_puzzles", puzzleId);
		if (!puzzleRecord || !puzzleRecord.data) {
			ctx.log?.warn?.(`[chess-puzzles] Không tìm thấy câu đố #${puzzleId} để tạo snapshot`);
			return false;
		}

		const data = puzzleRecord.data as Record<string, unknown>;
		const puzzleObj = (data.puzzle as Record<string, unknown>) || {};

		// Snapshot các thông tin cần thiết vào thẳng node của block
		if (puzzleObj.fen) node.fen = puzzleObj.fen;
		if (puzzleObj.solution || puzzleObj.moves) {
			node.solution = puzzleObj.solution || puzzleObj.moves;
		}
		if (puzzleObj.orientation) node.orientation = puzzleObj.orientation;
		if (data.prompt) node.prompt = data.prompt;
		if (data.hint) node.hint = data.hint;
		if (data.level) node.level = data.level;
		if (data.title) node.title = data.title;
		if (data.explanation) node.explanation = data.explanation;

		return true;
	} catch (err) {
		ctx.log?.warn?.(
			`[chess-puzzles] Lỗi khi tạo snapshot câu đố #${puzzleId}: ${err instanceof Error ? err.message : String(err)}`,
		);
		return false;
	}
}

/**
 * Duyệt đệ quy qua cây Portable Text để tạo snapshot cho các khối câu đố.
 */
export async function traverseAndSnapshot(
	target: unknown,
	ctx: { content?: PluginContext["content"]; log?: PluginContext["log"] },
): Promise<number> {
	let count = 0;
	if (!target || typeof target !== "object") return count;

	if (Array.isArray(target)) {
		for (const item of target) {
			if (item && typeof item === "object") {
				if ((item as Record<string, unknown>)._type === "chess-puzzle") {
					const updated = await snapshotPuzzleNode(item as Record<string, unknown>, ctx);
					if (updated) count++;
				} else {
					count += await traverseAndSnapshot(item, ctx);
				}
			}
		}
	} else {
		for (const key of Object.keys(target as Record<string, unknown>)) {
			const val = (target as Record<string, unknown>)[key];
			if (val && typeof val === "object") {
				count += await traverseAndSnapshot(val, ctx);
			}
		}
	}

	return count;
}

/**
 * Route: snapshots/refresh
 * Yêu cầu quyền: `content:create`
 */
export async function snapshotsRefreshHandler(ctx: RouteContext): Promise<SnapshotsRefreshResult> {
	if (
		!ctx.content ||
		typeof (ctx.content as unknown as { update?: unknown }).update !== "function"
	) {
		throw new PluginRouteError("NO_CONTENT_WRITE_ACCESS", "Thiếu quyền ghi nội dung", 500);
	}

	const input = (ctx.input as SnapshotsRefreshInput) || {};
	const collectionsToScan = input.collections || ["lessons", "posts", "pages", "courses"];
	let totalUpdated = 0;
	const scanned: string[] = [];

	const contentWithWrite = ctx.content as unknown as {
		list: (
			collection: string,
			opts?: unknown,
		) => Promise<{ items: Array<{ id: string; data: Record<string, unknown> }> }>;
		update: (
			collection: string,
			id: string,
			item: { data: Record<string, unknown> },
		) => Promise<unknown>;
		get: (
			collection: string,
			id: string,
		) => Promise<{ id: string; data: Record<string, unknown> } | null>;
	};

	for (const collection of collectionsToScan) {
		try {
			const listRes = await contentWithWrite.list(collection, { limit: 100 });
			scanned.push(collection);

			for (const item of listRes.items) {
				if (input.contentId && item.id !== input.contentId) continue;

				const dataClone = JSON.parse(JSON.stringify(item.data || {}));
				const updatedInItem = await traverseAndSnapshot(dataClone, {
					content: ctx.content,
					log: ctx.log,
				});

				if (updatedInItem > 0) {
					await contentWithWrite.update(collection, item.id, { data: dataClone });
					totalUpdated += updatedInItem;
				}
			}
		} catch {
			// Bỏ qua nếu collection không tồn tại
		}
	}

	return {
		success: true,
		updatedCount: totalUpdated,
		collectionsScanned: scanned,
	};
}
