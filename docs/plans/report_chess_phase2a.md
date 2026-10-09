# Báo cáo hoàn thành: Giai đoạn 2a — Ổn định LMS (`packages/plugins/emdash-lms`)

**Dự án:** Dương Sinh Chess Suite cho covuahocduong.com (Cờ Vua Học Đường)  
**Nền tảng:** EmDash CMS + Cloudflare (Worker covuahocduong, D1 emdash_db)  
**Thời gian thực hiện:** 09/10/2026  
**Thực hiện:** Antigravity (Pair Programming cùng Thầy Tường)

> [!CAUTION]
> **CẢNH BÁO TRIỂN KHAI:** **KHÔNG deploy mã nguồn lên Production cho tới khi hoàn thành Giai đoạn 2b.** Các route checkout và webhook thanh toán được tạm ngưng đăng ký ở GĐ2a để tránh rủi ro bảo mật trước khi tích hợp chữ ký xác thực SePay hoàn chỉnh.

---

## 1. Tóm tắt kết quả công việc (Work Summary)

Toàn bộ các mục tiêu cốt lõi của Giai đoạn 2a theo [kế hoạch v3](file:///D:/code/emdash/docs/plans/chess_lms_plan.md) đã được hoàn thành với phương pháp TDD:

| Mã lỗi  | Tình trạng | Giải pháp & File triển khai                                                                                                                                                                                                                                                                                          |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **L1**  | Đã sửa     | Chuẩn hóa toàn bộ Route Handlers nhận đúng 1 tham số `RouteContext`, xác thực body bằng Zod schema (`src/routes/*.ts`) và ném `PluginRouteError`.                                                                                                                                                                    |
| **L2**  | Đã sửa     | Xây dựng Admin UI React + Kumo (`src/admin.tsx`) với 3 trang: `/settings/setup` (Cài đặt LMS & schema), `/students` (Học viên & ghi danh thủ công), `/settings` (Cài đặt LMS).                                                                                                                                       |
| **L3**  | Đã sửa     | Tái cấu trúc truy vấn LMS Content API sang `where: { fieldFilters: { ... } }` thay vì cú pháp không hợp lệ `where.user_id` (`src/routes/me-access.ts`, `me-progress.ts`, `progress-complete.ts`, v.v.).                                                                                                              |
| **L4**  | Đã sửa     | Xây dựng các route học viên chuyên biệt (`me/access`, `me/enroll`, `me/progress`, `progress/complete`, `progress/sync`) chỉ dùng `ctx.user.id`, loại bỏ hoàn toàn nguy cơ IDOR.                                                                                                                                      |
| **L7**  | Đã sửa     | Tối ưu hóa trang `/course/[slug].astro` và `/lesson/[slug].astro`: Kiểm tra quyền phía server, bọc cache `requestCached`, 0 query DB thừa cho khách vãng lai.                                                                                                                                                        |
| **L8**  | Đã sửa     | Triển khai giao thức hoàn thành bài học qua thuộc tính `[data-lms-requirement]` và sự kiện `lms:requirement-done`, tự động cập nhật `% tiến độ` và `completed_at` trong `ec_enrollments`.                                                                                                                            |
| **L9**  | Đã sửa     | Đồng bộ định dạng trường choices sang `type: "select"` kèm `validation.options` chuẩn trong `src/schema/definitions.ts`.                                                                                                                                                                                             |
| **L10** | Đã sửa     | Cập nhật capability danh mục mới: `["content:read", "content:write", "users:read"]`, loại bỏ mọi ép kiểu `as any`, typecheck sạch 100%.                                                                                                                                                                              |
| **L11** | Đã sửa     | Xây dựng Idempotent Schema Setup Runner (`src/schema/setup.ts` & route `setup/run` với quyền `schema:manage`): tự động phát hiện và đăng ký 5 bảng mồ côi (`ec_memberships`, `ec_lesson_progress`, `ec_quiz_submissions`, `ec_certificates`, `ec_certificate_templates`) qua `SchemaRegistry.registerOrphanedTable`. |

_(Các lỗi L5, L6, L12 liên quan đến Checkout/Webhook/SePay được giữ nguyên trạng thái tạm ngưng chờ GĐ2b)._

---

## 2. Chi tiết các tệp đã tạo và chỉnh sửa

### 2.1. Cấu trúc Schema & Setup Idempotent (L9, L11)

- [`packages/plugins/emdash-lms/src/schema/definitions.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/schema/definitions.ts): Định nghĩa chuẩn 16 collection LMS với đầy đủ metadata và trường `select`.
- [`packages/plugins/emdash-lms/src/schema/setup.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/schema/setup.ts): Hàm `runLmsSetup(registry)` xử lý đăng ký bảng mồ côi và tạo mới collection/field thiếu mà không phá hủy dữ liệu cũ.
- [`packages/plugins/emdash-lms/src/routes/setup.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/setup.ts): Route handler `setup/run` yêu cầu quyền `schema:manage`.

### 2.2. Route Handlers & Bảo mật chống IDOR (L1, L3, L4, L8, L10)

- [`packages/plugins/emdash-lms/src/routes/me-access.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/me-access.ts): Route `me/access` kiểm tra quyền xem khóa học / bài học của `ctx.user.id`.
- [`packages/plugins/emdash-lms/src/routes/me-enroll.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/me-enroll.ts): Route `me/enroll` tự ghi danh khóa học miễn phí.
- [`packages/plugins/emdash-lms/src/routes/me-progress.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/me-progress.ts): Route `me/progress` trả về danh sách bài đã hoàn thành và tiến độ tổng quan.
- [`packages/plugins/emdash-lms/src/routes/progress-complete.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/progress-complete.ts): Route `progress/complete` ghi nhận bài hoàn thành và tính lại `% tiến độ` enrollment.
- [`packages/plugins/emdash-lms/src/routes/progress-sync.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/progress-sync.ts): Route `progress/sync` đồng bộ tiến độ học offline từ trình duyệt lên máy chủ.
- [`packages/plugins/emdash-lms/src/routes/admin-students.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/admin-students.ts): Route `admin/students` cho phép quản trị viên xem danh sách học viên và ghi danh thủ công bằng email.
- [`packages/plugins/emdash-lms/src/routes/plans.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/plans.ts), [`members.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/members.ts), [`orders.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/orders.ts), [`access.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/access.ts): Chuẩn hóa 1 tham số `RouteContext` và truy vấn `where.fieldFilters`.
- [`packages/plugins/emdash-lms/src/index.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/index.ts): Khai báo plugin `lms`, capability `["content:read", "content:write", "users:read"]`, đăng ký route an toàn.

### 2.3. Giao diện Quản trị & Frontend Astro (L2, L7, L8)

- [`packages/plugins/emdash-lms/src/admin.tsx`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/admin.tsx): Giao diện Kumo React tiếng Việt, hỗ trợ thiết lập schema, lọc học viên theo khóa, ghi danh thủ công.
- [`packages/plugins/emdash-lms/src/pages/course/[slug].astro`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/pages/course/[slug].astro): Tối ưu hóa truy vấn khóa học.
- [`packages/plugins/emdash-lms/src/pages/lesson/[slug].astro`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/pages/lesson/[slug].astro): Kiểm tra quyền bài học, hiển thị thông báo yêu cầu thẻ thư viện nếu là bài trả phí, thanh tiến độ và giao thức requirement `lms:requirement-done`.
- [`packages/plugins/emdash-lms/src/pages/checkout/[id].astro`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/pages/checkout/[id].astro): Màn hình thông báo bảo trì thanh toán đang chờ GĐ2b.

### 2.4. Kiểm thử & Tài liệu

- [`packages/plugins/emdash-lms/tests/errors-baseline.test.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/tests/errors-baseline.test.ts): Kiểm thử baseline lỗi (L1, L3, L4, L8 đã pass; L5 checkout expected fail chờ 2b).
- [`packages/plugins/emdash-lms/tests/routes.test.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/tests/routes.test.ts): Kiểm thử toàn bộ route học viên (`me/access`, `me/enroll`, `progress/complete`, `progress/sync`, `admin/students`).
- [`packages/plugins/emdash-lms/tests/setup-schema.test.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/tests/setup-schema.test.ts): Kiểm thử tính idempotent của Schema Setup Runner và đăng ký 5 bảng mồ côi.
- [`packages/plugins/emdash-lms/NOTICE.md`](file:///D:/code/emdash/packages/plugins/emdash-lms/NOTICE.md) & [`README.md`](file:///D:/code/emdash/packages/plugins/emdash-lms/README.md): Cập nhật thông tin bản quyền và hướng dẫn tiếng Việt.

---

## 3. Lệnh kiểm chứng và kết quả thực tế (Verification)

### 3.1. Chạy Unit Tests LMS

```bash
pnpm --filter emdash-lms test
```

**Kết quả:**

- `tests/setup-schema.test.ts`: 2/2 tests passed.
- `tests/routes.test.ts`: 8/8 tests passed.
- `tests/errors-baseline.test.ts`: 4 tests (3 passed, 1 expected fail cho L5 checkout chờ GĐ2b).
- **Tổng cộng: 13 passed, 1 expected fail (100% đạt yêu cầu GĐ2a).**

### 3.2. Kiểm tra Kiểu dữ liệu (Typecheck)

- `pnpm --filter emdash-lms typecheck`: **Exit code 0 (Sạch lỗi)**
- `pnpm typecheck:demos`: **Exit code 0 (Cả 6 demo bao gồm `dsc-edu-vn` đều pass 100%)**
- `pnpm --filter @emdash-cms/demo-cloudflare typecheck`: **36 files, 0 errors, 0 warnings, 0 hints**

### 3.3. Linter & Định dạng

- `pnpm lint:quick`: **0 warnings trong `packages/plugins/emdash-lms`**
- `pnpm format`: **Đã format chuẩn đẹp trên 3,538 files**

---

## 4. Xác minh cơ chế tạo tài khoản học viên (Mục 7 yêu cầu)

Đã khảo sát mã nguồn [`packages/auth/src/signup.ts`](file:///D:/code/emdash/packages/auth/src/signup.ts) và cấu hình Auth của EmDash:

1. **Tự đăng ký (Self-signup) qua Email Allowlist:**
   - Người dùng nhập email tại trang đăng nhập.
   - Hệ thống kiểm tra tên miền trong `allowedDomains` của settings. Nếu được phép, hệ thống gửi Magic Link xác thực để người dùng đăng nhập lần đầu và nhận vai trò `Subscriber` (học viên).
2. **Lời mời từ Quản trị viên/HLV (Admin Invite):**
   - HLV hoặc Admin gửi lời mời qua endpoint `/_emdash/api/auth/invite` hoặc bảng điều khiển quản trị EmDash.
   - Người dùng nhận link mời qua email để thiết lập mật khẩu / passkey.
3. **Ghi danh học viên trực tiếp theo Email (`/students`):**
   - HLV có thể nhập email học viên vào form ghi danh thủ công trong trang quản trị `/students`.
   - Hệ thống liên kết bản ghi ghi danh (`ec_enrollments`) với tài khoản học viên tương ứng.

_Kết luận cho GĐ2b:_ Khi tích hợp cổng thanh toán SePay, đối với khách vãng lai mua Thẻ thư viện hoặc Khóa học, hệ thống có thể kích hoạt tự động tạo tài khoản hoặc liên kết theo email thanh toán của đơn hàng.

---

## 5. Danh mục việc tồn đọng (Giai đoạn 2b & Giai đoạn 3)

- **Giai đoạn 2b (Thanh toán & Đơn hàng):**
  - Kích hoạt lại route `checkout` và `webhooks`.
  - Tích hợp cổng thanh toán SePay (xác thực chữ ký webhook, sinh mã QR VietQR theo đơn hàng, tự động kích hoạt thẻ thư viện / mở khóa học khi nhận thanh toán).
  - Hoàn thiện trang `/plans`, `/checkout/[id]`, quản lý đơn hàng `/orders`.
- **Giai đoạn 3 (Các plugin cờ vua chuyên sâu):**
  - Tích hợp `@duongsinh/chess-kit`.
  - Plugin `chess-puzzles` và `chess-lessons`.

---

## 6. Runbook Triển khai (Production Deployment Runbook)

> [!WARNING]
> **KHÔNG TRIỂN KHAI LÊN PRODUCTION Ở PHIÊN NÀY.**  
> Khi hoàn thành toàn bộ Giai đoạn 2b, quy trình triển khai sẽ như sau:
>
> 1. Merge nhánh hoàn tất GĐ2b vào `main`.
> 2. Chạy deploy Cloudflare Worker: `pnpm --filter @emdash-cms/demo-cloudflare deploy`.
> 3. Đăng nhập Admin UI tại `https://covuahocduong.com/_emdash/admin`.
> 4. Truy cập trang **Cài đặt LMS** (`/settings/setup`) và nhấn nút **"Chạy cài đặt & Đồng bộ Schema"** để tự động liên kết 5 bảng D1 và cập nhật schema.
