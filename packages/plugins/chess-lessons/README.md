# Plugin `chess-lessons` — Bài Học Cờ Vua & Bài Giảng Trình Chiếu

Plugin quản lý khung chương trình cờ vua 6 cấp độ Dương Sinh (Tốt &rarr; Vua), soạn thảo và trình chiếu bài giảng tương tác theo từng bước, khối Portable Text `chess-lecture`, bảo mật ghi chú Huấn Luyện Viên phía server, và công cụ nhập bài học tự động từ Obsidian Markdown.

Thuộc bộ giải pháp **Dương Sinh Chess Suite** cho hệ thống Cờ Vua Học Đường (`covuahocduong.com`).

---

## 1. Tính Năng Chính

1. **Khung Lộ Trình 6 Cấp Độ Chuẩn Dương Sinh**:
   - Tốt (Nhập môn) &rarr; Mã (Sơ cấp) &rarr; Tượng (Trung cấp) &rarr; Xe (Nâng cao) &rarr; Hậu (Chuyên sâu) &rarr; Vua (Kiện tướng).
   - Tự động bổ sung các trường `level`, `sessions`, `age_range` vào collection `courses` và `level`, `themes`, `objectives` vào `lessons`.
2. **Collection `chess_lectures` (`/bai-giang/{slug}`)**:
   - Quản lý kịch bản bài giảng trình chiếu tương tác nhiều bước (`steps`).
   - Widget `lecture-builder` hỗ trợ xếp thế cờ FEN, mũi tên minh họa (`arrows`), ô sáng (`highlights`), lời giảng cho học sinh và ghi chú sư phạm riêng cho HLV (`teacherNotes`).
3. **Chế Độ Trình Chiếu Toàn Màn Hình (`LecturePresenter`)**:
   - Hỗ trợ đầy đủ phím tắt: `PageUp` / `PageDown`, `←` / `→`, Phím `B` (tắt màn hình đen để học sinh tập trung), Đồng hồ đếm thời gian buổi học.
   - **Bảo Mật Phía Server (SSR):** Ghi chú HLV (`teacherNotes`) chỉ được gửi về trình duyệt khi người dùng đăng nhập có vai trò &ge; `contributor`. Khách vãng lai và học viên (`subscriber`) hoàn toàn không nhận được dữ liệu này.
4. **Khối Portable Text `chess-lecture`**:
   - Nhúng bài giảng tương tác trực tiếp vào bài học LMS.
   - Tự động snapshot dữ liệu qua hook `content:beforeSave` (0 query DB khi khách truy cập) và tự động loại bỏ trường `teacherNotes`.
   - Tích hợp giao thức `data-lms-requirement="lecture:<id>"`: Học viên hoàn thành tất cả các bước bài giảng sẽ tự động tính hoàn thành bài học.
5. **Trình Nhập Từ Obsidian Markdown (`/import-obsidian`)**:
   - Chuyển đổi file `.md` từ vault `OBSIDIAN2026` thành bài học LMS có cấu trúc và khối cờ vua tương tác.
   - Hỗ trợ các code fence `fen`, `pgn`, `puzzle`, `lecture`.
   - Tự động cảnh báo liên kết wikilink `![[...]]` và `[[...]]`.

---

## 2. Quy Ước Soạn Bài Obsidian Cho Vault `OBSIDIAN2026`

Để nhập bài học chính xác vào hệ thống, file Markdown cần có cấu trúc như sau:

```markdown
---
title: "Đòn Tấn Công Đôi Của Quân Mã"
course: "ma-so-cap" # Slug của khóa học
module: "Chiến thuật cơ bản" # Tên chương (tự động tạo nếu chưa có)
order: 1 # Thứ tự bài trong chương
level: "ma" # tot | ma | tuong | xe | hau | vua
themes: "fork, knight, tactics"
objectives: "Hiểu và thực hiện thành thạo đòn tấn công đôi bằng quân Mã"
---

## 1. Khởi Động

Trong cờ vua, quân Mã sở hữu khả năng di chuyển độc đáo hình chữ L...

## 2. Kiến Thức Mới

Quan sát thế cờ dưới đây:

\`\`\`fen
r1bqk2r/pppp1ppp/2n5/2b1p3/2B1P1n1/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5
orientation: white
arrows: g4f2,g4e3
highlights: f2,e3
caption: Mã đen nhắm vào f2
\`\`\`

## 3. Thực Hành

\`\`\`pgn
[Event "Dương Sinh Chess Sample"]
[Site "covuahocduong.com"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *
   \`\`\`

## 4. Kiểm Tra

\`\`\`puzzle
fen: r1bqk2r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5
solution: c4f7
prompt: Trắng đi nước nào để tấn công điểm yếu f7 của Đen?
hint: Hãy dùng quân Tượng tấn công vào ô f7
level: ma
\`\`\`
```

---

## 3. Cài Đặt & Cấu Hình

Thêm plugin vào `astro.config.mjs`:

```javascript
import { chessLessonsPlugin } from "@duongsinh/plugin-chess-lessons";

export default defineConfig({
	plugins: [
		// ... các plugin khác
		chessLessonsPlugin(),
	],
});
```

Truy cập Admin tại `/_emdash/admin/lessons` và nhấp nút **"Cài đặt CSDL (Setup)"** để đồng bộ cấu trúc bảng và trường dữ liệu.
