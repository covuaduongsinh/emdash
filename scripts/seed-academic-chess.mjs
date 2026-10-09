import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

const now = new Date().toISOString();

// 1. Categories
const categories = [
	{
		id: "cat_intro",
		slug: "nhap-mon-vo-long",
		name: "Nhập Môn & Vỡ Lòng",
		description:
			"Khung kiến thức chuẩn hóa dành cho các bạn nhỏ và học sinh mới bắt đầu làm quen với cờ vua.",
		sort_order: 1,
	},
	{
		id: "cat_opening",
		slug: "khai-cuoc-chuan",
		name: "Khai Cuộc Chuẩn Mực",
		description: "Các hệ thống khai cuộc bài bản, nguyên lý chiếm lĩnh trung tâm và an toàn Vua.",
		sort_order: 2,
	},
	{
		id: "cat_tactics",
		slug: "chien-thuat-don-phoi-hop",
		name: "Chiến Thuật & Đòn Phối Hợp",
		description:
			"Rèn luyện khả năng quan sát, tính toán nước đi và nhận biết các đòn phối hợp chiến thuật.",
		sort_order: 3,
	},
	{
		id: "cat_endgame",
		slug: "tan-cuoc-kinh-dien",
		name: "Tàn Cuộc & Tư Duy Chiến Lược",
		description:
			"Kỹ thuật tàn cuộc mẫu mực giúp rèn luyện tính kiên trì và tư duy logic chính xác.",
		sort_order: 4,
	},
];

// 2. Academic Plans (Thẻ Thư Viện Học Đường)
const plans = [
	{
		id: "plan_monthly",
		slug: "the-thu-vien-hoc-ky",
		name: "Thẻ Thư Viện Học Kỳ",
		description:
			"Đồng hành học tập suốt 1 học kỳ, truy cập toàn bộ kho bài giảng nền tảng và bài tập thế cờ.",
		price: 99000,
		sale_price: null,
		currency: "VND",
		billing_period: "học kỳ",
		features: JSON.stringify([
			"Toàn quyền học hơn 20+ chuyên đề cờ vua học đường",
			"Thực hành hơn 1.000+ thế cờ tương tác có phân tích",
			"Tài liệu bài tập PDF in ấn bổ trợ kiến thức",
			"Hỏi đáp chuyên môn cùng Hội đồng Sư phạm",
		]),
		sort_order: 1,
	},
	{
		id: "plan_yearly",
		slug: "the-thu-vien-nien-hoc",
		name: "Thẻ Thư Viện Niên Học (Trọn Năm)",
		description:
			"Giải pháp đồng hành học tập toàn diện suốt cả năm học dành cho học sinh phổ thông.",
		price: 699000,
		sale_price: null,
		currency: "VND",
		billing_period: "năm học",
		features: JSON.stringify([
			"Toàn bộ quyền lợi của Thẻ Thư Viện Học Kỳ",
			"Mở khóa toàn bộ chuyên đề Khai cuộc, Chiến thuật & Tàn cuộc",
			"Nhận trọn bộ cẩm nang & sơ đồ tư duy cờ vua học đường PDF",
			"Hỗ trợ phân tích chuyên sâu 2 ván cờ/tháng bởi Kiện tướng",
			"Giấy chứng nhận hoàn thành cấp độ từ Cờ Vua Học Đường",
		]),
		sort_order: 2,
	},
	{
		id: "plan_vip_lifetime",
		slug: "the-thu-vien-truong-hoc-clb",
		name: "Thẻ Thư Viện Trường Học & CLB",
		description:
			"Dành cho Giáo viên Phụ trách & Ban Chủ nhiệm CLB Cờ vua trường học sử dụng giảng dạy tập thể.",
		price: 1990000,
		sale_price: null,
		currency: "VND",
		billing_period: "trọn đời",
		features: JSON.stringify([
			"Toàn quyền sử dụng kho bài giảng trình chiếu trên lớp học",
			"Chuyển giao trọn bộ giáo án sinh hoạt CLB 36 tuần theo năm học",
			"Tập huấn phương pháp sư phạm 1-1 cho giáo viên phụ trách CLB",
			"Tặng 01 bộ cờ treo tường biểu diễn & cẩm nang sinh hoạt CLB",
			"Cố vấn chuyên môn xuyên suốt quá trình hoạt động của CLB",
		]),
		sort_order: 3,
	},
];

// 3. Courses
const courses = [
	{
		id: "course_chess_intro",
		slug: "nhap-mon-co-vua-cho-nguoi-moi-bat-dau",
		title: "Nhập Môn Cờ Vua: Làm Quen Bàn Cờ & Tư Duy Nước Đi",
		excerpt:
			"Khung kiến thức chuẩn hóa từ quy tắc bàn cờ, cách di chuyển quân đến những bài học tư duy không gian trực quan.",
		description:
			"Chuyên đề được thiết kế sư phạm đặc biệt dành cho học sinh mầm non và tiểu học mới làm quen cờ vua.",
		featured_image:
			"https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=80",
		category_id: "cat_intro",
		access_level: "free",
		is_purchasable: 1,
		price: 149000,
		sale_price: null,
		currency: "VND",
		duration_hours: 2.5,
		difficulty: "beginner",
		featured: 1,
	},
	{
		id: "course_chess_tactics",
		slug: "100-don-chien-thuat-chieu-het-kinh-dien",
		title: "100 Đòn Chiến Thuật & Bài Tập Phối Hợp Mẫu Mực",
		excerpt:
			"Rèn luyện khả năng quan sát và tính toán nước đi: Đòn bắt đôi, găm quân, giương đông kích tây và phối hợp lực lượng.",
		description:
			"Chiến thuật là nền tảng rèn luyện khả năng tính toán chính xác và tư duy phản xạ nhanh cho học sinh.",
		featured_image:
			"https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&auto=format&fit=crop&q=80",
		category_id: "cat_tactics",
		access_level: "paid",
		is_purchasable: 1,
		price: 299000,
		sale_price: null,
		currency: "VND",
		duration_hours: 4.0,
		difficulty: "intermediate",
		featured: 1,
	},
	{
		id: "course_chess_opening_italian",
		slug: "bi-quyet-khai-cuoc-italian-va-bay-khai-cuoc",
		title: "Nguyên Lý Khai Cuộc Ý & Phương Pháp Phát Triển Quân Nhanh",
		excerpt:
			"Làm chủ Khai cuộc Ý (Giuoco Piano), nguyên tắc kiểm soát trung tâm và bảo vệ Vua an toàn.",
		description:
			"Khai cuộc Ý là hệ thống khai cuộc chuẩn mực và mang tính sư phạm cao nhất cho các bạn học sinh.",
		featured_image:
			"https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800&auto=format&fit=crop&q=80",
		category_id: "cat_opening",
		access_level: "membership",
		is_purchasable: 1,
		price: 349000,
		sale_price: null,
		currency: "VND",
		duration_hours: 5.5,
		difficulty: "intermediate",
		featured: 1,
	},
	{
		id: "course_chess_endgame_rook",
		slug: "tuyet-ky-co-tan-xe-tot-can-ban-den-chuyen-sau",
		title: "Nghệ Thuật Cờ Tàn Xe & Tốt: Rèn Luyện Tính Kiên Trì",
		excerpt:
			"Nắm chắc các thế cờ tàn mẫu mực (Lucena, Philidor), rèn luyện tư duy quy nạp và chuyển hóa ưu thế.",
		description:
			"Cờ tàn là thước đo chiều sâu tư duy và sự kiên định của học sinh trong từng quyết định.",
		featured_image:
			"https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=800&auto=format&fit=crop&q=80",
		category_id: "cat_endgame",
		access_level: "paid",
		is_purchasable: 1,
		price: 350000,
		sale_price: null,
		currency: "VND",
		duration_hours: 3.5,
		difficulty: "advanced",
		featured: 0,
	},
];

// Generate SQL for local and remote D1
let sqlScript = "PRAGMA foreign_keys = OFF;\n\n";

// Categories
for (const cat of categories) {
	sqlScript += `INSERT OR REPLACE INTO ec_course_categories (id, slug, status, created_at, updated_at, published_at, version, locale, translation_group, name, description, sort_order) VALUES ('${cat.id}', '${cat.slug}', 'published', '${now}', '${now}', '${now}', 1, 'en', '${cat.id}', '${cat.name.replace(/'/g, "''")}', '${cat.description.replace(/'/g, "''")}', ${cat.sort_order});\n`;
}

// Plans
for (const p of plans) {
	sqlScript += `INSERT OR REPLACE INTO ec_membership_plans (id, slug, status, created_at, updated_at, published_at, version, locale, translation_group, name, description, price, sale_price, currency, billing_period, features, sort_order) VALUES ('${p.id}', '${p.slug}', 'published', '${now}', '${now}', '${now}', 1, 'en', '${p.id}', '${p.name.replace(/'/g, "''")}', '${p.description.replace(/'/g, "''")}', ${p.price}, ${p.sale_price === null ? "NULL" : p.sale_price}, '${p.currency}', '${p.billing_period}', '${p.features.replace(/'/g, "''")}', ${p.sort_order});\n`;
}

// Courses
for (const c of courses) {
	sqlScript += `INSERT OR REPLACE INTO ec_courses (id, slug, status, created_at, updated_at, published_at, version, locale, translation_group, title, excerpt, description, featured_image, category_id, access_level, is_purchasable, price, sale_price, currency, duration_hours, difficulty, featured) VALUES ('${c.id}', '${c.slug}', 'published', '${now}', '${now}', '${now}', 1, 'en', '${c.id}', '${c.title.replace(/'/g, "''")}', '${c.excerpt.replace(/'/g, "''")}', '${c.description.replace(/'/g, "''")}', '${c.featured_image}', '${c.category_id}', '${c.access_level}', ${c.is_purchasable}, ${c.price}, ${c.sale_price === null ? "NULL" : c.sale_price}, '${c.currency}', ${c.duration_hours}, '${c.difficulty}', ${c.featured});\n`;
}

sqlScript += "\nPRAGMA foreign_keys = ON;\n";

fs.writeFileSync("demos/cloudflare/scripts/update-academic-data.sql", sqlScript);

// Apply to local DB
const db = new DatabaseSync("demos/dsc-edu-vn/data.db");
db.exec(sqlScript);

console.log(
	"Updated academic data in local database and generated demos/cloudflare/scripts/update-academic-data.sql",
);
