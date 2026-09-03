# 51. Câu hỏi thường gặp & khắc phục sự cố

Áp dụng cho vai trò: Mọi vai trò

## Tổng quan

Chương này tổng hợp các câu hỏi thường gặp và bảng khắc phục sự cố đã rải rác qua các chương trước, cộng thêm vài câu hỏi tổng quát về EmDash rút từ `README.md` và `docs/src/content/docs/introduction.mdx`, `why-emdash.mdx` gốc. Đây là chương "tổng hợp" — không có một file `.mdx` nguồn riêng, mà gom lại và dẫn chiếu ngược tới đúng chương đã trình bày chi tiết.

## Câu hỏi thường gặp

### EmDash có phải WordPress không?

Không. EmDash lấy cảm hứng từ mô hình tư duy của WordPress (Collection giống Custom Post Type, Taxonomy, Menu, Widget, Media Library) nhưng không chạy PHP, không tương thích plugin/theme WordPress. Nội dung và khái niệm WordPress **di chuyển được** sang EmDash qua công cụ nhập chuyên dụng, không chạy trực tiếp. Xem [Chương 1](./01-emdash-la-gi.md) và [Chương 4](./04-so-sanh-wordpress-astro.md).

### EmDash có phải headless CMS không?

Không. EmDash tích hợp chặt với Astro và chạy trong cùng một lần triển khai (deployment), không phải dịch vụ tách biệt gọi qua API như headless CMS thông thường. Xem [Chương 1](./01-emdash-la-gi.md).

### EmDash có bắt buộc phải deploy lên Cloudflare không?

Không. EmDash chạy được trên Cloudflare Workers (D1 + R2) **hoặc** Node.js (SQLite/libSQL/PostgreSQL + lưu trữ tương thích S3/local). Xem [Chương 25](./25-trien-khai-cloudflare.md) và [Chương 26](./26-trien-khai-nodejs.md).

### Vì sao cần Dynamic Workers trả phí trên Cloudflare?

Plugin sandboxed cần Dynamic Worker Loader của Cloudflare để chạy cách ly an toàn — tính năng này hiện chỉ khả dụng trên tài khoản Cloudflare trả phí (từ $5/tháng). Nếu chưa nâng cấp, có thể tắt tạm bằng cách comment khối `worker_loaders` trong `wrangler.jsonc`, chấp nhận không dùng được plugin marketplace cho tới khi bật lại. Xem [Chương 2](./02-cai-dat-lan-dau.md) và [Chương 20](./20-cai-dat-plugin.md).

### EmDash có phù hợp làm site thương mại điện tử không?

Theo tài liệu gốc, EmDash **chưa** có tính năng ngang tầm WooCommerce cho thương mại điện tử quy mô lớn — phù hợp hơn cho blog, site marketing, portfolio, site nội dung nói chung. Xem [Chương 1](./01-emdash-la-gi.md).

### Khác biệt giữa Marketplace và Registry của plugin là gì?

Marketplace là kho trung tâm do một đơn vị vận hành và kiểm duyệt. Registry là giải pháp thử nghiệm, phi tập trung, xây trên AT Protocol — ai cũng vận hành được aggregator riêng. Một site chỉ cấu hình dùng một trong hai. Xem [Chương 20](./20-cai-dat-plugin.md).

### Nên chọn Plugin sandboxed hay native?

Mặc định chọn **sandboxed** — cài một-cú-nhấp từ marketplace, có cách ly bảo mật. Chỉ chọn **native** khi cần trang admin React tuỳ chỉnh, component render Portable Text riêng, hoặc chèn HTML/script thô vào trang công khai (`page:fragments`). Xem [Chương 39](./39-viet-plugin-dau-tien.md).

### Làm sao biết site đã cấu hình i18n hay chưa?

Kiểm tra `astro.config.mjs` có khối `i18n` (`defaultLocale`, `locales`, `fallback`) hay không. Không có khối này, EmDash hoạt động như CMS đơn ngôn ngữ. Xem [Chương 16](./16-da-ngon-ngu-i18n.md).

## Bảng khắc phục sự cố tổng hợp

Bảng dưới gom các vấn đề thường gặp đã trình bày chi tiết ở các chương chuyên đề — nhấn vào chương tương ứng để xem đầy đủ nguyên nhân và cách xử lý.

| Triệu chứng | Khả năng nguyên nhân | Xem chi tiết |
| --- | --- | --- |
| Admin kẹt ở "Loading EmDash..." | Thiếu `react()` trong `integrations` | [Chương 3](./03-them-vao-du-an-co-san.md) |
| `Could not resolve "astro:content"` trong `live.config.ts` | Astro cũ hơn phiên bản 6 | [Chương 3](./03-them-vao-du-an-co-san.md) |
| `getEmDashCollection` trả lỗi | Thiếu `src/live.config.ts` | [Chương 3](./03-them-vao-du-an-co-san.md) |
| Thay đổi nội dung không hiển thị | Trang đang bị prerender (thiếu `export const prerender = false`) | [Chương 3](./03-them-vao-du-an-co-san.md), [Chương 47](./47-xay-dung-theme.md) |
| "No passkeys registered" khi đăng nhập | Passkey đã bị xoá khỏi trình quản lý mật khẩu | [Chương 7](./07-dang-nhap-passkey.md) |
| "Passkey authentication failed" | Passkey gắn với domain khác (Passkey theo domain) | [Chương 7](./07-dang-nhap-passkey.md) |
| "Session expired" bất ngờ | Session hết hạn sau 30 ngày không hoạt động — xoá cookie, đăng nhập lại | [Chương 7](./07-dang-nhap-passkey.md) |
| Atmosphere: đăng nhập redirect về trang login không lỗi | Vấn đề cookie loopback — mở `http://127.0.0.1:4321` thay vì `localhost` | [Chương 7](./07-dang-nhap-passkey.md) |
| "XML parsing error" khi nhập WordPress | File export WXR hỏng/thiếu — export lại | [Chương 23](./23-di-chuyen-tu-wordpress.md) |
| Xung đột kiểu field khi nhập WordPress | Collection có sẵn có field kiểu không tương thích | [Chương 23](./23-di-chuyen-tu-wordpress.md) |
| "D1 binding not found" / "R2 binding not found" | Tên binding trong `wrangler.jsonc` không khớp cấu hình `d1()`/`r2()` | [Chương 25](./25-trien-khai-cloudflare.md) |
| Không tìm thấy migration manifest | Chưa build/sync dự án trước khi chạy `emdash migrate` | [Chương 27](./27-co-so-du-lieu.md) |
| Lỗi `must be owner of table` (PostgreSQL) | Role kết nối không sở hữu bảng EmDash — xem mục sửa quyền sở hữu lẫn lộn | [Chương 27](./27-co-so-du-lieu.md) |
| Ảnh không hiển thị đúng kích thước trên Cloudflare | Thiếu binding `IMAGES` trong `wrangler.jsonc` | [Chương 25](./25-trien-khai-cloudflare.md) |
| Email báo "Email is not configured" trên Workers | Chưa cấu hình plugin gửi email (vd `cloudflareEmail()`) | [Chương 25](./25-trien-khai-cloudflare.md) |
| `MISSING_BLOB_SCOPE` khi publish plugin | Đăng nhập CLI cũ chưa có scope blob mới — `emdash-plugin logout` rồi đăng nhập lại | [Chương 43](./43-phat-hanh-plugin.md) |
| `MANIFEST_PUBLISHER_MISMATCH` khi publish plugin | Session hiện tại khác tài khoản `publisher` đã ghim trong manifest | [Chương 39](./39-viet-plugin-dau-tien.md), [Chương 43](./43-phat-hanh-plugin.md) |
| Site bị hỏng sau khi nâng cấp EmDash | Bỏ sót thay đổi **Breaking** trong release note giữa các phiên bản đã bỏ qua | [Chương 30](./30-nang-cap-phien-ban.md) |
| Ảnh field hiện `[object Object]` | Field ảnh là object `{ src, alt }`, không phải chuỗi — dùng component `Image` thay vì `<img src={field} />` | [Chương 47](./47-xay-dung-theme.md) |

## Khi câu trả lời không nằm trong sổ tay này

Sổ tay này biên soạn lại tài liệu kỹ thuật gốc của EmDash (`docs/src/content/docs/` trong repo) — nếu câu hỏi của bạn không có ở đây, các nguồn sau vẫn còn đầy đủ và cập nhật hơn:

- **Tài liệu kỹ thuật gốc:** `docs/src/content/docs/` trong repo (bản tiếng Anh, đầy đủ nhất).
- **Lịch sử thay đổi:** `packages/core/CHANGELOG.md` và các gói khác (xem lại [Chương 50](./50-lich-su-tinh-nang.md)).
- **Trang releases GitHub:** [github.com/emdash-cms/emdash/releases](https://github.com/emdash-cms/emdash/releases).
- **Thảo luận cộng đồng:** GitHub Discussions của dự án `emdash-cms/emdash`.

## Xem thêm

- [Chương 1 — EmDash là gì và dành cho ai](./01-emdash-la-gi.md)
- [Chương 30 — Nâng cấp phiên bản EmDash](./30-nang-cap-phien-ban.md)
- [Chương 49 — Bảng thuật ngữ đối chiếu Anh–Việt](./49-thuat-ngu.md)
- [Chương 50 — Lịch sử tính năng theo phiên bản](./50-lich-su-tinh-nang.md)
