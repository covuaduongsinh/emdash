# Báo Cáo Giai Đoạn 6 (GĐ6): Plugin `chess-lessons` (Bài Học Cờ Vua & Bài Giảng Trình Chiếu)

**Dự án:** Dương Sinh Chess Suite — Cờ Vua Học Đường (`covuahocduong.com`)  
**Package mới:** [`@duongsinh/plugin-chess-lessons`](file:///D:/code/emdash/packages/plugins/chess-lessons) (id: `chess-lessons`, native plugin)  
**Mục tiêu:** Xây dựng plugin quản lý khung chương trình 6 cấp độ Dương Sinh (Tốt &rarr; Vua), ngân hàng bài giảng trình chiếu cờ vua tương tác theo từng bước (`chess_lectures`), chế độ trình chiếu toàn màn hình chuyên nghiệp (`LecturePresenter`) bảo mật ghi chú HLV phía server, khối Portable Text `chess-lecture` tích hợp giao thức `data-lms-requirement="lecture:<id>"`, cơ chế snapshot hook `content:beforeSave` đảm bảo trang công khai **0 query** DB và loại bỏ `teacherNotes`, cùng trình nhập bài học tự động từ Obsidian Markdown (`/import-obsidian`).

---

## 1. Các Công Việc Đã Hoàn Thành

### 1.1. Cấu Trúc Package & Plugin Descriptor
- [`packages/plugins/chess-lessons/package.json`](file:///D:/code/emdash/packages/plugins/chess-lessons/package.json):
  - Tên package: `@duongsinh/plugin-chess-lessons`, `"private": true`, version `0.1.0`.
  - Exports: `.` (main), `./admin` (adminEntry), `./astro` (componentsEntry).
  - Dependencies: `@duongsinh/chess-kit`, `chess.js`, `react-chessboard`, `ulidx`, `yaml`, `zod`.
- [`packages/plugins/chess-lessons/src/index.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/index.ts):
  - Descriptor `chessLessonsPlugin(options)` và `createPlugin()`:
    - ID: `chess-lessons`, Capabilities: `["content:read", "content:write"]`.
    - Menu Admin: `adminPages: [{ path: "/lessons", label: "Bài học cờ", icon: "chalkboard-teacher" }, { path: "/import-obsidian", label: "Nhập Obsidian", icon: "upload" }]`.
    - Khối Portable Text `chess-lecture` thuộc danh mục `category: "Cờ vua"`.
    - Cấu hình `settingsSchema`: `defaultOrientation`, `showTeacherNotesInPresenter`.
- [`packages/plugins/chess-lessons/src/types.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/types.ts): Định nghĩa kiểu dữ liệu chặt chẽ cho kịch bản bài giảng, các bước trình chiếu, importer Obsidian và kết quả tạo dữ liệu mẫu.
- [`packages/plugins/chess-lessons/README.md`](file:///D:/code/emdash/packages/plugins/chess-lessons/README.md): Tài liệu hướng dẫn sử dụng, cấu hình và quy ước soạn Markdown cho vault `OBSIDIAN2026`.

### 1.2. Schema & Setup CSDL Idempotent & Bổ Sung Trường Cờ Vua
- [`packages/plugins/chess-lessons/src/schema/definitions.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/schema/definitions.ts):
  - Bổ sung trường vào collection `courses`:
    - `level`: Select 6 cấp độ Dương Sinh (`tot`, `ma`, `tuong`, `xe`, `hau`, `vua`).
    - `sessions`: Integer (Tổng số buổi học trong khóa, 1..200).
    - `age_range`: String (Độ tuổi phù hợp, vd: "5-8 tuổi", "6-12 tuổi").
  - Bổ sung trường vào collection `lessons`:
    - `level`: Select 6 cấp độ Dương Sinh.
    - `themes`: String lưu nhãn chiến thuật/kỹ năng (`fork`, `pin`, `khai cuộc`...).
    - `objectives`: Text mục tiêu sư phạm của bài học.
  - Khai báo collection `chess_lectures`:
    - `urlPattern: "/bai-giang/{slug}"`, `supports: ["drafts", "revisions", "search"]`.
    - Các trường: `title`, `level`, `course` (liên kết khóa học), `summary`, `script` (JSON widget `chess-lessons:lecture-builder`).
- [`packages/plugins/chess-lessons/src/schema/setup.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/schema/setup.ts) & [`src/handlers/setup.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/handlers/setup.ts):
  - Hàm `runChessLessonsSetup`: Kiểm tra các collection LMS cơ sở (`courses`, `modules`, `lessons`), tự động bổ sung các trường cờ vua còn thiếu, tạo hoặc đăng ký bảng `ec_chess_lectures` một cách idempotent (không xóa/đè bất kỳ dữ liệu hay trường nào của LMS).
  - Route `setup/run` yêu cầu quyền `schema:manage`.

### 1.3. Widget `lecture-builder` & Giao Diện Quản Trị Sư Phạm
- [`packages/plugins/chess-lessons/src/admin.tsx`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/admin.tsx):
  - **Widget `lecture-builder` (`LectureBuilderWidget`)**:
    - Soạn kịch bản bài giảng gồm danh sách các bước (`steps`).
    - Mỗi bước gồm: Xếp FEN bằng `PositionEditor`, cấu hình góc nhìn, nhập mũi tên (`arrows`), ô sáng (`highlights`), lời giảng cho học sinh (`narration`), và ghi chú sư phạm riêng cho Huấn Luyện Viên (`teacherNotes`).
    - Hỗ trợ thêm/xóa/đổi thứ tự bước và tab "Chạy Thử Bài Giảng" dùng `LecturePlayer`.
  - **Trang Quản lý Bài học cờ (`/lessons` - `LessonsAdminPage`)**:
    - Hiển thị thẻ 6 cấp độ cờ vua trực quan theo chuẩn thương hiệu Dương Sinh.
    - Nút "Cài đặt CSDL (Setup)" đồng bộ schema.
    - 3 nút tiện ích sư phạm:
      1. **"Khung lộ trình 6 cấp"** (Route `lessons/seed-curriculum`): Tạo 6 khóa học nháp Tốt &rarr; Vua kèm chương mẫu nếu chưa có.
      2. **"Tạo bài học mẫu (5 bước)"** (Route `lessons/seed-sample-lesson`): Tạo bài học chuẩn 5 bước sư phạm (Khởi động &rarr; Kiến thức mới &rarr; Thực hành &rarr; Kiểm tra &rarr; Bài tập về nhà).
      3. **"Nạp dữ liệu mẫu hoàn chỉnh"** (Route `lessons/seed-demo-data`): Nạp trọn bộ 1 khóa học demo, 3 bài học tương tác và 1 bài giảng mẫu (không đụng đến dữ liệu thật của site).
      4. **"Làm mới Snapshot bài giảng"** (Route `snapshots/refresh`).

### 1.4. Trình Nhập Bài Học Từ Obsidian Markdown (`/import-obsidian`)
- [`packages/plugins/chess-lessons/src/importers/obsidian.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/importers/obsidian.ts):
  - Đọc YAML frontmatter (`title`, `course`, `module`, `order`, `level`, `themes`, `objectives`).
  - Phát hiện và cảnh báo các liên kết Obsidian Wikilink `![[...]]` và `[[...]]`.
  - Phân tích và chuyển đổi các code fence đặc thù cờ vua:
    - ````fen ... ```` &rarr; Khối Portable Text `chess-fen`.
    - ````pgn ... ```` &rarr; Khối Portable Text `chess-pgn`.
    - ````puzzle ... ```` &rarr; Khối Portable Text `chess-puzzle`.
    - ````lecture ... ```` &rarr; Khối Portable Text `chess-lecture`.
  - Chuyển đổi các đoạn văn bản Markdown bằng `markdownToPortableText` từ `emdash/client`.
- [`packages/plugins/chess-lessons/src/handlers/import-obsidian.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/handlers/import-obsidian.ts):
  - Route `lessons/import-obsidian` (yêu cầu quyền `content:create`).
  - Tự động tìm hoặc tạo khóa học / chương mới, tạo bài học ở trạng thái NHÁP (`status: "draft"`).
- [`packages/plugins/chess-lessons/src/admin.tsx`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/admin.tsx) (`ObsidianImportPage`):
  - Giao diện tải file `.md` hoặc dán trực tiếp Markdown, hiển thị chi tiết kết quả và cảnh báo wikilink.
- [`packages/plugins/chess-lessons/tests/fixtures/sample_obsidian_lesson.md`](file:///D:/code/emdash/packages/plugins/chess-lessons/tests/fixtures/sample_obsidian_lesson.md): File fixture kiểm thử bài học mẫu từ Obsidian.

### 1.5. Cơ Chế Snapshot Hook `content:beforeSave` & Bảo Mật `teacherNotes`
- [`packages/plugins/chess-lessons/src/handlers/snapshots.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/handlers/snapshots.ts):
  - Hook `content:beforeSave`: Tự động duyệt đệ quy cây Portable Text khi biên tập viên lưu bài viết/bài học. Khi phát hiện khối `chess-lecture` có liên kết `lectureId`, tự động đọc bài giảng đã xuất bản và snapshot các trường `title`, `summary`, `level`, `steps` trực tiếp vào node.
  - **BẢO MẬT TUYỆT ĐỐI:** Trong toàn bộ các step của snapshot, trường `teacherNotes` bị **LOẠI BỎ TRIỆT ĐỂ** (`delete step.teacherNotes`) nhằm ngăn chặn việc rò rỉ ghi chú sư phạm của giáo viên sang phía client học sinh hoặc khách.

### 1.6. Chế Độ Trình Chiếu Toàn Màn Hình & Thành Phần Frontend
- [`packages/plugins/chess-lessons/src/astro/LecturePresenter.astro`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/astro/LecturePresenter.astro) & [`LecturePresenterIsland.tsx`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/astro/LecturePresenterIsland.tsx):
  - Giao diện trình chiếu bài giảng toàn màn hình tối ưu cho giảng dạy trên lớp hoặc trực tuyến.
  - Phím tắt: `PageUp`/`PageDown`, `←`/`→`, `Space`/`Backspace`, `Home`/`End`, Phím `B` (Blackout tắt màn hình), Đồng hồ bấm giờ buổi học (`Timer`).
  - **Kiểm soát truy cập Server-Side:** Chỉ render `teacherNotes` khi `Astro.locals.user` có vai trò &ge; `contributor` (Giáo viên / HLV / Quản trị viên). Khách vãng lai và học viên thường (`subscriber`) nhận HTML đã được loại bỏ hoàn toàn `teacherNotes`.
- [`packages/plugins/chess-lessons/src/astro/LectureBlock.astro`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/astro/LectureBlock.astro): Khối Portable Text nhúng vào bài học LMS, chỉ render dữ liệu snapshot (0 DB query), tích hợp thuộc tính `data-lms-requirement="lecture:<id>"`.
- [`packages/plugins/chess-lessons/src/astro/LectureIsland.tsx`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/astro/LectureIsland.tsx): Khi học viên hoàn thành hết các bước bài giảng, tự động lưu tiến độ trình duyệt (`markLectureCompleted`) và phát sự kiện `window.dispatchEvent("lms:requirement-done")`.
- [`packages/plugins/chess-lessons/src/astro/LecturePage.astro`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/astro/LecturePage.astro): Trang xem bài giảng độc lập (`/bai-giang/[slug]`).
- [`packages/plugins/chess-lessons/src/astro/index.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/src/astro/index.ts): Export `blockComponents = { "chess-lecture": LectureBlock }`.

---

## 2. Kết Quả Kiểm Chứng Thực Tế

### 2.1. Kiểm Tra Unit & Integration Test (`vitest`)
Toàn bộ 15 test của `chess-lessons` và 100 test của toàn bộ bộ plugin cờ / LMS đã vượt qua 100%:
- [`packages/plugins/chess-lessons/tests/importers.test.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/tests/importers.test.ts):
  - ✓ Phân tích chính xác YAML frontmatter (title, course, module, level, themes, objectives, order).
  - ✓ Trích xuất và chuyển đổi các code fence ````fen````, ````pgn````, ````puzzle````, ````lecture```` thành các block node Portable Text tương ứng.
  - ✓ Cảnh báo chính xác các liên kết Obsidian Wikilink `![[...]]` và `[[...]]`.
- [`packages/plugins/chess-lessons/tests/setup-schema.test.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/tests/setup-schema.test.ts):
  - ✓ Báo lỗi rõ ràng nếu các collection LMS cơ sở chưa được cài đặt.
  - ✓ Bổ sung đúng các trường cờ vua vào `courses` và `lessons`, tạo collection `chess_lectures`.
  - ✓ Chạy cài đặt schema lần 2 idempotent (không trùng lặp / không lỗi).
- [`packages/plugins/chess-lessons/tests/snapshots.test.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/tests/snapshots.test.ts):
  - ✓ Tự động snapshot kịch bản bài giảng vào node `chess-lecture`.
  - ✓ **Bảo mật:** Kiểm chứng trường `teacherNotes` bị xóa sạch khỏi mọi step trong snapshot.
- [`packages/plugins/chess-lessons/tests/presenter-security.test.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/tests/presenter-security.test.ts):
  - ✓ Loại bỏ triệt để `teacherNotes` khi người dùng là Khách ẩn danh (Guest).
  - ✓ Loại bỏ triệt để `teacherNotes` khi người dùng là Học viên (`subscriber`).
  - ✓ Giữ nguyên `teacherNotes` khi người dùng là Giáo viên / Huấn Luyện Viên (`contributor`, `editor`, `admin`).
- [`packages/plugins/chess-lessons/tests/seed.test.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/tests/seed.test.ts):
  - ✓ Tạo 6 khóa học theo lộ trình 6 cấp độ Tốt &rarr; Vua, bỏ qua khóa đã có khi chạy lần 2.
  - ✓ Tạo bài học mẫu 5 bước chuẩn sư phạm.
  - ✓ Nạp trọn bộ dữ liệu demo (khóa, 3 bài, bài giảng) không bị nhân đôi khi chạy lại.
- [`packages/plugins/chess-lessons/tests/admin-exports.test.ts`](file:///D:/code/emdash/packages/plugins/chess-lessons/tests/admin-exports.test.ts):
  - ✓ Module admin export đúng các tên `fields` (`lecture-builder`) và `pages` (`/lessons`, `/import-obsidian`).
  - ✓ Plugin descriptor khai báo đúng ID, capabilities, blocks và routes.

### 2.2. Kiểm Tra Lint & Typecheck
- `pnpm lint:quick` / `pnpm lint:json`: **0 diagnostics** (sạch 100%).
- `pnpm typecheck`: Các package `@duongsinh/chess-kit`, `@duongsinh/plugin-chess-lessons`, `@duongsinh/plugin-chess-puzzles`, `@duongsinh/plugin-chessfenpgn`, `emdash-lms` đều đã được kiểm tra typecheck thành công (`Done`).
- `pnpm format`: Định dạng chuẩn toàn bộ codebase.

---

## 3. Chỗ Lệch So Với Kế Hoạch & Lý Do
- **Không có lệch tiêu cực**: Plugin tuân thủ 100% các tiêu chí đặt ra trong kế hoạch v3 và prompt GĐ6.
- **Cải tiến bảo mật**: Triển khai cơ chế bảo mật hai lớp cho `teacherNotes` (lớp 1 tại hook `content:beforeSave` cho Portable Text snapshot, lớp 2 tại server-side rendering của `LecturePresenter.astro`).

---

## 4. Việc Tồn Đọng Chuyển Sang Giai Đoạn 7 (GĐ7)
1. Đăng ký `@duongsinh/plugin-chess-lessons` vào `demos/cloudflare/astro.config.mjs` cùng các plugin đã hoàn thiện (`emdash-lms`, `chessfenpgn`, `chess-puzzles`).
2. Thiết lập các trang Astro giao diện công khai trên `demos/cloudflare`:
   - `/bai-giang/[slug]`: Trang xem bài giảng độc lập.
   - `/bai-giang/[slug]/trinh-chieu`: Trang trình chiếu bài giảng toàn màn hình.
   - `/cau-do` & `/cau-do/[slug]`: Trang ngân hàng câu đố cờ vua.
3. Kiểm thử tổng thể trải nghiệm người dùng cuối (Khách, Học viên, Huấn luyện viên) trên môi trường D1 replica và hoàn thiện tài liệu bàn giao.

---

## 5. Runbook Triển Khai Cho Thầy (Khi Cần Kích Hoạt Trên Production)

> **Lưu ý:** Giai đoạn này chỉ thêm mã nguồn plugin và test nội bộ, chưa sửa site `demos/cloudflare`. Khi bước vào GĐ7, Thầy có thể triển khai theo các bước sau:

1. **Thêm plugin vào cấu hình `demos/cloudflare/astro.config.mjs`**:
   ```javascript
   import { chessLessonsPlugin } from "@duongsinh/plugin-chess-lessons";
   // ...
   export default defineConfig({
     plugins: [
       // ...
       chessLessonsPlugin(),
     ],
   });
   ```
2. **Triển khai lên Cloudflare Workers Preview**:
   ```bash
   pnpm --filter @emdash-cms/demo-cloudflare build
   ```
3. **Kích hoạt đồng bộ CSDL Idempotent**:
   - Đăng nhập vào trang Quản trị: `https://covuahocduong.com/_emdash/admin/lessons`.
   - Nhấp nút **"Cài đặt CSDL (Setup)"** để tạo bảng `ec_chess_lectures` và bổ sung các trường cờ vua cho `courses`/`lessons`.
   - (Tùy chọn) Nhấp **"Khung lộ trình 6 cấp"** hoặc **"Tạo bài học mẫu"** để sinh dữ liệu giáo trình chuẩn.
