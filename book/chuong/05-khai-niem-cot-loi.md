# 5. Các khái niệm cốt lõi (bản đồ thuật ngữ)

Áp dụng cho vai trò: Mọi vai trò — đây là chương nền tảng mà các chương sau liên tục tham chiếu ngược lại

## Tổng quan

Mô hình nội dung (content model) của một site EmDash là tập hợp các **Collection** và **Field** mà site đó lưu trữ. Bạn định nghĩa mô hình này trong admin panel hoặc bằng CLI, thay đổi bất cứ khi nào cần, và tuỳ chọn sinh TypeScript type từ đó. Chương này là "từ điển khái niệm" — nắm chắc chương này giúp các chương sau (đặc biệt Phần II, III) dễ hiểu hơn nhiều.

## Collection và Field

Một **Collection** là một loại nội dung (bài viết, sản phẩm, tác giả...). Mỗi Collection có các **Field** do bạn định nghĩa (tiêu đề, nội dung, giá...). Mỗi entry (mục nội dung) còn có thêm các field hệ thống (system field) mà EmDash tự quản lý.

Bạn tạo và sửa Collection, Field một cách trực quan trong admin panel dưới mục **Content Types**, hoặc bằng CLI. Thay đổi có hiệu lực ngay lập tức, và một người không biết code cũng làm được (xem [Chương 17 — Xây dựng Loại nội dung](./17-content-types-builder.md), để biết chi tiết thao tác trong admin).

### Thuộc tính của một Collection

| Thuộc tính | Mô tả |
| --- | --- |
| `slug` | Định danh an toàn cho URL (vd `posts`, `products`) |
| `label` | Tên hiển thị (vd "Blog Posts") |
| `labelSingular` | Dạng số ít (vd "Post") |
| `description` | Mô tả tuỳ chọn cho editor |
| `icon` | Tên icon Lucide dùng trong sidebar admin |
| `supports` | Các tính năng: drafts, revisions, preview, scheduling, search, seo |

> Một số slug Collection bị dành riêng, không được dùng: `content`, `media`, `users`, `revisions`, `taxonomies`, `options`, `audit_logs`.

### Tính năng của Collection (`supports`)

| Tính năng | Mô tả |
| --- | --- |
| `drafts` | Bật quy trình draft/published |
| `revisions` | Theo dõi lịch sử nội dung bằng snapshot phiên bản |
| `preview` | Sinh URL preview đã ký cho nội dung nháp |
| `scheduling` | Lên lịch xuất bản nội dung vào ngày trong tương lai |

Ví dụ một Collection bật đủ cả 4 tính năng:

```ts
{
  slug: "posts",
  label: "Blog Posts",
  labelSingular: "Post",
  supports: ["drafts", "revisions", "preview", "scheduling"]
}
```

## Field (trường) — 16 loại

EmDash hỗ trợ 16 loại Field, mỗi loại ánh xạ tới một kiểu cột SQLite:

| Loại | Cột SQLite | Mô tả |
| --- | --- | --- |
| `string` | TEXT | Văn bản ngắn một dòng |
| `text` | TEXT | Văn bản nhiều dòng (textarea) |
| `slug` | TEXT | Định danh an toàn cho URL |
| `url` | TEXT | Giá trị URL |
| `number` | REAL | Số thập phân |
| `integer` | INTEGER | Số nguyên |
| `boolean` | INTEGER (0/1) | Đúng/Sai |
| `datetime` | TEXT (ISO 8601) | Ngày giờ |
| `select` | TEXT | Chọn một trong danh sách |
| `multiSelect` | JSON | Chọn nhiều trong danh sách |
| `portableText` | JSON | Rich text (TipTap/ProseMirror), định dạng khối (block-based), không nhúng HTML |
| `json` | JSON | Dữ liệu JSON tuỳ ý |
| `image` | TEXT (media ID) | Chọn ảnh từ Media Library |
| `file` | TEXT (media ID) | Chọn tệp từ Media Library |
| `reference` | TEXT (entry ID) | Tham chiếu tới entry của Collection khác |
| `repeater` | JSON | Nhóm field lặp lại |

Ví dụ field tham chiếu tới nhiều sản phẩm khác:

```ts
{
  slug: "relatedProducts",
  type: "reference",
  label: "Related Products",
  options: {
    collection: "products",
    allowMultiple: true
  }
}
```

### Thuộc tính chung của mọi Field

| Thuộc tính | Kiểu | Mô tả |
| --- | --- | --- |
| `slug` | string | Tên cột trong database |
| `label` | string | Nhãn hiển thị trong admin UI |
| `type` | FieldType | Một trong 16 loại field |
| `required` | boolean | Field bắt buộc có giá trị hay không |
| `unique` | boolean | Giá trị phải duy nhất giữa các entry hay không |
| `indexed` | boolean | Cho phép sắp xếp/lọc hiệu quả theo field này |
| `defaultValue` | unknown | Giá trị mặc định cho entry mới |
| `validation` | object | Quy tắc validate theo từng loại field |
| `widget` | string | Định danh widget tuỳ chỉnh |
| `options` | object | Cấu hình riêng theo widget |
| `sortOrder` | number | Thứ tự hiển thị trong editor |

> Một số slug field bị dành riêng, không được dùng: `id`, `slug`, `status`, `author_id`, `primary_byline_id`, `created_at`, `updated_at`, `published_at`, `scheduled_at`, `deleted_at`, `version`, `live_revision_id`, `draft_revision_id`, `terms`, `bylines`, `byline`.

Đặt `indexed: true` khi cần dùng field trong `orderBy` hoặc bộ lọc truy vấn. Index chỉ hỗ trợ cho các loại `string`, `url`, `number`, `integer`, `boolean`, `datetime`, `select`, `reference`, `slug` — EmDash từ chối đánh index cho JSON, rich content và các kiểu phi vô hướng khác. Index giúp đọc có sắp xếp/lọc nhanh hơn nhưng tốn thêm dung lượng lưu trữ và làm chậm thao tác ghi — chỉ nên đánh index cho field thực sự dùng để sắp xếp/lọc.

## System field — luôn có trên mọi entry

Ngoài các field bạn tự định nghĩa, mọi entry luôn có sẵn các field hệ thống sau, do EmDash tự quản lý:

| Field | Mục đích |
| --- | --- |
| `id` | Định danh duy nhất, ổn định |
| `slug` | Định danh an toàn cho URL, duy nhất theo từng locale |
| `status` | `draft`, `published`, hoặc `scheduled` |
| `author_id` | Người dùng đã tạo entry |
| `created_at` / `updated_at` / `published_at` | Dấu thời gian |
| `deleted_at` | Đặt khi soft delete; dòng dữ liệu vẫn được giữ lại |
| `version` | Tăng mỗi lần lưu |

Xoá một entry là **soft delete** — dữ liệu vẫn được giữ và có thể khôi phục lại.

## Thay đổi mô hình bất cứ lúc nào

Bạn có thể thêm, đổi tên, xoá, hoặc đổi kiểu một field trên Collection đang chạy (live) bất cứ lúc nào, qua admin panel hoặc CLI. Nội dung hiện có được giữ nguyên.

> Thêm field luôn an toàn. Xoá field sẽ mất dữ liệu của field đó. Nên **đổi tên** thay vì xoá-rồi-tạo-lại khi muốn giữ giá trị hiện có.

## TypeScript types

Sinh type là tuỳ chọn nhưng được khuyến khích. Sinh type từ mô hình hiện tại:

```bash
npx emdash types
```

Lệnh này ghi ra `.emdash/types.ts` với một interface cho mỗi Collection và các overload truy vấn có kiểu, để `getEmDashCollection("posts")` trả về entry có kiểu dữ liệu đầy đủ:

```ts title=".emdash/types.ts (generated)"
export interface Post {
	title: string;
	content: PortableTextBlock[];
	excerpt?: string;
}

declare module "emdash" {
	export function getEmDashCollection(
		type: "posts",
	): Promise<{ entries: ContentEntry<Post>[]; error?: Error }>;
}
```

Chạy lại lệnh này sau khi thay đổi mô hình để giữ type luôn đồng bộ.

## Hai quy trình thay đổi mô hình

Cả hai quy trình dưới đây đều thay đổi cùng một mô hình:

**Người không biết code** dùng admin panel:
1. Mở **Content Types** trong admin panel.
2. Nhấn **Add Collection**.
3. Định nghĩa field bằng trình tạo trực quan (visual builder).
4. Bắt đầu tạo nội dung.

**Lập trình viên** có thể dùng CLI để sinh type và di chuyển mô hình giữa các môi trường:

```bash
npx emdash types                     # sinh TypeScript types
npx emdash export-seed > seed.json   # xuất mô hình thành seed file
```

## Seed file

**Seed file** là một mô tả JSON của Collection, Taxonomy và Menu. Các template đi kèm sẵn một seed file, và bạn có thể xuất seed file của riêng mình để quản lý phiên bản (version control) hoặc thiết lập môi trường khác.

```json title=".emdash/seed.json"
{
	"version": "1",
	"collections": [
		{
			"slug": "posts",
			"label": "Blog Posts",
			"labelSingular": "Post",
			"supports": ["drafts", "revisions", "preview"],
			"fields": [
				{ "slug": "title", "type": "string", "required": true },
				{ "slug": "content", "type": "portableText" }
			]
		}
	],
	"taxonomies": [{ "name": "category", "label": "Categories", "hierarchical": true }],
	"menus": [{ "name": "primary", "label": "Primary Navigation" }]
}
```

Áp dụng (apply) một seed là idempotent — nghĩa là chạy lại nhiều lần vẫn an toàn:

```ts
import { applySeed, validateSeed } from "emdash/seed";
import seedData from "./.emdash/seed.json";

const { valid, errors } = validateSeed(seedData);
await applySeed(db, seedData, { includeContent: true, onConflict: "skip" });
```

Schema đầy đủ của seed file nằm ở [Chương 48 — Seed Files](./48-seed-files.md).

## Truy vấn Collection (tóm tắt nhanh)

```ts
import { getEmDashCollection, getEmDashEntry } from "emdash";

// Lấy tất cả entry — trả về { entries, error }
const { entries: posts } = await getEmDashCollection("posts");

// Lọc theo status
const { entries: drafts } = await getEmDashCollection("posts", { status: "draft" });

// Giới hạn số kết quả
const { entries: recent } = await getEmDashCollection("posts", { limit: 5 });

// Lọc theo taxonomy
const { entries: newsPosts } = await getEmDashCollection("posts", { where: { category: "news" } });

// Lấy một entry theo slug — trả về { entry, error, isPreview }
const { entry: post } = await getEmDashEntry("posts", "my-post-slug");
```

Chi tiết đầy đủ về truy vấn nằm ở [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md).

## Lưu ý

- Chương này chỉ trình bày *khái niệm* và *hình dạng dữ liệu* (data shape) — thao tác cụ thể trên giao diện (bấm nút nào, ở đâu) được trình bày chi tiết ở Chương 6 (Admin Panel) và Chương 17 (Content Types Builder).
- Ghi nhớ bảng "system field" — nhiều chương sau (đặc biệt Chương 8, 17, 19) sẽ giả định bạn đã biết `status`, `author_id`, `version` nghĩa là gì.

## Xem thêm

- [Chương 1 — EmDash là gì và dành cho ai](./01-emdash-la-gi.md)
- [Chương 4 — So sánh với WordPress / Astro thuần](./04-so-sanh-wordpress-astro.md)
- [Chương 6 — Làm quen giao diện quản trị (Admin Panel)](./06-lam-quen-admin-panel.md)
- [Chương 17 — Xây dựng Loại nội dung (Content Types Builder)](./17-content-types-builder.md)
- [Chương 48 — Seed Files](./48-seed-files.md)
