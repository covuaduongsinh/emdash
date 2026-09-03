# Báo cáo Giai đoạn 3 — Phần II.B: Menu, Widget, Taxonomy, Preview, Settings, Dark mode, i18n

Trạng thái: **Hoàn thành** — 7/7 chương đã viết.

## File đã tạo

| File | Nguồn đã đối chiếu |
|---|---|
| `book/chuong/10-menu-dieu-huong.md` | `guides/menus.mdx` |
| `book/chuong/11-widget-va-vung-widget.md` | `guides/widgets.mdx` |
| `book/chuong/12-phan-loai-taxonomies.md` | `guides/taxonomies.mdx` |
| `book/chuong/13-xem-truoc-preview.md` | `guides/preview.mdx` |
| `book/chuong/14-cai-dat-site-settings.md` | `guides/site-settings.mdx` |
| `book/chuong/15-che-do-toi.md` | `guides/dark-mode.mdx` |
| `book/chuong/16-da-ngon-ngu-i18n.md` | `guides/internationalization.mdx` |

Đã cập nhật `book/01-DE-CUONG.md`: 7 chương + GĐ3 đánh dấu "Đã xong".

## Tóm tắt từng chương

10. **Menu điều hướng** — Quản lý qua admin/API, 5 loại menu item, truy vấn/render `getMenu()`, ví dụ header responsive.
11. **Widget & Vùng Widget** — 3 loại widget (content/menu/component), 5 component lõi, quản lý qua API, render trong template.
12. **Phân loại nội dung** — Category/Tag mặc định, quản lý term (admin/editor/API), truy vấn, dựng trang archive, taxonomy tuỳ chỉnh.
13. **Xem trước (Preview)** — Cơ chế token HMAC-SHA256, sinh/xác minh URL preview, thời hạn token, ví dụ đầy đủ kèm visual editing.
14. **Cài đặt trang web** — Cấu trúc `SiteSettings`, quản lý qua API, truy vấn trong template (header, social links, SEO, định dạng ngày).
15. **Chế độ tối** — Quy ước class `dark`/`light` trên `<html>`, dark image variant (bật slot, chọn ảnh, render), tuỳ biến quy ước theme khác.
16. **Đa ngôn ngữ (i18n)** — Cấu hình, mô hình row-per-locale, truy vấn có fallback, menu/taxonomy/collection theo locale, language switcher, Content API, CLI, seed, field translatable, sitemap/hreflang tóm tắt.

## Vấn đề phát sinh

- Không có vấn đề về nguồn thiếu thông tin.
- Chương 16 khá dài do nguồn `internationalization.mdx` rất chi tiết (480 dòng) — đã tóm lược phần sitemap/hreflang (chỉ nêu khái niệm, không dịch toàn bộ ví dụ XML/HTML) để giữ chương tập trung vào nội dung đa ngôn ngữ, tránh lấn sang phạm vi SEO kỹ thuật.
- Chương 10, 11 có nội dung thiên về code cho lập trình viên (nguồn gốc `guides/menus.mdx`, `guides/widgets.mdx` chủ yếu là API tham chiếu, không mô tả chi tiết thao tác UI drag-drop) — đã tách rõ phần "Quản lý trong Admin/API" (Quản trị viên) và phần "Truy vấn/render" (Lập trình viên) trong mỗi chương để độc giả theo đúng vai trò đọc đúng phần.

## Lưu ý cho Giai đoạn 4 (Content Types, Layout, Users/Roles, Plugin end-user, Theme cơ bản)

- Chương 19 (Users/Roles) cần dùng đúng bảng 5 vai trò đã trích dẫn ở Chương 7 (`guides/authentication.mdx`) — không lặp lại toàn bộ, chỉ tham chiếu ngược và bổ sung phần Invite/quản lý.
- Không có thay đổi với bảng thuật ngữ tạm.
- Tiếp tục thực thi trực tiếp, không dùng fork lồng.
