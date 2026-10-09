# EmDash LMS — Plugin Học tập & Thẻ thư viện Cờ Vua Học Đường

Plugin Hệ thống Quản lý Học tập (LMS) dành cho [EmDash CMS](https://emdashcms.com) và dự án **Cờ Vua Học Đường** (covuahocduong.com).

## Tính năng chính

- **3 Chế độ hoạt động**: `membership` (Thẻ thư viện), `lms` (Khóa học độc lập), hoặc `full` (kết hợp).
- **Gói Thẻ thư viện & Thanh toán SePay VietQR**: Kích hoạt tự động Thẻ thư viện hoặc Khóa học bằng chuyển khoản VietQR tự động qua SePay, chống replay, đối soát số tiền chuẩn xác, hỗ trợ xác nhận tay.
- **Quản lý Khóa học & Bài học**: Hỗ trợ cây khóa học -> chương/mục -> bài học, bài tập tương tác bàn cờ (@duongsinh/chess-kit), và theo dõi tiến độ học tập 2 lớp (máy chủ + localStorage).
- **Hệ thống Soạn Quiz & Câu hỏi Cờ vua (GĐ3)**:
  - 4 loại câu hỏi: Trắc nghiệm đơn (`single`), Trắc nghiệm nhiều (`multiple`), Tự luận/Điền từ (`text`), Thế cờ / Bài tập cờ vua (`chess`).
  - Soạn câu hỏi cờ trực quan với `PositionEditor` (xếp cờ FEN) và `MoveRecorder` (kéo cờ ghi nhận chuỗi nước đi UCI).
  - Tự động bóc tách và ẩn toàn bộ đáp án/lời giải phía server (`quiz/present`).
  - Chấm điểm server-side (`quiz/submit`, `me/quiz/submit`) bằng `gradeChessAnswer` từ `@duongsinh/chess-kit/core`.
  - Khối Portable Text `lms-quiz` và React island `QuizRunner` đếm ngược timer, phát sự kiện `lms:requirement-done` khi đạt điểm qua bài.
- **Admin UI Tiếng Việt**: Xây dựng trên nền tảng React + Kumo Design System với các trang:
  - `Soạn Quiz` (`/quizzes`): Quản lý danh sách quiz, soạn câu hỏi trắc nghiệm và câu hỏi cờ.
  - `Đơn hàng` (`/orders`): Quản lý và đối soát đơn hàng VietQR SePay.
  - `Học viên` (`/students`): Theo dõi danh sách học viên, tiến độ hoàn thành, ghi danh thủ công.
  - `Cài đặt thanh toán` (`/settings/payment`): Cấu hình SePay API Key, STK ngân hàng, mẫu VietQR.
  - `Cài đặt LMS` (`/settings/setup`): Đồng bộ schema 16 collection, đăng ký bảng D1 mồ côi.
  - `Cài đặt` (`/settings`): Tùy biến cấu hình chung hệ thống LMS.

## API Routes

Các endpoint được đăng ký tự động dưới `/_emdash/api/plugins/lms/`:

| Route                    | Quyền              | Mô tả                                                        |
| ------------------------ | ------------------ | ------------------------------------------------------------ |
| `setup/run`              | `schema:manage`    | Đồng bộ schema, đăng ký bảng mồ côi (idempotent)             |
| `me/access`              | `content:read`     | Kiểm tra quyền truy cập khóa học / bài học của user hiện tại |
| `me/enroll`              | `content:read`     | Tự ghi danh vào khóa học miễn phí                            |
| `me/progress`            | `content:read`     | Lấy danh sách bài đã học và tiến độ tổng quan                |
| `progress/complete`      | `content:read`     | Đánh dấu hoàn thành bài học và tính lại % khóa học           |
| `progress/sync`          | `content:read`     | Đồng bộ tiến độ làm bài từ trình duyệt lên máy chủ           |
| `checkout/create`        | `content:read`     | Tạo đơn hàng VietQR SePay và sinh mã thanh toán định danh    |
| `webhook/sepay`          | `public: true`     | Nhận webhook từ SePay để tự động kích hoạt đơn hàng & thẻ    |
| `me/orders/get`          | `content:read`     | Thăm dò trạng thái thanh toán của học viên                   |
| `quiz/present`           | `public: true`     | Tải đề thi trắc nghiệm & câu hỏi cờ (đã bóc tách lời giải)   |
| `quiz/submit`            | `public: true`     | Nộp bài & chấm điểm server-side cho khách vãng lai           |
| `me/quiz/submit`         | `content:read`     | Nộp bài & chấm điểm cho học viên, lưu `quiz_submissions`     |
| `admin/quiz/*`           | `content:edit_any` | CRUD Quiz, câu hỏi, đổi thứ tự câu hỏi                       |
| `admin/quiz/options`     | `content:read`     | Danh sách Quiz phục vụ chọn trong khối bài học               |
| `admin/students`         | `content:read`     | Quản lý học viên và ghi danh thủ công                        |
| `admin/orders`           | `plugins:manage`   | Quản lý danh sách đơn hàng & xác nhận đơn thủ công           |
| `admin/settings/payment` | `plugins:manage`   | Cấu hình tham số cổng thanh toán SePay                       |
