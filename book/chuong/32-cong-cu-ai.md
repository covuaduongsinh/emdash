# 32. Công cụ AI tích hợp sẵn

Áp dụng cho vai trò: Quản trị viên/Vận hành, Người biên tập nội dung (khi dùng trợ lý AI)

## Tổng quan

EmDash có sẵn một [MCP server](https://modelcontextprotocol.io) tích hợp, cho phép trợ lý AI thao tác trực tiếp với nội dung site của bạn. Bạn có thể nhờ Claude, ChatGPT, hoặc công cụ khác soạn bài viết, cập nhật trang, quản lý media, tìm kiếm nội dung, và nhiều hơn nữa — tất cả qua hội thoại tự nhiên.

> Chương này nói về MCP server của **site của bạn** — để quản lý nội dung một site EmDash. Nếu muốn cấp cho trợ lý coding AI quyền truy cập vào chính tài liệu EmDash (để nó trả lời câu hỏi về EmDash khi bạn đang xây dựng), đó là một MCP server khác ("Docs MCP") — hầu hết lập trình viên kết nối cả hai, nhưng nằm ngoài phạm vi sổ tay hướng dẫn sử dụng này (dành cho tài liệu kỹ thuật của dự án).

## MCP Server

MCP server **bật theo mặc định** — route tại `/_emdash/api/mcp` được mount trừ khi bạn tắt tường minh. Nó luôn yêu cầu xác thực, nên không có nội dung nào lộ ra khi chưa có credential hợp lệ.

Tắt bằng cách đặt `mcp: false` trong cấu hình Astro:

```js title="astro.config.mjs"
emdash({
  mcp: false,
})
```

## Thiết lập kết nối

URL MCP server của site là `https://example.com/_emdash/api/mcp` (thay `example.com` bằng domain của bạn; với phát triển cục bộ dùng `http://localhost:4321/_emdash/api/mcp`).

### Kết nối với Claude

Connector thêm trong [claude.ai](https://claude.ai) hoạt động cả trên web app lẫn Claude Desktop:

1. Vào [Settings > Connectors](https://claude.ai/settings/connectors).
2. Nhấn **Add custom connector**.
3. Nhập URL MCP server của site.
4. Nhấn **Add** — trình duyệt mở ra để bạn đăng nhập và cấp quyền.
5. Bắt đầu hội thoại mới, nhấn **+** trong ô chat, chọn **Connectors**, bật site của bạn.

Với gói Team và Enterprise, Owner thêm connector trước từ [Admin Settings > Connectors](https://claude.ai/admin-settings/connectors); thành viên sau đó tự kết nối từ cài đặt riêng của họ.

### Kết nối với ChatGPT

ChatGPT hỗ trợ MCP server trên gói Pro, Business, và Enterprise:

1. Vào **Settings > Apps & Connectors > Advanced settings**, bật **Developer Mode**.
2. Vào **Settings > Connectors > Create**.
3. Nhập tên, mô tả, và URL MCP server của site.
4. Nhấn **Create**.
5. Trong hội thoại, nhấn **+** cạnh ô soạn, chọn **More**, chọn connector vừa tạo.

> Dùng công cụ coding như VS Code, Cursor, hay Windsurf? Xem [Chương 38 — Máy chủ MCP cho AI Agent](./38-mcp-server.md) để biết chi tiết cấu hình.

## Những gì bạn có thể làm

Sau khi kết nối, bạn có thể yêu cầu trợ lý AI thực hiện các thao tác dưới đây bằng ngôn ngữ tự nhiên — không cần biết tên công cụ (tool), chỉ cần mô tả điều bạn muốn.

**Nội dung:**
- Duyệt nội dung — "Cho tôi xem 10 bài viết mới nhất" hoặc "Tìm mọi trang đang ở dạng draft".
- Đọc nội dung — "Lấy bài viết 'hello-world' và tóm tắt lại".
- Tạo nội dung — "Viết một bài blog mới về đợt sale mùa hè" hoặc "Tạo trang draft cho mục Giới thiệu".
- Sửa nội dung — "Cập nhật trang giá để nhắc tới gói mới" hoặc "Sửa lỗi chính tả trong bài FAQ".
- Xuất bản và lên lịch — "Xuất bản bài sale mùa hè", "Lên lịch bài thông báo vào 1/6 lúc 9 giờ sáng", hoặc "Huỷ lịch của bài ra mắt".
- So sánh phiên bản — "Cho tôi xem trang chủ đã thay đổi gì kể từ lần xuất bản trước".
- Quản lý draft — "Bỏ thay đổi draft trên trang giới thiệu" hoặc "Nhân bản template newsletter".
- Bản dịch — "Bài chào mừng có những bản dịch nào?" (khi bật i18n).

**Media:**
- Duyệt media — "Liệt kê mọi ảnh đã upload" hoặc "Cho tôi xem file PDF trong thư viện media".
- Xem chi tiết — "Lấy thông tin chi tiết của tệp media này".
- Đăng ký upload — "Đăng ký tệp tôi vừa upload tại `media/2026/banner.png` làm media item".
- Cập nhật metadata — "Đặt alt text cho ảnh hero thành 'Mountain sunset'".
- Xoá tệp — "Xoá ảnh banner cũ".

> MCP transport không mang được dữ liệu nhị phân upload. Để thêm ảnh mới, upload byte qua admin UI (hoặc luồng signed-upload của riêng bạn) rồi nhờ AI đăng ký metadata.

**Tìm kiếm:** "Tìm bài viết nhắc tới 'accessibility'" hoặc "Tìm mọi thứ liên quan TypeScript trên mọi Collection".

**Taxonomy:**
- Duyệt — "Liệt kê mọi category" hoặc "Cho tôi xem các tag".
- Tạo term — "Thêm tag 'tutorials'" hoặc "Tạo subcategory 'Frontend' dưới 'Engineering'".
- Đổi tên term — "Đổi tên category 'frontend' thành 'Web Frontend'".
- Di chuyển term — "Chuyển tag 'tutorials' vào dưới category 'guides'" hoặc "Tách 'react' khỏi category cha".
- Xoá term — "Xoá tag 'archive' không dùng nữa".

**Menu:**
- Xem menu — "Cho tôi xem menu điều hướng chính" hoặc "Menu footer có gì?".
- Tạo menu — "Tạo menu mới tên 'sidebar'".
- Sửa menu — "Đổi tên menu 'main' thành 'Primary navigation'".
- Đặt mục menu — "Thay mục trong menu chính thành Home, Blog, About, và Contact".
- Xoá menu — "Xoá menu 'mobile' không dùng nữa".

**Site Settings:**
- Kiểm tra — "Tên site hiện tại là gì?" hoặc "Cho tôi xem link mạng xã hội".
- Cập nhật định danh — "Đặt tên site là 'Acme Blog' và tagline là 'Stories from the team'".
- Đặt logo/favicon — "Dùng ảnh này làm logo site" (sau khi upload bằng công cụ `media_upload`).
- Mặc định SEO — "Đặt ảnh OG mặc định thành banner mới" hoặc "Đổi dấu phân cách title thành thanh dọc".
- Tài khoản mạng xã hội — "Thêm link Mastodon và YouTube của chúng tôi vào cài đặt social".

> Đọc site settings cần vai trò Editor; cập nhật cần vai trò Admin.

**Schema (chỉ Admin):**
- Kiểm tra — "Có những Collection nào?" hoặc "Cho tôi xem field của Collection posts".
- Tạo Collection — "Tạo Collection mới 'testimonials' với field name và quote".
- Sửa schema — "Thêm field boolean 'featured' vào posts".

> Thay đổi schema (tạo/xoá Collection và Field) sửa cấu trúc database, cần quyền Admin. AI sẽ báo nếu bạn không đủ quyền.

**Revision:**
- Xem lịch sử — "Cho tôi xem lịch sử revision của bài này".
- Khôi phục — "Khôi phục bài này về phiên bản trước".

## Quyền hạn (Permissions)

Khi một client MCP mở trang cấp quyền OAuth, mọi quyền nó yêu cầu được chọn sẵn theo mặc định — bỏ chọn quyền nào client không cần trước khi phê duyệt. Token kết quả chỉ giới hạn trong các quyền bạn giữ lại được chọn **và** quyền cho phép bởi vai trò EmDash của bạn — nên cấp ít quyền hơn không bao giờ làm tăng những gì client có thể làm.

| Vai trò | AI có thể làm gì |
| --- | --- |
| **Admin** | Mọi thứ, kể cả thay đổi schema và cập nhật site settings |
| **Editor** | Mọi nội dung, media, taxonomy, và menu. Xem được schema và đọc settings |
| **Author** | Nội dung và media của chính mình |
| **Contributor** | Nội dung của chính mình (không xuất bản) và media |

Nếu bạn thử thao tác không có quyền, AI sẽ báo cho bạn biết.

## Mẹo sử dụng

- **Nêu rõ Collection.** Nói "tạo bài blog" thay vì "tạo bài viết" nếu site có nhiều Collection.
- **Hỏi schema trước.** Nếu chưa chắc Collection có field gì, hỏi "Collection posts có những field nào?" trước khi tạo/sửa nội dung.
- **Xem lại trước khi publish.** Nhờ AI tạo nội dung ở dạng draft, xem lại trong admin panel, rồi nhờ AI publish — hoặc tự publish.
- **Dùng compare để review.** Trước khi publish, hỏi "So sánh phiên bản live và draft của bài này" để thấy chính xác điều gì sẽ thay đổi.
- **Field rich text dùng Portable Text.** AI có thể viết nội dung cho field rich text, nhưng định dạng phức tạp nên làm trong trình soạn thảo admin.

## Dành cho lập trình viên

Endpoint MCP server, phương thức xác thực, OAuth discovery, tham số tool, và xử lý lỗi được tài liệu hoá đầy đủ ở [Chương 38 — Máy chủ MCP cho AI Agent](./38-mcp-server.md).

## Xem thêm

- [Chương 19 — Quản lý người dùng, vai trò và quyền hạn](./19-nguoi-dung-vai-tro.md)
- [Chương 38 — Máy chủ MCP cho AI Agent](./38-mcp-server.md)
