import { PluginRouteError } from "emdash";
import type { RouteContext } from "emdash";

export const SAMPLE_SIX_LEVEL_PUZZLES = [
	// ==========================================
	// CẤP TỐT (3 câu đố)
	// ==========================================
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
		title: "Cấp Tốt: Phong Cấp Tốt Quyết Định",
		slug: "tot-phong-cap-tot-quyet-dinh",
		level: "tot",
		rating: 700,
		prompt: "Trắng đi trước: Tiến Tốt e7 lên e8 phong Hậu để giành ưu thế áp đảo.",
		themes: "promotion, endgame, basic",
		hint: "Tốt ở hàng 7 chỉ cần một bước nữa là có thể biến thành quân Hậu quyền năng!",
		explanation:
			"Nước đi e7-e8=Q tạo ra quân Hậu mới, mang lại chiến thắng quyết định cho bên Trắng.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Tốt",
		puzzle: {
			fen: "8/4P3/8/8/8/5k2/8/4K3 w - - 0 1",
			solution: ["e7e8q"],
			moves: ["e7e8q"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Tốt: Bắt Tốt Qua Đường (En Passant)",
		slug: "tot-bat-tot-qua-duong-en-passant",
		level: "tot",
		rating: 800,
		prompt: "Đen vừa nhảy Tốt f7 lên f5: Trắng thực hiện nước bắt Tốt qua đường e5xf6.",
		themes: "en-passant, pawn-rules, tactics",
		hint: "Tốt Trắng ở hàng 5 có quyền ăn chéo vào ô f6 ngay khi Tốt Đen vừa nhảy 2 ô!",
		explanation:
			"Bắt Tốt qua đường là quy tắc đặc biệt giúp Tốt Trắng tiêu diệt Tốt đối phương và kiểm soát cánh Vua.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Tốt",
		puzzle: {
			fen: "rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3",
			solution: ["e5f6"],
			moves: ["e5f6"],
			orientation: "white",
		},
	},

	// ==========================================
	// CẤP MÃ (3 câu đố)
	// ==========================================
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
		title: "Cấp Mã: Mã Nhảy Chiếu Hết Thắt Cổ Ở Góc",
		slug: "ma-nhay-chieu-het-that-co-o-goc",
		level: "ma",
		rating: 1050,
		prompt:
			"Trắng đi trước: Nhảy Mã vào f7 chiếu hết ngay lập tức khi Vua Đen bị quân mình vây kín.",
		themes: "smothered-mate, knight-mate, mate-in-1",
		hint: "Vua Đen ở h8 đang bị chính Xe g8 và Tốt g7/h7 bịt kín mọi đường thoát!",
		explanation: "Nước cờ 1. Nf7# là đòn chiếu hết tuyệt đẹp vì Mã nhảy qua đầu mọi quân cản.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Mã",
		puzzle: {
			fen: "6rk/6pp/7N/8/8/8/8/7K w - - 0 1",
			solution: ["h6f7"],
			moves: ["h6f7"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Mã: Đòn Nhảy Mã Chiếu Bắt Hậu",
		slug: "ma-don-nhay-ma-chieu-bat-hau",
		level: "ma",
		rating: 1150,
		prompt: "Đen đi trước: Nhảy Mã vào ô f2 chiếu Vua và tấn công Hậu Trắng.",
		themes: "fork, knight-attack, blunder-punish",
		hint: "Điểm yếu f2 của Trắng khi Hậu chưa kịp sơ tán!",
		explanation:
			"Nước đi 1... Nxf2 đe dọa trực tiếp Hậu d1 và Vua g1, đem lại chiến thắng cho bên Đen.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Mã",
		puzzle: {
			fen: "r1bqk2r/pppp1ppp/2n5/4p3/2B1n3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 6",
			solution: ["e4f2"],
			moves: ["e4f2"],
			orientation: "black",
		},
	},

	// ==========================================
	// CẤP TƯỢNG (3 câu đố)
	// ==========================================
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
		title: "Cấp Tượng: Đòn Chiếu Xuyên (Skewer) Bắt Xe",
		slug: "tuong-don-chieu-xuyen-bat-xe",
		level: "tuong",
		rating: 1250,
		prompt: "Trắng đi trước: Dùng Tượng h1 ăn thẳng Xe a8 trên đường chéo lớn.",
		themes: "skewer, long-diagonal, bishop-power",
		hint: "Đường chéo h1-a8 hoàn toàn thông thoáng!",
		explanation: "Tượng kiểm soát toàn bộ đường chéo lớn và bắt Xe a8 mà không có quân cản.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Tượng",
		puzzle: {
			fen: "r3k3/8/8/8/8/8/8/4K2B w - - 0 1",
			solution: ["h1a8"],
			moves: ["h1a8"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Tượng: Đòn Ghim Tượng Tấn Công Xe Đen",
		slug: "tuong-don-ghim-tuong-tan-cong-xe-den",
		level: "tuong",
		rating: 1350,
		prompt: "Đen đi trước: Tượng e5 tiến lên f4 ghim và tiêu diệt Xe d2 của Trắng.",
		themes: "pin, counter-attack, active-bishop",
		hint: "Xe d2 của Trắng đang đứng thẳng hàng với Vua d1!",
		explanation: "Tượng f4 ghim cứng Xe d2 của Trắng vào Vua d1, ép Trắng phải mất Xe.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Tượng",
		puzzle: {
			fen: "2kr3r/ppp2ppp/8/4b3/8/8/PPPB1PPP/R2K1B1R b - - 0 1",
			solution: ["e5f4"],
			moves: ["e5f4"],
			orientation: "black",
		},
	},

	// ==========================================
	// CẤP XE (3 câu đố)
	// ==========================================
	{
		title: "Cấp Xe: Chiếu Hết Hàng Đáy Kinh Điển",
		slug: "xe-chieu-het-hang-day-kinh-dien",
		level: "xe",
		rating: 1450,
		prompt: "Trắng đi trước: Tận dụng điểm yếu hàng đáy để chiếu hết Vua Đen bằng Xe e8.",
		themes: "mate, back-rank-mate, rook-mate",
		hint: "Vua Đen đang bị hàng Tốt chặn đường thoát lên trên!",
		explanation: "Xe xuống e8 chiếu hết vì Vua Đen bị chặn đường thoát bởi các Tốt f7, g7, h7.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Xe",
		puzzle: {
			fen: "6k1/5ppp/8/8/8/8/4RPPP/6K1 w - - 0 1",
			solution: ["e2e8"],
			moves: ["e2e8"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Xe: Chồng Hai Xe Thâm Nhập Cột Mở",
		slug: "xe-chong-hai-xe-tham-nhap-cot-mo",
		level: "xe",
		rating: 1400,
		prompt: "Trắng đi trước: Đổi Xe a8 rồi dùng Xe thứ hai chiếu hết Vua Đen ở hàng đáy.",
		themes: "doubled-rooks, open-file, deflection",
		hint: "Xe a2 và Xe a1 tạo thành khẩu đại pháo kiểm soát cột a!",
		explanation: "1. Rxa8+ Rxa8 2. Rxa8# — Sức mạnh của hai Xe chồng trên cột mở.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Xe",
		puzzle: {
			fen: "4r1k1/5ppp/8/8/8/8/R4PPP/R5K1 w - - 0 1",
			solution: ["a2a8", "e8a8", "a1a8"],
			moves: ["a2a8", "e8a8", "a1a8"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Xe: Cắt Vua Bằng Xe Trong Tàn Cuộc",
		slug: "xe-cat-vua-trong-tan-cuoc",
		level: "xe",
		rating: 1500,
		prompt: "Trắng đi trước: Dùng Xe d3 chiếu và cắt đường tiếp cận của Vua Đen.",
		themes: "endgame, cutting-off, rook-technique",
		hint: "Đưa Xe sang cột d để chia cắt Vua Đen sang cánh bên kia!",
		explanation:
			"Xe d3 cắt đứt sự chi viện của Vua Đen, tạo điều kiện cho Vua và Tốt Trắng tiến lên phong cấp.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Xe",
		puzzle: {
			fen: "8/8/8/3k4/8/1R6/4K3/8 w - - 0 1",
			solution: ["b3d3"],
			moves: ["b3d3"],
			orientation: "white",
		},
	},

	// ==========================================
	// CẤP HẬU (3 câu đố)
	// ==========================================
	{
		title: "Cấp Hậu: Phối Hợp Hậu Tượng Chiếu Hết h7",
		slug: "hau-phoi-hop-hau-tuong-chieu-het-h7",
		level: "hau",
		rating: 1650,
		prompt: "Trắng đi trước: Tận dụng đòn mở đường bắt Xe f8 của Đen.",
		themes: "mate, battery, queen-and-bishop-mate",
		hint: "Nhảy Mã d4 lên e6 mở đường cho Tượng và Hậu tấn công!",
		explanation:
			"Nước nhảy Mã e6 tấn công Hậu b6 đồng thời mở đường cho Tượng ăn Xe f8 mang lại lợi thế quyết định.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Hậu",
		puzzle: {
			fen: "r1b2rk1/pp1p1ppp/1qn1pn2/8/1b1NP3/2N1BP2/PPPQB1PP/R3K2R w KQ - 1 9",
			solution: ["d4e6", "b6a5", "e6f8"],
			moves: ["d4e6", "b6a5", "e6f8"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Hậu: Chiếu Hết Scholar's Mate Nhanh Gọn",
		slug: "hau-chieu-het-scholars-mate-nhanh-gon",
		level: "hau",
		rating: 1600,
		prompt: "Trắng đi trước: Hậu ăn f7 chiếu hết ngay lập tức nhờ sự yểm trợ của Tượng c4.",
		themes: "scholars-mate, queen-mate, checkmate-in-1",
		hint: "Ô f7 chỉ có duy nhất Vua Đen bảo vệ!",
		explanation: "1. Qxf7# — Đòn chiếu hết Scholar's Mate nổi tiếng nhất trong cờ vua học đường.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Hậu",
		puzzle: {
			fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
			solution: ["f3f7"],
			moves: ["f3f7"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Hậu: Đòn Thí Tượng Kéo Vua Đột Phá Hậu",
		slug: "hau-don-thi-tuong-keo-vua-dot-pha-hau",
		level: "hau",
		rating: 1750,
		prompt: "Trắng đi trước: Thí Tượng vào f7 ép Vua Đen mất quyền nhập thành.",
		themes: "sacrifice, king-hunt, opening-punish",
		hint: "Đòn đánh phá hủy cấu trúc bảo vệ Vua Đen!",
		explanation: "1. Bxf7+ Kxf7 2. Ng5+ Vua Đen buộc phải di chuyển ra vùng nguy hiểm giữa bàn cờ.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Hậu",
		puzzle: {
			fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3",
			solution: ["c4f7", "e8f7"],
			moves: ["c4f7", "e8f7"],
			orientation: "white",
		},
	},

	// ==========================================
	// CẤP VUA (3 câu đố)
	// ==========================================
	{
		title: "Cấp Vua: Đòn Thí Hậu Chiếu Thắt Cổ",
		slug: "vua-don-thi-hau-chieu-that-co",
		level: "vua",
		rating: 1950,
		prompt: "Trắng đi trước: Chiếu hết hàng đáy quyết định.",
		themes: "smothered-mate, queen-sacrifice, knight-mate",
		hint: "Tận dụng hàng đáy không có bảo vệ!",
		explanation: "1. Qe8# — Nước cờ kết liễu trận đấu chuẩn xác.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Vua",
		puzzle: {
			fen: "6k1/5Npp/8/8/8/8/5PPP/4Q1K1 w - - 0 1",
			solution: ["e1e8"],
			moves: ["e1e8"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Vua: Nghệ Thuật Đối Vua (Opposition)",
		slug: "vua-nghe-thuat-doi-vua-opposition",
		level: "vua",
		rating: 1900,
		prompt: "Trắng đi trước: Di chuyển Vua d3 chiếm thế đối Vua để mở đường cho Tốt e2 tiến lên.",
		themes: "opposition, king-pawn-endgame, zugzwang",
		hint: "Giữ khoảng cách 1 ô thẳng hàng với Vua đối phương!",
		explanation:
			"1. Kd3 Kd5 2. e4+ — Giành quyền chủ động đẩy lùi Vua Đen và đưa Tốt phong cấp an toàn.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Vua",
		puzzle: {
			fen: "8/8/8/4k3/8/4K3/4P3/8 w - - 0 1",
			solution: ["e3d3", "e5d5", "e2e4"],
			moves: ["e3d3", "e5d5", "e2e4"],
			orientation: "white",
		},
	},
	{
		title: "Cấp Vua: Đòn Phối Hợp Anastasia's Mate",
		slug: "vua-don-phoi-hop-anastasia-mate",
		level: "vua",
		rating: 2000,
		prompt: "Trắng đi trước: Nhảy Mã h6 chiếu đôi rồi dùng Xe e8 chiếu hết.",
		themes: "anastasia-mate, double-check, legendary-combination",
		hint: "Chiếu đôi bằng Mã và Xe khiến đối phương không thể đỡ!",
		explanation: "1. Nh6+ Kh8 2. Re8# — Đòn phối hợp Mã và Xe kinh điển mang tên Anastasia.",
		source: "Dương Sinh Chess Academy - Giáo trình Cấp Vua",
		puzzle: {
			fen: "5rk1/1p3Npp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
			solution: ["f7h6", "g8h8", "e1e8"],
			moves: ["f7h6", "g8h8", "e1e8"],
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
