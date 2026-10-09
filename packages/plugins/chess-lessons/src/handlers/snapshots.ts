import { PluginRouteError } from "emdash";
import type { PluginContext, RouteContext } from "emdash";
import { z } from "zod";

import type { ChessLectureScript, LectureStep } from "../types.js";

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
 * Cập nhật snapshot cho một node khối Portable Text `chess-lecture`.
 * ĐẢM BẢO LOẠI BỎ HOÀN TOÀN `teacherNotes` để không lộ ghi chú của HLV ra ngoài.
 */
export async function snapshotLectureNode(
	node: Record<string, unknown>,
	ctx: { content?: PluginContext["content"]; log?: PluginContext["log"] },
): Promise<boolean> {
	if (node._type !== "chess-lecture") return false;

	const lectureId = (node.lecture as string) || (node.lectureId as string);
	if (!lectureId || !ctx.content) return false;

	try {
		const record = await ctx.content.get("chess_lectures", lectureId);
		if (!record || !record.data) {
			ctx.log?.warn?.(`[chess-lessons] Không tìm thấy bài giảng #${lectureId} để tạo snapshot`);
			return false;
		}

		const data = record.data as Record<string, unknown>;

		let scriptObj: ChessLectureScript = { steps: [] };
		if (typeof data.script === "string") {
			try {
				scriptObj = JSON.parse(data.script);
			} catch {
				scriptObj = { steps: [] };
			}
		} else if (data.script && typeof data.script === "object") {
			scriptObj = data.script as ChessLectureScript;
		}

		// Lọc bỏ hoàn toàn teacherNotes khỏi mọi step trong snapshot
		const rawSteps = Array.isArray(scriptObj.steps) ? scriptObj.steps : [];
		const sanitizedSteps: LectureStep[] = rawSteps.map((s) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { teacherNotes, ...safeStep } = s;
			return safeStep as LectureStep;
		});

		// Gán snapshot an toàn vào node của Portable Text
		if (data.title && !node.title) {
			node.title = data.title;
		}
		if (data.summary) {
			node.summary = data.summary;
		}
		if (data.level) {
			node.level = data.level;
		}
		node.steps = sanitizedSteps;

		return true;
	} catch (err) {
		ctx.log?.warn?.(
			`[chess-lessons] Lỗi khi tạo snapshot bài giảng #${lectureId}: ${err instanceof Error ? err.message : String(err)}`,
		);
		return false;
	}
}

/**
 * Duyệt đệ quy qua cây Portable Text để tạo snapshot cho các khối bài giảng.
 */
export async function traverseAndSnapshot(
	target: unknown,
	ctx: { content?: PluginContext["content"]; log?: PluginContext["log"] },
): Promise<number> {
	let count = 0;

	if (!target || typeof target !== "object") return 0;

	if (Array.isArray(target)) {
		for (const item of target) {
			count += await traverseAndSnapshot(item, ctx);
		}
		return count;
	}

	const obj = target as Record<string, unknown>;

	if (obj._type === "chess-lecture") {
		const updated = await snapshotLectureNode(obj, ctx);
		if (updated) count++;
	}

	for (const key of Object.keys(obj)) {
		if (key !== "steps" && typeof obj[key] === "object" && obj[key] !== null) {
			count += await traverseAndSnapshot(obj[key], ctx);
		}
	}

	return count;
}

/**
 * Route: snapshots/refresh
 * Yêu cầu quyền: `content:create`
 */
export async function snapshotsRefreshHandler(ctx: RouteContext): Promise<SnapshotsRefreshResult> {
	if (!ctx.content) {
		throw new PluginRouteError("NO_CONTENT_ACCESS", "Thiếu quyền truy cập nội dung", 500);
	}

	const contentWithWrite = ctx.content as unknown as {
		update: (collection: string, id: string, data: Record<string, unknown>) => Promise<unknown>;
		list: (
			collection: string,
			options?: { limit?: number },
		) => Promise<{ items: Array<{ id: string; data?: Record<string, unknown> }> }>;
	};

	const input = (ctx.input as SnapshotsRefreshInput) || {};
	const collectionsToScan = input.collections || ["lessons", "posts"];
	let totalUpdated = 0;
	const scanned: string[] = [];

	for (const colSlug of collectionsToScan) {
		try {
			const list = await contentWithWrite.list(colSlug, { limit: 100 });
			scanned.push(colSlug);

			for (const item of list.items) {
				if (input.contentId && item.id !== input.contentId) {
					continue;
				}

				let modified = false;
				const data = item.data ? { ...item.data } : {};

				for (const fieldKey of Object.keys(data)) {
					const fieldVal = data[fieldKey];
					if (fieldVal && (Array.isArray(fieldVal) || typeof fieldVal === "object")) {
						const snapshotCount = await traverseAndSnapshot(fieldVal, ctx);
						if (snapshotCount > 0) {
							modified = true;
						}
					}
				}

				if (modified) {
					await contentWithWrite.update(colSlug, item.id, {
						...data,
					});
					totalUpdated++;
				}
			}
		} catch (err) {
			ctx.log?.warn?.(
				`[chess-lessons] Lỗi khi quét collection ${colSlug} để làm mới snapshot: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	return {
		success: true,
		updatedCount: totalUpdated,
		collectionsScanned: scanned,
	};
}
