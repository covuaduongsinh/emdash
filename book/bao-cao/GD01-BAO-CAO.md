# Báo cáo Giai đoạn 1 — Phần I: Nhập môn & Cài đặt

Trạng thái: **Hoàn thành** — 5/5 chương đã viết.

## File đã tạo

| File | Nguồn đã đối chiếu |
|---|---|
| `book/chuong/01-emdash-la-gi.md` | `docs/src/content/docs/introduction.mdx`, `why-emdash.mdx` |
| `book/chuong/02-cai-dat-lan-dau.md` | `docs/src/content/docs/getting-started.mdx`, `TEMPLATES.md`, `README.md` |
| `book/chuong/03-them-vao-du-an-co-san.md` | `docs/src/content/docs/existing-project.mdx` |
| `book/chuong/04-so-sanh-wordpress-astro.md` | `docs/src/content/docs/coming-from/wordpress.mdx`, `astro.mdx`, `astro-for-wp-devs.mdx` |
| `book/chuong/05-khai-niem-cot-loi.md` | `docs/src/content/docs/concepts/collections.mdx`, `content-model.mdx` |

Ngoài ra đã cập nhật: `book/01-DE-CUONG.md` (5 chương + GĐ0 + GĐ1 đánh dấu "Đã xong").

## Tóm tắt từng chương

1. **EmDash là gì và dành cho ai** — Giới thiệu tổng quan, kiến trúc, 4 nhóm đối tượng dùng, EmDash là/không phải gì.
2. **Cài đặt lần đầu và Trình cài đặt** — Quy trình `npm create emdash@latest` → Setup Wizard → bài viết đầu tiên, cấu hình `astro.config.mjs`/`live.config.ts`, 3 template khởi đầu.
3. **Thêm EmDash vào dự án Astro có sẵn** — Checklist tích hợp thủ công (packages, integrations, live collections loader) và bảng xử lý sự cố.
4. **So sánh với WordPress / Astro thuần** — Gộp 3 tài liệu "coming-from" thành 3 mục trong một chương: cho dev WordPress (bảng ánh xạ đầy đủ), cho dev Astro (bảng so sánh Astro Collections vs EmDash Collections), và tóm lược bài học nền tảng Astro qua lăng kính WordPress.
5. **Các khái niệm cốt lõi** — Collection, 16 loại Field, system field, seed file — chương "từ điển" nền tảng cho toàn sách.

## Vấn đề phát sinh

- Không có vấn đề về nguồn thiếu thông tin — cả 5 file `.mdx` nguồn đều đầy đủ và rõ ràng.
- File `coming-from/astro-for-wp-devs.mdx` (542 dòng) chỉ được đọc phần heading (không đọc toàn văn) vì đây là bài học nền tảng Astro tổng quát, không chứa thông tin đặc thù EmDash cần trích dẫn chi tiết — chương 4 tóm tắt đúng cấu trúc bài (paradigm shifts, cấu trúc dự án, components, template expressions, props/slots, layouts, styling, client-side JS, routing, bảng ánh xạ khái niệm) mà không diễn giải sai nội dung.
- **Lưu ý kỹ thuật quan trọng cho các phiên sau:** Agent tool không cho phép tạo fork lồng nhau (`Fork is not available inside a forked worker`). Nếu phiên hiện tại đang chạy như một fork, các giai đoạn tiếp theo phải được thực thi trực tiếp (không spawn fork/agent con) hoặc quay lại chạy từ phiên gốc (không phải fork) nếu muốn dùng fork để tiết kiệm ngữ cảnh.

## Lưu ý cho Giai đoạn 2 (Admin Panel, Đăng nhập, Soạn thảo, Media)

- Chương 6 cần dùng ảnh chụp màn hình tại `docs/src/assets/screenshots/admin-dashboard.png`, `admin-post-editor.png`, `admin-posts-list.png` (chỉ mô tả bằng lời, không nhúng ảnh trực tiếp vào markdown).
- Bảng thuật ngữ tạm trong `01-DE-CUONG.md` đã được áp dụng nhất quán ở GĐ1 — tiếp tục dùng đúng cách viết đó (Collection, Field, Passkey, Live Collections, đường dẫn admin panel giữ nguyên tiếng Anh).
- Chương 2 đã giới thiệu sơ lược Passkey; Chương 7 (GĐ2) sẽ đi sâu — tránh lặp lại y nguyên nội dung, chỉ dẫn chiếu ngược.
