# 44. Plugin Native (nâng cao)

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

Plugin native chạy cùng tiến trình với site Astro, có toàn quyền truy cập runtime — gồm trang admin React, component Portable Text, và page fragment. Nếu chưa quyết định giữa native và sandboxed, đọc lại [Chương 39](./39-viet-plugin-dau-tien.md) — native là định dạng dành cho plugin cần trang admin React, component render Portable Text, hoặc page fragment.

## Hai phần, trong một hoặc hai file

Giống plugin sandboxed, plugin native gồm 2 phần:

1. **Descriptor factory** — trả về `PluginDescriptor` với `format: "native"` cộng entrypoint liên quan tới admin. Được `astro.config.mjs` import lúc build.
2. **Hàm `createPlugin(options)`** — phía runtime, trả về kết quả `definePlugin({ id, version, capabilities, hooks, routes, admin })`.

Khác plugin sandboxed, cả hai phần có thể sống trong **cùng một file** vì không chạy ở môi trường khác nhau — toàn bộ plugin chạy in-process.

```
my-native-plugin/
├── src/
│   ├── index.ts          # Descriptor factory + createPlugin
│   ├── admin.tsx         # Component admin React (tuỳ chọn)
│   └── astro/            # Component Astro render khối PT (tuỳ chọn)
│       └── index.ts
├── package.json
└── tsconfig.json
```

## Thiết lập gói

```json title="package.json"
{
	"name": "@my-org/plugin-analytics",
	"version": "0.1.0",
	"type": "module",
	"main": "dist/index.js",
	"exports": {
		".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
		"./admin": { "types": "./dist/admin.d.ts", "import": "./dist/admin.js" }
	},
	"files": ["dist"],
	"peerDependencies": {
		"emdash": "*",
		"react": "^18.0.0"
	}
}
```

Giữ `emdash` và `react` làm peer dependency để site host cung cấp đúng phiên bản thật, tránh bundle trùng lặp.

## Viết Descriptor và Runtime

```typescript title="src/index.ts"
import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";

export interface AnalyticsOptions {
	enabled?: boolean;
	maxEvents?: number;
}

export function analyticsPlugin(options: AnalyticsOptions = {}): PluginDescriptor {
	return {
		id: "analytics",
		version: "0.1.0",
		format: "native",
		entrypoint: "@my-org/plugin-analytics",
		options,
		adminEntry: "@my-org/plugin-analytics/admin",
		adminPages: [{ path: "/dashboard", label: "Dashboard", icon: "chart" }],
		adminWidgets: [{ id: "events-today", title: "Events Today", size: "third" }],
	};
}

export function createPlugin(options: AnalyticsOptions = {}) {
	const maxEvents = options.maxEvents ?? 100;

	return definePlugin({
		id: "analytics",
		version: "0.1.0",
		capabilities: ["network:request"],
		allowedHosts: ["api.analytics.example.com"],
		storage: { events: { indexes: ["type", "createdAt"] } },

		admin: {
			entry: "@my-org/plugin-analytics/admin",
			settingsSchema: {
				trackingId: { type: "string", label: "Tracking ID" },
				enabled: { type: "boolean", label: "Enabled", default: options.enabled ?? true },
			},
			pages: [{ path: "/dashboard", label: "Dashboard", icon: "chart" }],
			widgets: [{ id: "events-today", title: "Events Today", size: "third" }],
		},

		hooks: {
			"plugin:install": async (_event, ctx) => {
				ctx.log.info("Analytics plugin installed", { maxEvents });
			},
			"content:afterSave": async (event, ctx) => {
				const enabled = await ctx.kv.get<boolean>("settings:enabled");
				if (enabled === false) return;
				await ctx.storage.events.put(`evt_${Date.now()}`, {
					type: "content:save",
					contentId: event.content.id,
					createdAt: new Date().toISOString(),
				});
			},
		},

		routes: {
			stats: {
				handler: async (ctx) => {
					const today = new Date().toISOString().split("T")[0];
					const count = await ctx.storage.events.count({ createdAt: { gte: today } });
					return { today: count };
				},
			},
		},
	});
}

export default createPlugin;
```

Điểm cần chú ý:

- **`format: "native"` là bắt buộc.** `"native"` cũng là mặc định, nhưng nêu tường minh trên mọi descriptor giúp dễ nhận ra định dạng.
- **`entrypoint` là export chính của gói.** EmDash import nó lúc runtime và gọi default export để dựng plugin đã resolve.
- **`options` chảy từ descriptor → `createPlugin`.** Bất cứ gì user truyền lúc đăng ký plugin (`analyticsPlugin({ enabled: false })`) được giữ trên descriptor và chuyển tiếp vào `createPlugin` — plugin sandboxed **không có** bề mặt này, chúng đọc cài đặt từ KV thay thế.
- **`id`, `version`, `capabilities` xuất hiện 2 lần** — một lần trên descriptor, một lần trên `definePlugin()`, phải khớp nhau. Bản sao trên descriptor là thứ `astro.config.mjs` thấy lúc build; bản sao `definePlugin()` là thứ chạy lúc request.
- **Handler route native nhận MỘT tham số duy nhất** — `(ctx: RouteContext)` với `ctx.input`, `ctx.request`, `ctx.requestMeta`, `ctx.user` (caller đã xác thực trên route riêng tư) gộp chung với thuộc tính `PluginContext` thông thường. Đây là điều **ngược lại** với hình dạng 2 tham số của plugin sandboxed (xem lại [Chương 40](./40-api-routes-capabilities.md)) — mọi thứ khác giống hệt.

### Quy tắc `id` Plugin

`id` phải khớp `/^[a-z][a-z0-9_-]*$/` — dùng làm một path segment trong URL route và một phần định danh SQL cho index storage. Hợp lệ: `"seo"`, `"audit-log"`, `"audit_log"`. Không hợp lệ: tên có scope (`"@my-org/plugin-forms"`), chữ hoa, bắt đầu bằng số, có dấu chấm. Ghép `id` không scope với tên gói npm có scope trong `entrypoint` — hai mối quan tâm tách biệt.

### Định dạng version

Dùng semantic versioning: `"1.0.0"` hợp lệ, `"1.2.3-beta"` hợp lệ (prerelease), `"1.0"` **không** hợp lệ (thiếu patch).

## Đăng ký Plugin

Trong `astro.config.mjs` của site, import descriptor factory và truyền vào mảng `plugins: []` — plugin native luôn chạy in-process, không bao giờ trong `sandboxed: []`:

```typescript title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { analyticsPlugin } from "@my-org/plugin-analytics";

export default defineConfig({
	integrations: [
		emdash({
			plugins: [analyticsPlugin({ enabled: true, maxEvents: 500 })],
		}),
	],
});
```

## Settings UI (native)

Cách đơn giản nhất — dùng `admin.settingsSchema` để tự sinh form:

```typescript
admin: {
	settingsSchema: {
		apiKey: { type: "secret", label: "API Key" },
		enabled: { type: "boolean", label: "Enabled", default: true },
		maxItems: { type: "number", label: "Max items", min: 1, max: 1000, default: 100 },
	},
},
```

Kiểu field: `string`, `number`, `boolean`, `select`, `secret`, `url`, `email` — mỗi kiểu nhận `label`, `description`, `default`, cộng field bổ sung theo kiểu (`min`/`max`/`options`). Cài đặt lưu trong cùng kho KV riêng-plugin mà plugin sandboxed dùng — đọc bằng `ctx.kv.get<T>("settings:<key>")` từ bất kỳ đâu. Form tự sinh xuất hiện sau icon bánh răng trên thẻ plugin trong **Plugins** (chỉ admin — cần permission `plugins:manage`). Field secret chỉ ghi — admin không bao giờ thấy giá trị đã lưu, chỉ biết đã đặt hay chưa.

Với UI cài đặt phong phú hơn `settingsSchema`, đóng gói trang React tuỳ chỉnh — xem mục tiếp theo.

## React Admin Pages và Widgets

Plugin native mở rộng admin panel bằng trang React tuỳ chỉnh, widget dashboard, widget field, và cột content-list — plugin sandboxed mô tả UI bằng Block Kit thay thế (đóng gói JavaScript plugin vào admin sẽ phá vỡ cách ly sandbox).

### Entry point Admin

Plugin có admin UI export object `pages` và `widgets` từ entrypoint `admin`:

```typescript title="src/admin.tsx"
import { SEOSettingsPage } from "./components/SEOSettingsPage";
import { SEODashboardWidget } from "./components/SEODashboardWidget";

export const widgets = { "seo-overview": SEODashboardWidget };
export const pages = { "/settings": SEOSettingsPage };
```

Cấu hình entry point trong `package.json` (`"./admin": "./dist/admin.js"`), tham chiếu từ `definePlugin()` qua `admin.entry`, và descriptor cần `adminEntry` khớp để EmDash biết tìm component ở đâu lúc build.

### Trang Admin

Component React mount dưới `/_emdash/admin/plugins/<plugin-id>/<path>`. Khai mỗi trang dưới `admin.pages` với `path`, `label`, `icon`. Khai `label` bằng tiếng Anh — admin chạy chúng qua instance [Lingui](https://lingui.dev/) dùng chung trước khi render sidebar/command palette, nên plugin tự nạp catalog message (dùng label tiếng Anh làm message id) sẽ được bản địa hoá điều hướng miễn phí; label trùng với message có sẵn của admin (`Settings`, `Dashboard`...) tự nhận bản dịch của admin.

Component trang đọc/ghi cài đặt qua hook API plugin (`usePluginAPI()`).

### `usePluginAPI()`

Gọi route của plugin bạn với tiền tố id plugin và header CSRF `X-EmDash-Request: 1` tự thêm:

```typescript
import { usePluginAPI } from "@emdash-cms/admin";

function MyComponent() {
	const api = usePluginAPI();
	const data = await api.get("status");              // GET /_emdash/api/plugins/<id>/status
	await api.post("settings/save", { enabled: true }); // POST kèm JSON body
	const result = await api.get("history?limit=50");   // hỗ trợ query param
}
```

### Widget Dashboard

Xuất hiện trên dashboard admin, cung cấp thông tin nhìn thoáng qua. Khai dưới `admin.widgets` với `id`, `title`, `size` (`"full"`/`"half"`/`"third"` — dashboard width tương ứng, wrap tự động theo chiều rộng màn hình).

### Panel Content Editor

Plugin React tin cậy thêm section vào sidebar cài đặt cho entry nội dung đã lưu. EmDash sở hữu heading/vị trí section, áp bộ lọc Collection và vai trò, cách ly lỗi render (một panel plugin không thể unmount cả editor):

```tsx title="src/admin.tsx"
import type { ContentEditorPanelContext } from "@emdash-cms/admin";

function ContentInsights({ entry, locale }: ContentEditorPanelContext) {
	return <p>Analysis for {entry.slug} in {locale ?? "the default locale"}</p>;
}

export const contentEditorPanels = [
	{
		id: "content-insights",
		title: "Content insights",
		component: ContentInsights,
		collections: ["posts", "pages"],
		minRole: 40,
		order: 10,
	},
];
```

Mỗi panel nhận `entry` đã lưu, `collection`, `locale` đã resolve — không mount cho entry mới chưa lưu. `collections` có thể là mảng hoặc predicate, bỏ qua để hỗ trợ mọi Collection. `order` nhỏ hơn render trước. ID panel phải duy nhất trong plugin — thực thi phân quyền trong route API plugin thay vì chỉ dựa vào `minRole` (chỉ kiểm soát hiển thị, không phải authorization).

> Điểm mở rộng này chỉ dành cho plugin React tin cậy — plugin sandboxed không thực thi được component React trong admin host.

### Cột Content-list

Plugin React tin cậy thêm cột chỉ-đọc vào danh sách Collection nội dung đang hoạt động. EmDash giữ quyền sở hữu bảng, phân trang, hành động dòng, trạng thái loading/rỗng — plugin chỉ cung cấp metadata header và nội dung ô:

```typescript title="src/admin.tsx"
export const contentListColumns = [
	{
		id: "review-status",
		label: "Review status",
		collections: ["posts", "pages"],
		order: 10,
		align: "end",
		cell: ReviewStatusCell,
	},
] satisfies readonly ContentListColumnExtension[];
```

Mỗi component cell mount một lần mỗi dòng hiển thị. Khi cột cần dữ liệu chưa có sẵn trên `item`, dùng `visibleItems` để gộp yêu cầu cả trang thành một batch (dùng chung React Query key) — **không** fetch metadata chỉ bằng `item.id` bên trong một cell (trang 20 dòng sẽ tạo 20 request). Cột chỉ mang tính hiển thị — sắp xếp/lọc phía server cần một hợp đồng data-provider riêng của host, không hỗ trợ qua API này. Cột không hiện trong Trash; ID cột chỉ cần duy nhất trong plugin, thứ tự theo `order` rồi tới plugin id/column id; plugin bị tắt bị bỏ qua, lỗi định nghĩa/render được cách ly.

### Cấu trúc export

Entry point admin export mỗi đóng góp trực tiếp: `pages` (object path → component), `widgets` (object id → component), `contentListColumns` (mảng). Path trong `pages` phải khớp giá trị `path` trong `admin.pages` (dấu `/` cuối coi như tương đương); key `widgets` phải khớp `id` trong `admin.widgets`. Cột content-list được phát hiện trực tiếp từ entry point admin tin cậy, không cần entry descriptor riêng.

### Dùng component Admin có sẵn

EmDash cung cấp component dựng sẵn cho mẫu thường gặp: `Card`, `Button`, `Input`, `Select`, `Toggle`, `Table`, `Pagination`, `Alert`, `Loading` — import từ `@emdash-cms/admin`.

### Điều hướng

Trang plugin xuất hiện trong sidebar admin dưới tên plugin, thứ tự theo mảng `admin.pages`.

### Cấu hình Build

Component admin cần entry point build riêng:

```typescript title="tsdown.config.ts"
export default {
	entry: { index: "src/index.ts", admin: "src/admin.tsx" },
	format: "esm",
	dts: true,
	external: ["react", "react-dom", "emdash", "@emdash-cms/admin"],
};
```

Giữ React và EmDash admin làm dependency ngoài để tránh bundle trùng lặp.

### Bật/tắt Plugin

Khi plugin bị tắt trong admin: link sidebar ẩn, widget dashboard không render, cột content-list không render, trang admin trả 404 — nhưng **hook backend vẫn thực thi** (vì an toàn dữ liệu). Plugin kiểm tra trạng thái bật bằng `await ctx.kv.get<boolean>("_emdash:enabled")`.

## Quy tắc `id` Plugin và Testing

Test plugin native bằng cách tạo một site Astro tối giản đã đăng ký plugin, chạy dev server, kích hoạt hook bằng cách tạo/sửa/xoá nội dung, kiểm tra output `ctx.log` và storage qua route API. Với unit test, mock interface `PluginContext` và gọi thẳng handler hook.

## Xem thêm

- [Chương 39 — Viết Plugin đầu tiên (sandboxed)](./39-viet-plugin-dau-tien.md)
- [Chương 40 — API Routes & Capabilities của Plugin](./40-api-routes-capabilities.md)
- [Chương 41 — Giao diện Plugin: Block Kit, Field Kit, Settings](./41-block-kit-field-kit.md)
- [Chương 45 — Plugin Native: Page Fragments & Portable Text Components](./45-page-fragments-portable-text.md)
