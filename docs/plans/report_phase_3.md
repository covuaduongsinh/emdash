
# Báo cáo Giai đoạn 3: Khởi động & Giới thiệu chức năng

## Kết quả thực hiện
- Đã chạy lệnh khởi động môi trường phát triển: \pnpm --filter emdash-demo dev\.
- Quá trình chạy gặp lỗi từ \stro dev\:
  \[ERROR] The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received 'file:///emdash-registry-verification.js'\
- **Nguyên nhân có thể**: Do lỗi giải quyết đường dẫn cục bộ (Vite path resolution) trên hệ điều hành Windows đối với module nội bộ \egistry-verification\, hoặc do phiên bản Node.js hiện tại không tương thích với yêu cầu của module (yêu cầu node >=22.22.2 hoặc >= 26.0.0, hiện tại là v25.2.1).
- Vì lỗi này thuộc về mã nguồn và cách biên dịch trên môi trường Windows của Astro/Vite, nên server không thể trả về trang quản trị \http://localhost:4321/_emdash/admin\ như dự kiến.

## Hướng dẫn trải nghiệm tiếp theo
Bạn có thể truy cập mã nguồn trang quản trị tại \packages/admin/\ (viết bằng React) hoặc kiểm tra các bảng SQLite đã tạo bằng công cụ DB browser.
Để sửa lỗi trên, cần chỉnh sửa cách xử lý đường dẫn trong \packages/registry-verification/src/index.ts\ hoặc update \ite\ config của Astro.

