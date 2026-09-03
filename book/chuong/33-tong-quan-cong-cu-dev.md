# 33. Tổng quan công cụ cho dev: CLI, API, MCP

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

CLI của EmDash cung cấp các lệnh để quản lý một instance EmDash CMS — thiết lập database, sinh type, CRUD nội dung, quản lý schema, media, và nhiều hơn nữa. Chương này là tham chiếu đầy đủ cho CLI — là điểm khởi đầu cho các chương kỹ thuật tiếp theo (Chương 34-38).

## Cài đặt

CLI đi kèm gói `emdash`:

```bash
npm install emdash
```

Chạy lệnh bằng `npx emdash` hoặc thêm script vào `package.json`. Binary cũng có tên ngắn `em`.

Khởi động site bằng script package (vd `pnpm dev`) — script này chạy Astro; EmDash integration sinh `emdash-env.d.ts`, trong khi runtime chạy migration đang chờ ở request đầu tiên và áp seed đi kèm khi database rỗng và setup chưa hoàn tất.

## Xác thực

Lệnh dùng shared remote client phân giải xác thực theo thứ tự:

1. **Cờ `--token`** — token tường minh trên dòng lệnh.
2. **Biến môi trường `EMDASH_TOKEN`**.
3. **Credential đã lưu** từ `~/.config/emdash/auth.json` (lưu bởi `emdash login`).
4. **Dev bypass** — nếu URL là localhost và không có token, tự xác thực qua endpoint dev bypass.

Các lệnh này chấp nhận cờ `--url` (từ `EMDASH_URL`, mặc định `http://localhost:4321`) và `--token`. Lệnh xác thực có tuỳ chọn kết nối riêng. Khi trỏ vào dev server cục bộ, không cần token.

## Cờ chung

| Cờ | Alias | Mô tả | Mặc định |
| --- | --- | --- | --- |
| `--url` | `-u` | URL instance EmDash | `EMDASH_URL` hoặc `http://localhost:4321` |
| `--token` | `-t` | Token xác thực | Từ env/credential đã lưu |
| `--header "Name: Value"` | `-H` | Header request tuỳ chỉnh, có thể lặp lại | Từ `EMDASH_HEADERS`/credential đã lưu |
| `--json` | | Xuất dạng JSON (để pipe) | Tự phát hiện theo TTY |

Với lệnh dùng shared remote client, stdout được in đẹp (pretty-print) bằng consola khi là TTY, và thành JSON thô khi pipe hoặc đặt `--json`. `emdash migrate` chỉ xuất JSON khi có cờ `--json` tường minh.

## Lệnh

### `emdash migrate`

Kiểm tra hoặc áp dụng tập migration lõi do một build Astro phát ra:

```bash
npx emdash migrate [options]
npx emdash migrate --check [options]
npx emdash migrate --status --json [options]
```

Mặc định, lệnh tự tìm project root và đọc `.emdash/migrations.json`, xác thực manifest với gói EmDash đã cài của dự án, resolve executor cục bộ của adapter, và in target bất biến trước khi chạy bất kỳ SQL nào.

**Tuỳ chọn chính:** `--check` (không áp dụng gì, thoát khác 0 nếu có migration đang chờ/không rõ), `--status` (báo cáo trạng thái chính xác mà không áp dụng), `--json`, `--manifest <path>`, `--from-config` (đánh giá cấu hình Astro tin cậy thay vì manifest), `--config <path>`, `--expected-target-fingerprint <sha256>` (bắt buộc cho apply không tương tác), `--database <path>`, `--database-url-env <name>`, `--d1 <uuid-or-name>`, `--account-id <id>`, `--wrangler-config <path>`, `--wrangler-env <name>`.

Apply tương tác (người) hỏi xác nhận. Apply không tương tác và mọi apply dùng `--json` bắt buộc đúng fingerprint đã in cho target. Không có `down` hay `--dry-run` — dùng `--check` để biết có cần làm gì không.

**Exit code:** `0` thành công (kể cả `--status` thành công); `1` lỗi validation/cấu hình/target/migration/cleanup; `2` `--check` phát hiện migration đã biết đang chờ; `3` `--check` phát hiện bản ghi đã áp dụng nhưng lạ (ưu tiên hơn `2`); `4` thiếu/từ chối xác nhận hoặc fingerprint không khớp; `130` bị ngắt sau khi executor dọn dẹp có giới hạn.

Xem chi tiết đầy đủ ở [Chương 27](./27-co-so-du-lieu.md) (mục Quản lý Migration lõi).

### `emdash dev` (đã lỗi thời)

> **Lệnh đã lỗi thời:** `emdash dev` vẫn khả dụng để tương thích ngược nhưng bị ẩn khỏi CLI help. Khởi động site bằng script package (vd `pnpm dev`) hoặc chạy thẳng `astro dev`.

Lệnh cũ này khởi tạo và migrate một database SQLite cục bộ trước khi chạy Astro — hành vi này **không** dùng database adapter đã cấu hình của site và **không tương thích** với phát triển Cloudflare D1.

### `emdash types`

Sinh TypeScript type từ schema của một instance EmDash đang chạy:

```bash
npx emdash types [options]
```

| Tuỳ chọn | Alias | Mô tả | Mặc định |
| --- | --- | --- | --- |
| `--url` | `-u` | URL instance EmDash | `http://localhost:4321` |
| `--token` | `-t` | Token xác thực | Từ env/credential đã lưu |
| `--output` | `-o` | Đường dẫn output type | `.emdash/types.ts` |
| `--cwd` | | Thư mục làm việc | Thư mục hiện tại |

```bash
npx emdash types
npx emdash types --url https://my-site.pages.dev
npx emdash types --output src/types/emdash.ts
```

Hành vi: lấy schema từ instance → sinh định nghĩa TypeScript type → ghi type vào file output → ghi thêm `schema.json` để tham khảo.

### `emdash login` / `emdash logout` / `emdash whoami`

`emdash login [--url]` — đăng nhập bằng OAuth Device Flow: tự tìm endpoint xác thực từ instance; nếu là localhost và chưa cấu hình auth, dùng dev bypass tự động; ngược lại khởi động Device Flow (hiện mã và mở trình duyệt), poll cho tới khi được cấp quyền, rồi lưu credential vào `~/.config/emdash/auth.json`. Credential đã lưu tự động dùng cho mọi lệnh sau nhắm tới cùng instance.

`emdash logout [--url]` — đăng xuất, xoá credential đã lưu.

`emdash whoami [--url] [--token] [--json]` — hiện email, tên, vai trò, phương thức xác thực, và URL instance của người dùng hiện tại.

### `emdash content` — quản lý nội dung

Mọi lệnh con dùng API từ xa qua `EmDashClient`.

- **`content list <collection>`** — `--status`, `--limit`, `--cursor`.
  ```bash
  npx emdash content list posts --status published --limit 10
  ```
- **`content get <collection> <id>`** — `--raw` (trả Portable Text thô, bỏ qua chuyển đổi markdown). Response gồm token `_rev` — truyền vào `content update` để xác nhận đã thấy trạng thái hiện tại trước khi ghi đè.
  ```bash
  npx emdash content get posts 01ABC123 --raw
  ```
- **`content create <collection>`** — `--data`, `--file`, `--stdin` (chọn đúng một), `--slug`, `--locale`, `--translation-of`, `--draft` (giữ draft thay vì tự publish).
  ```bash
  npx emdash content create posts --data '{"title": "Hello"}'
  cat post.json | npx emdash content create posts --stdin
  ```
- **`content update <collection> <id>`** — bắt buộc `--rev` (token từ `get` trước đó, chứng minh đã thấy trạng thái hiện tại — tránh ghi đè thay đổi chưa thấy). Nếu item đã đổi từ lần `get`, server trả `409 Conflict` — đọc lại và thử lại.
  ```bash
  npx emdash content update posts 01ABC123 --rev MToyMDI2... --data '{"title": "Updated"}'
  ```
- **`content delete <collection> <id>`** — soft-delete (chuyển vào trash).
- **`content publish` / `content unpublish` <collection> <id>`**.
- **`content schedule <collection> <id> --at <ISO8601>`** — bắt buộc `--at`.
- **`content restore <collection> <id>`** — khôi phục item trong trash.

### `emdash schema` — quản lý Collection và Field

- **`schema list`** — liệt kê mọi Collection.
- **`schema get <collection>`** — hiện Collection kèm mọi field.
- **`schema create <collection> --label <label>`** — thêm `--label-singular`, `--description` tuỳ chọn.
- **`schema delete <collection> [--force]`** — hỏi xác nhận trừ khi có `--force`.
- **`schema add-field <collection> <field> --type <type>`** — `--type` là bắt buộc (string, text, number, integer, boolean, datetime, image, reference, portableText, json), thêm `--label`, `--required`.
- **`schema remove-field <collection> <field>`**.

(Xem lại [Chương 27](./27-co-so-du-lieu.md), mục "Đổi schema từ CLI" để biết cách dùng các lệnh này trên site đã triển khai.)

### `emdash media` — quản lý media

- **`media list`** — `--mime`, `--limit`, `--cursor`.
- **`media upload <file>`** — `--alt`, `--caption`.
- **`media get <id>` / `media delete <id>`**.
- **`media repair-usage`** — sửa index sử dụng media của một hoặc mọi Collection nội dung. Dùng sau khi nhập (import) hoặc ghi trực tiếp vào database khi độ phủ usage cũ/không đáng tin. Chọn đúng một trong `--collection <c>` hoặc `--all`. Sửa từ xa cần user Admin và token có scope `admin`. Sửa toàn bộ nội dung chạy đồng bộ, có thể chậm/tốn kém trên site lớn — ưu tiên `--collection` khi chỉ cần sửa một Collection. Kết quả `complete`/`partial`/`stale` thoát `0`; `failed` thoát `1` — automation/cron nên dùng `--json` và đọc `status`, `failedSourceCount`, `skippedSourceCount` thay vì coi exit `0` là đã sửa hết.

### `emdash search`

Tìm kiếm full-text trên nội dung: `--collection`/`-c`, `--limit`/`-l`.

```bash
npx emdash search "hello" --collection posts --limit 5
```

### `emdash taxonomy`

- **`taxonomy list`**.
- **`taxonomy terms <name>`** — `--limit`/`-l`, `--cursor`.
- **`taxonomy add-term <taxonomy> --name <name>`** — `--slug` (mặc định slugify từ name), `--parent` (ID term cha, cho taxonomy phân cấp).

### `emdash menu`

- **`menu list`**.
- **`menu get <name>`** — trả về menu kèm mọi item.

### `emdash export-seed`

Xuất schema và nội dung database thành seed file — hoạt động trực tiếp trên một file SQLite cục bộ:

```bash
npx emdash export-seed [options] > seed.json
```

| Tuỳ chọn | Alias | Mô tả | Mặc định |
| --- | --- | --- | --- |
| `--database` | `-d` | Đường dẫn file database | `./data.db` |
| `--cwd` | | Thư mục làm việc | Thư mục hiện tại |
| `--with-content` | | Gồm nội dung (tất cả hoặc danh sách Collection cách nhau dấu phẩy) | |
| `--no-pretty` | | Tắt định dạng JSON đẹp | `false` |

Seed xuất ra gồm: Settings, Collections (kèm field), Taxonomies (kèm term), Menus (kèm item), Widget Areas, và Content (nếu yêu cầu, kèm tham chiếu `$media` và cú pháp `$ref:` để portable).

### `emdash secrets generate` / `emdash secrets fingerprint <key>`

Sinh `EMDASH_ENCRYPTION_KEY` cho triển khai — khoá dùng để mã hoá secret plugin khi lưu trữ:

```bash
npx emdash secrets generate
npx emdash secrets generate --write .env   # ghi thẳng vào .env cục bộ
```

`--write` từ chối ghi đè entry có sẵn nếu không có `--force` — thay khoá trong triển khai đã có dữ liệu mã hoá sẽ khiến secret đó không đọc được nữa, nên đây là bảo vệ có chủ đích.

`emdash secrets fingerprint <key>` — in dấu vân tay 8 ký tự (kid) của khoá mà không lộ giá trị — hữu ích trong CI để xác minh đúng khoá đã triển khai.

## File được sinh ra

**`.emdash/types.ts`** — interface TypeScript cho mỗi Collection:

```ts title=".emdash/types.ts"
// Generated by EmDash CLI
// Do not edit manually - run `emdash types` to regenerate

import type { PortableTextBlock } from "emdash";

export interface Post {
	id: string;
	title: string;
	content: PortableTextBlock[];
	publishedAt: Date | null;
}
```

**`.emdash/schema.json`** — export schema thô dùng cho tooling.

## Biến môi trường

| Biến | Mô tả |
| --- | --- |
| `EMDASH_DATABASE_URL` | Ghi đè URL database |
| `EMDASH_TOKEN` | Token xác thực cho thao tác từ xa |
| `EMDASH_URL` | URL mặc định cho lệnh dùng shared remote client |
| `EMDASH_HEADERS` | Header request tuỳ chỉnh phân tách bằng xuống dòng, cho shared remote client và `login` |
| `EMDASH_ENCRYPTION_KEY` | Khoá mã hoá secret plugin (xem lại [Chương 28](./28-bi-mat-cau-hinh.md)) |
| `EMDASH_PREVIEW_SECRET` | Override tuỳ chọn cho secret HMAC preview |
| `EMDASH_IP_SALT` | Override tuỳ chọn cho salt hash IP người bình luận |
| `EMDASH_AUTH_SECRET` | Kế thừa (legacy) — dùng làm nguồn IP-salt nếu đặt, giữ hash ổn định cho site nâng cấp; site mới không nên đặt |

## Script package

```json title="package.json"
{
	"scripts": {
		"dev": "astro dev",
		"types": "emdash types",
		"export-seed": "emdash export-seed",
		"db:reset": "rm -f data.db"
	}
}
```

## Exit code chung

| Code | Mô tả |
| --- | --- |
| `0` | Thành công |
| `1` | Lỗi (cấu hình, network, database) |

## Xem thêm

- [Chương 27 — Cơ sở dữ liệu (SQLite/PostgreSQL/D1)](./27-co-so-du-lieu.md)
- [Chương 28 — Bí mật cấu hình & biến môi trường](./28-bi-mat-cau-hinh.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
- [Chương 35 — REST API tham chiếu](./35-rest-api.md)
- [Chương 38 — Máy chủ MCP cho AI Agent](./38-mcp-server.md)
