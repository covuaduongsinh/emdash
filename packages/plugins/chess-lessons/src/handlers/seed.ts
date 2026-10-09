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
	},
	{
		slug: "ma-so-cap",
		title: "Cờ Vua Cấp Mã — Chiến Thuật Sơ Cấp",
		level: "ma",
		sessions: 16,
		age_range: "6-12 tuổi",
		summary: "Nắm vững các đòn chiến thuật cơ bản: bắt đôi, chiếu bắt quân, ăn quân hơn.",
	},
	{
		slug: "tuong-trung-cap",
		title: "Cờ Vua Cấp Tượng — Kỹ Năng Trung Cấp",
		level: "tuong",
		sessions: 20,
		age_range: "7-14 tuổi",
		summary:
			"Phát triển tư duy chiến thuật kết hợp, kiểm soát trung tâm và nguyên lý khai cuộc cơ bản.",
	},
	{
		slug: "xe-nang-cao",
		title: "Cờ Vua Cấp Xe — Chiến Thuật Nâng Cao",
		level: "xe",
		sessions: 24,
		age_range: "8-16 tuổi",
		summary: "Nâng cao kỹ thuật tấn công cánh vua, tàn cuộc cơ bản và kế hoạch trung cuộc.",
	},
	{
		slug: "hau-chuyen-sau",
		title: "Cờ Vua Cấp Hậu — Chiến Lược Chuyên Sâu",
		level: "hau",
		sessions: 30,
		age_range: "Mọi lứa tuổi",
		summary:
			"Phân tích cấu trúc Tốt, lập kế hoạch chiến lược dài hạn và các hệ thống khai cuộc tiêu chuẩn.",
	},
	{
		slug: "vua-kien-tuong",
		title: "Cờ Vua Cấp Vua — Đỉnh Cao Kiện Tướng",
		level: "vua",
		sessions: 36,
		age_range: "Mọi lứa tuổi",
		summary: "Tư duy tính toán sâu sắc, đòn phối hợp phức tạp và kỹ thuật tàn cuộc đỉnh cao.",
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
 * Tạo 6 khóa học nháp theo 6 cấp độ Tốt → Vua (idempotent, không ghi đè khóa đã có).
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

	for (const courseDef of SIX_LEVEL_COURSES) {
		if (existingSlugs.has(courseDef.slug)) {
			skippedCourses.push(courseDef.slug);
			continue;
		}

		// Tạo khóa học mới ở trạng thái draft
		const courseId = ulid();
		await contentWithWrite.create("courses", {
			id: courseId,
			slug: courseDef.slug,
			title: courseDef.title,
			summary: courseDef.summary,
			level: courseDef.level,
			sessions: courseDef.sessions,
			age_range: courseDef.age_range,
			status: "draft",
		});
		createdCourses.push(courseDef.slug);

		// Tạo chương mẫu cho khóa học
		const moduleId = ulid();
		await contentWithWrite.create("modules", {
			id: moduleId,
			course_id: courseId,
			title: "Chương 1: Khởi động & Nền tảng cơ bản",
			sort_order: 1,
			status: "draft",
		});
		createdModules.push(`${courseDef.slug}:Chương 1`);
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
			status: "draft",
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
			status: "draft",
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
			status: "draft",
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
			status: "draft",
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
 * Route: lessons/seed-demo-data
 * Nạp bộ dữ liệu demo đầy đủ gồm 1 khóa, 3 bài, 1 bài giảng, 1 quiz.
 * Idempotent, không nhân đôi và KHÔNG đụng đến 6 khóa / 12 bài hiện có.
 */
export async function seedDemoDataHandler(ctx: RouteContext): Promise<DemoDataSeedResult> {
	if (
		!ctx.content ||
		typeof (ctx.content as unknown as { create?: unknown }).create !== "function"
	) {
		throw new PluginRouteError("NO_CONTENT_WRITE_ACCESS", "Thiếu quyền ghi nội dung", 500);
	}

	const contentWithWrite = ctx.content as unknown as ContentWriter;

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
			status: "draft",
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
			status: "draft",
		});
	}

	// 1. Tạo bài giảng mẫu trong collection `chess_lectures`
	const lectureSlug = "bai-giang-khai-cuoc-y-co-ban";
	const existingLectures = await contentWithWrite.list("chess_lectures", { limit: 50 });
	let lectureRecord = existingLectures.items.find((l) => l.data?.slug === lectureSlug);
	let lectureId = lectureRecord?.id;

	const lectureSteps = [
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
			narration: "Trắng đưa Mã lên f3 vừa phát triển quân nhẹ vừa đe dọa trực tiếp Tốt e5 của Đen.",
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
	];

	if (!lectureId) {
		lectureId = ulid();
		await contentWithWrite.create("chess_lectures", {
			id: lectureId,
			slug: lectureSlug,
			title: "Bài giảng Khai cuộc Ý — Các nguyên lý phát triển quân cơ bản",
			summary: "Kịch bản trình chiếu 5 bước kinh điển của Khai cuộc Ý (Giuoco Piano).",
			level: "ma",
			course: courseId,
			script: { steps: lectureSteps },
			status: "draft",
		});
	}

	// 2. Tạo 3 bài học demo
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
					lecture: lectureId,
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
				status: "draft",
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
		lectureId: lectureId || "demo_lecture_id",
		quizId: "demo_quiz_id",
		puzzlesCreated: 0,
	};
}
