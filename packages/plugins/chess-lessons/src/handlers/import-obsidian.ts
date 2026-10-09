import { PluginRouteError } from "emdash";
import type { RouteContext } from "emdash";
import { ulid } from "ulidx";
import { z } from "zod";

import { parseObsidianMarkdown } from "../importers/obsidian.js";
import type { ObsidianImportResult } from "../types.js";

export const importObsidianInputSchema = z.object({
	markdown: z.string().min(1, "Nội dung Markdown không được để trống"),
	courseId: z.string().optional(),
	moduleId: z.string().optional(),
	status: z.enum(["draft", "published"]).optional().default("draft"),
});

export type ImportObsidianInput = z.infer<typeof importObsidianInputSchema>;

/**
 * Tạo slug an toàn từ chuỗi tiếng Việt.
 */
function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[đĐ]/g, "d")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60);
}

/**
 * Route: lessons/import-obsidian
 * Yêu cầu quyền: `content:create`
 */
export async function importObsidianHandler(ctx: RouteContext): Promise<ObsidianImportResult> {
	if (
		!ctx.content ||
		typeof (ctx.content as unknown as { create?: unknown }).create !== "function"
	) {
		throw new PluginRouteError("NO_CONTENT_WRITE_ACCESS", "Thiếu quyền ghi nội dung", 500);
	}

	const contentWithWrite = ctx.content as unknown as {
		create: (collection: string, data: Record<string, unknown>) => Promise<{ id: string }>;
		list: (
			collection: string,
			options?: { limit?: number },
		) => Promise<{ items: Array<{ id: string; data?: Record<string, unknown> }> }>;
	};

	const input = (ctx.input as ImportObsidianInput) || {};
	const markdown = input.markdown || "";

	if (!markdown.trim()) {
		throw new PluginRouteError("EMPTY_CONTENT", "Nội dung Markdown không được để trống", 400);
	}

	const { frontmatter, blocks, warnings } = parseObsidianMarkdown(markdown);
	const title = frontmatter.title || "Bài học cờ vua mới";

	// 1. Xác định Khóa học
	let courseId = input.courseId;
	if (!courseId && frontmatter.course) {
		const courses = await contentWithWrite.list("courses", { limit: 100 });
		const found = courses.items.find(
			(c) => c.data?.slug === frontmatter.course || c.id === frontmatter.course,
		);
		if (found) {
			courseId = found.id;
		} else {
			// Tự động tạo khóa học nếu chưa tồn tại
			courseId = ulid();
			await contentWithWrite.create("courses", {
				id: courseId,
				slug: slugify(frontmatter.course),
				title: `Khóa học: ${frontmatter.course}`,
				level: frontmatter.level || "ma",
				status: "draft",
			});
		}
	}

	// 2. Xác định Chương (Module)
	let moduleId = input.moduleId;
	if (!moduleId && courseId && frontmatter.module) {
		const modules = await contentWithWrite.list("modules", { limit: 100 });
		const found = modules.items.find(
			(m) => m.data?.course_id === courseId && m.data?.title === frontmatter.module,
		);
		if (found) {
			moduleId = found.id;
		} else {
			// Tự động tạo chương mới
			moduleId = ulid();
			await contentWithWrite.create("modules", {
				id: moduleId,
				course_id: courseId,
				title: frontmatter.module,
				sort_order: 1,
				status: "draft",
			});
		}
	}

	// 3. Tạo bài học mới ở trạng thái NHÁP
	const lessonId = ulid();
	const baseSlug = slugify(title);
	const lessonSlug = `${baseSlug}-${lessonId.slice(-6).toLowerCase()}`;

	await contentWithWrite.create("lessons", {
		id: lessonId,
		slug: lessonSlug,
		title,
		content: blocks,
		course_id: courseId,
		module_id: moduleId,
		sort_order: frontmatter.order || 1,
		level: frontmatter.level || "ma",
		themes: frontmatter.themes || undefined,
		objectives: frontmatter.objectives || undefined,
		status: "draft",
	});

	return {
		success: true,
		lessonId,
		courseId,
		moduleId,
		title,
		warnings,
		blocksCount: blocks.length,
		status: "draft",
	};
}
