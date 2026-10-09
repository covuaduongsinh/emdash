# @duongsinh/chess-kit

Thư viện cốt lõi cho dự án **Cờ Vua Học Đường** (covuahocduong.com / Công ty CP Cờ vua Dương Sinh).

## Cấu trúc module

- `@duongsinh/chess-kit/core`: Xử lý logic cờ vua không phụ thuộc DOM (FEN, PGN, ký hiệu Việt/Quốc tế, mũi tên/ô cờ, chấm điểm câu đố, hệ thống 6 cấp độ Tốt → Vua, chủ đề chiến thuật). Hoạt động tốt trên Cloudflare Workers / Node / Trình duyệt.
- `@duongsinh/chess-kit/react`: Các UI components React (`Board`, `PgnViewer`, `PositionEditor`, `MoveRecorder`, `PuzzlePlayer`, `LecturePlayer`) xây dựng trên `react-chessboard` và `chess.js`.
- `@duongsinh/chess-kit/progress`: Quản lý tiến độ học tập (câu đố, bài giảng, bài học) lưu trữ tại `localStorage` kèm cơ chế `drainForSync()` để đồng bộ tài khoản máy chủ.
- `@duongsinh/chess-kit/i18n`: Từ điển song ngữ Việt - Anh hỗ trợ thuật ngữ cờ vua.
- `@duongsinh/chess-kit/theme.css`: Bảng màu chuẩn nhận diện Dương Sinh (Navy `#2B3990`, Gold `#F5A623`, font Roboto).

## 6 Cấp độ Cờ vua

1. **Cấp Tốt (Khởi đầu):** Làm quen bàn cờ, cách đi và ăn quân.
2. **Cấp Mã (Nhập môn):** Các đòn chiến thuật cơ bản (bắt đôi, chiếu bắt quân).
3. **Cấp Tượng (Trung cấp):** Đòn gián tiếp (ghim quân, đòn mở).
4. **Cấp Xe (Tiên tiến):** Chiếm cột mở, hàng ngang 7, tàn cuộc cơ bản.
5. **Cấp Hậu (Chuyên sâu):** Tấn công vua, phối hợp trung cuộc.
6. **Cấp Vua (Bậc thầy):** Kỹ thuật tàn cuộc sâu sắc, chiến lược toàn diện.
