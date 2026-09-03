# 50. Lịch sử tính năng theo phiên bản

Áp dụng cho vai trò: Quản trị viên/Vận hành, Lập trình viên

## Tổng quan

Chương này tổng hợp các mốc tính năng nổi bật của gói `emdash` theo phiên bản, chắt lọc từ `packages/core/CHANGELOG.md` (quản lý bằng Changesets, ~2.276 dòng, 40 phiên bản từ `0.0.2` tới `0.36.0` tính tới thời điểm biên soạn sổ tay này). Đây **không phải** bản dịch đầy đủ changelog — chỉ giữ lại thay đổi có ý nghĩa với người dùng cuối (tính năng mới, thay đổi hành vi đáng chú ý), lược bỏ bản vá nội bộ và cập nhật dependency thuần tuý.

> EmDash phát hành trước version 1.0 — patch release (vd `0.35.0` → `0.35.1`) mang bản sửa lỗi nhỏ; minor release (vd `0.35` → `0.36`) mang tính năng mới và mọi thay đổi breaking (xem lại [Chương 30](./30-nang-cap-phien-ban.md)). Để có danh sách đầy đủ, chính xác theo thời điểm bạn đọc, luôn tham chiếu trực tiếp `packages/core/CHANGELOG.md` trong repo hoặc [trang releases](https://github.com/emdash-cms/emdash/releases) trên GitHub — chương này là ảnh chụp tại một thời điểm, sẽ lạc hậu dần theo các release mới.

## Dòng thời gian tính năng nổi bật

### 0.36.0 — mới nhất tại thời điểm biên soạn

- `ContentSaveRejectedError` — cho phép hook `content:beforeSave` từ chối lưu kèm thông báo hiển thị cho editor (xem lại [Chương 37](./37-hooks-vong-doi.md)).
- Phân trang đánh số (numbered pagination) cho Media Library cục bộ, cạnh cơ chế cursor mặc định (xem lại [Chương 9](./09-thu-vien-media.md)).
- Media folder phẳng (flat) trong REST API và typed client (xem lại [Chương 9](./09-thu-vien-media.md)).
- Dark mode variant cho field ảnh — editor chọn ảnh thứ hai hiển thị ở chế độ tối (xem lại [Chương 15](./15-che-do-toi.md)).
- Publish plugin lưu artifact dưới dạng blob trên Personal Data Server (PDS) của publisher (xem lại [Chương 43](./43-phat-hanh-plugin.md)).
- `LiveSearch` tự giới hạn kết quả theo locale của trang đang chạy (xem lại [Chương 16](./16-da-ngon-ngu-i18n.md), [Chương 47](./47-xay-dung-theme.md)).
- Thêm Lua và Zig vào bộ chọn ngôn ngữ khối code trong admin và inline visual editor.

### 0.35.0

- Lệnh `emdash migrate` — kiểm tra, báo cáo, và áp dụng an toàn đúng tập migration lõi mà một bản build đã ghi lại (xem lại [Chương 27](./27-co-so-du-lieu.md), [Chương 33](./33-tong-quan-cong-cu-dev.md)).
- Migration lõi quản lý theo triển khai (deployment-managed) — database production cập nhật được **trước khi** phiên bản site mới bắt đầu phục vụ traffic.
- API danh tính migration công khai và trạng thái chính xác để công cụ triển khai xác minh.
- Executor migration triển khai cho SQLite, libSQL, PostgreSQL với metadata build không chứa secret.
- 3 chế độ migration runtime `auto`/`check`/`manual` (xem lại [Chương 27](./27-co-so-du-lieu.md)).

### 0.30.0

- Trang **Backups** trong admin settings — tải bản sao lưu đầy đủ (nội dung kể cả draft/trash, schema, taxonomy, menu, widget, metadata media, site settings — **không bao giờ** gồm tài khoản user hay secret) chỉ một cú nhấp, tuỳ chọn bật sao lưu tự động hàng ngày (xem lại [Chương 22](./22-sao-luu-phuc-hoi.md)).
- Expose `trailingSlash` của dự án Astro host cho plugin qua `ctx.site.trailingSlash`.
- Tool MCP `media_upload` — upload tệp từ dữ liệu base64 hoặc URL công khai và tự đăng ký vào Media Library (xem lại [Chương 38](./38-mcp-server.md)).
- Lệnh `emdash media repair-usage` và tool MCP `media_usage_repair` (xem lại [Chương 33](./33-tong-quan-cong-cu-dev.md), [Chương 35](./35-rest-api.md)).
- Số đếm usage media có nhận biết độ phủ (coverage-aware) và chi tiết "Used in" chỉ-đọc trong REST API (xem lại [Chương 35](./35-rest-api.md)).
- User được mời có thể chấp nhận lời mời bằng Google/GitHub, không chỉ tạo Passkey.
- Tool MCP của plugin do admin bật tường minh, kèm permission theo route, phạm vi token theo plugin, đồng ý khi cài/cập nhật, schema output có cấu trúc, và audit lời gọi (xem lại [Chương 38](./38-mcp-server.md)).
- Tuỳ chọn `cacheControl` cho route plugin public (xem lại [Chương 40](./40-api-routes-capabilities.md)).
- Form cài đặt admin tự sinh cho plugin khai `admin.settingsSchema` (xem lại [Chương 44](./44-plugin-native.md)).
- `withEmDashRuntime()` trong `emdash/middleware` cho handler không có request (Cloudflare Queue, `scheduled()`) (xem lại [Chương 40](./40-api-routes-capabilities.md)).

### 0.25.0

- Hook `content:afterRestore` cho plugin phản ứng khi entry trong trash được khôi phục (xem lại [Chương 37](./37-hooks-vong-doi.md)).
- Sửa lỗi: request xác thực bằng API token/OAuth token giờ dùng đúng kết nối chính/không-cache (trước đó có thể bị định tuyến nhầm vào read replica hoặc query cache, phá vỡ tính nhất quán đọc-sau-ghi cho API client).

### 0.20.0

- Hợp đồng `declaredAccess` có cấu trúc cho bundle plugin — mọi capability plugin khai báo đều hiển thị trong hộp thoại đồng ý và được thực thi nhất quán, không capability nào bị bỏ sót âm thầm (xem lại [Chương 40](./40-api-routes-capabilities.md)).
- Field repeater hỗ trợ sub-field kiểu `image` với bộ chọn media (trước đó phải dán URL tay).

### 0.15.0

- Sandbox plugin dựa trên workerd cho triển khai Node.js (gói mới `@emdash-cms/sandbox-workerd`) (xem lại [Chương 39](./39-viet-plugin-dau-tien.md)).
- Hỗ trợ i18n hạng nhất cho byline, theo mô hình row-per-locale giống menu/taxonomy (xem lại [Chương 16](./16-da-ngon-ngu-i18n.md), [Chương 48](./48-seed-files.md)).

### 0.10.0

- Hỗ trợ i18n cho menu và taxonomy (category, tag, định nghĩa tuỳ chỉnh) — mỗi dòng mang `locale` và `translation_group`; endpoint REST và tool MCP nhận tham số `locale` (xem lại [Chương 16](./16-da-ngon-ngu-i18n.md)).
- Tạo bản dịch nội dung tự sao chép gán taxonomy của nguồn.

### 0.5.0

- `ContentListOptions` nhận `where: { status?, locale? }` cho plugin lọc ở tầng database thay vì lọc mảng kết quả.
- Hạ tầng hỗ trợ ngôn ngữ RTL (phải-sang-trái) — Ả Rập, Hebrew, Farsi, Urdu — với `LocaleDirectionProvider` tự đồng bộ `dir`/`lang` trên HTML.
- Sửa OAuth authorization server metadata discovery cho MCP client, phục vụ đúng đường dẫn chuẩn RFC 8414 (xem lại [Chương 38](./38-mcp-server.md)).

### 0.1.0 — bản beta đầu tiên

- Phát hành beta đầu tiên của EmDash.

### 0.0.2 – 0.0.3 — vá lỗi khởi động sớm

- Sửa lỗi crash khi request đầu tiên chạm trang công khai trước khi setup chạy — middleware giờ tự phát hiện database rỗng và chuyển hướng tới Setup Wizard.
- Sửa lỗi resolve virtual module khi cài `emdash` từ npm trên Cloudflare.

## Cách tự cập nhật thông tin mới nhất

```bash
git log --oneline packages/core/CHANGELOG.md   # xem lịch sử thay đổi file changelog
```

Hoặc mở trực tiếp `packages/core/CHANGELOG.md` trong repo, hay [trang releases GitHub](https://github.com/emdash-cms/emdash/releases) — mỗi entry ghi rõ PR, commit, và người đóng góp liên quan.

## Xem thêm

- [Chương 30 — Nâng cấp phiên bản EmDash](./30-nang-cap-phien-ban.md)
- [Chương 27 — Cơ sở dữ liệu (SQLite/PostgreSQL/D1)](./27-co-so-du-lieu.md)
- [Chương 22 — Sao lưu và phục hồi dữ liệu](./22-sao-luu-phuc-hoi.md)
- [Chương 49 — Bảng thuật ngữ đối chiếu Anh–Việt](./49-thuat-ngu.md)
- [Chương 51 — Câu hỏi thường gặp & khắc phục sự cố](./51-cau-hoi-thuong-gap.md)
