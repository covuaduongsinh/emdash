import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";

export function chessfenpgnPlugin(): PluginDescriptor {
	return {
		id: "chessfenpgn",
		version: "0.1.0",
		entrypoint: "@emdash-cms/plugin-chessfenpgn",
		adminEntry: "@emdash-cms/plugin-chessfenpgn/admin",
		componentsEntry: "@emdash-cms/plugin-chessfenpgn/astro",
	};
}

export function createPlugin() {
	return definePlugin({
		id: "chessfenpgn",
		version: "0.1.0",
		admin: {
			entry: "@emdash-cms/plugin-chessfenpgn/admin",
			portableTextBlocks: [
				{
					type: "chess-fen",
					label: "Chess (FEN)",
					icon: "grid",
					description: "Hiển thị thế cờ tĩnh từ chuỗi FEN",
					fields: [
						{
							type: "text_input",
							action_id: "fen",
							label: "Chuỗi FEN thô",
							placeholder: "rnbqkbnr/pppppppp/8/...",
						},
					],
				},
				{
					type: "chess-pgn",
					label: "Chess (PGN)",
					icon: "play",
					description: "Hiển thị diễn biến ván cờ từ chuỗi PGN",
					fields: [
						{
							type: "text_input",
							action_id: "pgn",
							label: "Chuỗi PGN thô",
							multiline: true,
							placeholder: "1. e4 e5...",
						},
					],
				},
			],
			fieldWidgets: [
				{
					name: "chess-board",
					label: "Bàn cờ kéo thả (FEN/PGN)",
					fieldTypes: ["string", "text", "json"],
				},
			],
		},
	});
}

export default createPlugin;
