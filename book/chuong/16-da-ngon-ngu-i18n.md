# 16. Đa ngôn ngữ cho nội dung

Áp dụng cho vai trò: Quản trị viên/Vận hành (cấu hình), Người biên tập nội dung (quản lý bản dịch), Lập trình viên (truy vấn/render)

## Tổng quan

EmDash tích hợp với [hệ thống routing i18n có sẵn của Astro](https://docs.astro.build/en/guides/internationalization/) để quản lý nội dung đa ngôn ngữ. Astro xử lý định tuyến URL và phát hiện locale; EmDash xử lý việc lưu trữ và truy xuất nội dung đã dịch.

Mỗi bản dịch là một entry nội dung độc lập, đầy đủ — có slug, status, và lịch sử revision riêng. Phiên bản tiếng Pháp của một bài viết có thể đang ở draft trong khi phiên bản tiếng Anh đã published (chương này bổ sung phần cấu hình/kỹ thuật cho phần "Dịch nội dung" đã giới thiệu sơ lược ở [Chương 8](./08-soan-thao-noi-dung.md)).

## Cấu hình

Bật i18n bằng cách thêm khối `i18n` vào cấu hình Astro. EmDash đọc chính cấu hình này để lấy danh sách locale, locale mặc định, và chuỗi fallback:

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

export default defineConfig({
	i18n: {
		defaultLocale: "en",
		locales: ["en", "fr", "es"],
		fallback: { fr: "en", es: "en" },
	},
	integrations: [
		emdash({
			database: sqlite({ url: "file:./data.db" }),
			storage: local({
				directory: "./uploads",
				baseUrl: "/_emdash/api/media/file",
			}),
		}),
	],
});
```

Khi không có khối `i18n` trong cấu hình Astro, mọi tính năng i18n bị tắt và EmDash hoạt động như một CMS đơn ngôn ngữ.

> **Cảnh báo — không thêm tiền tố cho locale mặc định:** Bất kỳ chiến lược routing nào của Astro thêm tiền tố cho locale mặc định đều làm hỏng admin EmDash — bao gồm `routing: { prefixDefaultLocale: true }` và `routing: "prefix-always"`. Khi bật một trong hai, mọi route trang (kể cả route do integration chèn vào) đều cần tiền tố locale, khiến `/_emdash/admin` và mọi route con của nó trả về **404**. Biến thể có tiền tố locale (`/es/_emdash/admin/...`) cũng không hoạt động, vì router phía client của admin luôn mong đợi sống tại `/_emdash/admin`. Route API dưới `/_emdash/api/*` không bị ảnh hưởng — chỉ route trang được chèn (injected) với tham số spread mới bị hỏng. Đây là giới hạn từ phía Astro (xem issue #369 của EmDash).
>
> Dùng chiến lược routing mặc định của Astro (`prefix-other-locales`) thay thế — phục vụ locale mặc định không tiền tố và tương thích với admin:
>
> ```js title="astro.config.mjs"
> i18n: {
> 	defaultLocale: "en",
> 	locales: ["en", "fr", "es"],
> 	fallback: { fr: "en", es: "en" },
> 	// không có khối `routing` — mặc định (prefix-other-locales) đã tương thích
> },
> ```
>
> Nếu cần tiền tố cho locale mặc định trên trang công khai, xử lý bằng redirect/rewrite phía trước site (vd `/` → `/en/` ở edge) thay vì dùng `prefixDefaultLocale`.

## Cách bản dịch hoạt động (mô hình row-per-locale)

EmDash dùng mô hình **một dòng cho mỗi locale** (row-per-locale). Mỗi bản dịch là một dòng riêng trong database, có ID, slug, status riêng, liên kết với các bản dịch khác qua một định danh `translation_group` dùng chung. Bảng `posts` với 3 bản dịch trông như sau:

```
ec_posts:
id       | slug        | locale | translation_group | status
---------|-------------|--------|-------------------|----------
01ABC... | my-post     | en     | 01ABC...          | published
01DEF... | mon-article | fr     | 01ABC...          | draft
01GHI... | mi-entrada  | es     | 01ABC...          | published
```

Thiết kế này mang lại:

- **Slug theo từng locale** — `/blog/my-post` và `/fr/blog/mon-article` hoạt động tự nhiên.
- **Xuất bản theo từng locale** — publish phiên bản tiếng Anh trong khi giữ tiếng Pháp ở draft.
- **Revision theo từng locale** — mỗi bản dịch có lịch sử revision riêng.
- **Truy vấn đơn-locale** — truy vấn danh sách chỉ trả về entry của một locale.

## Truy vấn nội dung đã dịch (dành cho lập trình viên)

### Một entry

Truyền `locale` vào `getEmDashEntry` để lấy đúng bản dịch. Nếu bỏ qua, mặc định dùng locale hiện tại của request (do middleware i18n của Astro đặt):

```astro title="src/pages/[...slug].astro"
---
import { getEmDashEntry } from "emdash";

const { slug } = Astro.params;
const { entry: post, error } = await getEmDashEntry("posts", slug, {
  locale: Astro.currentLocale,
});

if (!post) return Astro.redirect("/404");
---

<article>
  <h1>{post.data.title}</h1>
</article>
```

### Chuỗi fallback

Khi không có nội dung cho locale yêu cầu, EmDash đi theo chuỗi fallback đã cấu hình trong Astro config. Với `fallback: { fr: "en" }`:

1. Thử locale được yêu cầu (`fr`).
2. Thử locale fallback (`en`).
3. Thử locale mặc định.

Fallback chỉ áp dụng cho truy vấn một entry đơn — truy vấn danh sách chỉ trả về entry của đúng locale yêu cầu.

> Khi có dùng fallback, metadata của response bao gồm `fallbackLocale` để template hiển thị thông báo "nội dung này chưa được dịch".

### Menu, Taxonomy, danh sách Collection theo locale

Menu là theo từng locale — cùng một `name` (vd `"primary"`) có thể tồn tại ở nhiều locale, liên kết qua `translation_group` dùng chung:

```astro title="src/components/PrimaryNav.astro"
---
import { getMenu } from "emdash";

const menu = await getMenu("primary", { locale: Astro.currentLocale });
---
```

Term của Taxonomy cũng theo từng locale (cả `label`/`labelSingular` có thể dịch được). Dịch một nội dung sẽ tự kế thừa các term đã gán của nguồn — chỉ cần dịch chính các **term** một lần, mọi bài viết dùng chúng sẽ tự khớp đúng locale khi đọc:

```astro
---
import { getTaxonomyTerms, getEntryTerms } from "emdash";

const categories = await getTaxonomyTerms("category", { locale: Astro.currentLocale });
const terms = await getEntryTerms("posts", post.id, undefined, { locale: Astro.currentLocale });
---
```

Lọc danh sách Collection theo locale:

```astro title="src/pages/posts.astro"
---
import { getEmDashCollection } from "emdash";

const { entries: posts } = await getEmDashCollection("posts", {
  locale: Astro.currentLocale,
  status: "published",
});
---
```

## Bộ chuyển ngôn ngữ (Language Switcher)

Dùng `getTranslations` để dựng bộ chuyển ngôn ngữ, liên kết tới các bản dịch có sẵn của entry hiện tại:

```astro title="src/components/LanguageSwitcher.astro"
---
import { getTranslations } from "emdash";
import { getRelativeLocaleUrl } from "astro:i18n";

interface Props {
  collection: string;
  entryId: string;
}

const { collection, entryId } = Astro.props;
const { translations } = await getTranslations(collection, entryId);
---

<nav aria-label="Language">
  <ul>
    {translations.map((t) => (
      <li>
        <a
          href={getRelativeLocaleUrl(t.locale, `/blog/${t.slug}`)}
          aria-current={t.locale === Astro.currentLocale ? "page" : undefined}
        >
          {t.locale.toUpperCase()}
        </a>
      </li>
    ))}
  </ul>
</nav>
```

`getTranslations` trả về mọi biến thể locale trong cùng nhóm dịch:

```ts
const { translationGroup, translations } = await getTranslations("posts", post.entry.id);
// translations: [
//   { locale: "en", id: "01ABC...", slug: "my-post", status: "published" },
//   { locale: "fr", id: "01DEF...", slug: "mon-article", status: "draft" },
// ]
```

> Dùng `getRelativeLocaleUrl` từ `astro:i18n` để dựng URL có tiền tố locale đúng — hàm này tôn trọng chiến lược routing của Astro (`prefix-other-locales` hoặc `prefix-always`).

## Quản lý bản dịch trong Admin (dành cho biên tập viên)

Khi bật i18n, danh sách nội dung hiển thị thêm **cột locale** và **bộ lọc locale** trên toolbar. Chi tiết luồng "Translate"/"Edit" trong panel Translations đã trình bày ở [Chương 8](./08-soan-thao-noi-dung.md) — khi tạo bản dịch, entry mới được điền sẵn dữ liệu từ locale nguồn và gán slug mặc định dạng `{source-slug}-{locale}`. Mỗi bản dịch có status riêng — publish, unpublish, hoặc lên lịch độc lập với nhau.

## Content API

Mọi route content API chấp nhận tham số query `locale` tuỳ chọn:

```http
GET /_emdash/api/content/posts?locale=fr
GET /_emdash/api/content/posts/my-post?locale=fr
```

Tạo bản dịch qua API bằng cách truyền `locale` và `translationOf`:

```http
POST /_emdash/api/content/posts
Content-Type: application/json

{
  "locale": "fr",
  "translationOf": "01ABC...",
  "data": {
    "title": "Mon Article",
    "slug": "mon-article"
  }
}
```

Entry mới dùng chung `translation_group` với entry nguồn và bắt đầu ở trạng thái draft.

Lấy danh sách bản dịch của một entry:

```http
GET /_emdash/api/content/posts/01ABC.../translations
```

## CLI

CLI hỗ trợ flag `--locale` trên các lệnh nội dung:

```bash
# Liệt kê bài viết tiếng Pháp
emdash content list posts --locale fr

# Lấy một entry cụ thể bằng tiếng Pháp
emdash content get posts my-post --locale fr

# Tạo bản dịch tiếng Pháp của entry có sẵn
emdash content create posts --locale fr --translation-of 01ABC...
```

## Seed nội dung đa ngôn ngữ

Seed file biểu diễn bản dịch bằng `locale` và `translationOf`:

```json title=".emdash/seed.json"
{
  "content": {
    "posts": [
      {
        "id": "welcome",
        "slug": "welcome",
        "locale": "en",
        "status": "published",
        "data": { "title": "Welcome" }
      },
      {
        "id": "welcome-fr",
        "slug": "bienvenue",
        "locale": "fr",
        "translationOf": "welcome",
        "status": "draft",
        "data": { "title": "Bienvenue" }
      }
    ]
  }
}
```

Entry ở locale nguồn phải xuất hiện **trước** bản dịch của nó trong seed file để `translationOf` phân giải đúng.

## Field có thể dịch (`translatable`)

Mỗi field có một tuỳ chọn `translatable` (mặc định: `true`). Khi tạo bản dịch:

- **Field có thể dịch** được điền sẵn từ locale nguồn để chỉnh sửa.
- **Field không thể dịch** được sao chép và giữ đồng bộ giữa mọi bản dịch trong nhóm.

Field hệ thống như `status`, `published_at`, `author_id` luôn theo từng locale riêng, không bao giờ đồng bộ.

> Field không thể dịch hữu ích cho các giá trị cần nhất quán giữa các locale, ví dụ mã SKU sản phẩm hoặc số thứ tự sắp xếp.

## Chiến lược URL

EmDash không tự quản lý URL locale — Astro xử lý routing. Các mẫu thường gặp:

```
# prefix-other-locales (mặc định của Astro)
/blog/my-post          → en (locale mặc định, không tiền tố)
/fr/blog/mon-article   → fr

# prefix-always
/en/blog/my-post       → en
/fr/blog/mon-article   → fr
```

Dùng `getRelativeLocaleUrl` từ `astro:i18n` để dựng URL đúng bất kể chế độ routing.

## Sitemap và hreflang (tóm tắt)

Sitemap theo từng Collection tại `/sitemap-{collection}.xml` nhận biết locale — mỗi bản dịch xuất hiện như một `<url>` riêng, kèm alternate `xhtml:link` chéo giữa các bản dịch anh em để công cụ tìm kiếm phục vụ đúng ngôn ngữ. Cùng nguyên tắc đó áp dụng cho thẻ `<link rel="alternate" hreflang="...">` trong `<head>` của mỗi trang nội dung (tự động nếu dùng `<EmDashHead>`, hoặc dựng thủ công bằng hàm `getHreflangAlternates`). Chi tiết đầy đủ về SEO/sitemap thuộc phạm vi tài liệu tham chiếu kỹ thuật (`reference/*.mdx` gốc), không lặp lại toàn bộ ở đây.

## Nhập nội dung đa ngôn ngữ

Nhập nội dung WordPress qua công cụ migration của admin (xem [Chương 23](./23-di-chuyen-tu-wordpress.md), [Chương 24](./24-nhap-noi-dung.md)). Bản xuất WXR không mang theo cấu trúc locale/translation-group mà plugin WPML hoặc Polylang thêm vào, nên nội dung nhập vào sẽ nằm ở locale mặc định. Để dựng bản dịch từ nội dung đã nhập, tạo entry dịch và liên kết với bản gốc bằng cùng luồng `--locale`/`--translation-of` đã trình bày ở phần Seed/CLI phía trên.

## Xem thêm

- [Chương 8 — Soạn thảo nội dung và Portable Text](./08-soan-thao-noi-dung.md)
- [Chương 12 — Phân loại nội dung (Taxonomies)](./12-phan-loai-taxonomies.md)
- [Chương 23 — Di chuyển từ WordPress](./23-di-chuyen-tu-wordpress.md)
- [Chương 24 — Nhập nội dung từ nguồn khác](./24-nhap-noi-dung.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
- [Chương 48 — Seed Files](./48-seed-files.md)
