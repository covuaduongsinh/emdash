# 34. Truy vấn nội dung trong code Astro

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

EmDash cung cấp hàm truy vấn để lấy nội dung trong trang và component Astro. Các hàm này theo mẫu [live content collections](https://docs.astro.build/en/reference/experimental-flags/live-content-collections/) của Astro, trả về kết quả có cấu trúc kèm xử lý lỗi.

## Hàm truy vấn

| Hàm | Mục đích | Trả về |
| --- | --- | --- |
| `getEmDashCollection` | Lấy mọi entry của một loại nội dung | `{ entries, error }` |
| `getEmDashEntry` | Lấy một entry theo ID hoặc slug | `{ entry, error, isPreview }` |

```ts
import { getEmDashCollection, getEmDashEntry } from "emdash";
```

## Lấy toàn bộ entry

```astro title="src/pages/posts.astro"
---
import { getEmDashCollection } from "emdash";

const { entries: posts, error } = await getEmDashCollection("posts");

if (error) {
  console.error("Failed to load posts:", error);
}
---

<ul>
  {posts.map((post) => (
    <li>{post.data.title}</li>
  ))}
</ul>
```

### Lọc theo Locale

Khi bật i18n (xem lại [Chương 16](./16-da-ngon-ngu-i18n.md)), lọc theo locale để lấy nội dung đúng ngôn ngữ:

```ts
const { entries: frenchPosts } = await getEmDashCollection("posts", {
	locale: "fr",
	status: "published",
});

const { entries: localizedPosts } = await getEmDashCollection("posts", {
	locale: Astro.currentLocale,
	status: "published",
});
```

Với entry đơn, truyền `locale` vào tham số thứ ba của `getEmDashEntry`. Khi bỏ qua, mặc định dùng locale hiện tại của request; nếu không có bản dịch cho locale yêu cầu, chuỗi fallback được áp dụng.

### Lọc theo Status

```ts
const { entries: published } = await getEmDashCollection("posts", { status: "published" });
const { entries: drafts } = await getEmDashCollection("posts", { status: "draft" });
```

> Luôn lọc `status: "published"` cho trang công khai. Nội dung draft chỉ nên truy cập được trong admin hoặc chế độ preview.

### Giới hạn kết quả

```ts
const { entries: recentPosts } = await getEmDashCollection("posts", {
	status: "published",
	limit: 5,
});
```

### Lọc theo Taxonomy

```ts
const { entries: newsPosts } = await getEmDashCollection("posts", {
	status: "published",
	where: { category: "news" },
});

// Khớp bất kỳ term nào trong nhiều term
const { entries: featuredNews } = await getEmDashCollection("posts", {
	status: "published",
	where: { category: ["news", "featured"] },
});
```

Bộ lọc `where` dùng logic OR khi truyền nhiều giá trị cho cùng một taxonomy.

### Xử lý lỗi

```ts
const { entries: posts, error } = await getEmDashCollection("posts");

if (error) {
	console.error("Failed to load posts:", error);
	return new Response("Server error", { status: 500 });
}
```

## Lấy một entry đơn

```astro title="src/pages/posts/[slug].astro"
---
import { getEmDashEntry } from "emdash";
import { PortableText } from "emdash/ui";

const { slug } = Astro.params;
const { entry: post, error } = await getEmDashEntry("posts", slug);

if (error) {
  return new Response("Server error", { status: 500 });
}

if (!post) {
  return Astro.redirect("/404");
}
---

<article>
  <h1>{post.data.title}</h1>
  <PortableText value={post.data.content} />
</article>
```

### Kiểu dữ liệu trả về

```ts
interface EntryResult<T> {
	entry: ContentEntry<T> | null; // null nếu không tìm thấy
	error?: Error; // chỉ đặt khi có lỗi thật (không phải "không tìm thấy")
	isPreview: boolean; // true nếu đang xem nội dung preview/draft
}

interface ContentEntry<T> {
	id: string;
	data: T;
	edit: EditProxy; // Chú thích visual editing
}
```

Object `data` bên trong `entry` chứa mọi field đã định nghĩa cho loại nội dung đó. Proxy `edit` cung cấp chú thích visual editing (xem mục dưới).

## Chế độ Preview

EmDash xử lý preview tự động qua middleware. Khi URL chứa token `_preview` hợp lệ, middleware xác minh và thiết lập ngữ cảnh request — hàm truy vấn của bạn tự phục vụ nội dung draft mà không cần tham số đặc biệt nào (đã trình bày chi tiết ở [Chương 13](./13-xem-truoc-preview.md)):

```astro title="src/pages/posts/[...slug].astro"
---
import { getEmDashEntry } from "emdash";

const { slug } = Astro.params;
const { entry, isPreview, error } = await getEmDashEntry("posts", slug);

if (error) return new Response("Server error", { status: 500 });
if (!entry) return Astro.redirect("/404");
---

{isPreview && (
  <div class="preview-banner">
    Viewing preview. This content is not published.
  </div>
)}

<article>
  <h1>{entry.data.title}</h1>
  <PortableText value={entry.data.content} />
</article>
```

## Visual Editing

Mọi entry trả về từ hàm truy vấn kèm một proxy `edit` để chú thích template. Spread nó lên phần tử để bật chỉnh sửa trực tiếp (inline editing) cho editor đã xác thực:

```astro
<article {...entry.edit}>
  <h1 {...entry.edit.title}>{entry.data.title}</h1>
  <div {...entry.edit.content}>
    <PortableText value={entry.data.content} />
  </div>
</article>
```

Ở chế độ edit, `{...entry.edit.title}` tạo ra thuộc tính `data-emdash-ref` mà thanh công cụ visual editing dùng để bật chỉnh sửa trực tiếp. Ở production, các proxy spread này không tạo ra output nào.

> Với field string/text, inline editing dùng `contenteditable`. Với field Portable Text, nó chèn một TipTap editor. Với field ảnh, nó mở popover thư viện Media.

### Style cho khối code inline

Khối code inline mặc định theo giao diện sáng/tối của hệ thống. Nếu site có bộ chuyển theme riêng, đặt các thuộc tính CSS sau trong selector theme sáng/tối của bạn:

| Thuộc tính | Mục đích |
| --- | --- |
| `--emdash-inline-code-background` | Nền khối code |
| `--emdash-inline-code-foreground` | Chữ code thường |
| `--emdash-inline-code-muted` | Comment và văn bản trích dẫn |
| `--emdash-inline-code-keyword` | Từ khoá, literal, selector, văn bản đã xoá |
| `--emdash-inline-code-string` | Chuỗi, thuộc tính, symbol, văn bản đã thêm |
| `--emdash-inline-code-number` | Số và metadata |
| `--emdash-inline-code-title` | Title, tên, kiểu, built-in |
| `--emdash-inline-code-border` | Viền bộ chọn ngôn ngữ |
| `--emdash-inline-code-control-background` | Nền bộ chọn ngôn ngữ |
| `--emdash-inline-code-control-foreground` | Chữ và icon bộ chọn ngôn ngữ |
| `--emdash-inline-code-focus` | Chỉ báo focus bàn phím |

Nếu đổi màu nền khối code, cũng phải đổi mọi màu chữ để cú pháp vẫn đọc được. Các thuộc tính này chỉ áp dụng khi inline editing đang hoạt động — style khối code đã published bằng CSS thông thường của site.

## Sắp xếp kết quả

`getEmDashCollection` **không đảm bảo** thứ tự sắp xếp — sắp xếp kết quả trong template của bạn:

```ts
const { entries: posts } = await getEmDashCollection("posts", { status: "published" });

// Sắp theo ngày xuất bản, mới nhất trước
const sorted = posts.sort(
	(a, b) => (b.data.publishedAt?.getTime() ?? 0) - (a.data.publishedAt?.getTime() ?? 0),
);

// Theo alphabet
posts.sort((a, b) => a.data.title.localeCompare(b.data.title));

// Theo field order tuỳ chỉnh
posts.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
```

## TypeScript Types

```bash
npx emdash types
```

Tạo `.emdash/types.ts` với interface cho từng Collection — dùng để có type safety:

```ts
import { getEmDashCollection, getEmDashEntry } from "emdash";
import type { Post } from "../.emdash/types";

const { entries: posts } = await getEmDashCollection<Post>("posts");
// posts là ContentEntry<Post>[]

const { entry: post } = await getEmDashEntry<Post>("posts", "my-post");
// post là ContentEntry<Post> | null
```

## Render tĩnh và Server

Nội dung EmDash hoạt động với cả trang static và server-rendered.

**Static (Prerendered):** dùng `getStaticPaths` để sinh route lúc build:

```astro title="src/pages/posts/[slug].astro"
---
import { getEmDashCollection, getEmDashEntry } from "emdash";

export async function getStaticPaths() {
  const { entries: posts } = await getEmDashCollection("posts", { status: "published" });
  return posts.map((post) => ({ params: { slug: post.data.slug } }));
}

const { slug } = Astro.params;
const { entry: post } = await getEmDashEntry("posts", slug);
---
```

**Server-rendered:** truy vấn nội dung trực tiếp:

```astro title="src/pages/posts/[slug].astro"
---
export const prerender = false;

import { getEmDashEntry } from "emdash";

const { slug } = Astro.params;
const { entry: post, error } = await getEmDashEntry("posts", slug);

if (error) return new Response("Server error", { status: 500 });
if (!post) return new Response(null, { status: 404 });
---
```

> Render server hiển thị thay đổi nội dung ngay lập tức — dùng cho nội dung cập nhật thường xuyên.

## Cân nhắc hiệu năng

**Cache:** EmDash dùng live content collections của Astro, tự xử lý cache. Với trang server-rendered, cân nhắc thêm header HTTP cache:

```astro
---
const { entries: posts } = await getEmDashCollection("posts", { status: "published" });
Astro.response.headers.set("Cache-Control", "public, max-age=300");
---
```

**Tránh truy vấn dư thừa:** truy vấn một lần và truyền dữ liệu cho component:

```astro title="src/pages/index.astro"
---
import { getEmDashCollection } from "emdash";
import PostList from "../components/PostList.astro";
import Sidebar from "../components/Sidebar.astro";

const { entries: posts } = await getEmDashCollection("posts", { status: "published" });

const featured = posts.filter((p) => p.data.featured);
const recent = posts.slice(0, 5);
---

<PostList posts={featured} />
<Sidebar posts={recent} />
```

## Xem thêm

- [Chương 5 — Các khái niệm cốt lõi (bản đồ thuật ngữ)](./05-khai-niem-cot-loi.md)
- [Chương 12 — Phân loại nội dung (Taxonomies)](./12-phan-loai-taxonomies.md)
- [Chương 13 — Xem trước (Preview) trước khi xuất bản](./13-xem-truoc-preview.md)
- [Chương 16 — Đa ngôn ngữ cho nội dung](./16-da-ngon-ngu-i18n.md)
- [Chương 33 — Tổng quan công cụ cho dev: CLI, API, MCP](./33-tong-quan-cong-cu-dev.md)
- [Chương 35 — REST API tham chiếu](./35-rest-api.md)
