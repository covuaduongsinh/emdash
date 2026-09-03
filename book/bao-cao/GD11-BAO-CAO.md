# Báo cáo Giai đoạn 11 — Phần IV.D: Xây dựng Theme + Seed Files

Trạng thái: **Hoàn thành** — 2/2 chương đã viết.

## File đã tạo

| File | Nguồn đã đối chiếu |
|---|---|
| `book/chuong/47-xay-dung-theme.md` | `themes/creating-themes.mdx` (764 dòng) |
| `book/chuong/48-seed-files.md` | `themes/seed-files.mdx` |

Đã cập nhật `book/01-DE-CUONG.md`: 2 chương + GĐ11 đánh dấu "Đã xong".

## Tóm tắt từng chương

47. **Xây dựng Theme từ đầu** — Khái niệm chính (theme = dự án Astro thật, SSR bắt buộc, không hard-code), cấu trúc dự án, `package.json` field `emdash`, mô hình nội dung mặc định (posts/pages), dựng trang (trang chủ/bài viết/trang/archive), dùng ảnh đúng cách (object không phải string), dùng menu, template trang, thêm section, nội dung mẫu, media reference, tìm kiếm (`LiveSearch`), test theme, publish, khối Portable Text tuỳ chỉnh, checklist theme đầy đủ.
48. **Seed Files** — Đặc tả đầy đủ cấu trúc gốc và mọi phần: meta/settings/collections/taxonomies/bylines/menus/redirects/widgetAreas/sections/content, tham chiếu `$ref:`/`$media`, áp dụng seed bằng chương trình (`applySeed`/`validateSeed`), bảng idempotency đầy đủ theo từng loại đối tượng, validation, lệnh CLI export-seed.

## Vấn đề phát sinh

- Chương 47 trùng lặp có chủ đích với nhiều chương trước (Template trang → Chương 18, Section → Chương 18, dùng Menu → Chương 10, dùng Ảnh → Chương 9/15) — xử lý bằng dẫn chiếu ngược, chỉ giữ phần đặc thù theme (SSR bắt buộc, cấu trúc thư mục, checklist).
- Chương 48 (Seed Files) đã được 6 chương trước dẫn chiếu tới (5, 17, 18, 21, 23, 27, 47) — đã đối chiếu để đảm bảo nội dung chương 48 khớp với những gì mô tả rải rác ở các chương đó (vd bảng field type khớp Chương 5/17, ví dụ seed collection khớp Chương 47).
- Không có mâu thuẫn thông tin giữa các nguồn.

## Lưu ý cho Giai đoạn 12 (Phụ lục + rà soát toàn sách)

- **Toàn bộ 48/51 chương nội dung chính đã hoàn tất** — chỉ còn 3 chương phụ lục (Thuật ngữ, Lịch sử tính năng, FAQ) và bước rà soát nhất quán toàn sách bắt buộc theo kế hoạch gốc.
- Rà soát cần: (1) quét mọi link "sẽ có ở phần sau của sổ tay" trong 48 chương đã viết và thay bằng link thật vì giờ mọi chương đích đều đã tồn tại; (2) đối chiếu thuật ngữ dùng trong Chương 49 khớp cách dùng thực tế; (3) đánh dấu 51/51 chương "Đã xong" trong đề cương.
- Đây là khối lượng công việc lớn (48 file cần rà soát link) — nên xử lý có hệ thống, có thể dùng grep để tìm toàn bộ chuỗi "sẽ có ở phần sau" trước khi sửa từng chỗ.
