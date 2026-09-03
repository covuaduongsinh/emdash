# 43. Phát hành Plugin lên Registry

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

Khi plugin sandboxed hoạt động tốt, phát hành (publish) nó để site khác cài được. **Publish chỉ dành cho plugin sandboxed** — plugin native phân phối qua npm. Khi publish, CLI build plugin, upload gói và ảnh listing lên tài khoản Atmosphere của bạn, và ghi bản ghi release ở đó — chỉ cần host artifact riêng khi bạn chủ động chọn đường `--url`.

> **Thử nghiệm:** Registry, lexicon, và hình dạng bản ghi được quản lý bởi RFC 0001 và sẽ thay đổi trong khi còn phát triển — cố định `@emdash-cms/plugin-cli` đúng một phiên bản. Phía khám phá (`search`, `info`) truy vấn registry thử nghiệm tại `registry.emdashcms.com`.

## Điều kiện tiên quyết

- `emdash-plugin.jsonc` hợp lệ với `slug`, `publisher`, `license`, một author, và một liên hệ bảo mật (chạy `emdash-plugin validate` để xác nhận).
- Một `version` (trong `package.json`, hoặc trong manifest với plugin chỉ-registry).
- Một [tài khoản Atmosphere](#tài-khoản-atmosphere-của-bạn) để publish dưới đó.

## Tài khoản Atmosphere của bạn

Bạn publish dưới một **tài khoản Atmosphere** — danh tính di động, do người dùng sở hữu, dùng chung trên Bluesky và các ứng dụng khác trong mạng AT Protocol. Một tài khoản là đăng nhập duy nhất xuyên mạng, cùng `@handle` mọi nơi, danh tính và dữ liệu không gắn với riêng một ứng dụng nào. EmDash dùng tài khoản này làm danh tính publisher — mỗi release bạn publish là một bản ghi trong chính tài khoản của bạn, ký bởi bạn.

**Dùng tài khoản có sẵn:** nếu đã có tài khoản Bluesky hoặc Atmosphere khác, đăng nhập bằng handle:

```sh
emdash-plugin login alice.bsky.social
```

Lệnh mở trang đăng nhập của nhà cung cấp tài khoản trong trình duyệt — EmDash không bao giờ thấy mật khẩu của bạn. `emdash-plugin whoami` liệt kê session đã lưu; `emdash-plugin switch <did>` đổi session đang hoạt động.

**Đăng ký tài khoản mới:** nếu chưa có tài khoản Atmosphere, tạo qua một trong: một ứng dụng như Bluesky (nhanh nhất), một nhà cung cấp độc lập (community-run hoặc chú trọng riêng tư — xem [atmosphereaccount.com](https://atmosphereaccount.com)), hoặc tự host provider riêng. Dù chọn cách nào, `@handle` của tài khoản đó là thứ bạn truyền vào `emdash-plugin login`, và DID của tài khoản là thứ bạn ghim làm `publisher` trong manifest (xem lại [Chương 39](./39-viet-plugin-dau-tien.md)).

## Publish từ thư mục Plugin

Đăng nhập một lần, rồi publish từ thư mục chứa `emdash-plugin.jsonc`:

```sh
emdash-plugin login alice.example.com
emdash-plugin publish
```

`publish` chạy cùng build và kiểm tra validation như `bundle`, tạo archive gzip, upload lên Personal Data Server (PDS) của bạn, upload mọi ảnh listing đã khai, và ghi bản ghi release.

> Site cần một phiên bản EmDash hỗ trợ artifact registry lưu trên PDS trước khi cài được release chỉ-blob — dùng đường "URL gói ngoài" (bên dưới) nếu release cần cài được trên site cũ hơn.

## Đóng gói (Bundle)

`bundle` chạy `build`, validate, thu asset, và tạo tarball — bên trong tarball, `plugin.mjs` đóng gói thành `backend.js` (tên registry mong đợi):

```sh
emdash-plugin bundle [--dir <path>] [--out-dir|-o <path>] [--validate-only]
```

| Cờ | Mặc định | Mô tả |
| --- | --- | --- |
| `--dir` | Thư mục hiện tại | Thư mục nguồn plugin |
| `--out-dir`, `-o` | `dist` | Thư mục output tarball |
| `--validate-only` | `false` | Bỏ tarball, vẫn sinh artifact `dist/` |

**Nội dung tarball:** `manifest.json` (bắt buộc — manifest sinh tự động: id, version, capability, host, hook/route đọc từ source, không tự tay bảo trì), `backend.js` (bắt buộc — file runtime đã build, tự chứa), `README.md` (tuỳ chọn), `icon.png` (tuỳ chọn, 256×256), `screenshots/` (tuỳ chọn, tối đa 5, tối đa 1920×1080).

**Validation của `bundle`:** giới hạn kích thước (RFC 0001, đã giải nén) — tổng ≤ 256 KB, mỗi file ≤ 128 KB, ≤ 20 file; `backend.js` **không** import Node built-in (`fs`, `path`, `child_process`...) — dùng Web API, hoặc chuyển logic đó sang plugin native; capability hợp lệ (tên phải trong tập công nhận); nhất quán hợp đồng tin cậy (quy tắc chéo `network:request`/`allowedHosts`); giới hạn asset (icon 256×256, ≤5 screenshot ≤1920×1080).

Xem trước nội dung tarball trước khi publish: `emdash-plugin bundle` rồi `tar tzf dist/my-plugin-1.1.0.tar.gz`.

## Publish

```sh
emdash-plugin publish
```

Thêm ảnh listing bằng khối manifest sau (đường dẫn tương đối với `emdash-plugin.jsonc`; hỗ trợ PNG/JPEG/WebP):

```jsonc title="emdash-plugin.jsonc"
{
  "release": {
    "artifacts": {
      "icon": { "file": "./icon.png" },
      "banner": { "file": "./banner.webp" },
      "screenshots": [
        { "file": "./screenshots/editor.png" },
        { "file": "./screenshots/settings.jpg", "lang": "en" }
      ]
    }
  }
}
```

`publish` thực hiện: (1) build plugin, validate giới hạn đã giải nén, tạo archive gzip; (2) resume session tài khoản Atmosphere, kiểm tra publisher pinning; (3) xác nhận grant OAuth có scope blob gói và ảnh; (4) upload gói và ảnh đã khai lên PDS, xác minh CID blob trả về khớp byte đã upload; (5) tạo profile gói lần publish đầu, ghi bản ghi release bất biến.

> Nếu đăng nhập trước đó chưa hỗ trợ publish blob, `publish` báo `MISSING_BLOB_SCOPE` — chạy `emdash-plugin logout` rồi đăng nhập lại để chấp thuận scope mới.

### Dùng URL gói ngoài

Truyền `--url` khi bundle gói đã sẵn có qua HTTPS hoặc nhà cung cấp tài khoản không chấp nhận blob gzip:

```sh
emdash-plugin publish --url https://downloads.example.com/gallery-1.0.0.tar.gz
```

CLI tải URL, validate bundle phục vụ, tính checksum — **không** upload blob gói theo đường này (ảnh listing vẫn dùng PDS blob). Thêm `--local <path>` để so sánh byte đã host với tarball cục bộ.

### Phiên bản là bất biến

Một phiên bản đã publish **không thể** ghi đè hay publish lại — tăng `version` trước khi publish tiếp. Build đọc `version` từ `package.json`. Tăng **major** khi mở rộng hợp đồng tin cậy, **minor** khi thêm hook/route mới, **patch** cho sửa lỗi.

### Xung đột Publisher

Nếu `publish` lỗi `MANIFEST_PUBLISHER_MISMATCH`, session hiện tại là tài khoản Atmosphere khác với `publisher` đã ghim trong manifest — chuyển sang tài khoản đã ghim bằng `emdash-plugin switch <did>`, hoặc sửa `publisher` trong manifest nếu thật sự đang chuyển plugin sang tài khoản mới.

## Di chuyển từ `definePlugin()` cũ sang CLI mới (dành cho tác giả plugin có sẵn)

Nếu bạn có plugin sandboxed viết theo hình dạng `definePlugin()` cũ, đây là các thay đổi breaking cần thực hiện theo thứ tự (không thay đổi hành vi hook/route lúc runtime — chỉ thay cách khai báo, build, và publish):

1. **Đổi tên gói:** `@emdash-cms/registry-cli` → `@emdash-cms/plugin-cli`, binary `emdash-registry` → `emdash-plugin`. Mọi subcommand giữ nguyên tên (`bundle`, `publish`, `login`, `whoami`, `switch`, `validate`); thêm mới `init`, `build`, `dev`.
2. **Đổi khai báo plugin:** thay `definePlugin()` import từ `emdash` bằng object trơn gắn `satisfies SandboxedPlugin` (type từ `emdash/plugin`) — bỏ mọi chú thích tham số thủ công trên handler (TypeScript tự suy luận `event`/`ctx` từ tên hook/route).
   ```ts title="src/plugin.ts (sau khi đổi)"
   import type { SandboxedPlugin } from "emdash/plugin";

   export default {
   	hooks: {
   		"content:beforeSave": {
   			handler: async (event, ctx) => {
   				return event.content;
   			},
   		},
   	},
   } satisfies SandboxedPlugin;
   ```
3. **Gộp thành một plugin = một `src/plugin.ts` + một `emdash-plugin.jsonc`:** trước đây tách `src/index.ts` (trả `PluginDescriptor`) và `src/sandbox-entry.ts` (hook/route) — nay hook/route vào `src/plugin.ts`, metadata (id → `slug`, `capabilities`, `allowedHosts`, `storage`) vào manifest; field `entrypoint`/`format` không còn, `version` đọc từ `package.json` nên bỏ khỏi manifest. Cập nhật export `"./sandbox"` trong `package.json` trỏ tới `./dist/plugin.mjs`, thêm `emdash-plugin.jsonc` vào `files`.
4. **Đổi lệnh build:** thay script `tsdown` tự viết bằng `emdash-plugin build` (+ `emdash-plugin dev` để watch).
5. **Type/hàm export dạng "standard" đã bị gỡ khỏi `emdash`** (`StandardPluginDefinition`, `StandardHookHandler`, v.v.) — dùng `SandboxedPlugin` từ `emdash/plugin` thay thế.
6. **(Chỉ tác giả sandbox runner tuỳ chỉnh)** type `SandboxedPlugin` runtime đổi tên thành `SandboxedPluginInstance`.

**Báo cho người dùng plugin của bạn:** site cài plugin của bạn cũng cần đổi import — bỏ dấu ngoặc nhọn và `()`:

```js title="astro.config.mjs (site dùng plugin)"
// Trước
import { helloPlugin } from "@my-org/plugin-hello";
emdash({ sandboxed: [helloPlugin()] });

// Sau
import hello from "@my-org/plugin-hello";
emdash({ sandboxed: [hello] });
```

Nếu plugin trước đây nhận cấu hình qua factory, cấu hình đó chuyển sang cài đặt plugin trong admin UI — đọc lúc runtime qua `ctx.kv` hoặc route settings thay thế (xem lại [Chương 41](./41-block-kit-field-kit.md)).

## Xem thêm

- [Chương 20 — Cài đặt & Quản lý Plugin (người dùng cuối)](./20-cai-dat-plugin.md)
- [Chương 39 — Viết Plugin đầu tiên (sandboxed)](./39-viet-plugin-dau-tien.md)
- [Chương 41 — Giao diện Plugin: Block Kit, Field Kit, Settings](./41-block-kit-field-kit.md)
- [Chương 42 — Lưu trữ dữ liệu Plugin & CLI plugin](./42-luu-tru-cli-plugin.md)
- [Chương 46 — Chuyển đổi Plugin WordPress sang EmDash](./46-chuyen-doi-plugin-wp.md)
