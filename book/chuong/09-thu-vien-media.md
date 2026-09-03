# 9. Thư viện Media

Áp dụng cho vai trò: Người biên tập nội dung (phần cấu hình storage/provider dành thêm cho Quản trị viên/Vận hành)

## Tổng quan

EmDash có sẵn thư viện Media (Media Library) để quản lý ảnh, tài liệu và các loại tệp khác. Chương này hướng dẫn upload, tìm kiếm, tổ chức và dùng media trong nội dung.

## Truy cập thư viện Media

Mở thư viện Media từ sidebar admin bằng cách nhấn **Media**. Thư viện chính (Main library) hiển thị các folder và tệp chưa được gán vào folder nào. Mở một folder để xem tệp bên trong.

## Mục "Used in" (nội dung nào đang dùng tệp này)

Mở một tệp trong thư viện Media để xem những entry nội dung nào đang tham chiếu tới nó. Trong lúc EmDash quét nội dung hiện có, danh sách này chỉ chứa các tham chiếu tìm thấy đến thời điểm đó và có thể chưa đầy đủ.

> Danh sách **Used in** chỉ kiểm tra các tham chiếu được EmDash hỗ trợ trong nội dung — không kiểm tra code tuỳ chỉnh hay site bên ngoài, nên danh sách trống **không chứng minh** tệp an toàn để xoá.

### Bật theo dõi việc dùng media (dành cho Quản trị viên)

Nếu tính năng theo dõi (media usage tracking) đang tắt, admin có thể bật:

1. Hoàn tất mọi thao tác sửa nội dung đang dở. Nếu có ứng dụng khác ghi trực tiếp vào database nội dung, tạm dừng nó và đợi các lượt ghi đang chạy hoàn tất.
2. Mở **Settings → Media usage tracking**, chọn **Enable tracking**, rồi xác nhận.
3. Khi trang hiển thị **Indexing existing content**, việc sửa nội dung và các lượt ghi database khác có thể tiếp tục.
4. Giữ trang mở tới khi thấy **Ready**. Nếu rời đi, quay lại để tiếp tục từ tiến độ đã lưu.

Một khi đã bật, tính năng theo dõi này **không thể tắt lại**.

## Upload tệp

**Từ thư viện Media:**
1. Mở **Media** trong sidebar admin.
2. Chọn **Upload Files**, sau đó **Browse files** để chọn một hoặc nhiều tệp. Bạn cũng có thể kéo-thả tệp vào bất kỳ đâu trong thư viện Media.
3. Upload bắt đầu tự động. Hộp thoại hiển thị trạng thái từng tệp và cho phép huỷ hoặc thử lại từng tệp riêng lẻ.

**Từ trình soạn thảo nội dung:**
1. Trong trình soạn thảo rich text, nhấn nút ảnh.
2. Nhấn **Upload** trong bộ chọn media.
3. Chọn tệp từ máy tính.
4. Thêm alt text và nhấn **Insert**.

### Loại tệp được hỗ trợ

| Nhóm | Định dạng |
| --- | --- |
| Ảnh | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif` |
| Tài liệu | `.pdf` |
| Video | `.mp4`, `.webm`, `.mov` |
| Âm thanh | `.mp3`, `.wav`, `.ogg` |

Field kiểu image/file có thể cho phép thêm MIME type khác, kể cả `image/svg+xml` cho tệp SVG.

> Giới hạn mặc định là **50 MB mỗi tệp**. Đặt tuỳ chọn `maxUploadSize` trong cấu hình để thay đổi (xem [Chương 36 — Cấu hình EmDash](./36-cau-hinh-emdash.md)).

## Kho lưu trữ backend (dành cho Quản trị viên/Vận hành)

EmDash hỗ trợ nhiều loại kho lưu trữ, cấu hình trong `astro.config.mjs`:

**Local Storage** — tệp lưu trong thư mục `./uploads`, phù hợp cho phát triển và triển khai một máy chủ:

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";

export default defineConfig({
  integrations: [
    emdash({
      storage: local({
        directory: "./uploads",
        baseUrl: "/_emdash/api/media/file",
      }),
    }),
  ],
});
```

**Cloudflare R2** — cần bucket R2 khai báo trong `wrangler.jsonc`:

```js title="astro.config.mjs"
import emdash from "emdash/astro";
import { r2 } from "@emdash-cms/cloudflare";

export default defineConfig({
  integrations: [
    emdash({
      storage: r2({
        binding: "MEDIA_BUCKET",
        publicUrl: "https://media.example.com",
      }),
    }),
  ],
});
```

**S3-Compatible** — hoạt động với Cloudflare R2 (qua S3 API), MinIO, và các dịch vụ tương thích S3 khác:

```js title="astro.config.mjs"
import emdash, { s3 } from "emdash/astro";

export default defineConfig({
  integrations: [
    emdash({
      storage: s3({
        endpoint: "https://s3.amazonaws.com",
        bucket: "my-media-bucket",
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: "us-east-1",
        publicUrl: "https://media.example.com",
      }),
    }),
  ],
});
```

Kho lưu trữ tương thích S3 trả về URL đã ký (signed URL) để tệp có thể bỏ qua runtime ứng dụng khi upload. Local storage và R2 native trả về endpoint streaming cùng-origin thay thế. (Lưu ý: binding R2 không hỗ trợ pre-signed URL — khi dùng adapter binding R2, upload đi qua Worker của bạn.) Chi tiết đầy đủ hơn ở [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md) và [Chương 26 — Triển khai trên Node.js](./26-trien-khai-nodejs.md).

## Tìm kiếm media

**Tìm kiếm** theo tên tệp — khớp cả tên một phần. **Lọc theo loại** để chỉ hiện ảnh, tài liệu, video, hoặc âm thanh.

## Tổ chức media theo Folder

Editor có thể chọn **Add new folder** từ Main library. Mở một folder bằng cách nhấn tên. Khi không có từ khoá tìm kiếm, trang folder chỉ hiện media được gán cho folder đó — tìm kiếm theo tên tệp thì quét toàn bộ thư viện, kể cả các folder khác và Main library.

Để chuyển một tệp cục bộ (local) vào folder, kéo thẻ lưới hoặc dòng danh sách của nó thả vào folder. Bạn cũng có thể mở **Media Details**, chọn **Location**, rồi **Save**. Dùng **Location** để trả tệp về Main library hoặc di chuyển mà không cần kéo-thả.

Author có thể di chuyển tệp cục bộ do chính họ upload. Editor có thể di chuyển bất kỳ tệp cục bộ nào. Tệp từ provider bên ngoài **không thể** được gán vào folder.

Tệp mới upload luôn vào Main library trước — di chuyển vào folder sau đó bằng một trong hai cách trên. Xoá một folder sẽ trả media của nó về Main library — tệp media, URL, và tham chiếu nội dung vẫn giữ nguyên không đổi.

## Dùng Media trong nội dung

**Trong trình soạn thảo rich text:** đặt con trỏ tại vị trí muốn chèn ảnh → nhấn nút ảnh trên toolbar → chọn ảnh từ thư viện hoặc upload mới → nhập alt text → nhấn **Insert**.

**Làm Featured Image:** mở entry trong trình soạn thảo → tìm field **Featured Image** trong sidebar → nhấn **Select Image** → chọn từ thư viện hoặc upload → nhấn **Save**.

**Trong field tuỳ chỉnh:** với field cấu hình kiểu image hoặc file, nhấn vào field để mở bộ chọn media.

## Đặt điểm lấy nét (Focal Point)

Điểm lấy nét (focal point) giữ cho phần quan trọng của một ảnh cục bộ luôn hiển thị khi card, gallery, hay layout khác cắt ảnh để vừa khung cố định.

1. Mở **Media**, chọn một ảnh từ thư viện cục bộ.
2. Chọn **Focal point**.
3. Nhấn hoặc kéo điểm đánh dấu vào phần quan trọng của ảnh (có thể dùng phím mũi tên).
4. Kiểm tra bản xem trước dạng vuông, ngang, dọc, rồi chọn **Save**.

Chọn **Reset** để xoá điểm lấy nét tuỳ chỉnh. Điểm đã lưu được sao chép khi bạn chọn ảnh cho một field nội dung hay gallery — nội dung đã dùng ảnh trước đó vẫn giữ điểm đã lưu cho tới khi bạn chọn lại ảnh.

## Hiển thị Media trong template (dành cho lập trình viên)

Truy cập URL media từ dữ liệu nội dung:

```astro title="src/pages/posts/[slug].astro"
---
import { getEmDashEntry } from "emdash";

const { entry: post } = await getEmDashEntry("posts", Astro.params.slug);
---

{post?.data.featured_image && (
  <img
    src={post.data.featured_image}
    alt={post.data.featured_image_alt ?? ""}
  />
)}
```

Với field media của EmDash, dùng component `Image` từ `emdash/ui` để có ảnh responsive:

```astro
---
import { Image } from "emdash/ui";
import { getEmDashEntry } from "emdash";

const { entry: post } = await getEmDashEntry("posts", Astro.params.slug);
---

{post?.data.featured_image && (
  <Image
    image={post.data.featured_image}
    width={800}
    height={450}
    priority
  />
)}
```

`priority` dùng cho ảnh chính hiển thị ngay khi tải trang (above-the-fold) — nó đặt `loading="eager"` và `fetchpriority="high"`. Khi giá trị field có kèm phiên bản dark mode, `Image` render cả hai và hiển thị đúng phiên bản theo bảng màu người xem (xem [Chương 15 — Chế độ tối](./15-che-do-toi.md)).

## Xoá media

1. Chọn (các) tệp muốn xoá.
2. Nhấn **Delete**.
3. Xác nhận việc xoá.

> Xoá media **không** tự động xoá tham chiếu trong nội dung. Hãy đảm bảo cập nhật hoặc gỡ nội dung đang dùng tệp đã xoá.

## Media Provider bên ngoài (dành cho Quản trị viên/Vận hành)

Ngoài lưu trữ cục bộ, EmDash hỗ trợ media provider bên ngoài cho nhu cầu lưu trữ ảnh/video chuyên biệt. Media provider xuất hiện dưới dạng tab trong bộ chọn media, cho phép editor chọn từ nhiều nguồn.

- **Cloudflare Images** — lưu trữ ảnh với tối ưu, resize, chuyển đổi định dạng tự động; hỗ trợ biến đổi qua URL và nhiều biến thể responsive.
- **Cloudflare Stream** — lưu trữ video với streaming thích ứng HLS/DASH, tự sinh thumbnail, upload trực tiếp cho tệp lớn.

Cả hai đều cấu hình qua tuỳ chọn `mediaProviders` trong `astro.config.mjs`, có thể dùng đồng thời nhiều provider — mỗi provider hiện thành một tab riêng, và tab "Library" (lưu trữ cục bộ) luôn có sẵn song song. Component `Image` tự động nhận diện provider từ giá trị lưu trữ và áp dụng tối ưu tương ứng.

## Media API

Dùng REST API để upload, liệt kê, cập nhật, xoá, và tổ chức media cục bộ — chi tiết đầy đủ (multipart upload, upload target flow, tham số request, quyền hạn, thao tác folder) ở [Chương 35 — REST API tham chiếu](./35-rest-api.md).

## Lưu ý

- Đây là chương tập trung vào thao tác của người biên tập nội dung; các cấu trúc dữ liệu chi tiết (`MediaValue`, `FileValue`, provider lookup) dành cho lập trình viên tích hợp sâu được để lại cho Chương 35 (REST API) và tài liệu `reference/rest-api.mdx` gốc, tránh làm chương này quá nặng kỹ thuật cho đối tượng biên tập viên.
- Việc bật "media usage tracking" là một quyết định **một chiều** (không thể tắt lại) — cân nhắc kỹ trước khi bật trên site đang vận hành với lượng nội dung lớn.

## Xem thêm

- [Chương 6 — Làm quen giao diện quản trị (Admin Panel)](./06-lam-quen-admin-panel.md)
- [Chương 8 — Soạn thảo nội dung và Portable Text](./08-soan-thao-noi-dung.md)
- [Chương 15 — Chế độ tối & tuỳ biến giao diện quản trị](./15-che-do-toi.md)
- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 26 — Triển khai trên Node.js](./26-trien-khai-nodejs.md)
- [Chương 35 — REST API tham chiếu](./35-rest-api.md)
- [Chương 36 — Cấu hình EmDash](./36-cau-hinh-emdash.md)
