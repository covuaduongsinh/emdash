# 10. Menu điều hướng

Áp dụng cho vai trò: Quản trị viên/Vận hành (quản lý menu trong admin), Lập trình viên (truy vấn/render menu trong template)

## Tổng quan

Menu trong EmDash là danh sách liên kết có thứ tự, được quản lý qua giao diện admin. Menu hỗ trợ lồng nhau (nesting) để tạo dropdown, và có thể liên kết tới page, post, taxonomy term, hoặc URL bên ngoài.

## Quản lý Menu trong Admin

Tạo menu qua giao diện admin tại `/_emdash/admin/menus`, hoặc bằng admin API (xem bên dưới). Admin panel hỗ trợ sắp xếp kéo-thả và tạo mục lồng nhau (đã giới thiệu ở [Chương 1](./01-emdash-la-gi.md) và [Chương 4](./04-so-sanh-wordpress-astro.md), tương tự `wp_nav_menu()` của WordPress).

### 5 loại mục menu (Menu Item Types)

| Loại | Mô tả | Cách xác định URL |
| --- | --- | --- |
| `page` | Liên kết tới một page | `/{collection}/{slug}` |
| `post` | Liên kết tới một post | `/{collection}/{slug}` |
| `taxonomy` | Liên kết tới category hoặc tag | `/{taxonomy}/{slug}` |
| `collection` | Liên kết tới trang archive của Collection | `/{collection}/` |
| `custom` | URL bên ngoài hoặc tuỳ chỉnh | Dùng nguyên văn |

## Quản lý Menu qua API (dành cho Quản trị viên/Vận hành nâng cao)

Tạo menu:

```http
POST /_emdash/api/menus
Content-Type: application/json

{
  "name": "footer",
  "label": "Footer Navigation"
}
```

Thêm mục vào menu (liên kết nội bộ):

```http
POST /_emdash/api/menus/footer/items
Content-Type: application/json

{
  "type": "page",
  "referenceCollection": "pages",
  "referenceId": "page_privacy",
  "label": "Privacy Policy"
}
```

Thêm liên kết ngoài tuỳ chỉnh:

```http
POST /_emdash/api/menus/footer/items
Content-Type: application/json

{
  "type": "custom",
  "customUrl": "https://github.com/example",
  "label": "GitHub",
  "target": "_blank"
}
```

Sắp xếp lại thứ tự và quan hệ cha-con:

```http
POST /_emdash/api/menus/primary/reorder
Content-Type: application/json

{
  "items": [
    { "id": "item_1", "parentId": null, "sortOrder": 0 },
    { "id": "item_2", "parentId": null, "sortOrder": 1 },
    { "id": "item_3", "parentId": "item_2", "sortOrder": 0 }
  ]
}
```

Ví dụ trên biến `item_3` thành con của `item_2`, tạo ra một dropdown.

## Truy vấn và render Menu trong code (dành cho lập trình viên)

Dùng `getMenu()` để lấy một menu theo tên duy nhất:

```astro title="src/layouts/Base.astro"
---
import { getMenu } from "emdash";

const primaryMenu = await getMenu("primary");
---

{primaryMenu && (
  <nav>
    <ul>
      {primaryMenu.items.map(item => (
        <li>
          <a href={item.url}>{item.label}</a>
        </li>
      ))}
    </ul>
  </nav>
)}
```

Hàm trả về `null` nếu không có menu nào tên đó.

### Cấu trúc Menu

```ts
interface Menu {
	id: string;
	name: string; // Định danh duy nhất ("primary", "footer")
	label: string; // Tên hiển thị ("Primary Navigation")
	items: MenuItem[];
}

interface MenuItem {
	id: string;
	label: string;
	url: string; // URL đã được resolve
	target?: string; // "_blank" để mở tab mới
	titleAttr?: string; // Thuộc tính title HTML
	cssClasses?: string; // Class CSS tuỳ chỉnh
	children: MenuItem[]; // Mục con cho dropdown
}
```

### Render menu lồng nhau

Xử lý mục con bằng cách render đệ quy mảng `children`:

```astro title="src/components/Navigation.astro"
---
import { getMenu } from "emdash";
import type { MenuItem } from "emdash";

interface Props {
  name: string;
}

const menu = await getMenu(Astro.props.name);
---

{menu && (
  <nav class="nav">
    <ul class="nav-list">
      {menu.items.map(item => (
        <li class:list={["nav-item", item.cssClasses]}>
          <a
            href={item.url}
            target={item.target}
            title={item.titleAttr}
            aria-current={Astro.url.pathname === item.url ? "page" : undefined}
          >
            {item.label}
          </a>
          {item.children.length > 0 && (
            <ul class="submenu">
              {item.children.map(child => (
                <li>
                  <a href={child.url} target={child.target}>
                    {child.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  </nav>
)}
```

> Dùng `aria-current="page"` để đánh dấu trang hiện tại trong điều hướng — trình đọc màn hình sẽ thông báo điều này, và selector CSS `[aria-current="page"]` cho phép tạo style riêng cho liên kết đang active.

### Liệt kê mọi Menu

```ts
import { getMenus } from "emdash";

const menus = await getMenus();
// Trả về: [{ id, name, label, locale }, ...]
```

Chủ yếu hữu ích cho giao diện admin hoặc debug.

## Ví dụ đầy đủ: header responsive

```astro title="src/layouts/Base.astro"
---
import { getMenu, getSiteSettings } from "emdash";

const settings = await getSiteSettings();
const primaryMenu = await getMenu("primary");
---

<html lang="en">
  <head>
    <title>{settings.title}</title>
  </head>
  <body>
    <header class="header">
      <a href="/" class="logo">
        {settings.logo ? (
          <img src={settings.logo.url} alt={settings.logo.alt || settings.title} />
        ) : (
          settings.title
        )}
      </a>

      {primaryMenu && (
        <nav class="main-nav" aria-label="Main navigation">
          <ul>
            {primaryMenu.items.map(item => (
              <li class:list={[item.cssClasses, { "has-children": item.children.length > 0 }]}>
                <a
                  href={item.url}
                  target={item.target}
                  aria-current={Astro.url.pathname === item.url ? "page" : undefined}
                >
                  {item.label}
                </a>
                {item.children.length > 0 && (
                  <ul class="dropdown">
                    {item.children.map(child => (
                      <li>
                        <a href={child.url} target={child.target}>{child.label}</a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>

    <main>
      <slot />
    </main>
  </body>
</html>
```

## Tham chiếu API

| Hàm | Mô tả | Trả về |
| --- | --- | --- |
| `getMenu(name)` | Lấy một menu theo tên, gồm mọi item và URL đã resolve | `Promise<Menu \| null>` |
| `getMenus()` | Liệt kê mọi định nghĩa menu (không kèm item) | `Promise<Array<{ id, name, label, locale }>>` |

## Xem thêm

- [Chương 6 — Làm quen giao diện quản trị (Admin Panel)](./06-lam-quen-admin-panel.md)
- [Chương 11 — Widget & Vùng Widget](./11-widget-va-vung-widget.md)
- [Chương 14 — Cài đặt trang web (Site Settings)](./14-cai-dat-site-settings.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
- [Chương 35 — REST API tham chiếu](./35-rest-api.md)
