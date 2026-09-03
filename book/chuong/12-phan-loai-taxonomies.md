# 12. Phân loại nội dung (Taxonomies)

Áp dụng cho vai trò: Người biên tập nội dung (quản lý term), Quản trị viên/Vận hành (tạo taxonomy tuỳ chỉnh), Lập trình viên (truy vấn/render)

## Tổng quan

Taxonomy là hệ thống phân loại để tổ chức nội dung. EmDash có sẵn Category và Tag, và hỗ trợ tạo taxonomy tuỳ chỉnh cho nhu cầu phân loại chuyên biệt.

## Hai Taxonomy có sẵn

| Taxonomy | Kiểu | Mô tả |
| --- | --- | --- |
| **Categories** | Phân cấp (hierarchical) | Phân loại lồng nhau với quan hệ cha-con |
| **Tags** | Phẳng (flat) | Nhãn đơn giản, không phân cấp |

Cả hai đều khả dụng mặc định cho Collection `posts`.

## Quản lý Term

### Tạo Term

**Từ Admin Dashboard:**
1. Vào trang taxonomy (vd `/_emdash/admin/taxonomies/category`).
2. Nhập tên term vào form **Add New**.
3. Tuỳ chọn đặt thêm:
   - **Slug** — định danh URL (tự sinh từ tên).
   - **Parent** — cho taxonomy phân cấp.
   - **Description** — mô tả term.
4. Nhấn **Add**.

**Từ trình soạn thảo nội dung:**
1. Mở một entry trong trình soạn thảo.
2. Tìm panel taxonomy trong sidebar.
3. Với category: tick chọn term phù hợp, hoặc nhấn **+ Add New**.
4. Với tag: gõ tên tag, cách nhau bằng dấu phẩy.
5. Lưu nội dung.

**Từ API** (tạo term trong taxonomy `category`):

```bash
POST /_emdash/api/taxonomies/category/terms
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN

{
  "slug": "tutorials",
  "label": "Tutorials",
  "parentId": "term_abc",
  "description": "How-to guides and tutorials"
}
```

### Sửa Term

Vào trang term của taxonomy → nhấn **Edit** cạnh term → cập nhật tên/slug/parent/description → nhấn **Save**.

### Xoá Term

Vào trang term của taxonomy → nhấn **Delete** cạnh term → xác nhận.

> Xoá một term sẽ gỡ nó khỏi mọi nội dung đã gán — nội dung **không** bị xoá, chỉ gỡ liên kết term.

## Truy vấn Taxonomy (dành cho lập trình viên)

### Lấy tất cả term

```ts
import { getTaxonomyTerms } from "emdash";

// Lấy mọi category (trả về cấu trúc cây)
const categories = await getTaxonomyTerms("category");

// Lấy mọi tag (trả về danh sách phẳng)
const tags = await getTaxonomyTerms("tag");
```

Với taxonomy phân cấp, term có kèm mảng `children`:

```ts
interface TaxonomyTerm {
	id: string;
	name: string; // Tên taxonomy ("category")
	slug: string; // Slug term ("news")
	label: string; // Nhãn hiển thị ("News")
	parentId?: string;
	description?: string;
	children: TaxonomyTerm[];
	count?: number; // Số entry gán term này
}
```

Tính `count` phải tổng hợp mọi liên kết nội dung–term trong các Collection của taxonomy — đây là phần tốn kém nhất của lệnh gọi. Nếu chỉ cần label và slug, bỏ qua nó:

```ts
const tags = await getTaxonomyTerms("tag", { includeCounts: false });
```

### Lấy một term

```ts
import { getTerm } from "emdash";

const category = await getTerm("category", "news");
// Trả về TaxonomyTerm hoặc null
```

### Lấy term của một entry

```ts
import { getEntryTerms } from "emdash";

const categories = await getEntryTerms("posts", "post-123", "category");
const tags = await getEntryTerms("posts", "post-123", "tag");
```

### Lọc nội dung theo term

```ts
import { getEmDashCollection } from "emdash";

// Bài viết trong category "news"
const { entries: newsPosts } = await getEmDashCollection("posts", {
	status: "published",
	where: { category: "news" },
});

// Bài viết có tag "javascript"
const { entries: jsPosts } = await getEmDashCollection("posts", {
	status: "published",
	where: { tag: "javascript" },
});
```

Hoặc dùng hàm tiện ích:

```ts
import { getEntriesByTerm } from "emdash";

const newsPosts = await getEntriesByTerm("posts", "category", "news");
```

## Dựng trang Taxonomy

### Trang Category Archive

```astro title="src/pages/category/[slug].astro"
---
import { getTaxonomyTerms, getTerm, getEmDashCollection } from "emdash";
import Base from "../../layouts/Base.astro";

export async function getStaticPaths() {
  const categories = await getTaxonomyTerms("category");

  function flatten(terms) {
    return terms.flatMap((term) => [term, ...flatten(term.children)]);
  }

  return flatten(categories).map((cat) => ({
    params: { slug: cat.slug },
    props: { category: cat },
  }));
}

const { category } = Astro.props;

const { entries: posts } = await getEmDashCollection("posts", {
  status: "published",
  where: { category: category.slug },
});
---

<Base title={category.label}>
  <h1>{category.label}</h1>
  {category.description && <p>{category.description}</p>}
  <p>{category.count} posts</p>

  <ul>
    {posts.map((post) => (
      <li>
        <a href={`/blog/${post.data.slug}`}>{post.data.title}</a>
      </li>
    ))}
  </ul>
</Base>
```

### Trang Tag Archive

```astro title="src/pages/tag/[slug].astro"
---
import { getTaxonomyTerms, getEmDashCollection } from "emdash";
import Base from "../../layouts/Base.astro";

export async function getStaticPaths() {
  const tags = await getTaxonomyTerms("tag");

  return tags.map((tag) => ({
    params: { slug: tag.slug },
    props: { tag },
  }));
}

const { tag } = Astro.props;

const { entries: posts } = await getEmDashCollection("posts", {
  status: "published",
  where: { tag: tag.slug },
});
---

<Base title={`Posts tagged "${tag.label}"`}>
  <h1>#{tag.label}</h1>
  <ul>
    {posts.map((post) => (
      <li><a href={`/blog/${post.data.slug}`}>{post.data.title}</a></li>
    ))}
  </ul>
</Base>
```

### Widget danh sách Category và Tag Cloud

Component danh sách category (kèm số lượng bài viết) và tag cloud (cỡ chữ theo tần suất dùng) đều dựa trên `getTaxonomyTerms()` — xem mã nguồn ví dụ đầy đủ trong `docs/src/content/docs/guides/taxonomies.mdx` gốc, cùng cách hiển thị category/tag ngay trên trang bài viết bằng `getEntryTerms()`.

## Taxonomy tuỳ chỉnh (dành cho Quản trị viên/Vận hành, Lập trình viên)

Tạo taxonomy ngoài Category/Tag cho nhu cầu chuyên biệt, bằng admin API:

```bash
POST /_emdash/api/taxonomies
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN

{
  "name": "genre",
  "label": "Genres",
  "labelSingular": "Genre",
  "hierarchical": true,
  "collections": ["books", "movies"]
}
```

Truy vấn và hiển thị taxonomy tuỳ chỉnh giống hệt taxonomy có sẵn:

```ts
import { getTaxonomyTerms, getEmDashCollection } from "emdash";

const genres = await getTaxonomyTerms("genre");

const { entries: sciFiBooks } = await getEmDashCollection("books", {
	where: { genre: "science-fiction" },
});
```

Taxonomy chỉ định rõ áp dụng cho Collection nào qua mảng `collections`:

```ts
{
  "name": "difficulty",
  "label": "Difficulty Levels",
  "hierarchical": false,
  "collections": ["recipes", "tutorials"]
}
```

## Tham chiếu API

### REST Endpoint

| Endpoint | Method | Mô tả |
| --- | --- | --- |
| `/_emdash/api/taxonomies` | GET | Liệt kê định nghĩa taxonomy |
| `/_emdash/api/taxonomies` | POST | Tạo taxonomy |
| `/_emdash/api/taxonomies/:name/terms` | GET | Liệt kê term |
| `/_emdash/api/taxonomies/:name/terms` | POST | Tạo term |
| `/_emdash/api/taxonomies/:name/terms/:slug` | GET | Lấy term |
| `/_emdash/api/taxonomies/:name/terms/:slug` | PUT | Cập nhật term |
| `/_emdash/api/taxonomies/:name/terms/:slug` | DELETE | Xoá term |

Gán term cho nội dung:

```bash
POST /_emdash/api/content/posts/post-123/terms/category
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN

{
  "termIds": ["term_news", "term_featured"]
}
```

## Xem thêm

- [Chương 8 — Soạn thảo nội dung và Portable Text](./08-soan-thao-noi-dung.md)
- [Chương 10 — Menu điều hướng](./10-menu-dieu-huong.md)
- [Chương 17 — Xây dựng Loại nội dung (Content Types Builder)](./17-content-types-builder.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
- [Chương 35 — REST API tham chiếu](./35-rest-api.md)
