# Thông báo bản quyền và nguồn gốc mã nguồn (NOTICE)

Package này (`emdash-lms`) là bản fork nội bộ của **Dương Sinh** phục vụ dự án **Cờ Vua Học Đường** (covuahocduong.com).

- **Nguồn gốc:** [tohaitrieu/emdash-lms](https://github.com/tohaitrieu/emdash-lms) @ commit `5ce68d1`
- **Tác giả gốc:** Tô Triều (<hello@totrieu.com>)
- **Giấy phép:** MIT License

## Thay đổi so với bản gốc (tính đến commit d7b6e5d)

1. **Định dạng mã nguồn:** Chuẩn hóa thụt lề tab theo quy ước repo EmDash.
2. **Bản địa hóa tiếng Việt:** Việt hóa các chuỗi hiển thị trên trang bài học (`/lesson/[slug]`) và trang checkout (`/checkout/[id]`).
3. **Mở rộng thanh toán và tiền tệ:**
   - Hỗ trợ thanh toán đơn hàng khóa học lẻ bên cạnh gói hội viên.
   - Hỗ trợ đơn vị tiền tệ VND và cấu hình tích hợp cổng chuyển khoản tự động SePay.
4. **Tương thích môi trường Windows:** Sửa đường dẫn import/tích hợp trong `src/integration.ts`.
5. **Cấu hình package:** Đặt `"private": true`, hỗ trợ test bằng Vitest và trỏ exports trực tiếp tới `src/`.
