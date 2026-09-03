# 11. Widget & Vùng Widget

Áp dụng cho vai trò: Quản trị viên/Vận hành (quản lý Widget Area trong admin), Lập trình viên (truy vấn/render widget trong template)

## Tổng quan

**Widget Area** là vùng được đặt tên trong template, nơi quản trị viên có thể đặt các khối nội dung (widget). Dùng cho sidebar, cột footer, banner quảng cáo, hoặc bất kỳ khu vực nào cần để editor kiểm soát mà không phải đụng vào code.

## Ba loại Widget

EmDash hỗ trợ 3 loại widget:

### Content Widget

Nội dung rich text lưu dưới dạng Portable Text. Render bằng component `PortableText`:

```astro
---
import { PortableText } from "emdash/ui";
---

{widget.type === "content" && widget.content && (
  <div class="widget-content">
    <PortableText value={widget.content} />
  </div>
)}
```

### Menu Widget

Hiển thị một menu điều hướng bên trong widget area:

```astro
---
import { getMenu } from "emdash";

const menu = widget.menuName ? await getMenu(widget.menuName) : null;
---

{widget.type === "menu" && menu && (
  <nav class="widget-nav">
    <ul>
      {menu.items.map(item => (
        <li><a href={item.url}>{item.label}</a></li>
      ))}
    </ul>
  </nav>
)}
```

### Component Widget

Render một component đã đăng ký với props có thể cấu hình. EmDash đi kèm sẵn các component lõi sau:

| ID Component | Mô tả | Props |
| --- | --- | --- |
| `core:recent-posts` | Danh sách bài viết gần đây | `count`, `showThumbnails`, `showDate` |
| `core:categories` | Danh sách category | `showCount`, `hierarchical` |
| `core:tags` | Đám mây tag (tag cloud) | `showCount`, `limit` |
| `core:search` | Form tìm kiếm | `placeholder` |
| `core:archives` | Lưu trữ theo tháng/năm | `type`, `limit` |

## Quản lý Widget Area trong Admin

Tạo Widget Area qua giao diện admin tại `/_emdash/admin/widgets`, hoặc bằng admin API:

```http
POST /_emdash/api/widget-areas
Content-Type: application/json

{
  "name": "footer-1",
  "label": "Footer Column 1",
  "description": "First column in the footer"
}
```

Thêm một content widget:

```http
POST /_emdash/api/widget-areas/footer-1/widgets
Content-Type: application/json

{
  "type": "content",
  "title": "About Us",
  "content": [
    {
      "_type": "block",
      "style": "normal",
      "children": [{ "_type": "span", "text": "Welcome to our site." }]
    }
  ]
}
```

Thêm một component widget:

```http
POST /_emdash/api/widget-areas/sidebar/widgets
Content-Type: application/json

{
  "type": "component",
  "title": "Recent Posts",
  "componentId": "core:recent-posts",
  "componentProps": { "count": 5, "showDate": true }
}
```

## Truy vấn và render Widget Area trong code (dành cho lập trình viên)

Dùng `getWidgetArea()` để lấy một widget area theo tên:

```astro title="src/layouts/Base.astro"
---
import { getWidgetArea } from "emdash";

const sidebar = await getWidgetArea("sidebar");
---

{sidebar && sidebar.widgets.length > 0 && (
  <aside class="sidebar">
    {sidebar.widgets.map(widget => (
      <div class="widget">
        {widget.title && <h3>{widget.title}</h3>}
        <!-- Render nội dung widget -->
      </div>
    ))}
  </aside>
)}
```

Hàm trả về `null` nếu widget area không tồn tại.

### Cấu trúc Widget Area

```ts
interface WidgetArea {
	id: string;
	name: string; // Định danh duy nhất ("sidebar", "footer-1")
	label: string; // Tên hiển thị ("Main Sidebar")
	description?: string;
	widgets: Widget[];
}

interface Widget {
	id: string;
	type: "content" | "menu" | "component";
	title?: string;
	content?: PortableTextBlock[]; // Cho content widget
	menuName?: string; // Cho menu widget
	componentId?: string; // Cho component widget
	componentProps?: Record<string, unknown>;
}
```

### Component render widget dùng chung

```astro title="src/components/WidgetRenderer.astro"
---
import { PortableText } from "emdash/ui";
import { getMenu } from "emdash";
import type { Widget } from "emdash";

import RecentPosts from "./widgets/RecentPosts.astro";
import Categories from "./widgets/Categories.astro";
import TagCloud from "./widgets/TagCloud.astro";
import SearchForm from "./widgets/SearchForm.astro";
import Archives from "./widgets/Archives.astro";

interface Props {
  widget: Widget;
}

const { widget } = Astro.props;

const componentMap: Record<string, any> = {
  "core:recent-posts": RecentPosts,
  "core:categories": Categories,
  "core:tags": TagCloud,
  "core:search": SearchForm,
  "core:archives": Archives,
};

const menu = widget.type === "menu" && widget.menuName
  ? await getMenu(widget.menuName)
  : null;
---

<div class="widget">
  {widget.title && <h3 class="widget-title">{widget.title}</h3>}

  {widget.type === "content" && widget.content && (
    <div class="widget-content">
      <PortableText value={widget.content} />
    </div>
  )}

  {widget.type === "menu" && menu && (
    <nav class="widget-menu">
      <ul>
        {menu.items.map(item => (
          <li><a href={item.url}>{item.label}</a></li>
        ))}
      </ul>
    </nav>
  )}

  {widget.type === "component" && widget.componentId && componentMap[widget.componentId] && (
    <Fragment>
      {(() => {
        const Component = componentMap[widget.componentId!];
        return <Component {...widget.componentProps} />;
      })()}
    </Fragment>
  )}
</div>
```

### Ví dụ component: Recent Posts

```astro title="src/components/widgets/RecentPosts.astro"
---
import { getEmDashCollection } from "emdash";
import { Image } from "emdash/ui";

interface Props {
  count?: number;
  showThumbnails?: boolean;
  showDate?: boolean;
}

const { count = 5, showThumbnails = false, showDate = true } = Astro.props;

const { entries: posts } = await getEmDashCollection("posts", {
  limit: count,
  orderBy: { publishedAt: "desc" },
});
---

<ul class="recent-posts">
  {posts.map(post => (
    <li>
      {showThumbnails && post.data.featured_image && (
        <Image image={post.data.featured_image} alt="" class="thumbnail" />
      )}
      <a href={`/posts/${post.data.slug}`}>{post.data.title}</a>
      {showDate && post.data.publishedAt && (
        <time datetime={post.data.publishedAt.toISOString()}>
          {post.data.publishedAt.toLocaleDateString()}
        </time>
      )}
    </li>
  ))}
</ul>
```

### Dùng Widget Area trong Layout

```astro title="src/layouts/BlogPost.astro"
---
import { getWidgetArea } from "emdash";
import WidgetRenderer from "../components/WidgetRenderer.astro";

const sidebar = await getWidgetArea("sidebar");
---

<div class="layout">
  <main class="content">
    <slot />
  </main>

  {sidebar && sidebar.widgets.length > 0 && (
    <aside class="sidebar">
      {sidebar.widgets.map(widget => (
        <WidgetRenderer widget={widget} />
      ))}
    </aside>
  )}
</div>
```

### Liệt kê mọi Widget Area

```ts
import { getWidgetAreas } from "emdash";

const areas = await getWidgetAreas();
// Trả về mọi widget area kèm widget đã điền sẵn
```

## Tham chiếu API

| Hàm | Mô tả | Trả về |
| --- | --- | --- |
| `getWidgetArea(name)` | Lấy một widget area theo tên, gồm mọi widget | `Promise<WidgetArea \| null>` |
| `getWidgetAreas()` | Liệt kê mọi widget area kèm widget | `Promise<WidgetArea[]>` |
| `getWidgetComponents()` | Liệt kê định nghĩa component widget khả dụng cho admin UI | `WidgetComponentDef[]` |

## Xem thêm

- [Chương 10 — Menu điều hướng](./10-menu-dieu-huong.md)
- [Chương 6 — Làm quen giao diện quản trị (Admin Panel)](./06-lam-quen-admin-panel.md)
- [Chương 20 — Cài đặt & Quản lý Plugin (người dùng cuối)](./20-cai-dat-plugin.md)
- [Chương 41 — Giao diện Plugin: Block Kit, Field Kit, Settings](./41-block-kit-field-kit.md)
