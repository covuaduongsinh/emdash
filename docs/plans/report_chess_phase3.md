# Báo Cáo Giai Đoạn 3 (GĐ3): Quiz Có Câu Hỏi Cờ Vua Cho LMS

**Dự án:** Dương Sinh Chess Suite — Cờ Vua Học Đường (`covuahocduong.com`)  
**Mục tiêu:** Mở rộng hệ thống Quiz của `emdash-lms` hỗ trợ 4 loại câu hỏi (Trắc nghiệm đơn, Trắc nghiệm nhiều, Tự luận/Điền từ, Câu cờ vua tương tác), bóc tách an toàn lời giải phía server (`quiz/present`), chấm điểm cờ vua chuẩn xác phía server (`quiz/submit`), trang quản trị Kumo trực quan cho phép xếp cờ/đi nước lời giải, khối Portable Text `lms-quiz` và component `QuizRunner` tương tác có timer và sự kiện `lms:requirement-done`.

---

## 1. Các Công Việc Đã Thực Hiện

### 1.1. Mở Rộng Schema & Định Nghĩa Type (Additive & Tương Thích Ngược)

- [`packages/plugins/emdash-lms/src/types.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/types.ts):
  - Cập nhật kiểu `QuestionType` hỗ trợ: `"single" | "multiple" | "text" | "fill_blank" | "chess"`.
  - Định nghĩa interface `ChessQuestionAnswers`:
    ```ts
    export interface ChessQuestionAnswers {
    	fen: string;
    	solution: string[]; // Các nước đi đúng theo định dạng UCI (ví dụ: ["e2e4", "e7e5"])
    	orientation?: "white" | "black";
    	prompt?: string;
    }
    ```
- [`packages/plugins/emdash-lms/src/schema/definitions.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/schema/definitions.ts):
  - Bổ sung `"chess"` vào `validation.options` của trường `type` trong collection `questions`.
  - Bảo toàn 100% các trường dữ liệu và collection hiện hữu.

### 1.2. Routes Quản Trị Soạn Quiz & Câu Hỏi (Admin API)

- [`packages/plugins/emdash-lms/src/routes/admin-quiz.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/admin-quiz.ts):
  - `admin/quiz/list` (`content:read`): Lấy danh sách quiz, đếm tổng số câu hỏi theo từng quiz.
  - `admin/quiz/get` (`content:read`): Lấy chi tiết quiz và toàn bộ danh sách câu hỏi đã sắp xếp thứ tự `sort_order`.
  - `admin/quiz/save` (`content:edit_any`): Tạo mới hoặc cập nhật quiz (tiêu đề, bài học liên kết, mô tả, passmark, timer, allow_reset, random_order).
  - `admin/quiz/delete` (`content:edit_any`): Xóa quiz và tự động dọn dẹp toàn bộ các câu hỏi thuộc quiz đó.
  - `admin/quiz/options` (`content:read`): Lấy danh sách quiz rút gọn phục vụ dropdown/combobox trong trình soạn bài học.
  - `admin/question/save` (`content:edit_any`): Tạo mới hoặc cập nhật câu hỏi (hỗ trợ lưu FEN, orientation, prompt, mảng nước đi lời giải UCI).
  - `admin/question/delete` (`content:edit_any`): Xóa câu hỏi.
  - `admin/question/reorder` (`content:edit_any`): Đổi thứ tự hiển thị của các câu hỏi trong quiz theo mảng `questionIds`.

### 1.3. Routes Phục Vụ Học Viên & Chấm Điểm Server-Side

- [`packages/plugins/emdash-lms/src/routes/quiz-present.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/quiz-present.ts):
  - Route `quiz/present` (`public: true`):
    - Trả về cấu trúc đề thi cho client.
    - **Bóc tách an toàn:** Ẩn hoàn toàn trường `is_correct` của trắc nghiệm, ẩn đáp án tự luận, ẩn hoàn toàn mảng `solution` của câu hỏi cờ (chỉ gửi `fen`, `orientation`, `prompt`), và ẩn `explanation` trước khi nộp bài.
    - Hỗ trợ xáo trộn thứ tự câu hỏi và thứ tự đáp án nếu quiz bật `random_order`.
- [`packages/plugins/emdash-lms/src/routes/quiz-submit.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/routes/quiz-submit.ts):
  - Route `quiz/submit` (`public: true`) và `me/quiz/submit` (xác thực học viên nghiêm ngặt qua `ctx.user.id`):
    - Tính thời gian làm bài thực tế từ `startedAt` đến thời điểm nộp, đối chiếu với `timer_minutes`.
    - Chấm điểm server-side:
      - Trắc nghiệm đơn/nhiều (`single`/`multiple`): Kiểm tra danh sách ID đáp án được chọn khớp với đáp án đúng `is_correct`.
      - Tự luận / Điền từ (`text`/`fill_blank`): Chuẩn hóa chữ thường và so khớp với đáp án đúng.
      - **Câu hỏi cờ vua (`chess`)**: Gọi hàm `gradeChessAnswer` từ `@duongsinh/chess-kit/core` để đối chiếu chuỗi nước đi học viên thực hiện với `solution` chuẩn UCI.
    - Trả về kết quả chi tiết kèm điểm từng câu, tỷ lệ %, trạng thái đạt (`passed`), và lời giải thích `explanation`.
    - Đối với `me/quiz/submit`, lưu kết quả vào collection `quiz_submissions` và cập nhật lịch sử làm bài của học viên.

### 1.4. Giao Diện Quản Trị "Soạn Quiz" (Kumo Design System)

- [`packages/plugins/emdash-lms/src/admin.tsx`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/admin.tsx):
  - Thêm menu và route Quản trị `/quizzes` ("Soạn Quiz").
  - Giao diện danh sách Quiz, modal tạo/sửa Quiz, và màn hình quản lý câu hỏi trong Quiz.
  - Hỗ trợ đầy đủ 4 loại câu hỏi:
    - Trắc nghiệm: thêm bớt đáp án, chọn đáp án đúng với checkbox/radio, giải thích kết quả.
    - Tự luận: nhập đáp án chuẩn và hướng dẫn chấm.
    - **Câu cờ vua tương tác:** Tích hợp `PositionEditor` và `MoveRecorder` từ thư viện `@duongsinh/chess-kit/react`. Cho phép người soạn xếp thế cờ FEN trực quan, kéo cờ trên bàn cờ để hệ thống tự động ghi nhận chuỗi nước đi UCI làm lời giải chuẩn `solution`.

### 1.5. Khối Portable Text `lms-quiz` & Component `QuizRunner`

- [`packages/plugins/emdash-lms/src/react/QuizRunner.tsx`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/react/QuizRunner.tsx):
  - Component React tương tác phía học viên:
    - Tải đề từ `quiz/present`.
    - Đếm ngược thời gian làm bài (Timer) và tự động nộp bài khi hết giờ.
    - Nhúng bàn cờ tương tác `MoveRecorder` cho phép học viên kéo quân cờ trực tiếp để trả lời câu hỏi thế cờ.
    - Nộp bài lên `me/quiz/submit` (hoặc `quiz/submit`), hiển thị bảng điểm, phân tích đúng/sai kèm giải thích chi tiết.
    - **Giao thức hoàn thành bài học:** Phát sự kiện chuẩn DOM `lms:requirement-done` khi `passed === true` để trang bài học (`/lesson/[slug]`) tự động mở khóa nút "Hoàn thành bài học".
- [`packages/plugins/emdash-lms/src/astro/Quiz.astro`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/astro/Quiz.astro) & [`QuizBlock.astro`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/astro/QuizBlock.astro): Wrapper Astro component nhúng `QuizRunner` với container có thuộc tính `data-lms-requirement="quiz:<quizId>"`.
- [`packages/plugins/emdash-lms/src/index.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/src/index.ts): Đăng ký khối `lms-quiz` trong `portableTextBlocks` và trang `/quizzes` trong `ADMIN_PAGES`.

---

## 2. Kết Quả Kiểm Chứng Thực Tế

### 2.1. Kiểm Tra Unit Test (`vitest`)

Đã thiết kế bộ kiểm thử toàn diện trong [`packages/plugins/emdash-lms/tests/quiz.test.ts`](file:///D:/code/emdash/packages/plugins/emdash-lms/tests/quiz.test.ts) (13 tests):

- Schema validation & mở rộng `questions.type = "chess"`.
- Admin CRUD Quiz & Options route.
- Admin CRUD Question (lưu cấu trúc FEN, nước đi UCI, prompt).
- Admin Reorder thứ tự câu hỏi.
- Route `quiz/present` bóc tách an toàn (100% lời giải, đáp án đúng và giải thích bị ẩn).
- Chấm điểm trắc nghiệm (Single, Multiple) server-side.
- Chấm điểm câu hỏi cờ vua (nước đi đúng -> đủ điểm, nước đi sai -> 0 điểm).
- Kiểm tra tính toán Passmark và trạng thái `passed`.
- Kiểm tra cơ chế giới hạn thời gian (Timer countdown).
- Lưu kết quả học viên vào `quiz_submissions` qua `me/quiz/submit`.

**Lệnh chạy kiểm tra:**

```bash
pnpm --filter emdash-lms test
```

**Kết quả thực tế:**

```text
 ✓ tests/routes.test.ts (8 tests) 21ms
 ✓ tests/setup-schema.test.ts (2 tests) 12ms
 ✓ tests/quiz.test.ts (13 tests) 39ms
 ✓ tests/payment-sepay.test.ts (16 tests) 74ms
 ✓ tests/errors-baseline.test.ts (4 tests) 7ms

 Test Files  5 passed (5)
      Tests  43 passed (43)
```

### 2.2. Kiểm Tra Linter & Typecheck

- `pnpm --filter emdash-lms typecheck` -> **0 errors** (Thành công).
- `pnpm lint:quick` -> **0 diagnostics** (Sạch hoàn toàn).
- `pnpm typecheck:demos` -> **0 errors, 0 warnings** trên toàn bộ 6 site demo Astro.

---

## 3. Runbook Bàn Giao Cho Thầy Tường

### 3.1. Đồng Bộ Schema Lên D1 Production

Khi cập nhật plugin lên production, Thầy chỉ cần đăng nhập Admin tại `https://covuahocduong.com/_emdash/admin` và vào mục:

1. **LMS -> Cài đặt LMS** (`/settings/setup`).
2. Bấm nút **"Chạy cài đặt / Cập nhật Schema"** (gọi route `setup/run`).
3. Hệ thống sẽ tự động cập nhật validation cho trường `questions.type` nhận giá trị `"chess"`.

### 3.2. Soạn Thử Quiz Cờ Vua Mẫu

1. Vào menu **LMS -> Soạn Quiz** (`/_emdash/admin/quizzes`).
2. Bấm **"Tạo Quiz mới"**, nhập tiêu đề (ví dụ: _"Kiểm tra Chiến thuật Nhập môn"_), chọn bài học liên kết, đặt điểm đạt (ví dụ: 70%) và thời gian làm bài (ví dụ: 10 phút).
3. Bấm **"Soạn câu hỏi"**:
   - Thêm câu hỏi loại **"Thế cờ / Bài tập cờ vua"**.
   - Dùng bàn cờ xếp thế (hoặc dán FEN), sau đó thực hiện các nước đi lời giải trên bàn cờ ghi nước (ví dụ: `Qh7#`).
   - Nhập gợi ý/yêu cầu đề bài (ví dụ: _"Trắng đi trước và chiếu hết sau 1 nước"_).
   - Bấm **"Lưu câu hỏi"**.
4. Vào bài học tương ứng trong Quản trị Nội dung, chèn khối **"Bài tập trắc nghiệm (Quiz)"** và chọn Quiz vừa tạo.

---

## 4. Trạng Thái Hoàn Thành & Chuyển Giao

- **Giai đoạn 3 (Quiz có câu hỏi cờ) đã hoàn thành 100%** đúng thiết kế v3 và kế hoạch tổng thể.
- Đảm bảo tính tương thích ngược tuyệt đối với các khóa học và dữ liệu hiện có.
- Sẵn sàng chuyển sang **Giai đoạn 4: Plugin chess-puzzles (kho bài tập cờ độc lập và phân cấp)**.
