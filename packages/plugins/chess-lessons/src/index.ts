import type { PluginAdminConfig, PluginDescriptor, ResolvedPlugin } from "emdash";
import { definePlugin } from "emdash";

import { importObsidianHandler } from "./handlers/import-obsidian.js";
import { lecturesOptionsHandler } from "./handlers/options.js";
import {
	seedCurriculumHandler,
	seedDemoDataHandler,
	seedSampleLessonHandler,
} from "./handlers/seed.js";
import { setupRunHandler } from "./handlers/setup.js";
import { snapshotsRefreshHandler, traverseAndSnapshot } from "./handlers/snapshots.js";
import type { ChessLessonsPluginOptions } from "./types.js";

export const CHESS_LECTURE_BLOCK_FIELDS = [
	{
		type: "select" as const,
		action_id: "lecture",
		label: "Chọn từ ngân hàng bài giảng",
		placeholder: "Tìm và chọn bài giảng cờ vua...",
		options_route: "lectures/options",
		options: [],
	},
	{
		type: "text_input" as const,
		action_id: "title",
		label: "Tiêu đề bài giảng (tùy chọn ghi đè)",
		placeholder: "Ví dụ: Bài Giảng Khai Cuộc Ý Tương Tác",
	},
];

export const CHESS_LESSONS_SETTINGS_SCHEMA: NonNullable<PluginAdminConfig["settingsSchema"]> = {
	defaultOrientation: {
		type: "select",
		label: "Góc nhìn bàn cờ mặc định",
		default: "auto",
		options: [
			{ value: "auto", label: "Tự động theo bên đi" },
			{ value: "white", label: "Góc nhìn quân Trắng" },
			{ value: "black", label: "Góc nhìn quân Đen" },
		],
	},
	showTeacherNotesInPresenter: {
		type: "boolean",
		label: "Hiện ghi chú HLV trong chế độ trình chiếu (chỉ áp dụng cho HLV/Giáo viên)",
		default: true,
	},
};

/**
 * Plugin Descriptor: `chessLessonsPlugin`
 */
export function chessLessonsPlugin(
	options: ChessLessonsPluginOptions = {},
): PluginDescriptor<ChessLessonsPluginOptions> {
	return {
		id: "chess-lessons",
		version: "0.1.0",
		entrypoint: "@duongsinh/plugin-chess-lessons",
		adminEntry: "@duongsinh/plugin-chess-lessons/admin",
		componentsEntry: "@duongsinh/plugin-chess-lessons/astro",
		options,
		capabilities: ["content:read", "content:write"],
		adminPages: [
			{ path: "/lessons", label: "Bài học cờ", icon: "chalkboard-teacher" },
			{ path: "/import-obsidian", label: "Nhập Obsidian", icon: "upload" },
		],
		settingsSchema: CHESS_LESSONS_SETTINGS_SCHEMA,
		portableTextBlocks: [
			{
				type: "chess-lecture",
				label: "Bài giảng cờ vua",
				category: "Cờ vua",
				icon: "presentation",
				description: "Nhúng bài giảng trình chiếu cờ vua tương tác từng bước",
				fields: CHESS_LECTURE_BLOCK_FIELDS,
			},
		],
	};
}

/**
 * Native Plugin Implementation: `createPlugin`
 */
export function createPlugin(_options: ChessLessonsPluginOptions = {}): ResolvedPlugin {
	return definePlugin({
		id: "chess-lessons",
		version: "0.1.0",
		capabilities: ["content:read", "content:write"],

		admin: {
			pages: [
				{ path: "/lessons", label: "Bài học cờ", icon: "chalkboard-teacher" },
				{ path: "/import-obsidian", label: "Nhập Obsidian", icon: "upload" },
			],
			settingsSchema: CHESS_LESSONS_SETTINGS_SCHEMA,
			fieldWidgets: [
				{
					name: "lecture-builder",
					label: "Bộ soạn kịch bản bài giảng cờ vua",
					fieldTypes: ["json"],
				},
				{
					name: "chess-lessons:lecture-builder",
					label: "Bộ soạn kịch bản bài giảng cờ vua",
					fieldTypes: ["json"],
				},
			],
			portableTextBlocks: [
				{
					type: "chess-lecture",
					label: "Bài giảng cờ vua",
					category: "Cờ vua",
					icon: "presentation",
					description: "Nhúng bài giảng trình chiếu cờ vua tương tác từng bước",
					fields: CHESS_LECTURE_BLOCK_FIELDS,
				},
			],
		},

		routes: {
			"setup/run": {
				handler: setupRunHandler,
				permission: "schema:manage",
			},
			"lectures/options": {
				handler: lecturesOptionsHandler,
				permission: "content:create",
			},
			"snapshots/refresh": {
				handler: snapshotsRefreshHandler,
				permission: "content:create",
			},
			"lessons/seed-curriculum": {
				handler: seedCurriculumHandler,
				permission: "content:create",
			},
			"lessons/seed-sample-lesson": {
				handler: seedSampleLessonHandler,
				permission: "content:create",
			},
			"lessons/seed-demo-data": {
				handler: seedDemoDataHandler,
				permission: "content:create",
			},
			"lessons/import-obsidian": {
				handler: importObsidianHandler,
				permission: "content:create",
			},
		},

		hooks: {
			"content:beforeSave": {
				handler: async (event, ctx) => {
					if (event.content) {
						await traverseAndSnapshot(event.content, ctx);
					}
					return event.content;
				},
			},
		},
	});
}

export * from "./types.js";
export * from "./schema/definitions.js";
export * from "./schema/setup.js";
export * from "./handlers/snapshots.js";
export * from "./handlers/seed.js";
export * from "./importers/obsidian.js";

export default createPlugin;
