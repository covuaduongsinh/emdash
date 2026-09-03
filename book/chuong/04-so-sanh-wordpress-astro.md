# 4. So sánh với WordPress / Astro thuần

Áp dụng cho vai trò: Lập trình viên (đặc biệt hữu ích cho dev có nền WordPress hoặc nền Astro), Quản trị viên/Vận hành

## Tổng quan

Chương này tổng hợp ba tài liệu "coming from" (đến từ nền tảng khác) của EmDash, giúp bạn ánh xạ kiến thức cũ sang khái niệm EmDash nhanh nhất có thể — tuỳ vào bạn xuất phát từ đâu:

- **Dev quen WordPress** → đọc phần "EmDash cho dev WordPress".
- **Dev quen Astro (chưa biết WordPress)** → đọc phần "EmDash cho dev Astro".
- **Dev quen WordPress nhưng chưa biết Astro** → đọc phần "Học Astro qua lăng kính WordPress" trước, rồi quay lại phần đầu.

## EmDash cho dev WordPress

EmDash mang các khái niệm quen thuộc của WordPress — post, page, taxonomy, menu, widget, media library — vào một stack Astro hiện đại. Kiến thức quản trị nội dung của bạn chuyển giao gần như trực tiếp.

### Cái gì vẫn quen thuộc

- **Collection** hoạt động như Custom Post Type — định nghĩa cấu trúc nội dung, truy vấn trong template.
- **Taxonomy** hoạt động y hệt — phân cấp (như category) và phẳng (như tag).
- **Menu** kéo-thả sắp xếp, mục lồng nhau.
- **Widget Area** cho sidebar và vùng nội dung động.
- **Media library** với upload, tổ chức, quản lý ảnh.
- **Admin UI** mà biên tập viên dùng được mà không cần đụng code.

> Bạn không cần biết React hay bất kỳ framework JavaScript cụ thể nào. Component Astro dùng HTML với biểu thức template đơn giản — gần với template PHP hơn là React.

### Bảng tra nhanh (Quick Reference)

| WordPress | EmDash | Ghi chú |
| --- | --- | --- |
| Custom Post Types | Collections | Định nghĩa qua admin UI hoặc API |
| `WP_Query` | `getEmDashCollection()` | Filter, limit, truy vấn taxonomy |
| `get_post()` | `getEmDashEntry()` | Trả về entry hoặc null |
| Categories/Tags | Taxonomies | Vẫn hỗ trợ phân cấp |
| `register_nav_menus()` | `getMenu()` | Hỗ trợ menu hạng nhất |
| `register_sidebar()` | `getWidgetArea()` | Hỗ trợ widget area hạng nhất |
| `bloginfo('name')` | `getSiteSetting("title")` | API site settings |
| `the_content()` | `<PortableText />` | Render nội dung có cấu trúc |
| Shortcode | Portable Text block | Component tuỳ chỉnh |
| `add_action/filter()` | Plugin hook | `content:beforeSave`, v.v. |
| `wp_options` | `ctx.kv` | Lưu trữ key-value |
| Thư mục theme | Thư mục `src/` | Component, layout, page |
| `functions.php` | `astro.config.mjs` + cấu hình EmDash | Cấu hình build và runtime |

### Ví dụ: Truy vấn danh sách bài viết

```php title="archive.php — WordPress"
<?php
$posts = new WP_Query([
  'post_type' => 'post',
  'posts_per_page' => 10,
  'post_status' => 'publish',
  'category_name' => 'news',
]);
while ($posts->have_posts()) : $posts->the_post(); ?>
  <h2><?php the_title(); ?></h2>
  <?php the_excerpt(); ?>
<?php endwhile; ?>
```

```astro title="src/pages/posts/index.astro — EmDash"
---
import { getEmDashCollection } from "emdash";

const { entries: posts } = await getEmDashCollection("posts", {
  status: "published",
  limit: 10,
  where: { category: "news" },
});
---

{posts.map((post) => (
  <article>
    <h2>{post.data.title}</h2>
    <p>{post.data.excerpt}</p>
  </article>
))}
```

### Bảng ánh xạ Template Hierarchy

| Template WordPress | Tương đương EmDash |
| --- | --- |
| `index.php` | `src/pages/index.astro` |
| `single.php` | `src/pages/posts/[slug].astro` |
| `single-{type}.php` | `src/pages/{type}/[slug].astro` |
| `page.php` | `src/pages/pages/[slug].astro` |
| `archive.php` | `src/pages/posts/index.astro` |
| `archive-{type}.php` | `src/pages/{type}/index.astro` |
| `category.php` | `src/pages/categories/[slug].astro` |
| `tag.php` | `src/pages/tags/[slug].astro` |
| `search.php` | `src/pages/search.astro` |
| `404.php` | `src/pages/404.astro` |
| `header.php` / `footer.php` | `src/layouts/Base.astro` |
| `sidebar.php` | `src/components/Sidebar.astro` |

### Bảng ánh xạ Hook

| Hook WordPress | Hook EmDash | Mục đích |
| --- | --- | --- |
| `save_post` | `content:beforeSave` | Sửa nội dung trước khi lưu |
| `the_content` | Component PortableText | Biến đổi nội dung khi render |
| `pre_get_posts` | Tuỳ chọn truy vấn (query options) | Lọc truy vấn |
| `wp_head` | `<head>` trong layout | Thêm nội dung head |
| `wp_footer` | Trước `</body>` trong layout | Thêm nội dung footer |

### Cái gì tốt hơn trong EmDash

- **Type Safety** — TypeScript xuyên suốt: collection, query, component đều có kiểu, tự động gợi ý và kiểm tra lúc build.
- **Hiệu năng** — Static generation mặc định, server rendering khi cần, sẵn sàng deploy edge.
- **Trải nghiệm dev hiện đại** — Hot module replacement, kiến trúc component, công cụ hiện đại (Vite, TypeScript, ESLint).
- **Deploy dựa trên Git** — Code và template nằm trong git; nội dung nằm trong database. Deploy bằng cách push code.
- **Preview link an toàn** — URL preview có token ký HMAC, chia sẻ cho reviewer xem draft mà không cần đăng nhập production.
- **Plugin cách ly** — Chạy trong ngữ cảnh cách ly với API tường minh, không chia sẻ/ghi đè state toàn cục lẫn nhau.

### Lộ trình di chuyển từ WordPress

1. Export từ WordPress (Tools → Export).
2. Tải file `.xml` lên trong admin của EmDash.
3. Ánh xạ post type sang collection.
4. Nhập nội dung và media.

Post, page, taxonomy, menu, media chuyển được. Block Gutenberg chuyển thành Portable Text. Custom field được phân tích và ánh xạ. Chi tiết đầy đủ ở [Chương 23 — Di chuyển từ WordPress](./23-di-chuyen-tu-wordpress.md).

## EmDash cho dev Astro

EmDash là CMS xây dựng riêng cho Astro. Nó mở rộng site Astro của bạn với nội dung có database phía sau, admin UI hoàn chỉnh, và các tính năng kiểu WordPress (menu, widget, taxonomy) — trong khi vẫn giữ nguyên trải nghiệm lập trình Astro quen thuộc.

### EmDash bổ sung gì

| Tính năng | Mô tả |
| --- | --- |
| Admin UI | Giao diện chỉnh sửa WYSIWYG đầy đủ tại `/_emdash/admin` |
| Lưu trữ database | Nội dung lưu trong SQLite, libSQL, Cloudflare D1, hoặc PostgreSQL |
| Media library | Upload, tổ chức, phục vụ ảnh và tệp |
| Menu điều hướng | Quản lý menu kéo-thả, lồng nhau |
| Widget area | Sidebar và vùng footer động |
| Site settings | Cấu hình toàn cục (tên, logo, mạng xã hội) |
| Taxonomies | Category, tag, taxonomy tuỳ chỉnh |
| Hệ thống preview | URL preview có ký cho nội dung nháp |
| Revisions | Lịch sử phiên bản nội dung |

### Astro Collections so với EmDash Collections

Collection `astro:content` của Astro dựa trên file và được phân giải lúc build. Collection của EmDash dựa trên database và phân giải tại runtime.

| | Astro Collections | EmDash Collections |
| --- | --- | --- |
| Lưu trữ | Markdown/MDX trong `src/content/` | Database SQL (SQLite/libSQL/D1/Postgres) |
| Chỉnh sửa | Code editor | Admin UI |
| Định dạng nội dung | Markdown + frontmatter | Portable Text (JSON có cấu trúc) |
| Cập nhật | Cần rebuild | Tức thì (SSR) |
| Schema | Zod trong `content.config.ts` | Định nghĩa trong admin, lưu trong database |
| Phù hợp cho | Nội dung do dev quản lý | Nội dung do editor quản lý |

Hai hệ này **dùng được cùng lúc**: dùng Astro collection cho nội dung dev quản lý (docs, changelog), dùng EmDash cho nội dung editor quản lý (bài viết, trang):

```astro title="src/pages/index.astro"
---
import { getCollection } from "astro:content";
import { getEmDashCollection } from "emdash";

const docs = await getCollection("docs");
const { entries: posts } = await getEmDashCollection("posts", {
  status: "published",
  limit: 5,
});
---
```

### Cấu hình cần thiết

EmDash cần hai file cấu hình: đăng ký integration trong `astro.config.mjs` (`output: "server"`, `react()`, `emdash({...})`) và Live Collections Loader trong `src/live.config.ts` — xem chi tiết đầy đủ ở [Chương 2](./02-cai-dat-lan-dau.md) và [Chương 3](./03-them-vao-du-an-co-san.md).

### Render nội dung

EmDash lưu rich text dưới dạng Portable Text — định dạng JSON có cấu trúc, không nhúng HTML (giúp nội dung portable qua nhiều renderer và tránh lỗ hổng XSS). Render bằng component `PortableText`:

```astro title="src/pages/posts/[slug].astro"
---
import { getEmDashEntry } from "emdash";
import { PortableText } from "emdash/ui";

const { slug } = Astro.params;
const { entry: post } = await getEmDashEntry("posts", slug);

if (!post) {
  return Astro.redirect("/404");
}
---

<article>
  <h1>{post.data.title}</h1>
  <PortableText value={post.data.content} />
</article>
```

### Render tĩnh và động

Với trang tĩnh dùng `getStaticPaths`, nội dung được lấy lúc build. Với trang động cần dữ liệu mới nhất mỗi request, đặt `export const prerender = false`. Dùng server rendering cho nội dung cập nhật thường xuyên; dùng static generation cho nội dung ít đổi để tận dụng CDN cache. (Xem chi tiết đầy đủ ở [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md).)

## Học Astro qua lăng kính WordPress

Với dev quen WordPress nhưng chưa biết Astro, tài liệu gốc còn có một bài học nền tảng riêng, đi qua các chủ đề: thay đổi tư duy cốt lõi (Key Paradigm Shifts), cấu trúc dự án, component Astro, biểu thức template, Props và Slots, Layout, styling, JavaScript phía client, routing, và "khái niệm WordPress nằm ở đâu trong Astro" kèm bảng ánh xạ khái niệm tổng hợp cuối bài. Đây là bài đọc nền tảng dành cho người mới hoàn toàn với Astro trước khi quay lại phần "EmDash cho dev WordPress" ở trên.

## Lưu ý

- Ba tài liệu gốc được gộp vào một chương duy nhất vì cùng phục vụ mục đích "định hướng nhanh theo xuất phát điểm" — không phải nội dung tham chiếu chi tiết (chi tiết kỹ thuật từng tính năng nằm ở các chương chuyên đề tương ứng: Chương 8, 10, 11, 12, 14, 34...).
- Cột "EmDash" trong các bảng ánh xạ chỉ mang tính định hướng khái niệm — hành vi chi tiết luôn ưu tiên tham chiếu chương chuyên đề hoặc `reference/*.mdx` gốc.

## Xem thêm

- [Chương 1 — EmDash là gì và dành cho ai](./01-emdash-la-gi.md)
- [Chương 5 — Các khái niệm cốt lõi (bản đồ thuật ngữ)](./05-khai-niem-cot-loi.md)
- [Chương 23 — Di chuyển từ WordPress](./23-di-chuyen-tu-wordpress.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
