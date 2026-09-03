# 17. Xây dựng Loại nội dung (Content Types Builder)

Áp dụng cho vai trò: Quản trị viên/Vận hành (chỉ Admin mới truy cập được `/content-types`)

## Tổng quan

Trình xây dựng Loại nội dung (Content Types Builder) là màn hình `/content-types` trong admin panel, nơi bạn tạo và sửa Collection cùng Field một cách trực quan. Thay đổi có hiệu lực ngay lập tức — không cần deploy lại (đã giới thiệu khái niệm ở [Chương 5](./05-khai-niem-cot-loi.md); chương này đi vào thao tác cụ thể trên giao diện admin và chi tiết validation từng loại field).

## Tạo Collection

Tạo Collection qua admin panel dưới mục **Content Types**. Mỗi Collection có các thuộc tính:

| Thuộc tính | Mô tả |
| --- | --- |
| `slug` | Định danh an toàn cho URL (vd `posts`, `products`) |
| `label` | Tên hiển thị (vd "Blog Posts") |
| `labelSingular` | Dạng số ít (vd "Post") |
| `description` | Mô tả tuỳ chọn cho editor |
| `icon` | Tên icon Lucide dùng trong sidebar admin |
| `supports` | Các tính năng: drafts, revisions, preview, scheduling, search, seo |

> Một số slug Collection bị dành riêng, không được dùng: `content`, `media`, `users`, `revisions`, `taxonomies`, `options`, `audit_logs`.

## Bật tính năng cho Collection (đã giới thiệu ở Chương 5)

Nhắc lại nhanh 4 tính năng có thể bật khi tạo Collection: `drafts` (quy trình nháp/xuất bản), `revisions` (lịch sử phiên bản), `preview` (URL preview đã ký), `scheduling` (lên lịch xuất bản). Chi tiết sử dụng từng tính năng nằm ở Chương 8 (soạn thảo/revision) và Chương 13 (preview).

## Chi tiết validation và định dạng lưu trữ theo từng loại Field

Chương 5 đã liệt kê tổng quan 16 loại field và cột SQLite tương ứng. Bảng dưới bổ sung **tuỳ chọn validation** và **định dạng lưu trữ thực tế** của từng loại — hữu ích khi bạn cấu hình field trong builder hoặc viết seed file.

| Loại field | Tuỳ chọn validation | Định dạng lưu trữ |
| --- | --- | --- |
| `string` | `minLength`, `maxLength`, `pattern` (regex) | Text thô |
| `text` | `minLength`, `maxLength`; widget option `rows` (mặc định 3) | Text thô |
| `slug` | — (tự động chuẩn hoá: viết thường, thay khoảng trắng bằng gạch nối, loại ký tự đặc biệt) | Text thô |
| `number` | `min`, `max` | SQLite `REAL` (64-bit) |
| `integer` | `min`, `max` | SQLite `INTEGER` |
| `boolean` | — | SQLite `INTEGER` (0/1) |
| `datetime` | `min`, `max` (chuỗi ISO) | ISO 8601, vd `2025-01-24T12:00:00.000Z` |
| `select` | `options` (mảng giá trị hợp lệ, bắt buộc) | Text chứa giá trị đã chọn |
| `multiSelect` | `options` (mảng giá trị hợp lệ, bắt buộc) | Mảng JSON, vd `["news", "tutorial"]` |
| `portableText` | — | Mảng JSON các khối Portable Text |
| `image` | widget option `showPreview` (mặc định true), `darkVariant` (mặc định false, xem [Chương 15](./15-che-do-toi.md)) | Object JSON `{ id, url, alt, width, height, darkVariant? }` |
| `file` | — | Object JSON `{ id, provider, filename, mimeType, meta }` |
| `reference` | widget option `collection` (bắt buộc), `allowMultiple` (mặc định false) | Một entry ID, hoặc mảng entry ID nếu `allowMultiple` |
| `json` | Không có validation — dùng hạn chế cho dữ liệu thực sự linh hoạt | Lưu nguyên dạng trong cột JSON |
| `repeater` | — | Mảng JSON các nhóm sub-field |

Với field `portableText`, Plugin có thể thêm loại khối tuỳ chỉnh (embed, widget...) — các khối này xuất hiện trong menu slash-command và tự động render trên site (xem [Chương 45 — Plugin Native: Page Fragments & Portable Text Components](./45-page-fragments-portable-text.md)).

Với field `file`, các field metadata cache như `url`, `size` là tuỳ chọn — truy vấn nội dung trả về nguyên giá trị đã lưu, không tự "hydrate" lại từ thư viện Media (xem lại phần "File Values" ở [Chương 9](./09-thu-vien-media.md)).

## Thuộc tính chung và slug dành riêng (đã có ở Chương 5)

Bảng thuộc tính chung của field (`slug`, `label`, `type`, `required`, `unique`, `indexed`, `defaultValue`, `validation`, `widget`, `options`, `sortOrder`) và danh sách slug field dành riêng (`id`, `slug`, `status`, `author_id`...) đã trình bày đầy đủ ở [Chương 5](./05-khai-niem-cot-loi.md) — không lặp lại ở đây.

## Lưu ý

- `indexed` chỉ khả dụng cho field vô hướng (`string`, `url`, `number`, `integer`, `boolean`, `datetime`, `select`, `reference`, `slug`). Field đã đánh index có thể dùng trong `orderBy` hoặc `fieldFilters` khi truy vấn danh sách — tránh đánh index cho field không dùng để sắp xếp/lọc vì mỗi index đều tốn thêm dung lượng và chi phí ghi.
- Với lập trình viên cần dùng định nghĩa kiểu field theo chương trình (TypeScript), import trực tiếp từ package `emdash` — xem tài liệu tham chiếu `reference/field-types.mdx` gốc.

## Xem thêm

- [Chương 5 — Các khái niệm cốt lõi (bản đồ thuật ngữ)](./05-khai-niem-cot-loi.md)
- [Chương 6 — Làm quen giao diện quản trị (Admin Panel)](./06-lam-quen-admin-panel.md)
- [Chương 9 — Thư viện Media](./09-thu-vien-media.md)
- [Chương 15 — Chế độ tối & tuỳ biến giao diện quản trị](./15-che-do-toi.md)
- [Chương 18 — Bố cục trang & Section](./18-bo-cuc-trang-section.md)
- [Chương 45 — Plugin Native: Page Fragments & Portable Text Components](./45-page-fragments-portable-text.md)
- [Chương 48 — Seed Files](./48-seed-files.md)
