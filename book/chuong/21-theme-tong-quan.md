# 21. Chủ đề (Themes) — cài đặt và tuỳ biến cơ bản

Áp dụng cho vai trò: Quản trị viên/Vận hành, Lập trình viên

## Tổng quan

Một **Theme** EmDash là một site Astro hoàn chỉnh — trang, layout, component, style — phân phối qua `create-astro`. Theme còn kèm một **seed file** để khởi tạo database với Collection, Field, Menu, redirect, và nội dung mẫu ngay lần chạy đầu tiên.

## Theme cung cấp những gì

Một theme là một dự án Astro hoạt động được, gồm:

- **Pages** — route Astro để render nội dung (trang chủ, bài viết, trang lưu trữ...).
- **Layouts** — cấu trúc HTML dùng chung.
- **Components** — thành phần UI tái sử dụng (điều hướng, card, footer).
- **Styles** — cấu hình CSS hoặc Tailwind.
- **Seed file** — JSON mô tả CMS cần tạo loại nội dung và field nào.

> Theme khai báo chính xác Collection và Field nào nó cần thông qua seed file. Hầu hết theme xây dựng trên Collection chuẩn **posts** và **pages**, thêm field và taxonomy khi cần thay vì tự bịa ra loại nội dung hoàn toàn mới.

## Cấu trúc Theme

```
my-theme/
├── package.json           # Metadata theme + cấu hình EmDash
├── astro.config.mjs       # Thiết lập Astro integration
├── src/
│   ├── live.config.ts     # Cấu hình Live Collections
│   ├── pages/             # Route Astro
│   ├── layouts/           # Component layout
│   └── components/        # Component UI
└── .emdash/
    ├── seed.json          # Schema + nội dung mẫu
    └── uploads/            # Tệp media cục bộ tuỳ chọn
```

## Cách Theme khởi tạo site

Tạo một site từ theme đi theo các bước:

1. `create-astro` scaffold dự án từ template.
2. Chạy `npm install` và `npm run dev`.
3. Lần đầu truy cập admin, **Setup Wizard** tự động chạy.
4. Wizard áp dụng seed file, tạo Collection, Menu, redirect, và nội dung.
5. Site sẵn sàng sử dụng.

Với người dùng: chọn một theme, chạy wizard, bắt đầu sửa nội dung — không cần biết gì về database. Với lập trình viên: theme là dự án Astro tiêu chuẩn, tuỳ biến tự do sau khi scaffold xong.

## Cài đặt một Theme

Lệnh sau scaffold một site từ template theme chính thức:

```bash
npm create astro@latest -- --template @emdash-cms/template-blog
```

Theme cộng đồng lưu trên GitHub dùng tiền tố template `github:`:

```bash
npm create astro@latest -- --template github:user/emdash-portfolio
```

Sau khi scaffold, cài dependency và chạy dev server:

```bash
cd my-site
npm install
npm run dev
```

Truy cập `http://localhost:4321/_emdash/admin` để hoàn tất Setup Wizard.

## Setup Wizard (góc nhìn theme)

Setup Wizard tự chạy lần đầu truy cập admin, thực hiện:

1. Hỏi tên site, tagline, thông tin đăng nhập admin.
2. Cho tuỳ chọn kèm nội dung mẫu (sample content).
3. Áp dụng seed file vào database.
4. Chuyển hướng tới admin dashboard.

> Nên chọn "Include sample content" khi khám phá một theme lần đầu — nội dung mẫu minh hoạ cách theme kỳ vọng nội dung được cấu trúc.

## Theme chính thức

EmDash cung cấp các theme khởi đầu chính thức, mỗi loại có biến thể local (SQLite + filesystem) và Cloudflare (D1 + R2):

| Theme | Mô tả | Trường hợp dùng |
| --- | --- | --- |
| `@emdash-cms/template-blog` | Blog tối giản với posts, pages, categories, dark mode | Blog cá nhân, site đơn giản |
| `@emdash-cms/template-portfolio` | Portfolio phong cách biên tập với dự án, font serif (Playfair Display), layout tập trung vào ảnh | Freelancer, agency, người làm sáng tạo |
| `@emdash-cms/template-marketing` | Site marketing nổi bật với các khối Portable Text tuỳ chỉnh (hero, features, testimonials, pricing, FAQ) | Landing page, site SaaS, marketing sản phẩm |

> Đây là các gói theme chính thức phân phối qua `npm create astro`, tương ứng về khái niệm với 3 template Blog/Marketing/Portfolio đã giới thiệu ở [Chương 2](./02-cai-dat-lan-dau.md) (vốn nằm sẵn trong thư mục `templates/` của repo nguồn EmDash) — hai kênh phân phối này cùng mô tả một bộ theme khởi đầu, khác nhau ở cách bạn lấy chúng (`npm create astro --template ...` so với `cp -r templates/...`).

### Biến thể Cloudflare

Để triển khai lên Cloudflare Workers với D1 và R2, thêm hậu tố `-cloudflare` vào tên template:

```bash
npm create astro@latest -- --template @emdash-cms/template-blog-cloudflare
npm create astro@latest -- --template @emdash-cms/template-portfolio-cloudflare
npm create astro@latest -- --template @emdash-cms/template-marketing-cloudflare
```

Các biến thể này đã kèm sẵn `wrangler.jsonc` cho cấu hình triển khai.

## Tuỳ biến sau khi cài

Sau khi Setup Wizard hoàn tất, site là một dự án Astro tiêu chuẩn — tuỳ biến như bất kỳ site Astro nào:

- Sửa trang trong `src/pages/`.
- Sửa layout trong `src/layouts/`.
- Thêm Collection qua admin UI.
- Cài Astro integration.
- Triển khai ở bất kỳ đâu Astro chạy được.

Seed file chỉ dùng trong lần thiết lập ban đầu. Sau đó, quản lý mô hình nội dung qua admin panel hoặc CLI (xem lại [Chương 5](./05-khai-niem-cot-loi.md) và [Chương 17](./17-content-types-builder.md)).

## Lưu ý

- Chương này tập trung vào góc nhìn **dùng** theme có sẵn — nếu bạn muốn tự xây dựng một theme từ đầu (dành cho lập trình viên), xem [Chương 47 — Xây dựng Theme từ đầu](./47-xay-dung-theme.md)
- Chi tiết cú pháp seed file đầy đủ nằm ở [Chương 48 — Seed Files](./48-seed-files.md)

## Xem thêm

- [Chương 2 — Cài đặt lần đầu và Trình cài đặt (Setup Wizard)](./02-cai-dat-lan-dau.md)
- [Chương 5 — Các khái niệm cốt lõi (bản đồ thuật ngữ)](./05-khai-niem-cot-loi.md)
- [Chương 17 — Xây dựng Loại nội dung (Content Types Builder)](./17-content-types-builder.md)
- [Chương 23 — Di chuyển từ WordPress](./23-di-chuyen-tu-wordpress.md)
- [Chương 47 — Xây dựng Theme từ đầu](./47-xay-dung-theme.md)
- [Chương 48 — Seed Files](./48-seed-files.md)
