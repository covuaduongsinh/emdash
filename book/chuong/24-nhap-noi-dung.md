# 24. Nhập nội dung từ nguồn khác

Áp dụng cho vai trò: Quản trị viên/Vận hành, Lập trình viên (viết nguồn nhập tuỳ chỉnh)

## Tổng quan

EmDash nhập nội dung từ WordPress và các nền tảng khác. Mỗi nguồn nhập (import source) phát hiện nền tảng, phân tích nội dung, rồi lấy về site của bạn. Chương 23 đã trình bày chi tiết luồng nhập bằng file WXR (phương pháp đầy đủ nhất) — chương này bổ sung 2 phương pháp còn lại và kiến trúc nhập tổng quát đứng sau cả 3.

## 3 nguồn nhập có sẵn

| ID nguồn | Nền tảng | Có Probe | OAuth | Nhập đầy đủ |
| --- | --- | --- | --- | --- |
| `wxr` | File export WordPress | Không | Không | Có |
| `wordpress-com` | WordPress.com | Có | Có | Có |
| `wordpress-rest` | WordPress tự host | Có | Không | Chỉ probe |

### Tải lên file WXR (đã trình bày chi tiết ở Chương 23)

Phương pháp đầy đủ nhất. Tải file export WordPress eXtended RSS (WXR) trực tiếp lên admin dashboard. Bắt được: mọi post type (kể cả tuỳ chỉnh), mọi meta field, draft và bài riêng tư, đầy đủ cấu trúc phân cấp taxonomy, metadata media đính kèm.

### WordPress.com OAuth

Với site host trên WordPress.com, kết nối qua OAuth để nhập mà không cần tự export file thủ công.

1. Nhập URL site WordPress.com.
2. Nhấn **Connect with WordPress.com**.
3. Cấp quyền cho EmDash trong popup của WordPress.com.
4. Chọn nội dung cần nhập.

> WordPress.com OAuth cần biến môi trường `WPCOM_CLIENT_ID` và `WPCOM_CLIENT_SECRET` — đăng ký app tại [developer.wordpress.com](https://developer.wordpress.com/apps/).

Bao gồm: nội dung published và draft, bài riêng tư (khi được cấp quyền), tệp media qua API, custom field đã expose ra REST API.

### WordPress REST API Probe

Khi bạn nhập một URL, EmDash "probe" (dò) site để phát hiện WordPress và hiển thị nội dung khả dụng:

```
Detected: WordPress 6.4
├── Posts: 127 (published)
├── Pages: 12 (published)
└── Media: 89 files

Note: Drafts and private content require authentication
or a full WXR export.
```

Probe REST chỉ mang tính thông tin. Để nhập đầy đủ, hệ thống sẽ gợi ý tải lên file WXR hoặc kết nối qua OAuth (với WordPress.com).

## Luồng nhập tổng quát

Mọi nguồn đều theo cùng một luồng:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Connect   │────▶│   Analyze   │────▶│   Prepare   │────▶│   Execute   │
│  (probe/    │     │  (schema    │     │  (create    │     │  (import    │
│   upload)   │     │   check)    │     │   schema)   │     │   content)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Bước 1 — Connect

Nhập một URL để probe hoặc tải file lên trực tiếp. Probe theo URL chạy song song mọi nguồn đã đăng ký; kết quả khớp với độ tin cậy cao nhất quyết định gợi ý tiếp theo: site WordPress.com → đề nghị kết nối OAuth; WordPress tự host → hiện hướng dẫn export; không xác định → gợi ý tải file lên.

### Bước 2 — Analyze

Nguồn phân tích nội dung và kiểm tra tính tương thích schema:

```
Post Types:
├── post (127) → posts [New collection]
├── page (12)  → pages [Existing, compatible]
├── product (45) → products [Add 3 fields]
└── revision (234) → [Skip - internal type]

Required Schema Changes:
├── Create collection: posts
├── Add fields to pages: featured_image
└── Create collection: products
```

Mỗi post type hiển thị trạng thái:

| Trạng thái | Ý nghĩa |
| --- | --- |
| Ready | Collection đã tồn tại với field tương thích |
| New collection | Sẽ được tạo tự động |
| Add fields | Collection đã tồn tại, thiếu field sẽ được thêm |
| Incompatible | Xung đột kiểu field (cần sửa thủ công) |

### Bước 3 — Prepare Schema

Nhấn **Create Schema & Import** để: tạo Collection mới, thêm field còn thiếu với đúng kiểu cột, thiết lập bảng nội dung kèm index.

### Bước 4 — Execute Import

Nội dung được nhập tuần tự:

- Gutenberg/HTML chuyển thành Portable Text.
- Status WordPress ánh xạ sang status EmDash.
- Tác giả WordPress ánh xạ sang quyền sở hữu (`authorId`) và bút danh hiển thị (byline).
- Taxonomy được tạo và liên kết.
- Reusable block (`wp_block`) được nhập thành [Section](./18-bo-cuc-trang-section.md).
- Tiến độ hiển thị theo thời gian thực.

**Hành vi nhập tác giả:**
- Nếu ánh xạ tác giả trỏ tới một user EmDash, quyền sở hữu được đặt cho user đó và một byline liên kết được tạo/tái sử dụng cho cùng user.
- Nếu không có ánh xạ user, một byline "khách" (guest byline) được tạo/tái sử dụng từ danh tính tác giả WordPress.
- Entry đã nhập nhận credit byline có thứ tự, credit đầu tiên được đặt làm `primaryBylineId`.

### Bước 5 — Nhập Media (tuỳ chọn)

Sau khi nhập nội dung, tuỳ chọn nhập media:

1. **Phân tích** — hiển thị số lượng tệp đính kèm theo loại.
2. **Tải xuống** — stream từ URL WordPress kèm tiến độ.
3. **Viết lại URL** — nội dung tự động cập nhật với URL mới.

Việc nhập media dùng băm nội dung (xxHash64, content hashing) để loại trùng — cùng một ảnh dùng ở nhiều bài viết chỉ được lưu một lần.

## API Endpoint (dành cho lập trình viên)

| Endpoint | Method | Mô tả |
| --- | --- | --- |
| `/_emdash/api/import/probe` | POST | Phát hiện nền tảng đứng sau một URL |
| `/_emdash/api/import/wordpress/analyze` | POST (multipart) | Phân tích post type và tính tương thích schema của file WXR |
| `/_emdash/api/import/wordpress/prepare` | POST | Tạo Collection/Field cho post type đã chọn |
| `/_emdash/api/import/wordpress/execute` | POST (multipart) | Nhập nội dung vào Collection đã ánh xạ |
| `/_emdash/api/import/wordpress/media` | POST | Tải và lưu media đính kèm (phản hồi dạng NDJSON streaming tiến độ) |
| `/_emdash/api/import/wordpress/rewrite-urls` | POST | Thay URL media cũ trong nội dung đã nhập bằng URL mới đã lưu |

Ví dụ probe URL:

```http
POST /_emdash/api/import/probe
Content-Type: application/json

{ "url": "https://example.com" }
```

## Xử lý lỗi

**Lỗi có thể phục hồi:** network timeout (thử lại có backoff), lỗi phân tích một mục đơn lẻ (ghi log, bỏ qua, tiếp tục nhập), tải media thất bại (đánh dấu để xử lý thủ công).

**Lỗi nghiêm trọng (fatal):** định dạng file không hợp lệ (dừng nhập kèm thông báo lỗi), mất kết nối database (tạm dừng, cho phép resume), vượt hạn mức lưu trữ (dừng nhập, hiển thị mức dùng).

**Báo cáo lỗi:** sau khi nhập xong, EmDash hiển thị tóm tắt những gì thành công, những gì đã điều chỉnh, và những gì thất bại:

```
Import Complete

✓ 125 posts imported
✓ 12 pages imported
✓ 85 media references recorded

⚠ 2 items had warnings:
  - Post "Special Characters ñ" - title encoding fixed
  - Page "About" - duplicate slug renamed to "about-1"

✗ 1 item failed:
  - Post ID 456 - content parsing error (saved as draft)
```

Mục nhập thất bại được lưu dạng draft, kèm nội dung gốc trong field `_importError` để xem lại.

## Nguồn nhập tuỳ chỉnh (dành cho lập trình viên)

Để nhập từ một nền tảng chưa có nguồn dựng sẵn hỗ trợ, cài đặt interface `ImportSource` và đăng ký nó vào integration:

```typescript title="astro.config.mjs"
import { mySource } from "./src/import/custom-source";

export default defineConfig({
	integrations: [
		emdash({
			import: { sources: [mySource] },
		}),
	],
});
```

Interface (`probe`, `analyze`, `fetchContent`) và hình dạng output đã chuẩn hoá được tài liệu hoá trong "Architecture (internals)" — tài liệu kiến trúc nội bộ dành cho người đóng góp vào chính EmDash, nằm ngoài phạm vi sổ tay hướng dẫn sử dụng này.

## Xem thêm

- [Chương 18 — Bố cục trang & Section](./18-bo-cuc-trang-section.md)
- [Chương 23 — Di chuyển từ WordPress](./23-di-chuyen-tu-wordpress.md)
- [Chương 46 — Chuyển đổi Plugin WordPress sang EmDash](./46-chuyen-doi-plugin-wp.md)
