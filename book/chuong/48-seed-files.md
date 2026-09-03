# 48. Seed Files — dữ liệu khởi tạo cho Theme

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

Seed file là tài liệu JSON khởi tạo (bootstrap) site EmDash — định nghĩa Collection, Field, Taxonomy, Menu, Redirect, Widget Area, site settings, và nội dung mẫu tuỳ chọn. Đây là đặc tả đầy đủ, tham chiếu ngược từ nhiều chương trước (5, 17, 18, 21, 23, 27, 47).

## Cấu trúc gốc

```json
{
	"$schema": "https://emdashcms.com/seed.schema.json",
	"version": "1",
	"meta": {},
	"settings": {},
	"collections": [],
	"taxonomies": [],
	"bylines": [],
	"menus": [],
	"redirects": [],
	"widgetAreas": [],
	"sections": [],
	"content": {}
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| `$schema` | `string` | Không | URL JSON schema để editor validate |
| `version` | `"1"` | Có | Phiên bản định dạng seed |
| `meta` | `object` | Không | Metadata mô tả seed |
| `settings` | `object` | Không | Site settings |
| `collections` | `array` | Không | Định nghĩa Collection |
| `taxonomies` | `array` | Không | Định nghĩa Taxonomy |
| `bylines` | `array` | Không | Định nghĩa profile byline |
| `menus` | `array` | Không | Menu điều hướng |
| `redirects` | `array` | Không | Quy tắc redirect |
| `widgetAreas` | `array` | Không | Định nghĩa Widget Area |
| `sections` | `array` | Không | Khối nội dung tái sử dụng |
| `content` | `object` | Không | Entry nội dung mẫu |

## `meta`

Metadata mô tả tuỳ chọn về seed: `name`, `description`, `author`.

## `settings`

Giá trị cấu hình toàn site (`title`, `tagline`, `postsPerPage`, `dateFormat`...). Áp dụng vào bảng `options` với tiền tố `site:`. Setup Wizard tự điền sẵn `title`/`tagline` từ seed (nếu có), user có thể ghi đè lúc setup ban đầu.

## `collections`

Mỗi định nghĩa Collection tạo một loại nội dung trong database:

```json
{
	"collections": [
		{
			"slug": "posts",
			"label": "Posts",
			"labelSingular": "Post",
			"description": "Blog posts",
			"icon": "file-text",
			"supports": ["drafts", "revisions"],
			"fields": [
				{ "slug": "title", "label": "Title", "type": "string", "required": true },
				{ "slug": "content", "label": "Content", "type": "portableText" },
				{ "slug": "featured_image", "label": "Featured Image", "type": "image" }
			]
		}
	]
}
```

**Thuộc tính Collection:** `slug`* (an toàn URL, chữ thường, gạch dưới), `label`* (tên số nhiều), `labelSingular`, `description`, `icon` (tên icon Lucide), `supports` (`"drafts"`, `"revisions"`), `hidden` (bỏ mục sidebar admin tự sinh — Collection vẫn hoạt động đầy đủ ở REST API/MCP/hook/editor tại `/_emdash/admin/content/<slug>`, dùng cho Collection do plugin sở hữu toàn trình), `sortOrder` (vị trí trong sidebar admin, tăng dần), `fields`* (mảng field). (`*` = bắt buộc)

> Collection liệt kê theo alphabet trong sidebar trừ khi có `sortOrder` — Collection có `sortOrder` xếp trước theo thứ tự tăng dần, còn lại giữ thứ tự alphabet theo sau. Editor cũng kéo-thả dòng trên màn hình Content Types, ghi cùng giá trị này.

**Thuộc tính Field:** `slug`* (tên cột), `label`*, `type`*, `required`, `unique`, `indexed`, `defaultValue`, `validation`, `widget`, `options`.

**Loại field** (mở rộng nhẹ so với danh sách 16 loại ở Chương 5 — seed file còn chấp nhận `date`, `email` như alias/kiểu bổ sung): `string`, `text`, `number`, `integer`, `boolean`, `date`, `datetime`, `email`, `url`, `slug`, `portableText`, `image`, `file`, `json`, `reference`.

## `taxonomies`

```json
{
	"taxonomies": [
		{
			"name": "category", "label": "Categories", "labelSingular": "Category",
			"hierarchical": true, "collections": ["posts"],
			"terms": [
				{ "slug": "news", "label": "News" },
				{ "slug": "tutorials", "label": "Tutorials" },
				{ "slug": "advanced", "label": "Advanced Tutorials", "parent": "tutorials" }
			]
		},
		{ "name": "tag", "label": "Tags", "labelSingular": "Tag", "hierarchical": false, "collections": ["posts"] }
	]
}
```

**Thuộc tính Taxonomy:** `name`*, `label`*, `labelSingular`, `hierarchical`* (cho phép term lồng nhau hay phẳng), `collections`* (Collection áp dụng), `terms` (term định nghĩa sẵn). **Thuộc tính Term:** `slug`*, `label`*, `description`, `parent` (slug term cha, chỉ với taxonomy phân cấp).

## `menus`

```json
{
	"menus": [
		{
			"name": "primary", "label": "Primary Navigation",
			"items": [
				{ "type": "custom", "label": "Home", "url": "/" },
				{ "type": "page", "ref": "about" },
				{ "type": "custom", "label": "Blog", "url": "/posts" },
				{ "type": "custom", "label": "External", "url": "https://example.com", "target": "_blank" }
			]
		}
	]
}
```

**Loại menu item:** `custom` (cần `url`), `page`/`post` (cần `ref`), `taxonomy` (cần `ref` + `collection`), `collection` (cần `collection`). **Thuộc tính item:** `type`, `label` (tự sinh với ref page/post), `url`, `ref` (ID nội dung trong seed), `collection`, `target`, `titleAttr`, `cssClasses`, `children` (item lồng nhau).

## `bylines`

Profile byline tách biệt với quyền sở hữu (`author_id`) — định nghĩa danh tính byline tái sử dụng một lần, rồi tham chiếu từ entry nội dung:

```json
{
	"bylines": [
		{ "id": "editorial", "slug": "emdash-editorial", "displayName": "EmDash Editorial" },
		{ "id": "guest", "slug": "guest-contributor", "displayName": "Guest Contributor", "isGuest": true }
	]
}
```

Thuộc tính: `id`* (ID cục bộ trong seed, dùng bởi `content[].bylines`), `slug`*, `displayName`*, `bio`, `websiteUrl`, `isGuest`.

## `redirects`

```json
{
	"redirects": [
		{ "source": "/old-about", "destination": "/about" },
		{ "source": "/legacy-feed", "destination": "/rss.xml", "type": 308 },
		{ "source": "/category/news", "destination": "/categories/news", "groupName": "migration" }
	]
}
```

Thuộc tính: `source`* (phải bắt đầu `/`), `destination`* (phải bắt đầu `/`), `type` (mã HTTP `301`/`302`/`307`/`308`), `enabled` (mặc định `true`), `groupName` (nhãn nhóm tuỳ chọn để lọc/tìm trong admin).

> `source` và `destination` phải là đường dẫn cục bộ — URL ngoài, đường dẫn tương đối giao thức (`//...`), path traversal (`..`), và ký tự xuống dòng đều bị validation của seed từ chối.

## `widgetAreas`

```json
{
	"widgetAreas": [
		{
			"name": "sidebar", "label": "Main Sidebar", "description": "Appears on blog posts and pages",
			"widgets": [
				{ "type": "component", "title": "Recent Posts", "componentId": "core:recent-posts", "props": { "count": 5 } },
				{ "type": "menu", "title": "Quick Links", "menuName": "footer" },
				{ "type": "content", "title": "About", "content": [{ "_type": "block", "style": "normal", "children": [{ "_type": "span", "text": "Welcome to our site!" }] }] }
			]
		}
	]
}
```

**Loại widget:** `content` (cần `content` dạng Portable Text), `menu` (cần `menuName`), `component` (cần `componentId`). **Component có sẵn:** `core:recent-posts`, `core:categories`, `core:tags`, `core:search`, `core:archives`.

## `sections`

Khối nội dung tái sử dụng, editor chèn vào field Portable Text qua slash command `/section`:

```json
{
	"sections": [
		{
			"slug": "hero-centered", "title": "Centered Hero",
			"description": "Full-width hero with centered heading and CTA button",
			"keywords": ["hero", "banner", "header", "landing"],
			"content": [
				{ "_type": "block", "style": "h1", "children": [{ "_type": "span", "text": "Welcome to Our Site" }] },
				{ "_type": "block", "children": [{ "_type": "span", "text": "Your compelling tagline goes here." }] }
			]
		}
	]
}
```

Thuộc tính: `slug`*, `title`*, `description`, `keywords`, `content`* (khối Portable Text), `source` (`"theme"` mặc định cho seed, hoặc `"import"`). Section từ seed file đánh dấu `source: "theme"`, **không thể xoá** từ admin UI (xem lại [Chương 18](./18-bo-cuc-trang-section.md) và [Chương 47](./47-xay-dung-theme.md)).

## `content`

Entry nội dung mẫu, tổ chức theo Collection:

```json
{
	"content": {
		"posts": [
			{
				"id": "hello-world",
				"slug": "hello-world",
				"status": "published",
				"bylines": [{ "byline": "editorial" }, { "byline": "guest", "roleLabel": "Guest essay" }],
				"data": {
					"title": "Hello World",
					"content": [{ "_type": "block", "style": "normal", "children": [{ "_type": "span", "text": "Welcome!" }] }],
					"excerpt": "Your first post."
				},
				"taxonomies": { "category": ["news"], "tag": ["welcome", "first-post"] }
			}
		],
		"pages": [
			{ "id": "about", "slug": "about", "status": "published", "data": { "title": "About Us", "content": [{ "_type": "block", "style": "normal", "children": [{ "_type": "span", "text": "About page content." }] }] } }
		]
	}
}
```

**Thuộc tính entry:** `id`* (ID cục bộ trong seed, dùng để tham chiếu), `slug`*, `status` (`"published"`/`"draft"`, mặc định published), `data`* (giá trị field), `bylines` (credit theo thứ tự: `byline`, `roleLabel` tuỳ chọn), `taxonomies` (gán term theo tên taxonomy).

## Tham chiếu nội dung (`$ref:`)

Tham chiếu entry khác bằng tiền tố `$ref:`:

```json
{ "data": { "related_posts": ["$ref:another-post", "$ref:third-post"] } }
```

Tiền tố `$ref:` được resolve thành ID database thật lúc seeding.

## Tham chiếu Media (`$media`)

**Từ URL:**

```json
{ "data": { "featured_image": { "$media": { "url": "https://images.unsplash.com/photo-xxx", "alt": "Description of the image", "filename": "hero.jpg", "caption": "Photo by Someone" } } } }
```

**Từ tệp cục bộ** (trong `.emdash/media/`):

```json
{ "data": { "featured_image": { "$media": { "file": "hero.jpg", "alt": "Description of the image" } } } }
```

Thuộc tính: `url` hoặc `file` (bắt buộc đúng một trong hai), `alt`, `filename` (ghi đè tên tệp), `caption`.

> Media được tải xuống lúc seeding — ảnh lớn có thể làm chậm Setup Wizard. Cân nhắc dùng ảnh nén hoặc bản thumbnail cho nội dung mẫu.

## Áp dụng Seed bằng chương trình

```typescript
import { applySeed, validateSeed } from "emdash/seed";
import seedData from "./.emdash/seed.json";

const validation = validateSeed(seedData);
if (!validation.valid) {
	console.error(validation.errors);
	process.exit(1);
}

const result = await applySeed(db, seedData, {
	includeContent: true,
	onConflict: "skip",
	storage: myStorage,
	baseUrl: "http://localhost:4321",
});

console.log(result);
// {
//   collections: { created: 2, skipped: 0 },
//   fields: { created: 8, skipped: 0 },
//   taxonomies: { created: 2, terms: 5 },
//   bylines: { created: 2, skipped: 0 },
//   menus: { created: 1, items: 4 },
//   redirects: { created: 3, skipped: 0 },
//   widgetAreas: { created: 1, widgets: 3 },
//   settings: { applied: 3 },
//   content: { created: 3, skipped: 0 },
//   media: { created: 2, skipped: 0 }
// }
```

**Tuỳ chọn apply:** `includeContent` (mặc định `false`), `onConflict` (`"skip"`/`"update"`/`"error"`, mặc định `"skip"`), `mediaBasePath`, `storage` (adapter storage cho media upload), `baseUrl`.

## Tính Idempotent

Seeding an toàn khi chạy nhiều lần. Hành vi xung đột theo từng loại đối tượng:

| Đối tượng | Hành vi |
| --- | --- |
| Collection | Bỏ qua nếu slug đã tồn tại |
| Field | Bỏ qua nếu Collection + slug đã tồn tại |
| Định nghĩa Taxonomy | Bỏ qua nếu name đã tồn tại |
| Term Taxonomy | Bỏ qua nếu name + slug đã tồn tại |
| Profile Byline | Bỏ qua nếu slug đã tồn tại |
| Menu | Bỏ qua nếu name đã tồn tại |
| Item Menu | **Thay thế toàn bộ** (menu được tạo lại) |
| Redirect | Bỏ qua nếu source đã tồn tại |
| Widget Area | Bỏ qua nếu name đã tồn tại |
| Widget | **Thay thế toàn bộ** (area được tạo lại) |
| Section | Bỏ qua nếu slug đã tồn tại |
| Settings | **Cập nhật** (settings vốn để thay đổi) |
| Content | Bỏ qua nếu slug đã tồn tại trong Collection |

> Item menu và widget bị **thay thế**, không gộp — seed file là nguồn sự thật cho cấu trúc menu và widget area.

## Validation

```typescript
import { validateSeed } from "emdash/seed";

const { valid, errors, warnings } = validateSeed(seedData);
if (!valid) errors.forEach((e) => console.error(e));
warnings.forEach((w) => console.warn(w));
```

Validation kiểm tra: field bắt buộc có mặt; slug hợp lệ theo đúng loại (slug Collection/Field chỉ cho chữ thường/số/gạch dưới, slug khác còn cho phép gạch nối); loại field hợp lệ; tham chiếu trỏ tới nội dung có tồn tại; term cha phân cấp tồn tại; đường dẫn redirect là URL cục bộ an toàn; source redirect duy nhất; không trùng slug trong cùng Collection.

## Lệnh CLI

Seed file tại `.emdash/seed.json`, `package.json#emdash.seed`, hoặc `seed/seed.json` được inline vào build và áp dụng ở request đầu tiên khi database rỗng. Xuất schema (và tuỳ chọn nội dung) của một site có sẵn thành seed file:

```bash
mkdir -p .emdash
npx emdash export-seed > .emdash/seed.json
npx emdash export-seed --with-content > .emdash/seed.json
```

## Xem thêm

- [Chương 5 — Các khái niệm cốt lõi (bản đồ thuật ngữ)](./05-khai-niem-cot-loi.md)
- [Chương 17 — Xây dựng Loại nội dung (Content Types Builder)](./17-content-types-builder.md)
- [Chương 18 — Bố cục trang & Section](./18-bo-cuc-trang-section.md)
- [Chương 21 — Chủ đề (Themes) — cài đặt và tuỳ biến cơ bản](./21-theme-tong-quan.md)
- [Chương 27 — Cơ sở dữ liệu (SQLite/PostgreSQL/D1)](./27-co-so-du-lieu.md)
- [Chương 33 — Tổng quan công cụ cho dev: CLI, API, MCP](./33-tong-quan-cong-cu-dev.md)
- [Chương 47 — Xây dựng Theme từ đầu](./47-xay-dung-theme.md)
