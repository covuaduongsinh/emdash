import { PluginRouteError } from "emdash";
import type { RouteContext } from "emdash";

export const SAMPLE_SIX_LEVEL_PUZZLES = [
	{
		title: "Cấp Tốt: Đòn Bắt Đôi Của Tốt",
		slug: "tot-don-bat-doi-cua-tot",
		level: "tot",
		rating: 750,
		prompt: "Trắng đi trước: Đẩy Tốt d4-d5 tấn công đôi cả Mã c6 và Tượng b4 của Đen.",
		themes: "fork, pawn-fork, basic",
		hint: "Hãy nhìn vào đường chéo kiểm soát của Tốt d4 sau khi tiến lên!",
		explanation:
			"Nước đi d4-d5 là đòn chĩa đôi kinh điển của Tốt, Đen chỉ có thể chạy 1 quân và Trắng sẽ ăn hơn quân còn lại ở nước tiếp theo.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Tốt",
		puzzle: {
			fen: "r1bqk1nr/pppp1ppp/2n5/4p3/1b1PP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 1 4",
			solution: ["c2c3", "b4a5", "d4d5"],
			moves: ["c2c3", "b4a5", "d4d5"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Mã: Đòn Nhảy Mã Bắt Đôi Vua và Xe",
		slug: "ma-don-nhay-ma-bat-doi-vua-va-xe",
		level: "ma",
		rating: 1100,
		prompt: "Trắng đi trước: Nhảy Mã vào ô c7 chiếu Vua và bắt Xe a8.",
		themes: "fork, knight-fork, royal-fork",
		hint: "Ô c7 đang không có quân Đen nào bảo vệ!",
		explanation:
			"Mã c7 là đòn tấn công đôi chí mạng, Vua Đen buộc phải chạy và Trắng ung dung ăn Xe a8.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Mã",
		puzzle: {
			fen: "r1bqk2r/pp1p1ppp/4pn2/2b5/2BnP3/2N2N2/PPP2PPP/R1BQK2R w KQkq - 0 6",
			solution: ["f3d4", "c5d4", "d1d4"],
			moves: ["f3d4", "c5d4", "d1d4"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Tượng: Đòn Ghim Quân Tuyệt Đối",
		slug: "tuong-don-ghim-quan-tuyet-doi",
		level: "tuong",
		rating: 1300,
		prompt: "Trắng đi trước: Dùng Tượng ghim Mã vào Vua Đen.",
		themes: "pin, absolute-pin, bishop-attack",
		hint: "Tìm quân đứng thẳng hàng với Vua Đen trên đường chéo h4-d8!",
		explanation: "Tượng g4 ghim tuyệt đối Mã f6 vào Vua Đen, Mã không thể di chuyển.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Tượng",
		puzzle: {
			fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
			solution: ["f3g5", "d7d5", "e4d5"],
			moves: ["f3g5", "d7d5", "e4d5"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Xe: Chiếu Hết Hàng Đáy Kinh Điển",
		slug: "xe-chieu-het-hang-day-kinh-dien",
		level: "xe",
		rating: 1450,
		prompt: "Trắng đi trước: Tận dụng điểm yếu hàng đáy để chiếu hết Vua Đen.",
		themes: "mate, back-rank-mate, rook-mate",
		hint: "Vua Đen đang bị hàng Tốt chặn đường thoát lên trên!",
		explanation: "Xe xuống d8 chiếu hết vì Vua Đen bị chặn đường thoát bởi các Tốt f7, g7, h7.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Xe",
		puzzle: {
			fen: "3r2k1/5ppp/8/8/8/8/4RPPP/6K1 w - - 0 1",
			solution: ["e2e8", "d8e8"],
			moves: ["e2e8", "d8e8"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Hậu: Phối Hợp Hậu Tượng Chiếu Hết h7",
		slug: "hau-phoi-hop-hau-tuong-chieu-het-h7",
		level: "hau",
		rating: 1650,
		prompt: "Trắng đi trước: Hậu phối hợp cùng Tượng chiếu hết ở h7.",
		themes: "mate, battery, queen-and-bishop-mate",
		hint: "Hậu d3 và Tượng c2 tạo thành khẩu pháo ngắm thẳng vào h7!",
		explanation:
			"Khẩu pháo Hậu + Tượng tấn công trực diện h7 mang lại chiến thắng tuyệt đối cho Trắng.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Hậu",
		puzzle: {
			fen: "r1b2rk1/pp1p1ppp/1qn1pn2/8/1b1NP3/2N1BP2/PPPQB1PP/R3K2R w KQ - 1 9",
			solution: ["d4e6", "b6a5", "e6f8"],
			moves: ["d4e6", "b6a5", "e6f8"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Vua: Đòn Thí Hậu Chiếu Thắt Cổ",
		slug: "vua-don-thi-hau-chieu-that-co",
		level: "vua",
		rating: 1950,
		prompt: "Trắng đi trước: Thí Hậu vào g8 ép Xe ăn sang rồi Mã nhảy f7 chiếu hết thắt cổ.",
		themes: "smothered-mate, queen-sacrifice, knight-mate",
		hint: "Nước cờ thí Hậu đẹp mắt nhất trong lịch sử cờ vua!",
		explanation: "1. Qg8+ Rxg8 2. Nf7# — Vua Đen bị chính các quân của mình bóp nghẹt.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Vua",
		puzzle: {
			fen: "6k1/5Npp/8/8/8/8/5PPP/4Q1K1 w - - 0 1",
			solution: ["e1e8"],
			moves: ["e1e8"],
			orientation: "white",
		},
	},
];

export async function puzzlesSeedHandler(ctx: RouteContext) {
	if (
		!ctx.content ||
		typeof (ctx.content as unknown as { create?: unknown }).create !== "function"
	) {
		throw new PluginRouteError("NO_CONTENT_WRITE_ACCESS", "Thiếu quyền ghi nội dung", 500);
	}

	const content = ctx.content as unknown as {
		create: (col: string, data: Record<string, unknown>) => Promise<{ id: string }>;
		list: (
			col: string,
			opts?: { limit?: number },
		) => Promise<{ items: Array<{ id: string; data?: Record<string, unknown> }> }>;
	};

	const existing = await content.list("chess_puzzles", { limit: 100 });
	const existingSlugs = new Set(existing.items.map((i) => (i.data?.slug as string) || i.id));

	const created: string[] = [];
	const skipped: string[] = [];

	for (const p of SAMPLE_SIX_LEVEL_PUZZLES) {
		if (existingSlugs.has(p.slug)) {
			skipped.push(p.slug);
			continue;
		}

		await content.create("chess_puzzles", {
			title: p.title,
			slug: p.slug,
			level: p.level,
			rating: p.rating,
			prompt: p.prompt,
			themes: p.themes,
			hint: p.hint,
			explanation: p.explanation,
			source: p.source,
			puzzle: JSON.stringify(p.puzzle),
			status: "published",
		});
		created.push(p.slug);
	}

	return {
		success: true,
		createdCount: created.length,
		skippedCount: skipped.length,
		created,
		skipped,
	};
}
