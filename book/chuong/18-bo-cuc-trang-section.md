# 18. Bố cục trang & Section

Áp dụng cho vai trò: Lập trình viên (dựng layout), Người biên tập nội dung (dùng Section trong soạn thảo)

## Tổng quan

Chương này gộp hai tính năng liên quan tới cách tổ chức bố cục và nội dung tái sử dụng: **Page Layouts** (cho phép editor chọn layout khác nhau cho từng trang) và **Section** (khối nội dung tái sử dụng chèn qua slash command).

## Phần 1 — Bố cục trang (Page Layouts)

Cho phép editor chọn layout theo từng trang (vd Default, Full Width, Landing Page) từ dropdown trong trình soạn thảo, bằng cách dùng một field kiểu `select` ánh xạ tới các component layout trong route trang.

### Cách hoạt động

1. Thêm field `select` tên `template` vào Collection pages.
2. Tạo component layout cho mỗi lựa chọn.
3. Ánh xạ giá trị field vào layout tương ứng trong route trang.

Đây là sự kết hợp giữa field `select` của EmDash và mô hình component của Astro.

### Bước 1 — Thêm field

Trong admin UI, thêm field select vào Collection pages với slug `template` và các lựa chọn layout (vd "Default", "Full Width"). Hoặc khai báo trong seed data:

```json title=".emdash/seed.json"
{
  "slug": "template",
  "label": "Template",
  "type": "select",
  "validation": {
    "options": ["Default", "Full Width"]
  },
  "defaultValue": "Default"
}
```

### Bước 2 — Tạo component layout

Mỗi layout bọc nội dung trong layout gốc với style khác nhau:

```astro title="src/layouts/PageDefault.astro"
---
import type { ContentEntry } from "emdash";
import { PortableText } from "emdash/ui";
import Base from "./Base.astro";

interface Props {
  page: ContentEntry<any>;
}

const { page } = Astro.props;
---

<Base title={page.data.title}>
  <article class="page-default">
    <h1>{page.data.title}</h1>
    <PortableText value={page.data.content} />
  </article>
</Base>

<style>
  .page-default {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 2rem 1rem;
  }
</style>
```

```astro title="src/layouts/PageFullWidth.astro"
---
import type { ContentEntry } from "emdash";
import { PortableText } from "emdash/ui";
import Base from "./Base.astro";

interface Props {
  page: ContentEntry<any>;
}

const { page } = Astro.props;
---

<Base title={page.data.title}>
  <article class="page-wide">
    <h1>{page.data.title}</h1>
    <PortableText value={page.data.content} />
  </article>
</Base>

<style>
  .page-wide {
    max-width: var(--wide-width);
    margin: 0 auto;
    padding: 2rem 1rem;
  }
</style>
```

### Bước 3 — Nối dây route

Trong route trang, import từng layout và ánh xạ theo giá trị `template`:

```astro title="src/pages/pages/[slug].astro"
---
import { getEmDashEntry } from "emdash";
import PageDefault from "../../layouts/PageDefault.astro";
import PageFullWidth from "../../layouts/PageFullWidth.astro";

const { slug } = Astro.params;

if (!slug) {
  return Astro.redirect("/404");
}

const { entry: page } = await getEmDashEntry("pages", slug);

if (!page) {
  return Astro.redirect("/404");
}

const layouts = {
  "Default": PageDefault,
  "Full Width": PageFullWidth,
};

const Layout = layouts[page.data.template as keyof typeof layouts] ?? PageDefault;
---

<Layout page={page} />
```

Route luôn gọn nhẹ — mỗi component layout tự chịu trách nhiệm về markup và style của nó. Thêm một layout mới chỉ cần: tạo component, thêm lựa chọn vào field select, thêm một dòng vào bản đồ (map).

> Dùng tên lựa chọn dễ đọc như "Full Width" thay vì dạng slug "full-width" — giá trị này vừa là giá trị lưu trữ vừa là nhãn hiển thị trên dropdown admin.

### Các layout thường gặp

- **Default** — cột nội dung hẹp, phù hợp để đọc.
- **Full Width** — vùng nội dung rộng hơn, không sidebar.
- **Landing Page** — không header/footer, có các section hero.
- **Sidebar** — nội dung kèm widget area sidebar.

Mỗi layout chỉ đơn giản là một component Astro khác trong `src/layouts/` và một mục khác trong bản đồ layout của route.

## Phần 2 — Section (khối nội dung tái sử dụng)

Section là khối nội dung tái sử dụng mà editor có thể chèn vào bất kỳ nội dung nào qua slash command. Dùng cho các mẫu thường gặp như CTA, testimonial, feature grid, hoặc bất kỳ nội dung nào xuất hiện lặp lại trên nhiều trang (đã nhắc sơ ở [Chương 8](./08-soan-thao-noi-dung.md), mục lệnh `/section`).

### Cấu trúc Section

```ts
interface Section {
  id: string;
  slug: string;
  title: string;
  description?: string;
  keywords: string[];
  content: PortableTextBlock[];
  previewUrl?: string;
  source: "theme" | "user" | "import";
  themeId?: string;
  createdAt: string;
  updatedAt: string;
}
```

| Nguồn (`source`) | Mô tả |
| --- | --- |
| `theme` | Định nghĩa trong seed file, do theme quản lý |
| `user` | Do editor tạo trong admin |
| `import` | Nhập từ WordPress (reusable block) |

### Dùng Section trong nội dung (dành cho biên tập viên)

1. Gõ `/section` (hoặc `/pattern`, `/block`, `/template`).
2. Tìm hoặc duyệt qua các section có sẵn.
3. Nhấn để chèn nội dung của section vào vị trí con trỏ.

Nội dung Portable Text của section được **sao chép** vào tài liệu — nội dung chèn vào tự chứa (self-contained): editor có thể tuỳ chỉnh, và thay đổi sau này trên section gốc **không** ảnh hưởng tới các bản đã chèn.

> Với nội dung cần giữ đồng bộ (thay đổi ở một nơi, cập nhật khắp mọi nơi), cân nhắc dùng [Widget Area](./11-widget-va-vung-widget.md) với component widget thay vì Section.

### Tạo Section

**Trong Admin UI:**
1. Vào **Sections** trong sidebar admin.
2. Nhấn **New Section**.
3. Điền: **Title** (tên hiển thị), **Slug** (định danh URL, tự sinh từ title), **Description** (hướng dẫn cho editor).
4. Thêm nội dung bằng trình soạn thảo rich text.
5. Tuỳ chọn đặt từ khoá (keywords) để dễ tìm.

**Qua Seed File:**

```json title=".emdash/seed.json"
{
  "sections": [
    {
      "slug": "hero-centered",
      "title": "Centered Hero",
      "description": "Full-width hero with centered heading and CTA",
      "keywords": ["hero", "banner", "header"],
      "content": [
        {
          "_type": "block",
          "style": "h1",
          "children": [{ "_type": "span", "text": "Welcome to Our Site" }]
        },
        {
          "_type": "block",
          "children": [{ "_type": "span", "text": "Your tagline goes here." }]
        }
      ]
    },
    {
      "slug": "newsletter-cta",
      "title": "Newsletter CTA",
      "keywords": ["newsletter", "subscribe", "email"],
      "content": [
        {
          "_type": "block",
          "style": "h3",
          "children": [{ "_type": "span", "text": "Subscribe to our newsletter" }]
        }
      ]
    }
  ]
}
```

**Qua nhập WordPress:** Reusable block của WordPress (post type `wp_block`) tự động được nhập thành Section — `source` được đặt là `"import"`, nội dung Gutenberg chuyển đổi sang Portable Text.

### Truy vấn Section (dành cho lập trình viên)

```ts
import { getSection } from "emdash";

const cta = await getSection("newsletter-cta");

if (cta) {
  console.log(cta.title);
  console.log(cta.content); // PortableTextBlock[]
}
```

```ts
import { getSections } from "emdash";

const { items: all } = await getSections();
const { items: themeSections } = await getSections({ source: "theme" });
const { items: results } = await getSections({ search: "newsletter" });
```

`getSections` trả về `{ items: Section[], nextCursor?: string }` theo mẫu phân trang chuẩn.

### Render Section trong code

```astro
---
import { getSection } from "emdash";
import { PortableText } from "emdash/ui";

const newsletter = await getSection("newsletter-cta");
---

{newsletter && (
  <aside class="cta-box">
    <PortableText value={newsletter.content} />
  </aside>
)}
```

### Tính năng Admin UI

Thư viện Section (`/_emdash/admin/sections`) cung cấp: xem dạng lưới kèm preview, tìm theo tiêu đề/từ khoá, lọc theo nguồn, sao chép nhanh slug, sửa nội dung/metadata, xoá kèm xác nhận (cảnh báo riêng với section thuộc `theme`).

### Tham chiếu API

| Hàm/Endpoint | Mô tả |
| --- | --- |
| `getSection(slug)` | Lấy một section theo slug → `Promise<Section \| null>` |
| `getSections(options?)` | Liệt kê section, lọc theo `source`/`search`/`limit`/`cursor` → `Promise<{ items, nextCursor? }>` |
| `GET /_emdash/api/sections` | Liệt kê section (hỗ trợ `?source=`, `?search=`) |
| `GET /_emdash/api/sections/:slug` | Lấy một section |
| `POST /_emdash/api/sections` | Tạo section |
| `PUT /_emdash/api/sections/:slug` | Cập nhật section |
| `DELETE /_emdash/api/sections/:slug` | Xoá section |

## Xem thêm

- [Chương 8 — Soạn thảo nội dung và Portable Text](./08-soan-thao-noi-dung.md)
- [Chương 11 — Widget & Vùng Widget](./11-widget-va-vung-widget.md)
- [Chương 17 — Xây dựng Loại nội dung (Content Types Builder)](./17-content-types-builder.md)
- [Chương 24 — Nhập nội dung từ nguồn khác](./24-nhap-noi-dung.md)
- [Chương 47 — Xây dựng Theme từ đầu](./47-xay-dung-theme.md)
- [Chương 48 — Seed Files](./48-seed-files.md)
