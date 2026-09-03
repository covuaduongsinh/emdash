# 23. Di chuyển từ WordPress

Áp dụng cho vai trò: Quản trị viên/Vận hành (nhập nội dung), Lập trình viên (chuyển đổi theme)

## Tổng quan

EmDash di chuyển được nội dung từ WordPress. Chương này gồm hai phần: **Phần 1** — nhập bài viết, trang, media, taxonomy qua admin dashboard; **Phần 2** — chuyển đổi (port) theme WordPress sang theme EmDash một cách có hệ thống.

## Phần 1 — Di chuyển nội dung

### Trước khi bắt đầu

- **Xuất nội dung:** trong WordPress, vào **Tools → Export** và tải file export đầy đủ (`.xml`).
- **Sao lưu site:** giữ site WordPress chạy tới khi xác nhận việc di chuyển thành công.

### 3 phương pháp nhập

| Phương pháp | Phù hợp cho | Gồm cả draft | Cần xác thực |
| --- | --- | --- | --- |
| Tải lên file WXR | Di chuyển đầy đủ | Có | Không |
| WordPress.com | Site host trên WordPress.com | Có | OAuth |
| REST API (probe) | Kiểm tra nội dung trước khi export | Không | Tuỳ chọn |

Tải lên file WXR được khuyến nghị cho hầu hết trường hợp — bắt được toàn bộ nội dung, kể cả draft, custom field, và bài viết riêng tư.

### Quy trình nhập file WXR

1. **Xuất từ WordPress:** trong admin WordPress, vào **Tools → Export → All content → Download Export File**.
2. **Mở wizard nhập:** trong EmDash, vào **Admin → Settings → Import → WordPress**.
3. **Tải lên file export:** kéo-thả file `.xml` hoặc nhấn để duyệt — file được phân tích ngay trong trình duyệt.
4. **Xem lại nội dung phát hiện được:** wizard hiển thị những gì tìm thấy, vd:
   ```
   Found in export:
   ├── Posts: 127 → posts [New collection]
   ├── Pages: 12  → pages [Add fields]
   └── Media: 89 attachments
   ```
5. **Cấu hình ánh xạ:** bật/tắt post type nào cần nhập. EmDash tự động: tạo Collection mới cho post type chưa ánh xạ, thêm field còn thiếu vào Collection có sẵn, cảnh báo xung đột kiểu field.
6. **Thực hiện nhập:** nhấn **Import Content** — tiến độ hiển thị khi từng mục được xử lý.
7. **Nhập media (tuỳ chọn):** sau khi nhập nội dung, chọn có tải tệp media hay không. EmDash: tải từ URL WordPress, loại trùng lặp theo hash nội dung, tự viết lại URL trong nội dung.

> Chạy lại việc nhập là an toàn — các mục được khớp theo WordPress ID nên không tạo bản trùng.

### Chuyển đổi nội dung

**Gutenberg → Portable Text:**

| Block Gutenberg | Portable Text | Ghi chú |
| --- | --- | --- |
| `core/paragraph` | `block` style="normal" | Giữ nguyên inline mark |
| `core/heading` | `block` style="h1-h6" | Cấp độ lấy từ thuộc tính block |
| `core/image` | `image` block | Tham chiếu media được cập nhật |
| `core/list` | `block` với type `listItem` | Cả có thứ tự và không thứ tự |
| `core/quote` | `block` style="blockquote" | Gồm cả citation |
| `core/code` | `code` block | Giữ thuộc tính ngôn ngữ |
| `core/embed` | `embed` block | Lưu URL và provider |
| `core/gallery` | `gallery` block | Mảng tham chiếu ảnh |
| `core/columns` | `columns` block | Giữ nội dung lồng nhau |
| Block không rõ | `htmlBlock` | Giữ nguyên HTML gốc để xem lại |

Block không rõ được lưu dạng `htmlBlock` kèm HTML gốc và metadata — bạn có thể xem lại và chuyển đổi thủ công, hoặc tạo component Portable Text tuỳ chỉnh để render chúng.

Nội dung từ Classic Editor (HTML thô) cũng được chuyển thành khối Portable Text — style inline (`<strong>`, `<em>`, `<a>`) trở thành mark trên span.

**Ánh xạ trạng thái:**

| Status WordPress | Status EmDash |
| --- | --- |
| `publish` | `published` |
| `draft` | `draft` |
| `pending` | `pending` |
| `private` | `private` |
| `future` | `scheduled` |
| `trash` | `archived` |

### Nhập Taxonomy

Category và tag nhập thành taxonomy, giữ nguyên cấu trúc phân cấp:

```
WordPress:                    EmDash:
├── Categories (hierarchical) ├── taxonomies table
│   ├── News                  │   ├── category/news
│   │   ├── Local             │   ├── category/local (parent: news)
│   │   └── World             │   ├── category/world (parent: news)
│   └── Sports                │   └── category/sports
└── Tags (flat)               └── content_taxonomies junction
    ├── featured                  ├── tag/featured
    └── breaking                  └── tag/breaking
```

### Custom Field và ACF

WordPress post meta và field ACF được phân tích trong quá trình nhập:

1. **Giai đoạn phân tích:** wizard phát hiện custom field và đề xuất kiểu field EmDash tương ứng, vd:
   ```
   Custom Fields:
   ├── subtitle (string, 45 posts)
   ├── _yoast_wpseo_title → seo.title (string, 127 posts)
   ├── _thumbnail_id → featuredImage (reference, 89 posts)
   └── price (number, 23 posts)
   ```
2. **Ánh xạ field:** field nội bộ của WordPress (bắt đầu bằng `_edit_`, `_wp_`) mặc định bị ẩn. Field của plugin SEO ánh xạ vào object `seo`.
3. **Suy luận kiểu:** EmDash suy luận kiểu field từ giá trị — chuỗi số → `number`; `"1"`/`"0"`/`"true"`/`"false"` → `boolean`; ngày ISO → `date`; PHP/JSON serialize → `json`; ID WordPress (vd `_thumbnail_id`) → `reference`.

> Field ACF kiểu repeater và flexible content nhập thành JSON — tạo field Portable Text hoặc mảng tương ứng trong EmDash để cấu trúc lại dữ liệu này.

### Redirect URL

Sau khi nhập, EmDash sinh một bản đồ redirect:

```json
{
	"redirects": [
		{ "from": "/?p=123", "to": "/posts/hello-world" },
		{ "from": "/2024/01/hello-world/", "to": "/posts/hello-world" },
		{ "from": "/category/news/", "to": "/categories/news" }
	],
	"feeds": [
		{ "from": "/feed/", "to": "/rss.xml" },
		{ "from": "/feed/atom/", "to": "/atom.xml" }
	]
}
```

Áp dụng các redirect này vào: rule redirect của Cloudflare, cấu hình redirect của nền tảng hosting, hoặc tuỳ chọn `redirects` trong `astro.config.mjs`.

### Nhập qua API (nâng cao)

Việc nhập WordPress khả dụng qua cả admin dashboard lẫn REST API. Ưu tiên dùng import wizard trên dashboard — có sẵn ánh xạ field, xử lý xung đột, theo dõi tiến độ. Endpoint API nhập nằm dưới `/_emdash/api/import/wordpress/` cho tích hợp bằng chương trình.

### Xử lý sự cố

| Vấn đề | Nguyên nhân / Cách xử lý |
| --- | --- |
| "XML parsing error" | File export có thể hỏng/thiếu — export lại từ WordPress. |
| Tải media thất bại | Một số ảnh có thể yêu cầu xác thực hoặc đã bị di chuyển — việc nhập vẫn tiếp tục, URL lỗi được ghi log để xử lý thủ công. |
| Xung đột kiểu field | Nếu Collection có sẵn chứa field kiểu không tương thích, wizard hiển thị xung đột — đổi tên field EmDash, đổi ánh xạ field WordPress, hoặc xoá và tạo lại Collection. |
| Export quá lớn (>100MB) | Export từng post type riêng trong WordPress, nhập từng file tuần tự, hoặc dùng CLI với `--resume` để tăng độ tin cậy. |

## Phần 2 — Chuyển đổi Theme WordPress

Theme WordPress có thể chuyển đổi có hệ thống sang EmDash. Thiết kế trực quan, cấu trúc nội dung, và tính năng động đều chuyển được qua cách tiếp cận 3 giai đoạn.

> **Hỗ trợ bằng AI:** Chuyển đổi template là một quá trình mang tính máy móc mà AI coding agent xử lý tốt. Cung cấp cho agent các file theme WordPress cùng các bảng ánh xạ khái niệm trong tài liệu gốc để sinh bản nháp đầu tiên cho component Astro — sau đó xem lại và tinh chỉnh output trước khi dùng thật.

### Giai đoạn 1 — Trích xuất thiết kế

Trích xuất biến CSS, font, màu sắc, và mẫu bố cục từ theme WordPress. File cần xem: `style.css` (stylesheet chính kèm theme header), `assets/css/` (stylesheet bổ sung), `theme.json` (block theme từ WP 5.9+, chứa token có cấu trúc).

Bảng ánh xạ token thiết kế thường gặp: font chữ thân → `--font-body`, font heading → `--font-heading`, màu chính → `--color-primary`, nền → `--color-base`, màu chữ → `--color-contrast`, độ rộng nội dung → `--content-width`. Sau đó dựng `src/layouts/Base.astro` với các biến CSS đã trích, cấu trúc header/footer, tải font, và breakpoint responsive.

### Giai đoạn 2 — Chuyển đổi Template

Ánh xạ template hierarchy của WordPress sang route Astro (bảng chi tiết giống hệt bảng đã trình bày ở [Chương 4](./04-so-sanh-wordpress-astro.md)), và ánh xạ template tag WordPress sang lệnh gọi API EmDash:

| Hàm WordPress | Tương đương EmDash |
| --- | --- |
| `have_posts()` / `the_post()` | `getEmDashCollection()` |
| `get_post()` | `getEmDashEntry()` |
| `the_title()` | `post.data.title` |
| `the_content()` | `<PortableText value={post.data.content} />` |
| `the_excerpt()` | `post.data.excerpt` |
| `the_permalink()` | `` /posts/${post.slug} `` |
| `the_post_thumbnail()` | `post.data.featured_image` |
| `get_the_date()` | `post.data.publishedAt` |
| `get_the_category()` | `getEntryTerms(coll, id, "categories")` |
| `get_the_tags()` | `getEntryTerms(coll, id, "tags")` |

Vòng lặp (`the Loop`) trong `archive.php` chuyển thành gọi `getEmDashCollection()` kèm `orderBy`; template `single.php` chuyển thành route dùng `getStaticPaths()` + `getEmDashCollection()`/`getEntryTerms()` (xem ví dụ đầy đủ tương tự ở [Chương 4](./04-so-sanh-wordpress-astro.md)). `get_template_part()` chuyển thành import component Astro (vd `PostCard.astro`).

### Giai đoạn 3 — Tính năng động

**Menu điều hướng:** xác định menu trong `functions.php`, tạo menu EmDash tương ứng, render bằng `getMenu()` (xem lại [Chương 10](./10-menu-dieu-huong.md)).

**Widget Area (Sidebar):** ánh xạ widget WordPress sang widget EmDash:

| Widget WordPress | Loại Widget EmDash |
| --- | --- |
| Text/Custom HTML | `type: "content"` |
| Custom Menu | `type: "menu"` |
| Recent Posts | `component: "core:recent-posts"` |
| Categories | `component: "core:categories"` |
| Tag Cloud | `component: "core:tag-cloud"` |
| Search | `component: "core:search"` |

Render bằng `getWidgetArea()` (xem lại [Chương 11](./11-widget-va-vung-widget.md)).

**Taxonomy:** truy vấn taxonomy đã đăng ký trong theme bằng `getTaxonomyTerms()`/`getEntriesByTerm()` (xem lại [Chương 12](./12-phan-loai-taxonomies.md)).

**Site Settings:** ánh xạ Customizer của WordPress sang Site Settings EmDash — Site Title → `title`, Tagline → `tagline`, Site Icon → `favicon`, Custom Logo → `logo`, Posts per page → `postsPerPage` (xem lại [Chương 14](./14-cai-dat-site-settings.md)).

**Shortcode → Portable Text:** shortcode WordPress (đăng ký bằng `add_shortcode()`) chuyển thành custom block Portable Text — tạo component Astro (vd `Gallery.astro`) rồi đăng ký với `<PortableText components={{ gallery: Gallery }} />`.

### Cấu trúc Seed File

Ghi lại toàn bộ mô hình nội dung vào một seed file, gồm settings, taxonomy, menu, và widget area:

```json title=".emdash/seed.json"
{
	"$schema": "https://emdashcms.com/seed.schema.json",
	"version": "1",
	"meta": { "name": "Ported Theme" },
	"settings": { "title": "My Site", "tagline": "Welcome", "postsPerPage": 10 },
	"taxonomies": [
		{ "name": "category", "label": "Categories", "hierarchical": true, "collections": ["posts"] }
	],
	"menus": [
		{
			"name": "primary",
			"label": "Primary Navigation",
			"items": [
				{ "type": "custom", "label": "Home", "url": "/" },
				{ "type": "custom", "label": "Blog", "url": "/posts" }
			]
		}
	],
	"widgetAreas": [
		{
			"name": "sidebar",
			"label": "Main Sidebar",
			"widgets": [{ "type": "component", "componentId": "core:recent-posts", "props": { "count": 5 } }]
		}
	]
}
```

Đặc tả seed file đầy đủ nằm ở [Chương 48](./48-seed-files.md).

### Checklist chuyển đổi

- **Giai đoạn 1 (Thiết kế):** đã trích biến CSS, font tải được, bảng màu khớp, breakpoint responsive hoạt động.
- **Giai đoạn 2 (Template):** trang chủ, bài viết đơn, trang archive, và trang 404 đều render đúng.
- **Giai đoạn 3 (Động):** site settings đã cấu hình, menu hoạt động, taxonomy truy vấn được, widget area render đúng, seed file hoàn chỉnh.

### Trường hợp đặc biệt

- **Child Theme:** nếu theme có theme cha (kiểm tra dòng `Template:` trong `style.css`), phân tích theme cha trước, rồi áp dụng phần ghi đè của child theme.
- **Block Theme (FSE):** theme block của WordPress 5.9+ dùng `theme.json` cho token thiết kế và `templates/*.html` cho markup block — chuyển markup block sang component Astro và trích token từ `theme.json`.
- **Page Builder:** nội dung dựng bằng Elementor, Divi hoặc tương tự nằm trong post meta, không nằm trong file theme — nội dung này nhập qua WXR (Phần 1), không phải qua chuyển đổi theme. Tập trung việc chuyển đổi theme vào phần "khung" (shell); nội dung page builder render qua Portable Text sau khi nhập.

## Xem thêm

- [Chương 4 — So sánh với WordPress / Astro thuần](./04-so-sanh-wordpress-astro.md)
- [Chương 18 — Bố cục trang & Section](./18-bo-cuc-trang-section.md)
- [Chương 21 — Chủ đề (Themes) — cài đặt và tuỳ biến cơ bản](./21-theme-tong-quan.md)
- [Chương 24 — Nhập nội dung từ nguồn khác](./24-nhap-noi-dung.md)
- [Chương 46 — Chuyển đổi Plugin WordPress sang EmDash](./46-chuyen-doi-plugin-wp.md)
- [Chương 47 — Xây dựng Theme từ đầu](./47-xay-dung-theme.md)
- [Chương 48 — Seed Files](./48-seed-files.md)
