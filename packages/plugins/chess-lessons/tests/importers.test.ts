import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseObsidianMarkdown } from "../src/importers/obsidian.js";

describe("Obsidian Markdown Importer", () => {
	it("phân tích chính xác frontmatter và các khối cờ vua từ file markdown mẫu", () => {
		const fixturePath = path.resolve(__dirname, "fixtures/sample_obsidian_lesson.md");
		const rawContent = fs.readFileSync(fixturePath, "utf-8");

		const result = parseObsidianMarkdown(rawContent);

		// 1. Kiểm tra Frontmatter
		expect(result.frontmatter.title).toBe("Đòn Tấn Công Đôi Của Quân Mã");
		expect(result.frontmatter.course).toBe("ma-so-cap");
		expect(result.frontmatter.module).toBe("Chiến thuật cơ bản");
		expect(result.frontmatter.order).toBe(1);
		expect(result.frontmatter.level).toBe("ma");
		expect(result.frontmatter.themes).toBe("fork, knight, tactics");
		expect(result.frontmatter.objectives).toBe(
			"Hiểu và thực hiện thành thạo đòn tấn công đôi bằng quân Mã",
		);

		// 2. Kiểm tra cảnh báo Wikilinks
		expect(result.warnings.length).toBeGreaterThanOrEqual(2);
		expect(result.warnings.some((w) => w.includes("hinh-anh-chu-ngua.png"))).toBe(true);
		expect(result.warnings.some((w) => w.includes("bai-giang-nhap-mon-ma"))).toBe(true);

		// 3. Kiểm tra các blocks cờ vua đã được trích xuất
		const blockTypes = result.blocks.map((b) => b._type);
		expect(blockTypes).toContain("chess-fen");
		expect(blockTypes).toContain("chess-pgn");
		expect(blockTypes).toContain("chess-puzzle");
		expect(blockTypes).toContain("chess-lecture");

		// Kiểm tra chi tiết block chess-fen
		const fenBlock = result.blocks.find((b) => b._type === "chess-fen");
		expect(fenBlock).toBeDefined();
		expect(fenBlock?.fen).toContain("r1bqk2r/pppp1ppp/2n5/2b1p3/2B1P1n1/3P1N2/PPP2PPP/RNBQK2R");
		expect(fenBlock?.arrows).toBe("g4f2,g4e3");
		expect(fenBlock?.highlights).toBe("f2,e3");

		// Kiểm tra chi tiết block chess-puzzle
		const puzzleBlock = result.blocks.find((b) => b._type === "chess-puzzle");
		expect(puzzleBlock).toBeDefined();
		expect(puzzleBlock?.solution).toBe("c4f7");
		expect(puzzleBlock?.hint as string | undefined).toContain("Tượng");

		// Kiểm tra chi tiết block chess-lecture
		const lectureBlock = result.blocks.find((b) => b._type === "chess-lecture");
		expect(lectureBlock).toBeDefined();
		expect(lectureBlock?.lecture).toBe("lec_don_chuyen_sau");
	});

	it("xử lý an toàn khi markdown không có frontmatter hoặc nội dung trống", () => {
		const emptyResult = parseObsidianMarkdown("");
		expect(emptyResult.frontmatter.title).toBeDefined();
		expect(emptyResult.blocks).toEqual([]);

		const textOnlyResult = parseObsidianMarkdown(
			"Một đoạn văn bản thông thường không có code cờ vua.",
		);
		expect(textOnlyResult.blocks.length).toBeGreaterThan(0);
		expect(textOnlyResult.blocks[0]?._type).toBe("block");
	});
});
