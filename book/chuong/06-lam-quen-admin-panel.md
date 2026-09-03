# 6. Làm quen giao diện quản trị (Admin Panel)

Áp dụng cho vai trò: Người biên tập nội dung, Quản trị viên/Vận hành, Lập trình viên

## Tổng quan

Admin panel là giao diện quản lý nội dung của site. Nó được phục vụ tại đường dẫn `/_emdash/admin/` ngay trong site Astro của bạn, và tự động thích ứng theo Collection, Plugin đã cài, và vai trò của người dùng đang đăng nhập.

Trong Chương 2, bạn đã truy cập lần đầu vào đây qua Setup Wizard. Chương này đi sâu vào tất cả các màn hình bạn sẽ dùng hàng ngày.

## Các bước thực hiện

### Bản đồ màn hình admin panel

| Đường dẫn | Màn hình |
| --- | --- |
| `/` | Dashboard |
| `/content/:collection` | Danh sách nội dung |
| `/content/:collection/:id` | Trình soạn thảo nội dung |
| `/content/:collection/new` | Tạo entry mới |
| `/media` | Thư viện Media |
| `/content-types` | Trình xây dựng schema (chỉ Admin) |
| `/menus` | Menu điều hướng |
| `/widgets` | Widget Area |
| `/taxonomies` | Category và Tag |
| `/settings` | Cài đặt site |
| `/plugins/:pluginId/*` | Trang của Plugin |

Menu điều hướng được sinh tự động từ Collection và Plugin đã cài — nên khi schema hay plugin thay đổi, admin panel cập nhật ngay lập tức, không cần deploy lại.

### Nội dung hiển thị theo vai trò

Những gì người dùng nhìn thấy phụ thuộc vào vai trò của họ. EmDash có 5 vai trò, từ ít quyền nhất đến nhiều quyền nhất: **Subscriber, Contributor, Author, Editor, Admin** (chi tiết đầy đủ ở [Chương 19 — Quản lý người dùng, vai trò và quyền hạn](./19-nguoi-dung-vai-tro.md)).

Trong admin, vai trò thấp hơn chỉ thấy nội dung họ có quyền quản lý. Trình xây dựng schema tại `/content-types` và các màn hình Settings chỉ dành cho **Admin**. Việc sinh type và dùng CLI luôn khả dụng cho lập trình viên đang làm việc trên dự án, bất kể vai trò admin của họ trong hệ thống.

> Admin panel yêu cầu người dùng đã đăng nhập. Đăng nhập là một trang riêng thiết lập phiên làm việc (session) — xem [Chương 7 — Đăng nhập không mật khẩu bằng Passkey](./07-dang-nhap-passkey.md).

### Trình soạn thảo nội dung

Trình soạn thảo nội dung dựng một form dựa trên các field của Collection. Mỗi loại field dùng một loại ô nhập tương ứng:

| Loại field | Ô nhập trong admin |
| --- | --- |
| `string` | Ô nhập văn bản (text input) |
| `text` | Vùng nhập nhiều dòng (textarea) |
| `number` | Ô nhập số |
| `boolean` | Công tắc bật/tắt (toggle) |
| `datetime` | Bộ chọn ngày giờ |
| `select` | Danh sách sổ xuống (dropdown) |
| `multiSelect` | Chọn nhiều mục |
| `portableText` | Trình soạn thảo rich text |
| `image` | Bộ chọn media |
| `reference` | Bộ chọn entry |

Field rich text được soạn như nội dung đã định dạng — heading, danh sách, trích dẫn, code, liên kết, và ảnh từ thư viện Media. Nội dung từ plugin hoặc từ nhập khẩu (import) mà trình soạn thảo không nhận diện được sẽ được giữ nguyên, không bị chỉnh sửa mất.

Danh sách nội dung được phân trang (paginated) và giữ ổn định ngay cả khi nội dung thay đổi giữa các trang.

### Thư viện Media (tóm tắt)

Thư viện Media hỗ trợ: xem dạng lưới và danh sách, tìm kiếm/lọc theo loại và ngày, kéo-thả để upload, xem trước ảnh kèm metadata, chọn và xoá hàng loạt. Tệp upload đi thẳng từ trình duyệt tới kho lưu trữ backend, nên tệp lớn không bị giới hạn bởi kích thước request. (Chi tiết đầy đủ ở [Chương 9 — Thư viện Media](./09-thu-vien-media.md).)

### Trang và widget của Plugin

Một Plugin có thể thêm trang và widget dashboard vào admin. Trang Plugin xuất hiện dưới `/_emdash/admin/plugins/:pluginId/`, và một Plugin chỉ được mount trong đúng namespace của chính nó — không thể ghi đè các màn hình admin lõi (core). (Xem [Chương 20 — Cài đặt & Quản lý Plugin](./20-cai-dat-plugin.md).)

## Lưu ý

- Admin panel dùng chính REST API của EmDash để hoạt động — bạn cũng có thể gọi trực tiếp API này (xem [Chương 35 — REST API tham chiếu](./35-rest-api.md)) nếu cần tích hợp/tự động hoá.
- Vì điều hướng sinh tự động theo Collection/Plugin, không có khái niệm "ẩn menu thủ công" — muốn ẩn một mục, cần xoá/tắt Collection hoặc Plugin tương ứng.

## Xem thêm

- [Chương 2 — Cài đặt lần đầu và Trình cài đặt (Setup Wizard)](./02-cai-dat-lan-dau.md)
- [Chương 5 — Các khái niệm cốt lõi (bản đồ thuật ngữ)](./05-khai-niem-cot-loi.md)
- [Chương 7 — Đăng nhập không mật khẩu bằng Passkey](./07-dang-nhap-passkey.md)
- [Chương 8 — Soạn thảo nội dung và Portable Text](./08-soan-thao-noi-dung.md)
- [Chương 9 — Thư viện Media](./09-thu-vien-media.md)
- [Chương 17 — Xây dựng Loại nội dung (Content Types Builder)](./17-content-types-builder.md)
- [Chương 19 — Quản lý người dùng, vai trò và quyền hạn](./19-nguoi-dung-vai-tro.md)
