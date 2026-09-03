# 47. Xây dựng Theme từ đầu

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

Một theme EmDash là một site Astro hoàn chỉnh — trang, layout, component, style — kèm theo một seed file để khởi tạo mô hình nội dung (đã giới thiệu góc nhìn người dùng ở [Chương 21](./21-theme-tong-quan.md)). Chương này hướng dẫn tự xây dựng một theme từ đầu để chia sẻ thiết kế của bạn với người khác, hoặc chuẩn hoá việc tạo site cho agency.

## Khái niệm chính

- **Theme là một dự án Astro đang hoạt động.** Không có theme API hay tầng trừu tượng nào — theme là một site đóng gói làm template. Seed file cho EmDash biết cần tạo Collection, Field, Menu, redirect, taxonomy nào lần chạy đầu.
- **Seed file khai báo mô hình nội dung.** Liệt kê chính xác field mỗi Collection cần. Xây trên Collection chuẩn **posts** và **pages**, thêm field/taxonomy theo thiết kế yêu cầu, thay vì tự bịa loại nội dung hoàn toàn mới.
- **Trang nội dung theme phải server-render.** Trong theme, nội dung đổi lúc runtime qua admin UI, nên trang hiển thị nội dung EmDash **không được** prerender — không dùng `getStaticPaths()` trên route nội dung theme (site tĩnh dùng EmDash làm nguồn dữ liệu lúc build vẫn dùng `getStaticPaths` được, nhưng theme luôn là SSR).
- **Không hard-code nội dung.** Tên site, tagline, điều hướng, và nội dung động khác đến từ CMS qua gọi API — không từ chuỗi trong template.

## Cấu trúc dự án

```
my-emdash-theme/
├── package.json              # Metadata theme
├── astro.config.mjs          # Cấu hình Astro + EmDash
├── src/
│   ├── live.config.ts        # Thiết lập Live Collections
│   ├── pages/
│   │   ├── index.astro       # Trang chủ
│   │   ├── [...slug].astro   # Trang (catch-all)
│   │   ├── posts/
│   │   │   ├── index.astro   # Archive bài viết
│   │   │   └── [slug].astro  # Bài viết đơn
│   │   ├── categories/
│   │   │   └── [slug].astro  # Archive category
│   │   ├── tags/
│   │   │   └── [slug].astro  # Archive tag
│   │   ├── search.astro      # Trang tìm kiếm
│   │   └── 404.astro         # Không tìm thấy
│   ├── layouts/
│   │   └── Base.astro        # Layout gốc
│   └── components/           # Component của bạn
├── .emdash/
│   ├── seed.json             # Schema và nội dung mẫu
│   └── uploads/              # Tệp media cục bộ tuỳ chọn
└── public/                   # Asset tĩnh
```

Trang nằm ở gốc như route catch-all (`[...slug].astro`), nên trang có slug `about` render tại `/about`. Post, category, tag có thư mục riêng. Thư mục `.emdash/` chứa seed file và tệp media cục bộ dùng trong nội dung mẫu.

## Cấu hình `package.json`

Thêm field `emdash`:

```json title="package.json"
{
	"name": "@your-org/emdash-theme-blog",
	"version": "1.0.0",
	"description": "A minimal blog theme for EmDash",
	"keywords": ["astro-template", "emdash", "blog"],
	"emdash": {
		"label": "Minimal Blog",
		"description": "A clean, minimal blog with posts, pages, and categories",
		"seed": ".emdash/seed.json",
		"preview": "https://your-theme-demo.pages.dev"
	}
}
```

| Field | Mô tả |
| --- | --- |
| `emdash.label` | Tên hiển thị trong bộ chọn theme |
| `emdash.description` | Mô tả ngắn về theme |
| `emdash.seed` | Đường dẫn seed file |
| `emdash.preview` | URL demo trực tiếp (tuỳ chọn) |

## Mô hình nội dung mặc định

Hầu hết theme cần hai loại Collection: **posts** và **pages**. Post là entry có dấu thời gian, kèm excerpt và featured image, xuất hiện trong feed/archive. Page là nội dung độc lập ở URL cấp cao nhất. Đây là điểm khởi đầu khuyến nghị — thêm Collection/taxonomy/field khác khi theme cần, nhưng bắt đầu từ đây.

### Seed file

`.emdash/seed.json` cho EmDash biết cần tạo gì lần chạy đầu:

```json title=".emdash/seed.json"
{
	"$schema": "https://emdashcms.com/seed.schema.json",
	"version": "1",
	"meta": { "name": "Minimal Blog", "description": "A clean blog with posts and pages", "author": "Your Name" },
	"settings": { "title": "My Blog", "tagline": "Thoughts and ideas", "postsPerPage": 10 },
	"collections": [
		{
			"slug": "posts",
			"label": "Posts",
			"labelSingular": "Post",
			"supports": ["drafts", "revisions"],
			"fields": [
				{ "slug": "title", "label": "Title", "type": "string", "required": true },
				{ "slug": "content", "label": "Content", "type": "portableText" },
				{ "slug": "excerpt", "label": "Excerpt", "type": "text" },
				{ "slug": "featured_image", "label": "Featured Image", "type": "image" }
			]
		},
		{
			"slug": "pages",
			"label": "Pages",
			"labelSingular": "Page",
			"supports": ["drafts", "revisions"],
			"fields": [
				{ "slug": "title", "label": "Title", "type": "string", "required": true },
				{ "slug": "content", "label": "Content", "type": "portableText" }
			]
		}
	],
	"taxonomies": [
		{
			"name": "category", "label": "Categories", "labelSingular": "Category",
			"hierarchical": true, "collections": ["posts"],
			"terms": [{ "slug": "news", "label": "News" }, { "slug": "tutorials", "label": "Tutorials" }]
		}
	],
	"menus": [
		{
			"name": "primary", "label": "Primary Navigation",
			"items": [{ "type": "custom", "label": "Home", "url": "/" }, { "type": "custom", "label": "Blog", "url": "/posts" }]
		}
	],
	"redirects": [
		{ "source": "/category/news", "destination": "/categories/news" },
		{ "source": "/old-about", "destination": "/about" }
	]
}
```

Post có `excerpt` và `featured_image` vì xuất hiện trong danh sách/feed; page không cần vì là nội dung độc lập. Đặc tả seed file đầy đủ ở [Chương 48](./48-seed-files.md).

## Dựng trang

Mọi trang hiển thị nội dung EmDash đều server-rendered — dùng `Astro.params` lấy slug từ URL, truy vấn nội dung lúc request.

> Trong theme, **không bao giờ** dùng `getStaticPaths()` hay `export const prerender = true` cho trang hiển thị nội dung EmDash — theme phục vụ nội dung lúc runtime qua admin UI, nên các trang này phải server-render.

**Trang chủ** — lấy `postsPerPage` từ settings, truy vấn post published mới nhất.

**Bài viết đơn** — lấy entry theo slug qua `getEmDashEntry`, redirect 404 nếu không có, lấy category bằng `getEntryTerms`.

**Trang (Pages)** — dùng catch-all route ở gốc (`[...slug].astro`) để slug ánh xạ thẳng URL cấp cao nhất (`about` → `/about`). Vì là catch-all, nó chỉ khớp URL không có route cụ thể hơn — `/posts/hello-world` vẫn khớp `posts/[slug].astro`, không phải file này.

**Archive Category** — lấy term qua `getTerm`, lấy entry qua `getEntriesByTerm`.

(Xem lại mẫu code đầy đủ tương tự ở [Chương 34](./34-truy-van-noi-dung.md) và [Chương 12](./12-phan-loai-taxonomies.md).)

## Dùng Ảnh

Field ảnh là **object** có thuộc tính `src` và `alt`, **không phải chuỗi**. Dùng component `Image` từ `emdash/ui` để render ảnh tối ưu:

```astro title="src/components/PostCard.astro"
---
import { Image } from "emdash/ui";
const { post } = Astro.props;
---

<article>
  {post.data.featured_image?.src && (
    <Image
      image={post.data.featured_image}
      alt={post.data.featured_image.alt || post.data.title}
      width={800}
      height={450}
      priority
    />
  )}
  <h2><a href={`/posts/${post.slug}`}>{post.data.title}</a></h2>
  <p>{post.data.excerpt}</p>
</article>
```

> Lỗi thường gặp: coi field ảnh như chuỗi. `post.data.featured_image` là object có `src`/`alt` — viết `<img src={post.data.featured_image} />` sẽ render ra `[object Object]`.

Chỉ dùng `priority` cho ảnh khả năng cao hiển thị ngay (above-the-fold), như hero hoặc ảnh card đầu tiên — nó render với `loading="eager"` và `fetchpriority="high"`.

## Dùng Menu

Truy vấn menu do admin định nghĩa trong layout — không bao giờ hard-code liên kết điều hướng (xem mẫu code đầy đủ ở [Chương 10](./10-menu-dieu-huong.md)).

## Template trang

Theme thường cần nhiều layout — mặc định, full-width, landing page. Thêm field `select` tên `template` vào Collection pages và ánh xạ sang component layout trong route catch-all (đã trình bày đầy đủ ở [Chương 18](./18-bo-cuc-trang-section.md), mục "Bố cục trang"). Editor chọn template từ dropdown khi sửa trang trong admin UI.

## Thêm Section

Section là khối nội dung tái sử dụng chèn qua slash command `/section` (đã trình bày đầy đủ ở [Chương 18](./18-bo-cuc-trang-section.md)). Nếu theme có mẫu nội dung thường gặp (hero banner, CTA, feature grid), định nghĩa chúng thành section trong seed file — xem seed mẫu ở Chương 18. Section tạo từ seed file được đánh dấu `source: "theme"` và **không thể xoá** từ admin UI (khác section do editor tự tạo, đánh dấu `source: "user"`).

## Thêm nội dung mẫu

Gồm nội dung mẫu trong seed file để minh hoạ thiết kế theme:

```json title=".emdash/seed.json"
{
	"content": {
		"posts": [
			{
				"id": "hello-world",
				"slug": "hello-world",
				"status": "published",
				"data": {
					"title": "Hello World",
					"content": [{ "_type": "block", "style": "normal", "children": [{ "_type": "span", "text": "Welcome to your new blog!" }] }],
					"excerpt": "Your first post on EmDash."
				},
				"taxonomies": { "category": ["news"] }
			}
		]
	}
}
```

> Nội dung mẫu là **tuỳ chọn** lúc setup — user có thể bỏ tick "Include sample content" trong Setup Wizard nếu muốn khởi đầu sạch (xem lại [Chương 2](./02-cai-dat-lan-dau.md), [Chương 21](./21-theme-tong-quan.md)).

## Gồm Media

Tham chiếu ảnh trong nội dung mẫu bằng cú pháp `$media`. Ảnh từ xa tham chiếu qua URL:

```json
{ "data": { "featured_image": { "$media": { "url": "https://images.unsplash.com/photo-xxx", "alt": "A descriptive alt text", "filename": "hero.jpg" } } } }
```

Với ảnh cục bộ, đặt tệp trong `.emdash/uploads/` và tham chiếu theo tên tệp:

```json
{ "data": { "featured_image": { "$media": { "file": "hero.jpg", "alt": "A descriptive alt text" } } } }
```

Lúc seeding, tệp media được tải về (hoặc đọc cục bộ) và upload lên storage.

## Tìm kiếm

Nếu theme có trang tìm kiếm, dùng component `LiveSearch` để có kết quả tức thì:

```astro title="src/pages/search.astro"
---
import LiveSearch from "emdash/ui/search";
import Base from "../layouts/Base.astro";
---

<Base title="Search">
  <h1>Search</h1>
  <LiveSearch placeholder="Search posts and pages..." collections={["posts", "pages"]} />
</Base>
```

`LiveSearch` cung cấp tìm kiếm tức thì có debounce, khớp tiền tố, Porter stemming, và đoạn trích kết quả tô sáng. Tìm kiếm phải bật riêng theo từng Collection trong admin UI (Content Types > Edit > Features > Search).

Trên site đa ngôn ngữ, kết quả giới hạn theo locale của trang đang chạy tìm kiếm — component tự đọc `Astro.currentLocale` và chuyển tới endpoint tìm kiếm. Truyền `locale` tường minh để tìm locale khác, hoặc `locale={null}` để tìm xuyên mọi locale. Site không cấu hình `i18n` của Astro không bị ảnh hưởng — `Astro.currentLocale` là `undefined`, không locale nào được gửi, tìm kiếm bao phủ mọi entry.

## Test Theme

1. Tạo dự án test từ theme: `npm create astro@latest -- --template ./path/to/my-theme`.
2. Cài dependency, chạy dev server: `cd test-site && npm install && npm run dev`.
3. Hoàn tất Setup Wizard tại `http://localhost:4321/_emdash/admin`.
4. Xác nhận Collection, menu, redirect, nội dung được tạo đúng.
5. Test mọi template trang render đúng.
6. Tạo nội dung mới qua admin để xác nhận mọi field hoạt động.

## Publish Theme

```bash
npm publish --access public
```

User cài theme: `npm create astro@latest -- --template @your-org/emdash-theme-blog`. Theme host trên GitHub cài bằng tiền tố `github:`: `npm create astro@latest -- --template github:your-org/emdash-theme-blog`.

## Khối Portable Text tuỳ chỉnh

Theme định nghĩa được loại khối Portable Text tuỳ chỉnh cho nội dung chuyên biệt — hữu ích cho trang marketing, landing page, hoặc nội dung cần component có cấu trúc ngoài rich text chuẩn.

**Khai trong nội dung seed:** dùng `_type` có namespace trong nội dung Portable Text của seed file (vd `"marketing.hero"`, `"marketing.features"`).

**Tạo component khối:** một component Astro cho mỗi loại khối tuỳ chỉnh, nhận `value` chứa dữ liệu khối.

**Render khối tuỳ chỉnh:** truyền component vào prop `components.types` của `PortableText`:

```astro title="src/components/MarketingBlocks.astro"
---
import { PortableText } from "emdash/ui";
import Hero from "./blocks/Hero.astro";
import Features from "./blocks/Features.astro";

interface Props { value: unknown[]; }
const { value } = Astro.props;

const marketingTypes = {
  "marketing.hero": Hero,
  "marketing.features": Features,
};
---

<PortableText value={value} components={{ types: marketingTypes }} />
```

> Loại khối tuỳ chỉnh **không** có editor admin UI theo mặc định. User sửa nội dung đã seed qua trình soạn thảo Portable Text chuẩn hoặc sửa JSON trực tiếp. Để có trải nghiệm sửa admin đầy đủ, cân nhắc tạo plugin với component editor tuỳ chỉnh (xem Chương 41, 44).

**Anchor ID cho điều hướng:** thêm `_key` vào khối cần liên kết được, dùng giá trị đó làm `id` trong component khối — cho phép liên kết kiểu `/#features`.

## Checklist Theme

Trước khi publish, xác nhận theme có:

- [ ] `package.json` với field `emdash` (label, description, đường dẫn seed)
- [ ] `.emdash/seed.json` với schema hợp lệ
- [ ] Mọi Collection tham chiếu trong trang đều có trong seed
- [ ] Menu dùng trong layout được định nghĩa trong seed
- [ ] Nội dung mẫu minh hoạ đúng thiết kế theme
- [ ] `astro.config.mjs` có cấu hình database và storage
- [ ] `src/live.config.ts` có loader EmDash
- [ ] Không có `getStaticPaths()` trên trang nội dung
- [ ] Không hard-code tên site, tagline, hay điều hướng
- [ ] Field ảnh truy cập như object (`image.src`), không phải chuỗi
- [ ] README kèm hướng dẫn cài đặt
- [ ] Component khối tuỳ chỉnh cho mọi loại Portable Text không chuẩn

## Xem thêm

- [Chương 10 — Menu điều hướng](./10-menu-dieu-huong.md)
- [Chương 18 — Bố cục trang & Section](./18-bo-cuc-trang-section.md)
- [Chương 21 — Chủ đề (Themes) — cài đặt và tuỳ biến cơ bản](./21-theme-tong-quan.md)
- [Chương 23 — Di chuyển từ WordPress](./23-di-chuyen-tu-wordpress.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
- [Chương 48 — Seed Files — dữ liệu khởi tạo cho Theme](./48-seed-files.md)
