import { markdownToPortableText, type PortableTextBlock } from "emdash/client";
import { ulid } from "ulidx";
import { parse as parseYaml } from "yaml";

import type { ObsidianLessonFrontmatter } from "../types.js";

const FM_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
const WIKILINK_EMBED_REGEX = /!\[\[(.*?)\]\]/g;
const WIKILINK_TEXT_REGEX = /(?<!!)\[\[(.*?)\]\]/g;
const FENCE_REGEX = /```(fen|pgn|puzzle|lecture)\r?\n([\s\S]*?)```/g;
const LINE_SPLIT_REGEX = /\r?\n/;

const PREFIX_FEN_REGEX = /^fen:\s*/;
const PREFIX_ORIENTATION_REGEX = /^orientation:\s*/;
const PREFIX_ARROWS_REGEX = /^arrows:\s*/;
const PREFIX_HIGHLIGHTS_REGEX = /^highlights:\s*/;
const PREFIX_CAPTION_REGEX = /^caption:\s*/;

const PREFIX_PUZZLE_ID_REGEX = /^(id|puzzle):\s*/;
const PREFIX_SOLUTION_REGEX = /^solution:\s*/;
const PREFIX_PROMPT_REGEX = /^prompt:\s*/;
const PREFIX_HINT_REGEX = /^hint:\s*/;
const PREFIX_LEVEL_REGEX = /^level:\s*/;

const PREFIX_LECTURE_ID_REGEX = /^(id|lecture):\s*/;
const PREFIX_TITLE_REGEX = /^title:\s*/;

export interface ParsedObsidianLesson {
	frontmatter: ObsidianLessonFrontmatter;
	blocks: PortableTextBlock[];
	warnings: string[];
}

/**
 * Phân tích và chuyển đổi một file Markdown Obsidian sang cấu trúc bài học và Portable Text.
 */
export function parseObsidianMarkdown(rawContent: string): ParsedObsidianLesson {
	const warnings: string[] = [];

	// 1. Tách Frontmatter
	let frontmatter: ObsidianLessonFrontmatter = { title: "Bài học cờ vua mới" };
	let bodyMarkdown = rawContent;

	const fmMatch = rawContent.match(FM_REGEX);
	if (fmMatch && fmMatch[1]) {
		try {
			const parsed = parseYaml(fmMatch[1]) as Record<string, unknown>;
			if (parsed && typeof parsed === "object") {
				frontmatter = {
					title: typeof parsed.title === "string" ? parsed.title : "Bài học cờ vua mới",
					course: typeof parsed.course === "string" ? parsed.course : undefined,
					module: typeof parsed.module === "string" ? parsed.module : undefined,
					order: typeof parsed.order === "number" ? parsed.order : 1,
					level: typeof parsed.level === "string" ? parsed.level : undefined,
					themes: typeof parsed.themes === "string" ? parsed.themes : undefined,
					objectives: typeof parsed.objectives === "string" ? parsed.objectives : undefined,
					...parsed,
				};
			}
		} catch (e) {
			warnings.push(`Lỗi đọc YAML Frontmatter: ${(e as Error).message}`);
		}
		bodyMarkdown = fmMatch[2] || "";
	}

	// 2. Phát hiện và cảnh báo các liên kết Obsidian Wikilink
	const wikilinkEmbedMatches = bodyMarkdown.match(WIKILINK_EMBED_REGEX);
	if (wikilinkEmbedMatches) {
		for (const w of wikilinkEmbedMatches) {
			warnings.push(
				`Cảnh báo: Phát hiện Obsidian wikilink nhúng '${w}'. Hãy chuyển sang thẻ ảnh Markdown chuẩn ![alt](url).`,
			);
		}
	}

	const wikilinkTextMatches = bodyMarkdown.match(WIKILINK_TEXT_REGEX);
	if (wikilinkTextMatches) {
		for (const w of wikilinkTextMatches) {
			warnings.push(
				`Cảnh báo: Phát hiện Obsidian wikilink '${w}'. Hãy chuyển sang liên kết chuẩn [tên](đường_dẫn).`,
			);
		}
	}

	// 3. Tách các code fence cờ vua (```fen, ```pgn, ```puzzle, ```lecture)
	const blocks: PortableTextBlock[] = [];

	// Biểu thức chính quy tìm các code fence cờ vua
	const fenceRegex = new RegExp(FENCE_REGEX.source, "g");
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = fenceRegex.exec(bodyMarkdown)) !== null) {
		const matchStart = match.index;
		const matchEnd = fenceRegex.lastIndex;
		const fenceType = match[1] || "";
		const fenceBody = (match[2] || "").trim();

		// Phần Markdown text trước code fence
		const textBefore = bodyMarkdown.slice(lastIndex, matchStart).trim();
		if (textBefore) {
			const ptBlocks = markdownToPortableText(textBefore);
			blocks.push(...ptBlocks);
		}

		// Xử lý Custom Chess Block
		if (fenceType && fenceBody) {
			const customBlock = parseChessBlock(fenceType, fenceBody);
			if (customBlock) {
				blocks.push(customBlock);
			}
		}

		lastIndex = matchEnd;
	}

	// Phần Markdown text còn lại sau code fence cuối cùng
	const textAfter = bodyMarkdown.slice(lastIndex).trim();
	if (textAfter) {
		const ptBlocks = markdownToPortableText(textAfter);
		blocks.push(...ptBlocks);
	}

	return {
		frontmatter,
		blocks,
		warnings,
	};
}

/**
 * Chuyển đổi nội dung của một code fence cờ vua thành node Portable Text.
 */
function parseChessBlock(type: string, content: string): PortableTextBlock | null {
	const key = ulid();

	if (type === "fen") {
		// Có thể là FEN trực tiếp hoặc cấu hình key-value
		const lines = content
			.split(LINE_SPLIT_REGEX)
			.map((l) => l.trim())
			.filter(Boolean);
		if (lines.length === 1 && lines[0] && lines[0].includes("/")) {
			return {
				_type: "chess-fen",
				_key: key,
				fen: lines[0],
				orientation: "white",
			};
		}

		let fen = "";
		let orientation = "white";
		let arrows = "";
		let highlights = "";
		let caption = "";

		for (const line of lines) {
			if (line.startsWith("fen:")) {
				fen = line.replace(PREFIX_FEN_REGEX, "");
			} else if (line.startsWith("orientation:")) {
				orientation = line.replace(PREFIX_ORIENTATION_REGEX, "");
			} else if (line.startsWith("arrows:")) {
				arrows = line.replace(PREFIX_ARROWS_REGEX, "");
			} else if (line.startsWith("highlights:")) {
				highlights = line.replace(PREFIX_HIGHLIGHTS_REGEX, "");
			} else if (line.startsWith("caption:")) {
				caption = line.replace(PREFIX_CAPTION_REGEX, "");
			} else if (!fen && line.includes("/")) {
				fen = line;
			}
		}

		return {
			_type: "chess-fen",
			_key: key,
			fen: fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
			orientation,
			arrows: arrows || undefined,
			highlights: highlights || undefined,
			caption: caption || undefined,
		};
	}

	if (type === "pgn") {
		return {
			_type: "chess-pgn",
			_key: key,
			pgn: content,
			orientation: "white",
			startPly: 0,
			showHeaders: true,
		};
	}

	if (type === "puzzle") {
		// Kiểm tra nếu là JSON
		if (content.startsWith("{") && content.endsWith("}")) {
			try {
				const json = JSON.parse(content);
				return {
					_type: "chess-puzzle",
					_key: key,
					...json,
				};
			} catch {
				// Fallback sang parse theo dòng
			}
		}

		const lines = content
			.split(LINE_SPLIT_REGEX)
			.map((l) => l.trim())
			.filter(Boolean);
		let puzzleId = "";
		let fen = "";
		let solution = "";
		let prompt = "";
		let hint = "";
		let level = "ma";

		for (const line of lines) {
			if (line.startsWith("id:") || line.startsWith("puzzle:")) {
				puzzleId = line.replace(PREFIX_PUZZLE_ID_REGEX, "");
			} else if (line.startsWith("fen:")) {
				fen = line.replace(PREFIX_FEN_REGEX, "");
			} else if (line.startsWith("solution:")) {
				solution = line.replace(PREFIX_SOLUTION_REGEX, "");
			} else if (line.startsWith("prompt:")) {
				prompt = line.replace(PREFIX_PROMPT_REGEX, "");
			} else if (line.startsWith("hint:")) {
				hint = line.replace(PREFIX_HINT_REGEX, "");
			} else if (line.startsWith("level:")) {
				level = line.replace(PREFIX_LEVEL_REGEX, "");
			}
		}

		return {
			_type: "chess-puzzle",
			_key: key,
			puzzle: puzzleId || undefined,
			fen: fen || undefined,
			solution: solution || undefined,
			prompt: prompt || undefined,
			hint: hint || undefined,
			level,
		} as unknown as PortableTextBlock;
	}

	if (type === "lecture") {
		// Kiểm tra nếu là JSON
		if (content.startsWith("{") && content.endsWith("}")) {
			try {
				const json = JSON.parse(content);
				return {
					_type: "chess-lecture",
					_key: key,
					...json,
				};
			} catch {
				// Fallback sang parse theo dòng
			}
		}

		const lines = content
			.split(LINE_SPLIT_REGEX)
			.map((l) => l.trim())
			.filter(Boolean);
		let lectureId = "";
		let title = "";

		for (const line of lines) {
			if (line.startsWith("id:") || line.startsWith("lecture:")) {
				lectureId = line.replace(PREFIX_LECTURE_ID_REGEX, "");
			} else if (line.startsWith("title:")) {
				title = line.replace(PREFIX_TITLE_REGEX, "");
			}
		}

		return {
			_type: "chess-lecture",
			_key: key,
			lecture: lectureId || undefined,
			title: title || undefined,
			startStep: 1,
		};
	}

	return null;
}
