# 26. Triển khai trên Node.js

Áp dụng cho vai trò: Quản trị viên/Vận hành, Lập trình viên

## Tổng quan

EmDash chạy trên Node.js v22.16 trở lên. Chương này dùng SQLite kèm lưu trữ cục bộ hoặc tương thích S3; libSQL và PostgreSQL hoạt động tương tự trên Node.js (xem [Chương 27](./27-co-so-du-lieu.md)).

### Điều kiện tiên quyết

- Node.js v22.16.0 trở lên.
- Một nhà cung cấp hosting Node.js hoặc VPS.

> Node.js 22 in ra cảnh báo `ExperimentalWarning: SQLite is an experimental feature` khi site dùng driver SQLite tích hợp sẵn. Cảnh báo này đến từ Node.js, không ngăn database mở được. Node.js 24 không còn in cảnh báo này.

## Cấu hình

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import emdash, { local, s3 } from "emdash/astro";
import { sqlite } from "emdash/db";

export default defineConfig({
	output: "server",
	adapter: node({ mode: "standalone" }),
	integrations: [
		emdash({
			database: sqlite({ url: "file:./data/emdash.db" }),
			storage: local({
				directory: "./data/uploads",
				baseUrl: "/_emdash/api/media/file",
			}),
		}),
	],
});
```

## Build và chạy

```bash
npm run build
node ./dist/server/entry.mjs
```

Server chạy tại `http://localhost:4321` theo mặc định. Migration được áp dụng ở request đầu tiên. Nếu database rỗng và setup chưa hoàn tất, seed file của bạn (hoặc seed mặc định tích hợp sẵn nếu không có) cũng được áp dụng trong request đầu tiên đó.

## Tác vụ theo lịch

Scheduler tích hợp sẵn chỉ chạy khi có một tiến trình Node.js đang chạy — xử lý xuất bản theo lịch, tác vụ plugin, và bảo trì chung.

> Luôn giữ ít nhất một tiến trình Node.js chạy liên tục ở production. Tác vụ theo lịch tạm dừng khi mọi tiến trình dừng hoặc "ngủ" (sleep).

## Lưu trữ cho production

Với production, ưu tiên lưu trữ tương thích S3 thay vì filesystem cục bộ:

```js title="astro.config.mjs"
import emdash, { s3 } from "emdash/astro";

export default defineConfig({
	integrations: [
		emdash({
			database: sqlite({ url: `file:${process.env.DATABASE_PATH}` }),
			storage: s3({
				endpoint: process.env.S3_ENDPOINT,
				bucket: process.env.S3_BUCKET,
				accessKeyId: process.env.S3_ACCESS_KEY_ID,
				secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
				publicUrl: process.env.S3_PUBLIC_URL, // URL CDN tuỳ chọn
			}),
		}),
	],
});
```

> Lưu trữ tương thích S3 hoạt động với Cloudflare R2 (qua S3 API), MinIO, và các dịch vụ tương thích S3 khác.

## Chi tiết các kho lưu trữ (Storage Backend)

EmDash lưu media (ảnh, tài liệu, video) trong một backend lưu trữ có thể cấu hình — chọn theo nền tảng triển khai và nhu cầu:

| Storage | Phù hợp nhất cho | Đặc điểm |
| --- | --- | --- |
| **R2 Binding** | Cloudflare Workers | Không cần cấu hình, nhanh (xem Chương 25) |
| **S3** | Mọi nền tảng | Signed upload, hỗ trợ CDN |
| **Local** | Phát triển | Lưu trữ filesystem đơn giản |

### S3-Compatible Storage

Adapter S3 hoạt động với Cloudflare R2 (qua S3 API), MinIO, và các dịch vụ tương thích S3 khác.

> **Cần cài AWS SDK trước:** EmDash dùng AWS SDK lúc runtime cho adapter S3 nhưng không bundle sẵn — core cố tình không phụ thuộc SDK để deployment chỉ-R2 hoặc chỉ-local vẫn gọn nhẹ. Cài SDK trước khi dùng `s3()`:
> ```sh
> pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
> ```
> Bỏ qua bước này, `astro build` sẽ lỗi `Rollup failed to resolve import "@aws-sdk/client-s3"`. Adapter R2 binding (`r2()`) và local adapter không cần SDK, không bị ảnh hưởng.

**Cấu hình:**

| Tuỳ chọn | Kiểu | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| `endpoint` | `string` | có | URL endpoint S3 |
| `bucket` | `string` | có | Tên bucket |
| `accessKeyId` | `string` | không* | Access key |
| `secretAccessKey` | `string` | không* | Secret key |
| `region` | `string` | không | Region (mặc định `"auto"`) |
| `publicUrl` | `string` | không | URL CDN hoặc URL công khai tuỳ chọn |

\* `accessKeyId` và `secretAccessKey` phải cùng có mặt hoặc cùng bỏ qua.

**Đọc cấu hình S3 từ biến môi trường:** field nào bị bỏ qua trong `s3({...})` sẽ được đọc từ biến môi trường `S3_*` tương ứng lúc tiến trình khởi động — cho phép build image container một lần rồi tiêm credential lúc khởi động mà không cần rebuild. Giá trị tường minh trong `s3({...})` luôn ưu tiên hơn biến môi trường.

| Biến môi trường | Field | Ghi chú |
| --- | --- | --- |
| `S3_ENDPOINT` | `endpoint` | Phải là URL `http`/`https` hợp lệ |
| `S3_BUCKET` | `bucket` | |
| `S3_ACCESS_KEY_ID` | `accessKeyId` | |
| `S3_SECRET_ACCESS_KEY` | `secretAccessKey` | |
| `S3_REGION` | `region` | Mặc định `"auto"` |
| `S3_PUBLIC_URL` | `publicUrl` | Tiền tố CDN tuỳ chọn |

Gọi `s3()` không tham số sẽ đọc mọi field từ biến môi trường `S3_*`. Đây là tính năng **chỉ dành cho Node.js** — không hoạt động trên Cloudflare Workers (Worker secret/variable expose qua tham số `env` của fetch handler, không qua `process.env`, kể cả khi bật `nodejs_compat`). Trên Workers: dùng adapter `r2()` nếu dùng R2 (khuyến nghị), hoặc truyền giá trị tường minh vào `s3({...})` nếu cần backend S3 khác R2.

**R2 qua S3 API** (dùng credential S3 với R2 để có tính năng như signed upload URL):

```js
storage: s3({
	endpoint: "https://<account-id>.r2.cloudflarestorage.com",
	bucket: "emdash-media",
	accessKeyId: process.env.R2_ACCESS_KEY_ID,
	secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
	publicUrl: "https://pub-xxxx.r2.dev",
});
```

Sinh credential API R2 trong Cloudflare dashboard mục R2 > Manage R2 API Tokens.

**MinIO:**

```js
storage: s3({
	endpoint: "https://minio.example.com",
	bucket: "emdash-media",
	accessKeyId: process.env.MINIO_ACCESS_KEY,
	secretAccessKey: process.env.MINIO_SECRET_KEY,
	publicUrl: "https://minio.example.com/emdash-media",
});
```

### Local Filesystem

Dùng cho phát triển — tệp lưu trong một thư mục trên đĩa:

```js title="astro.config.mjs"
import emdash, { local } from "emdash/astro";

export default defineConfig({
	integrations: [
		emdash({
			storage: local({
				directory: "./uploads",
				baseUrl: "/_emdash/api/media/file",
			}),
		}),
	],
});
```

| Tuỳ chọn | Kiểu | Mô tả |
| --- | --- | --- |
| `directory` | `string` | Đường dẫn thư mục lưu tệp |
| `baseUrl` | `string` | Base URL phục vụ tệp |

`baseUrl` nên khớp endpoint media file của EmDash (`/_emdash/api/media/file`) trừ khi bạn cấu hình static file server riêng.

> Local storage không hỗ trợ signed upload URL — tệp upload đi qua server, có thể chậm hơn với tệp lớn.

### Chuyển đổi backend theo môi trường

```js title="astro.config.mjs"
import emdash, { s3, local } from "emdash/astro";
import { r2 } from "@emdash-cms/cloudflare";

const storage = import.meta.env.PROD
	? r2({ binding: "MEDIA" })
	: local({
			directory: "./uploads",
			baseUrl: "/_emdash/api/media/file",
		});

export default defineConfig({
	integrations: [emdash({ storage })],
});
```

### Signed Upload

Adapter S3 hỗ trợ signed upload URL, cho phép client upload thẳng tới storage mà không qua server — cải thiện hiệu năng với tệp lớn. Signed upload tự động dùng khi adapter S3 khả dụng; admin UI tự dùng khi có sẵn. Adapter **hỗ trợ**: S3 (kể cả R2 qua S3 API). Adapter **không hỗ trợ**: R2 binding, Local.

## Docker

Thêm `.dockerignore`:

```plain title=".dockerignore"
node_modules
dist
.git
```

`Dockerfile`:

```dockerfile title="Dockerfile"
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN mkdir -p data

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
```

Seed file được đọc lúc build và inline vào bundle, nên không cần copy vào runtime image. Migration chạy ở request đầu tiên sau khi deploy; seed chỉ áp dụng khi database chưa có Collection nào và setup chưa hoàn tất — dữ liệu có sẵn không bao giờ bị ghi đè.

> Dockerfile này build **site EmDash của riêng bạn** — dự án có `emdash` là dependency. Nó **không** thay thế được cho `Dockerfile` ở gốc repo EmDash (dùng để build toàn bộ pnpm monorepo và đóng gói template blog từ mã nguồn).

Build image và chạy container:

```bash
docker build -t my-emdash-site .
docker run -p 4321:4321 -v emdash-data:/app/data my-emdash-site
```

Docker Compose:

```yaml title="compose.yaml"
services:
  emdash:
    build: .
    ports:
      - "4321:4321"
    volumes:
      - emdash-data:/app/data
    restart: unless-stopped

volumes:
  emdash-data:
```

```bash
docker compose up -d
```

## Biến môi trường

`EMDASH_ENCRYPTION_KEY` (khoá mã hoá secret plugin) nên đặt trên mọi lần triển khai:

```bash
npx emdash secrets generate  # thêm kết quả vào biến môi trường
```

Khoá do bạn cung cấp và không bao giờ lưu trong database, chỉ ciphertext đã mã hoá được lưu — sao lưu ở nơi bền vững, mất khoá đồng nghĩa mất mọi secret đã mã hoá bằng nó.

Các biến override tuỳ chọn (`EMDASH_PREVIEW_SECRET`, `EMDASH_IP_SALT`, `EMDASH_AUTH_SECRET`) và danh mục secret đầy đủ nằm ở [Chương 28](./28-bi-mat-cau-hinh.md).

**Database và Storage:**

| Biến | Mô tả | Ví dụ |
| --- | --- | --- |
| `DATABASE_PATH` | Đường dẫn database SQLite | `/data/emdash.db` |
| `HOST` | Host server | `0.0.0.0` |
| `PORT` | Port server | `4321` |
| `S3_ENDPOINT` | URL endpoint S3 | `https://xxx.r2.cloudflarestorage.com` |
| `S3_BUCKET` | Tên bucket S3 | `my-media-bucket` |
| `S3_ACCESS_KEY_ID` | Access key S3 | `AKIA...` |
| `S3_SECRET_ACCESS_KEY` | Secret key S3 | `...` |
| `S3_PUBLIC_URL` | URL công khai cho media | `https://cdn.example.com` |

> Không bao giờ commit secret vào repo — dùng cơ chế quản lý secret của nền tảng (biến môi trường, secret store...) cho production.

## Lưu trữ bền vững (Persistent Storage)

SQLite cần đĩa lưu trữ bền vững. Đảm bảo nền tảng hosting cung cấp: volume/đĩa gắn kèm (mounted), quyền ghi vào thư mục database, cơ chế sao lưu cho tệp database.

> Hệ thống tệp tạm thời (ephemeral) sẽ mất database khi restart — dùng libSQL với database từ xa hoặc lưu trữ bền vững.

## Health Check

Thêm endpoint health check cho load balancer:

```astro title="src/pages/health.ts"
export const GET = () => {
  return new Response("OK", { status: 200 });
};
```

Cấu hình nền tảng của bạn kiểm tra `/health` cho liveness probe.

## Xem thêm

- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 27 — Cơ sở dữ liệu (SQLite/PostgreSQL/D1)](./27-co-so-du-lieu.md)
- [Chương 28 — Bí mật cấu hình & biến môi trường](./28-bi-mat-cau-hinh.md)
