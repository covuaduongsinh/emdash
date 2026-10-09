# @duongsinh/plugin-chess-puzzles

Plugin quản lý kho câu đố cờ vua, bộ giải câu đố chiến thuật tương tác, cơ chế snapshot không tốn query cơ sở dữ liệu và công cụ nhập hàng loạt (Lichess CSV, EPD, PGN) cho EmDash CMS.

Là một phần trong bộ **Dương Sinh Chess Suite** phục vụ `covuahocduong.com`.

---

## 1. Tính Năng Nổi Bật

- **Kho câu đố chuẩn 6 cấp độ:** Phân cấp độ cờ học Dương Sinh (`tot`, `ma`, `tuong`, `xe`, `hau`, `vua`) tương ứng theo hệ số Elo.
- **Bộ soạn câu đố (`puzzle-editor`):**
  - Bước 1: Xếp thế cờ ban đầu (`PositionEditor`).
  - Bước 2: Ghi lại dãy nước giải đố và nước đáp của bên phòng thủ (`MoveRecorder`).
  - Bước 3: Chạy thử tương tác trực tiếp (`PuzzlePlayer`).
- **Khối Portable Text `chess-puzzle`:**
  - Chọn nhanh câu đố từ ngân hàng (`puzzles/options`) hoặc nhập FEN & nước đi trực tiếp.
  - Tự động snapshot dữ liệu câu đố khi lưu bài viết qua hook `content:beforeSave` (trang bài học công khai của khách **0 query** DB).
- **Tích hợp LMS Requirement:**
  - Render thuộc tính `data-lms-requirement="puzzle:<id>"`.
  - Tự động phát sự kiện `lms:requirement-done` và `duongsinh-chess:puzzle-solved` khi học viên hoàn thành lời giải.
  - Lưu tiến độ học viên vào `@duongsinh/chess-kit/progress`.
- **Bộ nạp câu đố hàng loạt (`puzzles/import`):**
  - Nhập file Lichess CSV (tự động chuyển nước dẫn và ánh xạ Elo sang 6 cấp độ).
  - Nhập file chuẩn EPD (`bm <bestmove>`).
  - Nhập ván cờ PGN chứa tag `[FEN]`.
  - Báo lỗi chi tiết theo từng dòng.

---

## 2. Cài Đặt & Cấu Hình

Thêm plugin vào `live.config.ts` hoặc `astro.config.mjs`:

```typescript
import { chessPuzzlesPlugin } from "@duongsinh/plugin-chess-puzzles";

export default defineConfig({
	plugins: [
		chessPuzzlesPlugin({
			defaultOrientation: "auto",
			revealAfterFailures: 3,
			showRating: true,
		}),
	],
});
```

---

## 3. Khởi Tạo Cơ Sở Dữ Liệu

1. Truy cập giao diện quản trị Admin tại `/_emdash/admin/puzzles`.
2. Bấm nút **"Cài đặt CSDL (Setup)"** để đồng bộ bảng `ec_chess_puzzles` và các trường dữ liệu tương ứng.
