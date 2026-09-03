# 3. Thêm EmDash vào dự án Astro có sẵn

Áp dụng cho vai trò: Lập trình viên, Quản trị viên/Vận hành

## Tổng quan

`npm create emdash@latest` (xem [Chương 2](./02-cai-dat-lan-dau.md)) tạo ra một dự án đã được "nối dây" sẵn (pre-wired). Nhưng EmDash cũng có thể được ghép (graft) vào một site Astro bạn đã có sẵn. Chương này liệt kê từng yêu cầu mà starter template thường tự lo cho bạn — nếu thiếu bất kỳ yêu cầu nào, bạn sẽ gặp lỗi khó hiểu, vì vậy hãy làm theo đúng checklist theo thứ tự.

### Yêu cầu trước khi bắt đầu

- **Astro 6 trở lên** — nâng cấp trước nếu đang ở phiên bản major cũ hơn (`npx @astrojs/upgrade`).
- **Node.js v22.16.0 trở lên** (các phiên bản có số lẻ không được hỗ trợ).
- **Server output** — EmDash phục vụ nội dung tại runtime, nên dự án cần `output: "server"` và một adapter (Node, Cloudflare...).

## Các bước thực hiện

### Bước 1 — Cài đặt các gói

Cài EmDash cùng các peer dependency bắt buộc. React vận hành admin UI tại `/_emdash/admin`; gói này **bắt buộc** ngay cả khi bản thân site của bạn không dùng React:

```bash
# npm
npm install emdash @astrojs/react react react-dom

# pnpm
pnpm add emdash @astrojs/react react react-dom

# yarn
yarn add emdash @astrojs/react react react-dom
```

Nếu triển khai lên Cloudflare, cài thêm các gói Cloudflare (chi tiết đầy đủ ở [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)):

```bash
npm install @astrojs/cloudflare @emdash-cms/cloudflare
```

### Bước 2 — Đăng ký các Integration

Thêm cả `react()` và `emdash()` vào mảng `integrations`. Đăng ký `@astrojs/react` là **không tuỳ chọn** — chỉ cài gói thôi là chưa đủ, nếu thiếu integration thì admin build thành công nhưng không bao giờ hydrate, trang sẽ đứng mãi ở trạng thái "Loading EmDash...".

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

export default defineConfig({
	output: "server",
	adapter: node({ mode: "standalone" }),
	integrations: [
		react(),
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

> Vì quá trình build sẽ phát cảnh báo (warning) khi `@astrojs/react` thiếu trong `integrations`, hãy kiểm tra output của build nếu admin không tải được.

### Bước 3 — Thêm Live Collections Loader

Tạo `src/live.config.ts` để tầng content của Astro có thể phân giải (resolve) nội dung EmDash. Thiếu file này, `getEmDashCollection`/`getEmDashEntry` sẽ không có live collection nào để định tuyến tới.

```ts title="src/live.config.ts"
import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";

export const collections = {
	_emdash: defineLiveCollection({ loader: emdashLoader() }),
};
```

File `src/content.config.ts` hiện có (các collection dựa trên file) của bạn vẫn hoạt động song song bình thường — xem Chương 4 (EmDash cho dev Astro) để hiểu cách hai hệ cùng tồn tại.

### Bước 4 — Xác minh cài đặt

1. Khởi động dev server:

   ```bash
   npm run dev
   ```

2. Mở `http://localhost:4321/_emdash/admin` và hoàn tất Setup Wizard.

3. Tạo và xuất bản một bài viết, sau đó truy vấn nó từ một trang:

   ```astro title="src/pages/test.astro"
   ---
   import { getEmDashCollection } from "emdash";

   const { entries: posts } = await getEmDashCollection("posts", {
   	status: "published",
   });
   ---

   <ul>{posts.map((post) => <li>{post.data.title}</li>)}</ul>
   ```

## Triển khai lên Cloudflare

Làm theo Chương 25 (Triển khai lên Cloudflare Workers) để có đầy đủ thiết lập (database D1, bucket media R2, cron trigger). Hai điểm dễ vấp phải với dự án có sẵn:

- **Dùng Cloudflare Workers, không phải Pages.** Adapter `@astrojs/cloudflare` phát sinh một file `wrangler.json` mà Pages không chấp nhận. Nếu site hiện tại đang deploy lên Pages, hãy [chuyển sang Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) trước.
- **Binding phải tồn tại trong `wrangler.jsonc`.** Tối thiểu cần một binding D1 cho database và một binding R2 cho media, khớp đúng tên binding trong `astro.config.mjs`.

## Xử lý sự cố

| Triệu chứng | Nguyên nhân | Cách khắc phục |
| --- | --- | --- |
| Admin kẹt ở "Loading EmDash..." | `@astrojs/react` chưa được đăng ký | Thêm `react()` vào `integrations` |
| `Could not resolve "astro:content"` trong `live.config.ts` | Astro cũ hơn phiên bản 6 | Nâng cấp Astro |
| `getEmDashCollection` trả về lỗi | Thiếu `src/live.config.ts` | Thêm live collections loader |
| Lỗi build về package chưa resolve được | Chưa cài peer dependency | Cài rõ ràng `@astrojs/react`, `react`, `react-dom` |
| Thay đổi nội dung không hiển thị | Trang đang bị prerender | Đặt `export const prerender = false` trên trang động |

## Lưu ý

- Đây là con đường dành cho dự án Astro *đã tồn tại* — nếu bắt đầu từ đầu, dùng `npm create emdash@latest` như Chương 2 sẽ nhanh hơn vì mọi thứ đã được nối dây sẵn.
- Danh sách "Xử lý sự cố" ở trên nên là điểm tra cứu đầu tiên khi gặp lỗi lạ ngay sau khi tích hợp EmDash vào dự án có sẵn.

## Xem thêm

- [Chương 2 — Cài đặt lần đầu và Trình cài đặt (Setup Wizard)](./02-cai-dat-lan-dau.md)
- [Chương 4 — So sánh với WordPress / Astro thuần](./04-so-sanh-wordpress-astro.md)
- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
- [Chương 51 — Câu hỏi thường gặp & khắc phục sự cố](./51-cau-hoi-thuong-gap.md)
