import type { CreateCollectionInput, CreateFieldInput } from "emdash";

export interface ChessPuzzleCollectionDefinition extends CreateCollectionInput {
	fields: CreateFieldInput[];
}

export const CHESS_PUZZLES_COLLECTION: ChessPuzzleCollectionDefinition = {
	slug: "chess_puzzles",
	label: "Kho câu đố",
	labelSingular: "Câu đố",
	description: "Ngân hàng câu đố cờ vua theo 6 cấp độ Dương Sinh",
	icon: "sparkle",
	urlPattern: "/cau-do/{slug}",
	sortOrder: 15,
	supports: ["drafts", "revisions", "search"],
	fields: [
		{
			slug: "title",
			label: "Tiêu đề",
			type: "string",
			required: true,
			searchable: true,
		},
		{
			slug: "puzzle",
			label: "Dữ liệu thế cờ & nước đi",
			type: "json",
			required: true,
			options: {
				widget: "chess-puzzles:puzzle-editor",
			},
		},
		{
			slug: "prompt",
			label: "Yêu cầu / Câu hỏi",
			type: "string",
			searchable: true,
		},
		{
			slug: "level",
			label: "Cấp độ",
			type: "select",
			validation: {
				options: ["tot", "ma", "tuong", "xe", "hau", "vua"],
			},
		},
		{
			slug: "themes",
			label: "Chủ đề chiến thuật",
			type: "text",
			searchable: true,
		},
		{
			slug: "rating",
			label: "Điểm Elo",
			type: "integer",
		},
		{
			slug: "hint",
			label: "Gợi ý",
			type: "string",
		},
		{
			slug: "explanation",
			label: "Lời giải & Phân tích",
			type: "portableText",
		},
		{
			slug: "source",
			label: "Nguồn câu đố",
			type: "string",
		},
	],
};
