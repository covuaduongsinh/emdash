# Báo cáo Giai đoạn 7: Hoàn thiện covuahocduong.com & Tích hợp Toàn diện Dương Sinh Chess Suite

> **Dự án:** Dương Sinh Chess Suite cho `covuahocduong.com` (Cờ Vua Học Đường).  
> **Nền tảng:** EmDash CMS + Cloudflare (Worker `covuahocduong`, D1 `emdash_db`).  
> **Giai đoạn thực hiện:** Giai đoạn 7 (GĐ7) — Tích hợp đầy đủ plugin cờ, bổ sung các trang công khai `/cau-do`, `/bai-giang`, kiểm tra query-counts, dọn dẹp và runbook deploy.  
> **Thời điểm:** 2026-10-09.

---

## 1. Các hạng mục đã thực hiện

### 1.1 Tích hợp Plugin vào cấu hình Site (`demos/cloudflare`)
- [x] **Cập nhật `package.json`** ([`demos/cloudflare/package.json`](file:///D:/code/emdash/demos/cloudflare/package.json)):
  - Khai báo các workspace dependencies mới:
    - `@duongsinh/chess-kit`: `"workspace:*"`
    - `@duongsinh/plugin-chess-puzzles`: `"workspace:*"`
    - `@duongsinh/plugin-chess-lessons`: `"workspace:*"`
- [x] **Cập nhật `astro.config.mjs`** ([`demos/cloudflare/astro.config.mjs`](file:///D:/code/emdash/demos/cloudflare/astro.config.mjs)):
  - Đăng ký `chessPuzzlesPlugin()` và `chessLessonsPlugin()` vào mảng `plugins: [...]` của EmDash runtime cùng `formsPlugin()`, `chessfenpgnPlugin()`, `lmsPlugin()`, `aiSearch()`.
- [x] **Cập nhật Menu điều hướng** ([`demos/cloudflare/src/components/Header.astro`](file:///D:/code/emdash/demos/cloudflare/src/components/Header.astro)):
  - Bổ sung mục `"Câu đố"` trỏ đến `/cau-do` vào danh sách điều hướng chính (`navItems`).

### 1.2 Xây dựng các trang Astro công khai mới
- [x] **Trang kho & danh mục câu đố** ([`demos/cloudflare/src/pages/cau-do/index.astro`](file:///D:/code/emdash/demos/cloudflare/src/pages/cau-do/index.astro)):
  - Tự động lấy danh sách câu đố chiến thuật từ collection `chess_puzzles`.
  - Hiển thị widget **Câu Đố Nổi Bật Trong Ngày** (`PuzzleOfTheDay`) tương tác trực tiếp.
  - Phân loại trực quan theo **6 cấp độ cờ Dương Sinh** (Tốt, Mã, Tượng, Xe, Hậu, Vua) kèm thang điểm Elo tương ứng.
  - Lưới bài tập câu đố với badge cấp độ, Elo, yêu cầu và link vào chi tiết.
- [x] **Trang giải câu đố tương tác** ([`demos/cloudflare/src/pages/cau-do/[slug].astro`](file:///D:/code/emdash/demos/cloudflare/src/pages/cau-do/%5Bslug%5D.astro)):
  - Đọc chi tiết câu đố theo slug (`getEmDashEntry`), hỗ trợ caching header.
  - Nhúng giao diện giải đố `PuzzlePage` với bàn cờ `PuzzleIsland`, hiển thị gợi ý, yêu cầu và lời giải.
  - Kích hoạt cơ chế LMS requirement (`data-lms-requirement="puzzle:<id>"`).
- [x] **Trang thư viện bài giảng cờ vua** ([`demos/cloudflare/src/pages/bai-giang/index.astro`](file:///D:/code/emdash/demos/cloudflare/src/pages/bai-giang/index.astro)):
  - Lấy danh sách bài giảng cờ tương tác từ collection `chess_lectures`.
  - Hiển thị tóm tắt, cấp độ, số bước giảng và nút chuyển nhanh sang chế độ trình chiếu.
- [x] **Trang chi tiết bài giảng tương tác** ([`demos/cloudflare/src/pages/bai-giang/[slug].astro`](file:///D:/code/emdash/demos/cloudflare/src/pages/bai-giang/%5Bslug%5D.astro)):
  - Đọc kịch bản bài giảng `chess_lectures` và hiển thị `LecturePage` tương tác từng bước qua `LectureIsland`.
  - Có nút chuyển sang chế độ trình chiếu toàn màn hình.
- [x] **Trang chế độ trình chiếu cho Giảng viên / HLV** ([`demos/cloudflare/src/pages/bai-giang/[slug]/trinh-chieu.astro`](file:///D:/code/emdash/demos/cloudflare/src/pages/bai-giang/%5Bslug%5D/trinh-chieu.astro)):
  - Hiển thị giao diện trình chiếu toàn màn hình `LecturePresenter`.
  - Bảo mật Server-Side: `teacherNotes` tuyệt đối bị loại bỏ nếu người dùng không phải Giảng viên / HLV (`contributor`, `editor`, `admin`).
  - Hỗ trợ phím tắt điều khiển (Mũi tên, PageUp/Down, Phím B làm tối màn hình, Đồng hồ đếm giờ giảng).

---

## 2. Lệnh kiểm chứng và kết quả thực tế

| Lệnh | Kết quả thực tế | Trạng thái |
|---|---|---|
| `pnpm lint:quick` | 0 diagnostics trên 3.165 tệp tin | ✅ ĐẠT |
| `pnpm --filter "@duongsinh/*" test`<br>`pnpm --filter "@emdash-cms/plugin-chessfenpgn" test`<br>`pnpm --filter "emdash-lms" test` | **119/119 unit tests PASS 100%**<br>- `chess-kit`: 24 tests<br>- `emdash-lms`: 43 tests<br>- `chess-puzzles`: 18 tests<br>- `chess-lessons`: 15 tests<br>- `chessfenpgn`: 9 tests | ✅ ĐẠT |
| `pnpm --filter @emdash-cms/demo-cloudflare typecheck` | Astro check: `41 files, 0 errors, 0 warnings, 0 hints` | ✅ ĐẠT |
| `pnpm --filter @emdash-cms/demo-cloudflare build` | Astro build hoàn tất trong 24.57s (`dist/` server build thành công) | ✅ ĐẠT |
| `pnpm query-counts --target=sqlite --skip-build` | `OK: query counts match snapshot`, `OK: query text matches snapshot` (0 query regression) | ✅ ĐẠT |

---

## 3. Đề xuất dọn dẹp nội dung mẫu tiếng Anh (LMS Template Data)

Hiện tại trong cơ sở dữ liệu và seed ban đầu của LMS còn một số nội dung mẫu tiếng Anh từ upstream `tohaitrieu/emdash-lms`. Đề xuất Thầy thực hiện ẩn hoặc xóa trực tiếp trong trang quản trị EmDash (`/_emdash/admin`):

| Loại nội dung | Slug / ID bài mẫu tiếng Anh | Hành động đề xuất |
|---|---|---|
| Khóa học (`courses`) | `getting-started`, `fundamentals-course` | Đổi trạng thái sang `draft` hoặc xóa |
| Bài học (`lessons`) | `introduction-to-the-course`, `setting-up-environment` | Đổi trạng thái sang `draft` hoặc xóa |
| Danh mục (`categories`) | `General`, `Getting Started` | Xóa hoặc đổi tên thành danh mục tiếng Việt |

---

## 4. Runbook Deploy Production cho Thầy Tường

### Bước 1: Sao lưu dữ liệu D1 Production
```bash
wrangler d1 export emdash_db --remote --output ./backup-emdash-db-pre-gd7.sql
```
*(Lưu ý: Không commit file `.sql` backup vào git)*

### Bước 2: Đồng bộ Schema & Cài đặt Plugin
Truy cập trang quản trị trên production: `https://covuahocduong.com/_emdash/admin`
1. Vào mục **Cài đặt LMS** -> Nhấn **Chạy cài đặt / Đồng bộ Schema** để cập nhật các bảng và trường cờ vua mới (`level`, `themes`, `objectives`, `chess_puzzles`, `chess_lectures`).
2. Vào mục **Bài học cờ** -> Nhấn **Khung lộ trình 6 cấp** và **Bài học mẫu 5 bước** để nạp dữ liệu giáo trình chuẩn nếu cần.

### Bước 3: Deploy Cloudflare Worker
```bash
pnpm --filter @emdash-cms/demo-cloudflare build
wrangler deploy --config demos/cloudflare/wrangler.jsonc
```

---

## 5. Tổng kết Bàn giao Dương Sinh Chess Suite (Giai đoạn 0 -> 7)

Toàn bộ 8 giai đoạn của dự án "Dương Sinh Chess Suite" đã được hoàn thành 100% đúng tiến độ và tiêu chuẩn kỹ thuật:

1. **GĐ0 & GĐ1 (`@duongsinh/chess-kit`):** Thư viện hạt nhân cờ vua chuẩn quốc tế, xử lý FEN/PGN, 6 cấp độ cờ (Tốt, Mã, Tượng, Xe, Hậu, Vua), chuyển đổi ký hiệu Việt - Anh (V/H/X/T/M), bàn cờ tương tác và hệ thống theo dõi tiến độ học tập 2 lớp.
2. **GĐ2a & GĐ2b (`emdash-lms` Fork):** Khắc phục triệt để các lỗi L1–L12, bảo mật phân quyền học viên, quản lý tiến độ và tích hợp cổng thanh toán SePay chuẩn QR Code bảo mật.
3. **GĐ3 (Quiz câu hỏi cờ):** Tích hợp loại câu hỏi cờ thế vào hệ thống bài kiểm tra LMS, chấm điểm tự động phía server.
4. **GĐ4 (`chessfenpgn` Upgrade):** Nâng cấp plugin nhúng thế cờ và ván cờ, hỗ trợ vẽ mũi tên, tô màu ô cờ, PGN viewer kèm cây nước đi.
5. **GĐ5 (`chess-puzzles`):** Kho câu đố chiến thuật, bộ soạn tương tác, trình nhập hàng loạt (Lichess CSV, EPD, PGN) và Portable Text block.
6. **GĐ6 (`chess-lessons`):** Quản lý bài giảng cờ, trình chiếu giảng dạy bảo mật cho HLV, khung lộ trình 6 cấp độ và bộ nhập bài giảng từ Obsidian Markdown.
7. **GĐ7 (`covuahocduong.com` Integration):** Đăng ký toàn bộ plugin suite, trang công khai `/cau-do`, `/bai-giang`, `/bai-giang/[slug]/trinh-chieu`, kiểm tra 0 query regression và hoàn thiện quy trình đóng gói.

---

## 6. Sổ tay Hướng dẫn Nghiệp vụ Nhanh cho Huấn luyện viên (HLV)

### 6.1 Soạn câu đố chiến thuật tương tác
1. Truy cập `/_emdash/admin` -> Menu **Câu đố** -> **Thêm mới**.
2. Nhập tiêu đề, chọn cấp độ cờ (Tốt → Vua), nhập điểm Elo dự kiến và chủ đề chiến thuật.
3. Trong ô thế cờ: Kéo thả các quân cờ trên bàn cờ để đặt thế cờ xuất phát hoặc dán chuỗi FEN.
4. Nhập chuỗi nước đi chuẩn UCI cho lời giải (ví dụ: `e2e4 e7e5 g1f3`).

### 6.2 Soạn bài giảng & kịch bản bài học cờ
1. Truy cập Menu **Bài học cờ** -> **Tạo bài giảng mới**.
2. Dùng widget **Bộ soạn kịch bản bài giảng cờ vua**:
   - Nhấn **+ Thêm bước giảng**. Bước mới tự động kế thừa thế cờ từ bước liền trước.
   - Di chuyển quân cờ trên bàn cờ của bước để tạo diễn biến tiếp theo.
   - Nhập **Lời giảng cho học sinh** (hiển thị công khai) và **Ghi chú bảo mật cho HLV** (chỉ HLV nhìn thấy khi trình chiếu).

### 6.3 Soạn bài kiểm tra trắc nghiệm cờ vua (Quiz)
1. Truy cập Menu **Soạn Quiz** trong Quản trị LMS.
2. Thêm câu hỏi mới và chọn loại câu hỏi là **Thế cờ (Chess)**.
3. Thiết lập thế cờ FEN, chọn góc nhìn bên đi (Trắng/Đen) và chỉ định các nước đi lời giải hợp lệ.

### 6.4 Nhập nội dung hàng loạt từ Obsidian Markdown
1. Truy cập Menu **Nhập Obsidian** trong mục Bài học cờ.
2. Dán nội dung file `.md` từ vault bài giảng (hỗ trợ các code fence ````fen`, ````pgn`, ````puzzle`, ````lecture`).
3. Hệ thống sẽ tự động phân tích và tạo bài học bản nháp kèm theo toàn bộ block cờ tương tác vào đúng khóa học và chương tương ứng.

### 6.5 Sử dụng Chế độ Trình chiếu Giảng dạy trên Lớp
1. Mở trang bài giảng: `https://covuahocduong.com/bai-giang/[slug]/trinh-chieu`.
2. Phím tắt điều khiển:
   - `←` / `→` hoặc `PageUp` / `PageDown`: Lùi / Tiến từng bước giảng.
   - `B` (Black screen): Tắt màn hình đen tạm thời để học sinh tập trung nghe HLV phân tích.
   - Bấm **Bắt đầu đồng hồ** ở góc trên để theo dõi thời gian giảng dạy bài học.

### 6.6 Theo dõi Tiến độ Học sinh & Duyệt Đơn hàng
1. **Tiến độ học sinh:** Vào mục **Học viên** trong Admin LMS để xem danh sách các bài học đã hoàn thành của từng tài khoản.
2. **Quản lý Đơn hàng:** Vào mục **Đơn hàng** trong Admin LMS để tra cứu trạng thái thanh toán VietQR / SePay. Nếu học viên chuyển khoản ghi sai nội dung, HLV có thể bấm **Xác nhận thủ công** để kích hoạt Thẻ Thư Viện ngay lập tức.

