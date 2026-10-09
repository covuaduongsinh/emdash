import type { CreateCollectionInput, CreateFieldInput } from "emdash";

export interface ChessLessonsCollectionDefinition extends CreateCollectionInput {
	fields: CreateFieldInput[];
}

export const COURSE_EXTRA_FIELDS: CreateFieldInput[] = [
	{
		slug: "level",
		label: "Cấp độ cờ vua",
		type: "select",
		validation: {
			options: ["tot", "ma", "tuong", "xe", "hau", "vua"],
		},
	},
	{
		slug: "sessions",
		label: "Số buổi học",
		type: "integer",
		validation: {
			min: 1,
			max: 200,
		},
	},
	{
		slug: "age_range",
		label: "Độ tuổi phù hợp",
		type: "string",
	},
];

export const LESSON_EXTRA_FIELDS: CreateFieldInput[] = [
	{
		slug: "level",
		label: "Cấp độ cờ vua",
		type: "select",
		validation: {
			options: ["tot", "ma", "tuong", "xe", "hau", "vua"],
		},
	},
	{
		slug: "themes",
		label: "Chủ đề chiến thuật / Kỹ năng",
		type: "string",
	},
	{
		slug: "objectives",
		label: "Mục tiêu bài học",
		type: "text",
	},
];

export const CHESS_LECTURES_COLLECTION: ChessLessonsCollectionDefinition = {
	slug: "chess_lectures",
	label: "Bài giảng cờ vua",
	labelSingular: "Bài giảng cờ vua",
	description: "Ngân hàng bài giảng trình chiếu cờ vua tương tác theo từng bước",
	icon: "presentation",
	supports: ["drafts", "revisions", "search"],
	sortOrder: 15,
	fields: [
		{
			slug: "title",
			label: "Tiêu đề bài giảng",
			type: "string",
			required: true,
			searchable: true,
		},
		{
			slug: "level",
			label: "Cấp độ cờ vua",
			type: "select",
			validation: {
				options: ["tot", "ma", "tuong", "xe", "hau", "vua"],
			},
		},
		{
			slug: "course",
			label: "Khóa học liên kết",
			type: "string",
		},
		{
			slug: "summary",
			label: "Tóm tắt bài giảng",
			type: "text",
		},
		{
			slug: "script",
			label: "Kịch bản bài giảng",
			type: "json",
			options: {
				widget: "chess-lessons:lecture-builder",
			},
		},
	],
};
