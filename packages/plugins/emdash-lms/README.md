# EmDash LMS — Plugin Học tập & Thẻ thư viện Cờ Vua Học Đường

Plugin Hệ thống Quản lý Học tập (LMS) dành cho [EmDash CMS](https://emdashcms.com) và dự án **Cờ Vua Học Đường** (covuahocduong.com).

## Tính năng chính

- **3 Chế độ hoạt động**: `membership` (Thẻ thư viện), `lms` (Khóa học độc lập), hoặc `full` (kết hợp).
- **Gói Thẻ thư viện**: Quản lý các gói thành viên theo tháng/quý/năm/trọn đời và phân quyền truy cập nội dung bài học.
- **Quản lý Khóa học & Bài học**: Hỗ trợ cây khóa học -> chương/mục -> bài học, bài tập tương tác bàn cờ (@duongsinh/chess-kit), và theo dõi tiến độ học tập 2 lớp (máy chủ + localStorage).
- **Giao thức Hoàn thành Bài học**: Tích hợp đếm yêu cầu bài tập qua `[data-lms-requirement]` và lắng nghe sự kiện `lms:requirement-done`.
- **Admin UI Tiếng Việt**: Xây dựng trên nền tảng React + Kumo Design System với các trang:
  - `Cài đặt LMS` (`/settings/setup`): Đồng bộ schema 16 collection, đăng ký bảng D1 mồ côi.
  - `Học viên` (`/students`): Theo dõi danh sách học viên, tiến độ hoàn thành, ghi danh thủ công.
  - `Cài đặt` (`/settings`): Tùy biến cấu hình chung hệ thống LMS.
- **Bảo mật & Phân quyền**:
  - Xác thực nghiêm ngặt bằng `ctx.user.id` cho toàn bộ thao tác học viên (chống IDOR).
  - Tối ưu hóa truy vấn trang công khai với `requestCached` (không phát sinh query thừa cho khách ẩn danh).

## Cấu hình (astro.config.mjs)

```typescript
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { lmsPlugin } from "emdash-lms";
import { lmsIntegration } from "emdash-lms/astro";

export default defineConfig({
	integrations: [
		emdash({
			plugins: [
				lmsPlugin({
					mode: "full",
					currency: "VND",
					checkout: false, // Bật tại GĐ2b khi kích hoạt thanh toán SePay
				}),
			],
		}),
		lmsIntegration(),
	],
});
```

## API Routes

Các endpoint được đăng ký tự động dưới `/_emdash/api/plugins/lms/`:

| Route               | Quyền            | Mô tả                                                        |
| ------------------- | ---------------- | ------------------------------------------------------------ |
| `setup/run`         | `schema:manage`  | Đồng bộ schema, đăng ký bảng mồ côi (idempotent)             |
| `me/access`         | `content:read`   | Kiểm tra quyền truy cập khóa học / bài học của user hiện tại |
| `me/enroll`         | `content:read`   | Tự ghi danh vào khóa học miễn phí                            |
| `me/progress`       | `content:read`   | Lấy danh sách bài đã học và tiến độ tổng quan                |
| `progress/complete` | `content:read`   | Đánh dấu hoàn thành bài học và tính lại % khóa học           |
| `progress/sync`     | `content:read`   | Đồng bộ tiến độ làm bài từ trình duyệt lên máy chủ           |
| `admin/students`    | `content:read`   | Quản lý học viên và ghi danh thủ công                        |
| `plans`             | `plugins:manage` | Quản lý gói thẻ thư viện                                     |
| `members`           | `plugins:manage` | Quản lý danh sách thành viên thẻ                             |
| `orders`            | `plugins:manage` | Quản lý đơn hàng (đang chuẩn bị cho GĐ2b)                    |

> **Lưu ý an toàn GĐ2a:** Endpoint checkout và webhook thanh toán được tạm ngưng và sẽ kích hoạt ở GĐ2b. Trang `/checkout/[id]` hiển thị thông báo bảo trì thanh toán.
