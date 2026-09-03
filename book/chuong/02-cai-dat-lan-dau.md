# 2. Cài đặt lần đầu và Trình cài đặt (Setup Wizard)

Áp dụng cho vai trò: Mọi vai trò (đặc biệt hữu ích cho người mới bắt đầu — solo developer, agency developer)

## Tổng quan

Chương này hướng dẫn tạo một site EmDash đầu tiên, từ cài đặt đến xuất bản bài viết đầu tiên — theo đúng quy trình "dưới 5 phút" của tài liệu gốc.

### Yêu cầu trước khi bắt đầu

- **Node.js** phiên bản v22.16.0 trở lên (lưu ý: các phiên bản có số lẻ — odd-numbered versions — không được hỗ trợ).
- **npm**, **pnpm**, hoặc **yarn**.
- Một trình soạn thảo code (khuyến nghị VS Code).

## Các bước thực hiện

### Bước 1 — Tạo dự án mới

Chọn một trong ba trình quản lý gói:

```bash
# npm
npm create emdash@latest

# pnpm
pnpm create emdash@latest

# yarn
yarn create emdash
```

Làm theo các câu hỏi trên terminal để đặt tên dự án và thiết lập tuỳ chọn.

> **Lưu ý quan trọng:** EmDash phụ thuộc vào Dynamic Workers của Cloudflare để chạy plugin sandbox một cách an toàn. Dynamic Workers hiện chỉ khả dụng trên tài khoản Cloudflare trả phí (từ $5/tháng). Nếu chưa nâng cấp tài khoản, bạn có thể bỏ comment (comment out) khối `worker_loaders` trong file `wrangler.jsonc` để tắt tính năng plugin.

Ngoài ra, bạn có thể triển khai thẳng lên tài khoản Cloudflare của mình bằng nút "Deploy to Cloudflare" trong README của dự án (dựa trên template `blog-cloudflare`).

### Bước 2 — Khởi động máy chủ phát triển

```bash
cd my-emdash-site
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:4321`.

### Bước 3 — Hoàn tất Trình cài đặt (Setup Wizard)

Khi truy cập admin panel lần đầu, EmDash sẽ dẫn bạn qua một trình cài đặt (Setup Wizard) để cấu hình ban đầu:

1. Truy cập `http://localhost:4321/_emdash/admin`.
2. Bạn sẽ được chuyển hướng tới Setup Wizard. Nhập:
   - **Site Title** — Tên site.
   - **Tagline** — Mô tả ngắn.
   - **Admin Email** — Địa chỉ email của bạn.
3. Nhấn **Create Site** để đăng ký Passkey.
4. Trình duyệt sẽ yêu cầu bạn tạo Passkey bằng Touch ID, Face ID, Windows Hello, hoặc khoá bảo mật (security key).

Sau khi Passkey được đăng ký, bạn tự động đăng nhập và được chuyển tới admin dashboard.

> EmDash dùng xác thực bằng Passkey thay vì mật khẩu. Passkey an toàn hơn và hoạt động với trình quản lý mật khẩu tích hợp sẵn của trình duyệt. Xem thêm ở [Chương 7 — Đăng nhập không mật khẩu bằng Passkey](./07-dang-nhap-passkey.md).

### Bước 4 — Đăng bài viết đầu tiên

1. Trong sidebar admin, nhấn **Posts** dưới mục Content.
2. Nhấn **New Post**.
3. Nhập tiêu đề và viết nội dung bằng trình soạn thảo rich text.
4. Đặt trạng thái (status) thành **Published** và nhấn **Save**.
5. Truy cập trang chủ của site — bài viết xuất hiện ngay lập tức.

> EmDash dùng Live Content Collections, nên nội dung được phục vụ tại runtime và mọi chỉnh sửa hiển thị ngay lập tức, không cần build lại.

## Cấu trúc dự án

Dự án EmDash theo cấu trúc Astro tiêu chuẩn, cộng thêm một vài phần riêng:

```
my-emdash-site/
├── astro.config.mjs      # Cấu hình Astro + EmDash
├── src/
│   ├── live.config.ts    # Cấu hình Live Collections
│   ├── pages/
│   │   ├── index.astro   # Trang chủ
│   │   └── posts/
│   │       └── [...slug].astro  # Trang bài viết động
│   ├── layouts/
│   │   └── Base.astro    # Layout gốc
│   └── components/       # Component Astro của bạn
├── .emdash/
│   ├── seed.json         # Seed file mẫu ban đầu (từ template)
│   └── types.ts          # TypeScript type được sinh tự động
└── package.json
```

### File cấu hình `astro.config.mjs`

Đoạn cấu hình sau đăng ký EmDash như một Astro integration, dùng SQLite cục bộ và lưu trữ tệp cục bộ:

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

export default defineConfig({
	integrations: [
		react(), // Bắt buộc — admin UI là một ứng dụng React
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

### File `src/live.config.ts`

File này kết nối EmDash với hệ thống content của Astro thông qua một live collection duy nhất:

```ts title="src/live.config.ts"
import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";

export const collections = {
	_emdash: defineLiveCollection({ loader: emdashLoader() }),
};
```

> EmDash dùng một collection duy nhất tên `_emdash`, bên trong tự định tuyến tới các loại nội dung của bạn (posts, pages, products...). Nhờ vậy `live.config.ts` luôn gọn nhẹ.

### Biến môi trường

Khi chuẩn bị lên production, hãy sinh một khoá mã hoá (encryption key) cho secret của plugin:

```bash
npx emdash secrets generate
```

Thêm giá trị sinh ra vào biến môi trường `EMDASH_ENCRYPTION_KEY`:

```bash
EMDASH_ENCRYPTION_KEY=emdash_enc_v1_...
```

Khoá này mã hoá secret của plugin khi lưu trữ (encrypt at rest) và **không bao giờ** được lưu trong database — chỉ có bản mã hoá (ciphertext) được lưu. Hãy sao lưu khoá này ở nơi an toàn, bền vững — mất khoá đồng nghĩa mất mọi secret đã mã hoá bằng nó (xem thêm [Chương 28 — Bí mật cấu hình & biến môi trường](./28-bi-mat-cau-hinh.md)).

Secret HMAC cho preview và salt băm IP người bình luận được tự sinh và lưu trong database khi dùng lần đầu — bạn không cần tự đặt, trừ khi có một tiến trình khác cần xác minh cùng token với site chính:

```bash
EMDASH_PREVIEW_SECRET=your-preview-secret
```

## Truy vấn nội dung trong trang

Dùng các hàm truy vấn của EmDash trong trang Astro. Các hàm này theo đúng mẫu Live Collections của Astro, trả về `{ entries, error }` cho collection hoặc `{ entry, error }` cho một entry đơn:

```astro title="src/pages/index.astro"
---
import { getEmDashCollection } from "emdash";
import Base from "../layouts/Base.astro";

const { entries: posts } = await getEmDashCollection("posts");
---

<Base title="Home">
  <h1>Latest Posts</h1>
  <ul>
    {posts.map((post) => (
      <li>
        <a href={`/posts/${post.slug}`}>{post.data.title}</a>
      </li>
    ))}
  </ul>
</Base>
```

Lấy một entry theo slug:

```astro title="src/pages/posts/[slug].astro"
---
import { getEmDashEntry } from "emdash";

const { slug } = Astro.params;
const { entry: post } = await getEmDashEntry("posts", slug);

if (!post) {
  return Astro.redirect("/404");
}
---

<h1>{post.data.title}</h1>
```

(Xem chi tiết đầy đủ hơn ở [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md).)

## Sinh TypeScript types

Để có type safety đầy đủ, sinh type từ schema cơ sở dữ liệu:

```bash
npx emdash types
```

Lệnh này tạo `.emdash/types.ts` chứa interface cho mọi collection. Editor của bạn sẽ tự động gợi ý tên field và bắt lỗi kiểu dữ liệu.

## Ba template khởi đầu có sẵn

Ngoài cách tạo dự án trắng bằng `npm create emdash@latest`, dự án EmDash (bản thân repo nguồn) còn cung cấp 3 template mẫu sẵn để bạn tham khảo hoặc dùng làm điểm khởi đầu — mỗi template kèm một seed file với nội dung demo:

| Template | Mô tả | Trang có sẵn |
|---|---|---|
| **Blog** | Blog tối giản với bài viết, trang, category, tag, tìm kiếm, RSS | Trang chủ, danh sách bài viết, bài viết đơn, trang đơn, danh mục, thẻ, kết quả tìm kiếm, 404 |
| **Marketing** | Trang landing page cho sản phẩm/dịch vụ với các khối nội dung module | Trang chủ, giá (pricing), liên hệ, 404 |
| **Portfolio** | Portfolio giới thiệu sản phẩm sáng tạo, có lọc theo tag | Trang chủ, danh sách dự án, dự án đơn, giới thiệu, liên hệ, 404 |

Mỗi template có 2 biến thể:

- **Node.js** (`templates/blog`, `templates/marketing`, `templates/portfolio`) — dùng SQLite và lưu trữ tệp cục bộ.
- **Cloudflare** (`templates/blog-cloudflare`, v.v.) — dùng D1 và R2.

Khởi động nhanh với một template:

```bash
# Sao chép template muốn dùng
cp -r templates/blog my-site
cd my-site

# Cài dependency
pnpm install

# Khởi tạo database và seed nội dung demo
pnpm bootstrap

# Chạy dev server
pnpm dev
```

Mở `http://localhost:4321` để xem site, và `http://localhost:4321/_emdash/admin` để vào CMS.

## Lưu ý

- Con số "dưới 5 phút" trong tài liệu gốc là ước lượng cho luồng tạo site mới bằng `npm create emdash@latest` tới khi đăng được bài viết đầu tiên — không tính thời gian cấu hình triển khai production.
- Việc bỏ qua Dynamic Workers (comment `worker_loaders`) chỉ nên dùng khi phát triển/thử nghiệm cục bộ hoặc chưa cần tính năng plugin sandbox; xem Chương 20 (Cài đặt & Quản lý Plugin) để hiểu tác động.

## Xem thêm

- [Chương 1 — EmDash là gì và dành cho ai](./01-emdash-la-gi.md)
- [Chương 3 — Thêm EmDash vào dự án Astro có sẵn](./03-them-vao-du-an-co-san.md)
- [Chương 7 — Đăng nhập không mật khẩu bằng Passkey](./07-dang-nhap-passkey.md)
- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
