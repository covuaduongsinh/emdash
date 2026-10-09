# Báo Cáo Giai Đoạn 2b (GĐ2b): Tích Hợp Thanh Toán SePay VietQR Cho LMS

**Dự án:** Dương Sinh Chess Suite — Cờ Vua Học Đường (`covuahocduong.com`)  
**Mục tiêu:** Kích hoạt tự động Thẻ Thư Viện và Chuyên Đề Cờ Vua bằng chuyển khoản VietQR qua SePay, chống giả mạo, kiểm tra toàn vẹn số tiền, chống trùng lặp (idempotent), hỗ trợ xử lý thủ công và bảo vệ dữ liệu nhạy cảm.

---

## 1. Tài Liệu Chính Thức SePay (Webhooks & VietQR)

Đã nghiên cứu và đối chiếu theo tài liệu chính thức của SePay ([https://docs.sepay.vn](https://docs.sepay.vn) & [https://sepay.vn](https://sepay.vn)):

### 1.1. Cơ Chế Xác Thực Webhook
- **Phương thức xác thực:** API Key qua HTTP Header:
  ```http
  Authorization: Apikey <SEPAY_API_KEY>
  ```
  *(Hỗ trợ cả định dạng `Bearer <SEPAY_API_KEY>` hoặc header `x-sepay-api-key`).*
- **Xử lý bảo mật:** Plugin `emdash-lms` bắt buộc kiểm tra header này khớp với cấu hình `sepay_api_key` trong KV settings hoặc biến môi trường `SEPAY_API_KEY`. Nếu thiếu hoặc sai khóa, hệ thống từ chối ngay với mã `401 Unauthorized` (`PluginRouteError.unauthorized`).

### 1.2. Cấu Trúc Payload Giao Dịch
Khi có chuyển khoản ngân hàng, SePay gửi HTTP POST JSON:
```json
{
  "id": 92704,
  "gateway": "MB",
  "transactionDate": "2026-10-09 12:00:00",
  "accountNumber": "0987654321",
  "subAccount": "",
  "code": "SEVN63DC8E5C",
  "content": "LMS-7K9F2A8B thanh toan the thu vien",
  "transferType": "in",
  "description": "NGUYEN VAN A chuyen tien LMS-7K9F2A8B",
  "transferAmount": 500000,
  "accumulated": 105000000,
  "referenceCode": "FT26100912345"
}
```

### 1.3. Cấu Trúc Link Ảnh VietQR
Được tạo động theo chuẩn:
```text
https://qr.sepay.vn/img?acc={bankAccount}&bank={bankCode}&amount={amount}&des={orderCode}&template={template}
```
Trong đó:
- `bank`: Mã ngân hàng (`MB`, `VCB`, `ACB`, `ICB`, `TCB`...).
- `acc`: Số tài khoản nhận tiền.
- `amount`: Số tiền chính xác tính phía server.
- `des`: Mã đối soát duy nhất dạng `LMS-XXXXXXXX`.
- `template`: Mẫu hiển thị (`compact`, `qronly`, `standee`).

---

## 2. Các Công Việc Đã Thực Hiện

### 2.1. Mã Nguồn Cốt Lõi Thanh Toán & Webhook
- [`packages/plugins/emdash-lms/src/providers/sepay.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/providers/sepay.ts): Adapter SePay chính thức, bóc tách mã đơn `LMS-XXXXXXXX` qua regex chuẩn tĩnh, tạo URL VietQR và kiểm tra chữ ký/API Key.
- [`packages/plugins/emdash-lms/src/routes/checkout-create.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/checkout-create.ts): Route `checkout/create` (permission: `content:read`):
  - Bắt buộc đăng nhập (`ctx.user.id`).
  - Tính toán giá tiền VND hoàn toàn ở server (từ `sale_price` / `price` của gói thẻ hoặc khóa học).
  - Sinh mã đối soát duy nhất `LMS-XXXXXXXX` (loại bỏ ký tự dễ nhầm lẫn như 0, O, 1, I).
  - Tạo bản ghi đơn hàng `pending` trong `ec_orders` với thời hạn hết hạn (mặc định 24 giờ).
  - Trả về thông tin chuyển khoản và link VietQR.
- [`packages/plugins/emdash-lms/src/routes/me-orders-get.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/me-orders-get.ts): Route `me/orders/get` (permission: `content:read`):
  - Kiểm tra quyền sở hữu tuyệt đối (`order.data.user_id === ctx.user.id`), chống hoàn toàn lỗ hổng IDOR.
- [`packages/plugins/emdash-lms/src/routes/webhook-sepay.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/webhook-sepay.ts): Route `webhook/sepay` (`public: true`):
  - Xác thực header `Authorization: Apikey <KEY>`. Thiếu/sai trả về `401`.
  - Kiểm tra `transferType === "in"` và `transferAmount > 0`.
  - Trích xuất mã `LMS-XXXXXXXX` từ `content` / `description` / `code`.
  - Đối soát số tiền `transferAmount >= order.amount` (thiếu tiền không kích hoạt).
  - Kiểm tra tài khoản nhận nếu có cấu hình.
  - Kiểm tra thời hạn đơn hàng (đơn hết hạn tự chuyển `expired` và không kích hoạt).
  - **Idempotent:** Kiểm tra `sepay_transaction_id` hoặc trạng thái `completed`; nếu gửi lặp lại cùng giao dịch thì trả về `200` và không tạo thêm thẻ/ghi danh.
  - **Kích hoạt tự động:**
    - Gói thẻ thư viện: tạo bản ghi `ec_memberships` với `status: "active"` và tính hạn dùng (`monthly`: +1 tháng, `quarterly`: +3 tháng, `yearly`: +1 năm, `lifetime`: vĩnh viễn).
    - Khóa học: tạo bản ghi `ec_enrollments` với `source: "purchase"`, `progress: 0`.
    - Cập nhật đơn hàng sang `completed`, ghi nhận `paid_at`, `gateway`, `reference_code`.
  - Trường hợp không tìm thấy mã đơn: trả về `200` kèm thông điệp ghi log (theo khuyến nghị SePay để tránh gửi lại các giao dịch không liên quan).

### 2.2. Giao Diện Người Dùng Học Viên & Admin (Kumo)
- [`packages/plugins/emdash-lms/src/pages/plans.astro`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/pages/plans.astro): Trang Thẻ Thư Viện chuẩn hóa học đường, bỏ các huy hiệu giảm giá thương mại, hiển thị rõ gói định kỳ và nút đăng ký trỏ sang `/checkout/[slug]`.
- [`packages/plugins/emdash-lms/src/pages/checkout/[id].astro`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/pages/checkout/[id].astro):
  - Chưa đăng nhập: hiện thẻ hướng dẫn đăng nhập / đăng ký tài khoản học viên.
  - Đã đăng nhập: gọi `checkout/create` qua `apiFetch`, hiển thị ảnh VietQR + bảng thông tin tài khoản ngân hàng với nút chép nhanh (Copy), tự động thăm dò trạng thái qua `me/orders/get` mỗi 4 giây, tự động kích hoạt và chuyển hướng ngay khi thanh toán thành công.
- [`packages/plugins/emdash-lms/src/admin.tsx`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/admin.tsx):
  - Trang **Đơn hàng** (`/orders`): Danh sách đơn VietQR, lọc theo trạng thái, chức năng **Xác nhận tay** (modal nhập lý do kiểm toán dành cho đơn học viên chuyển sai cú pháp).
  - Trang **Thẻ thư viện** (`/plans`): Quản lý các gói thẻ thư viện.
  - Trang **Hội viên** (`/members`): Theo dõi các thẻ thư viện đang hoạt động.
  - Trang **Cài đặt thanh toán** (`/settings/payment`): Giao diện nhập mã ngân hàng, số tài khoản, tên chủ tài khoản, SePay API Key (trường password bảo mật), mẫu VietQR và thời gian hết hạn đơn hàng.

---

## 3. Đề Xuất Về Stripe
- Trong `demos/cloudflare/astro.config.mjs`, hiện có `providers: ["sepay", "stripe"]`.
- Do site `covuahocduong.com` phục vụ thị trường học đường trong nước sử dụng chuẩn chuyển khoản VietQR, hệ thống hiện tại **không đăng ký Stripe provider khi chưa cấu hình khóa Stripe**.
- **Đề xuất:** Xóa `"stripe"` khỏi cấu hình `demos/cloudflare/astro.config.mjs` để giao diện và luồng thanh toán gọn gàng, thuần VietQR SePay. *(Chờ Thầy Tường xác nhận trước khi sửa file demo)*.

---

## 4. Kết Quả Kiểm Chứng Thực Tế

| Lệnh kiểm chứng | Kết quả | Trạng thái |
| :--- | :--- | :---: |
| `pnpm --filter emdash-lms test` | **30 passed (4 test files, 100% pass)** | ✅ PASS |
| `pnpm --filter emdash-lms typecheck` | **tsgo --noEmit (Exit code 0)** | ✅ PASS |
| `pnpm typecheck:demos` | **6 demos (100% pass, 0 errors, 0 warnings)** | ✅ PASS |
| `pnpm --filter @emdash-cms/demo-cloudflare typecheck` | **36 files (0 errors, 0 warnings, 0 hints)** | ✅ PASS |
| `pnpm lint:quick` | **0 errors, 0 warnings trong emdash-lms** | ✅ PASS |

### Danh mục ca kiểm thử trong `payment-sepay.test.ts`:
1. `rejects webhook request when Authorization header is missing` (401 Unauthorized)
2. `rejects webhook request when Authorization key is invalid` (401 Unauthorized)
3. `accepts webhook request with valid Authorization header (Apikey or Bearer)` (200 + kích hoạt Membership)
4. `fulfills course purchase order by creating course enrollment` (200 + kích hoạt Course Enrollment)
5. `is idempotent: replaying the same webhook returns 200 without creating duplicate membership` (Chống lặp)
6. `does not activate when transfer amount is less than order amount (underpaid)` (Thiếu tiền không kích hoạt)
7. `does not activate when order is expired` (Đơn hết hạn không kích hoạt)
8. `returns 200 without error when order code is not found` (Chuẩn SePay)
9. `calculates amount server-side and creates pending order with VietQR parameters` (Tính giá server)
10. `rejects unauthenticated checkout creation` (401)
11. `allows student to fetch their own order` (200)
12. `strictly prevents accessing another user's order (IDOR protected)` (403 Forbidden)
13. `allows admin to manually confirm an order and fulfill membership` (Lưu vết kiểm toán)
14. `admin lists orders with status filter`
15. `can save and get payment configuration via KV`
16. `registers checkout/create, me/orders/get, webhook/sepay, and admin payment routes`

---

## 5. Runbook Triển Khai SePay Lên Production (Dành Cho Thầy Tường)

> [!IMPORTANT]
> Toàn bộ thông tin nhạy cảm (API Key SePay, Số tài khoản) không được lưu trong Git. Thầy tự thực hiện các bước sau trên Cloudflare Dashboard / Trang quản trị.

### Bước 1: Sao lưu cơ sở dữ liệu D1
Chạy lệnh sao lưu D1 trên máy tính hoặc Cloudflare Dashboard:
```bash
npx wrangler d1 export emdash_db --remote --output backup_pre_sepay.sql
```

### Bước 2: Cấu hình biến môi trường / Cài đặt thanh toán
Truy cập trang Quản trị EmDash tại `/_emdash/admin/settings/payment`:
1. **Mã ngân hàng:** Nhập mã ngân hàng của Thầy (ví dụ: `MB`, `VCB`, `ACB`...).
2. **Số tài khoản:** Nhập số tài khoản ngân hàng nhận tiền.
3. **Tên chủ tài khoản:** `CTY CP CO VUA DUONG SINH` (hoặc tên tài khoản của Thầy).
4. **SePay API Key:** Nhập API Key tạo từ SePay (dạng `SEPAY_...` hoặc chuỗi khóa bí mật).
5. Nhấn **"Lưu Cài Đặt Thanh Toán"**.

*(Hoặc cấu hình qua biến môi trường Worker / Secrets: `SEPAY_API_KEY`, `SEPAY_BANK_CODE`, `SEPAY_BANK_ACCOUNT`, `SEPAY_ACCOUNT_NAME`).*

### Bước 3: Đăng ký Webhook trên SePay
1. Đăng nhập vào [https://my.sepay.vn](https://my.sepay.vn).
2. Vào mục **Tích hợp Webhook** &rarr; **Thêm Webhook mới**.
3. Điền các thông tin:
   - **URL Webhook:** `https://covuahocduong.com/_emdash/api/plugins/lms/webhook/sepay`
   - **Phương thức:** `POST`
   - **Xác thực:** Chọn `API Key`
   - **API Key:** Điền đúng chuỗi khóa đã lưu ở Bước 2.
4. Lưu cấu hình Webhook.

### Bước 4: Kiểm thử giao dịch nhỏ
1. Mở trang `https://covuahocduong.com/plans` trên trình duyệt.
2. Đăng nhập tài khoản học viên thử nghiệm.
3. Chọn gói Thẻ thư viện hoặc một Chuyên đề cờ vua và bấm **"Đăng ký Thẻ Thư Viện"**.
4. Quét mã VietQR trên ứng dụng ngân hàng và chuyển khoản thử một số tiền nhỏ (hoặc bấm Test Webhook trên my.sepay.vn với đúng nội dung `LMS-XXXXXXXX`).
5. Quan sát màn hình chờ: trang sẽ tự động nhận diện giao dịch thành công trong vòng 4–8 giây và hiển thị thông báo kích hoạt thành công.
6. Vào trang `/_emdash/admin/orders` và `/_emdash/admin/members` để kiểm tra đơn hàng đã hoàn tất.

---

## 6. Ghi Chú Bàn Giao

- Plugin `emdash-lms` đã hoàn toàn ổn định cả về LMS Core (GĐ2a) lẫn Cổng thanh toán SePay VietQR (GĐ2b).
- Đã giải quyết triệt để 12 lỗi thiết kế ban đầu (L1 &rarr; L12).
- Toàn bộ test suite tự động 30/30 test pass, typecheck sạch ở cả package LMS và các demo.
- Sẵn sàng chuyển giao sang **GĐ3: Thư viện cờ vua `@duongsinh/chess-kit`** khi Thầy yêu cầu.
