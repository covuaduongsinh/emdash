# Đề cương: Sổ tay Hướng dẫn Sử dụng EmDash

## Giới thiệu

Đây là đề cương chi tiết cho cuốn **Sổ tay Hướng dẫn Sử dụng EmDash** — tài liệu tiếng Việt biên soạn lại toàn bộ tư liệu kỹ thuật (tiếng Anh, rời rạc theo tính năng) tại `docs/src/content/docs/` của dự án thành một cuốn sách mạch lạc, có thứ tự đọc hợp lý.

- **Ngôn ngữ:** Tiếng Việt. Giữ nguyên tiếng Anh: tên tính năng, thuật ngữ kỹ thuật, tên trường/API/CLI, đường dẫn, mã nguồn (xem [Bảng thuật ngữ tạm](#bảng-thuật-ngữ-tạm) bên dưới).
- **Đối tượng đọc:** Đầy đủ 3 vai trò — (1) người biên tập nội dung không kỹ thuật, (2) quản trị viên/vận hành site, (3) lập trình viên xây dựng plugin/theme hoặc tích hợp CLI/API/MCP. Mỗi chương ghi rõ "Áp dụng cho vai trò" ở đầu bài.
- **Cấu trúc:** 51 chương chia thành 5 Phần, đi từ tổng quan → biên tập → vận hành → phát triển → phụ lục, để người đọc theo vai trò nào cũng tìm đúng phần của mình mà không phải đọc toàn bộ.
- **Nguồn tư liệu gốc:** `docs/src/content/docs/**/*.mdx`, `README.md`, `TEMPLATES.md`, `packages/core/CHANGELOG.md`. Mọi chương phải bám sát nguồn thật, không suy diễn tính năng không tồn tại.
- **File này là "nguồn sự thật"** (source of truth) về cấu trúc sách. Sau khi một chương được viết xong ở giai đoạn tương ứng, quay lại đây cập nhật cột **Trạng thái** của chương đó thành `Đã xong`.

---

## Mục lục 51 chương

### Phần I — Nhập môn & Cài đặt

*(Áp dụng cho mọi vai trò)*

**1. EmDash là gì và dành cho ai**
File: `chuong/01-emdash-la-gi.md` · Nguồn: `introduction.mdx`, `why-emdash.mdx`
Tóm tắt: Giới thiệu EmDash là CMS Astro-native dùng Live Content Collections để phục vụ nội dung tại thời điểm chạy (runtime), lưu nội dung trong SQL (SQLite/libSQL/D1/PostgreSQL) và media trong lưu trữ tương thích S3 (R2 hoặc filesystem). Nêu rõ EmDash *không phải* headless CMS, không tương thích WordPress, không phải page builder. Liệt kê 4 nhóm đối tượng dùng: agency developer, solo developer, content editor, người dùng chuyển từ WordPress.
Trạng thái: Đã xong

**2. Cài đặt lần đầu và Trình cài đặt (Setup Wizard)**
File: `chuong/02-cai-dat-lan-dau.md` · Nguồn: `getting-started.mdx`, `TEMPLATES.md`, `README.md`
Tóm tắt: Hướng dẫn tạo site EmDash đầu tiên trong dưới 5 phút bằng `npm create emdash@latest`, chạy `npm run dev`, truy cập `/_emdash/admin` để đăng ký passkey qua Setup Wizard. Giới thiệu 3 template khởi đầu (Blog, Marketing, Portfolio), mỗi loại có biến thể Node.js/SQLite và Cloudflare/D1/R2, và lưu ý về yêu cầu Dynamic Workers (tài khoản Cloudflare trả phí) để chạy plugin sandbox.
Trạng thái: Đã xong

**3. Thêm EmDash vào dự án Astro có sẵn**
File: `chuong/03-them-vao-du-an-co-san.md` · Nguồn: `existing-project.mdx`
Tóm tắt: Hướng dẫn tích hợp EmDash vào một site Astro đang có sẵn (không dùng starter template) — cài đặt package, cấu hình integration, khởi tạo cơ sở dữ liệu và các bước nối dây thủ công cần thiết.
Trạng thái: Đã xong

**4. So sánh với WordPress / Astro thuần**
File: `chuong/04-so-sanh-wordpress-astro.md` · Nguồn: `coming-from/wordpress.mdx`, `coming-from/astro.mdx`, `coming-from/astro-for-wp-devs.mdx`
Tóm tắt: Ba góc nhìn chuyển hệ: cho dev WordPress hiểu khái niệm và tính năng tương đương trong EmDash; cho dev Astro hiểu cách EmDash bổ sung tính năng CMS kiểu WordPress vào site Astro; và bài giảng nền tảng Astro dành riêng cho người quen WordPress (routes, components, content collections) thông qua các khái niệm WordPress họ đã biết.
Trạng thái: Đã xong

**5. Các khái niệm cốt lõi (bản đồ thuật ngữ)**
File: `chuong/05-khai-niem-cot-loi.md` · Nguồn: `concepts/collections.mdx`, `concepts/content-model.mdx`
Tóm tắt: Giải thích mô hình dữ liệu nền tảng của EmDash: Collection và Field (các loại trường, validation, quan hệ reference), cách mô hình nội dung được định hình và tiến hoá theo thời gian (thay đổi runtime, generated types, seed). Đây là chương "từ điển khái niệm" mà các chương sau liên tục tham chiếu ngược lại.
Trạng thái: Đã xong

### Phần II — Dành cho người biên tập nội dung

*(Áp dụng cho vai trò: Người biên tập nội dung)*

**6. Làm quen giao diện quản trị (Admin Panel)**
File: `chuong/06-lam-quen-admin-panel.md` · Nguồn: `concepts/admin-panel.mdx` + ảnh `docs/src/assets/screenshots/admin-dashboard.png`, `admin-post-editor.png`, `admin-posts-list.png`
Tóm tắt: Tổng quan các màn hình admin panel dành cho editor, admin và dev: Dashboard, danh sách/soạn thảo nội dung, Media, Content Types builder, Menus, Widgets, Taxonomies, Settings, trang Plugin. Có bảng ánh xạ đường dẫn URL với từng màn hình.
Trạng thái: Đã xong

**7. Đăng nhập không mật khẩu bằng Passkey**
File: `chuong/07-dang-nhap-passkey.md` · Nguồn: `guides/authentication.mdx` (phần đăng nhập), `guides/atmosphere-auth.mdx`
Tóm tắt: Cách đăng nhập bằng Passkey (WebAuthn) là phương thức chính, không cần mật khẩu, cùng các nhà cung cấp OAuth khác (GitHub, Google) và magic link dự phòng. Riêng phần Atmosphere Login mô tả đăng nhập bằng tài khoản AT Protocol (mạng danh tính mở đứng sau Bluesky).
Trạng thái: Đã xong

**8. Soạn thảo nội dung và Portable Text**
File: `chuong/08-soan-thao-noi-dung.md` · Nguồn: `guides/working-with-content.mdx`
Tóm tắt: Quy trình tạo, sửa, quản lý nội dung trong admin dashboard: các trạng thái draft/published/scheduled, định dạng rich text Portable Text (JSON có cấu trúc, khác HTML-trong-DB của WordPress), lưu bản nháp tự động, revision.
Trạng thái: Đã xong

**9. Thư viện Media**
File: `chuong/09-thu-vien-media.md` · Nguồn: `guides/media-library.mdx` + ảnh `admin-media-library.png`
Tóm tắt: Tải lên và quản lý ảnh/tệp: giao diện lưới/danh sách, tìm kiếm/lọc, kéo-thả upload, thao tác hàng loạt, và (theo CHANGELOG gần đây) tổ chức media theo folder.
Trạng thái: Đã xong

**10. Menu điều hướng**
File: `chuong/10-menu-dieu-huong.md` · Nguồn: `guides/menus.mdx`
Tóm tắt: Tạo và quản lý menu điều hướng cho header, footer, sidebar — sắp xếp mục menu, liên kết tới nội dung hoặc URL ngoài, menu lồng nhau.
Trạng thái: Đã xong

**11. Widget & Vùng Widget**
File: `chuong/11-widget-va-vung-widget.md` · Nguồn: `guides/widgets.mdx`
Tóm tắt: Thêm khối nội dung động (widget) vào các vùng mẫu (sidebar, footer...) — khái niệm Widget Area và cách gán widget vào từng vùng trên theme.
Trạng thái: Đã xong

**12. Phân loại nội dung (Taxonomies)**
File: `chuong/12-phan-loai-taxonomies.md` · Nguồn: `guides/taxonomies.mdx`
Tóm tắt: Tổ chức nội dung bằng categories, tags và taxonomy tuỳ chỉnh (phân cấp hoặc phẳng) — tạo, gán, và dùng taxonomy để lọc/duyệt nội dung.
Trạng thái: Đã xong

**13. Xem trước (Preview) trước khi xuất bản**
File: `chuong/13-xem-truoc-preview.md` · Nguồn: `guides/preview.mdx`
Tóm tắt: Bật chế độ xem trước an toàn cho nội dung nháp trước khi publish — cách tạo và chia sẻ liên kết preview bảo mật.
Trạng thái: Đã xong

**14. Cài đặt trang web (Site Settings)**
File: `chuong/14-cai-dat-site-settings.md` · Nguồn: `guides/site-settings.mdx`
Tóm tắt: Cấu hình các thiết lập toàn site: tên site, tagline, logo, mạng xã hội, và các tuỳ chọn chung khác quản lý từ trang Settings.
Trạng thái: Đã xong

**15. Chế độ tối & tuỳ biến giao diện quản trị**
File: `chuong/15-che-do-toi.md` · Nguồn: `guides/dark-mode.mdx`
Tóm tắt: Cách site công khai theo bảng màu (color scheme) của khách truy cập, cho editor chọn ảnh phiên bản tối (dark variant) riêng cho từng ảnh, và cách component `Image` hiển thị đúng phiên bản.
Trạng thái: Đã xong

**16. Đa ngôn ngữ cho nội dung**
File: `chuong/16-da-ngon-ngu-i18n.md` · Nguồn: `guides/internationalization.mdx`
Tóm tắt: Dịch nội dung sang nhiều ngôn ngữ với xuất bản theo từng locale, slug riêng theo ngôn ngữ, và cơ chế fallback tự động khi thiếu bản dịch.
Trạng thái: Đã xong

### Phần III — Dành cho quản trị viên / vận hành

*(Áp dụng cho vai trò: Quản trị viên / Vận hành)*

**17. Xây dựng Loại nội dung (Content Types Builder)**
File: `chuong/17-content-types-builder.md` · Nguồn: `concepts/collections.mdx` (phần builder trong admin), `reference/field-types.mdx`
Tóm tắt: Cách admin tạo/sửa collection và field ngay từ giao diện quản trị (`/content-types`, chỉ admin), thay đổi có hiệu lực ngay lập tức. Liệt kê đầy đủ 16 loại field (string, text, url, number, integer, boolean, datetime, select, multiSelect, portableText, image, file, reference, json, slug, repeater) cùng cột SQLite tương ứng.
Trạng thái: Đã xong

**18. Bố cục trang & Section**
File: `chuong/18-bo-cuc-trang-section.md` · Nguồn: `guides/page-layouts.mdx`, `guides/sections.mdx`
Tóm tắt: Cho editor chọn layout khác nhau cho từng trang qua field kiểu template, và cách tạo/tái sử dụng các khối nội dung (section) trên nhiều trang.
Trạng thái: Đã xong

**19. Quản lý người dùng, vai trò và quyền hạn**
File: `chuong/19-nguoi-dung-vai-tro.md` · Nguồn: `guides/authentication.mdx` (phần Roles/Users)
Tóm tắt: Bảng 5 vai trò theo cấp độ tăng dần — Subscriber (10, chỉ đọc nội dung published), Contributor (20, tạo nội dung cần duyệt), Author (30, tạo/sửa/publish nội dung của mình), Editor (40, quản lý mọi nội dung), Admin (50, toàn quyền kể cả settings) — mỗi vai trò kế thừa quyền của cấp thấp hơn. Người dùng đầu tiên luôn là Admin. Hướng dẫn mời người dùng qua trang Users, gán vai trò theo nhóm OAuth (`defaultRole`, mapping theo group), invite có hạn 7 ngày.
Trạng thái: Đã xong

**20. Cài đặt & Quản lý Plugin (người dùng cuối)**
File: `chuong/20-cai-dat-plugin.md` · Nguồn: `plugins/overview.mdx`, `plugins/installing.mdx`, `plugins/registry.mdx`, `plugins/registry-client.mdx`, `plugins/upgrading-sites.mdx`
Tóm tắt: Tổng quan hệ plugin (hooks, storage, settings, admin UI, API routes), cách cài plugin từ EmDash Marketplace/registry hoặc thêm bằng code, cách site tự xây directory/trang tìm kiếm plugin qua registry client, và lưu ý khi nâng cấp site có cài plugin (breaking changes).
Trạng thái: Đã xong

**21. Chủ đề (Themes) — cài đặt và tuỳ biến cơ bản**
File: `chuong/21-theme-tong-quan.md` · Nguồn: `themes/overview.mdx`
Tóm tắt: Theme EmDash là gì và cách nó "bootstrap" một site mới (định nghĩa collection, seed dữ liệu mẫu, giao diện) — góc nhìn dành cho người dùng chọn/khởi tạo theme, không đi sâu code (phần code ở chương 47).
Trạng thái: Đã xong

**22. Sao lưu và phục hồi dữ liệu**
File: `chuong/22-sao-luu-phuc-hoi.md` · Nguồn: `guides/backups.mdx`
Tóm tắt: Tải xuống bản sao lưu site, lên lịch sao lưu tự động vào storage, và phục hồi bằng D1 Time Travel (Cloudflare).
Trạng thái: Đã xong

**23. Di chuyển từ WordPress**
File: `chuong/23-di-chuyen-tu-wordpress.md` · Nguồn: `migration/from-wordpress.mdx`, `themes/porting-wp-themes.mdx`
Tóm tắt: Hướng dẫn từng bước nhập nội dung WordPress vào EmDash, và cách tiếp cận có cấu trúc để chuyển đổi theme WordPress sang theme EmDash.
Trạng thái: Đã xong

**24. Nhập nội dung từ nguồn khác**
File: `chuong/24-nhap-noi-dung.md` · Nguồn: `migration/content-import.mdx`
Tóm tắt: Nhập nội dung từ WordPress và các nguồn khác vào EmDash — các định dạng nguồn hỗ trợ và quy trình import chung (WXR, REST API, WordPress.com).
Trạng thái: Đã xong

**25. Triển khai lên Cloudflare Workers**
File: `chuong/25-trien-khai-cloudflare.md` · Nguồn: `deployment/cloudflare.mdx`, `deployment/storage.mdx` (phần R2)
Tóm tắt: Triển khai EmDash lên Cloudflare Workers với D1 (database) và R2 (lưu trữ media) — các bước cấu hình cụ thể trên nền tảng Cloudflare.
Trạng thái: Đã xong

**26. Triển khai trên Node.js**
File: `chuong/26-trien-khai-nodejs.md` · Nguồn: `deployment/nodejs.mdx`, `deployment/storage.mdx` (phần filesystem/S3)
Tóm tắt: Triển khai EmDash lên bất kỳ nền tảng hosting Node.js nào — cấu hình storage bằng S3-compatible hoặc filesystem cục bộ khi không dùng Cloudflare.
Trạng thái: Đã xong

**27. Cơ sở dữ liệu (SQLite/PostgreSQL/D1)**
File: `chuong/27-co-so-du-lieu.md` · Nguồn: `deployment/database.mdx`, `deployment/schema-evolution.mdx`, `deployment/core-migrations.mdx`
Tóm tắt: Cấu hình EmDash với D1, PostgreSQL, libSQL hoặc SQLite; cách thay đổi schema/mô hình nội dung trên site đang chạy và giữ đồng bộ với seed file; cách chạy migration schema nội bộ của EmDash như một bước triển khai tuần tự.
Trạng thái: Đã xong

**28. Bí mật cấu hình & biến môi trường**
File: `chuong/28-bi-mat-cau-hinh.md` · Nguồn: `deployment/secrets.mdx`
Tóm tắt: Toàn bộ secret mà EmDash cần, cách cung cấp chúng, và điều gì xảy ra khi xoay vòng (rotate) hoặc làm mất secret.
Trạng thái: Đã xong

**29. Bộ nhớ đệm đối tượng (Object Cache)**
File: `chuong/29-object-cache.md` · Nguồn: `deployment/object-cache.mdx`
Tóm tắt: Cache kết quả truy vấn trong Cloudflare KV hoặc bộ nhớ, để phục vụ các lượt đọc mà không cần truy vấn database ở mỗi request.
Trạng thái: Đã xong

**30. Nâng cấp phiên bản EmDash**
File: `chuong/30-nang-cap-phien-ban.md` · Nguồn: `deployment/updating.mdx`
Tóm tắt: Quy trình đưa một site đang chạy lên phiên bản EmDash mới — từ đọc release notes đến xác minh site sau khi cập nhật.
Trạng thái: Đã xong

**31. Thanh toán tích hợp x402**
File: `chuong/31-thanh-toan-x402.md` · Nguồn: `guides/x402-payments.mdx`
Tóm tắt: Kiếm tiền từ nội dung bằng giao thức thanh toán x402 — thu phí bot (AI crawler) thay vì thu phí người dùng thật.
Trạng thái: Đã xong

**32. Công cụ AI tích hợp sẵn**
File: `chuong/32-cong-cu-ai.md` · Nguồn: `guides/ai-tools.mdx`
Tóm tắt: Kết nối Claude, ChatGPT và các trợ lý AI khác vào site EmDash — góc nhìn người vận hành muốn bật/cấu hình tính năng AI, khác với chương 38 (MCP server, góc nhìn dev).
Trạng thái: Đã xong

### Phần IV — Dành cho lập trình viên

*(Áp dụng cho vai trò: Lập trình viên)*

**33. Tổng quan công cụ cho dev: CLI, API, MCP**
File: `chuong/33-tong-quan-cong-cu-dev.md` · Nguồn: `reference/cli.mdx`
Tóm tắt: Giao diện dòng lệnh `emdash`/`em` — các lệnh quản trị, sinh type, quản lý secret — làm điểm khởi đầu cho các chương tham chiếu kỹ thuật tiếp theo.
Trạng thái: Đã xong

**34. Truy vấn nội dung trong code Astro**
File: `chuong/34-truy-van-noi-dung.md` · Nguồn: `guides/querying-content.mdx`
Tóm tắt: Dùng `getEmDashCollection` và `getEmDashEntry` để lấy nội dung trong template Astro — cách viết trang public dựa trên dữ liệu EmDash.
Trạng thái: Đã xong

**35. REST API tham chiếu**
File: `chuong/35-rest-api.md` · Nguồn: `reference/rest-api.mdx`, `reference/api.mdx`
Tóm tắt: Danh sách endpoint HTTP để quản lý nội dung, media và schema; kèm API JavaScript lập trình để truy vấn/quản lý nội dung EmDash từ code phía server.
Trạng thái: Đã xong

**36. Cấu hình EmDash (`emdash.config`)**
File: `chuong/36-cau-hinh-emdash.md` · Nguồn: `reference/configuration.mdx`
Tóm tắt: Tham chiếu đầy đủ các tuỳ chọn cấu hình EmDash trong file cấu hình của integration.
Trạng thái: Đã xong

**37. Hooks & vòng đời sự kiện**
File: `chuong/37-hooks-vong-doi.md` · Nguồn: `reference/hooks.mdx`
Tóm tắt: Các hook plugin dùng để mở rộng chức năng EmDash — chạy code phản ứng theo sự kiện nội dung, media, vòng đời, và render trang.
Trạng thái: Đã xong

**38. Máy chủ MCP cho AI Agent**
File: `chuong/38-mcp-server.md` · Nguồn: `reference/mcp-server.mdx`
Tóm tắt: Chi tiết giao thức, đặc tả tool và cấu hình OAuth cho MCP server tích hợp sẵn — cho phép AI agent thao tác trực tiếp trên site EmDash.
Trạng thái: Đã xong

**39. Viết Plugin đầu tiên (sandboxed)**
File: `chuong/39-viet-plugin-dau-tien.md` · Nguồn: `creating-plugins/choosing-a-format.mdx`, `creating-plugins/your-first-plugin.mdx`, `creating-plugins/manifest.mdx`
Tóm tắt: Chọn giữa định dạng plugin sandboxed và native trước khi viết code; xây dựng, đăng ký và chạy một plugin sandboxed "hello world"; tham chiếu file manifest `emdash-plugin.jsonc` (định danh, hợp đồng tin cậy, trường profile, publisher pinning).
Trạng thái: Đã xong

**40. API Routes & Capabilities của Plugin**
File: `chuong/40-api-routes-capabilities.md` · Nguồn: `creating-plugins/api-routes.mdx`, `creating-plugins/capabilities.mdx`, `creating-plugins/hooks.mdx`
Tóm tắt: Cách expose REST endpoint từ plugin sandboxed cho admin UI và tích hợp bên ngoài; cách khai báo capability plugin cần và cơ chế sandbox thực thi kiểm soát; hooks dành riêng cho plugin sandboxed.
Trạng thái: Đã xong

**41. Giao diện Plugin: Block Kit, Field Kit, Settings**
File: `chuong/41-block-kit-field-kit.md` · Nguồn: `creating-plugins/block-kit.mdx`, `plugins/field-kit.mdx`, `creating-plugins/settings.mdx`
Tóm tắt: Block Kit — hệ UI khai báo cho trang admin/widget của plugin sandboxed; Field Kit — widget trường có thể kết hợp cho field kiểu json, cấu hình qua seed option; cấu hình riêng từng plugin qua KV store, hiển thị trong admin UI dưới dạng trang Block Kit.
Trạng thái: Đã xong

**42. Lưu trữ dữ liệu Plugin & CLI plugin**
File: `chuong/42-luu-tru-cli-plugin.md` · Nguồn: `creating-plugins/storage.mdx`, `creating-plugins/cli.mdx`
Tóm tắt: Lưu trữ dữ liệu plugin trong document collection có index truy vấn được; công cụ dòng lệnh `emdash-plugin` (init, build, dev, bundle, validate, publish) dùng để phát triển plugin.
Trạng thái: Đã xong

**43. Phát hành Plugin lên Registry**
File: `chuong/43-phat-hanh-plugin.md` · Nguồn: `creating-plugins/publishing.mdx`, `creating-plugins/migrating-to-the-cli.mdx`
Tóm tắt: Đóng gói và phát hành plugin sandboxed lên plugin registry của EmDash; các thay đổi breaking cho tác giả plugin cũ cần cập nhật theo CLI mới.
Trạng thái: Đã xong

**44. Plugin Native (nâng cao)**
File: `chuong/44-plugin-native.md` · Nguồn: `creating-native-plugins/your-first-native-plugin.mdx`, `creating-native-plugins/react-admin.mdx`
Tóm tắt: Xây dựng plugin native theo mẫu descriptor + `createPlugin`, chạy trong tiến trình host (không sandbox) để truy cập sâu hệ thống; cách viết trang admin/widget bằng React thật cho plugin native.
Trạng thái: Đã xong

**45. Plugin Native: Page Fragments & Portable Text Components**
File: `chuong/45-page-fragments-portable-text.md` · Nguồn: `creating-native-plugins/page-fragments.mdx`, `creating-native-plugins/portable-text-components.mdx`, `creating-native-plugins/distributing.mdx`
Tóm tắt: Chèn script/stylesheet/HTML vào trang public đã render (chỉ plugin native); cung cấp component Astro để render các block type Portable Text do plugin định nghĩa; đóng gói và phân phối plugin native qua npm.
Trạng thái: Đã xong

**46. Chuyển đổi Plugin WordPress sang EmDash**
File: `chuong/46-chuyen-doi-plugin-wp.md` · Nguồn: `migration/porting-plugins.mdx`
Tóm tắt: Chuyển đổi plugin WordPress sang plugin EmDash bằng Plugin API — ánh xạ khái niệm hook/API giữa hai hệ.
Trạng thái: Đã xong

**47. Xây dựng Theme từ đầu**
File: `chuong/47-xay-dung-theme.md` · Nguồn: `themes/creating-themes.mdx`
Tóm tắt: Hướng dẫn kỹ thuật đầy đủ để tạo và phân phối theme EmDash của riêng bạn — đây là nguồn dài nhất (764 dòng) trong phần theme, chi tiết cấu trúc theme và các quy ước cần tuân theo.
Trạng thái: Đã xong

**48. Seed Files — dữ liệu khởi tạo cho Theme**
File: `chuong/48-seed-files.md` · Nguồn: `themes/seed-files.mdx`
Tóm tắt: Tham chiếu cấu trúc và cú pháp file seed EmDash (`.emdash/seed.json`) — dữ liệu JSON mô tả collection/taxonomy/menu/nội dung dùng để khởi tạo site hoặc chuyển mô hình dữ liệu giữa các môi trường.
Trạng thái: Đã xong

### Phần V — Phụ lục

**49. Bảng thuật ngữ đối chiếu Anh–Việt**
File: `chuong/49-thuat-ngu.md` · Nguồn: tổng hợp toàn sách (không có `.mdx` nguồn riêng)
Tóm tắt: Bảng thuật ngữ chính thức, chốt lại và mở rộng từ [Bảng thuật ngữ tạm](#bảng-thuật-ngữ-tạm) bên dưới sau khi toàn bộ 48 chương nội dung đã hoàn thành — dùng để rà soát nhất quán toàn sách ở GĐ12.
Trạng thái: Đã xong

**50. Lịch sử tính năng theo phiên bản**
File: `chuong/50-lich-su-tinh-nang.md` · Nguồn: `packages/core/CHANGELOG.md` (2276 dòng, quản lý bằng Changesets)
Tóm tắt: Tổng hợp các mốc tính năng nổi bật của gói `emdash` theo phiên bản (vd: `0.36.0` thêm `ContentSaveRejectedError`, publish plugin lên Personal Data Server, phân trang Media Library, dark mode variant cho ảnh, media folders...) — không dịch toàn bộ changelog, chỉ chắt lọc các thay đổi có ý nghĩa với người dùng cuối.
Trạng thái: Đã xong

**51. Câu hỏi thường gặp & khắc phục sự cố**
File: `chuong/51-cau-hoi-thuong-gap.md` · Nguồn: tổng hợp từ README, các đoạn troubleshooting rải rác trong `guides/*.mdx`, `deployment/*.mdx` (không có `.mdx` nguồn riêng)
Tóm tắt: Tổng hợp các vướng mắc thường gặp khi cài đặt/vận hành (vd yêu cầu Dynamic Workers trả phí để chạy plugin sandbox trên Cloudflare) và câu trả lời rút ra từ tài liệu gốc — viết sau cùng khi đã có đủ ngữ cảnh từ 50 chương trước.
Trạng thái: Đã xong

---

## Bảng thuật ngữ tạm

Áp dụng nhất quán từ GĐ1; chốt chính thức ở chương 49 (GĐ12).

| Thuật ngữ tiếng Anh | Cách dùng trong sổ tay |
|---|---|
| Collection | Giữ nguyên tiếng Anh (kèm chú thích "loại nội dung" lần đầu xuất hiện trong mỗi chương) |
| Field | Giữ nguyên tiếng Anh ("trường") |
| Taxonomy / Taxonomies | Giữ nguyên tiếng Anh, dịch mô tả là "phân loại nội dung" |
| Live Collections | Giữ nguyên tiếng Anh, không dịch |
| Seed file | Giữ nguyên tiếng Anh ("tệp seed") |
| Passkey | Giữ nguyên tiếng Anh |
| Portable Text | Giữ nguyên tiếng Anh |
| Widget / Widget Area | Giữ nguyên tiếng Anh |
| Plugin (sandboxed / native) | Giữ nguyên tiếng Anh |
| Theme | Giữ nguyên tiếng Anh |
| Vai trò: Subscriber, Contributor, Author, Editor, Admin | Giữ nguyên tiếng Anh xuyên suốt, không dịch tên vai trò |
| Trạng thái: draft, published, scheduled | Giữ nguyên tiếng Anh, có thể chú thích tiếng Việt lần đầu (nháp/đã xuất bản/đã lên lịch) |
| Đường dẫn admin panel (`/_emdash/admin`, `/content/:collection`, `/content-types`, `/media`, `/menus`, `/widgets`, `/taxonomies`, `/settings`, `/plugins/:pluginId/*`) | Trích dẫn chính xác nguyên văn, không đổi khác giữa các chương |
| Setup Wizard | Giữ nguyên tiếng Anh ("Trình cài đặt") |
| MCP (Model Context Protocol) | Giữ nguyên tiếng Anh/viết tắt |
| Object Cache | Giữ nguyên tiếng Anh ("bộ nhớ đệm đối tượng") |

---

## Bảng 13 giai đoạn triển khai

| Giai đoạn | Nội dung | Chương | Trạng thái |
|---|---|---|---|
| GĐ0 | Viết Đề cương chi tiết toàn sách | — | Đã xong |
| GĐ1 | Phần I — Nhập môn & Cài đặt | 1–5 | Đã xong |
| GĐ2 | Phần II.A — Admin Panel, Đăng nhập, Soạn thảo, Media | 6–9 | Đã xong |
| GĐ3 | Phần II.B — Menu, Widget, Taxonomy, Preview, Settings, Dark mode, i18n | 10–16 | Đã xong |
| GĐ4 | Phần III.A — Content Types, Layout, Users/Roles, Plugin (end-user), Theme cơ bản | 17–21 | Đã xong |
| GĐ5 | Phần III.B — Sao lưu, Di chuyển WP, Nhập nội dung | 22–24 | Đã xong |
| GĐ6 | Phần III.C — Triển khai (Cloudflare, Node.js, DB, Secrets, Object Cache, Updating) | 25–30 | Đã xong |
| GĐ7 | Phần III.D — x402 Payments, AI Tools | 31–32 | Đã xong |
| GĐ8 | Phần IV.A — CLI/API/Config/Hooks/MCP (tách GĐ8a: CLI+Config+Hooks / GĐ8b: Querying+REST API+MCP) | 33–38 | Đã xong |
| GĐ9 | Phần IV.B — Viết Plugin sandboxed (từ đầu đến publish) | 39–43 | Đã xong |
| GĐ10 | Phần IV.C — Plugin Native + Porting Plugin WP | 44–46 | Đã xong |
| GĐ11 | Phần IV.D — Xây dựng Theme + Seed Files | 47–48 | Đã xong |
| GĐ12 | Phần V — Phụ lục (Thuật ngữ, Changelog, FAQ) + rà soát nhất quán toàn sách | 49–51 | Đã xong |

Chi tiết kế hoạch đầy đủ: `docs/plans/2026-09-02-so-tay-huong-dan-su-dung-emdash.md`.
