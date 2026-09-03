# 1. EmDash là gì và dành cho ai

Áp dụng cho vai trò: Mọi vai trò (người biên tập nội dung, quản trị viên/vận hành, lập trình viên)

## Tổng quan

**EmDash** là một **hệ quản trị nội dung (CMS) Astro-native** — nghĩa là được xây dựng riêng cho [Astro](https://astro.build), không phải một CMS tổng quát rồi chuyển đổi để dùng với Astro. EmDash mang các mẫu hình CMS quen thuộc — Collection (loại nội dung), Taxonomy (phân loại), Menu, Widget, và một admin panel hoàn chỉnh — vào thẳng site Astro của bạn, với hỗ trợ TypeScript đầy đủ và khả năng triển khai linh hoạt trên nhiều nền tảng ("cloud-portable").

Về mặt kỹ thuật, EmDash dùng **Live Content Collections** của Astro 6 để phục vụ nội dung ngay tại thời điểm chạy (runtime) — nghĩa là khi biên tập viên sửa nội dung, thay đổi hiển thị ngay lập tức, không cần build lại site. Nội dung được lưu trong cơ sở dữ liệu SQL (SQLite, libSQL, Cloudflare D1, hoặc PostgreSQL); media (ảnh, tệp) được lưu trong kho lưu trữ tương thích S3 (Cloudflare R2 hoặc hệ thống tệp cục bộ).

### Đặc điểm cốt lõi

- **Visual content modelling** — Định nghĩa và thay đổi Collection, Field ngay từ giao diện quản trị; thay đổi có hiệu lực tức thì, không cần deploy lại.
- **Live Collections** — Nội dung được phục vụ tại runtime nên chỉnh sửa hiển thị ngay lập tức.
- **Hệ Plugin** — Lấy cảm hứng từ WordPress: hook, storage, settings, và mở rộng giao diện quản trị.
- **Cloud-portable** — Chạy trên Cloudflare (Workers + D1 + R2) hoặc Node.js, với SQLite/libSQL/PostgreSQL và bất kỳ kho lưu trữ tương thích S3 nào.

### EmDash KHÔNG phải là gì

Để tránh hiểu nhầm khi so sánh với các CMS khác:

- **Không phải headless CMS** — EmDash tích hợp chặt với Astro và chạy trong cùng một lần triển khai (deployment), thay vì là một dịch vụ tách biệt mà bạn gọi qua API.
- **Không tương thích WordPress** — EmDash không chạy PHP hay plugin WordPress. Nội dung và khái niệm WordPress cần di chuyển (migrate) sang các khái niệm tương đương của EmDash (xem [Chương 23](./23-di-chuyen-tu-wordpress.md)).
- **Không phải page builder** — EmDash quản lý nội dung có cấu trúc (structured content); việc dựng bố cục trực quan (layout) là việc của component Astro.

## EmDash dành cho ai

Tài liệu gốc của dự án xác định 4 nhóm đối tượng chính:

- **Agency developer** — dựng site cho khách hàng nhanh chóng bằng plugin và theme tái sử dụng. Plugin chạy trong ngữ cảnh cách ly (isolated context) với API tường minh.
- **Solo developer** — quản lý nội dung là một phần của site Astro, triển khai và vận hành như một dự án duy nhất.
- **Content editor (người biên tập nội dung)** — tạo và chỉnh sửa nội dung trong admin panel, không cần chạm vào code.
- **Người dùng WordPress muốn chuyển hệ** — có sẵn lộ trình di chuyển nội dung và plugin, dùng công cụ hiện đại nhưng khái niệm vẫn quen thuộc.

Đây cũng chính là lý do cuốn sổ tay này được chia thành nhiều Phần theo vai trò — bạn có thể đọc thẳng Phần II nếu là biên tập viên, Phần III nếu là người vận hành, hoặc Phần IV nếu là lập trình viên.

## Kiến trúc tổng quan

EmDash nằm bên trong site Astro của bạn như một integration, kết nối Content Engine, Admin Panel và hệ Plugin với tầng dữ liệu (database + kho lưu trữ media):

```
┌─────────────────────────────────────────────────────────────┐
│                      Site Astro của bạn                     │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 EmDash Integration                     │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐    │  │
│  │  │  Content    │  │   Admin     │  │   Plugins    │    │  │
│  │  │  Engine     │  │   Panel     │  │              │    │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘    │  │
│  │                                                         │  │
│  │  ┌───────────────────────────────────────────────────┐ │  │
│  │  │                  Data Layer                        │ │  │
│  │  │ Database (SQLite/libSQL/D1/Postgres) + kho media   │ │  │
│  │  └───────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Framework Astro                      │  │
│  │        Live Collections • Sessions • Middleware        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

EmDash chạy trên Cloudflare (D1 + R2 + Workers) hoặc Node.js, với SQLite, libSQL hoặc PostgreSQL và bất kỳ kho lưu trữ tương thích S3 nào.

## Các khái niệm cốt lõi sẽ gặp xuyên suốt sách

- **Collection** — Loại nội dung được định nghĩa trong cơ sở dữ liệu (bài viết, trang, sản phẩm...).
- **Field** — Thuộc tính của một Collection (tiêu đề, nội dung, giá...).
- **Taxonomy** — Hệ thống phân loại (category, tag, taxonomy tuỳ chỉnh).
- **Menu** — Cấu trúc điều hướng có thể chỉnh sửa từ admin.
- **Widget Area** — Vùng nội dung có thể cấu hình cho sidebar và footer.
- **Plugin** — Phần mở rộng thêm chức năng qua hook, storage và giao diện.

Chương 5 sẽ đi sâu hơn vào các khái niệm này.

## EmDash phù hợp và không phù hợp cho việc gì

Theo tài liệu gốc, EmDash được thiết kế cho:

- Dự án Astro mới cần một CMS.
- Di chuyển từ WordPress khi muốn dùng công cụ hiện đại.
- Site có biên tập viên không nên đụng vào code.
- Dự án triển khai lên Cloudflare.
- Dự án coi trọng type safety và trải nghiệm lập trình viên.

EmDash có thể **không phù hợp** cho:

- Dự án không dùng Astro (EmDash gắn chặt với Astro).
- Thương mại điện tử quy mô lớn (chưa có tính năng ngang tầm WooCommerce).
- Hệ thống headless đã vận hành tốt và muốn giữ nguyên.
- Dự án cần đúng hệ sinh thái plugin của WordPress.

## Lưu ý

- EmDash không phải bản sao WordPress — nó dùng lại **mô hình tư duy** (mental model) của WordPress (collection giống post type, taxonomy, menu, widget area, media library) nhưng cài đặt bằng công cụ hiện đại (TypeScript, SQL, Astro).
- Vì nội dung và frontend triển khai cùng một lần deploy (single deployment), EmDash khác về bản chất so với các headless CMS phổ biến (nơi CMS và frontend là hai hệ thống tách biệt).

## Xem thêm

- [Chương 2 — Cài đặt lần đầu và Trình cài đặt (Setup Wizard)](./02-cai-dat-lan-dau.md)
- [Chương 4 — So sánh với WordPress / Astro thuần](./04-so-sanh-wordpress-astro.md)
- [Chương 5 — Các khái niệm cốt lõi (bản đồ thuật ngữ)](./05-khai-niem-cot-loi.md)
- [Chương 23 — Di chuyển từ WordPress](./23-di-chuyen-tu-wordpress.md)
