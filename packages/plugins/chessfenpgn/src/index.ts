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
			pages: [
				{
					path: "/editor",
					label: "Bàn cờ",
					icon: "grid",
				},
			],
			portableTextBlocks: [
				{
					type: "chess-fen",
					label: "Chess (FEN)",
					category: "Cờ vua",
					icon: "grid",
					description: "Hiển thị thế cờ tĩnh từ chuỗi FEN",
					fields: [
						{
							type: "text_input",
							action_id: "fen",
							label: "Chuỗi FEN thô",
							placeholder: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
						},
						{
							type: "select",
							action_id: "orientation",
							label: "Góc nhìn bàn cờ",
							options: [
								{ label: "Bên Trắng (Mặc định)", value: "white" },
								{ label: "Bên Đen", value: "black" },
								{ label: "Tự động theo bên đi", value: "auto" },
							],
							initial_value: "white",
						},
						{
							type: "text_input",
							action_id: "caption",
							label: "Chú thích thế cờ",
							placeholder: "Ví dụ: Thế cờ chiếu bí sau 2 nước",
						},
						{
							type: "text_input",
							action_id: "arrows",
							label: "Mũi tên chỉ dẫn (vd: e2e4 g1f3:red)",
							placeholder: "e2e4 g1f3:red",
						},
						{
							type: "text_input",
							action_id: "highlights",
							label: "Ô tô sáng (vd: e4 d5)",
							placeholder: "e4 d5",
						},
						{
							type: "select",
							action_id: "size",
							label: "Kích thước bàn cờ",
							options: [
								{ label: "Nhỏ (S - 320px)", value: "S" },
								{ label: "Vừa (M - 460px)", value: "M" },
								{ label: "Lớn (L - 600px)", value: "L" },
							],
							initial_value: "M",
						},
					],
				},
				{
					type: "chess-pgn",
					label: "Chess (PGN)",
					category: "Cờ vua",
					icon: "play",
					description: "Hiển thị diễn biến ván cờ từ chuỗi PGN",
					fields: [
						{
							type: "text_input",
							action_id: "pgn",
							label: "Chuỗi PGN thô",
							multiline: true,
							placeholder: "1. e4 e5 2. Nf3 Nc6...",
						},
						{
							type: "select",
							action_id: "orientation",
							label: "Góc nhìn bàn cờ",
							options: [
								{ label: "Bên Trắng (Mặc định)", value: "white" },
								{ label: "Bên Đen", value: "black" },
							],
							initial_value: "white",
						},
						{
							type: "number_input",
							action_id: "startPly",
							label: "Nước đi bắt đầu (ply)",
							initial_value: 0,
						},
						{
							type: "select",
							action_id: "showHeaders",
							label: "Hiện thông tin ván đấu (Header)",
							options: [
								{ label: "Có", value: "true" },
								{ label: "Không", value: "false" },
							],
							initial_value: "true",
						},
						{
							type: "text_input",
							action_id: "caption",
							label: "Chú thích ván đấu",
							placeholder: "Ví dụ: Ván cờ bất hủ Kasparov vs Topalov",
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
