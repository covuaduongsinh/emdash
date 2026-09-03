
# Báo cáo Giai đoạn 2: Cài đặt và Seed Database

## Kết quả thực hiện
- Đã chạy \pnpm build\ tại gốc dự án để build toàn bộ packages, trong đó có CLI.
- Phát hiện việc \pnpm --filter emdash-demo seed\ không khả dụng (thiếu script trong package.json), nên đã trực tiếp chạy CLI bằng node: \
ode ../../packages/core/dist/cli/index.mjs seed seed/seed.json\.
- Quá trình seed đã diễn ra thành công:
  - Áp dụng 72 database migrations.
  - Tải và nạp 7 hình ảnh (media) từ Unsplash làm mẫu.
  - Tạo 2 Collections, 6 Fields, 9 Content items, và các Menus/Bylines mẫu.
- File cơ sở dữ liệu \data.db\ (~1.3MB) đã được tạo thành công tại \demos/simple/data.db\.

## Kết luận Giai đoạn 2
Cơ sở dữ liệu đã sẵn sàng với các dữ liệu mẫu thực tế. Có thể chuyển sang Giai đoạn 3: Khởi động Server.

