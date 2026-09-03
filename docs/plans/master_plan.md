## Goal Description
Tìm hiểu, giới thiệu chi tiết kiến trúc, các thành phần và cách vận hành dự án phần mềm EmDash (Astro-native CMS). Do đây là một hệ thống lớn (monorepo quản lý bằng pnpm, chứa nhiều packages, apps và demos), việc tìm hiểu và chạy thử sẽ được chia thành nhiều giai đoạn (phases). Mỗi giai đoạn sẽ được tài liệu hoá bằng các file markdown trong thư mục `docs/plans/` để theo dõi và bàn giao trạng thái, tránh quá tải ngữ cảnh (context window) hoặc quota.

## User Review Required
> [!IMPORTANT]
> Các file kế hoạch chi tiết của từng giai đoạn sẽ được lưu tại `docs/plans/`. Xin vui lòng xem qua chiến lược chia tách giai đoạn dưới đây. Nếu bạn đồng ý, tôi sẽ tự động triển khai lần lượt từng giai đoạn và báo cáo kết quả.

## Proposed Changes
Dự án sẽ không bị chỉnh sửa code cốt lõi, mà chủ yếu là tạo các file tài liệu kế hoạch, báo cáo, và chạy các script để khởi động dự án.

### Thư mục `docs/plans/`
Các file sau sẽ được tạo:
- `master_plan.md`: Kế hoạch tổng thể (chứa nội dung này).
- `phase_1_research.md`: Chi tiết giai đoạn 1 (Tìm hiểu kiến trúc).
- `phase_2_setup.md`: Chi tiết giai đoạn 2 (Cài đặt & Seed DB).
- `phase_3_run.md`: Chi tiết giai đoạn 3 (Chạy & Giới thiệu tính năng).

### Giai đoạn 1: Khảo sát Kiến trúc và Cấu trúc dự án
- Đọc sâu cấu trúc `packages/`, `apps/`, `demos/`.
- Tìm hiểu các công nghệ lõi: Astro, Cloudflare D1/R2/Workers, Kysely, Portable Text.
- Viết báo cáo `docs/plans/report_phase_1.md`.
- **Bàn giao (Handover):** Nếu ngữ cảnh đầy, sẽ tạo file handover để chuyển sang lượt tiếp theo.

### Giai đoạn 2: Chuẩn bị Môi trường và Seed Dữ liệu
- Sử dụng demo có sẵn (`demos/simple`, tên package là `emdash-demo`).
- Chạy lệnh `pnpm --filter emdash-demo seed` để khởi tạo database SQLite nội bộ và nạp dữ liệu mẫu.
- Kiểm tra các lỗi phát sinh trong quá trình seed và xử lý.
- Viết báo cáo `docs/plans/report_phase_2.md`.

### Giai đoạn 3: Khởi động và Giới thiệu Chức năng
- Khởi động server phát triển bằng lệnh `pnpm --filter emdash-demo dev`.
- Mở server ở background, ping kiểm tra các endpoints chính (ví dụ: `/_emdash/admin`).
- Giới thiệu cách sử dụng giao diện Admin, CLI tools, và khái niệm Plugin Sandbox.
- Viết báo cáo `docs/plans/report_phase_3.md`.

## Verification Plan

### Automated Tests
Sẽ không chạy automated tests của toàn bộ repo vì mục tiêu là chạy ứng dụng, nhưng sẽ kiểm tra tính sẵn sàng của demo:
```bash
pnpm --filter emdash-demo typecheck
```

### Manual Verification
- Bạn (user) có thể truy cập `http://localhost:4321/_emdash/admin` sau khi giai đoạn 3 hoàn tất để tự trải nghiệm phần mềm.
