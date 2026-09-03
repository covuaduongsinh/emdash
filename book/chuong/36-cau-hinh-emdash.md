# 36. Cấu hình EmDash (`emdash.config`)

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

EmDash được cấu hình qua hai file: `astro.config.mjs` cho integration, và `src/live.config.ts` cho content collection. Chương này là tham chiếu đầy đủ mọi tuỳ chọn cấu hình.

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash, { local, s3 } from "emdash/astro";
import { sqlite, libsql } from "emdash/db";

export default defineConfig({
	integrations: [
		emdash({
			database: sqlite({ url: "file:./data.db" }),
			storage: local({
				directory: "./uploads",
				baseUrl: "/_emdash/api/media/file",
			}),
			plugins: [],
		}),
	],
});
```

## Tuỳ chọn Integration

### `database` (bắt buộc)

Cấu hình database adapter — chọn một trong `sqlite()`, `postgres()`, `libsql()`, hoặc `d1()` (import từ `@emdash-cms/cloudflare`). Chi tiết đầy đủ ở [Chương 27](./27-co-so-du-lieu.md).

### `migrations` (tuỳ chọn)

Kiểm soát cách xử lý migration database nội bộ lúc runtime. Bỏ qua tuỳ chọn này mặc định là `{ runtime: "auto" }`:

```js
migrations: {
	runtime: "check", // "auto" | "check" | "manual"
	dev: "auto",     // override tuỳ chọn cho môi trường dev
}
```

`auto` kiểm tra và áp dụng migration đang chờ; `check` trả `503` khi có migration đã biết với build hiện tại đang chờ; `manual` không tự query migration lúc runtime. `EMDASH_MIGRATIONS_MODE` override chế độ runtime hiệu lực. Xem [Chương 27](./27-co-so-du-lieu.md) trước khi dùng `check` hay `manual`.

### `storage` (bắt buộc)

Cấu hình media storage adapter — chọn `local()`, `r2()` (từ `@emdash-cms/cloudflare`), hoặc `s3()`. Chi tiết đầy đủ ở [Chương 26](./26-trien-khai-nodejs.md) và [Chương 25](./25-trien-khai-cloudflare.md).

### `objectCache` (tuỳ chọn)

Cache kết quả truy vấn nội dung/cấu hình trong kho key/value, để đọc không cần truy vấn database mỗi request. Tắt khi bỏ qua. Chọn `kvCache()` (Cloudflare KV) hoặc `memoryCache()` (in-memory). Chi tiết ở [Chương 29](./29-object-cache.md).

### `middleware.outer` (tuỳ chọn)

Đăng ký một module middleware Astro chạy **bên ngoài** toàn bộ chồng middleware của EmDash. Vì integration đăng ký nó với `order: "pre"` trong Astro, nó cũng chạy trước middleware định nghĩa trong `src/middleware.ts`. Dùng cho các gate request hoặc cache toàn-response cần tránh khởi tạo runtime/database khi trúng cache, hoặc cho header response phụ thuộc vào HTML cuối cùng của EmDash.

```js title="astro.config.mjs"
emdash({
	middleware: {
		outer: "./src/outer-middleware.ts",
	},
});
```

**Thứ tự thực thi:**
1. Middleware ngoài chạy tới `await next()`.
2. EmDash khởi tạo runtime và database, rồi chạy setup, xác thực, và middleware ngữ cảnh request.
3. Route Astro render.
4. EmDash áp dụng biến đổi response, gồm HTML visual-editing và header bảo mật/timing.
5. `next()` resolve về middleware ngoài với response cuối cùng đó.

Trước khi gọi `next()`, middleware có ngữ cảnh request/platform Astro bình thường, nhưng `locals.emdash`, `locals.user`, database, và state EmDash theo request đều **chưa khả dụng**. Một `Response` trả sớm sẽ bỏ qua toàn bộ EmDash — nên phải tự gồm mọi header bảo mật/cache cần thiết. Sau khi `next()` resolve, an toàn để hoàn tất CSP nonce, cache toàn bộ body, hoặc đặt `Content-Length`.

Ví dụ tối giản dùng Cloudflare Cache API, chỉ cache response HTML ẩn danh và trả về hit trước khi EmDash khởi tạo:

```ts title="src/outer-middleware.ts"
import { waitUntil } from "cloudflare:workers";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async ({ request }, next) => {
	if (request.method !== "GET" || request.headers.has("cookie")) {
		return next();
	}

	const cacheKey = new Request(request.url, { method: "GET" });
	const cached = await caches.default.match(cacheKey);
	if (cached) return cached;

	const response = await next();
	const isHtml = response.headers.get("content-type")?.includes("text/html");
	const isPrivate = response.headers.get("cache-control")?.includes("no-store");
	if (response.ok && isHtml && !isPrivate) {
		waitUntil(caches.default.put(cacheKey, response.clone()));
	}

	return response;
});
```

Trên Node, dùng cùng hình dạng middleware với một cache tương thích Node (vd Redis). Cache key và quy tắc bypass phải gồm mọi thuộc tính request có thể thay đổi response đã render.

### `plugins` (tuỳ chọn)

Mảng plugin EmDash: `plugins: [seoPlugin()]` (xem [Chương 20](./20-cai-dat-plugin.md); viết plugin — [Chương 39](./39-viet-plugin-dau-tien.md) tới [Chương 46](./46-chuyen-doi-plugin-wp.md)).

### `fonts` (tuỳ chọn)

Cấu hình font admin UI. Mặc định EmDash tải [Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans) qua Astro Font API — font tải từ Google lúc build và tự host, không có request CDN lúc runtime. Font gốc bao phủ Latin, Cyrillic, Greek, Devanagari, và tiếng Việt.

Để thêm hệ chữ viết khác, truyền tên script:

```js
emdash({
  fonts: {
    scripts: ["arabic", "japanese"],
  },
})
```

Script khả dụng: `arabic`, `armenian`, `bengali`, `chinese-simplified`, `chinese-traditional`, `chinese-hongkong`, `devanagari`, `ethiopic`, `farsi`, `georgian`, `gujarati`, `gurmukhi`, `hebrew`, `japanese`, `kannada`, `khmer`, `korean`, `lao`, `malayalam`, `myanmar`, `oriya`, `sinhala`, `tamil`, `telugu`, `thai`, `tibetan`.

Đặt `fonts: false` để tắt hoàn toàn việc chèn font và dùng font hệ thống.

### `auth` (tuỳ chọn)

Adapter xác thực ngoài — thay thế Passkey mặc định. Adapter Cloudflare Access `access()` (từ `@emdash-cms/cloudflare`) có các tuỳ chọn: `teamDomain` (bắt buộc), `audience`, `audienceEnvVar` (mặc định `"CF_ACCESS_AUDIENCE"`), `autoProvision` (mặc định `true`), `defaultRole` (mặc định `30`), `syncRoles` (mặc định `false`), `roleMapping`. Chi tiết đầy đủ ở [Chương 19](./19-nguoi-dung-vai-tro.md).

> Khi có một auth adapter được cấu hình, nó trở thành **phương thức duy nhất** — Passkey bị tắt.

### `authProviders` (tuỳ chọn)

Mảng provider đăng nhập gắn thêm được (top-level, cạnh `auth`): `github()`, `google()`, `atproto()` (từ `@emdash-cms/auth-atproto`). Chi tiết đầy đủ ở [Chương 7](./07-dang-nhap-passkey.md).

### `siteUrl` (tuỳ chọn)

Origin công khai phía trình duyệt của site (scheme + host + port tuỳ chọn, **không có path**).

Đứng sau một **reverse proxy chấm dứt TLS**, `Astro.url` trả về địa chỉ nội bộ (`http://localhost:4321`) thay vì địa chỉ công khai (`https://cms.example.com`) — làm hỏng Passkey, khớp origin CSRF, redirect OAuth, redirect đăng nhập, MCP discovery, xuất snapshot, sitemap, robots.txt, và dữ liệu có cấu trúc JSON-LD. Đặt `siteUrl` sửa tất cả cùng lúc.

Integration **xác thực** giá trị này lúc load: phải là URL hợp lệ với scheme `http:` hoặc `https:`, được chuẩn hoá về **origin** (path bị loại bỏ).

```js
emdash({
	database: sqlite({ url: "file:./data.db" }),
	storage: local({ directory: "./uploads", baseUrl: "/_emdash/api/media/file" }),
	siteUrl: "https://cms.example.com",
});
```

Khi `siteUrl` không đặt trong config, EmDash kiểm tra biến môi trường theo thứ tự: `EMDASH_SITE_URL`, rồi `SITE_URL` — hữu ích cho triển khai container nơi URL công khai đặt lúc runtime. Trên **Cloudflare Workers**, fallback biến môi trường đọc `process.env`, vốn rỗng trừ khi bật compatibility flag `nodejs_compat_populate_process_env`.

> `siteUrl` là tuỳ chọn duy nhất cho origin công khai — bao phủ Passkey và mọi tính năng phụ thuộc origin khác. Nó **không** thay đổi `Astro.url` trong template của bạn — đặt tuỳ chọn [`site`](https://docs.astro.build/en/reference/configuration-reference/#site) của Astro cho URL canonical/OG bạn tự dựng.

**Xác minh Passkey đa origin:** `siteUrl` định nghĩa một origin chuẩn duy nhất. Khi cùng một triển khai EmDash truy cập được qua nhiều hostname chia sẻ domain cha đăng ký được (vd `https://example.com` và `https://preview.example.com`), xác minh Passkey mặc định từ chối assertion có origin không khớp `siteUrl` chính xác — dù WebAuthn cho phép Passkey hợp lệ xuyên subdomain dưới cùng `rpId`. Khai báo thêm origin được chấp nhận qua `allowedOrigins` trong config hoặc biến `EMDASH_ALLOWED_ORIGINS`. Mỗi origin phải cùng hostname với `siteUrl` hoặc là subdomain của nó.

```js title="astro.config.mjs"
emdash({
	siteUrl: "https://example.com",
	allowedOrigins: ["https://preview.example.com"],
})
```

**Cấu hình reverse proxy:** Astro chỉ phản ánh `X-Forwarded-*` khi host công khai được cho phép — cấu hình `security.allowedDomains` cho hostname (và scheme) người dùng của bạn truy cập; trong `astro dev`, thêm `vite.server.allowedHosts` khớp để Vite chấp nhận header `Host` của proxy. Ưu tiên sửa `allowedDomains` trước; dùng `siteUrl` khi URL dựng lại vẫn khác origin trình duyệt (thường gặp khi TLS chấm dứt phía trước và request upstream vẫn là `http://`).

```js title="astro.config.mjs (đoạn trích)"
export default defineConfig({
	security: {
		allowedDomains: [
			{ hostname: "cms.example.com", protocol: "https" },
			{ hostname: "cms.example.com", protocol: "http" },
		],
	},
	vite: {
		server: { allowedHosts: ["cms.example.com"] },
	},
	integrations: [
		emdash({
			database: sqlite({ url: "file:./data.db" }),
			storage: local({ directory: "./uploads", baseUrl: "/_emdash/api/media/file" }),
			siteUrl: "https://cms.example.com",
		}),
	],
});
```

### `trustedProxyHeaders` (tuỳ chọn)

Header tin cậy để resolve IP client khi chạy sau reverse proxy bạn tự kiểm soát — dùng bởi rate limit xác thực (magic-link, signup, passkey, OAuth device flow) và endpoint bình luận công khai. Trên Cloudflare, object `cf` gắn vào request được tự dùng — thường **không** cần đặt tuỳ chọn này. Trên triển khai self-host sau nginx/Caddy/Traefik/Fly/Railway..., đặt header proxy của bạn ghi:

```js
emdash({
	database: sqlite({ url: "file:./data.db" }),
	trustedProxyHeaders: ["x-real-ip"],
});
```

> **Chỉ đặt tuỳ chọn này khi bạn kiểm soát reverse proxy.** Client không tin cậy có thể tự đặt bất kỳ header nào — tin tưởng header forwarded-IP từ mạng mở là lỗ hổng giả mạo IP, vô hiệu hoá rate limit. Nếu EmDash lộ trực tiếp ra internet không qua proxy, để trống — rate limit sẽ dùng bucket "unknown" dùng chung (mặc định chặt hơn) thay vì tin một header có thể giả mạo.

### `maxUploadSize` (tuỳ chọn)

Kích thước upload media tối đa (byte), áp dụng cho cả upload multipart trực tiếp và signed-URL. Mặc định `52_428_800` (50 MB):

```js
emdash({
	maxUploadSize: 100 * 1024 * 1024, // 100 MB
});
```

Upload vượt giới hạn bị từ chối với `413 Payload Too Large` (đường trực tiếp) hoặc `400 Validation Error` (đường signed-URL).

### `toolbar` (tuỳ chọn)

Kiểm soát cách phục vụ thanh công cụ editor (viên nổi trên trang công khai). Mặc định `"server"`.

| Giá trị | Hành vi |
| --- | --- |
| `"server"` (mặc định) | Thanh công cụ được chèn phía server vào mọi response HTML render cho editor đã xác thực |
| `"client"` | HTML công khai giống hệt cho mọi khách. Một script bootstrap nhỏ hiện viên "Edit" trong trình duyệt đã đăng nhập admin; nhấn vào sẽ xác minh session và tải lại trang với tham số query `_edit`, luôn được render mới (không bao giờ cache) kèm thanh công cụ đầy đủ |
| `false` | Không bao giờ render thanh công cụ hay script bootstrap |

```js
emdash({ toolbar: "client" })
```

Dùng `"client"` khi HTML công khai được phục vụ qua cache dùng chung (Cloudflare Cache Everything/Workers Cache, Fastly, Varnish...). Với chèn phía server, một editor duyệt site công khai nhận biến thể ẩn danh đã cache (không có thanh công cụ) bất cứ khi nào khách ẩn danh mồi cache trước — nên thanh công cụ xuất hiện/biến mất theo trạng thái cache. Chế độ client không chèn gì đặc thù-session vào HTML chia sẻ được, nên cache vẫn hiệu quả đầy đủ.

### `experimental` (tuỳ chọn)

Tính năng opt-in có thể thay đổi hành vi/định dạng, hoặc bị gỡ, trong một minor release. Mỗi field bật độc lập.

> Tuỳ chọn experimental không ổn định — cố định EmDash đúng một phiên bản khi phụ thuộc vào chúng, kiểm tra changelog trước khi nâng cấp.

**`experimental.registry`** — trỏ luồng duyệt/cài plugin của admin dashboard vào một registry plugin phi tập trung thay vì marketplace trung tâm. Cần `sandboxRunner` vì plugin registry luôn chạy sandbox. Chi tiết đầy đủ ở [Chương 20](./20-cai-dat-plugin.md).

## Database adapter (import từ `emdash/db`)

- **`sqlite(config)`** — `{ url }` (đường dẫn tệp với tiền tố `file:`).
- **`libsql(config)`** — `{ url, authToken?, migrationAuthTokenEnv? }`.
- **`postgres(config)`** — `{ connectionString }` hoặc `{ host, port, database, user, password, ssl, pool.min, pool.max, migrationConnectionStringEnv }`.
- **`d1(config)`** (từ `@emdash-cms/cloudflare`) — `{ binding, session?, bookmarkCookie? }`. `session` là `"disabled"` (mặc định), `"auto"`, hoặc `"primary-first"`.

Chi tiết đầy đủ (bao gồm Hyperdrive) ở [Chương 27](./27-co-so-du-lieu.md).

## Storage adapter (import `local`/`s3` từ `emdash/astro`, `r2` từ `@emdash-cms/cloudflare`)

- **`local(config)`** — `{ directory, baseUrl }`.
- **`r2(config)`** — `{ binding, publicUrl? }`.
- **`s3(config?)`** — `{ endpoint, bucket, accessKeyId?, secretAccessKey?, region?, publicUrl? }`. Field bỏ qua được đọc từ biến môi trường `S3_*` tương ứng lúc tiến trình Node khởi động — tính năng **chỉ dành cho Node**, không hoạt động trên Cloudflare Workers.

Chi tiết đầy đủ ở Chương 25-26.

## Object cache adapter

- **`kvCache(config)`** (từ `@emdash-cms/cloudflare`) — `{ binding, defaultTtl?, revalidate?, timeout?, keyPrefix? }`.
- **`memoryCache(config?)`** (từ `emdash/astro`) — `{ defaultTtl?, revalidate?, maxEntries?, keyPrefix? }`.

Chi tiết đầy đủ ở [Chương 29](./29-object-cache.md).

## Live Collections

Cấu hình loader EmDash trong `src/live.config.ts`:

```ts title="src/live.config.ts"
import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";

export const collections = {
	_emdash: defineLiveCollection({
		loader: emdashLoader(),
	}),
};
```

`emdashLoader()` không nhận tham số nào.

## Biến môi trường EmDash tôn trọng

| Biến | Mô tả |
| --- | --- |
| `EMDASH_SITE_URL` | Origin công khai phía trình duyệt (fallback `SITE_URL`) |
| `EMDASH_ALLOWED_ORIGINS` | Danh sách origin bổ sung được xác minh Passkey chấp nhận, phân tách dấu phẩy |
| `EMDASH_DATABASE_URL` | Ghi đè URL database |
| `EMDASH_ENCRYPTION_KEY` | Khoá mã hoá secret plugin (xem lại [Chương 28](./28-bi-mat-cau-hinh.md)) |
| `EMDASH_PREVIEW_SECRET` | Override tuỳ chọn cho secret HMAC preview |
| `EMDASH_IP_SALT` | Override tuỳ chọn cho salt hash IP người bình luận |
| `EMDASH_AUTH_SECRET` | Kế thừa — dùng làm nguồn IP-salt nếu đặt |
| `EMDASH_TURNSTILE_SECRET_KEY` | Secret key Cloudflare Turnstile (fallback `TURNSTILE_SECRET_KEY`) — khi đặt, gửi bình luận cần token Turnstile hợp lệ |
| `EMDASH_URL` | URL EmDash từ xa dùng để đồng bộ schema |

Sinh khoá mã hoá: `npx emdash secrets generate`.

## Cấu hình trong `package.json`

Template và site có thể khai metadata tuỳ chọn dưới khoá `emdash`:

```json title="package.json"
{
	"emdash": {
		"label": "My Blog Template",
		"seed": ".emdash/seed.json",
		"url": "https://my-site.pages.dev"
	}
}
```

| Tuỳ chọn | Mô tả |
| --- | --- |
| `label` | Tên template để hiển thị |
| `seed` | Đường dẫn file JSON seed |
| `url` | URL từ xa để đồng bộ schema |

## Cấu hình TypeScript

EmDash sinh type trong `.emdash/types.ts`. Thêm path alias vào `tsconfig.json`:

```json title="tsconfig.json"
{
	"compilerOptions": {
		"paths": {
			"@emdash-cms/types": ["./.emdash/types.ts"]
		}
	}
}
```

Sinh type: `npx emdash types`.

## Xem thêm

- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 26 — Triển khai trên Node.js](./26-trien-khai-nodejs.md)
- [Chương 27 — Cơ sở dữ liệu (SQLite/PostgreSQL/D1)](./27-co-so-du-lieu.md)
- [Chương 29 — Bộ nhớ đệm đối tượng (Object Cache)](./29-object-cache.md)
- [Chương 33 — Tổng quan công cụ cho dev: CLI, API, MCP](./33-tong-quan-cong-cu-dev.md)
