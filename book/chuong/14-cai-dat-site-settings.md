# 14. Cài đặt trang web (Site Settings)

Áp dụng cho vai trò: Quản trị viên/Vận hành, Lập trình viên

## Tổng quan

Site Settings là các giá trị cấu hình toàn cục cho site: tên, tagline, logo, liên kết mạng xã hội, và tuỳ chọn hiển thị. Admin quản lý các giá trị này qua giao diện quản trị, còn lập trình viên truy cập chúng trong template.

## Các trường Site Settings

```ts
interface SiteSettings {
	// Định danh
	title: string;
	tagline?: string;
	logo?: MediaReference;
	favicon?: MediaReference;

	// URL
	url?: string;

	// Hiển thị
	postsPerPage: number;
	dateFormat: string;
	timezone: string;

	// Mạng xã hội
	social?: {
		twitter?: string;
		github?: string;
		facebook?: string;
		instagram?: string;
		linkedin?: string;
		youtube?: string;
	};
}

interface MediaReference {
	mediaId: string;
	alt?: string;
	url?: string; // URL đã resolve (chỉ đọc)
}
```

## Quản lý qua Admin API

Lấy toàn bộ settings:

```http
GET /_emdash/api/settings
```

Kết quả trả về là một object JSON:

```json
{
	"title": "My EmDash Site",
	"tagline": "A modern CMS",
	"logo": {
		"mediaId": "med_123",
		"url": "/_emdash/api/media/file/abc123"
	},
	"postsPerPage": 10,
	"dateFormat": "MMMM d, yyyy",
	"timezone": "America/New_York",
	"social": {
		"twitter": "@handle",
		"github": "username"
	}
}
```

Cập nhật settings (hỗ trợ cập nhật một phần):

```http
POST /_emdash/api/settings
Content-Type: application/json

{
  "title": "New Site Title",
  "tagline": "Updated tagline"
}
```

Chỉ các field được cung cấp mới thay đổi — field bị bỏ qua giữ nguyên giá trị hiện tại.

### Tham chiếu Media (logo, favicon)

Field `logo` và `favicon` lưu tham chiếu media. Khi đọc, EmDash tự resolve `url`:

```ts
const logo = await getSiteSetting("logo");
// {
//   mediaId: "med_123",
//   alt: "Site logo",
//   url: "/_emdash/api/media/file/abc123"
// }
```

Khi cập nhật qua API, chỉ cần cung cấp `mediaId`:

```json
{
	"logo": {
		"mediaId": "med_456",
		"alt": "New logo"
	}
}
```

## Truy vấn Settings trong template (dành cho lập trình viên)

Dùng `getSiteSettings()` để lấy toàn bộ settings:

```astro title="src/layouts/Base.astro"
---
import { getSiteSettings } from "emdash";

const settings = await getSiteSettings();
---

<html lang="en">
  <head>
    <title>{settings.title}</title>
    {settings.favicon && (
      <link rel="icon" href={settings.favicon.url} />
    )}
  </head>
  <body>
    <header>
      {settings.logo ? (
        <img src={settings.logo.url} alt={settings.logo.alt || settings.title} />
      ) : (
        <span class="site-title">{settings.title}</span>
      )}
      {settings.tagline && <p class="tagline">{settings.tagline}</p>}
    </header>
    <slot />
  </body>
</html>
```

Dùng `getSiteSetting()` để lấy một giá trị đơn — hữu ích khi chỉ cần một hoặc hai giá trị, tránh lấy toàn bộ:

```ts
import { getSiteSetting } from "emdash";

const title = await getSiteSetting("title");
const logo = await getSiteSetting("logo");
```

### Ví dụ: Header có logo và menu chính

```astro title="src/components/Header.astro"
---
import { getSiteSettings, getMenu } from "emdash";

const settings = await getSiteSettings();
const menu = await getMenu("primary");
---

<header class="header">
  <a href="/" class="logo">
    {settings.logo ? (
      <img src={settings.logo.url} alt={settings.logo.alt || settings.title} width="150" height="50" />
    ) : (
      <span class="site-name">{settings.title}</span>
    )}
  </a>
  {menu && (
    <nav>
      {menu.items.map(item => (
        <a href={item.url}>{item.label}</a>
      ))}
    </nav>
  )}
</header>
```

### Ví dụ: Liên kết mạng xã hội

```astro title="src/components/SocialLinks.astro"
---
import { getSiteSetting } from "emdash";

const social = await getSiteSetting("social");

const platforms = [
  { key: "twitter", label: "Twitter", baseUrl: "https://twitter.com/" },
  { key: "github", label: "GitHub", baseUrl: "https://github.com/" },
  { key: "facebook", label: "Facebook", baseUrl: "https://facebook.com/" },
  { key: "instagram", label: "Instagram", baseUrl: "https://instagram.com/" },
  { key: "linkedin", label: "LinkedIn", baseUrl: "https://linkedin.com/in/" },
  { key: "youtube", label: "YouTube", baseUrl: "https://youtube.com/@" },
] as const;
---

{social && (
  <div class="social-links">
    {platforms.map(({ key, label, baseUrl }) => (
      social[key] && (
        <a href={baseUrl + social[key]} rel="noopener noreferrer" target="_blank" aria-label={label}>
          {label}
        </a>
      )
    ))}
  </div>
)}
```

### Ví dụ: Thẻ meta SEO

```astro title="src/components/SEO.astro"
---
import { getSiteSettings } from "emdash";

interface Props {
  title?: string;
  description?: string;
  image?: string;
}

const settings = await getSiteSettings();
const { title, description = settings.tagline, image } = Astro.props;

const documentTitle = title ? `${title} | ${settings.title}` : settings.title;
const ogTitle = title ?? settings.title;
---

<title>{documentTitle}</title>
{description && <meta name="description" content={description} />}

<meta property="og:title" content={ogTitle} />
{description && <meta property="og:description" content={description} />}
{image && <meta property="og:image" content={image} />}
{settings.url && <meta property="og:url" content={settings.url + Astro.url.pathname} />}

{settings.social?.twitter && (
  <meta name="twitter:site" content={settings.social.twitter} />
)}
<meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
```

### Định dạng ngày

Dùng `dateFormat` và `timezone` để hiển thị ngày nhất quán:

```astro title="src/components/PostDate.astro"
---
import { getSiteSetting } from "emdash";

interface Props {
  date: string;
}

const { date } = Astro.props;
const dateFormat = await getSiteSetting("dateFormat") || "MMMM d, yyyy";
const timezone = await getSiteSetting("timezone") || "UTC";

const formatted = new Intl.DateTimeFormat("en-US", {
  timeZone: timezone,
  dateStyle: "long",
}).format(new Date(date));
---

<time datetime={date}>{formatted}</time>
```

> Giá trị `dateFormat` dùng chuỗi mẫu (pattern string, vd `"MMMM d, yyyy"`) — có thể cần một thư viện như `date-fns` để phân tích và áp dụng các mẫu này.

## Tham chiếu API

| Hàm | Mô tả | Trả về |
| --- | --- | --- |
| `getSiteSettings()` | Lấy toàn bộ site settings kèm URL media đã resolve | `Promise<Partial<SiteSettings>>` |
| `getSiteSetting(key)` | Lấy một giá trị theo key, kiểu dữ liệu khớp với key yêu cầu | `Promise<SiteSettings[K] \| undefined>` |

## Xem thêm

- [Chương 9 — Thư viện Media](./09-thu-vien-media.md)
- [Chương 10 — Menu điều hướng](./10-menu-dieu-huong.md)
- [Chương 15 — Chế độ tối & tuỳ biến giao diện quản trị](./15-che-do-toi.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
