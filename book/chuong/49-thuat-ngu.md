# 49. Bảng thuật ngữ đối chiếu Anh–Việt

Áp dụng cho vai trò: Mọi vai trò

## Tổng quan

Đây là bảng thuật ngữ chính thức của sổ tay — chốt lại và mở rộng từ "Bảng thuật ngữ tạm" đã dùng xuyên suốt 48 chương trước (xem `book/01-DE-CUONG.md`). Mọi thuật ngữ dưới đây đã được áp dụng nhất quán qua toàn bộ 12 giai đoạn triển khai; dùng chương này làm tài liệu tra cứu ngược khi cần xác nhận cách viết đúng.

**Nguyên tắc chung:** thuật ngữ đặc thù của EmDash, tên tính năng, tên trường hệ thống, đường dẫn admin, và tên lệnh/API giữ nguyên tiếng Anh — vì đây chính là những gì người đọc nhìn thấy trên giao diện thật hoặc gõ trên dòng lệnh thật. Chỉ phần diễn giải, hướng dẫn, và mô tả hành động là tiếng Việt.

## Khái niệm nội dung cốt lõi

| Thuật ngữ | Cách dùng trong sổ tay | Chương giới thiệu |
| --- | --- | --- |
| Collection | Giữ nguyên tiếng Anh — "loại nội dung" (posts, pages, products...) | [Chương 5](./05-khai-niem-cot-loi.md) |
| Field | Giữ nguyên tiếng Anh — "trường" của một Collection | [Chương 5](./05-khai-niem-cot-loi.md) |
| System field | Giữ nguyên tiếng Anh — trường hệ thống EmDash tự quản lý (`id`, `slug`, `status`...) | [Chương 5](./05-khai-niem-cot-loi.md) |
| Live Collections | Giữ nguyên tiếng Anh, không dịch — cơ chế phục vụ nội dung tại runtime của Astro 6 | [Chương 1](./01-emdash-la-gi.md) |
| Entry | Giữ nguyên tiếng Anh — một mục nội dung cụ thể trong Collection | [Chương 5](./05-khai-niem-cot-loi.md) |
| Portable Text | Giữ nguyên tiếng Anh — định dạng rich text JSON có cấu trúc theo khối | [Chương 5](./05-khai-niem-cot-loi.md) |
| Taxonomy / Taxonomies | Giữ nguyên tiếng Anh — dịch mô tả là "phân loại nội dung" | [Chương 12](./12-phan-loai-taxonomies.md) |
| Term | Giữ nguyên tiếng Anh — một giá trị cụ thể trong Taxonomy | [Chương 12](./12-phan-loai-taxonomies.md) |
| Section | Giữ nguyên tiếng Anh — khối nội dung tái sử dụng chèn qua `/section` | [Chương 18](./18-bo-cuc-trang-section.md) |
| Widget / Widget Area | Giữ nguyên tiếng Anh | [Chương 11](./11-widget-va-vung-widget.md) |
| Byline | Giữ nguyên tiếng Anh — "bút danh", tách biệt với quyền sở hữu (`author_id`) | [Chương 48](./48-seed-files.md) |
| Seed file | Giữ nguyên tiếng Anh — "tệp seed" | [Chương 5](./05-khai-niem-cot-loi.md) |
| Soft delete | Giữ nguyên tiếng Anh — "xoá mềm", đặt `deleted_at`, dữ liệu vẫn giữ lại | [Chương 5](./05-khai-niem-cot-loi.md) |

## Trạng thái nội dung (Status)

| Thuật ngữ | Cách dùng |
| --- | --- |
| `draft` | Giữ nguyên tiếng Anh, chú thích "nháp" khi cần |
| `published` | Giữ nguyên tiếng Anh, chú thích "đã xuất bản" khi cần |
| `scheduled` | Giữ nguyên tiếng Anh, chú thích "đã lên lịch" khi cần |
| `archived` | Giữ nguyên tiếng Anh, chú thích "đã lưu trữ" khi cần |

> Xem ghi chú đối chiếu nguồn ở [Chương 8](./08-soan-thao-noi-dung.md): tài liệu khái niệm gốc liệt kê 3 giá trị `draft`/`published`/`scheduled` cho field hệ thống `status`, trong khi tài liệu thao tác admin liệt kê `Draft`/`Published`/`Archived` — sổ tay giữ nguyên cả hai cách dùng như tài liệu gốc, không tự ý thống nhất.

## Vai trò người dùng (Roles)

Giữ nguyên tiếng Anh xuyên suốt sổ tay, không dịch — vì đây là tên hiển thị thật trên giao diện EmDash (xem [Chương 19](./19-nguoi-dung-vai-tro.md)):

| Vai trò | Cấp độ |
| --- | --- |
| Subscriber | 10 |
| Contributor | 20 |
| Author | 30 |
| Editor | 40 |
| Admin | 50 |

## Xác thực & bảo mật

| Thuật ngữ | Cách dùng | Chương |
| --- | --- | --- |
| Passkey | Giữ nguyên tiếng Anh — xác thực WebAuthn không mật khẩu | [Chương 7](./07-dang-nhap-passkey.md) |
| Magic link | Giữ nguyên tiếng Anh — liên kết đăng nhập qua email | [Chương 7](./07-dang-nhap-passkey.md) |
| Setup Wizard | Giữ nguyên tiếng Anh — "Trình cài đặt" | [Chương 2](./02-cai-dat-lan-dau.md) |
| Session | Giữ nguyên tiếng Anh — "phiên đăng nhập" | [Chương 7](./07-dang-nhap-passkey.md) |
| Capability | Giữ nguyên tiếng Anh — quyền plugin khai báo (vd `content:read`) | [Chương 40](./40-api-routes-capabilities.md) |
| Scope | Giữ nguyên tiếng Anh — phạm vi quyền của token/OAuth | [Chương 33](./33-tong-quan-cong-cu-dev.md), [Chương 38](./38-mcp-server.md) |

## Admin Panel — đường dẫn và màn hình

Trích dẫn chính xác, không đổi khác giữa các chương (xem [Chương 6](./06-lam-quen-admin-panel.md)):

| Đường dẫn | Màn hình |
| --- | --- |
| `/_emdash/admin` | Gốc admin panel |
| `/content/:collection` | Danh sách nội dung |
| `/content/:collection/:id` | Trình soạn thảo nội dung |
| `/content/:collection/new` | Tạo entry mới |
| `/content-types` | Content Types Builder |
| `/media` | Thư viện Media |
| `/menus` | Menu điều hướng |
| `/widgets` | Widget Area |
| `/taxonomies` | Category và Tag |
| `/settings` | Site Settings |
| `/plugins/:pluginId/*` | Trang Plugin |

## Plugin

| Thuật ngữ | Cách dùng | Chương |
| --- | --- | --- |
| Plugin sandboxed | Giữ nguyên tiếng Anh — chạy trong runtime cách ly | [Chương 39](./39-viet-plugin-dau-tien.md) |
| Plugin native | Giữ nguyên tiếng Anh — chạy cùng tiến trình host | [Chương 44](./44-plugin-native.md) |
| Hook | Giữ nguyên tiếng Anh — điểm móc nối sự kiện | [Chương 37](./37-hooks-vong-doi.md) |
| Manifest | Giữ nguyên tiếng Anh — file `emdash-plugin.jsonc` | [Chương 39](./39-viet-plugin-dau-tien.md) |
| Block Kit | Giữ nguyên tiếng Anh — hệ UI khai báo dạng JSON | [Chương 41](./41-block-kit-field-kit.md) |
| Field Kit | Giữ nguyên tiếng Anh — plugin widget field JSON dựng sẵn | [Chương 41](./41-block-kit-field-kit.md) |
| Marketplace | Giữ nguyên tiếng Anh — kho plugin trung tâm | [Chương 20](./20-cai-dat-plugin.md) |
| Registry | Giữ nguyên tiếng Anh — kho plugin phi tập trung (thử nghiệm) | [Chương 20](./20-cai-dat-plugin.md), [Chương 43](./43-phat-hanh-plugin.md) |
| Publisher pinning | Giữ nguyên tiếng Anh — cơ chế ghim danh tính publish | [Chương 39](./39-viet-plugin-dau-tien.md) |

## Triển khai & Vận hành

| Thuật ngữ | Cách dùng | Chương |
| --- | --- | --- |
| Object Cache | Giữ nguyên tiếng Anh — "bộ nhớ đệm đối tượng" | [Chương 29](./29-object-cache.md) |
| Read replica | Giữ nguyên tiếng Anh — bản sao đọc D1 | [Chương 25](./25-trien-khai-cloudflare.md), [Chương 27](./27-co-so-du-lieu.md) |
| Migration | Giữ nguyên tiếng Anh — thay đổi schema database | [Chương 27](./27-co-so-du-lieu.md) |
| Rolling deploy | Giữ nguyên tiếng Anh — triển khai cuốn chiếu | [Chương 27](./27-co-so-du-lieu.md) |

## Xem thêm

- [Chương 01-DE-CUONG.md — Đề cương toàn sách](../01-DE-CUONG.md)
- [Chương 5 — Các khái niệm cốt lõi (bản đồ thuật ngữ)](./05-khai-niem-cot-loi.md)
- [Chương 50 — Lịch sử tính năng theo phiên bản](./50-lich-su-tinh-nang.md)
- [Chương 51 — Câu hỏi thường gặp & khắc phục sự cố](./51-cau-hoi-thuong-gap.md)
