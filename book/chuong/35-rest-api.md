# 35. REST API tham chiếu

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

EmDash expose một REST API tại `/_emdash/api/` để quản lý nội dung, upload media, và thao tác schema. Chương này là tham chiếu đầy đủ REST API, cộng thêm phần **JavaScript API** (các hàm `emdash` export để dùng trong code Astro) ở cuối chương.

### Xác thực

Request API cần xác thực bằng Bearer token trong header `Authorization`:

```http
Authorization: Bearer <token>
```

Sinh token qua giao diện admin hoặc bằng chương trình.

### Định dạng Response

Response thành công bọc kết quả trong `data`:

```json
{
  "success": true,
  "data": { ... }
}
```

Response lỗi gồm code, message, và chi tiết tuỳ chọn:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

## Endpoint Nội dung (Content)

| Endpoint | Method | Mô tả |
| --- | --- | --- |
| `/_emdash/api/content/:collection` | GET | Danh sách nội dung (query: `cursor`, `limit` mặc định 50, `status`, `orderBy`, `order`) |
| `/_emdash/api/content/:collection/:id` | GET | Lấy một entry |
| `/_emdash/api/content/:collection` | POST | Tạo nội dung mới (`data`, `slug`, `status`) |
| `/_emdash/api/content/:collection/:id` | PUT | Cập nhật nội dung (`data`, `status`) |
| `/_emdash/api/content/:collection/:id` | DELETE | Xoá nội dung (soft delete) |

Ví dụ response danh sách:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "01HXK5MZSN...",
        "type": "posts",
        "slug": "hello-world",
        "data": { "title": "Hello World", ... },
        "status": "published",
        "createdAt": "2025-01-24T12:00:00Z",
        "updatedAt": "2025-01-24T12:00:00Z"
      }
    ],
    "nextCursor": "eyJpZCI6..."
  }
}
```

## Endpoint Media

### Danh sách và chi tiết

```http
GET /_emdash/api/media?includeUsage=1
GET /_emdash/api/media/:id?includeUsage=1
```

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `cursor` | `string` | Cursor phân trang mờ |
| `page` | `number` | Trang đánh số, bắt đầu từ 1; không kết hợp được với `cursor` |
| `limit` | `number` | Số mục mỗi trang, 1-100 (mặc định 50) |
| `mimeType` | `string` | Lọc theo một/nhiều MIME type (phân tách dấu phẩy) |
| `q` | `string` | Tìm tên tệp, không phân biệt hoa/thường |
| `folderId` | `string` | ID folder, hoặc `unfiled` cho Main library |
| `includeUsage` | `1` | Kèm tóm tắt `usage` (chỉ nhận giá trị `1`) |

Bỏ qua `folderId` để liệt kê media từ Main library và mọi folder. Request đánh số trả về `totalCount`; chế độ cursor trả `nextCursor` khi còn trang tiếp theo.

**Tóm tắt Usage:** `usage.count` là số dòng nội dung/locale đang hoạt động tham chiếu tới media đó (tham chiếu lặp lại/nhiều biến thể nguồn của cùng entry chỉ tính một lần; nội dung trong trash không tính). Số đếm chỉ trả về khi user session có `content:read_drafts`, hoặc token bearer có scope `admin` và user liên kết cũng có quyền đó — người đọc media khác nhận `usage.count: null` (redact thành công, không phải lỗi). Mỗi tóm tắt kèm trạng thái coverage tổng hợp: `complete`, `never`, `running`, `partial`, `failed`, `stale`, `unknown`. Chỉ `complete` hỗ trợ khẳng định "chắc chắn bằng 0" trong phạm vi hỗ trợ; các status khác là ước lượng theo index, có thể báo thừa/thiếu. Ngay cả kết quả `complete` cũng chỉ mang tính tham khảo khi có ghi đồng thời — không dùng usage read làm khoá giao dịch hay đảm bảo an toàn xoá.

**Chi tiết usage:** `GET /_emdash/api/media/:id/usage?limit=50&cursor=...` — cần `media:read` và `content:read_drafts` (bearer cần thêm scope `admin`). `limit` tính theo nhóm entry nội dung (1-100, mặc định 50), phân trang không bao giờ tách sources/occurrences của một nhóm entry. Kết quả gồm cả entry active và trashed (`deletedAt` khác null xác định entry đã trash). Việc theo dõi usage chỉ bao phủ tham chiếu media cục bộ trong field ảnh/tệp cấp cao nhất, field ảnh trong repeater, và khối ảnh Portable Text lưu trong Collection nội dung EmDash — **không** quét code tuỳ chỉnh, HTML đã render, settings, menu, widget, dữ liệu riêng của plugin, site ngoài, hay asset chỉ-provider.

### Upload Media

Upload cần `media:upload` (bearer token cần thêm scope `media:write`). Giới hạn mặc định 50 MB (đổi qua `maxUploadSize`, xem [Chương 36](./36-cau-hinh-emdash.md)). Hai cách:

**Upload multipart trực tiếp** — gửi tệp trong field `file` của request multipart:

```bash
curl --request POST \
  --header "Authorization: Bearer $EMDASH_TOKEN" \
  --header "X-EmDash-Request: 1" \
  --form "file=@./photo.jpg;type=image/jpeg" \
  https://example.com/_emdash/api/media
```

Field multipart tuỳ chọn thêm: `width`, `height`, `fieldId` (field áp dụng allowlist MIME type đã cấu hình), `thumbnail`. Upload mới trả `201 Created` kèm `folderId: null`; nếu tệp đã tồn tại, trả `200 OK` với `deduplicated: true`. Upload multipart trực tiếp sẵn sàng ngay, không cần endpoint xác nhận.

**Luồng upload target** (giữ media ở trạng thái `pending` tới khi xác nhận, dùng cho storage tương thích S3):

1. **Yêu cầu upload target:** `POST /_emdash/api/media/upload-url` với `filename`, `contentType`, `size` (bắt buộc), `contentHash` (`sha1:` + 40 ký tự hex, để tìm trùng khớp) và `fieldId` (tuỳ chọn). Response gồm `uploadUrl`, `method`, `headers`, `mediaId`, `storageKey`, `expiresAt`. Nếu `contentHash` khớp media có sẵn cùng MIME/size, response trả `existing: true` kèm media item có sẵn — dừng lại, không upload/xác nhận.
2. **Upload tệp tới `uploadUrl`** dùng đúng `method`/`headers` trả về. Với target cùng-origin EmDash, gửi kèm Bearer token; với signed URL trên origin khác, **chỉ** gửi header đã trả về (không gửi token EmDash tới origin khác).
3. **Xác nhận upload:** `POST /_emdash/api/media/:id/confirm` với `size`/`width`/`height` tuỳ chọn (được validate nếu có) — chuyển media từ `pending` sang `ready`.

**Lỗi upload:** `NO_FILE` (400), `INVALID_TYPE` (400), `VALIDATION_ERROR` (400), `FILE_NOT_FOUND` (400), `UPLOAD_SIZE_MISMATCH` (400), `INVALID_STATE` (400/409), `NOT_FOUND` (404), `PAYLOAD_TOO_LARGE` (413).

### Cập nhật, Folder, Xoá Media

```http
PUT /_emdash/api/media/:id
```
Body: `{ "alt", "caption", "folderId" }` — bỏ `folderId` để giữ nguyên gán hiện tại; đặt `null`/`unfiled` để trả về Main library. Gán media sở hữu cần `media:edit_own`; gán media bất kỳ cần `media:edit_any`.

| Endpoint | Method | Mô tả |
| --- | --- | --- |
| `/_emdash/api/media/folders` | GET | Danh sách folder (`cursor`, `limit` 1-100 mặc định 50, `q` tìm tên 1-200 ký tự) |
| `/_emdash/api/media/folders/:id` | GET | Lấy một folder |
| `/_emdash/api/media/folders` | POST | Tạo folder (`name`, 1-200 ký tự, so khớp trùng lặp sau chuẩn hoá Unicode + viết thường) |
| `/_emdash/api/media/folders/:id` | PUT | Đổi tên folder |
| `/_emdash/api/media/folders/:id` | DELETE | Xoá folder (media trả về Main library, không xoá media/đổi ID/URL) |
| `/_emdash/api/media/:id` | DELETE | Xoá media |
| `/_emdash/api/media/file/:key` | GET | Phục vụ nội dung tệp thật (chỉ với local storage) |

Tạo/đổi tên/xoá folder cần `media:edit_any`. Lỗi folder: `INVALID_CURSOR` (400), `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `CONFLICT` (409, tên trùng đã chuẩn hoá).

### Bật theo dõi việc dùng Media (nâng cao — dành cho vận hành viên qua API)

Site chưa bật media usage tracking cần bật **một lần**, tạm dừng ghi database trực tiếp trong lúc chuẩn bị. Cả hai endpoint dưới cần `schema:manage` (bearer cần thêm scope `admin`) — xem quy trình admin tương ứng ở [Chương 9](./09-thu-vien-media.md).

- `GET /_emdash/api/admin/media-usage/activation` — kiểm tra trạng thái hiện tại: `expanded` (tắt), `activating` (đang chuẩn bị), `active` (đang theo dõi).
- `POST /_emdash/api/admin/media-usage/activation` với `{ "writersDrained": true }` — chuẩn bị tối đa một Collection mỗi lần gọi; chỉ đặt `writersDrained: true` sau khi mọi ghi trực tiếp đã dừng và lượt ghi đang chạy đã hoàn tất.
- `GET`/`POST /_emdash/api/admin/media-usage/progress` — kiểm tra/thúc đẩy tiến độ lập chỉ mục lịch sử (`indexing`/`ready`/`needs_attention`), trả `nextRequestInMs` (`0` = gọi tiếp ngay, `30000` = chờ rồi thử lại, `null` = không còn việc).

Quy trình gọi API: dừng mọi writer trực tiếp → chờ ghi đang chạy xong → gọi `GET` activation → gọi `POST` activation với `writersDrained: true` → gọi `POST` progress tuần tự theo `nextRequestInMs` tới khi `active` → tiếp tục progress tới khi `ready`. **Sau khi bắt đầu, quá trình này không thể huỷ hay reset** — test trên staging trước khi chạy production.

Các endpoint liên quan khác (đều cần `schema:manage`/`admin` scope): `GET /_emdash/api/admin/media-usage/work` (liệt kê công việc lập chỉ mục còn tồn theo Collection), `POST .../work/retry` (thử lại một job), `GET/POST /_emdash/api/admin/media-usage/collection-deletions[/retry]` (khôi phục dọn dẹp index khi xoá Collection).

**Sửa index usage:** `POST /_emdash/api/admin/media-usage/repair` — body `{ "scope": "collection", "collection": "posts" }` hoặc `{ "scope": "all" }` (bắt buộc). Sửa toàn bộ nội dung chạy đồng bộ/tuần tự, có thể tốn kém trên site lớn. Response `data.status` là `complete`/`partial`/`failed`/`stale` (trạng thái nghiệp vụ, không phải lỗi transport), kèm `indexedSourceCount`, `failedSourceCount`, `skippedSourceCount`, `deletedSourceCount`, và mảng `collections` chi tiết theo từng Collection.

## Endpoint Revision

| Endpoint | Method | Mô tả |
| --- | --- | --- |
| `/_emdash/api/content/:collection/:entryId/revisions` | GET | Danh sách revision (`limit`, mặc định 50) |
| `/_emdash/api/revisions/:revisionId` | GET | Lấy một revision |
| `/_emdash/api/revisions/:revisionId/restore` | POST | Khôi phục về revision này (tạo revision mới) |

## Endpoint Schema

| Endpoint | Method | Mô tả |
| --- | --- | --- |
| `/_emdash/api/schema/collections` | GET | Danh sách Collection |
| `/_emdash/api/schema/collections/:slug` | GET | Lấy một Collection (`includeFields` để kèm field) |
| `/_emdash/api/schema/collections` | POST | Tạo Collection (`slug`, `label`, `labelSingular`, `description`, `supports`) |
| `/_emdash/api/schema/collections/:slug` | PUT | Cập nhật Collection |
| `/_emdash/api/schema/collections/:slug` | DELETE | Xoá Collection (`force` để xoá dù còn nội dung) |
| `/_emdash/api/schema/collections/:slug/fields` | GET | Danh sách field |
| `/_emdash/api/schema/collections/:slug/fields` | POST | Tạo field (`slug`, `label`, `type`, `required`, `validation`) |
| `/_emdash/api/schema/collections/:c/fields/:f` | PUT | Cập nhật field |
| `/_emdash/api/schema/collections/:c/fields/:f` | DELETE | Xoá field |
| `/_emdash/api/schema/collections/:slug/fields/reorder` | POST | Sắp xếp lại field (`fieldSlugs`: mảng thứ tự mới) |

**Xuất Schema:** `GET /_emdash/api/schema` (JSON) hoặc `GET /_emdash/api/schema?format=typescript` (interface TypeScript cho mọi Collection).

## Endpoint Plugin

| Endpoint | Method | Mô tả |
| --- | --- | --- |
| `/_emdash/api/admin/plugins` | GET | Danh sách plugin |
| `/_emdash/api/admin/plugins/:id` | GET | Lấy chi tiết plugin |
| `/_emdash/api/admin/plugins/:id/enable` | POST | Bật plugin |
| `/_emdash/api/admin/plugins/:id/disable` | POST | Tắt plugin |

## Mã lỗi (Error Codes)

| Code | HTTP Status | Mô tả |
| --- | --- | --- |
| `NOT_FOUND` | 404 | Không tìm thấy resource |
| `VALIDATION_ERROR` | 400 | Dữ liệu đầu vào không hợp lệ |
| `UNAUTHORIZED` | 401 | Thiếu hoặc sai token |
| `FORBIDDEN` | 403 | Không đủ quyền |
| `CONTENT_LIST_ERROR` | 500 | Lỗi liệt kê nội dung |
| `CONTENT_CREATE_ERROR` | 500 | Lỗi tạo nội dung |
| `CONTENT_UPDATE_ERROR` | 500 | Lỗi cập nhật nội dung |
| `SAVE_REJECTED` | 422 | Lưu bị từ chối bởi plugin hook (xem [Chương 37](./37-hooks-vong-doi.md)) |
| `CONTENT_HOOK_ERROR` | 500 | Plugin hook lỗi khi lưu |
| `CONTENT_DELETE_ERROR` | 500 | Lỗi xoá nội dung |
| `MEDIA_LIST_ERROR` | 500 | Lỗi liệt kê media |
| `MEDIA_CREATE_ERROR` | 500 | Lỗi tạo media |
| `SCHEMA_CREATE_ERROR` | 500 | Lỗi thao tác schema |
| `SLUG_CONFLICT` | 409 | Slug đã tồn tại |
| `RESERVED_SLUG` | 400 | Slug bị dành riêng |

## Endpoint Tìm kiếm

```http
GET /_emdash/api/search?q=hello+world
```

Tham số: `q` (bắt buộc), `collections` (danh sách slug phân tách dấu phẩy), `status` (mặc định `published`), `limit` (mặc định 20), `cursor`. Response gồm `items` (mỗi item có `collection`, `id`, `slug`, `locale`, `title`, `snippet` chứa thẻ `<mark>`, `score`) và `nextCursor`.

`GET /_emdash/api/search/suggest?q=hel&limit=5` — gợi ý tiêu đề khớp tiền tố cho autocomplete.

**Cấu hình tìm kiếm Collection:** `POST /_emdash/api/search/enable` với `{ collection, enabled, tokenize, weights }`. `tokenize` điều khiển cách SQLite FTS5 lập chỉ mục — đổi trên Collection đã bật sẽ dựng lại và nạp lại chỉ mục:

| Giá trị `tokenize` | Dùng khi |
| --- | --- |
| `porter unicode61` (mặc định) | Nội dung tiếng Anh, hưởng lợi từ Porter stemming |
| `unicode61` | Ngôn ngữ có dấu cách từ nhưng không nên stem kiểu tiếng Anh |
| `trigram` | Ngôn ngữ không cách từ bằng khoảng trắng (Nhật, Trung, Thái, Khmer, Lào, Miến Điện), hoặc cần khớp chuỗi con — truy vấn ngắn hơn 3 ký tự Unicode không khớp gì |

`POST /_emdash/api/search/rebuild` với `{ collection }` — dựng lại chỉ mục FTS theo tokenizer/weight đã lưu. `GET /_emdash/api/search/stats` — trả số tài liệu đã lập chỉ mục theo Collection.

## Endpoint Section, Settings, Menu, Taxonomy, Widget Area (CRUD chuẩn)

Các resource dưới đây theo mẫu CRUD nhất quán (List/Get/Create/Update/Delete) — chi tiết body request đã trình bày ở chương liên quan (Chương 18 cho Section, Chương 14 cho Settings, Chương 10 cho Menu, Chương 12 cho Taxonomy, Chương 11 cho Widget Area):

| Resource | Endpoint gốc | Ghi chú riêng |
| --- | --- | --- |
| Section | `/_emdash/api/sections[/:slug]` | Lọc bằng `?source=` hoặc `?search=` |
| Settings | `/_emdash/api/settings` | Chỉ GET (lấy tất cả) và POST (cập nhật một phần) |
| Menu | `/_emdash/api/menus[/:name]`, `.../items`, `.../reorder` | Reorder dùng `{ items: [{ id, parentId, sortOrder }] }` |
| Taxonomy | `/_emdash/api/taxonomies[/:name]`, `.../terms[/:slug]`, `.../reorder` | Xem "Reorder Terms" bên dưới |
| Widget Area | `/_emdash/api/widget-areas[/:name]`, `.../widgets[/:id]`, `.../reorder` | Reorder dùng `{ widgetIds: [...] }` |
| Gán term cho nội dung | `POST /_emdash/api/content/:collection/:id/terms/:taxonomy` | Body `{ termIds: [...] }` |

### Reorder Terms — chi tiết đặc thù

```http
POST /_emdash/api/taxonomies/:name/reorder
Content-Type: application/json

{
  "parentId": "term_abc",
  "ids": ["term_news", "term_featured"]
}
```

Đặt thứ tự cho **một nhóm anh em (sibling group)**. `parentId` đặt tên cha có các con đang được sắp xếp; bỏ qua (hoặc `null`) cho cấp cao nhất (với taxonomy phẳng là mọi term). Reorder **không bao giờ** đổi cha của term — dùng "Update Term" cho việc đó.

`ids` có thể là **tập con** của nhóm: các term liệt kê được hoán vị trong đúng những vị trí chúng đang chiếm, mọi thành viên khác giữ nguyên chỗ. Điều này quan trọng khi một locale không render hết cả nhóm — một danh sách cũ (stale) không thể "chôn vùi" các term nó bỏ sót. ID nằm ngoài nhóm bị từ chối với `REORDER_MISMATCH`; tối đa 100 ID mỗi lần gửi.

> Vì các term bị bỏ ngoài giữ nguyên vị trí tuyệt đối, một bước di chuyển trong danh sách một phần có thể kéo một term vượt qua các anh em không có trong danh sách đó. Với nhóm đầy đủ `[A, B, C]`, gửi `["C", "A"]` (vì `B` chưa dịch sang locale đang làm việc) cho kết quả `[C, B, A]` — `A` và `C` đổi chỗ đúng như yêu cầu, nhưng một danh sách có hiển thị `B` sẽ thấy `A` di chuyển 2 vị trí thay vì 1.

Không có tham số `locale` — một term giữ một vị trí xuyên suốt mọi locale nó được dịch, nên ID có thể là term ID hoặc nhóm dịch, và sắp xếp taxonomy ở một locale sẽ sắp xếp ở mọi locale. Site cần thứ tự khác nhau theo từng locale nên dùng taxonomy riêng biệt.

## Endpoint Quản lý người dùng

| Endpoint | Method | Mô tả |
| --- | --- | --- |
| `/_emdash/api/admin/users` | GET | Danh sách user (lọc `?role=`, `?search=`) |
| `/_emdash/api/admin/users/:id` | GET | Lấy user |
| `/_emdash/api/admin/users/:id` | PUT | Cập nhật user (`name`, `role`) |
| `/_emdash/api/admin/users/:id/enable` | POST | Kích hoạt user |
| `/_emdash/api/admin/users/:id/disable` | POST | Vô hiệu hoá user |

## Endpoint Xác thực

| Endpoint | Method | Mô tả |
| --- | --- | --- |
| `/_emdash/api/setup/status` | GET | Setup đã hoàn tất chưa, đã có user chưa |
| `/_emdash/api/auth/passkey/options` | POST | Lấy tuỳ chọn xác thực WebAuthn |
| `/_emdash/api/auth/passkey/verify` | POST | Xác minh Passkey, tạo session |
| `/_emdash/api/auth/magic-link/send` | POST | Gửi magic link (`email`) |
| `/_emdash/api/auth/magic-link/verify` | GET | Xác minh magic link (`?token=`) |
| `/_emdash/api/auth/logout` | POST | Đăng xuất |
| `/_emdash/api/auth/me` | GET | Thông tin user hiện tại |
| `/_emdash/api/auth/invite` | POST | Mời user mới (`email`, `role`) |
| `/_emdash/api/auth/passkey` | GET | Danh sách Passkey của user |
| `/_emdash/api/auth/passkey/register/options` + `/verify` | POST | Đăng ký Passkey mới |
| `/_emdash/api/auth/passkey/:id` | PATCH | Đổi tên Passkey (`name`) |
| `/_emdash/api/auth/passkey/:id` | DELETE | Xoá Passkey |

## Endpoint Nhập dữ liệu (Import)

| Endpoint | Method | Mô tả |
| --- | --- | --- |
| `/_emdash/api/import/wordpress/analyze` | POST (multipart) | Phân tích file WXR |
| `/_emdash/api/import/wordpress/execute` | POST | Thực hiện nhập (`analysisId`, `options: { includeMedia, includeTaxonomies, includeMenus }`) |

(Xem chi tiết luồng đầy đủ ở [Chương 23](./23-di-chuyen-tu-wordpress.md) và [Chương 24](./24-nhap-noi-dung.md).)

## Rate Limiting

Endpoint API có thể bị giới hạn tốc độ tuỳ cấu hình triển khai. Khi bị giới hạn, response gồm:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

## CORS

API hỗ trợ CORS cho request từ trình duyệt — cấu hình origin được phép trong triển khai của bạn.

---

## JavaScript API (dùng trong code Astro)

Ngoài REST API, `emdash` export các hàm lập trình để truy vấn và quản lý nội dung trực tiếp trong code — dùng preview, settings, menu, taxonomy, widget area, section, và search.

### Truy vấn nội dung

`getEmDashCollection(collection, options?)` và `getEmDashEntry(collection, slugOrId, options?)` đã trình bày đầy đủ ở [Chương 34](./34-truy-van-noi-dung.md). Bổ sung chi tiết kiểu dữ liệu tham số/kết quả:

```ts
interface CollectionFilter {
	status?: "draft" | "published" | "archived";
	limit?: number;
	cursor?: string; // Phân trang keyset — truyền `nextCursor` trước đó
	offset?: number; // Phân trang offset — bỏ qua N entry (dùng cùng `limit`)
	where?: Record<string, string | string[]>;
}

interface CollectionResult<T> {
	entries: ContentEntry<T>[];
	error?: Error;
	nextCursor?: string;
	hasMore?: boolean; // Còn entry sau trang này không (khi có đặt `limit`)
}
```

Ví dụ phân trang kiểu offset cho trang archive đánh số (vd `/page/3`):

```ts
const perPage = 20;
const page = Number(Astro.params.page ?? 1);
const { entries: pagePosts, hasMore } = await getEmDashCollection("posts", {
	status: "published",
	limit: perPage,
	offset: (page - 1) * perPage,
	orderBy: { published_at: "desc" },
});
```

`getEmDashEntry` nhận `options` chỉ chấp nhận `locale` (cho phân giải slug) — trạng thái preview không cần tham số nào, tự động qua middleware (xem lại [Chương 13](./13-xem-truoc-preview.md)).

### Kiểu `ContentEntry`

```ts
interface ContentEntry<T = Record<string, unknown>> {
	id: string;
	data: T;
	edit: EditProxy; // Chú thích visual editing
}
```

`data` chứa mọi field nội dung cộng field hệ thống: `id`, `slug`, `status` (`"draft" | "published" | "archived"`), `createdAt`, `updatedAt`, `publishedAt` (ISO timestamp hoặc null), cộng mọi field tuỳ chỉnh của Collection.

### Hệ thống Preview

`generatePreviewToken({ contentId, secret, expiresIn })`, `verifyPreviewToken({ token, secret })`, `isPreviewRequest(url)`, `getPreviewToken(url)` — đã trình bày đầy đủ ở [Chương 13](./13-xem-truoc-preview.md).

### Chuyển đổi định dạng nội dung

```ts
import { prosemirrorToPortableText, portableTextToProsemirror } from "emdash";

const portableText = prosemirrorToPortableText(prosemirrorDoc);
const prosemirrorDoc = portableTextToProsemirror(portableText);
```

Chuyển đổi giữa định dạng ProseMirror (dùng trong editor) và Portable Text (dùng khi lưu trữ).

### Site Settings, Menu, Taxonomy, Widget Area, Section, Search

Các hàm `getSiteSettings()`/`getSiteSetting()`, `getMenu()`/`getMenus()`, `getTaxonomyTerms()`/`getTerm()`/`getEntryTerms()`/`getEntriesByTerm()`, `getWidgetArea()`/`getWidgetAreas()`, `getSection()`/`getSections()` đã trình bày đầy đủ ở các chương tương ứng (14, 10, 12, 11, 18). Settings **chỉ đọc** từ runtime API — dùng admin API để cập nhật.

Hàm `search()` — tìm kiếm toàn cục qua nhiều Collection, kết quả kèm đoạn trích tô sáng:

```ts
import { search } from "emdash";

const results = await search("hello world", {
	collections: ["posts", "pages"],
	status: "published",
	limit: 20,
});

results.items.forEach(result => {
	console.log(result.title);
	console.log(result.snippet); // chứa thẻ <mark>
	console.log(result.score);
});

// Phân trang: truyền lại nextCursor trước đó làm `cursor`
if (results.nextCursor) {
	const next = await search("hello world", {
		collections: ["posts", "pages"],
		limit: 20,
		cursor: results.nextCursor,
	});
}
```

### Xử lý lỗi

`emdash` export các class lỗi để xử lý từng loại thất bại cụ thể:

```ts
import {
  EmDashDatabaseError,
  EmDashValidationError,
  EmDashStorageError,
  SchemaError,
} from "emdash";

try {
  await repo.create({ ... });
} catch (error) {
  if (error instanceof EmDashValidationError) {
    console.error("Validation failed:", error.message);
  }
  if (error instanceof SchemaError) {
    console.error("Schema error:", error.code, error.details);
  }
}
```

## Xem thêm

- [Chương 9 — Thư viện Media](./09-thu-vien-media.md)
- [Chương 13 — Xem trước (Preview) trước khi xuất bản](./13-xem-truoc-preview.md)
- [Chương 20 — Cài đặt & Quản lý Plugin (người dùng cuối)](./20-cai-dat-plugin.md)
- [Chương 33 — Tổng quan công cụ cho dev: CLI, API, MCP](./33-tong-quan-cong-cu-dev.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
- [Chương 37 — Hooks & vòng đời sự kiện](./37-hooks-vong-doi.md)
- [Chương 38 — Máy chủ MCP cho AI Agent](./38-mcp-server.md)
