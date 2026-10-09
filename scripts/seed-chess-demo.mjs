import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("demos/dsc-edu-vn/data.db");
const now = new Date().toISOString();

// 1. Categories
const categories = [
	{
		id: "cat_intro",
		slug: "nhap-mon-vo-long",
		name: "Nhập Môn & Vỡ Lòng",
		description: "Khóa học dành cho các bạn nhỏ và người mới bắt đầu làm quen với cờ vua.",
		sort_order: 1,
	},
	{
		id: "cat_opening",
		slug: "khai-cuoc-chuan",
		name: "Khai Cuộc Chuẩn",
		description: "Các hệ thống khai cuộc bài bản, làm chủ trung tâm và bẫy khai cuộc.",
		sort_order: 2,
	},
	{
		id: "cat_tactics",
		slug: "chien-thuat-don-phoi-hop",
		name: "Chiến Thuật & Đòn Phối Hợp",
		description: "Rèn luyện khả năng quan sát và tính toán các đòn chiến thuật sắc bén.",
		sort_order: 3,
	},
	{
		id: "cat_endgame",
		slug: "tan-cuoc-kinh-dien",
		name: "Tàn Cuộc Kinh Điển",
		description: "Kỹ thuật tàn cuộc Xe, Tốt căn bản giúp chuyển hóa ưu thế thành chiến thắng.",
		sort_order: 4,
	},
];

const insertCat = db.prepare(`
  INSERT OR REPLACE INTO ec_course_categories (
    id, slug, status, created_at, updated_at, published_at, version, locale, translation_group, name, description, sort_order
  ) VALUES (?, ?, 'published', ?, ?, ?, 1, 'en', ?, ?, ?, ?)
`);

for (const cat of categories) {
	insertCat.run(cat.id, cat.slug, now, now, now, cat.id, cat.name, cat.description, cat.sort_order);
}

// 2. Membership Plans
const plans = [
	{
		id: "plan_monthly",
		slug: "goi-thanh-vien-thang",
		name: "Gói Hội Viên Tháng",
		description: "Truy cập toàn bộ thư viện khóa học cơ bản & luyện tập thế cờ hàng ngày.",
		price: 99000,
		sale_price: null,
		currency: "VND",
		billing_period: "tháng",
		features: JSON.stringify([
			"Truy cập hơn 20+ khóa học cờ vua nền tảng",
			"Luyện tập 1.000+ câu đố thế cờ có hướng dẫn",
			"Tham gia giải đấu online học đường hàng tuần",
			"Giải đáp thắc mắc chuyên môn trong cộng đồng",
		]),
		sort_order: 1,
	},
	{
		id: "plan_yearly",
		slug: "goi-hoi-vien-nam-tiet-kiem",
		name: "Gói Hội Viên Năm (Tiết Kiệm 30%)",
		description: "Lộ trình học cờ vua toàn diện 1 năm cho học sinh & phụ huynh đồng hành.",
		price: 899000,
		sale_price: 699000,
		currency: "VND",
		billing_period: "năm",
		features: JSON.stringify([
			"Toàn bộ đặc quyền của gói Hội Viên Tháng",
			"Tiết kiệm hơn 30% học phí so với trả theo tháng",
			"Mở khóa toàn bộ khóa Khai cuộc & Chiến thuật nâng cao",
			"Huấn luyện viên chấm và phân tích 2 ván đấu/tháng",
			"Chứng chỉ hoàn thành cấp độ từ Cờ Vua Học Đường",
		]),
		sort_order: 2,
	},
	{
		id: "plan_vip_lifetime",
		slug: "goi-vip-hoc-duong-tron-doi",
		name: "Gói VIP Học Đường Trọn Đời",
		description: "Gói huấn luyện và tài khoản trọn đời đồng hành phát triển tài năng nhí.",
		price: 2490000,
		sale_price: 1990000,
		currency: "VND",
		billing_period: "trọn đời",
		features: JSON.stringify([
			"Mở khóa TOÀN BỘ khóa học hiện tại & tương lai",
			"Tặng 3 buổi kèm 1-1 trực tuyến cùng Kiện tướng/HLV Quốc gia",
			"Tặng 01 bộ cờ vua tiêu chuẩn thi đấu giao tận nhà",
			"Ưu tiên hỗ trợ sư phạm và định hướng thi đấu giải trẻ",
		]),
		sort_order: 3,
	},
];

const insertPlan = db.prepare(`
  INSERT OR REPLACE INTO ec_membership_plans (
    id, slug, status, created_at, updated_at, published_at, version, locale, translation_group, name, description, price, sale_price, currency, billing_period, features, sort_order
  ) VALUES (?, ?, 'published', ?, ?, ?, 1, 'en', ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const p of plans) {
	insertPlan.run(
		p.id,
		p.slug,
		now,
		now,
		now,
		p.id,
		p.name,
		p.description,
		p.price,
		p.sale_price,
		p.currency,
		p.billing_period,
		p.features,
		p.sort_order,
	);
}

// 3. Courses
const courses = [
	{
		id: "course_chess_intro",
		slug: "nhap-mon-co-vua-cho-nguoi-moi-bat-dau",
		title: "Nhập Môn Cờ Vua: Tự Tin Đi Nước Cờ Đầu Tiên",
		excerpt:
			"Khóa học nền tảng từ quy tắc bàn cờ, cách di chuyển các quân đến những đòn phối hợp căn bản nhất.",
		description: "Khóa học được thiết kế đặc biệt cho học sinh và người mới bắt đầu.",
		featured_image:
			"https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=80",
		category_id: "cat_intro",
		access_level: "free",
		is_purchasable: 1,
		price: 199000,
		sale_price: 149000,
		currency: "VND",
		duration_hours: 2.5,
		difficulty: "beginner",
		featured: 1,
	},
	{
		id: "course_chess_tactics",
		slug: "100-don-chien-thuat-chieu-het-kinh-dien",
		title: "100 Đòn Chiến Thuật & Phối Hợp Chiếu Hết Kinh Điển",
		excerpt:
			"Luyện mắt chiến thuật qua 100 dạng thế cờ: Đòn bắt đôi, găm quân, giương đông kích tây và chiếu bí bất ngờ.",
		description:
			"Chiến thuật là linh hồn của ván cờ. Khóa học giúp bạn tìm ra nước đi sát thương nhất.",
		featured_image:
			"https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&auto=format&fit=crop&q=80",
		category_id: "cat_tactics",
		access_level: "paid",
		is_purchasable: 1,
		price: 399000,
		sale_price: 299000,
		currency: "VND",
		duration_hours: 4.0,
		difficulty: "intermediate",
		featured: 1,
	},
	{
		id: "course_chess_opening_italian",
		slug: "bi-quyet-khai-cuoc-italian-va-bay-khai-cuoc",
		title: "Bí Quyết Khai Cuộc Italian & Bẫy Khai Cuộc Học Đường",
		excerpt:
			"Chinh phục Khai cuộc Ý (Giuoco Piano & Evans Gambit), phát triển quân thần tốc và bảo vệ Vua vững chắc.",
		description:
			"Khai cuộc Ý là hệ thống khai cuộc phổ biến và hiệu quả nhất cho các kỳ thủ học đường.",
		featured_image:
			"https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800&auto=format&fit=crop&q=80",
		category_id: "cat_opening",
		access_level: "membership",
		is_purchasable: 1,
		price: 499000,
		sale_price: 349000,
		currency: "VND",
		duration_hours: 5.5,
		difficulty: "intermediate",
		featured: 1,
	},
	{
		id: "course_chess_endgame_rook",
		slug: "tuyet-ky-co-tan-xe-tot-can-ban-den-chuyen-sau",
		title: "Tuyệt Kỹ Cờ Tàn Xe & Tốt: Căn Bản Đến Chuyên Sâu",
		excerpt:
			"Nắm chắc các thế cờ tàn mẫu mực (Lucena, Philidor) giúp chuyển hóa ưu thế thành chiến thắng tuyệt đối.",
		description: "90% các ván cờ đều dẫn đến tàn cuộc Xe. Nắm vững kỹ thuật để làm chủ ván đấu.",
		featured_image:
			"https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=800&auto=format&fit=crop&q=80",
		category_id: "cat_endgame",
		access_level: "paid",
		is_purchasable: 1,
		price: 450000,
		sale_price: 350000,
		currency: "VND",
		duration_hours: 3.5,
		difficulty: "advanced",
		featured: 0,
	},
];

const insertCourse = db.prepare(`
  INSERT OR REPLACE INTO ec_courses (
    id, slug, status, created_at, updated_at, published_at, version, locale, translation_group,
    title, excerpt, description, featured_image, category_id, access_level, is_purchasable, price, sale_price, currency, duration_hours, difficulty, featured
  ) VALUES (?, ?, 'published', ?, ?, ?, 1, 'en', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const c of courses) {
	insertCourse.run(
		c.id,
		c.slug,
		now,
		now,
		now,
		c.id,
		c.title,
		c.excerpt,
		c.description,
		c.featured_image,
		c.category_id,
		c.access_level,
		c.is_purchasable,
		c.price,
		c.sale_price,
		c.currency,
		c.duration_hours,
		c.difficulty,
		c.featured,
	);
}

// 4. Modules
const modules = [
	// Course 1 modules
	{
		id: "mod_intro_1",
		course_id: "course_chess_intro",
		slug: "lam-quen-ban-co-va-quan-co",
		title: "Phần 1: Bàn Cờ & Cách Đi Các Quân",
		sort_order: 1,
	},
	{
		id: "mod_intro_2",
		course_id: "course_chess_intro",
		slug: "cac-nuoc-di-dac-biet-va-luat-choi",
		title: "Phần 2: Nước Đi Đặc Biệt & Luật Kết Thúc",
		sort_order: 2,
	},

	// Course 2 modules
	{
		id: "mod_tac_1",
		course_id: "course_chess_tactics",
		slug: "don-tan-cong-doi-va-gam-quan",
		title: "Chương 1: Đòn Tấn Công Đôi & Giằng Quân",
		sort_order: 1,
	},
	{
		id: "mod_tac_2",
		course_id: "course_chess_tactics",
		slug: "don-chieu-bi-dac-sac",
		title: "Chương 2: Các Hình Mẫu Chiếu Hết Điển Hình",
		sort_order: 2,
	},
];

const insertModule = db.prepare(`
  INSERT OR REPLACE INTO ec_modules (
    id, slug, status, created_at, updated_at, published_at, version, locale, translation_group, title, course_id, sort_order
  ) VALUES (?, ?, 'published', ?, ?, ?, 1, 'en', ?, ?, ?, ?)
`);

for (const m of modules) {
	insertModule.run(m.id, m.slug, now, now, now, m.id, m.title, m.course_id, m.sort_order);
}

// 5. Lessons
const lessons = [
	// Course 1 - Module 1
	{
		id: "les_intro_1_1",
		course_id: "course_chess_intro",
		module_id: "mod_intro_1",
		slug: "ban-co-toa-do-va-cach-xep-quan",
		title: "Bài 1: Bàn cờ, hệ tọa độ và cách xếp quân chuẩn",
		duration_minutes: 15,
		is_preview: 1,
		sort_order: 1,
		video_url: "https://www.youtube.com/embed/fKxG8KjH1RE",
	},
	{
		id: "les_intro_1_2",
		course_id: "course_chess_intro",
		module_id: "mod_intro_1",
		slug: "cach-di-va-an-quan-tot-xe-ma-tuong",
		title: "Bài 2: Cách di chuyển và ăn quân của Tốt, Xe, Mã, Tượng",
		duration_minutes: 20,
		is_preview: 1,
		sort_order: 2,
		video_url: "https://www.youtube.com/embed/fKxG8KjH1RE",
	},
	{
		id: "les_intro_1_3",
		course_id: "course_chess_intro",
		module_id: "mod_intro_1",
		slug: "suc-manh-cua-hau-va-su-an-toan-cua-vua",
		title: "Bài 3: Sức mạnh bá chủ của Hậu và bảo vệ Vua",
		duration_minutes: 18,
		is_preview: 0,
		sort_order: 3,
		video_url: "",
	},
	// Course 1 - Module 2
	{
		id: "les_intro_2_1",
		course_id: "course_chess_intro",
		module_id: "mod_intro_2",
		slug: "ky-thuat-nhap-thanh-an-toan",
		title: "Bài 4: Nhập thành cánh Vua & Cánh Hậu đúng luật",
		duration_minutes: 15,
		is_preview: 0,
		sort_order: 1,
		video_url: "",
	},
	{
		id: "les_intro_2_2",
		course_id: "course_chess_intro",
		module_id: "mod_intro_2",
		slug: "bat-tot-qua-duong-va-phong-cap",
		title: "Bài 5: Bắt tốt qua đường (En Passant) và Phong cấp",
		duration_minutes: 15,
		is_preview: 0,
		sort_order: 2,
		video_url: "",
	},
	{
		id: "les_intro_2_3",
		course_id: "course_chess_intro",
		module_id: "mod_intro_2",
		slug: "chieu-chieu-het-va-hoa-co-stalemate",
		title: "Bài 6: Phân biệt Chiếu, Chiếu Hết và Hòa Cờ (Stalemate)",
		duration_minutes: 25,
		is_preview: 0,
		sort_order: 3,
		video_url: "",
	},

	// Course 2 - Module 1
	{
		id: "les_tac_1_1",
		course_id: "course_chess_tactics",
		module_id: "mod_tac_1",
		slug: "nghe-thuat-chia-doi-cua-ma-va-hau",
		title: "Bài 1: Tuyệt chiêu Chĩa Đôi (Fork) của quân Mã & Hậu",
		duration_minutes: 25,
		is_preview: 1,
		sort_order: 1,
		video_url: "https://www.youtube.com/embed/fKxG8KjH1RE",
	},
	{
		id: "les_tac_1_2",
		course_id: "course_chess_tactics",
		module_id: "mod_tac_1",
		slug: "don-giang-quan-pin-va-cach-hoa-giai",
		title: "Bài 2: Đòn Giằng Quân (Pin) tuyệt đối & tương đối",
		duration_minutes: 30,
		is_preview: 0,
		sort_order: 2,
		video_url: "",
	},
	// Course 2 - Module 2
	{
		id: "les_tac_2_1",
		course_id: "course_chess_tactics",
		module_id: "mod_tac_2",
		slug: "chieu-that-smothered-mate-huyen-thoai",
		title: "Bài 3: Đòn Chiếu Thắt (Smothered Mate) nghẹt thở",
		duration_minutes: 20,
		is_preview: 0,
		sort_order: 1,
		video_url: "",
	},
	{
		id: "les_tac_2_2",
		course_id: "course_chess_tactics",
		module_id: "mod_tac_2",
		slug: "chieu-het-hang-day-back-rank-mate",
		title: "Bài 4: Bẫy Chiếu Hết Hàng Ngang Đáy (Back-rank Mate)",
		duration_minutes: 20,
		is_preview: 0,
		sort_order: 2,
		video_url: "",
	},
];

const insertLesson = db.prepare(`
  INSERT OR REPLACE INTO ec_lessons (
    id, slug, status, created_at, updated_at, published_at, version, locale, translation_group,
    title, module_id, course_id, duration_minutes, is_preview, sort_order, video_url
  ) VALUES (?, ?, 'published', ?, ?, ?, 1, 'en', ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const l of lessons) {
	insertLesson.run(
		l.id,
		l.slug,
		now,
		now,
		now,
		l.id,
		l.title,
		l.module_id,
		l.course_id,
		l.duration_minutes,
		l.is_preview,
		l.sort_order,
		l.video_url,
	);
}

console.log("Seeded demo data successfully:");
console.log(
	"- Categories:",
	db.prepare("SELECT count(*) as count FROM ec_course_categories").get().count,
);
console.log(
	"- Membership Plans:",
	db.prepare("SELECT count(*) as count FROM ec_membership_plans").get().count,
);
console.log("- Courses:", db.prepare("SELECT count(*) as count FROM ec_courses").get().count);
console.log("- Modules:", db.prepare("SELECT count(*) as count FROM ec_modules").get().count);
console.log("- Lessons:", db.prepare("SELECT count(*) as count FROM ec_lessons").get().count);
