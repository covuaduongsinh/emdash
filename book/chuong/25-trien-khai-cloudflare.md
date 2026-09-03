# 25. Triển khai lên Cloudflare Workers

Áp dụng cho vai trò: Quản trị viên/Vận hành, Lập trình viên

## Tổng quan

Cloudflare Workers cung cấp runtime nhanh, phân tán toàn cầu cho EmDash. Chương này hướng dẫn triển khai với D1 làm database và R2 làm kho lưu trữ media.

### Điều kiện tiên quyết

- Tài khoản Cloudflare.
- Đã cài Wrangler CLI (`npm install -g wrangler`).
- Đã xác thực với Cloudflare (`wrangler login`).

## Cấu hình Binding

Khởi tạo database D1 và bucket R2 cho production, sau đó tạo `wrangler.jsonc` ở gốc dự án với binding cho ID và tên cố định của chúng. Việc khởi tạo database (provisioning) tách biệt với việc áp dụng migration schema của EmDash.

```jsonc title="wrangler.jsonc"
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "my-emdash-site",
	"compatibility_date": "2025-01-15",
	"compatibility_flags": ["nodejs_compat"],

	"d1_databases": [
		{
			"binding": "DB",
			"database_name": "emdash-db",
			"database_id": "00000000-0000-0000-0000-000000000000",
		},
	],

	"r2_buckets": [
		{
			"binding": "MEDIA",
			"bucket_name": "emdash-media",
		},
	],
}
```

Đây là các binding bạn tự cấu hình. Adapter `@astrojs/cloudflare` còn tự thêm binding riêng của nó khi sinh cấu hình Worker triển khai — một trong số đó là binding `IMAGES` dùng cho biến đổi ảnh (xem mục "Biến đổi ảnh" bên dưới).

## Cấu hình EmDash

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import emdash from "emdash/astro";
import { d1, r2 } from "@emdash-cms/cloudflare";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	integrations: [
		react(), // Bắt buộc — admin UI là ứng dụng React
		emdash({
			database: d1({ binding: "DB" }),
			storage: r2({ binding: "MEDIA" }),
		}),
	],
});
```

## Migration và Deploy

Migration lúc runtime vẫn tự động chạy theo mặc định. Với migration quản lý theo lần triển khai (deployment-managed), build Worker rồi kiểm tra D1 target đã khởi tạo bằng account và UUID database:

```bash
pnpm build
pnpm exec emdash migrate --status --json \
  --account-id "$CLOUDFLARE_ACCOUNT_ID" \
  --d1 "$D1_DATABASE_ID"
```

Sau khi xem lại và ghi lại fingerprint của target, áp dụng migration và deploy cùng bản build:

```bash
pnpm exec emdash migrate \
  --account-id "$CLOUDFLARE_ACCOUNT_ID" \
  --d1 "$D1_DATABASE_ID" \
  --expected-target-fingerprint "$EMDASH_TARGET_FINGERPRINT"
pnpm exec wrangler deploy
```

Job migration cần `CLOUDFLARE_API_TOKEN` có quyền D1 Edit. Nên tuần tự hoá (serialize) job theo account và UUID database. Xem [Chương 27 (Cơ sở dữ liệu)](./27-co-so-du-lieu.md), mục quản lý migration lõi, để biết chi tiết về khởi tạo, đồng thời trong CI, chế độ runtime, và cách khắc phục sự cố.

Nếu database rỗng (chưa có Collection) và Setup Wizard chưa hoàn tất, EmDash cũng áp dụng một seed file khi khởi động lần đầu. Seed được đọc lúc build từ `.emdash/seed.json`, đường dẫn khai trong `package.json#emdash.seed`, hoặc `seed/seed.json` — tuỳ file nào tìm thấy trước — và được inline vào bundle. Nếu không có file nào, một seed mặc định tích hợp sẵn được dùng. Các lần deploy sau đó vào một database đã có sẵn sẽ giữ nguyên nội dung, không áp lại seed.

Để thay đổi schema hoặc mô hình nội dung của một site đã triển khai, xem Chương 27 (mục "Evolving a Deployed Site").

## Tác vụ theo lịch (Scheduled Tasks)

Cloudflare chạy xuất bản theo lịch, tác vụ plugin, và bảo trì chung từ **một** Cron Trigger duy nhất. Dùng entry point Worker chuẩn:

```ts title="src/worker.ts"
import handler, {
	createScheduledHandler,
	PluginBridge,
} from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

export default {
	...handler,
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
```

Cấu hình một Cron Trigger cho bảo trì chung trong `wrangler.jsonc`:

```jsonc title="wrangler.jsonc"
{
	"triggers": {
		"crons": ["* * * * *"],
	},
}
```

Để dùng lịch bảo trì chung khác, đặt `generalCron` trong `createScheduledHandler()` và dùng đúng biểu thức đó trong `wrangler.jsonc`.

## Deploy

```bash
wrangler deploy
```

Site giờ chạy tại `https://my-emdash-site.<your-subdomain>.workers.dev`.

## Read Replica

Với site phân tán toàn cầu, bật D1 read replication để định tuyến truy vấn đọc tới replica gần nhất thay vì luôn gọi database chính — giảm đáng kể độ trễ cho khách truy cập ở xa vùng chính:

```js title="astro.config.mjs"
emdash({
	database: d1({
		binding: "DB",
		session: "auto",
	}),
	storage: r2({ binding: "MEDIA" }),
}),
```

Bạn cũng cần bật read replication ngay trên database D1 (qua Cloudflare dashboard hoặc REST API).

> Session read replica **không tương thích** với compatibility flag `global_fetch_strictly_public`. Nếu flag này có trong `wrangler.jsonc`, request nội bộ mà D1 Sessions API dùng để định tuyến tới replica sẽ bị chặn âm thầm, khiến mọi request SSR treo tới khi Worker bị kill — không có gì trong log. Nếu Worker của bạn cần flag đó, giữ `session` tắt.

## Object Cache

Để giảm tải đọc trên D1, cache kết quả truy vấn nội dung và cấu hình trong Cloudflare KV:

```js title="astro.config.mjs"
import { d1, r2, kvCache } from "@emdash-cms/cloudflare";

emdash({
	database: d1({ binding: "DB" }),
	storage: r2({ binding: "MEDIA" }),
	objectCache: kvCache({ binding: "CACHE" }),
}),
```

Chi tiết thiết lập KV, tuỳ chọn, và hành vi vô hiệu hoá cache ở [Chương 29](./29-object-cache.md).

## Workers Cache

**Workers Cache** của Cloudflare đặt một cache ở edge **phía trước** Worker: request khớp được phục vụ mà không chạy Worker.

Bật bằng cách: (1) bật `"cache": { "enabled": true }` trong `wrangler.jsonc`; (2) dùng Cloudflare cache provider của Astro (`cacheCloudflare()` từ `@astrojs/cloudflare/cache`) để route rules/`Astro.cache` đặt đúng header và vô hiệu hoá dùng `cache.purge()` gốc; (3) purge từ Worker bằng platform API (`import { cache } from "cloudflare:workers"; await cache.purge(...)`, không cần credential REST của Cloudflare).

Admin và API response của EmDash đã gửi sẵn `Cache-Control: private, no-store` và không bao giờ được lưu cache. Trang công khai tự kiểm soát cache qua `Cache-Control`/`routeRules`/`Astro.cache`.

Hai điều cần biết trước khi bật:

1. **Response không có header `Cache-Control` vẫn bị cache.** Workers Cache áp dụng độ tươi theo suy đoán RFC 9111 — một `200` không có header nào sẽ bị cache 2 giờ. Luôn đặt `Cache-Control` tường minh cho mọi route tuỳ chỉnh (`private, no-store` cho bất cứ gì phụ thuộc session).
2. **Trang đã cache dùng chung cho cả editor đã đăng nhập.** Cache chạy trước Worker nên không thể bỏ qua theo cookie request — một editor đã đăng nhập có thể nhận bản cache ẩn danh của trang công khai (không có thanh công cụ visual editing) tới khi mục cache hết hạn. Response do editor render không bao giờ bị lưu cache (đã mang `private, no-store`) nên không rò rỉ theo chiều ngược lại.

> **Không nhầm** với `cloudflareCache()` (legacy, dùng Cache API + Zone REST để purge, cần `CF_ZONE_ID`+`CF_CACHE_PURGE_TOKEN`) — ưu tiên Workers Caching cho site mới. Cũng đừng nhầm cả hai với **Object Cache** (`objectCache: kvCache(...)`) — object cache là một tầng riêng dưới Worker, cache kết quả truy vấn database trong KV.

## Custom Domain

Thêm domain tuỳ chỉnh trong Cloudflare dashboard: **Workers & Pages** > worker của bạn → **Custom Domains** → **Add Custom Domain** → nhập domain và làm theo hướng dẫn thiết lập DNS.

## Truy cập R2 công khai

Để phục vụ media trực tiếp từ R2 (khuyến nghị vì hiệu năng):

1. Trong Cloudflare dashboard, vào **R2** > bucket của bạn.
2. **Settings** > **Public access**.
3. Bật public access, ghi lại URL công khai.
4. Cập nhật cấu hình storage:

```js title="astro.config.mjs"
storage: r2({
  binding: "MEDIA",
  publicUrl: "https://pub-xxx.r2.dev"
}),
```

> Với production, nên gắn custom domain vào bucket R2 để có URL đẹp hơn và kiểm soát cache tốt hơn.

### Tuỳ chọn cấu hình R2

| Tuỳ chọn | Kiểu | Mô tả |
| --- | --- | --- |
| `binding` | `string` | Tên binding R2 khai trong `wrangler.jsonc` |
| `publicUrl` | `string` | URL công khai của bucket (tuỳ chọn) |

> R2 binding **không hỗ trợ** signed upload URL. Nếu cần client upload trực tiếp, dùng adapter S3 với credential R2 thay thế (xem Chương 26).

## Biến đổi ảnh (Image Transformation)

EmDash resize và mã hoá lại media R2 ngay trong Worker, qua binding `IMAGES` của Cloudflare. Component `Image` từ `emdash/ui` và ảnh trong rich text đều render qua endpoint ảnh mà EmDash cài dưới adapter Cloudflare. Với media trên route nội bộ `/_emdash/api/media/file/…`, endpoint đó đọc byte gốc trực tiếp từ R2 binding, không qua HTTP fetch — vẫn hoạt động phía sau Cloudflare Access và với `global_fetch_strictly_public`. Media phục vụ từ URL bucket (mục "Truy cập R2 công khai" ở trên) dùng endpoint transform riêng của adapter, phải fetch qua HTTP trước khi biến đổi.

Bạn không cần tự khai báo binding — `@astrojs/cloudflare` tự thêm vào cấu hình Worker khi build, bất cứ khi nào `imageService` runtime là `cloudflare-binding` (mặc định không đặt, chuỗi đó, hoặc `{ runtime: "cloudflare-binding" }`). Mọi giá trị khác (`"passthrough"`, `"compile"`, `"cloudflare"`, `"custom"`) đều bỏ qua binding này. Khai rõ trong `wrangler.jsonc` của bạn để ý định rõ ràng:

```jsonc title="wrangler.jsonc"
{
	"images": {
		"binding": "IMAGES",
	},
}
```

> **Cảnh báo:** thiếu binding gây hậu quả khác nhau tuỳ URL media — trên route nội bộ, endpoint phục vụ nguyên file gốc (trang vẫn render nhưng ảnh không được scale); từ URL bucket, request lỗi 500 vì endpoint transform không có fallback. `imageService: "passthrough"` là lối thoát có chủ đích nếu bạn không cần biến đổi ảnh.

Cloudflare tính phí các lượt biến đổi này theo Images transformations — mỗi tổ hợp duy nhất của ảnh nguồn + tham số tính phí một lần mỗi tháng, request lặp lại trong tháng đó miễn phí. Gói Images Free bao gồm 5.000 lượt biến đổi duy nhất/tháng; vượt ngưỡng, bản đã cache vẫn phục vụ được nhưng lượt biến đổi mới trả lỗi `9422`.

## Xác thực bằng Cloudflare Access

Nếu tổ chức bạn dùng Cloudflare Access, có thể dùng nó làm provider xác thực thay Passkey (đã trình bày chi tiết ở [Chương 19](./19-nguoi-dung-vai-tro.md)):

```js title="astro.config.mjs"
emdash({
  database: d1({ binding: "DB" }),
  storage: r2({ binding: "MEDIA" }),
  auth: access({
    teamDomain: "myteam.cloudflareaccess.com",
    audience: "your-app-audience-tag",
    roleMapping: {
      "Admins": 50,
      "Editors": 40,
    },
  }),
}),
```

## Cloudflare AI Search

Plugin AI Search lập chỉ mục nội dung đã published của EmDash và thêm giao diện tìm kiếm thông minh cho site.

1. Đăng ký plugin trong mảng `plugins` truyền cho EmDash: `import { aiSearch } from "@emdash-cms/cloudflare/plugins"`, thêm `aiSearch()` vào `plugins: [...]`.
2. Thêm binding namespace AI Search vào cấu hình Worker (`ai_search_namespaces` trong `wrangler.jsonc`).
3. Tạo endpoint tìm kiếm: `export { POST, prerender } from "@emdash-cms/cloudflare/plugins/ai-search"`.
4. Thêm giao diện tìm kiếm vào layout site bằng component `AISearchSnippet`.
5. Deploy site (`wrangler deploy`).
6. Mở **Cloudflare AI Search** trong admin panel, chọn Collection cần lập chỉ mục, nhấn **Sync All Content**.

Lần sync ban đầu là bắt buộc — hook nội dung của plugin chỉ kích hoạt cho nội dung tạo/sửa **sau khi** bật plugin, nội dung xuất bản trước đó vẫn thiếu trong chỉ mục tới khi bạn chạy sync đầy đủ. Sau đó, nội dung published/cập nhật được tự động đồng bộ.

## Email

Trên Workers, handler `email:deliver` tích hợp sẵn duy nhất là một stub console dùng để dev — nên các luồng cần email (đăng nhập magic-link, mời thành viên, thông báo bình luận) sẽ báo lỗi **"Email is not configured"** ở production. Plugin `cloudflareEmail()` gửi email thật qua Cloudflare Email Sending, dùng binding `send_email` gốc, không cần API key ngoài.

Các bước: (1) xác minh domain/địa chỉ gửi trong Cloudflare dashboard mục **Email**; (2) khai báo binding `send_email` trong `wrangler.jsonc`; (3) đăng ký plugin trong `emdash()`:

```js title="astro.config.mjs"
import { d1, r2 } from "@emdash-cms/cloudflare";
import { cloudflareEmail } from "@emdash-cms/cloudflare/plugins";

emdash({
	database: d1({ binding: "DB" }),
	storage: r2({ binding: "MEDIA" }),
	plugins: [
		cloudflareEmail({
			from: { email: "cms@mails.example.com", name: "My Site CMS" },
			replyTo: "hello@example.com", // tuỳ chọn
			binding: "EMAIL", // tuỳ chọn, mặc định "EMAIL"
		}),
	],
}),
```

(4) Deploy, rồi kích hoạt plugin dưới **Admin → Extensions** và chọn nó làm provider dưới **Settings → Email**.

| Tuỳ chọn | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `from` | `string \| { email, name? }` | bắt buộc | Địa chỉ gửi trên domain đã đăng ký Email Sending |
| `replyTo` | `string` | — | Reply-To tuỳ chọn, hữu ích khi `from` là địa chỉ no-reply |
| `binding` | `string` | `"EMAIL"` | Tên binding `send_email` trong `wrangler.jsonc` |

> BCC và tệp đính kèm nằm ngoài phạm vi hỗ trợ (không có trong `EmailMessage` của EmDash).

## Biến môi trường

`EMDASH_ENCRYPTION_KEY` là khoá mã hoá secret plugin khi lưu trữ — nên đặt trên mọi lần triển khai (xem lại [Chương 2](./02-cai-dat-lan-dau.md)). Sinh khoá và lưu làm Worker secret:

```bash
npx emdash secrets generate
wrangler secret put EMDASH_ENCRYPTION_KEY
```

> Không bao giờ commit khoá mã hoá vào repo; sao lưu ở nơi bền vững (trình quản lý mật khẩu, KMS, hoặc kho secret của team).

Các biến tuỳ chọn khác (`EMDASH_PREVIEW_SECRET`, `EMDASH_IP_SALT`, `EMDASH_AUTH_SECRET`) và toàn bộ danh mục secret EmDash dùng, nằm ở [Chương 28](./28-bi-mat-cau-hinh.md).

## Triển khai bản Preview

```bash
wrangler deploy --env preview
```

Thêm phần môi trường vào `wrangler.jsonc`:

```jsonc
{
	"env": {
		"preview": {
			"d1_databases": [
				{
					"binding": "DB",
					"database_name": "emdash-db-preview",
				},
			],
		},
	},
}
```

## Xử lý sự cố

| Vấn đề | Cách xử lý |
| --- | --- |
| "D1 binding not found" | Kiểm tra tên binding trong `wrangler.jsonc` khớp với cấu hình `d1({ binding: "DB" })` |
| "R2 binding not found" | Kiểm tra bucket R2 đã bind đúng, khớp `r2({ binding: "MEDIA" })` |
| Lỗi migration | Xem log Worker (`wrangler tail`) và tái hiện lỗi để lấy thông báo gốc, rồi báo lỗi kèm output đó |

## Xem thêm

- [Chương 19 — Quản lý người dùng, vai trò và quyền hạn](./19-nguoi-dung-vai-tro.md)
- [Chương 20 — Cài đặt & Quản lý Plugin (người dùng cuối)](./20-cai-dat-plugin.md)
- [Chương 22 — Sao lưu và phục hồi dữ liệu](./22-sao-luu-phuc-hoi.md)
- [Chương 26 — Triển khai trên Node.js](./26-trien-khai-nodejs.md)
- [Chương 27 — Cơ sở dữ liệu (SQLite/PostgreSQL/D1)](./27-co-so-du-lieu.md)
- [Chương 28 — Bí mật cấu hình & biến môi trường](./28-bi-mat-cau-hinh.md)
- [Chương 29 — Bộ nhớ đệm đối tượng (Object Cache)](./29-object-cache.md)
