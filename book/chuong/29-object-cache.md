# 29. Bộ nhớ đệm đối tượng (Object Cache)

Áp dụng cho vai trò: Quản trị viên/Vận hành, Lập trình viên

## Tổng quan

EmDash đọc nội dung và cấu hình site từ database ở mỗi request. **Object Cache** lưu kết quả các truy vấn đó vào một kho key/value nhanh, để request lặp lại được phục vụ từ cache thay vì database — giảm tải đọc cho database, đặc biệt hữu ích trên Cloudflare (KV phục vụ được nhiều request/giây hơn D1 rất nhiều).

Object Cache là **tuỳ chọn, tắt theo mặc định**. Bật bằng cách thêm adapter `objectCache` vào integration `emdash()`.

## Hai backend

| Backend | Phù hợp nhất cho | Dùng chung giữa các isolate |
| --- | --- | --- |
| **KV** | Cloudflare Workers | Có |
| **Memory** | Node.js, phát triển cục bộ | Không (theo từng tiến trình) |

Trên Cloudflare, request được phục vụ bởi nhiều isolate ngắn hạn trên nhiều vùng. KV dùng chung cho tất cả — giá trị được cache bởi một request khả dụng cho request tiếp theo, ở bất kỳ đâu. Backend memory chỉ cache trong một tiến trình duy nhất, phù hợp cho server Node.js chạy dài hạn.

## Cloudflare KV

```js title="astro.config.mjs"
import emdash from "emdash/astro";
import { d1, r2, kvCache } from "@emdash-cms/cloudflare";

export default defineConfig({
	integrations: [
		emdash({
			database: d1({ binding: "DB" }),
			storage: r2({ binding: "MEDIA" }),
			objectCache: kvCache({ binding: "CACHE" }),
		}),
	],
});
```

### Thiết lập

Tạo KV namespace và thêm binding vào cấu hình Wrangler:

```sh
npx wrangler kv namespace create CACHE
```

Lệnh in ra `id` namespace — thêm vào dưới tên binding dùng trong `kvCache`:

```jsonc title="wrangler.jsonc"
{
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "<namespace-id>"
    }
  ]
}
```

### Tuỳ chọn

| Tuỳ chọn | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `binding` | `string` | — | Tên binding KV trong cấu hình Wrangler (bắt buộc) |
| `defaultTtl` | `number` | `3600` | Thời gian sống (giây) của entry cache; KV bắt buộc tối thiểu 60 giây |
| `revalidate` | `number` | `1000` | Cửa sổ tái dùng epoch cục bộ theo isolate (ms) — xem mục "Độ tươi" bên dưới |
| `timeout` | `number` | `2000` | Thời gian tối đa (ms) chờ thao tác KV trước khi coi là cache miss — bảo vệ khỏi việc đọc KV bị treo làm treo request; đặt `0` để tắt |
| `keyPrefix` | `string` | `"em"` | Tiền tố cho mọi cache key — đặt giá trị riêng khi nhiều site dùng chung một namespace |

## Node.js (memory)

Adapter memory cache trong tiến trình server, không cần dịch vụ ngoài:

```js title="astro.config.mjs"
import emdash, { memoryCache } from "emdash/astro";
import { sqlite } from "emdash/db";

export default defineConfig({
	integrations: [
		emdash({
			database: sqlite({ url: "file:./data.db" }),
			objectCache: memoryCache(),
		}),
	],
});
```

### Tuỳ chọn

| Tuỳ chọn | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `defaultTtl` | `number` | `3600` | Thời gian sống (giây) của entry cache |
| `revalidate` | `number` | `1000` | Cửa sổ tái dùng epoch cục bộ theo isolate (ms) |
| `maxEntries` | `number` | `1000` | Số key tối đa được cache trước khi key cũ bị loại bỏ |
| `keyPrefix` | `string` | `"em"` | Tiền tố cho mọi cache key |

## Những gì được cache

Object Cache bao phủ các lượt đọc chạy trong một lần render trang thông thường:

- Truy vấn nội dung: `getEmDashCollection`, `getEmDashEntry`, và `resolveEmDashPath`.
- Site settings, menu điều hướng, và term taxonomy.

Request admin API, tệp media, và response HTML đầy đủ **không** được xử lý ở đây. Để cache HTML đã render ở edge, xem lại [Chương 25](./25-trien-khai-cloudflare.md) (mục Workers Cache).

## Độ tươi (Freshness)

Sửa nội dung qua admin panel hoặc REST API **tự động vô hiệu hoá** entry cache liên quan. Tạo/sửa/publish/xoá một entry sẽ xoá cache truy vấn của Collection đó; đổi byline hay term taxonomy xoá cache của các entry hiển thị chúng.

> Liên kết preview và visual editing **bỏ qua** Object Cache, nên editor đang preview thấy nội dung mới nhất ngay lập tức. Request khác — kể cả duyệt đã xác thực ngoài chế độ edit — được phục vụ từ cache, vốn chỉ bao giờ lưu nội dung đã published.

Với khách ẩn danh, một thay đổi cần thời gian để xuất hiện trên mọi isolate khi chúng nhận epoch mới. Với backend memory trong-isolate, việc này tức thì. Với Workers KV, bị giới hạn bởi độ trễ lan truyền edge-cache của KV (nhất quán cuối cùng, tới ~60 giây) cộng với cửa sổ `revalidate` cục bộ theo isolate (mặc định 1 giây). Giảm `revalidate` để lan truyền cục bộ nhanh hơn (đổi lấy nhiều lượt đọc cache hơn); tăng `revalidate` để đọc cache ít hơn.

### Nội dung theo lịch

Entry đã lên lịch trở nên hiển thị khi thời điểm xuất bản của nó tới. Một trang đã cache phản ánh entry vừa xuất bản theo lịch ở lần thay đổi tiếp theo trên Collection đó, hoặc khi `defaultTtl` của entry cache hết hạn. Nếu việc xuất bản theo lịch chính xác quan trọng với site của bạn, đặt `defaultTtl` thấp hơn.

## Xem thêm

- [Chương 8 — Soạn thảo nội dung và Portable Text](./08-soan-thao-noi-dung.md)
- [Chương 13 — Xem trước (Preview) trước khi xuất bản](./13-xem-truoc-preview.md)
- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 26 — Triển khai trên Node.js](./26-trien-khai-nodejs.md)
