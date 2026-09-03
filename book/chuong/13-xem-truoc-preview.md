# 13. Xem trước (Preview) trước khi xuất bản

Áp dụng cho vai trò: Người biên tập nội dung, Lập trình viên (khi tuỳ chỉnh template hoặc tích hợp)

## Tổng quan

Hệ thống Preview của EmDash cho phép biên tập viên xem nội dung chưa xuất bản thông qua URL an toàn, có thời hạn. Liên kết preview dùng token ký bằng HMAC-SHA256 mà bạn có thể chia sẻ cho người review mà không cần công khai toàn bộ nội dung nháp.

### Cách hoạt động

1. Admin sinh một URL preview cho bài viết đang ở dạng nháp.
2. URL chứa tham số query `_preview` là một token đã ký, kèm thời gian hết hạn.
3. Middleware của EmDash tự động xác minh token và thiết lập ngữ cảnh request.
4. Code template của bạn gọi `getEmDashEntry()` như bình thường — nội dung nháp được phục vụ tự động.

Preview mang tính **ngầm định** (implicit): middleware xác minh token và các hàm truy vấn đọc nó qua `AsyncLocalStorage`, nên cùng một đoạn code template phục vụ nội dung nháp khi đang preview và nội dung published khi không.

## Thiết lập Preview

Preview hoạt động ngay khi cài EmDash. Lần dùng đầu tiên, EmDash tự sinh một secret preview riêng cho site và lưu trong database — trường hợp thông thường không cần cấu hình gì thêm.

Chỉ đặt `EMDASH_PREVIEW_SECRET` trong biến môi trường khi cần:

- Chia sẻ secret giữa nhiều tiến trình (vd một Worker preview riêng ký URL rồi gửi cho site chính xác minh).
- Cố định secret theo giá trị bạn kiểm soát vì lý do tuân thủ/kiểm toán (compliance/audit).
- Chuyển sang giá trị đã biết trước khi khôi phục từ bản sao lưu.

```bash title=".env"
# Tuỳ chọn: ghi đè secret tự sinh
EMDASH_PREVIEW_SECRET="your-random-secret-key-here"
```

Nếu đặt, giá trị từ biến môi trường sẽ ưu tiên hơn giá trị lưu trong database.

Template hiện có hoạt động với preview tự động, không cần xử lý đặc biệt:

```astro title="src/pages/posts/[...slug].astro"
---
import { getEmDashEntry } from "emdash";

const { slug } = Astro.params;

const { entry, isPreview, error } = await getEmDashEntry("posts", slug);

if (error) {
  return new Response("Server error", { status: 500 });
}

if (!entry) {
  return Astro.redirect("/404");
}
---

{isPreview && (
  <div class="preview-banner">
    You are viewing a preview. This content is not published.
  </div>
)}

<article>
  <h1>{entry.data.title}</h1>
</article>
```

Cờ `isPreview` là `true` khi nội dung nháp đang được phục vụ qua một token preview hợp lệ.

## Cách tạo liên kết Preview (dành cho biên tập viên)

Hầu hết site dùng nút **"Generate preview link"** ngay trong admin UI — thao tác này đi qua API và tự dùng secret đã resolve, không cần bạn tự cấu hình gì.

## Sinh URL Preview trong code (dành cho lập trình viên)

Dùng `getPreviewUrl()` để tạo liên kết preview. Hàm này nhận secret như một tham số tường minh:

```ts
import { getPreviewUrl } from "emdash";

const previewUrl = await getPreviewUrl({
	collection: "posts",
	id: "my-draft-post",
	secret: import.meta.env.EMDASH_PREVIEW_SECRET,
	expiresIn: "1h",
});
// Trả về: /posts/my-draft-post?_preview=eyJjaWQ...
```

Truyền `baseUrl` để có URL tuyệt đối:

```ts
const fullUrl = await getPreviewUrl({
	collection: "posts",
	id: "my-draft-post",
	secret: import.meta.env.EMDASH_PREVIEW_SECRET,
	baseUrl: "https://example.com",
});
```

Truyền `pathPattern` để tuỳ chỉnh đường dẫn:

```ts
const blogUrl = await getPreviewUrl({
	collection: "posts",
	id: "my-draft-post",
	secret: import.meta.env.EMDASH_PREVIEW_SECRET,
	pathPattern: "/blog/{id}",
});
```

`pathPattern` cũng hỗ trợ placeholder `{locale}` cho site đa ngôn ngữ — truyền `locale: ""` khi entry ở locale mặc định và `prefixDefaultLocale` là `false` (dấu `/` liền kề bị dư sẽ tự được gộp lại). Liên kết "View on site" của admin đi qua endpoint `POST /_emdash/api/content/{collection}/{id}/preview-url`, tự đọc locale của entry và cấu hình i18n của site.

## Thời hạn Token

Kiểm soát thời gian hiệu lực của liên kết preview qua `expiresIn`:

```ts
await getPreviewUrl({ ..., expiresIn: "1h" });   // 1 giờ (mặc định)
await getPreviewUrl({ ..., expiresIn: "30m" });  // 30 phút
await getPreviewUrl({ ..., expiresIn: "1d" });   // 1 ngày
await getPreviewUrl({ ..., expiresIn: "2w" });   // 2 tuần
await getPreviewUrl({ ..., expiresIn: 3600 });   // 3600 giây
```

Đơn vị hỗ trợ: `s` (giây), `m` (phút), `h` (giờ), `d` (ngày), `w` (tuần).

## Xác minh Token (dành cho lập trình viên)

```ts
import { verifyPreviewToken } from "emdash";

// Từ một URL (tự trích tham số _preview)
const result = await verifyPreviewToken({
	url: Astro.url,
	secret: import.meta.env.EMDASH_PREVIEW_SECRET,
});
```

Kết quả cho biết token có hợp lệ không:

```ts
if (result.valid) {
	console.log(result.payload.cid); // "posts:my-draft-post"
	console.log(result.payload.exp); // Thời điểm hết hạn
} else {
	console.log(result.error);
	// "none" — không có token
	// "malformed" — cấu trúc token sai
	// "invalid" — xác minh chữ ký thất bại
	// "expired" — token đã hết hạn
}
```

## Hiển thị chỉ báo Preview

```astro
{isPreview && (
  <div class="preview-banner" role="alert">
    <strong>Preview</strong> — You are viewing unpublished content.
    <a href={Astro.url.pathname}>Exit preview</a>
  </div>
)}
```

> Với biên tập viên đã đăng nhập dùng chỉnh sửa trực quan (visual editing), EmDash tự chèn một thanh công cụ nổi cho biết chế độ edit/preview — bạn chỉ cần banner preview tuỳ chỉnh cho liên kết preview chia sẻ ra ngoài.

## Ví dụ đầy đủ

```astro title="src/pages/posts/[...slug].astro"
---
import { getEmDashEntry } from "emdash";
import BaseLayout from "../../layouts/Base.astro";
import { PortableText } from "emdash/ui";

const { slug } = Astro.params;
const { entry, isPreview, error } = await getEmDashEntry("posts", slug);

if (error) {
  return new Response("Server error", { status: 500 });
}

if (!entry) {
  return Astro.redirect("/404");
}
---

<BaseLayout title={entry.data.title}>
  {isPreview && (
    <div class="preview-banner" role="alert">
      <strong>Preview</strong> — This content is not published.
    </div>
  )}

  <article {...entry.edit}>
    <header>
      <h1 {...entry.edit.title}>{entry.data.title}</h1>
      {entry.data.publishedAt && (
        <time datetime={entry.data.publishedAt.toISOString()}>
          {entry.data.publishedAt.toLocaleDateString()}
        </time>
      )}
      {isPreview && !entry.data.publishedAt && (
        <span class="draft-indicator">Draft</span>
      )}
    </header>

    <div class="content" {...entry.edit.content}>
      <PortableText value={entry.data.content} />
    </div>
  </article>
</BaseLayout>
```

Chú ý các spread `{...entry.edit}` và `{...entry.edit.title}` — chúng thêm thuộc tính `data-emdash-ref` để bật chỉnh sửa trực quan cho biên tập viên đã đăng nhập. Ở production, chúng không tạo ra output nào.

## Bảo mật Token

Token preview được ký và có thời hạn. CLI và các hàm helper tự sinh/xác minh token cho bạn — bạn không tự dựng hay phân tích token bằng tay. Một token chỉ xác định đúng một entry và ngừng hoạt động sau khi hết hạn.

> Giữ kín `EMDASH_PREVIEW_SECRET`. Bất kỳ ai có được giá trị này đều có thể sinh token preview hợp lệ cho bất kỳ nội dung nào.

## Tham chiếu API (dành cho lập trình viên)

| Hàm | Mô tả | Trả về |
| --- | --- | --- |
| `getPreviewUrl(options)` | Sinh URL preview kèm token đã ký (`collection`, `id`, `secret`, `expiresIn`, `baseUrl`, `pathPattern`, `locale`) | `Promise<string>` |
| `verifyPreviewToken(options)` | Xác minh token preview (`secret` + `url` hoặc `token`) | `Promise<VerifyPreviewTokenResult>` |
| `generatePreviewToken(options)` | Sinh token mà không dựng URL (`contentId`, `expiresIn`, `secret`) | `Promise<string>` |
| `isPreviewRequest(url)` | Kiểm tra URL có chứa token preview hay không | `boolean` |
| `getPreviewToken(url)` | Trích chuỗi token từ URL | `string \| null` |
| `parseContentId(contentId)` | Phân tích content ID dạng `collection:id` | `{ collection, id }` |

## Xem thêm

- [Chương 8 — Soạn thảo nội dung và Portable Text](./08-soan-thao-noi-dung.md)
- [Chương 16 — Đa ngôn ngữ cho nội dung](./16-da-ngon-ngu-i18n.md)
- [Chương 28 — Bí mật cấu hình & biến môi trường](./28-bi-mat-cau-hinh.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
