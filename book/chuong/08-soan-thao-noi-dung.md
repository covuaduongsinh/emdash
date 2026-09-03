# 8. Soạn thảo nội dung và Portable Text

Áp dụng cho vai trò: Người biên tập nội dung

## Tổng quan

Chương này hướng dẫn tạo, sửa và quản lý nội dung bằng admin dashboard của EmDash.

## Truy cập Admin

Mở trình duyệt tới `/_emdash/admin` trên site của bạn. Đăng nhập bằng thông tin đã tạo trong quá trình cài đặt (xem [Chương 7](./07-dang-nhap-passkey.md)).

Dashboard hiển thị:

- **Sidebar** — điều hướng tới Collection, Media, và Settings.
- **Content list** — danh sách entry trong Collection đang chọn.
- **Quick actions** — tạo nội dung mới, thao tác hàng loạt.

## Các bước thực hiện

### Tạo nội dung mới

1. Nhấn tên Collection trong sidebar (vd **Posts**).
2. Nhấn **New Post** (hoặc nút tương ứng với Collection của bạn).
3. Điền các field bắt buộc:
   - **Title** — tên hiển thị của nội dung.
   - **Slug** — định danh URL (tự sinh từ title, có thể sửa).
4. Thêm nội dung bằng trình soạn thảo rich text.
5. Đặt metadata ở sidebar:
   - **Status** — Draft, Published, hoặc Archived.
   - **Publication date** — thời điểm xuất bản.
   - **Categories và tags** — gán taxonomy.
6. Nhấn **Save**.

Draft chỉ hiển thị trong admin. Đổi status thành **Published** để nội dung hiển thị công khai trên site.

### Trạng thái nội dung

Theo tài liệu "Working with Content", mỗi entry có một trong ba trạng thái:

| Trạng thái | Hiển thị | Trường hợp dùng |
| --- | --- | --- |
| **Draft** | Chỉ trong admin | Đang soạn thảo |
| **Published** | Công khai | Nội dung đang live |
| **Archived** | Chỉ trong admin | Nội dung đã ngừng dùng |

Đổi trạng thái bằng dropdown trong sidebar của trình soạn thảo.

> **Lưu ý đối chiếu nguồn:** Tài liệu khái niệm (`concepts/content-model.mdx`, xem [Chương 5](./05-khai-niem-cot-loi.md)) mô tả field hệ thống `status` có 3 giá trị `draft`/`published`/`scheduled`, trong khi tài liệu thao tác admin liệt kê `Draft`/`Published`/`Archived`. Theo phần "Lên lịch nội dung" bên dưới, việc lên lịch (scheduled) được thực hiện bằng cách đặt status **Draft** kèm ngày xuất bản trong tương lai — hệ thống sẽ tự chuyển sang Published khi tới thời điểm đó. Chi tiết chính xác về việc `scheduled` có phải là một giá trị status độc lập hiển thị trong admin hay không thì tài liệu gốc chưa nói rõ tuyệt đối — đây là điểm chưa xác nhận đầy đủ trong tài liệu gốc.

## Trình soạn thảo Rich Text (Portable Text)

Trình soạn thảo của EmDash hỗ trợ:

- **Heading** — H2 đến H6.
- **Định dạng** — đậm, nghiêng, gạch chân, gạch ngang.
- **Danh sách** — có thứ tự và không thứ tự.
- **Liên kết** — nội bộ và ngoài site.
- **Ảnh** — chèn từ Media Library.
- **Khối code** — có tô màu cú pháp (syntax highlighting).
- **Khối HTML thô** — dùng cho embed tuỳ chỉnh và widget.
- **Embed** — YouTube, Vimeo, Twitter.
- **Section** — khối nội dung tái sử dụng qua lệnh `/section`.

Nội dung rich text được lưu dưới dạng **Portable Text** — định dạng JSON có cấu trúc theo khối (block-based), không nhúng HTML trực tiếp (xem lại [Chương 5](./05-khai-niem-cot-loi.md)).

### Lệnh nhanh (Slash Commands)

Gõ `/` để mở menu chèn nhanh:

| Lệnh | Hành động |
| --- | --- |
| `/section` | Chèn một section tái sử dụng |
| `/image` | Chèn ảnh từ Media Library |
| `/code` | Chèn khối code |
| `/html` | Chèn khối HTML thô |

### Phím tắt

| Hành động | Phím tắt |
| --- | --- |
| Đậm | `Ctrl/Cmd + B` |
| Nghiêng | `Ctrl/Cmd + I` |
| Liên kết | `Ctrl/Cmd + K` |
| Hoàn tác | `Ctrl/Cmd + Z` |
| Làm lại | `Ctrl/Cmd + Shift + Z` |
| Lưu | `Ctrl/Cmd + S` |

### Chèn ảnh

1. Nhấn nút ảnh trên toolbar.
2. Chọn ảnh có sẵn từ Media Library, hoặc upload ảnh mới.
3. Thêm alt text (bắt buộc để đảm bảo khả năng truy cập — accessibility).
4. Chỉnh căn lề và kích thước.
5. Nhấn **Insert**.

### Khối HTML thô

Dùng `/html` để chèn một khối HTML thô — hữu ích khi nhúng widget bên thứ ba, markup tuỳ chỉnh, hoặc nội dung không khớp với các loại khối chuẩn. Khối HTML cũng được tự động tạo ra khi nhập nội dung từ WordPress hoặc Contentful có chứa markup mà EmDash không chuyển đổi được thành khối Portable Text gốc.

> Khối HTML được làm sạch (sanitize) trước khi render ra frontend để chống XSS. Mặc định, iframe chỉ được cho phép từ `www.youtube.com` và `player.vimeo.com` — iframe từ nguồn khác sẽ bị loại bỏ khi sanitize.

Để cho phép iframe từ nhà cung cấp khác, ghi đè component `htmlBlock` khi render Portable Text (dành cho lập trình viên — xem đoạn mã mẫu dùng `sanitize-html` với `allowedIframeHostnames` trong tài liệu tham chiếu `guides/working-with-content.mdx` gốc, hoặc [Chương 45 — Plugin Native: Page Fragments & Portable Text Components](./45-page-fragments-portable-text.md)).

## Sửa nội dung

1. Vào Collection chứa nội dung cần sửa.
2. Nhấn vào entry muốn sửa.
3. Thực hiện thay đổi.
4. Nhấn **Save**.

Thay đổi trên nội dung đã Published hiển thị ngay lập tức trên site (nhờ Live Collections).

### Lịch sử phiên bản (Revision)

EmDash theo dõi thay đổi nội dung. Truy cập lịch sử phiên bản từ sidebar của trình soạn thảo:

1. Nhấn **Revisions** trong sidebar.
2. Xem danh sách phiên bản trước kèm dấu thời gian.
3. Nhấn một phiên bản để xem trước.
4. Nhấn **Restore** để khôi phục về phiên bản đó.

Khôi phục một revision sẽ tạo ra một revision mới chứa nội dung đã khôi phục — lịch sử revision gốc vẫn được giữ nguyên.

## Thao tác hàng loạt

1. Dùng checkbox để chọn nhiều entry trong danh sách nội dung.
2. Nhấn dropdown **Bulk Actions**.
3. Chọn hành động:
   - **Publish** — đặt tất cả mục đã chọn thành published.
   - **Archive** — đặt tất cả mục đã chọn thành archived.
   - **Delete** — xoá vĩnh viễn.
4. Xác nhận hành động.

## Tìm kiếm và lọc

**Tìm kiếm:** dùng ô tìm kiếm để tìm nội dung theo title hoặc nội dung — không phân biệt hoa/thường, khớp cả từ khoá một phần.

**Bộ lọc:** lọc danh sách nội dung theo Status (Draft/Published/Archived), khoảng ngày (tạo hoặc sửa), Author, hoặc Taxonomy (category/tag). Nhấn **Clear Filters** để đặt lại.

## Lên lịch nội dung

Lên lịch xuất bản nội dung vào một ngày trong tương lai:

1. Tạo hoặc sửa nội dung.
2. Đặt status thành **Draft**.
3. Đặt **Publication date** thành ngày giờ trong tương lai.
4. Nhấn **Save**.

Khi tới ngày xuất bản, nội dung tự động chuyển thành Published.

> Trên triển khai Node.js, EmDash tự động chạy tiến trình quét lên lịch xuất bản (scheduled publishing sweep). Trên Cloudflare Workers, cần một cron trigger để xuất bản nội dung đúng lịch — mặc định đã có sẵn trong các template mới. Xem [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md) mục "scheduled-publishing".

## Xoá nội dung

Có thể xoá từ màn hình soạn thảo hoặc từ danh sách nội dung:

**Từ trình soạn thảo:** mở nội dung → nhấn **Delete** trên toolbar → xác nhận.

**Từ danh sách:** chọn entry bằng checkbox → **Bulk Actions** → **Delete** → xác nhận.

> Nội dung đã xoá bị loại bỏ vĩnh viễn và không thể khôi phục. Cân nhắc dùng **Archive** thay vì Delete nếu có thể cần dùng lại nội dung sau này.

## Content API (dành cho lập trình viên)

Để truy cập bằng chương trình, dùng admin API của EmDash.

**Tạo nội dung** (tạo bài viết ở trạng thái draft):

```bash
POST /_emdash/api/content/posts
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN

{
  "title": "My New Post",
  "slug": "my-new-post",
  "content": "<p>Post content here</p>",
  "status": "draft"
}
```

**Cập nhật nội dung** (cập nhật bài viết đã có và xuất bản):

```bash
PUT /_emdash/api/content/posts/my-new-post
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN

{
  "title": "Updated Title",
  "status": "published"
}
```

**Xoá nội dung** (xoá vĩnh viễn):

```bash
DELETE /_emdash/api/content/posts/my-new-post
Authorization: Bearer YOUR_API_TOKEN
```

Chi tiết đầy đủ về REST API ở [Chương 35 — REST API tham chiếu](./35-rest-api.md).

## Dịch nội dung (khi bật i18n)

Khi tính năng đa ngôn ngữ (i18n) được bật, bạn có thể tạo bản dịch cho bất kỳ entry nội dung nào:

1. Mở entry cần dịch.
2. Trong sidebar, tìm panel **Translations**.
3. Nhấn **Translate** cạnh locale đích.
4. Sửa nội dung đã điền sẵn — điều chỉnh title, slug, và nội dung cho ngôn ngữ mới.
5. Nhấn **Save**.

Bản dịch mới được liên kết với entry gốc và bắt đầu ở trạng thái draft — xuất bản độc lập khi bản dịch sẵn sàng.

Panel Translations hiển thị mọi locale đã cấu hình; nhấn **Edit** cạnh bản dịch có sẵn để tới thẳng đó — locale hiện tại được đánh dấu bằng dấu tích. Trong danh sách nội dung, dùng dropdown locale trên toolbar để lọc entry theo ngôn ngữ. Mỗi bản dịch có slug, status, và lịch sử revision riêng — xuất bản, lên lịch, quản lý độc lập với nhau.

Chi tiết đầy đủ ở [Chương 16 — Đa ngôn ngữ cho nội dung](./16-da-ngon-ngu-i18n.md).

## Lưu ý

- Trạng thái **Archived** khác với **soft delete** (xoá mềm) đã đề cập ở Chương 5 — Archived là một status có thể chuyển đổi qua lại, trong khi soft delete đặt `deleted_at` khi entry bị Delete.
- Khối HTML thô luôn được sanitize theo mặc định — nếu nội dung nhúng của bạn bị mất khi hiển thị (vd iframe từ dịch vụ lạ), khả năng cao do bị lọc bởi cơ chế sanitize này.

## Xem thêm

- [Chương 5 — Các khái niệm cốt lõi (bản đồ thuật ngữ)](./05-khai-niem-cot-loi.md)
- [Chương 6 — Làm quen giao diện quản trị (Admin Panel)](./06-lam-quen-admin-panel.md)
- [Chương 9 — Thư viện Media](./09-thu-vien-media.md)
- [Chương 12 — Phân loại nội dung (Taxonomies)](./12-phan-loai-taxonomies.md)
- [Chương 13 — Xem trước (Preview) trước khi xuất bản](./13-xem-truoc-preview.md)
- [Chương 16 — Đa ngôn ngữ cho nội dung](./16-da-ngon-ngu-i18n.md)
- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 35 — REST API tham chiếu](./35-rest-api.md)
