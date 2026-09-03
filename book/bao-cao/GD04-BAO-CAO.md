# Báo cáo Giai đoạn 4 — Phần III.A: Content Types, Layout, Users/Roles, Plugin (end-user), Theme cơ bản

Trạng thái: **Hoàn thành** — 5/5 chương đã viết.

## File đã tạo

| File | Nguồn đã đối chiếu |
|---|---|
| `book/chuong/17-content-types-builder.md` | `concepts/collections.mdx` (builder), `reference/field-types.mdx` |
| `book/chuong/18-bo-cuc-trang-section.md` | `guides/page-layouts.mdx`, `guides/sections.mdx` |
| `book/chuong/19-nguoi-dung-vai-tro.md` | `guides/authentication.mdx` (phần Roles/Invites/Cloudflare Access role mapping) |
| `book/chuong/20-cai-dat-plugin.md` | `plugins/overview.mdx`, `installing.mdx`, `registry.mdx`, `registry-client.mdx`, `upgrading-sites.mdx` |
| `book/chuong/21-theme-tong-quan.md` | `themes/overview.mdx` |

Đã cập nhật `book/01-DE-CUONG.md`: 5 chương + GĐ4 đánh dấu "Đã xong".

## Tóm tắt từng chương

17. **Content Types Builder** — Thao tác tạo Collection trong admin, bảng validation/định dạng lưu trữ chi tiết theo từng loại field (bổ sung so với Chương 5).
18. **Bố cục trang & Section** — Page Layouts (field template + component map), Section (3 nguồn, dùng qua slash command, tạo/truy vấn/render).
19. **Người dùng, vai trò và quyền hạn** — Bảng 5 vai trò (dẫn từ Chương 7), mời user, allowlist nhóm, ánh xạ vai trò Cloudflare Access chi tiết.
20. **Cài đặt & Quản lý Plugin** — 2 định dạng plugin, cài từ Marketplace (điều kiện, capability consent, security audit, update/uninstall), cài native qua config, Registry (phi tập trung, AT Protocol), nâng cấp plugin khi update EmDash.
21. **Chủ đề (Themes)** — Theme cung cấp gì, cách bootstrap site, cài theme chính thức, 3 theme official + biến thể Cloudflare, tuỳ biến sau cài.

## Vấn đề phát sinh

- Không có vấn đề thiếu thông tin nguồn.
- Phát hiện một điểm cần làm rõ minh bạch (không phải mâu thuẫn, chỉ là hai kênh phân phối khác nhau): `themes/overview.mdx` mô tả theme chính thức phân phối qua `npm create astro --template @emdash-cms/template-*`, trong khi `TEMPLATES.md`/README (đã dùng ở Chương 2) mô tả template nằm sẵn trong thư mục `templates/` của chính repo EmDash, cài bằng `cp -r`. Đã ghi chú rõ trong Chương 21 rằng đây là hai kênh phân phối cùng một bộ theme khái niệm, không phải hai bộ theme khác nhau.
- Chương 20 khá dài (gộp 5 nguồn: overview, installing, registry, registry-client, upgrading-sites) nhưng hợp lý vì tất cả đều thuộc góc nhìn "người vận hành cài/quản lý plugin" — không tách thêm chương để tránh vụn.

## Lưu ý cho Giai đoạn 5 (Sao lưu, Di chuyển WP, Nhập nội dung)

- Không có thay đổi với bảng thuật ngữ tạm.
- Chương 23 (Di chuyển từ WordPress) nên tham chiếu ngược Chương 18 (Section — vì reusable block của WP nhập thành Section) và Chương 21 (theme porting).
- Tiếp tục thực thi trực tiếp, không dùng fork lồng.
