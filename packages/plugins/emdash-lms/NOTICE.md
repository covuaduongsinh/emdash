# Thông báo bản quyền và nguồn gốc mã nguồn (NOTICE)

Package này (`emdash-lms`) là bản fork nội bộ của **Công ty CP Cờ vua Dương Sinh** phục vụ dự án **Cờ Vua Học Đường** (covuahocduong.com) trên nền tảng EmDash CMS + Cloudflare (D1, Workers).

- **Nguồn gốc:** [tohaitrieu/emdash-lms](https://github.com/tohaitrieu/emdash-lms) @ commit `5ce68d1`
- **Tác giả gốc:** Tô Triều (<hello@totrieu.com>)
- **Giấy phép:** MIT License

## Thay đổi và nâng cấp tại Giai đoạn 2a (Ổn định LMS & An toàn hệ thống)

1. **Định dạng & Tiêu chuẩn Repo:**
   - Chuẩn hóa thụt lề tab theo quy ước repo EmDash.
   - Sử dụng Kumo Design System và lớp CSS Tailwind RTL-safe cho toàn bộ Admin UI.
2. **Kiến trúc Plugin Route Handlers (L1, L10):**
   - Mọi route handler nhận đúng 1 tham số `RouteContext`, loại bỏ hoàn toàn các handler dạng `(input, ctx)`.
   - Khai báo đầy đủ `input: z.object(...)` cho từng route và bắt lỗi bằng `PluginRouteError`.
   - Chuẩn hóa capability danh mục mới: `["content:read", "content:write", "users:read"]`, loại bỏ `as any` và typecheck sạch 100%.
3. **Admin UI Quản lý LMS (L2):**
   - Export named `pages` cho Admin:
     - `/settings/setup`: "Cài đặt LMS" (nút chạy đồng bộ schema, trạng thái 16 collection).
     - `/students`: "Học viên" (theo dõi tiến độ học tập, lọc theo khóa học, ghi danh thủ công bằng email).
     - `/settings`: "Cài đặt" cấu hình chung LMS.
4. **Đồng bộ Schema Idempotent (L9, L11):**
   - Định nghĩa schema bằng TypeScript module trong `src/schema/definitions.ts`.
   - Route `setup/run` (yêu cầu quyền `schema:manage`):
     - Tự động phát hiện và đăng ký 5 bảng mồ côi (`ec_memberships`, `ec_lesson_progress`, `ec_quiz_submissions`, `ec_certificates`, `ec_certificate_templates`) qua `SchemaRegistry.registerOrphanedTable`.
     - Tạo mới các collection còn thiếu bằng `SchemaRegistry.createCollection`.
     - Bổ sung các trường còn thiếu và chuyển đổi định dạng `select` + `validation.options`.
     - Tuyệt đối không xóa hay thay đổi id/dữ liệu đã có.
5. **Hệ thống Phân quyền & Tiến độ Học viên (L3, L4, L8):**
   - Các route học viên `me/access`, `me/enroll`, `me/progress`, `progress/complete`, `progress/sync` yêu cầu quyền `content:read` và xác thực định danh nghiêm ngặt qua `ctx.user.id` (chống IDOR).
   - Truy vấn tối ưu bằng `where.fieldFilters` thay vì `where.user_id`.
   - Tự động cập nhật `enrollments.progress` và `completed_at` khi hoàn thành bài học.
6. **Tối ưu Trang & Giao thức Hoàn thành Bài học (L7, L8):**
   - Trang `/course/[slug]`: Sử dụng `requestCached` và `fieldFilters` (tối đa 3 query).
   - Trang `/lesson/[slug]`: Kiểm tra quyền phía server (0 query phụ cho khách ẩn danh); hỗ trợ đếm yêu cầu bài học qua thuộc tính `[data-lms-requirement]` và sự kiện `lms:requirement-done`.
   - Trang `/checkout/[id]`: Tạm thời thông báo bảo trì thanh toán, route checkout và webhook được chuyển sang Giai đoạn 2b để đảm bảo an toàn tuyệt đối.
