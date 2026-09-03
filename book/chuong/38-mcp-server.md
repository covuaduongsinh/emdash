# 38. Máy chủ MCP cho AI Agent

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

EmDash có sẵn một máy chủ [Model Context Protocol](https://modelcontextprotocol.io) (MCP) tại `/_emdash/api/mcp`, expose các thao tác quản lý nội dung dưới dạng tool cho trợ lý AI.

> Muốn kết nối Claude, ChatGPT, hoặc công cụ AI khác vào site? Xem [Chương 32 — Công cụ AI tích hợp sẵn](./32-cong-cu-ai.md) để có hướng dẫn thiết lập và mẹo sử dụng. Chương này là tham chiếu kỹ thuật: xác thực, transport, đặc tả tool, OAuth discovery, và xử lý lỗi.

## Xác thực

MCP server hỗ trợ 3 phương thức xác thực:

| Phương thức | Cách hoạt động |
| --- | --- |
| **OAuth 2.1 Authorization Code + PKCE** | Luồng chuẩn cho MCP client — user duyệt scope trong trình duyệt |
| **Personal Access Token (PAT)** | Token dài hạn `ec_pat_*` tạo trong admin panel |
| **Device Flow** | Luồng kiểu CLI — duyệt mã trong trình duyệt, dùng bởi `emdash login` |

Session cookie (từ admin UI) cũng dùng được nhưng không thực tế cho MCP client bên ngoài.

### Scope

Token được giới hạn scope để hạn chế thao tác client có thể làm. Scope yêu cầu lúc cấp quyền OAuth và thực thi ở mỗi lần gọi tool. Trên trang duyệt của authorization-code, mọi scope yêu cầu được chọn sẵn — user có thể bỏ chọn nhưng không thể thêm scope client không yêu cầu. Grant thực tế còn bị giới hạn bởi scope đã đăng ký của client và vai trò user; EmDash từ chối grant rỗng.

| Scope | Cấp quyền truy cập |
| --- | --- |
| `content:read` | List, get, compare, search nội dung. List taxonomy, term, menu. |
| `content:write` | Tạo/sửa/xoá/publish/unpublish/schedule/unschedule/duplicate/restore nội dung. Ngầm cấp `taxonomies:manage` và `menus:manage` (tương thích ngược với token cũ). |
| `media:read` | List, get media |
| `media:write` | Đăng ký (tạo)/sửa/xoá metadata media |
| `schema:read` | List Collection, lấy schema Collection |
| `schema:write` | Tạo/sửa/xoá Collection và Field |
| `taxonomies:manage` | Tạo/sửa/xoá term taxonomy |
| `menus:manage` | Tạo/sửa/xoá menu và item |
| `settings:read` | Đọc site settings |
| `settings:manage` | Cập nhật site settings |
| `mcp:tools` | Gọi tool MCP đã bật tường minh từ bất kỳ plugin nào |
| `mcp:tools:<pluginId>` | Gọi tool MCP đã bật của một plugin cụ thể |
| `admin` | Toàn quyền mọi thao tác lõi (không tự cấp quyền MCP của plugin) |

> `admin` cấp quyền thao tác lõi nhưng **không** cấp quyền MCP của plugin. Tool plugin luôn cần `mcp:tools` hoặc scope riêng của plugin đó. Tool plugin dùng permission khai báo trên route gốc của nó, vắng mặt khỏi `tools/list` tới khi admin bật MCP surface của plugin đó; tên tool theo dạng `<pluginId>__<localName>`, mọi lần gọi được ghi vào audit log.

### Yêu cầu vai trò

Ngoài scope, một số tool còn yêu cầu vai trò RBAC tối thiểu — **cả hai điều kiện phải thoả** (token đúng scope vẫn thất bại nếu vai trò user quá thấp):

| Thao tác | Vai trò tối thiểu |
| --- | --- |
| Đọc nội dung | Subscriber (10) cho mục published; Contributor (20) cho draft/scheduled/trash/revision |
| Tạo nội dung | Contributor (20) |
| Sửa/xoá nội dung của mình | Author (30) |
| Publish nội dung | Author (30) cho mục của mình; Editor (40) cho mục người khác |
| Đọc schema | Editor (40) |
| Sửa schema | Admin (50) |
| Quản lý taxonomy | Editor (40) |
| Quản lý menu | Editor (40) |
| Đọc settings | Editor (40) |
| Sửa settings | Admin (50) |
| Upload media (`media_upload`) | Contributor (20) |
| Đăng ký media (`media_create`) | Author (30) |
| Sửa index usage media | Admin (50) |

(Xem lại bảng vai trò đầy đủ ở [Chương 19](./19-nguoi-dung-vai-tro.md).)

## Transport

Server dùng Streamable HTTP transport ở **chế độ stateless** — mỗi request độc lập, không có session hay kết nối dài hạn.

- `POST /_emdash/api/mcp` — gửi lệnh gọi tool JSON-RPC.
- `GET /_emdash/api/mcp` — trả `405` (không có SSE ở chế độ stateless).
- `DELETE /_emdash/api/mcp` — trả `405` (không có session để đóng).

Response theo định dạng [JSON-RPC 2.0](https://www.jsonrpc.org/specification). Lỗi dùng mã lỗi JSON-RPC chuẩn, kèm mã riêng của MCP cho lỗi scope/permission.

## Tool

Server expose tool trên 8 nhóm: content, schema, media, search, taxonomy, menu, revision, settings. Mỗi tool trả kết quả dạng JSON text, hoặc thông báo lỗi kèm `isError: true`.

### Tool Nội dung (Content)

| Tool | Mô tả | Tham số chính | Scope | Ghi chú |
| --- | --- | --- | --- | --- |
| `content_list` | Liệt kê nội dung, lọc/phân trang | `collection`*, `status`, `limit` (1-100, mặc định 50), `cursor`, `orderBy`, `order`, `locale` | `content:read` | Chỉ đọc |
| `content_get` | Lấy một entry theo ID/slug | `collection`*, `id`*, `locale` | `content:read` | Trả kèm token `_rev` để phát hiện xung đột |
| `content_create` | Tạo entry mới | `collection`*, `data`*, `slug`, `status` (mặc định draft), `locale`, `translationOf` | `content:write` | |
| `content_update` | Cập nhật entry | `collection`*, `id`*, `data`, `slug`, `status`, `_rev` (từ `content_get`) | `content:write` | Chỉ field cung cấp mới đổi |
| `content_delete` | Soft-delete (chuyển vào trash) | `collection`*, `id`* | `content:write` | **Phá huỷ** |
| `content_restore` | Khôi phục từ trash | `collection`*, `id`* | `content:write` | |
| `content_permanent_delete` | Xoá vĩnh viễn (phải đang ở trash) | `collection`*, `id`* | `content:write` | **Phá huỷ**, không thể hoàn tác |
| `content_publish` | Xuất bản, tạo revision published từ draft hiện tại | `collection`*, `id`* | `content:write` | |
| `content_unpublish` | Đưa về draft | `collection`*, `id`* | `content:write` | |
| `content_schedule` | Lên lịch xuất bản tương lai | `collection`*, `id`*, `scheduledAt`* (ISO 8601) | `content:write` | |
| `content_unschedule` | Huỷ lịch | `collection`*, `id`* | `content:write` | Idempotent |
| `content_compare` | So sánh bản published với draft hiện tại | `collection`*, `id`* | `content:read` | Chỉ đọc |
| `content_discard_draft` | Bỏ draft, về lại bản published gần nhất | `collection`*, `id`* | `content:write` | **Phá huỷ**, chỉ dùng được nếu đã publish ít nhất 1 lần |
| `content_list_trashed` | Liệt kê nội dung trong trash | `collection`*, `limit`, `cursor` | `content:read` | Chỉ đọc |
| `content_duplicate` | Nhân bản entry (thêm "(Copy)" vào title, tự sinh slug) | `collection`*, `id`* | `content:write` | |
| `content_translations` | Lấy mọi biến thể locale của entry (khi bật i18n) | `collection`*, `id`* | `content:read` | Chỉ đọc |

*(`*` = tham số bắt buộc)*

### Tool Schema

> Tool schema sửa cấu trúc database — tạo/xoá Collection và Field thay đổi bảng bên dưới, cần vai trò Admin.

| Tool | Mô tả | Tham số chính | Ghi chú |
| --- | --- | --- | --- |
| `schema_list_collections` | Liệt kê mọi Collection | không có | Chỉ đọc, vai trò Editor+ |
| `schema_get_collection` | Chi tiết Collection kèm mọi field | `slug`* | Chỉ đọc, vai trò Editor+ |
| `schema_create_collection` | Tạo Collection mới | `slug`* (khớp `/^[a-z][a-z0-9_]*$/`), `label`*, `labelSingular`, `description`, `icon`, `supports` (mặc định `['drafts','revisions']`) | Vai trò Admin |
| `schema_update_collection` | Cập nhật Collection (không xoá bảng/field/nội dung) | `slug`*, `label`, `labelSingular`, `description`, `icon`, `supports`, `urlPattern`, `hasSeo`, `commentsEnabled`, `commentsModeration`, `commentsClosedAfterDays`, `commentsAutoApproveUsers` | Vai trò Admin; không đổi được `slug` |
| `schema_delete_collection` | Xoá Collection và bảng database | `slug`*, `force` | Vai trò Admin, **phá huỷ**, không thể hoàn tác |
| `schema_create_field` | Thêm field mới (thêm cột database) | `collection`*, `slug`*, `label`*, `type`* (`string`/`text`/`number`/`integer`/`boolean`/`datetime`/`select`/`multiSelect`/`portableText`/`image`/`file`/`reference`/`json`/`slug`), `required`, `unique`, `defaultValue`, `validation`, `options`, `searchable`, `indexed`, `translatable` | Vai trò Admin |
| `schema_update_field` | Cập nhật field (không xoá cột/dữ liệu) | `collection`*, `fieldSlug`*, `label`, `type` (chỉ đổi được giữa `string`/`text`/`slug`), `required`, `unique`, `defaultValue`, `validation`, `widget`, `options`, `sortOrder`, `searchable`, `indexed`, `translatable` | Vai trò Admin; đổi loại khác hoặc setting cần migrate nội dung sẽ bị từ chối kèm hướng dẫn |
| `schema_delete_field` | Xoá field (xoá cột và toàn bộ dữ liệu) | `collection`*, `fieldSlug`* | Vai trò Admin, **phá huỷ** |

### Tool Media

| Tool | Mô tả | Tham số chính | Ghi chú |
| --- | --- | --- | --- |
| `media_list` | Liệt kê media | `mimeType`, `limit`, `cursor` | Chỉ đọc |
| `media_upload` | Upload từ dữ liệu base64 hoặc URL ngoài, tự đăng ký | `filename`*, `base64` hoặc `url` (chọn một), `contentType`, `alt` | Vai trò Contributor+; deduplicate theo content hash; ảnh tự làm giàu kích thước/blurhash/màu chủ đạo; fetch URL có bảo vệ SSRF |
| `media_create` | Đăng ký một tệp **đã** upload sẵn vào storage | `filename`*, `mimeType`*, `storageKey`*, `size`, `width`, `height`, `contentHash`, `blurhash`, `dominantColor` | Vai trò Author+; dùng khi client tự upload byte (vd qua signed URL) |
| `media_get` | Chi tiết một media | `id`* | Chỉ đọc |
| `media_update` | Sửa metadata (không đổi được tệp) | `id`*, `alt`, `caption`, `width`, `height` | |
| `media_delete` | Xoá vĩnh viễn | `id`* | **Phá huỷ**, tham chiếu nội dung tới media này sẽ gãy |
| `media_usage_repair` | Sửa index usage của một/mọi Collection | `scope`* (`"collection"`/`"all"`), `collection` | Vai trò Admin; chạy đồng bộ, ưu tiên scope collection; kết quả trả `status` (`complete`/`partial`/`failed`/`stale`) đều là kết quả thành công của tool — phải kiểm tra `status` thay vì chỉ dựa vào `isError` |

### Tool Tìm kiếm

**`search`** — tìm full-text qua nhiều Collection (Collection phải có `search` trong `supports`, field phải đánh dấu `searchable`). Tham số: `query`* , `collections` (giới hạn Collection), `locale`, `limit` (1-50, mặc định 20). Scope `content:read`, chỉ đọc.

### Tool Taxonomy

| Tool | Mô tả | Tham số chính |
| --- | --- | --- |
| `taxonomy_list` | Liệt kê định nghĩa taxonomy | không có |
| `taxonomy_list_terms` | Liệt kê term của một taxonomy | `taxonomy`*, `limit`, `cursor` |
| `taxonomy_create_term` | Tạo term mới (chuỗi tổ tiên tối đa 100 cấp) | `taxonomy`*, `slug`*, `label`*, `parentId`, `description` |
| `taxonomy_update_term` | Cập nhật term; `parentId: null` để tách khỏi cha | `taxonomy`*, `termSlug`*, `slug`, `label`, `parentId`, `description` |
| `taxonomy_delete_term` | Xoá vĩnh viễn (phải xoá con trước) | `taxonomy`*, `termSlug`* — **phá huỷ** |

Scope `taxonomies:manage`, vai trò Editor+ (trừ `list`/`list_terms` là `content:read`, chỉ đọc).

### Tool Menu

| Tool | Mô tả | Tham số chính |
| --- | --- | --- |
| `menu_list` | Liệt kê menu (theo locale hoặc mọi locale) | `locale` |
| `menu_get` | Lấy menu kèm mọi item theo thứ tự | `name`*, `locale` |
| `menu_create` | Tạo menu mới | `name`* (khớp `/^[a-z][a-z0-9_]*$/`), `label`*, `locale`, `translationOf` |
| `menu_update` | Sửa label (không đổi được `name`) | `name`*, `label`*, `locale` |
| `menu_delete` | Xoá menu và mọi item — **phá huỷ** | `name`*, `locale` |
| `menu_set_items` | Thay **toàn bộ** danh sách item trong một lần gọi (atomic) | `name`*, `locale`, `items`* |

`menu_set_items` định vị item theo chỉ số mảng; lồng nhau qua `parentIndex` (item với `parentIndex: 0` lồng dưới item ở chỉ số 0, cha phải xuất hiện trước trong danh sách). Mỗi `MenuItem`: `label`*, `type`* (`custom`/`page`/`post`/`taxonomy`/`collection`), `customUrl`, `referenceCollection`, `referenceId`, `titleAttr`, `target`, `cssClasses`, `parentIndex`. Scope `menus:manage`, vai trò Editor+ (trừ `list`/`get` là `content:read`, chỉ đọc).

### Tool Revision

**`revision_list`** — lịch sử revision, mới nhất trước (Collection cần hỗ trợ `revisions`). Tham số: `collection`*, `id`*, `limit` (1-50, mặc định 20). Chỉ đọc.

**`revision_restore`** — khôi phục entry về một revision trước, thay draft hiện tại (không tự publish). Tham số: `revisionId`*. Scope `content:write`.

### Tool Settings

Site settings toàn cục — title, tagline, logo, favicon, canonical URL, cỡ trang mặc định, định dạng ngày giờ, tài khoản mạng xã hội, mặc định SEO.

**`settings_get`** — lấy toàn bộ settings (tham chiếu media kèm URL đã resolve). Không tham số. Scope `settings:read`, vai trò Editor+, chỉ đọc.

**`settings_update`** — cập nhật một phần. Để đặt tham chiếu media (`logo`, `favicon`, `seo.defaultOgImage`), truyền object `{ mediaId, alt? }` — media phải đã tồn tại (dùng `media_create` trước). Tham số: `title`, `tagline`, `logo`, `favicon`, `url`, `postsPerPage` (1-100), `dateFormat`, `timezone`, `social` (`twitter`/`github`/`facebook`/`instagram`/`linkedin`/`youtube`), `seo` (`titleSeparator`, `defaultOgImage`, `robotsTxt`, `googleVerification`, `bingVerification`). Scope `settings:manage`, vai trò Admin.

## OAuth Discovery

Hầu hết MCP client tự xử lý phần này — mục này dành cho ai tự xây MCP client kết nối trực tiếp với EmDash. Client hỗ trợ OAuth 2.1 tự khám phá cách xác thực từ hai tài liệu metadata:

**Protected Resource Metadata:** `GET /.well-known/oauth-protected-resource` — trả về resource identifier, authorization server, và scope hỗ trợ:

```json
{
  "resource": "https://example.com/_emdash/api/mcp",
  "authorization_servers": ["https://example.com/_emdash"],
  "scopes_supported": ["content:read", "content:write", "media:read", "media:write", "schema:read", "schema:write", "taxonomies:manage", "menus:manage", "settings:read", "settings:manage", "admin"],
  "bearer_methods_supported": ["header"]
}
```

**Authorization Server Metadata:** `GET /.well-known/oauth-authorization-server/_emdash` — trả về endpoint, scope, và grant type hỗ trợ:

```json
{
  "issuer": "https://example.com/_emdash",
  "authorization_endpoint": "https://example.com/_emdash/oauth/authorize",
  "token_endpoint": "https://example.com/_emdash/api/oauth/token",
  "scopes_supported": ["content:read", "content:write", "..."],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token", "urn:ietf:params:oauth:grant-type:device_code"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none"],
  "device_authorization_endpoint": "https://example.com/_emdash/api/oauth/device/code"
}
```

Khi một request chưa xác thực gọi tới endpoint MCP, server trả về:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://example.com/.well-known/oauth-protected-resource"
```

Kích hoạt luồng khám phá chuẩn của MCP client.

## Xử lý lỗi

Lỗi tool trả về dạng text content kèm `isError: true`. Message có tiền tố mã ổn định `[CODE]`, cùng mã đó lặp lại trong `_meta.code`:

```json
{
  "content": [{ "type": "text", "text": "[NOT_FOUND] Collection 'nonexistent' not found" }],
  "isError": true,
  "_meta": { "code": "NOT_FOUND" }
}
```

Lỗi scope/permission dùng cùng khuôn lỗi:

```json
{
  "content": [{ "type": "text", "text": "[INSUFFICIENT_SCOPE] Insufficient scope: requires content:write" }],
  "isError": true,
  "_meta": { "code": "INSUFFICIENT_SCOPE" }
}
```

Lỗi tầng transport (server cấu hình sai, exception chưa xử lý) trả mã lỗi JSON-RPC `-32603` (Internal error), không lộ chi tiết cài đặt bên trong.

## Xem thêm

- [Chương 19 — Quản lý người dùng, vai trò và quyền hạn](./19-nguoi-dung-vai-tro.md)
- [Chương 32 — Công cụ AI tích hợp sẵn](./32-cong-cu-ai.md)
- [Chương 35 — REST API tham chiếu](./35-rest-api.md)
