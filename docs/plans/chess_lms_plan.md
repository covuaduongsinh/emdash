# Kế hoạch v2: Bộ plugin cờ vua trên nền emdash-lms (Dương Sinh Chess Suite)

> Cập nhật 2026-10-09. Nền LMS là bản fork của [tohaitrieu/emdash-lms](https://github.com/tohaitrieu/emdash-lms), thay cho `@emdashlms/plugin` của bản v1. Prompt triển khai: [chess_lms_prompts.md](chess_lms_prompts.md).

## 1. Bối cảnh

Thầy Tường dùng plugin **emdash-lms** của Tô Triều (`github.com/tohaitrieu/emdash-lms`, MIT) cho site `demos/cloudflare` (worker `covuahocduong`).
- Repo này hiện **chưa có** emdash-lms: không có trong `package.json` hay `astro.config.mjs` của demo nào, và cũng chưa được commit.
- Bản trên npm là `0.1.0` (05/04/2026), chưa có các trang Astro.
- Bản GitHub `0.2.0` (commit `5ce68d1`, 06/04/2026) chỉ có `src`, không có `dist`. Cài thẳng từ git sẽ không import được vì `exports` trỏ vào `dist`.

**Mục tiêu:** biến emdash-lms thành nền tảng dạy cờ vua theo lộ trình 6 cấp Tốt → Mã → Tượng → Xe → Hậu → Vua, có sơ đồ FEN, ván cờ PGN, câu đố, bài học, bài giảng và quiz có câu hỏi cờ.

### 1.1 emdash-lms có gì (đã đọc toàn bộ mã nguồn)

**Plugin**
- Native, id `lms`. Hàm `lmsPlugin({ mode: "membership" | "lms" | "full", checkout, currency })`.
- `lmsIntegration({ layout, basePath, styles })` gắn sẵn 5 trang: `/courses`, `/course/[slug]`, `/lesson/[slug]`, `/plans`, `/checkout/[id]`.

**Mô hình dữ liệu** (collection nội dung khai báo trong `seed/seed.json`)
- **Nội dung học:**
  - `courses`: title, excerpt, description, featured_image, content (PT), category_id, prerequisite_id, access_level free/membership/purchase, price, difficulty…
  - `modules`: title, course_id, sort_order.
  - `lessons`: title, module_id, course_id, content (PT), summary (PT), video_url, duration_minutes, sort_order, is_preview, prerequisite_id, resources.
  - `quizzes`: lesson_id, passmark, timer_minutes, grade_type…
  - `questions`: quiz_id, question, type single/multiple/text/fill_blank, answers (json), grade, explanation.
- **Học viên:** `enrollments`, `lesson_progress`, `quiz_submissions`, `certificates` + `certificate_templates`, `course_reviews`.
- **Bán hàng:** `membership_plans`, `memberships`, `orders`, `coupons`.

**Thanh toán:** Sepay (QR chuyển khoản Việt Nam) và Stripe theo adapter `registerProvider()`.

### 1.2 Lỗi đã kiểm chứng khi chạy trên EmDash 0.36 của repo

| # | Lỗi | Bằng chứng |
|---|---|---|
| L1 | **Mọi API route đều lỗi.** Handler viết `(ctx, input)`, nhưng EmDash gọi `route.handler(routeContext)` với 1 tham số. `input` luôn `undefined`, nên destructure ném TypeError | `src/routes/*.ts` ↔ `packages/core/src/plugins/routes.ts:243` |
| L2 | **Admin không hiện trang nào.** Plugin dùng `export default { pages }`, còn EmDash dùng `import * as` và đọc export tên `pages`. Các trang vốn cũng chỉ là khung trống | `src/admin.tsx` ↔ `virtual-modules.ts:345` |
| L3 | Route học viên (`access`, `checkout`) không khai `permission` nên mặc định cần `plugins:manage`. Học viên không gọi được | `src/index.ts` |
| L4 | `access` nhận `userId` từ body request: xem được quyền của người khác (IDOR) | `src/routes/access.ts` |
| L5 | **Webhook Sepay giả được.** Bỏ qua xác thực khi không có secret, và đoạn HMAC bị comment | `src/providers/sepay.ts:132-142` |
| L6 | Route `"webhook/:providerId"`: router EmDash không hỗ trợ tham số đường dẫn | `src/index.ts` |
| L7 | Trang `/lesson/[slug]` **không kiểm tra quyền truy cập**: bài trả phí ai cũng xem được. Trang cũng không có tiến độ hay quiz | `src/pages/lesson/[slug].astro` |
| L8 | Trang course/lesson tải **toàn bộ** courses, modules, lessons mỗi request (3 query) rồi lọc bằng JS. Route cũng `ctx.content.list` toàn bộ rồi lọc theo `user_id` | pages, `access.ts` |
| L9 | Field `string` + `options.choices` không phải cú pháp của EmDash. Cách đúng là `type: "select"` + `validation.options`, nên admin đang hiện ô nhập tự do | `seed/seed.json` ↔ `schema/types.ts:157` |
| L10 | Capability dùng tên cũ (`read:content`…); `definePlugin(... as any)`; không có test | `src/index.ts` |

**Phần dùng tốt:**
- mô hình dữ liệu LMS đầy đủ, hợp với Dương Sinh (khóa → chương → bài → quiz, ghi danh, chứng chỉ, hội viên);
- adapter Sepay;
- cơ chế layout/override trang;
- CSS variables.

### 1.3 Plugin `chessfenpgn` đã có trong repo
- PT block `chess-fen`/`chess-pgn`, widget `chess-board` (chỉ lưu FEN), trang `/editor` không có trên sidebar.
- Không có test.
- Lỗi: PGN có `[FEN]` hiển thị sai thế xuất phát.

### 1.4 Ràng buộc của EmDash (đã kiểm chứng)
1. Form PT block chỉ là Block Kit (text, number, select, toggle, repeater, media_picker). **Không nhúng được bàn cờ kéo thả vào form block.** Dữ liệu phức tạp soạn ở widget React hoặc trang admin; block chỉ chọn theo id (`select` + `optionsRoute`).
2. Plugin không gọi được storage hay route của plugin khác. Các cách nối: collection nội dung dùng chung (`ctx.content`), sự kiện DOM, thư viện chung.
3. `content:beforeSave` (cần `content:read` + `content:write`) sửa được dữ liệu trước khi lưu. Dùng nó để snapshot câu đố/bài giảng vào block, nhờ vậy trang công khai **không thêm query**.
4. Quyền route:
   - mặc định `plugins:manage`;
   - route cho biên tập: `permission: "content:create"`;
   - route cho học viên đăng nhập: `permission: "content:read"` + `ctx.user` (do host xác thực; tuyệt đối không lấy userId từ body);
   - route công khai: `public: true`, khi đó không có `ctx.user`.
5. Trang công khai đọc người dùng qua `Astro.locals.user`. Học viên là role Subscriber, tạo bằng lời mời của HLV hoặc tự đăng ký theo tên miền cho phép.
6. Trang admin chỉ hiện trên sidebar khi khai trong `definePlugin({ admin: { pages } })`. Module admin phải export **tên** `pages`/`fields`.
7. Có sẵn `markdownToPortableText` (`emdash/client`) và `SchemaRegistry` (`emdash`).
8. Plugin trong `packages/plugins/*` không dùng Lingui. Chuỗi tiếng Việt gom vào từ điển của `chess-kit`.

## 2. Quyết định đã chốt với Thầy

| Hạng mục | Quyết định |
|---|---|
| Nền LMS | **Fork emdash-lms vào repo** (`packages/plugins/lms`), giữ id `lms`, tên package `emdash-lms` và schema, rồi sửa lỗi và mở rộng. Giữ LICENSE và ghi công tác giả |
| Site đích | `demos/cloudflare` (covuahocduong) |
| Plugin cờ | 1 thư viện + 3 plugin cờ (cộng thêm bản fork LMS) |
| Tiến độ | **Hai lớp.** Khách: lưu trình duyệt. Học viên đăng nhập: lưu tài khoản (`lesson_progress`, `enrollments`), HLV xem được. Khi đăng nhập thì gộp dữ liệu trình duyệt lên tài khoản |
| Bán hàng | Sepay, hội viên, chứng chỉ: **giai đoạn sau**. Trong lộ trình chính chạy `mode: "lms"` và **tắt checkout** (không đăng ký route checkout/webhook) |
| Ký hiệu | Lưu chuẩn quốc tế; hiển thị tiếng Việt V/H/X/T/M mặc định, có nút chuyển sang quốc tế |

## 3. Kiến trúc

```
packages/chess-kit              @duongsinh/chess-kit, thư viện (không phải plugin)
  core / react / progress / i18n / theme.css

packages/plugins/lms            emdash-lms (fork, id "lms"), LMS lõi của Dương Sinh
  khóa–chương–bài, quyền truy cập, ghi danh, tiến độ 2 lớp, quiz builder + chấm điểm,
  loại câu hỏi "chess" (chấm bằng chess-kit/core), các trang /khoa-hoc /bai-hoc

packages/plugins/chessfenpgn    giữ id và tên, nâng cấp: sơ đồ FEN + ván PGN + trang "Bàn cờ"

packages/plugins/chess-puzzles  @duongsinh/plugin-chess-puzzles: kho câu đố, widget soạn,
                                block chess-puzzle, trình nhập PGN/EPD/Lichess CSV

packages/plugins/chess-lessons  @duongsinh/plugin-chess-lessons: field cờ cho khóa/bài, bài giảng
                                + trình chiếu, khung 6 cấp, nhập từ Obsidian, dữ liệu mẫu
```

**Phụ thuộc**
- Mọi package dùng `chess-kit`.
- Các plugin cờ **không import lẫn nhau**, cũng không import LMS.
- Các plugin giao tiếp qua:
  - collection nội dung (`lessons.content` chứa block cờ),
  - **giao thức "yêu cầu hoàn thành" trên DOM** (mục dưới).

**Giao thức "yêu cầu hoàn thành"** (LMS cung cấp, plugin cờ dùng)
- Block nào cần hoàn thành mới qua bài thì render `data-lms-requirement="<id>"` và phát `window` event `lms:requirement-done` (detail `{ id }`).
- Trang bài học của LMS đếm số yêu cầu. Khi đủ, LMS đánh dấu hoàn thành:
  - học viên đăng nhập: gọi route;
  - khách: lưu localStorage.
- Block `chess-puzzle` cũng phát thêm `duongsinh-chess:puzzle-solved` cho các mục đích khác.

**Nguyên tắc chung**
- Hằng số 6 cấp (`tot, ma, tuong, xe, hau, vua`) và danh mục chủ đề nằm trong `chess-kit/core`.
- Chỉ thêm field (additive). Không đổi id, tên block hay tên field đã có.
- Package mới `"private": true`, nên chưa cần changeset.
- Fork giữ `LICENSE` gốc và thêm `NOTICE.md` ghi nguồn (repo, commit `5ce68d1`) cùng danh sách thay đổi.

## 4. Các giai đoạn

Mỗi giai đoạn chạy 1 phiên, kết thúc bằng commit + push và báo cáo `docs/plans/report_chess_phaseN.md`.

### GĐ0: Nền móng, đưa emdash-lms vào repo
- `pnpm install`, `pnpm build`, `pnpm lint:json` trên Linux. Đường dẫn Windows `file:///C:/...` trong `packages/registry-verification/tsdown.config.ts` (commit 835e98d): nếu làm hỏng build thì sửa cho đa nền tảng.
- Chép mã emdash-lms từ GitHub `main` (`5ce68d1`) vào `packages/plugins/lms`.
  - `exports` trỏ thẳng `src` theo quy ước của `packages/plugins/forms/package.json`.
  - Thêm `tsconfig.json` + `vitest.config.ts`, `"private": true`, `NOTICE.md`.
- **Viết test thất bại để ghi nhận lỗi** (chưa sửa ở GĐ0): L1 (route ném lỗi) và L2 (admin không có export `pages`).
- Gắn vào `demos/cloudflare`:
  - `"emdash-lms": "workspace:*"`;
  - `lmsPlugin({ mode: "lms", checkout: { enabled: false } })`;
  - `lmsIntegration({ layout: <layout DSC hiện có> })`;
  - `chessfenpgnPlugin()`.
  - Nếu máy Thầy đã có emdash-lms cài ngoài, thay bằng bản workspace.
- Chạy dev bằng dev-bypass. Nạp schema của LMS (seed của gói, hoặc tạo tay nếu chưa có setup) rồi tạo 1 khóa / 1 chương / 1 bài. Ghi lại từng lỗi L1–L10 thấy được, kèm ảnh chụp.

### GĐ1: Thư viện `@duongsinh/chess-kit` (`packages/chess-kit`)

**`core`** (không DOM, chạy được trên Workers)
- `parseFen`/`validateFen`.
- `parsePgn`: header, mainline, comment, NAG, biến; hỗ trợ `[SetUp]`/`[FEN]`.
- `replayPositions`.
- `sanToVi`/`viToSan`; `uciToSan`/`sanToUci`.
- `parseArrows`, `parseSquares`.
- `checkPuzzleMove`: nếu nước cuối của lời giải là chiếu hết thì chấp nhận mọi nước chiếu hết.
- `gradeChessAnswer(question, moves)` dùng cho quiz.
- `LEVELS`, `THEMES`.

**`react`**
- `Board` (orientation, mũi tên, ô sáng, size, theme).
- `PgnViewer` (comment, biến thu gọn, header, phím ←→↑↓, lật bàn, nút VN/quốc tế, mobile).
- `PositionEditor`, `MoveRecorder`, `PuzzlePlayer`, `LecturePlayer`.

**`progress`**
- Key `duongsinh-chess:progress:v1`, dạng `{ puzzles, lectures, lessons }`.
- Zod, có giới hạn, try/catch, export/import JSON.
- Có hàm `drainForSync()` để LMS gộp lên tài khoản.

**`i18n`, `theme.css`:** navy `#2B3990` + gold, Roboto, màu bàn đủ tương phản.

**Test vitest (viết trước):** PGN có `[FEN]`, comment/NAG/biến, ký hiệu hai chiều, mate thay thế, chấm câu hỏi cờ, giới hạn của progress.

### GĐ2: Ổn định LMS (fork `packages/plugins/lms`)

**Sửa lỗi theo TDD**
- L1: handler dùng 1 `RouteContext`, input khai bằng Zod, lỗi trả bằng `PluginRouteError`.
- L2: export tên `pages`. Trang admin viết bằng Kumo.
- L10: capability dùng tên mới, bỏ `as any`.
- L9: đổi các field `string`+`choices` sang `select` + `validation.options`. Cùng kiểu cột TEXT nên an toàn với dữ liệu cũ.

**Route `setup/run`** (`schema:manage`)
- Converge schema từ định nghĩa trong code bằng `SchemaRegistry`, idempotent.
- Chạy lại không mất field tùy chỉnh.
- Thay cho việc phải nạp seed bằng tay.

**Phân quyền route**
- Route quản trị (plans/members/orders, quản lý ghi danh) giữ mặc định hoặc dùng `content:edit_any`.
- Route học viên dùng `permission: "content:read"` và **chỉ** dùng `ctx.user.id`, sửa L3 và L4:
  - `me/access`
  - `me/enroll` (khóa free)
  - `progress/complete`
  - `progress/sync` (gộp localStorage lên tài khoản)
  - `me/progress`
- Truy vấn dùng `where.fieldFilters` + phân trang, không list toàn bộ (sửa L8).

**Tắt bán hàng khi `checkout.enabled === false`**
- Không đăng ký route `checkout` và `webhook/*`.
- Ẩn trang Plans/Orders.
- Đổi tên route webhook thành tên cố định (`webhook/sepay`, `webhook/stripe`) để sửa L6. Phần xác thực Sepay (L5) làm ở GĐ8.

**Trang front-end** (sửa L7, L8)
- `lmsIntegration` thêm tùy chọn `routes` (additive). Dùng tùy chọn này để đặt `/khoa-hoc`, `/khoa-hoc/[slug]`, `/bai-hoc/[slug]`.
- Trang khóa học: lấy đúng 1 khóa theo slug, rồi chương và bài của khóa đó bằng filter. Bọc helper bằng `requestCached`. **Tối đa 3 query.**
- Trang bài học:
  - Kiểm tra quyền phía server: `access_level` free hoặc `is_preview` thì cho xem. Ngược lại cần `Astro.locals.user` + ghi danh, nếu không chỉ hiện phần giới thiệu và nút kêu gọi.
  - Khách ẩn danh không phát sinh query kiểm tra quyền.
  - Thanh tiến độ, nút "Hoàn thành bài", và giao thức "yêu cầu hoàn thành".
- Toàn bộ chuỗi giao diện tiếng Việt.

**Admin**
- "Cài đặt LMS": Setup, trạng thái schema.
- "Học viên": danh sách ghi danh và tiến độ; ghi danh tay bằng email (cần `users:read`).
- "Cài đặt".

**Test:** route (quyền, IDOR), setup chạy idempotent, kiểm tra quyền truy cập bài học, gộp tiến độ. Integration test dùng `setupTestDatabase`.

### GĐ3: Quiz của LMS (có câu hỏi cờ)

**Schema `questions`** (additive)
- Thêm lựa chọn `chess` cho `type`.
- Với câu `chess`, `answers` có dạng `{ fen, solution: UCI[], orientation, prompt }`.

**Trang admin "Soạn quiz"** (React + Kumo)
- Soạn quiz cùng các câu hỏi trên một màn hình qua route quản trị.
- Giao diện đổi theo loại câu hỏi.
- Câu `chess` dùng `PositionEditor` + `MoveRecorder`, có thể chép từ kho câu đố (gọi route `puzzles/options` của chess-puzzles nếu plugin đó đang bật).

**Hai route chấm bài**
- `quiz/present`: public, **loại bỏ đáp án**.
- `quiz/submit`:
  - Chấm phía server; câu cờ chấm bằng `chess-kit/core` (`gradeChessAnswer`).
  - Học viên đăng nhập thì lưu vào `quiz_submissions`. Khách chỉ nhận điểm, không lưu.
  - Chạy dưới 2 dạng route: public cho khách và `content:read` cho học viên.
- Có `passmark`, `timer_minutes`, `allow_reset`, `random_order`.

**PT block `lms-quiz`** (chọn quiz qua `optionsRoute`)
- Render island `QuizRunner`; câu cờ dùng `PuzzlePlayer`.
- Khi đạt passmark thì phát `lms:requirement-done`.

**Test:** chấm từng loại câu hỏi, `present` không lộ đáp án, giới hạn quyền.

### GĐ4: Nâng cấp `chessfenpgn` (FEN + PGN)
- Giữ id `chessfenpgn`, block `chess-fen`/`chess-pgn`, field `fen`/`pgn`, widget `chess-board`. Chỉ thêm field tùy chọn.
- Dùng `chess-kit`, viết test hồi quy cho lỗi `[FEN]`.
- Field Block Kit mới:
  - `chess-fen`: orientation, caption, arrows, highlights, size;
  - `chess-pgn`: orientation, startPly, showHeaders, caption;
  - `category: "Cờ vua"`.
- Widget `chess-board` hỗ trợ `options.mode: "fen" | "pgn"`, vẫn đọc được chuỗi FEN cũ.
- Trang "Bàn cờ": khai trong `admin.pages`; có `PositionEditor`, kiểm tra PGN, các nút copy.
- Đóng gói: tsconfig, vitest, README tiếng Việt; thêm peer astro, bỏ peer `@phosphor-icons/react`; bỏ div debug.

### GĐ5: Plugin `chess-puzzles` (Câu đố)

**Collection `chess_puzzles`**
- Tạo qua `setup/run`. `urlPattern`: `/cau-do/{slug}`. `supports`: drafts, revisions, search.
- Field: `title`, `puzzle` (json + widget `chess-puzzles:puzzle-editor`, dạng `{fen, solution, orientation}`), `prompt`, `level`, `themes`, `rating`, `hint`, `explanation` (PT), `source`.

**Widget `puzzle-editor`:** xếp thế, ghi lời giải (gồm nước đáp), chạy thử.

**PT block `chess-puzzle`**
- `puzzle` (select, `optionsRoute: "puzzles/options"`, `permission: "content:create"`).
- Các field nhập nhanh: `fen`, `solution`, `prompt`, `hint`.

**Hook `content:beforeSave`:** snapshot câu đố đã xuất bản vào node. Route `snapshots/refresh` làm mới theo trang.

**Front-end**
- `PuzzleBlock.astro` render island `PuzzlePlayer`, chỉ đọc dữ liệu đã snapshot (0 query).
- Render `data-lms-requirement`; khi giải xong thì phát `lms:requirement-done` và `duongsinh-chess:puzzle-solved`, đồng thời ghi progress.
- Export `PuzzlePage.astro` và `PuzzleOfTheDay.astro`.

**Admin**
- "Câu đố": tổng quan theo cấp, Setup.
- "Nhập câu đố": PGN, EPD, CSV Lichess (CC0, tối đa 500 câu/lô). Tạo bản nháp theo lô khoảng 50, báo dòng lỗi.

**Settings:** hướng bàn mặc định, số lần sai trước khi được xem lời giải, có hiện rating hay không.

**Test:** các parser, snapshot (integration), quyền của `puzzles/options`.

### GĐ6: Plugin `chess-lessons` (Bài học cờ, Bài giảng)

**Setup** (additive, trên collection của LMS)
- `courses`: `level`, `sessions`, `age_range`.
- `lessons`: `level`, `themes`, `objectives`.
- Nếu chưa có collection của LMS thì báo cần chạy LMS Setup trước.

**Các nút trên trang admin**
- "Khung lộ trình 6 cấp": 6 khóa nháp Tốt → Vua, mỗi khóa có chương mẫu.
- "Bài học mẫu": Khởi động (câu chuyện) → Kiến thức mới → Thực hành (câu đố) → Kiểm tra (`lms-quiz`) → Bài tập về nhà.
- "Nạp dữ liệu mẫu": 1 khóa Cấp Tốt, 3 bài, 1 bài giảng, 1 quiz; thêm 10 câu đố nếu collection `chess_puzzles` có sẵn.

**Bài giảng: collection `chess_lectures`** (`/bai-giang/{slug}`)
- Field `title`, `level`, `course` (tùy chọn), `summary`.
- Field `script`: json + widget `lecture-builder`, gồm các bước `{fen | {pgn, ply}, arrows, highlights, narration, teacherNotes, question?}`.
- PT block `chess-lecture`: snapshot qua `beforeSave`, **bỏ `teacherNotes`**; front-end render `LecturePlayer`.
- `LecturePresenter.astro` cho trang `/bai-giang/[slug]/trinh-chieu`:
  - toàn màn hình, PageUp/PageDown/←/→, phím B tắt màn hình, đồng hồ;
  - `teacherNotes` chỉ render phía server khi người dùng có vai trò ≥ Contributor.

**Nhập từ Obsidian**
- Đầu vào: một hoặc nhiều file `.md`, frontmatter gồm `title`, `course`, `module`, `order`, `level`, `themes`, `objectives`.
- Body chuyển bằng `markdownToPortableText`. Code fence `fen`/`pgn`/`puzzle`/`lecture` được đổi thành block cờ.
- Tạo bài học **nháp**, điền `course_id`, `module_id`, `sort_order`.
- Cảnh báo các `![[wikilink]]`. Viết quy ước Markdown cho vault OBSIDIAN2026 vào README.

**Test:** chuyển Markdown → PT, snapshot không lộ `teacherNotes`, setup chạy idempotent và không xóa field của LMS.

### GĐ7: Tích hợp site `demos/cloudflare` và kiểm chứng toàn bộ

**Đăng ký plugin:**

```js
plugins: [
  formsPlugin(),
  aiSearch(...),
  lmsPlugin({ mode: "lms", checkout: { enabled: false } }),
  chessfenpgnPlugin(),
  chessPuzzlesPlugin(),
  chessLessonsPlugin(),
]
```

Kèm `lmsIntegration({ layout, routes: Vietnamese })`.

**Trang:** `/khoa-hoc`, `/khoa-hoc/[slug]`, `/bai-hoc/[slug]` (từ LMS), `/cau-do`, `/cau-do/[slug]`, `/bai-giang/[slug]`, `/bai-giang/[slug]/trinh-chieu`.

**Giao diện:** CSS variables của LMS ở chế độ `styles: "theme"` + `theme.css` của chess-kit, đúng nhận diện Dương Sinh, chạy tốt trên mobile.

**Kiểm chứng:** `pnpm query-counts`; agent-browser trên desktop và mobile, cả khách và học viên/HLV đăng nhập; chụp ảnh. Không deploy production.

### GĐ8 (để sau): Bán hàng
- Sửa xác thực webhook Sepay (L5): HMAC/Bearer bắt buộc, không bỏ qua khi thiếu secret.
- Bật checkout, gói hội viên, coupon, đơn hàng; khóa học trả phí; chứng chỉ PDF.
- Kiểm thử bằng sandbox Sepay.

### GĐ9 (để sau): Công cụ HLV
- Bảng điều khiển theo lớp/học viên, thống kê độ khó câu đố, bảng xếp hạng.
- MCP tool nhập câu đố/bài học từ Claude Desktop.
- Cân nhắc chuyển dữ liệu giao dịch (orders, progress) sang plugin storage.

## 5. Quy tắc bắt buộc (theo `CLAUDE.md`)
- Kiểm tra lint:
  - trước khi sửa: `pnpm lint:json | jq '.diagnostics | length'` phải sạch;
  - sau mỗi lần sửa: `pnpm lint:quick`;
  - sau mỗi đợt sửa: typecheck.
- Định dạng bằng `pnpm format`.
- Sửa lỗi theo TDD.
- Không sửa `packages/core`/`packages/admin`. Nếu cần, dừng lại hỏi Thầy.
- Không thêm query cho trang công khai của khách. Dùng snapshot và `requestCached`.
- Admin dùng Kumo và class Tailwind logic. Comment chỉ nói "vì sao".
- Không commit `messages.po`.
- Không dùng chessground (GPL). Dùng chess.js (BSD-2), react-chessboard (MIT), dữ liệu Lichess (CC0).
- Gửi bản sửa ngược về repo `tohaitrieu/emdash-lms` (issue/PR) **chỉ khi Thầy đồng ý**.

## 6. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Fork lệch upstream | Ghi rõ commit gốc và danh sách thay đổi trong `NOTICE.md`; gửi bản sửa về upstream nếu Thầy muốn |
| Dữ liệu LMS Thầy đã tạo (nếu có) | Giữ id, tên collection và field; chỉ thêm; L9 đổi `string`→`select` cùng kiểu cột |
| Route học viên mở ra là bề mặt tấn công | Chỉ dùng `ctx.user.id`; có test IDOR; checkout/webhook tắt cho tới GĐ8 |
| Block PT không kéo thả được | Soạn ở widget/trang admin, block chọn theo id, snapshot khi lưu |
| Snapshot cũ | Lưu lại bài, hoặc chạy route `snapshots/refresh` |
| React island nặng | `client:visible`, đo bundle |
| Đường dẫn Windows trong tsdown | Sửa ở GĐ0 nếu làm hỏng build |

## 7. Kiểm chứng tổng thể (cuối GĐ7)
1. `pnpm build`, typecheck, `pnpm lint:json` đều sạch. Test của `chess-kit`, `lms`, `chessfenpgn`, `chess-puzzles`, `chess-lessons` đều pass.
2. Chạy `pnpm --filter @emdash-cms/demo-cloudflare dev`, vào bằng dev-bypass, rồi chạy lần lượt: LMS Setup → Câu đố Setup → Bài học cờ Setup → Nạp dữ liệu mẫu.
3. Soạn một bài có `chess-fen`, `chess-pgn` (có `[FEN]`), `chess-puzzle`, `chess-lecture`, `lms-quiz` (có câu cờ).
4. Ở chế độ khách: xem bài free, giải hết câu đố và quiz thì bài được đánh dấu hoàn thành trong trình duyệt. Bài trả phí chỉ hiện phần giới thiệu.
5. Đăng nhập học viên: tiến độ trình duyệt được gộp lên tài khoản, trang "Học viên" trong admin thấy được tiến độ. Gọi route với `userId` của người khác thì bị từ chối.
6. Trang trình chiếu: khách không thấy ghi chú HLV, HLV thì thấy.
7. `pnpm query-counts`: trang công khai không tăng query, hoặc có giải trình.

