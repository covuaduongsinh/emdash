# Báo cáo Giai đoạn 8a — Phần IV.A (phần 1): CLI, Configuration, Hooks

Trạng thái: **Hoàn thành** — 3/3 chương đã viết.

## File đã tạo

| File | Nguồn đã đối chiếu |
|---|---|
| `book/chuong/33-tong-quan-cong-cu-dev.md` | `reference/cli.mdx` (629 dòng) |
| `book/chuong/36-cau-hinh-emdash.md` | `reference/configuration.mdx` (803 dòng) |
| `book/chuong/37-hooks-vong-doi.md` | `reference/hooks.mdx` (781 dòng) |

Đã cập nhật `book/01-DE-CUONG.md`: 3 chương đánh dấu "Đã xong" (GĐ8 tổng thể giữ nguyên trạng thái tới khi 8b xong).

## Tóm tắt từng chương

33. **CLI Reference** — Cài đặt, xác thực, cờ chung, toàn bộ lệnh (`migrate`, `types`, `login/logout/whoami`, `content`, `schema`, `media`, `search`, `taxonomy`, `menu`, `export-seed`, `secrets`), file sinh ra, biến môi trường, exit code.
34. **Configuration Reference** — Mọi tuỳ chọn integration (`database`, `migrations`, `storage`, `objectCache`, `middleware.outer`, `plugins`, `fonts`, `auth`, `authProviders`, `siteUrl` + đa origin passkey + reverse proxy, `trustedProxyHeaders`, `maxUploadSize`, `toolbar`, `experimental.registry`), database/storage/object-cache adapter đầy đủ, Live Collections, biến môi trường, `package.json` config, TypeScript config.
37. **Hook Reference** — Bảng tổng quan 24 hook, chi tiết từng nhóm (Content/Media/Lifecycle/Cron/Email/Comment/Page), cấu hình hook (priority/timeout/dependencies/errorPolicy/exclusive), Plugin Context, xử lý lỗi, thứ tự thực thi.

## Vấn đề phát sinh

- Đây là 3 nguồn tham chiếu kỹ thuật rất dài và dày đặc (tổng ~2.200 dòng). Đã dịch đầy đủ mọi bảng, tuỳ chọn, và ví dụ code quan trọng — không cắt bớt nội dung như đã làm ở một số phần "nâng cao hiếm gặp" của GĐ6, vì đây là tài liệu tham chiếu API/CLI mà lập trình viên cần tra cứu chính xác từng tuỳ chọn.
- Nhiều nội dung trong Chương 36 (Configuration) trùng lặp có chủ đích với các chương triển khai đã viết (25-30) — đã xử lý bằng cách dẫn chiếu ngược thay vì lặp lại chi tiết đầy đủ (vd phần `database`/`storage`/`objectCache` chỉ tóm tắt cú pháp, trỏ về chương triển khai để đọc giải thích).
- Không có mâu thuẫn thông tin giữa các nguồn.

## Lưu ý cho Giai đoạn 8b (Querying, REST API, MCP)

- Không có thay đổi với bảng thuật ngữ tạm.
- Chương 35 (REST API) là nguồn lớn nhất còn lại của toàn bộ đề cương (1.729 dòng) — cân nhắc kỹ phạm vi khi viết, có thể cần tóm lược các phần liệt kê endpoint lặp lại (CRUD chuẩn cho nhiều resource) thay vì liệt kê chi tiết từng cái nếu cấu trúc lặp lại.
- Chương 38 (MCP Server) cần tránh lặp lại phần "Những gì bạn có thể làm" đã có ở Chương 32 — tập trung vào chi tiết kỹ thuật (endpoint, OAuth, tool parameters).
- Tiếp tục thực thi trực tiếp, không dùng fork lồng.
