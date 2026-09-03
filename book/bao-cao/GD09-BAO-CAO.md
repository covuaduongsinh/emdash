# Báo cáo Giai đoạn 9 — Phần IV.B: Viết Plugin sandboxed (từ đầu đến publish)

Trạng thái: **Hoàn thành** — 5/5 chương đã viết.

## File đã tạo

| File | Nguồn đã đối chiếu |
|---|---|
| `book/chuong/39-viet-plugin-dau-tien.md` | `plugins/creating-plugins/choosing-a-format.mdx`, `your-first-plugin.mdx`, `manifest.mdx` |
| `book/chuong/40-api-routes-capabilities.md` | `plugins/creating-plugins/api-routes.mdx`, `capabilities.mdx`, `hooks.mdx` |
| `book/chuong/41-block-kit-field-kit.md` | `plugins/creating-plugins/block-kit.mdx`, `plugins/field-kit.mdx`, `creating-plugins/settings.mdx` |
| `book/chuong/42-luu-tru-cli-plugin.md` | `plugins/creating-plugins/storage.mdx`, `creating-plugins/cli.mdx` |
| `book/chuong/43-phat-hanh-plugin.md` | `plugins/creating-plugins/publishing.mdx`, `migrating-to-the-cli.mdx` |

Đã cập nhật `book/01-DE-CUONG.md`: 5 chương + GĐ9 đánh dấu "Đã xong".

## Tóm tắt từng chương

39. **Viết Plugin đầu tiên** — Chọn sandboxed vs native (bảng so sánh, 3 lý do chọn native), cấu trúc 2 file, thiết lập package.json/tsconfig, manifest đầy đủ (định danh/profile/hợp đồng tin cậy/publisher pinning), runtime `src/plugin.ts`, đăng ký, build & run.
40. **API Routes & Capabilities** — Định nghĩa route, filter field indexed, URL routing, auth/CSRF (private/public), caller identity, cache response public, expose MCP tool, validate input, return/error, request access, mẫu thường gặp, gọi từ admin UI/queue/ngoài; capability reference đầy đủ, allowlist host, sandbox thực thi/không thực thi, đồng ý capability; tóm tắt hook trong ngữ cảnh sandboxed.
41. **Block Kit, Field Kit, Settings** — Cơ chế Block Kit (13 loại block, 6 loại element, builder helper, field điều kiện); 4 widget Field Kit đầy đủ (object-form/list/grid/tags) + sub-field + summary template; Settings qua KV + Block Kit, secret value, default value, so sánh Settings/Storage/KV.
42. **Storage & CLI plugin** — API Collection đầy đủ (CRUD, query, batch, pagination, index design, type safety), so sánh Storage/Content/KV, chi tiết implementation; toàn bộ 12 lệnh CLI `emdash-plugin` (init/build/dev/validate/bundle/publish + API lập trình).
43. **Phát hành lên Registry** — Tài khoản Atmosphere (dùng có sẵn/đăng ký mới), publish flow đầy đủ, bundle validation, publish steps, external URL, version bất biến, publisher mismatch, hướng dẫn migrate từ `definePlugin()` cũ sang CLI mới (6 bước breaking change) kèm thông báo cho người dùng plugin.

## Vấn đề phát sinh

- **Trùng lặp có chủ đích với Chương 20 và Chương 37 đã xử lý bằng dẫn chiếu ngược:** nội dung hook trong `creating-plugins/hooks.mdx` (nguồn Chương 40) gần như trùng bảng tổng quan đã có ở Chương 37 (Hook Reference) — chỉ giữ lại phần đặc thù sandboxed (không huỷ được `content:beforeSave` trong sandbox, `page:fragments` chỉ native) thay vì dịch lại toàn bộ 24 hook lần nữa.
- Chương 43 gộp cả hướng dẫn migrate từ `definePlugin()` cũ (nguồn `migrating-to-the-cli.mdx`) — nội dung này về bản chất là dành cho tác giả plugin cũ, khác đối tượng với phần đầu chương (viết mới) nhưng cùng chủ đề "CLI/publish" nên giữ trong 1 chương theo đúng đề cương gốc.
- Không có mâu thuẫn thông tin giữa các nguồn.

## Lưu ý cho Giai đoạn 10 (Plugin Native + Porting Plugin WP)

- Chương 44-45 (Plugin Native) sẽ tham chiếu ngược nhiều tới Chương 39 (bảng so sánh sandboxed/native) và Chương 37 (page:fragments hook).
- Không có thay đổi với bảng thuật ngữ tạm.
- Tiếp tục thực thi trực tiếp, không dùng fork lồng.
