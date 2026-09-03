# 41. Giao diện Plugin: Block Kit, Field Kit, Settings

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

Chương này gồm ba chủ đề liên quan tới giao diện của plugin: **Block Kit** (hệ UI khai báo cho trang admin/widget của plugin sandboxed), **Field Kit** (4 widget field JSON dựng sẵn, dùng plugin có sẵn của EmDash), và **Settings** (cách plugin sandboxed lưu và hiển thị cài đặt qua KV + Block Kit).

## Block Kit

Block Kit cho phép plugin sandboxed mô tả admin UI của nó bằng JSON — host render các block, **không có JavaScript do plugin cung cấp nào chạy trong trình duyệt**.

> Plugin native có thể tự đóng gói component React cho trang admin. Block Kit là hệ admin UI dành cho plugin sandboxed, nơi đóng gói React sẽ phá vỡ cách ly sandbox.
>
> Element Block Kit cũng dùng cho field editing của khối Portable Text (xem [Chương 45](./45-page-fragments-portable-text.md)) — khi plugin khai `fields` trên một block type, editor render một form Block Kit để sửa dữ liệu block.

### Cách hoạt động

1. User vào trang admin của plugin.
2. Admin gửi tương tác `page_load` tới route admin của plugin.
3. Plugin trả về `BlockResponse` chứa mảng block.
4. Admin render block bằng component `BlockRenderer`.
5. Khi user tương tác (nhấn nút, submit form), admin gửi tương tác đó ngược lại cho plugin.
6. Plugin trả block mới, vòng lặp tiếp tục.

```typescript
import type { SandboxedPlugin } from "emdash/plugin";

interface BlockInteraction {
	type: "page_load" | "block_action" | "form_submit";
	page?: string;
	action_id?: string;
	values?: Record<string, unknown>;
}

export default {
	routes: {
		admin: {
			handler: async (routeCtx, ctx) => {
				const interaction = routeCtx.input as BlockInteraction;

				if (interaction.type === "page_load") {
					return {
						blocks: [
							{ type: "header", text: "My Plugin Settings" },
							{
								type: "form",
								block_id: "settings",
								fields: [
									{ type: "text_input", action_id: "api_url", label: "API URL" },
									{ type: "toggle", action_id: "enabled", label: "Enabled", initial_value: true },
								],
								submit: { label: "Save", action_id: "save" },
							},
						],
					};
				}

				if (interaction.type === "form_submit" && interaction.action_id === "save") {
					await ctx.kv.set("settings", interaction.values);
					return {
						blocks: [/* ... block đã cập nhật ... */],
						toast: { message: "Settings saved", type: "success" },
					};
				}

				return { blocks: [] };
			},
		},
	},
} satisfies SandboxedPlugin;
```

Handler route nhận 2 tham số: `routeCtx` (`input`, `request`, `requestMeta`) và `ctx` (`PluginContext`) — `satisfies SandboxedPlugin` suy luận cả hai.

### Loại Block

| Loại | Mô tả |
| --- | --- |
| `header` | Tiêu đề đậm, cỡ lớn |
| `section` | Văn bản kèm phần tử phụ tuỳ chọn |
| `divider` | Đường kẻ ngang |
| `fields` | Lưới label/value 2 cột |
| `table` | Bảng dữ liệu có định dạng, sắp xếp, phân trang |
| `actions` | Hàng ngang gồm nút và control |
| `stats` | Thẻ chỉ số dashboard kèm chỉ báo xu hướng |
| `form` | Field nhập liệu có hiển thị điều kiện và submit |
| `image` | Ảnh cấp block kèm caption |
| `context` | Văn bản trợ giúp nhỏ, mờ |
| `columns` | Layout 2-3 cột chứa block lồng nhau |
| `empty` | Placeholder trạng thái rỗng (icon, tiêu đề, mô tả, dòng lệnh tuỳ chọn, nút hành động) |
| `accordion` | Section thu gọn được, bọc block lồng nhau |

### Loại Element

| Loại | Mô tả |
| --- | --- |
| `button` | Nút hành động, có thể kèm hộp thoại xác nhận |
| `text_input` | Nhập văn bản một/nhiều dòng |
| `number_input` | Nhập số có min/max |
| `select` | Dropdown chọn |
| `toggle` | Công tắc bật/tắt |
| `secret_input` | Nhập bị che (mask) cho API key/token |

### Builder helper

Gói `@emdash-cms/blocks` export helper để code gọn hơn:

```typescript
import { blocks, elements } from "@emdash-cms/blocks";

const { header, form, section, stats } = blocks;
const { textInput, toggle, select, button } = elements;

return {
	blocks: [
		header("SEO Settings"),
		form({
			blockId: "settings",
			fields: [
				textInput("site_title", "Site Title", { initialValue: "My Site" }),
				toggle("generate_sitemap", "Generate Sitemap", { initialValue: true }),
				select("robots", "Default Robots", [
					{ label: "Index, Follow", value: "index,follow" },
					{ label: "No Index", value: "noindex,follow" },
				]),
			],
			submit: { label: "Save", actionId: "save" },
		}),
	],
};
```

### Field điều kiện

Field form hiện được theo điều kiện dựa trên giá trị field khác:

```json
{ "type": "toggle", "action_id": "auth_enabled", "label": "Enable Authentication" }
```
```json
{
	"type": "secret_input",
	"action_id": "api_key",
	"label": "API Key",
	"condition": { "field": "auth_enabled", "eq": true }
}
```

Field `api_key` chỉ hiện khi `auth_enabled` bật. Điều kiện đánh giá phía client, không round-trip.

> Dùng [Block Playground](https://emdash-blocks.cto.cloudflare.dev/) để dựng và thử layout block tương tác.

## Field Kit

Loại field `json` của EmDash lưu dữ liệu có cấu trúc tuỳ ý, mặc định sửa qua ô nhập một dòng chứa JSON thô. **Field Kit** là plugin chính thức cung cấp 4 widget kết hợp được (composable) cho field `json`, cấu hình hoàn toàn qua `options` trong seed — người dựng site dùng được chỉ bằng seed schema.

> Widget Field Kit lưu **JSON sạch** — giá trị lưu trữ là dữ liệu nội dung thuần, nên gỡ plugin vẫn để lại nội dung hợp lệ.

### Cài đặt

```bash
npm i @emdash-cms/plugin-field-kit
```

```typescript title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { fieldKitPlugin } from "@emdash-cms/plugin-field-kit";

export default defineConfig({
	integrations: [
		emdash({
			plugins: [fieldKitPlugin()],
		}),
	],
});
```

Gắn widget vào field `json` bằng cách đặt `widget` thành `field-kit:<name>`:

```json
{
	"slug": "ingredients",
	"type": "json",
	"widget": "field-kit:list",
	"options": { "fields": [...] }
}
```

Nếu widget thiếu `options` bắt buộc, editor hiện cảnh báo "Widget misconfigured" nội tuyến thay vì ô nhập hỏng.

### 4 Widget

| Widget | Dùng cho | Giá trị lưu |
| --- | --- | --- |
| `object-form` | Form nội tuyến cho object JSON phẳng | `{ key: value, ... }` |
| `list` | Trình sửa mảng có thứ tự: thêm/xoá/sắp xếp lại | `[{ ... }, ...]` |
| `grid` | Ma trận hàng × cột | `{ rowKey: { colKey: value } }` |
| `tags` | Nhập chip/tag tự do | `["tag1", "tag2"]` |

**`object-form`** — nhóm sub-field có kiểu, lưu thành một object JSON. Phù hợp dữ liệu cấu trúc cố định (thông tin dinh dưỡng, thông tin liên hệ). Tuỳ chọn: `fields` (bắt buộc), `collapsed` (mặc định `false`), `helpText`.

**`list`** — trình sửa mảng có thứ tự, mỗi dòng là object JSON theo `fields`. Tiêu đề dòng render từ template kiểu Mustache. Tuỳ chọn: `fields` (bắt buộc), `itemLabel` (mặc định `"Item"`), `min`, `max`, `sortable` (mặc định `true`), `summary` (template Mustache cho tiêu đề dòng thu gọn), `helpText`.

**`grid`** — ma trận 2 chiều hàng × cột, mỗi ô là toggle/text/number/select. Phù hợp bảng như mùa vụ có sẵn, bảng giá, so sánh tính năng. Tuỳ chọn: `rows`/`columns` (bắt buộc, `{ key, label, image? }`), `cell` (`"toggle"`/`"text"`/`"number"`/`"select"`, mặc định `"toggle"`), `cellOptions` (bắt buộc khi `cell` là `"select"`), `helpText`.

**`tags`** — nhập kiểu chip cho mảng chuỗi, hỗ trợ danh sách gợi ý cố định, giá trị tự do (bật/tắt được), biến đổi chữ hoa/thường, `max` tuỳ chọn. Nhấn <kbd>Enter</kbd> hoặc `,` để chốt một tag; <kbd>Backspace</kbd> trên ô rỗng xoá tag cuối; tag trùng bị bỏ qua âm thầm. Tuỳ chọn: `placeholder`, `max`, `suggestions`, `allowCustom` (mặc định `true`), `transform` (`"none"`/`"lowercase"`/`"uppercase"`/`"trim"`), `helpText`.

### Sub-field (dùng trong `object-form` và `list`)

`options.fields` là mảng định nghĩa sub-field có kiểu, mỗi entry có `key` (tên field trong object JSON), `label`, `type`, và field bổ sung theo kiểu:

| Kiểu sub-field | Render thành | Field bổ sung đáng chú ý |
| --- | --- | --- |
| `text` | Ô nhập một dòng | `placeholder` |
| `textarea` | Ô nhập nhiều dòng | `rows` (mặc định 3), `placeholder` |
| `number` | Ô nhập số | `min`, `max`, `step`, `prefix`, `suffix`, `placeholder` |
| `boolean` | Công tắc | — |
| `select` | Dropdown | `options`, `placeholder` |
| `date` | Ô nhập ngày | — |
| `color` | Bộ chọn màu gốc kèm ô nhập hex | — |
| `url` | Ô nhập URL (HTML5 `type="url"`) | `placeholder` |

Field chung mọi sub-field: `required`, `helpText`, `defaultValue`.

### Template tóm tắt (`summary`)

Widget `list` render tiêu đề mỗi dòng thu gọn bằng template kiểu Mustache trong `options.summary` — `{{key}}` thay bằng giá trị dòng ứng với key đó (ép thành chuỗi); giá trị falsy fallback về `"{itemLabel} {n}"`. Chỉ thay thế chuỗi thuần — không HTML, không biểu thức lồng nhau.

### Độ bền dữ liệu

Widget Field Kit lưu JSON thuần vào đúng cột hiện có của field. Nếu gỡ `@emdash-cms/plugin-field-kit` khỏi cấu hình, dữ liệu vẫn hợp lệ — field trở về ô nhập text JSON mặc định. Điều này áp dụng cả khi đổi hình dạng widget: key lạ trên object đã lưu được giữ nguyên ở lần ghi tiếp theo, nên có thể tiến hoá schema mà không mất dữ liệu đã ghi dưới tập field cũ hơn.

## Settings — cài đặt qua KV + Block Kit

Plugin sandboxed lưu cài đặt trong kho **KV** riêng của plugin, và render UI sửa dưới dạng trang Block Kit — mô tả form bằng JSON và phục vụ từ một route. Mọi thứ đi qua cùng bộ máy mà plugin đã dùng cho hook và route — không có gì thêm phải học.

### Kho KV

Mọi plugin có một kho key-value riêng tư truy cập qua `ctx.kv` trong bất kỳ hook/route nào:

```typescript
interface KVAccess {
	get<T>(key: string): Promise<T | null>;
	set(key: string, value: unknown): Promise<void>;
	delete(key: string): Promise<boolean>;
	list(prefix?: string): Promise<Array<{ key: string; value: unknown }>>;
}
```

KV theo từng plugin — key bạn ghi lưu dưới ID plugin của bạn, plugin khác không thấy được.

### Quy ước đặt tên key

| Tiền tố | Mục đích | Ví dụ |
| --- | --- | --- |
| `settings:` | Tuỳ chọn user tự cấu hình | `settings:apiKey` |
| `state:` | Trạng thái nội bộ của plugin | `state:lastSync` |
| `cache:` | Dữ liệu cache | `cache:results` |

### Trang Settings bằng Block Kit

Admin gửi tương tác `page_load` tới route của plugin (quy ước `routes.admin`), plugin trả về mô tả JSON của form. Khi user nhấn Save, admin gửi lại `block_action`/`form_submit`; plugin ghi vào KV và trả block đã cập nhật:

```typescript title="src/plugin.ts"
import type { PluginContext, SandboxedPlugin } from "emdash/plugin";

export default {
	routes: {
		admin: {
			handler: async (routeCtx, ctx) => {
				const interaction = routeCtx.input as BlockInteraction;

				if (interaction.type === "page_load" && interaction.page === "/settings") {
					return renderSettings(ctx);
				}

				if (interaction.type === "form_submit" && interaction.action_id === "save") {
					await saveSettings(ctx, interaction.values ?? {});
					return {
						...(await renderSettings(ctx)),
						toast: { message: "Settings saved", type: "success" },
					};
				}

				return { blocks: [] };
			},
		},
	},
} satisfies SandboxedPlugin;

async function renderSettings(ctx: PluginContext) {
	const apiKey = (await ctx.kv.get<string>("settings:apiKey")) ?? "";
	const enabled = (await ctx.kv.get<boolean>("settings:enabled")) ?? true;

	return {
		blocks: [
			{ type: "header", text: "Plugin settings" },
			{
				type: "form",
				block_id: "settings",
				fields: [
					{ type: "secret_input", action_id: "apiKey", label: "API key", initial_value: apiKey },
					{ type: "toggle", action_id: "enabled", label: "Enabled", initial_value: enabled },
				],
				submit: { label: "Save", action_id: "save" },
			},
		],
	};
}

async function saveSettings(ctx: PluginContext, values: Record<string, unknown>) {
	for (const [key, value] of Object.entries(values)) {
		if (value !== undefined) await ctx.kv.set(`settings:${key}`, value);
	}
}
```

Để nối trang settings vào sidebar admin, khai trong manifest:

```jsonc title="emdash-plugin.jsonc"
"admin": {
	"pages": [{ "path": "/settings", "label": "Settings", "icon": "settings" }]
}
```

EmDash tự định tuyến tương tác `page_load` cho path đó tới route `admin` của bạn.

### Giá trị bí mật (secret)

Field `secret_input` render dạng ô nhập bị che. **Không** seed `initial_value` bằng giá trị secret thật — truyền chuỗi rỗng hoặc giá trị đại diện, chỉ ghi đè khi user nhập giá trị không rỗng. Khi lưu, bỏ qua chuỗi rỗng để tránh xoá secret hiện có mỗi lần lưu:

```typescript
async function saveSettings(ctx: PluginContext, values: Record<string, unknown>) {
	if (typeof values.apiKey === "string" && values.apiKey.length > 0) {
		await ctx.kv.set("settings:apiKey", values.apiKey);
	}
}
```

### Giá trị mặc định

KV read trả `null` cho key chưa ghi — truyền default ngay tại nơi đọc (`?? true`), hoặc lưu default lúc cài trong hook `plugin:install`. Đánh đổi: `plugin:install` chỉ chạy một lần mỗi lượt cài — nếu ra field mới ở phiên bản sau, chỉ cài mới thấy default; cài có sẵn cần migration idempotent trong `plugin:activate` (chỉ ghi nếu thiếu) hoặc tiếp tục dùng fallback lúc đọc.

### Settings vs Storage vs KV

| Trường hợp dùng | Cơ chế |
| --- | --- |
| Tuỳ chọn admin sửa được | `ctx.kv` tiền tố `settings:` + trang Block Kit |
| Trạng thái nội bộ plugin | `ctx.kv` tiền tố `state:` |
| Collection tài liệu (truy vấn) | `ctx.storage` (xem [Chương 42](./42-luu-tru-cli-plugin.md)) |

**KV** dành cho giá trị nhỏ theo key chuỗi — cài đặt, con trỏ đồng bộ, kết quả tính toán đã cache. Không truy vấn, không index. **Storage** dành cho collection tài liệu có truy vấn index — bài nộp form, audit log, bất cứ gì cần lọc/phân trang/đếm.

KV lưu trong bảng `_options` với key theo namespace plugin — code bạn dùng `settings:apiKey`, EmDash lưu thành `plugin:<plugin-id-của-bạn>:settings:apiKey`, tiền tố tự thêm để plugin khác không đọc/ghi đè được.

> Plugin **native** có thể khai `settingsSchema` trực tiếp trong `definePlugin()` để EmDash tự sinh form — xem [Chương 44](./44-plugin-native.md).

## Xem thêm

- [Chương 39 — Viết Plugin đầu tiên (sandboxed)](./39-viet-plugin-dau-tien.md)
- [Chương 40 — API Routes & Capabilities của Plugin](./40-api-routes-capabilities.md)
- [Chương 42 — Lưu trữ dữ liệu Plugin & CLI plugin](./42-luu-tru-cli-plugin.md)
- [Chương 44 — Plugin Native (nâng cao)](./44-plugin-native.md)
- [Chương 45 — Plugin Native: Page Fragments & Portable Text Components](./45-page-fragments-portable-text.md)
