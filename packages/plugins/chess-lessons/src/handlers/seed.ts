import { PluginRouteError } from "emdash";
import type { RouteContext } from "emdash";
import { ulid } from "ulidx";

import type { CurriculumSeedResult, DemoDataSeedResult, SampleLessonSeedResult } from "../types.js";

const SIX_LEVEL_COURSES = [
	{
		slug: "tot-nhap-mon",
		title: "Cờ Vua Cấp Tốt — Khóa Học Nhập Môn",
		level: "tot",
		sessions: 12,
		age_range: "5-10 tuổi",
		summary: "Khóa học làm quen với bàn cờ, quân cờ, cách đi và các quy tắc cơ bản của cờ vua.",
		lessons: [
			{
				slug: "tot-bai-1-nhap-mon-ban-co-quan-co",
				title: "Bài 1: Làm Quen Bàn Cờ & Các Quân Cờ",
				level: "tot",
				fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
				prompt: "Vị trí xếp quân chuẩn quốc tế ban đầu của 32 quân cờ trên bàn cờ vua.",
			},
			{
				slug: "tot-bai-2-quy-tac-di-quan-va-bat-quan",
				title: "Bài 2: Quy Tắc Đi Quân & Ăn Quân Cơ Bản",
				level: "tot",
				fen: "r1bqk1nr/pppp1ppp/2n5/4p3/1b1PP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 1 4",
				prompt: "Đòn chĩa đôi bằng Tốt d4-d5 giành lợi thế hơn quân.",
			},
		],
	},
	{
		slug: "ma-so-cap",
		title: "Cờ Vua Cấp Mã — Chiến Thuật Sơ Cấp",
		level: "ma",
		sessions: 16,
		age_range: "6-12 tuổi",
		summary: "Nắm vững các đòn chiến thuật cơ bản: bắt đôi, chiếu bắt quân, ăn quân hơn.",
		lessons: [
			{
				slug: "ma-bai-1-don-bat-doi-cua-quan-ma",
				title: "Bài 1: Đòn Tấn Công Đôi Của Quân Mã",
				level: "ma",
				fen: "r1bqk2r/pp1p1ppp/4pn2/2b5/2BnP3/2N2N2/PPP2PPP/R1BQK2R w KQkq - 0 6",
				prompt: "Khai thác sức mạnh nhảy quân độc đáo của Mã để bắt đôi Vua và Xe.",
			},
			{
				slug: "ma-bai-2-don-chieu-bat-quan-nhe",
				title: "Bài 2: Đòn Chiếu Bắt Quân Nhẹ Trong Khai Cuộc",
				level: "ma",
				fen: "r1bqk2r/pppp1ppp/2n5/2b1p3/2B1n3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 6",
				prompt: "Tấn công điểm yếu khi đối phương chưa kịp bảo vệ các quân cờ nhẹ.",
			},
		],
	},
	{
		slug: "tuong-trung-cap",
		title: "Cờ Vua Cấp Tượng — Kỹ Năng Trung Cấp",
		level: "tuong",
		sessions: 20,
		age_range: "7-14 tuổi",
		summary:
			"Phát triển tư duy chiến thuật kết hợp, kiểm soát trung tâm và nguyên lý khai cuộc cơ bản.",
		lessons: [
			{
				slug: "tuong-bai-1-don-ghim-quan-tuyet-doi",
				title: "Bài 1: Nghệ Thuật Ghim Quân Tuyệt Đối",
				level: "tuong",
				fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
				prompt: "Dùng Tượng kiểm soát đường chéo ghim chặt quân cờ đối phương vào Vua.",
			},
			{
				slug: "tuong-bai-2-don-chieu-xuyen-skewer",
				title: "Bài 2: Đòn Chiếu Xuyên (Skewer) Bắt Quân Nặng",
				level: "tuong",
				fen: "r3k3/8/8/8/8/8/8/4K2B w - - 0 1",
				prompt: "Sức mạnh xuyên phá của Tượng trên đường chéo lớn.",
			},
		],
	},
	{
		slug: "xe-nang-cao",
		title: "Cờ Vua Cấp Xe — Chiến Thuật Nâng Cao",
		level: "xe",
		sessions: 24,
		age_range: "8-16 tuổi",
		summary: "Nâng cao kỹ thuật tấn công cánh vua, tàn cuộc cơ bản và kế hoạch trung cuộc.",
		lessons: [
			{
				slug: "xe-bai-1-chieu-het-hang-day",
				title: "Bài 1: Kỹ Thuật Chiếu Hết Hàng Đáy (Back Rank)",
				level: "xe",
				fen: "6k1/5ppp/8/8/8/8/4RPPP/6K1 w - - 0 1",
				prompt: "Khai thác điểm yếu khi đối phương chưa mở cửa sổ thoát cho Vua.",
			},
			{
				slug: "xe-bai-2-kiem-soat-cot-mo-va-hang-7",
				title: "Bài 2: Kiểm Soát Cột Mở & Thâm Nhập Hàng 7",
				level: "xe",
				fen: "4r1k1/5ppp/8/8/8/8/R4PPP/R5K1 w - - 0 1",
				prompt: "Chồng hai Xe tạo thành khẩu đại pháo hủy diệt thế trận.",
			},
		],
	},
	{
		slug: "hau-chuyen-sau",
		title: "Cờ Vua Cấp Hậu — Chiến Lược Chuyên Sâu",
		level: "hau",
		sessions: 30,
		age_range: "Mọi lứa tuổi",
		summary:
			"Phân tích cấu trúc Tốt, lập kế hoạch chiến lược dài hạn và các hệ thống khai cuộc tiêu chuẩn.",
		lessons: [
			{
				slug: "hau-bai-1-phoi-hop-hau-tuong-tan-cong",
				title: "Bài 1: Phối Hợp Hậu & Tượng Tấn Công Điểm Yếu",
				level: "hau",
				fen: "r1b2rk1/pp1p1ppp/1qn1pn2/8/1b1NP3/2N1BP2/PPPQB1PP/R3K2R w KQ - 1 9",
				prompt: "Khẩu pháo Hậu + Tượng tấn công trực diện vào vị trí phòng thủ của đối phương.",
			},
			{
				slug: "hau-bai-2-don-thi-hau-dot-pha-chien-luoc",
				title: "Bài 2: Đòn Thí Hậu Đột Phá Chiến Lược",
				level: "hau",
				fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
				prompt: "Phân tích nước cờ Scholar's Mate và các đòn công phá dứt điểm trận đấu.",
			},
		],
	},
	{
		slug: "vua-kien-tuong",
		title: "Cờ Vua Cấp Vua — Đỉnh Cao Kiện Tướng",
		level: "vua",
		sessions: 36,
		age_range: "Mọi lứa tuổi",
		summary: "Tư duy tính toán sâu sắc, đòn phối hợp phức tạp và kỹ thuật tàn cuộc đỉnh cao.",
		lessons: [
			{
				slug: "vua-bai-1-nghe-thuat-doi-vua-tan-cuoc",
				title: "Bài 1: Nghệ Thuật Đối Vua (Opposition) Trong Tàn Cuộc",
				level: "vua",
				fen: "8/8/8/4k3/8/4K3/4P3/8 w - - 0 1",
				prompt: "Kỹ thuật kiểm soát không gian và giành thế chủ động trong tàn cuộc Vua - Tốt.",
			},
			{
				slug: "vua-bai-2-don-phoi-hop-anastasia-mate",
				title: "Bài 2: Đòn Phối Hợp Tuyệt Đỉnh Anastasia's Mate",
				level: "vua",
				fen: "5rk1/1p3Npp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
				prompt: "Sự kết hợp hoàn hảo giữa Mã và Xe trong thế trận chiếu đôi bất tử.",
			},
		],
	},
];

interface ContentWriter {
	create: (collection: string, data: Record<string, unknown>) => Promise<{ id: string }>;
	update: (
		collection: string,
		id: string,
		data: Record<string, unknown>,
	) => Promise<{ id: string }>;
	list: (
		collection: string,
		options?: { limit?: number },
	) => Promise<{ items: Array<{ id: string; data?: Record<string, unknown> }> }>;
}

/**
 * Route: lessons/seed-curriculum
 * Tạo 6 khóa học nháp theo 6 cấp độ Tốt → Vua và các bài học mẫu (idempotent).
 */
export async function seedCurriculumHandler(ctx: RouteContext): Promise<CurriculumSeedResult> {
	if (
		!ctx.content ||
		typeof (ctx.content as unknown as { create?: unknown }).create !== "function"
	) {
		throw new PluginRouteError("NO_CONTENT_WRITE_ACCESS", "Thiếu quyền ghi nội dung", 500);
	}

	const contentWithWrite = ctx.content as unknown as ContentWriter;

	const createdCourses: string[] = [];
	const skippedCourses: string[] = [];
	const createdModules: string[] = [];

	const existingCourses = await contentWithWrite.list("courses", { limit: 100 });
	const existingSlugs = new Set(existingCourses.items.map((c) => (c.data?.slug as string) || c.id));
	const existingLessons = await contentWithWrite.list("lessons", { limit: 100 });
	const existingLessonSlugs = new Set(
		existingLessons.items.map((l) => (l.data?.slug as string) || l.id),
	);

	for (const courseDef of SIX_LEVEL_COURSES) {
		let courseId: string;
		if (existingSlugs.has(courseDef.slug)) {
			skippedCourses.push(courseDef.slug);
			const found = existingCourses.items.find((c) => c.data?.slug === courseDef.slug);
			courseId = found?.id || ulid();
		} else {
			courseId = ulid();
			await contentWithWrite.create("courses", {
				id: courseId,
				slug: courseDef.slug,
				title: courseDef.title,
				summary: courseDef.summary,
				level: courseDef.level,
				sessions: courseDef.sessions,
				age_range: courseDef.age_range,
				status: "published",
			});
			createdCourses.push(courseDef.slug);
		}

		// Tạo chương cho khóa học
		const moduleId = ulid();
		await contentWithWrite.create("modules", {
			id: moduleId,
			course_id: courseId,
			title: `Chương 1: Nền Tảng ${courseDef.title}`,
			sort_order: 1,
			status: "published",
		});
		createdModules.push(`${courseDef.slug}:Chương 1`);

		// Tạo bài học mẫu cho khóa học
		for (let i = 0; i < courseDef.lessons.length; i++) {
			const les = courseDef.lessons[i];
			if (les && !existingLessonSlugs.has(les.slug)) {
				const lessonContent = [
					{
						_type: "block",
						_key: ulid(),
						style: "h2",
						children: [{ _type: "span", _key: ulid(), text: les.title }],
					},
					{
						_type: "block",
						_key: ulid(),
						style: "normal",
						children: [{ _type: "span", _key: ulid(), text: les.prompt }],
					},
					{
						_type: "chess-fen",
						_key: ulid(),
						fen: les.fen,
						orientation: "white",
						caption: `Thế cờ minh họa: ${les.title}`,
					},
				];

				await contentWithWrite.create("lessons", {
					id: ulid(),
					slug: les.slug,
					title: les.title,
					content: lessonContent,
					course_id: courseId,
					module_id: moduleId,
					level: les.level,
					sort_order: i + 1,
					status: "published",
				});
			}
		}
	}

	return {
		success: true,
		createdCourses,
		skippedCourses,
		createdModules,
	};
}

/**
 * Route: lessons/seed-sample-lesson
 * Tạo 1 bài học 5 bước chuẩn sư phạm Cờ Vua Học Đường.
 */
export async function seedSampleLessonHandler(ctx: RouteContext): Promise<SampleLessonSeedResult> {
	if (
		!ctx.content ||
		typeof (ctx.content as unknown as { create?: unknown }).create !== "function"
	) {
		throw new PluginRouteError("NO_CONTENT_WRITE_ACCESS", "Thiếu quyền ghi nội dung", 500);
	}

	const contentWithWrite = ctx.content as unknown as ContentWriter;

	// Tìm khóa học cấp Mã hoặc khóa học đầu tiên
	const courses = await contentWithWrite.list("courses", { limit: 20 });
	let targetCourse = courses.items.find(
		(c) => c.data?.slug === "ma-so-cap" || c.data?.level === "ma",
	);
	if (!targetCourse && courses.items.length > 0) {
		targetCourse = courses.items[0];
	}

	let courseId = targetCourse?.id;
	if (!courseId) {
		courseId = ulid();
		await contentWithWrite.create("courses", {
			id: courseId,
			slug: "ma-so-cap",
			title: "Cờ Vua Cấp Mã — Chiến Thuật Sơ Cấp",
			level: "ma",
			sessions: 16,
			status: "published",
		});
	}

	// Tìm hoặc tạo module
	const modules = await contentWithWrite.list("modules", { limit: 50 });
	let targetModule = modules.items.find((m) => m.data?.course_id === courseId);
	let moduleId = targetModule?.id;
	if (!moduleId) {
		moduleId = ulid();
		await contentWithWrite.create("modules", {
			id: moduleId,
			course_id: courseId,
			title: "Chương 1: Các Đòn Chiến Thuật Cơ Bản",
			sort_order: 1,
			status: "published",
		});
	}

	const lessonSlug = "don-tan-cong-doi-cua-quan-ma";
	const existingLessons = await contentWithWrite.list("lessons", { limit: 50 });
	const existing = existingLessons.items.find((l) => l.data?.slug === lessonSlug);

	const lessonId = existing?.id || ulid();

	// 5 bước chuẩn sư phạm Portable Text
	const sampleContent = [
		{
			_type: "block",
			_key: ulid(),
			style: "h2",
			children: [
				{ _type: "span", _key: ulid(), text: "1. Khởi Động: Sức Mạnh Bí Ẩn Của Chú Ngựa Chiến" },
			],
		},
		{
			_type: "block",
			_key: ulid(),
			style: "normal",
			children: [
				{
					_type: "span",
					_key: ulid(),
					text: "Trong cờ vua, quân Mã là quân cờ duy nhất có khả năng nhảy qua đầu các quân khác. Đặc biệt, đòn tấn công đôi (Fork) của quân Mã có thể đồng thời đe dọa hai quân cờ giá trị cao của đối phương mà không sợ bị đáp trả ngay lập tức.",
				},
			],
		},
		{
			_type: "block",
			_key: ulid(),
			style: "h2",
			children: [{ _type: "span", _key: ulid(), text: "2. Kiến Thức Mới: Đòn Chĩa Đôi Vua & Hậu" }],
		},
		{
			_type: "chess-fen",
			_key: ulid(),
			fen: "r1bqk2r/pppp1ppp/2n5/2b1p3/2B1P1n1/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5",
			orientation: "white",
			arrows: "g4f2,g4e3",
			highlights: "f2,e3",
			caption: "Thế cờ minh họa: Mã đen đang nhắm vào ô f2 tạo đòn chĩa đôi",
		},
		{
			_type: "block",
			_key: ulid(),
			style: "h2",
			children: [{ _type: "span", _key: ulid(), text: "3. Thực Hành: Nước Đi Chuẩn Xác" }],
		},
		{
			_type: "chess-pgn",
			_key: ulid(),
			pgn: '[Event "Dương Sinh Chess Sample"]\n[Site "covuahocduong.com"]\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 *',
			orientation: "white",
			startPly: 0,
			showHeaders: true,
			caption: "Trình tự các nước phát triển quân vững chắc bảo vệ các ô xung yếu",
		},
		{
			_type: "block",
			_key: ulid(),
			style: "h2",
			children: [{ _type: "span", _key: ulid(), text: "4. Kiểm Tra: Thử Thách Chiến Thuật" }],
		},
		{
			_type: "chess-puzzle",
			_key: ulid(),
			fen: "r1bqk2r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5",
			solution: "c4f7",
			prompt: "Trắng đi nước nào để tấn công điểm yếu f7 của Đen?",
			hint: "Hãy dùng quân Tượng tấn công vào ô Vua đối phương chưa nhập thành",
			level: "ma",
		},
		{
			_type: "block",
			_key: ulid(),
			style: "h2",
			children: [{ _type: "span", _key: ulid(), text: "5. Bài Tập Về Nhà & Tổng Kết" }],
		},
		{
			_type: "block",
			_key: ulid(),
			style: "normal",
			children: [
				{
					_type: "span",
					_key: ulid(),
					text: "Học viên hãy tìm thêm 3 thế cờ chĩa đôi của quân Mã trong các ván cờ thực chiến và luyện tập 5 câu đố cờ vua cấp Mã mỗi ngày.",
				},
			],
		},
	];

	if (existing) {
		await contentWithWrite.update("lessons", existing.id, {
			title: "Bài học mẫu: Đòn Tấn Công Đôi Của Quân Mã",
			content: sampleContent,
			course_id: courseId,
			module_id: moduleId,
			level: "ma",
			themes: "fork, knight, tactics",
			objectives: "Hiểu và thực hiện thành thạo đòn tấn công đôi bằng quân Mã",
			status: "published",
		});
	} else {
		await contentWithWrite.create("lessons", {
			id: lessonId,
			slug: lessonSlug,
			title: "Bài học mẫu: Đòn Tấn Công Đôi Của Quân Mã",
			content: sampleContent,
			course_id: courseId,
			module_id: moduleId,
			level: "ma",
			themes: "fork, knight, tactics",
			objectives: "Hiểu và thực hiện thành thạo đòn tấn công đôi bằng quân Mã",
			status: "published",
			sort_order: 1,
		});
	}

	return {
		success: true,
		courseId,
		moduleId,
		lessonId,
		title: "Bài học mẫu: Đòn Tấn Công Đôi Của Quân Mã",
		slug: lessonSlug,
	};
}

/**
 * Danh sách 4 bài giảng mẫu tương tác nhiều bước
 */
export const SAMPLE_LECTURES = [
	{
		slug: "bai-giang-khai-cuoc-y-co-ban",
		title: "Bài giảng Khai cuộc Ý — Các nguyên lý phát triển quân cơ bản",
		summary: "Kịch bản trình chiếu 5 bước kinh điển của Khai cuộc Ý (Giuoco Piano).",
		level: "ma",
		steps: [
			{
				id: ulid(),
				title: "Bước 1: Nước đi đầu tiên e2-e4",
				fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
				arrows: "e2e4",
				highlights: "e4,d5",
				narration:
					"Trắng mở đầu bằng nước đi Tốt e4, kiểm soát ô trung tâm d5 và mở đường cho Hậu và Tượng phát triển.",
				teacherNotes: "Nhắc nhở học sinh: Luôn chiếm lĩnh trung tâm bằng Tốt ở nước đầu tiên.",
				orientation: "white" as const,
			},
			{
				id: ulid(),
				title: "Bước 2: Đen đáp trả e7-e5",
				fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
				arrows: "e7e5",
				highlights: "e5,d4",
				narration:
					"Đen đối xứng bằng Tốt e5, ngăn cản Tốt Trắng tiến tiếp và giành quyền kiểm soát trung tâm.",
				teacherNotes: "Giải thích khái niệm đối xứng và tranh chấp ô d4.",
				orientation: "white" as const,
			},
			{
				id: ulid(),
				title: "Bước 3: Trắng phát triển Mã Nf3",
				fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
				arrows: "g1f3,f3e5",
				highlights: "f3,e5",
				narration:
					"Trắng đưa Mã lên f3 vừa phát triển quân nhẹ vừa đe dọa trực tiếp Tốt e5 của Đen.",
				teacherNotes: "Quy tắc: Phát triển quân nhẹ đồng thời tạo sức ép.",
				orientation: "white" as const,
			},
			{
				id: ulid(),
				title: "Bước 4: Đen bảo vệ bằng Nc6",
				fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
				arrows: "b8c6,c6e5",
				highlights: "c6,e5",
				narration: "Đen phát triển Mã lên c6 để củng cố phòng thủ cho Tốt e5.",
				teacherNotes: "Phòng thủ tích cực bằng cách phát triển thêm một quân cờ mới.",
				orientation: "white" as const,
			},
			{
				id: ulid(),
				title: "Bước 5: Trắng mở Khai cuộc Ý Bc4",
				fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
				arrows: "f1c4,c4f7",
				highlights: "c4,f7",
				narration:
					"Tượng Trắng lên c4 tấn công trực diện vào điểm yếu f7 của Đen — bắt đầu Khai cuộc Ý lừng danh.",
				teacherNotes: "Nhấn mạnh ô f7 là ô yếu nhất của Đen khi Vua chưa nhập thành.",
				orientation: "white" as const,
			},
		],
	},
	{
		slug: "bai-giang-don-chieu-mo-va-chieu-doi",
		title: "Bài giảng Chiến thuật — Chiếu Mở & Chiếu Đôi Hủy Diệt",
		summary: "Phân tích 4 bước đòn chiếu mở và chiếu đôi không thể cản phá.",
		level: "tuong",
		steps: [
			{
				id: ulid(),
				title: "Bước 1: Thiết lập khẩu súng thần công",
				fen: "r1b1kb1r/pppp1ppp/5n2/4q3/4P3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 7",
				arrows: "c1e3",
				highlights: "e5",
				narration: "Trắng đưa Tượng lên e3 chuẩn bị đòn chiếu mở với Hậu Đen ở cột e.",
				teacherNotes: "Giải thích vị trí Tượng và Xe/Hậu thẳng hàng.",
				orientation: "white" as const,
			},
			{
				id: ulid(),
				title: "Bước 2: Di chuyển quân cản tạo đòn chiếu mở",
				fen: "r1b1kb1r/pppp1ppp/8/4q3/4N3/4B3/PPP2PPP/R2QKB1R b KQkq - 0 8",
				arrows: "e4d6",
				highlights: "d6,e8",
				narration: "Mã Trắng nhảy vào d6 chiếu mở Vua Đen đồng thời bắt Hậu e5.",
				teacherNotes: "Học sinh chú ý: Quân bị chiếu phải xử lý nước chiếu trước.",
				orientation: "white" as const,
			},
			{
				id: ulid(),
				title: "Bước 3: Chiếu đôi — Uy lực tối thượng",
				fen: "r1b2rk1/pp1p1ppp/2n5/q3P3/1bB1N3/5N2/PPP2PPP/R1BQK2R w KQ - 1 9",
				arrows: "e4f6",
				highlights: "f6,g8",
				narration: "Mã f6 chiếu Vua kết hợp Tượng c4 chiếu Vua — Đối phương buộc phải chạy Vua.",
				teacherNotes:
					"Quy tắc vàng: Khi bị chiếu đôi, không thể ăn quân hay che chắn, chỉ có chạy Vua!",
				orientation: "white" as const,
			},
			{
				id: ulid(),
				title: "Bước 4: Kết liễu ván đấu",
				fen: "r1b2r1k/pp1p1Npp/2n5/q3P3/1bB5/5N2/PPP2PPP/R1BQK2R b KQ - 2 9",
				arrows: "f7h6",
				highlights: "h8",
				narration: "Trắng hoàn tất đòn phối hợp giành thắng lợi thuyết phục.",
				teacherNotes: "Tổng kết bài học chiếu đôi cho học sinh.",
				orientation: "white" as const,
			},
		],
	},
	{
		slug: "bai-giang-ky-thuat-chieu-het-hai-xe",
		title: "Bài giảng Tàn cuộc — Kỹ Thuật Chiếu Hết Bậc Thang Bằng 2 Xe",
		summary: "Hướng dẫn từng bước kỹ thuật dồn Vua đối phương vào mép bàn cờ để chiếu hết.",
		level: "xe",
		steps: [
			{
				id: ulid(),
				title: "Bước 1: Cắt hàng kiểm soát",
				fen: "8/8/4k3/8/8/8/R7/1R4K1 w - - 0 1",
				arrows: "b1b6",
				highlights: "b6,c6,d6,e6,f6,g6,h6",
				narration: "Xe b tiến lên b6 tạo thành bức tường ngăn không cho Vua Đen tiến xuống dưới.",
				teacherNotes: "Khái niệm bức tường kiểm soát của Xe.",
				orientation: "white" as const,
			},
			{
				id: ulid(),
				title: "Bước 2: Bước thang thứ hai",
				fen: "8/8/1R2k3/8/8/8/R7/6K1 b - - 1 1",
				arrows: "a2a7",
				highlights: "a7,b7,c7,d7,e7,f7,g7,h7",
				narration:
					"Vua Đen lùi lên hàng 7, Xe a lập tức tiến lên a7 tạo bước thang tiếp theo ép Vua lên hàng 8.",
				teacherNotes: "Hai Xe thay phiên nhau tiến bước như hai bậc thang.",
				orientation: "white" as const,
			},
			{
				id: ulid(),
				title: "Bước 3: Chiếu hết ở hàng đáy",
				fen: "4k3/R7/1R6/8/8/8/8/6K1 w - - 0 2",
				arrows: "b6b8",
				highlights: "b8,e8",
				narration: "Xe b lên b8 chiếu hết Vua Đen vì hàng 7 đã bị Xe a khóa chặt!",
				teacherNotes: "Khẳng định kỹ thuật này áp dụng cho cả 2 Xe hoặc Hậu + Xe.",
				orientation: "white" as const,
			},
		],
	},
	{
		slug: "bai-giang-bay-scholars-mate",
		title: "Bài giảng Khai cuộc — Bẫy Scholar's Mate (Chiếu Hết 4 Nước) & Cách Hóa Giải",
		summary: "Phân tích bẫy Scholar's Mate kinh điển và phương pháp phòng thủ chặt chẽ cho Đen.",
		level: "tot",
		steps: [
			{
				id: ulid(),
				title: "Bước 1: Trắng ra Hậu sớm",
				fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5Q2/PPPP1PPP/RNB1KBNR b KQkq - 1 2",
				arrows: "d1f3",
				highlights: "f3,f7",
				narration: "Trắng đưa Hậu lên f3 sớm nhắm vào điểm yếu f7 của Đen.",
				teacherNotes: "Cảnh báo học sinh: Không nên ra Hậu quá sớm trong khai cuộc.",
				orientation: "white" as const,
			},
			{
				id: ulid(),
				title: "Bước 2: Trắng phối hợp Tượng c4",
				fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 3 3",
				arrows: "f1c4,c4f7,f3f7",
				highlights: "f7",
				narration: "Tượng c4 và Hậu f3 tạo thành thế tấn công chết người vào f7.",
				teacherNotes: "Nhấn mạnh ô f7 là ô yếu nhất.",
				orientation: "white" as const,
			},
			{
				id: ulid(),
				title: "Bước 3: Đen phòng thủ chuẩn xác bằng Nf6",
				fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
				arrows: "g8f6",
				highlights: "f6",
				narration: "Đen đưa Mã lên f6 chặn đứng đường tấn công của Hậu Trắng và đe dọa phản công.",
				teacherNotes: "Cách phòng thủ chuẩn: Dùng Mã cản đường và phát triển quân.",
				orientation: "white" as const,
			},
		],
	},
];

/**
 * Route: lessons/seed-demo-data
 * Nạp bộ dữ liệu demo đầy đủ gồm các khóa, bài học, bài giảng đa bước.
 */
export async function seedDemoDataHandler(ctx: RouteContext): Promise<DemoDataSeedResult> {
	if (
		!ctx.content ||
		typeof (ctx.content as unknown as { create?: unknown }).create !== "function"
	) {
		throw new PluginRouteError("NO_CONTENT_WRITE_ACCESS", "Thiếu quyền ghi nội dung", 500);
	}

	const contentWithWrite = ctx.content as unknown as ContentWriter;

	// 1. Tạo khóa học demo
	const demoCourseSlug = "khoa-hoc-co-vua-mau-duong-sinh";
	const existingCourses = await contentWithWrite.list("courses", { limit: 100 });
	let course = existingCourses.items.find((c) => c.data?.slug === demoCourseSlug);

	let courseId = course?.id;
	if (!courseId) {
		courseId = ulid();
		await contentWithWrite.create("courses", {
			id: courseId,
			slug: demoCourseSlug,
			title: "Khóa Học Cờ Vua Mẫu — Tinh Hoa Chiến Thuật",
			summary:
				"Khóa học mẫu đầy đủ bài giảng tương tác, câu đố và bài kiểm tra theo chuẩn Dương Sinh Chess.",
			level: "ma",
			sessions: 12,
			age_range: "6-14 tuổi",
			status: "published",
		});
	}

	// Tạo module cho khóa demo
	const modules = await contentWithWrite.list("modules", { limit: 100 });
	let moduleRecord = modules.items.find((m) => m.data?.course_id === courseId);
	let moduleId = moduleRecord?.id;
	if (!moduleId) {
		moduleId = ulid();
		await contentWithWrite.create("modules", {
			id: moduleId,
			course_id: courseId,
			title: "Chương Demo: Khai Cuộc & Chiến Thuật",
			sort_order: 1,
			status: "published",
		});
	}

	// 2. Nạp toàn bộ 4 bài giảng tương tác vào `chess_lectures`
	const existingLectures = await contentWithWrite.list("chess_lectures", { limit: 50 });
	const lectureMap = new Map(existingLectures.items.map((l) => [l.data?.slug, l]));
	let primaryLectureId = "";

	for (const lec of SAMPLE_LECTURES) {
		let lecId = lectureMap.get(lec.slug)?.id;
		if (!lecId) {
			lecId = ulid();
			await contentWithWrite.create("chess_lectures", {
				id: lecId,
				slug: lec.slug,
				title: lec.title,
				summary: lec.summary,
				level: lec.level,
				course: courseId,
				script: { steps: lec.steps },
				status: "published",
			});
		}
		if (!primaryLectureId) primaryLectureId = lecId;
	}

	// 3. Tạo 3 bài học demo
	const createdLessons: string[] = [];
	const existingLessons = await contentWithWrite.list("lessons", { limit: 100 });
	const lessonMap = new Map(existingLessons.items.map((les) => [les.data?.slug, les]));

	const demoLessons = [
		{
			slug: "demo-bai-1-nhap-mon-khai-cuoc-y",
			title: "Bài 1: Nhập Môn Khai Cuộc Ý Tương Tác",
			content: [
				{
					_type: "block",
					_key: ulid(),
					style: "h2",
					children: [{ _type: "span", _key: ulid(), text: "Bài Giảng Trình Chiếu Khai Cuộc Ý" }],
				},
				{
					_type: "chess-lecture",
					_key: ulid(),
					lecture: primaryLectureId,
					title: "Bài giảng Khai cuộc Ý — Các nguyên lý phát triển quân cơ bản",
					startStep: 1,
				},
			],
		},
		{
			slug: "demo-bai-2-chien-thuat-tan-cong-canh-vua",
			title: "Bài 2: Chiến Thuật Tấn Công Cánh Vua",
			content: [
				{
					_type: "block",
					_key: ulid(),
					style: "h2",
					children: [{ _type: "span", _key: ulid(), text: "Thế Trận Tấn Công FEN & PGN" }],
				},
				{
					_type: "chess-fen",
					_key: ulid(),
					fen: "r1bqk2r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
					orientation: "white",
					arrows: "c4f7",
					highlights: "f7",
					caption: "Tượng nhắm vào ô f7",
				},
				{
					_type: "chess-puzzle",
					_key: ulid(),
					fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5",
					solution: "c4f7 e8f7",
					prompt: "Trắng hy sinh Tượng vào f7 để kéo Vua Đen ra giữa bàn cờ",
					hint: "Nước đi táo bạo 1. Bxf7+!",
					level: "ma",
				},
			],
		},
		{
			slug: "demo-bai-3-tong-ket-va-kiem-tra",
			title: "Bài 3: Tổng Kết & Kiểm Tra Kỹ Năng",
			content: [
				{
					_type: "block",
					_key: ulid(),
					style: "h2",
					children: [{ _type: "span", _key: ulid(), text: "Luyện Tập & Củng Cố Kiến Thức" }],
				},
				{
					_type: "block",
					_key: ulid(),
					style: "normal",
					children: [
						{
							_type: "span",
							_key: ulid(),
							text: "Chúc mừng học viên đã hoàn thành chuỗi bài học khai cuộc. Hãy làm bài tập trắc nghiệm và câu đố để đạt chứng chỉ hoàn thành khóa học!",
						},
					],
				},
			],
		},
	];

	for (let i = 0; i < demoLessons.length; i++) {
		const l = demoLessons[i];
		if (!l) continue;
		const exist = lessonMap.get(l.slug);
		if (!exist) {
			const id = ulid();
			await contentWithWrite.create("lessons", {
				id,
				slug: l.slug,
				title: l.title,
				content: l.content,
				course_id: courseId,
				module_id: moduleId,
				level: "ma",
				sort_order: i + 1,
				status: "published",
			});
			createdLessons.push(l.slug);
		} else {
			createdLessons.push(l.slug);
		}
	}

	return {
		success: true,
		courseId,
		createdLessons,
		lectureId: primaryLectureId || "demo_lecture_id",
		quizId: "demo_quiz_id",
		puzzlesCreated: 0,
	};
}
