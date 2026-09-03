# Báo cáo Giai đoạn 8b — Phần IV.A (phần 2): Querying, REST API, MCP

Trạng thái: **Hoàn thành** — 3/3 chương đã viết. Đây cũng là báo cáo hoàn tất toàn bộ Giai đoạn 8 (8a + 8b = chương 33-38).

## File đã tạo

| File | Nguồn đã đối chiếu |
|---|---|
| `book/chuong/34-truy-van-noi-dung.md` | `guides/querying-content.mdx` (464 dòng) |
| `book/chuong/35-rest-api.md` | `reference/rest-api.mdx` (1.729 dòng — lớn nhất đề cương), `reference/api.mdx` (399 dòng) |
| `book/chuong/38-mcp-server.md` | `reference/mcp-server.mdx` (857 dòng) |

Đã cập nhật `book/01-DE-CUONG.md`: 3 chương + GĐ8 tổng thể đánh dấu "Đã xong" (13/13 chương của Phần IV.A hoàn tất qua cả 8a và 8b).

## Tóm tắt từng chương

34. **Truy vấn nội dung trong Astro** — `getEmDashCollection`/`getEmDashEntry` đầy đủ (lọc locale/status/limit/taxonomy), preview tự động, visual editing (`entry.edit` proxy + biến CSS style code inline), sắp xếp, TypeScript types, static/server rendering, cân nhắc hiệu năng.
35. **REST API tham chiếu** — Toàn bộ endpoint theo 15 nhóm (Content, Media với upload/folder/usage-tracking đầy đủ, Revision, Schema, Plugin, Search, Section/Settings/Menu/Taxonomy/Widget Area dạng bảng CRUD gọn, User, Authentication, Import, Rate Limiting, CORS) + phần JavaScript API đầy đủ (content queries, preview, converters, settings/menu/taxonomy/widget/section/search functions, error classes).
38. **MCP Server Reference** — Xác thực (3 phương thức), 12 scope, bảng vai trò tối thiểu, transport stateless, toàn bộ ~35 tool theo 8 nhóm (dạng bảng gọn kèm tham số/scope/ghi chú phá huỷ), OAuth discovery (2 metadata document), xử lý lỗi.

## Vấn đề phát sinh

- **Chương 35 là thách thức lớn nhất về khối lượng** trong toàn bộ đề cương (nguồn gốc 1.729 dòng). Đã xử lý bằng chiến lược phân tầng: giữ chi tiết đầy đủ cho các phần phức tạp/độc nhất (upload flow, media usage tracking, error codes, search, reorder terms), condense các resource theo mẫu CRUD lặp lại (Section/Settings/Menu/Taxonomy/Widget Area) thành bảng endpoint gọn kèm dẫn chiếu ngược tới chương tính năng tương ứng đã có body request chi tiết — không dịch lại từng ví dụ JSON giống hệt nhau.
- Tương tự, Chương 38 (MCP) trình bày ~35 tool dưới dạng bảng thay vì heading/prose riêng cho từng tool như nguồn — giữ đầy đủ thông tin (tham số, scope, ghi chú đặc biệt) nhưng nén định dạng để chương không quá dài dòng.
- Không có mâu thuẫn thông tin giữa các nguồn — REST API và JS API (Chương 34/35) và MCP (Chương 38) mô tả cùng một hệ thống nghiệp vụ dưới 3 giao diện khác nhau, đã đối chiếu chéo để đảm bảo nhất quán (vd bảng vai trò tối thiểu ở Chương 38 khớp bảng ở Chương 19).

## Lưu ý cho Giai đoạn 9 (Viết Plugin sandboxed)

- Không có thay đổi với bảng thuật ngữ tạm.
- Chương 39-43 (viết plugin sandboxed) sẽ tham chiếu ngược nhiều tới Chương 37 (Hooks) và Chương 20 (cài đặt plugin, marketplace/registry).
- Toàn bộ Phần IV.A (Chương 33-38, phần tham chiếu kỹ thuật cốt lõi cho dev) đã hoàn tất — đây là cột mốc lớn, 38/51 chương xong.
- Tiếp tục thực thi trực tiếp, không dùng fork lồng.
