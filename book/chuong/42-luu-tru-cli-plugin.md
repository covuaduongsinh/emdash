# 42. Lưu trữ dữ liệu Plugin & CLI plugin

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

Chương này gồm hai chủ đề: **Storage** — lưu trữ dữ liệu riêng của plugin trong collection tài liệu có truy vấn index; và **CLI `emdash-plugin`** — bộ công cụ dòng lệnh cho toàn bộ vòng đời phát triển plugin.

## Lưu trữ (Storage)

Plugin sandboxed lưu dữ liệu riêng trong collection tài liệu. Bạn khai Collection và index trong manifest, EmDash tự tạo schema — không cần viết migration.

### Khai storage trong manifest

Với plugin sandboxed, `storage` nằm trong `emdash-plugin.jsonc` — phải thấy được lúc build để sandbox bridge biết plugin được phép chạm vào Collection nào:

```jsonc title="emdash-plugin.jsonc"
{
	"slug": "forms",
	"storage": {
		"submissions": {
			"indexes": [
				"formId",
				"status",
				"createdAt",
				["formId", "createdAt"],
				["status", "createdAt"]
			]
		},
		"forms": {
			"indexes": ["slug"]
		}
	}
}
```

Mỗi key trong `storage` là tên một collection. Mảng `indexes` liệt kê field truy vấn hiệu quả — index đơn field là chuỗi, index kết hợp (composite) là mảng chuỗi.

> Storage giới hạn theo slug plugin — collection `submissions` trong plugin `forms` hoàn toàn tách biệt với `submissions` trong plugin khác; plugin chỉ thấy dữ liệu của chính mình.

### Dùng Storage lúc runtime

Truy cập collection qua `ctx.storage` — hình dạng phản ánh đúng những gì đã khai trong manifest:

```typescript title="src/plugin.ts"
import type { SandboxedPlugin } from "emdash/plugin";

export default {
	hooks: {
		"content:afterSave": {
			handler: async (event, ctx) => {
				const { submissions } = ctx.storage;

				await submissions.put("sub_123", {
					formId: "contact",
					email: "user@example.com",
					status: "pending",
					createdAt: new Date().toISOString(),
				});

				const item = await submissions.get("sub_123");
				ctx.log.info("Stored submission", { id: item?.formId });
			},
		},
	},
} satisfies SandboxedPlugin;
```

Truy cập collection chưa khai trong manifest sẽ throw — bridge thực thi điều này ở tầng runtime.

### API Collection

```typescript
interface StorageCollection<T = unknown> {
	// CRUD cơ bản
	get(id: string): Promise<T | null>;
	put(id: string, data: T): Promise<void>;
	delete(id: string): Promise<boolean>;
	exists(id: string): Promise<boolean>;

	// Thao tác hàng loạt
	getMany(ids: string[]): Promise<Map<string, T>>;
	putMany(items: Array<{ id: string; data: T }>): Promise<void>;
	deleteMany(ids: string[]): Promise<number>;

	// Truy vấn (chỉ field đã index)
	query(options?: QueryOptions): Promise<PaginatedResult<{ id: string; data: T }>>;
	count(where?: WhereClause): Promise<number>;
}
```

### Truy vấn

```typescript
const result = await ctx.storage.submissions.query({
	where: { formId: "contact", status: "pending" },
	orderBy: { createdAt: "desc" },
	limit: 20,
});
// result.items — Array<{ id, data }>
// result.cursor — cursor phân trang (nếu còn kết quả)
// result.hasMore — boolean
```

`QueryOptions`: `where`, `orderBy` (`Record<string, "asc"|"desc">`), `limit` (mặc định 50, tối đa 1000), `cursor`.

**Toán tử where clause:** khớp chính xác (`status: "pending"`), khoảng (`{ gte, gt, lt, lte }`), trong danh sách (`{ in: [...] }`), bắt đầu bằng (`{ startsWith: "..." }`).

> Chỉ truy vấn và sắp xếp được theo field đã index — truy vấn trên field chưa index throw lỗi validation, ngăn quét toàn bảng ngoài ý muốn.

**Phân trang:** dùng vòng lặp `do...while` rút cạn cursor để duyệt hết mọi item khớp.

**Đếm:** `ctx.storage.submissions.count()` hoặc `count({ status: "pending" })`.

**Thao tác hàng loạt:** `getMany(ids)` trả `Map<string, T>`; `putMany([{ id, data }, ...])`; `deleteMany(ids)` trả số lượng đã xoá.

### Thiết kế Index

Chọn index theo mẫu truy vấn thực tế:

| Mẫu truy vấn | Index cần |
| --- | --- |
| Lọc theo `formId` | `"formId"` |
| Lọc theo `formId`, sắp theo `createdAt` | `["formId", "createdAt"]` |
| Chỉ sắp theo `createdAt` | `"createdAt"` |
| Lọc theo `status` và `formId` | `"status"` và `"formId"` (tách riêng) |

Index kết hợp hỗ trợ truy vấn lọc trên field đầu tiên và tuỳ chọn sắp theo field thứ hai — truy vấn lọc bắt đầu ở field sai vị trí sẽ **không** dùng được index kết hợp đó.

### Type Safety

Ép kiểu truy cập collection để có IntelliSense trên hình dạng item:

```typescript
import type { StorageCollection } from "emdash";

interface Submission {
	formId: string;
	email: string;
	status: "pending" | "approved" | "spam";
	createdAt: string;
}

const submissions = ctx.storage.submissions as StorageCollection<Submission>;
```

Cả `emdash/plugin` lẫn `emdash` chỉ import type — plugin sandboxed không phụ thuộc runtime vào `emdash`.

### Storage vs Content vs KV

| Trường hợp dùng | Cơ chế |
| --- | --- |
| Dữ liệu vận hành của plugin (log, bài nộp, cache) | `ctx.storage` |
| Cài đặt user tự cấu hình | `ctx.kv` tiền tố `settings:` |
| Trạng thái nội bộ plugin | `ctx.kv` tiền tố `state:` |
| Nội dung editor site cần sửa qua admin UI | Site Collection (không phải plugin storage) |

Nếu editor site cần xem/sửa dữ liệu qua trình soạn thảo nội dung thông thường, tạo một Collection của site thay vì dùng plugin storage.

### Chi tiết cài đặt

Plugin storage dùng một bảng namespace duy nhất:

```sql
CREATE TABLE _plugin_storage (
	plugin_id TEXT NOT NULL,
	collection TEXT NOT NULL,
	id TEXT NOT NULL,
	data JSON NOT NULL,
	created_at TEXT,
	updated_at TEXT,
	PRIMARY KEY (plugin_id, collection, id)
);
```

EmDash tạo expression index cho field đã khai — thiết kế này không cần migration, portable giữa SQLite/libSQL/D1, cách ly theo cấp plugin, và tham số hoá mọi truy vấn.

**Thêm index:** khi thêm index ở bản cập nhật plugin, EmDash tự tạo lúc khởi động tiếp theo — an toàn, không cần migrate dữ liệu. **Xoá index:** EmDash drop index, truy vấn trên field đó bắt đầu lỗi validation (đúng như thiết kế).

## CLI `emdash-plugin`

`@emdash-cms/plugin-cli` là toolchain cho tác giả plugin: scaffold, build, watch, validate, bundle, publish, cùng nhận diện và khám phá. Binary tên `emdash-plugin`.

```text
emdash-plugin init [name]                    Scaffold plugin sandboxed mới
emdash-plugin build                          Build dist/ (plugin.mjs, manifest.json, index.mjs)
emdash-plugin dev                            Theo dõi source, rebuild khi đổi
emdash-plugin bundle                         Đóng gói dist/ + asset thành tarball registry
emdash-plugin validate [path]                Validate emdash-plugin.jsonc theo schema
emdash-plugin publish                        Build, upload, và publish một release
emdash-plugin login <handle-or-did>          Đăng nhập bằng tài khoản Atmosphere
emdash-plugin logout [--did <did>]           Thu hồi session đang hoạt động
emdash-plugin whoami                         Hiện session đã lưu
emdash-plugin switch <did>                   Đổi session publisher đang hoạt động
emdash-plugin search <query>                 Tìm kiếm registry theo văn bản tự do
emdash-plugin info <handle-or-did> <slug>    Xem chi tiết gói
```

Lệnh output không tương tác (`whoami`, `validate`, `search`, `info`, `login`, `publish`) chấp nhận `--json`. Lệnh khám phá (`search`, `info`) chấp nhận `--registry-url <url>` (hoặc `EMDASH_REGISTRY_URL`).

```json title="package.json"
{
	"scripts": {
		"build": "emdash-plugin build",
		"dev": "emdash-plugin dev"
	}
}
```

### `init`

```sh
npx @emdash-cms/plugin-cli init my-plugin
```

Scaffold plugin tự chứa: `emdash-plugin.jsonc`, `src/plugin.ts` (một route ví dụ dạng `satisfies SandboxedPlugin`), `package.json`, `tsconfig.json`, một test, README, `.gitignore`. Chỉ cần một slug. Manifest sinh ra kèm comment `TODO:` cho vài field cần điền (publisher, author, security contact) trước khi plugin nạp/publish được.

### `build`

Đọc `emdash-plugin.jsonc`, `src/plugin.ts`, và `package.json` cạnh đó (nếu có), sinh ra:

| Artifact | Là gì |
| --- | --- |
| `dist/plugin.mjs` (+ `.d.mts`) | Hook và route — nạp in-process (`plugins: []`) và bởi sandbox loader (`sandboxed: []`) |
| `dist/manifest.json` | Manifest plugin, gồm cả hook/route đọc từ `src/plugin.ts` — `bundle` gồm nguyên file này |
| `dist/index.mjs` (+ `.d.mts`) | Module descriptor mà site import trong `astro.config.mjs` — chỉ sinh khi có `package.json` cạnh đó; plugin chỉ-registry bỏ qua vì không ai import nó |

`dist/` là output build — không commit; `.gitignore` của scaffold đã loại trừ.

### `dev`

Theo dõi `src/**`, `emdash-plugin.jsonc`, `package.json`, debounce rebuild 150ms, rebuild tuần tự. Rebuild **thất bại** giữ nguyên `dist/` tốt gần nhất, nên site import plugin qua workspace/file link vẫn hoạt động tới lần build thành công tiếp theo. Ctrl-C thoát sạch.

Phát triển với site thật: chạy `pnpm dev` trong thư mục plugin, `pnpm add file:../path/to/this` trong site, rồi import default export của plugin vào `emdash({ sandboxed: [...] })`.

### `validate`

```sh
emdash-plugin validate          # ./emdash-plugin.jsonc
emdash-plugin validate path/    # thư mục cụ thể
```

Kiểm schema offline, chẩn đoán kiểu `tsc` (`file:line:column`), gồm cả quy tắc chéo field của manifest — không cần mạng, phù hợp làm pre-commit/CI gate.

### `bundle`

Bước đóng gói mỏng trên `build`: (1) chạy `build` sinh `dist/`; (2) validate bundle (không import Node-builtin, không file quá khổ, kiểm tra hợp lý capability); (3) thu asset tuỳ chọn (README, icon, screenshot); (4) đóng tarball — trong đó `plugin.mjs` đóng gói thành `backend.js` (tên registry mong đợi), output `dist/<slug>-<version>.tar.gz`. `--validate-only` bỏ qua tạo tarball nhưng vẫn sinh artifact `dist/`.

### `publish`

Build và validate plugin, upload gói và ảnh listing lên PDS của bạn, rồi ghi bản ghi release:

```sh
emdash-plugin login alice.example.com
emdash-plugin publish
```

`publish` đọc manifest để lấy field profile và thực thi publisher pinning (xem lại [Chương 39](./39-viet-plugin-dau-tien.md)). Lần publish đầu, truyền `--license` và liên hệ bảo mật, hoặc giữ chúng trong manifest. Cờ tường minh ghi đè giá trị manifest; `--no-manifest` bỏ qua manifest hoàn toàn.

Truyền `--url <https-url>` để dùng bundle gói lưu trữ ngoài — CLI tải và validate URL trước khi publish. Thêm `--local <path>` để xác minh tarball cục bộ khớp byte đã tải. (Quy trình đầy đủ ở [Chương 43](./43-phat-hanh-plugin.md).)

### API lập trình

```ts
import { buildPlugin, bundlePlugin } from "@emdash-cms/plugin-cli";

await buildPlugin({ dir: "./my-plugin" });
const result = await bundlePlugin({ dir: "./my-plugin" });
```

Với helper khám phá và credential, import từ `@emdash-cms/registry-client`.

## Xem thêm

- [Chương 39 — Viết Plugin đầu tiên (sandboxed)](./39-viet-plugin-dau-tien.md)
- [Chương 40 — API Routes & Capabilities của Plugin](./40-api-routes-capabilities.md)
- [Chương 41 — Giao diện Plugin: Block Kit, Field Kit, Settings](./41-block-kit-field-kit.md)
- [Chương 43 — Phát hành Plugin lên Registry](./43-phat-hanh-plugin.md)
