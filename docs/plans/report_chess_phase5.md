# Báo Cáo Giai Đoạn 5 (GĐ5): Plugin `chess-puzzles` (Ngân Hàng Câu Đố Cờ Vua)

**Dự án:** Dương Sinh Chess Suite — Cờ Vua Học Đường (`covuahocduong.com`)  
**Package mới:** [`@duongsinh/plugin-chess-puzzles`](file:///D:/code/emdash/packages/plugins/chess-puzzles) (id: `chess-puzzles`, native plugin)  
**Mục tiêu:** Xây dựng plugin quản lý ngân hàng câu đố phân bổ theo 6 cấp độ Dương Sinh, bộ soạn câu đố (`PositionEditor` &rarr; `MoveRecorder` &rarr; Chạy thử `PuzzlePlayer`), khối Portable Text `chess-puzzle` tích hợp giao thức `data-lms-requirement="puzzle:<id>"`, cơ chế snapshot qua hook `content:beforeSave` đảm bảo trang công khai của khách **0 query** database, và bộ công cụ nhập hàng loạt từ Lichess CSV, EPD, PGN.

---

## 1. Các Công Việc Đã Hoàn Thành

### 1.1. Cấu Trúc Package & Plugin Descriptor
- [`packages/plugins/chess-puzzles/package.json`](file:///D:/code/emdash/packages/plugins/chess-puzzles/package.json):
  - Tên package: `@duongsinh/plugin-chess-puzzles`, `"private": true`, version `0.1.0`.
  - Exports: `.` (main), `./admin` (adminEntry), `./astro` (componentsEntry).
  - Dependencies: `@duongsinh/chess-kit`, `chess.js`, `react-chessboard`, `ulidx`, `zod`.
- [`packages/plugins/chess-puzzles/src/index.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/index.ts):
  - Descriptor `chessPuzzlesPlugin(options)` và `createPlugin()`:
    - ID: `chess-puzzles`, Capabilities: `["content:read", "content:write"]`.
    - Menu Admin: `adminPages: [{ path: "/puzzles", label: "Câu đố", icon: "sparkle" }, { path: "/import", label: "Nhập câu đố", icon: "upload" }]`.
    - Khối Portable Text `chess-puzzle` thuộc danh mục `category: "Cờ vua"`.
    - Cấu hình `settingsSchema`: `defaultOrientation`, `revealAfterFailures`, `showRating`.
- [`packages/plugins/chess-puzzles/src/types.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/types.ts): Định nghĩa kiểu dữ liệu chặt chẽ cho câu đố, bản ghi, importer và snapshot.
- [`packages/plugins/chess-puzzles/README.md`](file:///D:/code/emdash/packages/plugins/chess-puzzles/README.md): Tài liệu hướng dẫn sử dụng và cấu hình tiếng Việt.

### 1.2. Schema & Setup CSDL Idempotent
- [`packages/plugins/chess-puzzles/src/schema/definitions.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/schema/definitions.ts):
  - Khai báo collection `chess_puzzles`: `urlPattern: "/cau-do/{slug}"`, `supports: ["drafts", "revisions", "search"]`.
  - Các trường dữ liệu:
    - `title`: Chuỗi (bắt buộc, tìm kiếm được).
    - `puzzle`: JSON (bộ soạn `chess-puzzles:puzzle-editor`).
    - `prompt`: Chuỗi yêu cầu/câu hỏi (ví dụ: "Trắng đi trước và chiếu hết sau 2 nước").
    - `level`: Select 6 cấp độ Dương Sinh (`tot`, `ma`, `tuong`, `xe`, `hau`, `vua`).
    - `themes`: Text lưu các nhãn chiến thuật (`mateIn1`, `fork`, `pin`...).
    - `rating`: Integer lưu điểm Elo.
    - `hint`: Gợi ý giải đố.
    - `explanation`: Portable Text giải thích lời giải chi tiết.
    - `source`: Nguồn câu đố (Lichess, Dương Sinh...).
- [`packages/plugins/chess-puzzles/src/schema/setup.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/schema/setup.ts) & [`src/handlers/setup.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/handlers/setup.ts):
  - Hàm `runChessPuzzlesSetup`: Đăng ký bảng `ec_chess_puzzles` nếu đã có sẵn (orphaned table) hoặc tạo mới collection và các cột tương ứng một cách idempotent (chạy nhiều lần không gây trùng lặp/mất dữ liệu).
  - Route `setup/run` yêu cầu quyền `schema:manage`.

### 1.3. Cơ Chế Snapshot & Hook `content:beforeSave` (0 Query Khách)
- [`packages/plugins/chess-puzzles/src/handlers/snapshots.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/handlers/snapshots.ts):
  - Hook `content:beforeSave`: Tự động duyệt đệ quy cây nội dung Portable Text khi biên tập viên lưu bài viết. Nếu phát hiện khối `chess-puzzle` có liên kết `puzzleId`, hệ thống tự động đọc bản ghi đã xuất bản và snapshot các trường `fen`, `solution`, `prompt`, `hint`, `level`, `title`, `explanation` trực tiếp vào node của block.
  - Fallback an toàn: Nếu câu đố bị xóa hoặc chưa xuất bản, hệ thống giữ nguyên node và ghi log cảnh báo, không làm gián đoạn việc lưu bài.
  - Route `snapshots/refresh` (yêu cầu `content:create`): Cho phép quét và cập nhật lại toàn bộ các vị trí nhúng câu đố trong các bài học / bài viết theo dữ liệu mới nhất.

### 1.4. Bộ Nhập Câu Đố Hàng Loạt (Lichess CSV, EPD, PGN)
- [`packages/plugins/chess-puzzles/src/importers/rating-level.js`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/importers/rating-level.ts): Hàm chuyển đổi thang điểm Elo sang 6 cấp độ chuẩn Dương Sinh (`<1000: tot`, `1000..1299: ma`, `1300..1599: tuong`, `1600..1899: xe`, `1900..2199: hau`, `>=2200: vua`).
- [`packages/plugins/chess-puzzles/src/importers/lichess-csv.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/importers/lichess-csv.ts):
  - Phân tích file CSV xuất từ Lichess (`PuzzleId,FEN,Moves,Rating...`).
  - Tự động thực hiện nước đi dẫn của đối thủ (nước đầu tiên trong `Moves`) để tạo FEN xuất phát giải đố cho học viên.
  - Tự động tạo câu hỏi gợi ý theo theme (`mateIn1`, `mateIn2`...).
- [`packages/plugins/chess-puzzles/src/importers/epd.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/importers/epd.ts): Phân tích định dạng EPD chuẩn (`<FEN> bm <bestmove>; id "..."; c0 "...";`).
- [`packages/plugins/chess-puzzles/src/importers/pgn.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/importers/pgn.ts): Phân tích ván cờ PGN chứa thế cờ `[FEN]`.
- [`packages/plugins/chess-puzzles/src/handlers/import.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/handlers/import.ts):
  - Route `puzzles/import` (yêu cầu `content:create`): Giới hạn an toàn &le; 500 câu/lô, tạo nháp hoặc xuất bản trực tiếp, báo cáo danh sách chi tiết các dòng lỗi.

### 1.5. Bộ Soạn `puzzle-editor` & Giao Diện Quản Trị
- [`packages/plugins/chess-puzzles/src/admin.tsx`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/admin.tsx):
  - **Widget `puzzle-editor` (`PuzzleEditorWidget`)**:
    - Tab 1: **Xếp thế cờ (FEN)** dùng `PositionEditor`.
    - Tab 2: **Ghi nước giải** dùng `MoveRecorder`.
    - Tab 3: **Chạy thử câu đố** dùng `PuzzlePlayer`.
  - **Trang Quản lý Câu đố (`/puzzles` - `PuzzlesAdminPage`)**:
    - Hiển thị thẻ thống kê số lượng câu đố trực quan theo 6 cấp độ (màu sắc chuẩn Dương Sinh).
    - Nút "Cài đặt CSDL (Setup)" và "Làm mới Snapshot".
  - **Trang Nhập Câu đố (`/import` - `PuzzlesImportPage`)**:
    - Hỗ trợ tải file hoặc dán trực tiếp dữ liệu CSV / EPD / PGN.
    - Bảng báo cáo kết quả và thông báo lỗi theo từng dòng.

### 1.6. Thành Phần Frontend & Tích Hợp LMS Requirement
- [`packages/plugins/chess-puzzles/src/astro/PuzzleIsland.tsx`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/astro/PuzzleIsland.tsx):
  - Nhúng bàn cờ giải đố `PuzzlePlayer`.
  - Khi học viên giải đúng:
    - Tự động gọi `markPuzzleSolved(puzzleId)` lưu vào tiến độ trình duyệt (`@duongsinh/chess-kit/progress`).
    - Phát sự kiện `window.dispatchEvent(new CustomEvent("lms:requirement-done", { detail: { requirement: "puzzle:<id>" } }))`.
    - Phát sự kiện `window.dispatchEvent(new CustomEvent("duongsinh-chess:puzzle-solved", { detail: { puzzleId, level, fen } }))`.
- [`packages/plugins/chess-puzzles/src/astro/PuzzleBlock.astro`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/astro/PuzzleBlock.astro): Khối Portable Text nhúng vào bài học LMS, chỉ render dữ liệu snapshot có thuộc tính `data-lms-requirement="puzzle:<id>"`.
- [`packages/plugins/chess-puzzles/src/astro/PuzzlePage.astro`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/astro/PuzzlePage.astro): Trang chi tiết xem và giải câu đố độc lập (`/cau-do/[slug]`).
- [`packages/plugins/chess-puzzles/src/astro/PuzzleOfTheDay.astro`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/astro/PuzzleOfTheDay.astro): Widget câu đố mỗi ngày.
- [`packages/plugins/chess-puzzles/src/astro/index.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/src/astro/index.ts): Export block mapping `blockComponents = { "chess-puzzle": PuzzleBlock }`.

---

## 2. Kết Quả Kiểm Chứng Thực Tế

### 2.1. Kiểm Tra Unit Test (`vitest`)
Toàn bộ 18 test của `chess-puzzles` và 94 test của toàn bộ bộ plugin cờ / LMS đã vượt qua 100%:
- [`packages/plugins/chess-puzzles/tests/importers.test.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/tests/importers.test.ts):
  - ✓ Ánh xạ Elo sang 6 cấp độ cờ vua Dương Sinh.
  - ✓ Phân tích chính xác 20 câu đố từ file fixture mẫu Lichess CSV ([`lichess_sample.csv`](file:///D:/code/emdash/packages/plugins/chess-puzzles/tests/fixtures/lichess_sample.csv)).
  - ✓ Phân tích định dạng EPD.
  - ✓ Phân tích định dạng PGN ván cờ.
- [`packages/plugins/chess-puzzles/tests/setup-schema.test.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/tests/setup-schema.test.ts):
  - ✓ Khai báo schema 6 cấp độ và các field bắt buộc.
  - ✓ Chạy cài đặt idempotent (lần 1 tạo mới, lần 2 không trùng lặp).
  - ✓ Tự động đăng ký bảng orphaned nếu có sẵn trong CSDL.
- [`packages/plugins/chess-puzzles/tests/snapshots.test.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/tests/snapshots.test.ts):
  - ✓ Tự động snapshot FEN/nước giải/gợi ý/cấp độ vào khối Portable Text.
  - ✓ Xử lý an toàn khi câu đố không tồn tại (không crash).
  - ✓ Route `snapshots/refresh` quét và cập nhật lại toàn bộ các bài học.
- [`packages/plugins/chess-puzzles/tests/options-and-routes.test.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/tests/options-and-routes.test.ts):
  - ✓ `puzzles/options` trả về danh sách có tiền tố cấp độ và FEN.
  - ✓ `puzzles/options` lọc chính xác theo cấp độ.
  - ✓ `puzzles/options` tìm kiếm theo từ khóa.
  - ✓ `puzzles/stats` thống kê theo 6 cấp độ.
  - ✓ Kiểm tra quyền các route (`schema:manage`, `content:create`, `content:read`).
- [`packages/plugins/chess-puzzles/tests/admin-exports.test.ts`](file:///D:/code/emdash/packages/plugins/chess-puzzles/tests/admin-exports.test.ts):
  - ✓ Export named `pages` và `fields` theo chuẩn EmDash plugin.
  - ✓ Khai báo Portable Text block danh mục "Cờ vua".

**Lệnh chạy kiểm tra tổng thể:**
```bash
pnpm --filter @duongsinh/plugin-chess-puzzles test && pnpm --filter @emdash-cms/plugin-chessfenpgn test && pnpm --filter @duongsinh/chess-kit test && pnpm --filter emdash-lms test
```
```text
 ✓ packages/plugins/chess-puzzles/tests/setup-schema.test.ts (3 tests)
 ✓ packages/plugins/chess-puzzles/tests/importers.test.ts (4 tests)
 ✓ packages/plugins/chess-puzzles/tests/snapshots.test.ts (3 tests)
 ✓ packages/plugins/chess-puzzles/tests/options-and-routes.test.ts (5 tests)
 ✓ packages/plugins/chess-puzzles/tests/admin-exports.test.ts (3 tests)
 Test Files  5 passed (5) | Tests  18 passed (18)

 ✓ packages/plugins/chessfenpgn/tests/regression-pgn-fen.test.ts (3 tests)
 ✓ packages/plugins/chessfenpgn/tests/island-and-widget.test.ts (2 tests)
 ✓ packages/plugins/chessfenpgn/tests/blocks-config.test.ts (3 tests)
 ✓ packages/plugins/chessfenpgn/tests/admin-exports.test.ts (1 test)
 Test Files  4 passed (4) | Tests  9 passed (9)

 ✓ packages/chess-kit/tests/core/puzzle.test.ts (5 tests)
 ✓ packages/chess-kit/tests/core/pgn.test.ts (4 tests)
 ✓ packages/chess-kit/tests/progress/progress.test.ts (5 tests)
 ✓ packages/chess-kit/tests/core/fen.test.ts (3 tests)
 ✓ packages/chess-kit/tests/core/notation.test.ts (4 tests)
 ✓ packages/chess-kit/tests/core/annotations.test.ts (3 tests)
 Test Files  6 passed (6) | Tests  24 passed (24)

 ✓ packages/plugins/emdash-lms/tests/routes.test.ts (8 tests)
 ✓ packages/plugins/emdash-lms/tests/setup-schema.test.ts (2 tests)
 ✓ packages/plugins/emdash-lms/tests/quiz.test.ts (13 tests)
 ✓ packages/plugins/emdash-lms/tests/payment-sepay.test.ts (16 tests)
 ✓ packages/plugins/emdash-lms/tests/errors-baseline.test.ts (4 tests)
 Test Files  5 passed (5) | Tests  43 passed (43)
```

### 2.2. Kiểm Tra Linter, Typecheck & Site Demo
- `pnpm lint:quick` &rarr; **0 diagnostics** (Sạch 100%).
- `pnpm --filter @duongsinh/plugin-chess-puzzles typecheck` &rarr; **0 errors**.
- `pnpm --filter @emdash-cms/demo-cloudflare typecheck` &rarr; **0 errors, 0 warnings** (36 files sạch).

---

## 3. Runbook Bàn Giao Cho Thầy Tường

### 3.1. Kích Hoạt Plugin Trong Site `covuahocduong.com`
Khi Thầy muốn bật plugin trên site `demos/cloudflare` (ở GĐ7):
1. Mở file [`demos/cloudflare/astro.config.mjs`](file:///D:/code/emdash/demos/cloudflare/astro.config.mjs):
   ```typescript
   import { chessPuzzlesPlugin } from "@duongsinh/plugin-chess-puzzles";

   export default defineConfig({
     plugins: [
       // ... các plugin khác
       chessPuzzlesPlugin(),
     ],
   });
   ```
2. Đăng nhập trang Admin `https://covuahocduong.com/_emdash/admin`.
3. Bấm vào mục **"Câu đố"** (`/_emdash/admin/puzzles`), bấm nút **"Cài đặt CSDL (Setup)"** để khởi tạo bảng `ec_chess_puzzles`.

### 3.2. Soạn Câu Đố Hoặc Nhập Hàng Loạt
- **Soạn thủ công:** Vào **"Nội dung" &rarr; "Kho câu đố"** &rarr; Bấm "Thêm mới". Dùng widget 3 bước để xếp thế cờ, ghi nước giải và chạy thử.
- **Nhập hàng loạt:** Vào mục **"Nhập câu đố"** (`/_emdash/admin/import`), chọn tab "Lichess CSV" / "EPD" / "PGN", tải file hoặc dán nội dung rồi bấm "Bắt đầu nhập dữ liệu".

---

## 4. Trạng Thái Hoàn Thành & Chuyển Giao
- **Giai đoạn 5 (Plugin `chess-puzzles`) đã hoàn thành 100%**.
- Sẵn sàng chuyển sang **Giai đoạn 6: Plugin `chess-lessons` (field cờ cho khóa/bài, bài giảng + trình chiếu, khung 6 cấp, nhập Obsidian)**.
