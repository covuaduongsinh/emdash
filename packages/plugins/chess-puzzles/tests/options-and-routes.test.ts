import type { RouteContext } from "emdash";
import { describe, expect, it } from "vitest";

import { puzzlesOptionsHandler } from "../src/handlers/options.js";
import { puzzlesStatsHandler } from "../src/handlers/stats.js";
import { createPlugin } from "../src/index.js";

describe("Chess Puzzles Options and Routes", () => {
	const samplePuzzles = [
		{
			id: "puz-1",
			data: {
				title: "Tốt tấn công",
				level: "tot",
				prompt: "Trắng chiếu hết",
				puzzle: { fen: "8/8/8/8/8/5K2/4R3/5k2 w - - 0 1" },
			},
		},
		{
			id: "puz-2",
			data: {
				title: "Mã bắt đôi Hậu",
				level: "ma",
				prompt: "Tìm nước đi của Mã",
				puzzle: { fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5" },
			},
		},
		{
			id: "puz-3",
			data: {
				title: "Xe chiếm cột mở",
				level: "xe",
				prompt: "Xe xuống hàng 7",
				puzzle: { fen: "r6k/pp2r2p/4Rp1Q/3p4/8/1N1P4/Pq3PPP/R5K1 b - - 0 1" },
			},
		},
	];

	it("puzzles/options returns items with level prefix and details", async () => {
		const mockContext = {
			content: {
				list: async () => ({ items: samplePuzzles }),
			},
			input: {},
		} as unknown as RouteContext;

		const res = await puzzlesOptionsHandler(mockContext);
		expect(res.items).toHaveLength(3);
		const first = res.items[0];
		expect(first).toBeDefined();
		if (!first) throw new Error("First item missing");
		expect(first.id).toBe("puz-1");
		expect(first.name).toContain("[TOT]");
		expect(first.level).toBe("tot");
		expect(first.fen).toBe("8/8/8/8/8/5K2/4R3/5k2 w - - 0 1");
	});

	it("puzzles/options filters by level", async () => {
		const mockContext = {
			content: {
				list: async () => ({ items: samplePuzzles }),
			},
			input: { level: "ma" },
		} as unknown as RouteContext;

		const res = await puzzlesOptionsHandler(mockContext);
		expect(res.items).toHaveLength(1);
		const first = res.items[0];
		expect(first).toBeDefined();
		if (!first) throw new Error("Item missing");
		expect(first.id).toBe("puz-2");
		expect(first.level).toBe("ma");
	});

	it("puzzles/options searches by keyword in title and prompt", async () => {
		const mockContext = {
			content: {
				list: async () => ({ items: samplePuzzles }),
			},
			input: { search: "chiếm cột mở" },
		} as unknown as RouteContext;

		const res = await puzzlesOptionsHandler(mockContext);
		expect(res.items).toHaveLength(1);
		const first = res.items[0];
		expect(first).toBeDefined();
		if (!first) throw new Error("Item missing");
		expect(first.id).toBe("puz-3");
	});

	it("puzzles/stats returns counts grouped by 6 levels", async () => {
		const mockContext = {
			content: {
				list: async () => ({ items: samplePuzzles }),
			},
			input: {},
		} as unknown as RouteContext;

		const res = await puzzlesStatsHandler(mockContext);
		expect(res.total).toBe(3);
		expect(res.levels.tot).toBe(1);
		expect(res.levels.ma).toBe(1);
		expect(res.levels.xe).toBe(1);
		expect(res.levels.tuong).toBe(0);
		expect(res.levels.hau).toBe(0);
		expect(res.levels.vua).toBe(0);
	});

	it("declares correct permissions for all routes in plugin descriptor", () => {
		const plugin = createPlugin();
		const routes = plugin.routes || {};

		// setup/run yêu cầu quyền quản lý schema
		expect(routes["setup/run"]?.permission).toBe("schema:manage");
		// puzzles/options yêu cầu quyền tạo nội dung
		expect(routes["puzzles/options"]?.permission).toBe("content:create");
		// puzzles/import yêu cầu quyền tạo nội dung
		expect(routes["puzzles/import"]?.permission).toBe("content:create");
		// snapshots/refresh yêu cầu quyền tạo/sửa nội dung
		expect(routes["snapshots/refresh"]?.permission).toBe("content:create");
		// puzzles/stats chỉ cần quyền đọc nội dung
		expect(routes["puzzles/stats"]?.permission).toBe("content:read");
	});
});
