import type { PluginAdminConfig, PluginDescriptor, ResolvedPlugin } from "emdash";
import { definePlugin } from "emdash";

import { puzzlesImportHandler } from "./handlers/import.js";
import { puzzlesOptionsHandler } from "./handlers/options.js";
import { puzzlesSeedHandler, SAMPLE_SIX_LEVEL_PUZZLES } from "./handlers/seed.js";
import { setupRunHandler } from "./handlers/setup.js";
import { snapshotsRefreshHandler, traverseAndSnapshot } from "./handlers/snapshots.js";
import { puzzlesStatsHandler } from "./handlers/stats.js";
import type { ChessPuzzlesPluginOptions } from "./types.js";

export const CHESS_PUZZLE_BLOCK_FIELDS = [
	{
		type: "select" as const,
		action_id: "puzzle",
		label: "Chọn từ ngân hàng câu đố",
		placeholder: "Tìm và chọn câu đố...",
		options_route: "puzzles/options",
		options: [],
	},
	{
		type: "text_input" as const,
		action_id: "prompt",
		label: "Yêu cầu / Câu hỏi (tùy chọn ghi đè)",
		placeholder: "Ví dụ: Trắng đi trước và chiếu hết sau 2 nước",
	},
	{
		type: "text_input" as const,
		action_id: "hint",
		label: "Gợi ý (tùy chọn)",
		placeholder: "Ví dụ: Chú ý đòn tấn công đôi của Mã",
	},
	{
		type: "text_input" as const,
		action_id: "fen",
		label: "FEN (nhập nhanh nếu không chọn từ kho)",
		placeholder: "r1bqkbnr/pppp1ppp/...",
	},
	{
		type: "text_input" as const,
		action_id: "solution",
		label: "Nước giải UCI (nhập nhanh, vd: e2e4 e7e5)",
		placeholder: "e2e4 e7e5",
	},
];

export const CHESS_PUZZLES_SETTINGS_SCHEMA: NonNullable<PluginAdminConfig["settingsSchema"]> = {
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
	revealAfterFailures: {
		type: "number",
		label: "Hiện gợi ý/đáp án sau số lần giải sai",
		default: 3,
		min: 1,
		max: 10,
	},
	showRating: {
		type: "boolean",
		label: "Hiển thị điểm Elo trên bàn cờ",
		default: true,
	},
};

/**
 * Plugin Descriptor: `chessPuzzlesPlugin`
 */
export function chessPuzzlesPlugin(
	options: ChessPuzzlesPluginOptions = {},
): PluginDescriptor<ChessPuzzlesPluginOptions> {
	return {
		id: "chess-puzzles",
		version: "0.1.0",
		entrypoint: "@duongsinh/plugin-chess-puzzles",
		adminEntry: "@duongsinh/plugin-chess-puzzles/admin",
		componentsEntry: "@duongsinh/plugin-chess-puzzles/astro",
		options,
		capabilities: ["content:read", "content:write"],
		adminPages: [
			{ path: "/puzzles", label: "Câu đố", icon: "sparkle" },
			{ path: "/import", label: "Nhập câu đố", icon: "upload" },
		],
		settingsSchema: CHESS_PUZZLES_SETTINGS_SCHEMA,
		portableTextBlocks: [
			{
				type: "chess-puzzle",
				label: "Câu đố cờ vua",
				category: "Cờ vua",
				icon: "sparkle",
				description: "Nhúng bài tập câu đố chiến thuật tương tác",
				fields: CHESS_PUZZLE_BLOCK_FIELDS,
			},
		],
	};
}

/**
 * Native Plugin Implementation: `createPlugin`
 */
export function createPlugin(_options: ChessPuzzlesPluginOptions = {}): ResolvedPlugin {
	return definePlugin({
		id: "chess-puzzles",
		version: "0.1.0",
		capabilities: ["content:read", "content:write"],

		admin: {
			pages: [
				{ path: "/puzzles", label: "Câu đố", icon: "sparkle" },
				{ path: "/import", label: "Nhập câu đố", icon: "upload" },
			],
			settingsSchema: CHESS_PUZZLES_SETTINGS_SCHEMA,
			fieldWidgets: [
				{
					name: "puzzle-editor",
					label: "Bộ soạn câu đố cờ vua",
					fieldTypes: ["json"],
				},
				{
					name: "chess-puzzles:puzzle-editor",
					label: "Bộ soạn câu đố cờ vua",
					fieldTypes: ["json"],
				},
			],
			portableTextBlocks: [
				{
					type: "chess-puzzle",
					label: "Câu đố cờ vua",
					category: "Cờ vua",
					icon: "sparkle",
					description: "Nhúng bài tập câu đố chiến thuật tương tác",
					fields: CHESS_PUZZLE_BLOCK_FIELDS,
				},
			],
		},

		routes: {
			"setup/run": {
				handler: setupRunHandler,
				permission: "schema:manage",
			},
			"puzzles/options": {
				handler: puzzlesOptionsHandler,
				permission: "content:create",
			},
			"puzzles/import": {
				handler: puzzlesImportHandler,
				permission: "content:create",
			},
			"puzzles/seed": {
				handler: puzzlesSeedHandler,
				permission: "content:create",
			},
			"puzzles/stats": {
				handler: puzzlesStatsHandler,
				permission: "content:read",
			},
			"snapshots/refresh": {
				handler: snapshotsRefreshHandler,
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
export * from "./importers/lichess-csv.js";
export * from "./importers/epd.js";
export * from "./importers/pgn.js";
export * from "./importers/rating-level.js";

export default createPlugin;
