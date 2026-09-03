# 39. Viết Plugin đầu tiên (sandboxed)

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

EmDash plugin có 2 định dạng: **sandboxed** hoặc **native**. Chương này giúp bạn chọn đúng định dạng, rồi hướng dẫn xây dựng một plugin sandboxed hoàn chỉnh từ đầu — cấu trúc file, manifest, và code runtime.

## Chọn định dạng Plugin

**Mặc định chọn sandboxed.** Plugin sandboxed publish được lên marketplace và cài từ admin UI chỉ với một cú nhấp. Plugin native cần sửa code, `npm install`, và deploy lại trên mọi site muốn dùng — đây là cái người dùng cuối muốn. **Chỉ chọn native khi cần một tính năng sandbox không cung cấp được.**

### So sánh nhanh

| | Sandboxed | Native |
| --- | --- | --- |
| Hình dạng | `emdash-plugin.jsonc` + `src/plugin.ts` | Descriptor `definePlugin()` |
| Cài đặt | Một cú nhấp từ marketplace admin | `npm install` + sửa `astro.config` |
| Chạy trong | Runtime cách ly do sandbox runner cung cấp | Cùng tiến trình với site Astro |
| Giới hạn tài nguyên | Runner thực thi (CPU, subrequest, wall-time, memory) | Không có |
| Truy cập mạng | Chỉ `ctx.http`, giới hạn `allowedHosts` | Chỉ `ctx.http`, giới hạn `allowedHosts` |
| `fetch()`/`process.env` trực tiếp | Bị chặn bởi runner | Có thể (code plugin dùng chung runtime) |
| Phân phối | Bundle `.tar.gz` trên marketplace | Gói npm |
| Admin UI | Route Block Kit (mô tả bằng JSON) | Component React, hoặc Block Kit |
| Render component Portable Text | Không có | `componentsEntry` cung cấp component Astro |
| Chèn page fragment | Không có (chỉ meta/JSON-LD qua `page:metadata`) | Hook `page:fragments` |

### Đánh đổi khi chọn native

- **Không có marketplace** — mọi site phải tự cài gói npm, sửa `astro.config.mjs`, deploy lại.
- **Không có cách ly** — lỗi trong plugin có thể sập tiến trình host hoặc ngốn hết CPU; một rejection chưa xử lý trong hook có thể kéo sập cả request.
- **Gánh nặng tin tưởng lên người dùng** — plugin native có quyền truy cập ngang với site host, người dùng không thể tự kiểm toán chỉ qua khai báo capability.

### Khi nào nên chọn native

Ba lý do duy nhất, đều liên quan tới tính năng cần tích hợp lúc build với site host:

1. **Trang/widget admin React tuỳ chỉnh** — plugin sandboxed mô tả admin UI bằng Block Kit (schema JSON). Cần React đầy đủ (custom hook, component bên thứ ba, state phức tạp) thì cần native.
2. **Component Astro render khối Portable Text trên trang công khai** — plugin sandboxed khai báo được loại khối tuỳ chỉnh, nhưng component Astro render nó phải nạp lúc build từ npm — chỉ plugin native cung cấp được `componentsEntry`.
3. **Chèn HTML/script/stylesheet thô vào trang công khai** — hook `page:fragments` gửi code vào trình duyệt khách, ngoài mọi ranh giới sandbox, nên chỉ dành cho plugin native. Plugin sandboxed vẫn đóng góp được vào trang công khai qua hook `page:metadata` (thẻ `meta`/`property`, thẻ `link` với allowlist rel giới hạn bảo mật, đồ thị JSON-LD) — nếu nhu cầu "chèn trang" của bạn chỉ là dữ liệu có cấu trúc/SEO metadata, ở lại sandboxed.

Nếu chưa chắc, chọn sandboxed — luôn có thể chuyển sang native sau, nhưng chiều ngược lại khó hơn vì tính năng chỉ-native không có tương đương trong sandbox.

> Plugin sandboxed và native dùng cùng tên hook, cùng API `PluginContext`, cùng helper storage và KV — lựa chọn định dạng chỉ thay đổi cách đóng gói và tính năng thêm, không đổi code bạn viết hàng ngày trong hook và route.

### Sandbox runner và hỗ trợ nền tảng

Bản thân sandbox có thể cắm thay thế (pluggable). EmDash expose tuỳ chọn cấu hình `sandboxRunner`, runner quyết định cách cách ly code plugin — không có gì đặc thù-Cloudflare trong định dạng plugin. Runner phổ biến nhất hiện nay là `sandbox()` từ `@emdash-cms/cloudflare`, dùng Dynamic Worker Loader của Cloudflare Workers.

Nếu không cấu hình runner, hoặc runner đã cấu hình báo không khả dụng trên nền tảng hiện tại, plugin trong `sandboxed: []` bị bỏ qua lúc khởi động (log mức debug). Muốn plugin sandboxed chạy trên nền tảng không có sandbox runner, chuyển nó từ `sandboxed: []` sang `plugins: []` — nó sẽ chạy in-process (capability vẫn được tôn trọng, nhưng không có ranh giới cách ly hay giới hạn tài nguyên).

## Hai phần của một Plugin sandboxed

1. **`emdash-plugin.jsonc`** — [manifest](#viết-manifest) tự sửa tay: định danh, hợp đồng tin cậy (capability, host, storage), field profile. Không có code.
2. **`src/plugin.ts`** — phần runtime: hook và route. Chỉ import type từ `emdash/plugin`, không import runtime `emdash`.

`emdash-plugin build` đọc cả hai và sinh ra artifact trong `dist/` mà site tiêu thụ.

```
my-plugin/
├── emdash-plugin.jsonc   # Định danh + hợp đồng tin cậy + profile
├── src/
│   └── plugin.ts         # Hook, route — chạy trong sandbox runtime
├── package.json
└── tsconfig.json
```

> **Cách nhanh:** `npx @emdash-cms/plugin-cli init my-plugin` scaffold sẵn mọi thứ (manifest, `src/plugin.ts`, `package.json`, `tsconfig.json`, một test). Phần dưới giải thích những gì lệnh này sinh ra để bạn hiểu và tự sửa được.

## Thiết lập gói

`package.json` (build là `emdash-plugin build`, không có lệnh `tsdown` riêng):

```json title="package.json"
{
	"name": "@my-org/plugin-hello",
	"version": "0.1.0",
	"type": "module",
	"main": "dist/index.mjs",
	"exports": {
		".": { "import": "./dist/index.mjs", "types": "./dist/index.d.mts" },
		"./sandbox": "./dist/plugin.mjs"
	},
	"files": ["dist", "emdash-plugin.jsonc"],
	"scripts": {
		"build": "emdash-plugin build",
		"dev": "emdash-plugin dev"
	},
	"peerDependencies": { "emdash": ">=0.13.0" },
	"devDependencies": {
		"@emdash-cms/plugin-cli": "0.2.0",
		"emdash": ">=0.13.0",
		"typescript": "^5.9.0"
	}
}
```

`"."` là descriptor sinh ra mà site sẽ import; `"./sandbox"` là file runtime đã build.

`tsconfig.json`:

```json title="tsconfig.json"
{
	"compilerOptions": {
		"target": "ES2022",
		"module": "preserve",
		"moduleResolution": "bundler",
		"strict": true,
		"esModuleInterop": true,
		"verbatimModuleSyntax": true,
		"skipLibCheck": true,
		"types": []
	},
	"include": ["src/**/*"],
	"exclude": ["node_modules"]
}
```

## Viết Manifest (`emdash-plugin.jsonc`)

File này ở dạng **JSONC** (cho phép comment và dấu phẩy cuối). Mang định danh plugin, hợp đồng tin cậy, và field profile registry hiển thị.

```jsonc title="emdash-plugin.jsonc"
{
	"$schema": "./node_modules/@emdash-cms/plugin-cli/schemas/emdash-plugin.schema.json",

	"slug": "gallery",
	"publisher": "did:plc:abc123def456",

	"license": "MIT",
	"author": { "name": "Jane Doe", "url": "https://example.com" },
	"security": { "email": "security@example.com" },

	// Profile tuỳ chọn
	"name": "Gallery",
	"description": "Image gallery block for EmDash.",
	"keywords": ["gallery", "images"],
	"repo": "https://github.com/example/plugin-gallery",

	// Hợp đồng tin cậy
	"capabilities": ["content:read"],
	"allowedHosts": [],
	"storage": {}
}
```

### Định danh

| Field | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `slug` | Có | ID an toàn URL trong namespace publisher, khớp `/^[a-z][a-z0-9_-]*$/`, tối đa 64 ký tự — **không phải** tên gói npm |
| `publisher` | Có | DID hoặc handle tài khoản Atmosphere của bạn (xem "Publisher pinning" bên dưới) |
| `version` | Không | Semver 2.0 không kèm build-metadata — thường bỏ qua |

`slug` là một path segment trong URL route plugin (`/_emdash/api/plugins/<slug>/...`) và một phần định danh SQL cho index storage — `@`, `/`, số ở đầu, và chữ hoa đều không hợp lệ.

**`version` sống trong `package.json`:** build đối chiếu `version` của manifest với `package.json#version` — cả hai đặt và bằng nhau thì ổn; đặt khác nhau thì lỗi cứng; chỉ một nơi đặt thì giá trị đó thắng; không nơi nào đặt thì lỗi cứng. Khuyến nghị: **bỏ `version` khỏi manifest**, để `package.json` là nguồn sự thật duy nhất.

### Profile

`license`, một author (`author`/`authors`), và một liên hệ bảo mật (`security`/`securityContacts`) là bắt buộc; còn lại tuỳ chọn: `name` (mặc định = slug), `description` (~140 ký tự), `keywords` (≤5), `repo`.

### Hợp đồng tin cậy (`capabilities`, `allowedHosts`, `storage`)

Cả ba mặc định rỗng — plugin không cần đặc quyền thêm có thể bỏ qua hoàn toàn.

```jsonc
{
	"capabilities": ["network:request", "content:read"],
	"allowedHosts": ["api.example.com", "*.cdn.example.com"],
	"storage": {
		"events": { "indexes": ["timestamp"] },
		"submissions": { "indexes": ["email"], "uniqueIndexes": ["token"] }
	}
}
```

> **Đổi hợp đồng tin cậy cần tăng version:** site đã cài đã đồng ý (consent) với capability/host/storage của phiên bản họ đang dùng. Đổi bất kỳ thứ nào trong số này mà không tăng `version` sẽ để hành vi mới lách qua sự đồng ý đó — tăng **major** khi mở rộng hợp đồng tin cậy.

**Capability được công nhận:**

| Capability | Cấp quyền |
| --- | --- |
| `content:read` / `content:write` | Đọc/sửa nội dung site qua `ctx` |
| `taxonomies:read` | Đọc định nghĩa và term taxonomy (chỉ đọc) |
| `media:read` / `media:write` | Đọc/ghi media |
| `users:read` | Đọc bản ghi user |
| `email:send` | Gửi email qua `ctx` |
| `network:request` | HTTP ra ngoài qua `ctx.http`, giới hạn `allowedHosts` |
| `network:request:unrestricted` | HTTP ra ngoài tới mọi host (dùng thay `network:request`) |
| `hooks.email-transport:register` | Đăng ký hook transport email |
| `hooks.email-events:register` | Đăng ký hook vòng đời email |
| `hooks.page-fragments:register` | Đăng ký hook `page:fragments` (chỉ native) |

Hai quy tắc chéo field CLI thực thi (schema check của editor **không** kiểm tra — chạy `emdash-plugin validate`): `network:request` **yêu cầu** `allowedHosts` không rỗng; `network:request:unrestricted` **yêu cầu** `allowedHosts` rỗng.

**Storage:** map tên collection → cấu hình index. Tên collection theo `/^[a-z][a-z0-9_]*$/`. Index là tên field hoặc mảng composite; `uniqueIndexes` cũng truy vấn được — không liệt kê trùng trong `indexes`.

### Bề mặt Admin (tuỳ chọn)

Plugin sandboxed render trang admin và widget dashboard qua Block Kit (xem [Chương 41](./41-block-kit-field-kit.md)) — manifest chỉ khai nơi chúng xuất hiện:

```jsonc
"admin": {
	"pages": [{ "path": "/gallery", "label": "Gallery", "icon": "image" }],
	"widgets": [{ "id": "recent-uploads", "title": "Recent uploads", "size": "half" }]
}
```

Plugin khai `admin.pages` hoặc `admin.widgets` phải phục vụ một route `admin` trong `src/plugin.ts` render nội dung Block Kit tương ứng.

### Publisher pinning

`publisher` gắn cố định danh tính publish, tránh publish nhầm dưới tài khoản sai. Lần **publish thành công đầu tiên**, nếu `publisher` khớp session hiện tại, giữ nguyên; nếu để trống lúc scaffold, CLI tự ghi DID của session hiện tại vào manifest. Mỗi lần publish **sau đó**, CLI resolve session hiện tại và `publisher` đã ghim thành DID rồi so sánh — không khớp thì lỗi ngay `MANIFEST_PUBLISHER_MISMATCH`, không có cờ ghi đè. Xử lý: sai session thì `emdash-plugin switch <did>`; thật sự chuyển plugin sang publisher mới thì tự sửa `publisher` trong manifest.

> Nên ghim DID (`did:plc:...`) thay vì handle cho plugin sống lâu dài — handle có thể đổi chủ, publish sẽ bị từ chối nếu handle sau này trỏ đi nơi khác.

### Validate không publish

```sh
emdash-plugin validate          # ./emdash-plugin.jsonc
emdash-plugin validate path/    # thư mục cụ thể
```

Kiểm tra schema offline với chẩn đoán kiểu `tsc` (`file:line:column`), gồm cả quy tắc chéo field — phù hợp cho pre-commit hook hoặc bước CI. Key trùng lặp và key lạ đều là lỗi (strict mode bắt được lỗi gõ như `"licens"`).

## Viết Runtime (`src/plugin.ts`)

Default-export một object trơn gắn `satisfies SandboxedPlugin`. `emdash/plugin` chỉ cung cấp type, nên plugin sandboxed không phụ thuộc runtime vào `emdash`.

Ví dụ: log mỗi lần lưu nội dung vào storage của plugin, và expose route `recent` trả về 10 lượt lưu gần nhất:

```typescript title="src/plugin.ts"
import type { SandboxedPlugin } from "emdash/plugin";

export default {
	hooks: {
		"content:afterSave": {
			handler: async (event, ctx) => {
				ctx.log.info("Content saved", {
					collection: event.collection,
					id: event.content.id,
				});

				await ctx.storage.events.put(`save-${Date.now()}`, {
					timestamp: new Date().toISOString(),
					collection: event.collection,
					contentId: event.content.id,
				});
			},
		},
	},

	routes: {
		recent: {
			handler: async (_routeCtx, ctx) => {
				const result = await ctx.storage.events.query({ limit: 10 });
				return { events: result.items };
			},
		},
	},
} satisfies SandboxedPlugin;
```

Ghi chú: `satisfies SandboxedPlugin` gõ kiểu mọi thứ (suy luận `event` từ tên hook, `ctx` là `PluginContext` — không cần chú thích tham số; key hook gõ sai như `"content:afterSav"` là lỗi compile). Handler hook nhận `(event, ctx)`; handler route nhận `(routeCtx, ctx)` — `routeCtx` là `{ input, request, requestMeta? }`. Route truy cập được tại `/_emdash/api/plugins/<slug>/<route-name>`. `ctx.storage.events` hoạt động vì `events` đã khai trong manifest. `ctx.kv` luôn khả dụng — kho key-value riêng cho plugin với `get`/`set`/`delete`/`list(prefix)`.

## Đăng ký Plugin

Trong `astro.config.mjs` của site, import default export của plugin và truyền vào. Plugin sandboxed đi vào `sandboxed: []`; plugin in-process đi vào `plugins: []` — một plugin sandboxed hoạt động được ở cả hai:

```typescript title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { sandbox } from "@emdash-cms/cloudflare";
import hello from "@my-org/plugin-hello";

export default defineConfig({
	integrations: [
		emdash({
			sandboxed: [hello],
			sandboxRunner: sandbox(),
		}),
	],
});
```

> **Runner Cloudflare cần Worker Loader:** `wrangler.jsonc` cần binding `worker_loaders`:
> ```jsonc title="wrangler.jsonc"
> { "worker_loaders": [{ "binding": "LOADER" }] }
> ```
> Thiếu binding này, runner báo không khả dụng lúc khởi động và plugin sandboxed bị bỏ qua.

## Build và chạy

```sh
emdash-plugin validate   # kiểm schema manifest trước
emdash-plugin build      # sinh dist/
```

Với vòng lặp sửa code, chạy `emdash-plugin dev` (rebuild mỗi lần lưu, giữ `dist/` tốt gần nhất nếu build lỗi). Trong site, cài hoặc link plugin (`pnpm add file:../plugin-hello` hoặc workspace link) rồi chạy dev server — lưu một nội dung trong admin sẽ thấy `Content saved …` trong log; `GET /_emdash/api/plugins/plugin-hello/recent` trả về 10 sự kiện lưu gần nhất.

## Xem thêm

- [Chương 20 — Cài đặt & Quản lý Plugin (người dùng cuối)](./20-cai-dat-plugin.md)
- [Chương 37 — Hooks & vòng đời sự kiện](./37-hooks-vong-doi.md)
- [Chương 40 — API Routes & Capabilities của Plugin](./40-api-routes-capabilities.md)
- [Chương 41 — Giao diện Plugin: Block Kit, Field Kit, Settings](./41-block-kit-field-kit.md)
- [Chương 42 — Lưu trữ dữ liệu Plugin & CLI plugin](./42-luu-tru-cli-plugin.md)
- [Chương 43 — Phát hành Plugin lên Registry](./43-phat-hanh-plugin.md)
- [Chương 44 — Plugin Native (nâng cao)](./44-plugin-native.md)
