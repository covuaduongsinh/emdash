# Báo cáo Giai đoạn 0: Kiểm kê và nền móng

**Dự án:** Dương Sinh Chess Suite cho covuahocduong.com  
**Thời gian thực hiện:** 2026-10-09  
**Người thực hiện:** Phiên làm việc AI (theo chỉ dẫn của Thầy Tường)  
**Tài liệu liên quan:** [chess_lms_plan.md](chess_lms_plan.md), [chess_lms_prompts.md](chess_lms_prompts.md)

---

## 1. Tóm tắt kết quả

Giai đoạn 0 đã hoàn thành toàn bộ mục tiêu:

1. **Kiểm tra build & sửa tương thích đa nền tảng:**
   - Sửa URL `file:///C:/...` trong [packages/registry-verification/tsdown.config.ts](file:///D:/code/emdash/packages/registry-verification/tsdown.config.ts) thành `file:///emdash-registry-verification.js` đa nền tảng.
   - Sửa case-sensitivity khi xóa biến môi trường `npm_execpath` trên Windows trong [packages/registry-verification/tests/check-packed-output.test.ts](file:///D:/code/emdash/packages/registry-verification/tests/check-packed-output.test.ts).
   - `pnpm build` toàn bộ repo và toàn bộ 152 test (114 unit + 38 workerd) của `registry-verification` đều pass 100%.
2. **Cấu hình chuẩn hóa `packages/plugins/emdash-lms`:**
   - Đã thêm `"private": true` vào [packages/plugins/emdash-lms/package.json](file:///D:/code/emdash/packages/plugins/emdash-lms/package.json).
   - Đã tạo [packages/plugins/emdash-lms/NOTICE.md](file:///D:/code/emdash/packages/plugins/emdash-lms/NOTICE.md) ghi nhận bản quyền Tô Triều (@5ce68d1, MIT) và danh mục các thay đổi của Dương Sinh.
   - Đã tạo cấu hình [packages/plugins/emdash-lms/vitest.config.ts](file:///D:/code/emdash/packages/plugins/emdash-lms/vitest.config.ts).
   - Chuyển `exports` trỏ trực tiếp vào `src/` (theo quy ước `packages/plugins/forms`). Đã kiểm tra typecheck các demo (`demos/cloudflare`, `demos/playground`, `demos/preview`...) đều sạch 0 lỗi.
3. **Test ghi nhận lỗi nền tảng (Baseline Tests):**
   - Đã viết [packages/plugins/emdash-lms/tests/errors-baseline.test.ts](file:///D:/code/emdash/packages/plugins/emdash-lms/tests/errors-baseline.test.ts) sử dụng `it.fails` ghi nhận chính xác 3 lỗi cốt lõi: **L1** (sai chữ ký handler route), **L2** (thiếu named export `pages`), **L12** (route checkout không public). Các test này sẽ được chuyển thành test chuẩn và pass ở GĐ2a/2b.
4. **Kiểm toán Schema D1 (L11):**
   - Đã xuất bản sao lưu `emdash_db-backup.sql` từ Cloudflare D1 production và nạp kiểm toán trên SQLite in-memory.
   - Xác định chính xác **5 bảng mồ côi (orphaned tables)** chưa được đăng ký trong `_emdash_collections`.
   - Xác định danh sách các field `type: "string"` có `options: {"choices": [...]}` cần chuyển sang `type: "select"` ở GĐ2a.
   - Bổ sung `*.sql` vào [.gitignore](file:///D:/code/emdash/.gitignore) để đảm bảo không commit dữ liệu người dùng.

---

## 2. Bảng kiểm toán Schema D1 Production (L11)

Kiểm toán từ bản export production thực tế `emdash_db-backup.sql` (18 bảng `ec_*`, 13 collection đã đăng ký, 112 field):

### 2.1 Bảng `ec_*` và trạng thái đăng ký Collection

| Tên bảng trong D1              | Đã đăng ký trong `_emdash_collections` | Số dòng dữ liệu | Ghi chú & Đánh giá                                                                                                                    |
| ------------------------------ | :------------------------------------: | :-------------: | ------------------------------------------------------------------------------------------------------------------------------------- |
| `ec_course_categories`         |      ✅ Có (`course_categories`)       |        4        | 4 danh mục cờ vua                                                                                                                     |
| `ec_courses`                   |           ✅ Có (`courses`)            |        4        | 4 khóa cờ (dùng custom ID: `course_chess_intro`, `course_chess_tactics`, `course_chess_opening_italian`, `course_chess_endgame_rook`) |
| `ec_modules`                   |           ✅ Có (`modules`)            |        6        | 6 chương học                                                                                                                          |
| `ec_lessons`                   |           ✅ Có (`lessons`)            |       12        | 10 bài cờ (`les_intro_*`, `les_tac_*`) + 2 bài mẫu LMS                                                                                |
| `ec_membership_plans`          |       ✅ Có (`membership_plans`)       |        3        | 3 gói Thẻ thư viện (`plan_monthly`, `plan_yearly`, `plan_vip_lifetime`)                                                               |
| `ec_coupons`                   |           ✅ Có (`coupons`)            |        0        | Đã có schema                                                                                                                          |
| `ec_course_reviews`            |        ✅ Có (`course_reviews`)        |        0        | Đã có schema                                                                                                                          |
| `ec_orders`                    |            ✅ Có (`orders`)            |        0        | Đã có schema                                                                                                                          |
| `ec_enrollments`               |         ✅ Có (`enrollments`)          |        0        | Đã có schema                                                                                                                          |
| `ec_questions`                 |          ✅ Có (`questions`)           |        0        | Đã có schema                                                                                                                          |
| `ec_quizzes`                   |           ✅ Có (`quizzes`)            |        0        | Đã có schema                                                                                                                          |
| `ec_pages`                     |            ✅ Có (`pages`)             |        1        | Trang tĩnh hệ thống EmDash                                                                                                            |
| `ec_posts`                     |            ✅ Có (`posts`)             |        9        | Bài viết hệ thống EmDash                                                                                                              |
| **`ec_memberships`**           |          ❌ **Chưa (Mồ côi)**          |        0        | **Cần đăng ký ở GĐ2a** bằng `registerOrphanedTable`                                                                                   |
| **`ec_lesson_progress`**       |          ❌ **Chưa (Mồ côi)**          |        0        | **Cần đăng ký ở GĐ2a** bằng `registerOrphanedTable`                                                                                   |
| **`ec_quiz_submissions`**      |          ❌ **Chưa (Mồ côi)**          |        0        | **Cần đăng ký ở GĐ2a** bằng `registerOrphanedTable`                                                                                   |
| **`ec_certificates`**          |          ❌ **Chưa (Mồ côi)**          |        0        | **Cần đăng ký ở GĐ2a** bằng `registerOrphanedTable`                                                                                   |
| **`ec_certificate_templates`** |          ❌ **Chưa (Mồ côi)**          |        0        | **Cần đăng ký ở GĐ2a** bằng `registerOrphanedTable`                                                                                   |

### 2.2 Các trường cần chuẩn hóa kiểu dữ liệu (L9)

Các trường sau đang lưu dạng `type = 'string'` kèm `options = '{"choices": [...]}'`. Khi chạy `setup/run` ở GĐ2a sẽ chuyển sang `type = 'select'` và `validation = '{"options": [...]}'`:

- `ec_membership_plans.billing_period`: `["monthly","quarterly","yearly","lifetime"]`
- `ec_courses.access_level`: `["free","membership","purchase"]`
- `ec_courses.difficulty`: `["beginner","intermediate","advanced"]`
- `ec_lessons.complexity`: `["easy","medium","hard"]`
- `ec_quizzes.grade_type`: `["auto","manual"]`
- `ec_questions.type`: `["single","multiple","text","fill_blank"]` (sẽ thêm `"chess"` ở GĐ3)
- `ec_coupons.applies_to`: `["all","membership","course"]`
- `ec_coupons.type`: `["percentage","fixed"]`
- `ec_orders.type`: `["membership","course"]`
- `ec_enrollments.source`: `["membership","purchase"]`

---

## 3. Bảng đối chiếu hiện trạng 12 lỗi (L1 – L12)

| Mã lỗi  | Mô tả                                                | Đối chiếu mã nguồn & Chạy thực tế                                                                                                                                                                   |     Hiện trạng      |
| :-----: | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----------------: |
| **L1**  | Handler nhận `(ctx, input)` thay vì 1 `RouteContext` | `src/routes/plans.ts:17` và toàn bộ các route trong `src/routes/*.ts` đều khai báo 2 tham số. EmDash core gọi với 1 tham số, khiến `input` là `undefined` và văng `TypeError`. Đã có baseline test. | **Xác nhận (Thấy)** |
| **L2**  | `admin.tsx` dùng `export default { pages }`          | `src/admin.tsx:229` chỉ có `export default`. EmDash core import dạng `import * as` và tìm `adminModule.pages`. Admin LMS không thể nạp. Đã có baseline test.                                        | **Xác nhận (Thấy)** |
| **L3**  | Route không khai `permission`                        | `src/index.ts:168-188` không khai báo `permission`, mặc định đòi quyền `plugins:manage`. Học viên đăng nhập (role Subscriber) bị chặn 403 Forbidden.                                                | **Xác nhận (Thấy)** |
| **L4**  | `access` nhận `userId` từ body                       | `src/routes/access.ts` đọc `userId` từ input payload thay vì `ctx.user.id`, gây nguy cơ lộ quyền/IDOR.                                                                                              | **Xác nhận (Thấy)** |
| **L5**  | SePay webhook bỏ qua xác thực khi thiếu secret       | `src/providers/sepay.ts` bỏ qua kiểm tra khi thiếu secret/HMAC bị vô hiệu hóa.                                                                                                                      | **Xác nhận (Thấy)** |
| **L6**  | Route `"webhook/:providerId"` có tham số URL         | `src/index.ts:184` dùng route có tham số `:providerId` vốn không được router của plugin hỗ trợ (gây 404).                                                                                           | **Xác nhận (Thấy)** |
| **L7**  | `/lesson/[slug]` không kiểm tra quyền                | `src/pages/lesson/[slug].astro` render nội dung bài học mà chưa kiểm tra thẻ thư viện/ghi danh của user.                                                                                            | **Xác nhận (Thấy)** |
| **L8**  | Route & trang tải toàn bộ bảng rồi lọc JS            | `src/routes/access.ts` và trang khóa học gọi `list()` toàn bộ rồi lọc bằng mảng Javascript.                                                                                                         | **Xác nhận (Thấy)** |
| **L9**  | `string` + `options.choices` thay vì `select`        | `_emdash_fields` chứa 10 trường lưu sai cấu trúc lựa chọn khiến Admin UI hiện ô nhập tự do.                                                                                                         | **Xác nhận (Thấy)** |
| **L10** | Capability dùng tên cũ, có `as any`                  | `src/index.ts:158` dùng `["read:content", "write:content", "read:users"]` và ép kiểu `as any`.                                                                                                      | **Xác nhận (Thấy)** |
| **L11** | 5 bảng `ec_*` mồ côi                                 | `ec_memberships`, `ec_lesson_progress`, `ec_quiz_submissions`, `ec_certificates`, `ec_certificate_templates` chưa có trong `_emdash_collections`.                                                   | **Xác nhận (Thấy)** |
| **L12** | Checkout gửi form POST tới route private             | `src/pages/checkout/[id].astro` gửi `<form method="POST">` thiếu header CSRF, thiếu format JSON và route private. Đã có baseline test.                                                              | **Xác nhận (Thấy)** |

---

## 4. Lệnh kiểm chứng và kết quả thực tế

```bash
# 1. Build toàn bộ repo
pnpm build
# Kết quả: Exit code 0 (Build thành công toàn bộ 70 workspace projects)

# 2. Chạy test registry-verification (unit + workerd)
pnpm --filter @emdash-cms/registry-verification test
# Kết quả: 8/8 test files passed (114 unit tests, 38 workerd tests passed)

# 3. Chạy test baseline lỗi LMS
pnpm --filter emdash-lms test
# Kết quả: 1 test file passed (3 expected fail cho L1, L2, L12)

# 4. Kiểm tra Typecheck demos
pnpm typecheck:demos
# Kết quả: 0 errors, 0 warnings, 0 hints trên toàn bộ các demo

pnpm --filter ./demos/cloudflare typecheck
# Kết quả: 0 errors (36 files diagnostics sạch)

# 5. Lint quick
pnpm lint:quick
# Kết quả: 0 errors
```

---

## 5. Tồn đọng & Ghi chú chuyển tiếp Giai đoạn 1 / 2a

1. **GĐ1 (Thư viện `@duongsinh/chess-kit`):**
   - Tạo mới package `packages/chess-kit` độc lập, cung cấp core logic (FEN/PGN/Notation/Puzzle/Progress/I18n) và React components bàn cờ cho toàn bộ hệ thống.
2. **GĐ2a (Ổn định LMS):**
   - Đã có đầy đủ cơ sở dữ liệu kiểm toán và bản sao lưu D1.
   - Sẽ chuyển các test trong `errors-baseline.test.ts` thành test chạy thật và pass.
   - Triển khai route `setup/run` tự động đăng ký 5 bảng mồ côi và chuẩn hóa các trường `select`.
   - **Lưu ý an toàn:** Không deploy giữa GĐ2a và GĐ2b.
