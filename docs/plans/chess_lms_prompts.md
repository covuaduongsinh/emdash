# Bộ prompt triển khai: Dương Sinh Chess Suite

Đi kèm kế hoạch [chess_lms_plan.md](chess_lms_plan.md). Mỗi giai đoạn chạy trong **một phiên Claude Code mới** để không bị quá tải ngữ cảnh.

## Cách dùng

1. **Trước phiên đầu tiên:** merge nhánh `claude/vigilant-mccarthy-jfjram` (chứa kế hoạch này) vào `main`, hoặc mở phiên mới ngay trên nhánh đó.
2. Mở phiên mới, dán **Prompt chung** rồi tới **Prompt giai đoạn N** ngay bên dưới, trong cùng một tin nhắn.
3. Chạy đúng thứ tự 0 → 1 → 2 → 3 → 4 → 5. Khi xong một giai đoạn, đọc `docs/plans/report_chess_phaseN.md` rồi merge nhánh của phiên đó vào `main` trước khi mở phiên tiếp theo.
4. Nếu phiên dừng lại hỏi, trả lời rồi bảo nó làm tiếp. Không chuyển sang giai đoạn sau khi giai đoạn trước còn việc dở.
5. Tùy chọn: sau mỗi giai đoạn, chạy **Prompt kiểm tra chéo** trong một phiên khác.

---

## Prompt chung (dán đầu mỗi phiên)

```text
Bạn đang làm cho Thầy Tường (Công ty CP Cờ vua Dương Sinh). Trả lời bằng tiếng Việt, đi thẳng vào việc.

DỰ ÁN: bộ plugin cờ vua "Dương Sinh Chess Suite" cho EmDash CMS, gắn với plugin LMS @emdashlms/plugin (id lms-core). Site đích là demos/cloudflare (worker covuahocduong).

TRƯỚC KHI LÀM:
1. Nếu chưa có docs/plans/chess_lms_plan.md thì chạy `git fetch origin claude/vigilant-mccarthy-jfjram` và merge nhánh đó vào nhánh làm việc.
2. Đọc kỹ:
   - .claude/CLAUDE.md (quy tắc repo, bắt buộc tuân thủ)
   - docs/plans/chess_lms_plan.md (kế hoạch tổng)
   - mọi file docs/plans/report_chess_phase*.md đã có (báo cáo của các giai đoạn trước)
3. Nạp skill `creating-plugins`. Docs của skill lệch code ở vài chỗ:
   - definePlugin bắt buộc có id;
   - không có usePluginAPI, dùng apiFetch/parseApiResponse từ "emdash/plugin-utils";
   - route plugin mặc định là private (cần plugins:manage) trừ khi khai báo permission hoặc public.
   Khi docs và code lệch nhau thì tin code (packages/core/src/plugins/*) và docs/src/content/docs/plugins/**.
4. Xác nhận các giai đoạn trước đã có trong code đúng như báo cáo. Thiếu thì dừng lại báo Thầy.
5. Chạy `pnpm install` rồi `pnpm lint:json | jq '.diagnostics | length'` và ghi lại con số ban đầu.

TRONG KHI LÀM:
- Chỉ làm đúng phạm vi của giai đoạn được giao bên dưới. Không refactor ngoài phạm vi.
- Không sửa packages/core hoặc packages/admin. Nếu thật sự cần thì dừng lại hỏi Thầy.
- Sửa lỗi theo TDD: viết test thất bại → sửa → chạy lại cho pass.
- Sau mỗi lần sửa: `pnpm lint:quick`. Sau mỗi đợt sửa: typecheck package liên quan.
- Trước khi commit: `pnpm format`.
- Admin UI: dùng component Kumo, class Tailwind logic (ms-/me-/ps-/pe-/start-/end-), không dùng `dark:`.
- Chuỗi giao diện gom vào từ điển i18n của @duongsinh/chess-kit, tiếng Việt mặc định.
- Trang công khai không được thêm query DB. Dùng snapshot qua content:beforeSave và requestCached.
- Lưu FEN/SAN/UCI chuẩn quốc tế. Ký hiệu tiếng Việt (V/H/X/T/M) chỉ là lớp hiển thị.
- Thư viện: chess.js, react-chessboard 4.x. KHÔNG dùng chessground (GPL).
- Comment chỉ để giải thích "vì sao" không hiển nhiên. Không nhắc tới issue/PR/giai đoạn trong comment.
- Không đưa thay đổi messages.po vào commit.
- Bị chặn thật sự thì hỏi Thầy đúng 1 câu, có kèm phương án đề xuất.

KẾT THÚC PHIÊN:
1. Viết docs/plans/report_chess_phaseN.md (N là số giai đoạn), gồm:
   - đã làm gì (kèm đường dẫn file),
   - lệnh kiểm chứng đã chạy và kết quả thật (pass/fail, số liệu),
   - chỗ lệch so với kế hoạch và lý do,
   - việc còn tồn đọng,
   - ghi chú bàn giao cho giai đoạn sau.
2. Commit theo Conventional Commits rồi push lên nhánh làm việc của phiên. Không tạo PR trừ khi Thầy yêu cầu.
3. Tóm tắt cho Thầy trong 5–10 dòng và nói rõ giai đoạn tiếp theo cần chuẩn bị gì.
```

---

## Prompt Giai đoạn 0: Nền móng và kiểm tra tương thích

```text
GIAI ĐOẠN 0: NỀN MÓNG VÀ KIỂM TRA TƯƠNG THÍCH (xem mục 4 "Giai đoạn 0" trong docs/plans/chess_lms_plan.md)

Mục tiêu: chứng minh LMS @emdashlms/plugin chạy được trên EmDash của repo này, và site demos/cloudflare đã sẵn sàng nhận các plugin cờ.

Việc cần làm:
1. Chạy `pnpm build` trên Linux.
   - Kiểm tra packages/registry-verification/tsdown.config.ts: có chuỗi `file:///C:/...` từ commit 835e98d.
   - Nếu chuỗi này làm hỏng build hoặc test thì sửa lại cho đa nền tảng, rồi chứng minh bằng build trước và sau khi sửa.
2. Thêm "@emdashlms/plugin" vào demos/cloudflare/package.json.
   - Đọc README/package.json của gói để lấy đúng tên export, vd. `lmsCorePlugin` từ "@emdashlms/plugin".
   - Thêm `lmsCorePlugin()` vào mảng `plugins` trong demos/cloudflare/astro.config.mjs.
   - Ghi lại cảnh báo peer dependency: LMS khai báo emdash ^0.31.1, repo đang ở 0.36.0.
3. Thêm "@emdash-cms/plugin-chessfenpgn": "workspace:*" và `chessfenpgnPlugin()` vào demos/cloudflare.
4. Chạy `pnpm --filter @emdash-cms/demo-cloudflare dev`, mở http://localhost:4321/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin, rồi:
   a. chạy Learn → Setup và ghi kết quả;
   b. tạo 1 khóa học và 1 bài học, chèn 1 block chess-fen và 1 block learnKnowledgeCheck;
   c. xem trang ngoài site (nếu chưa có trang khóa học thì kiểm tra qua API /_emdash/api/plugins/lms-core/catalog);
   d. thêm thử 1 field tùy chỉnh vào collection lessons, chạy lại Learn → Setup, xác nhận field đó vẫn còn (Giai đoạn 4 cần điều này).
5. Dùng skill agent-browser để chụp ảnh admin LMS và block chess-fen, lưu vào docs/plans/assets/chess-phase0/.

Tiêu chí hoàn thành:
- [ ] Build trên Linux sạch, hoặc đã ghi rõ lỗi có từ trước, không do mình gây ra.
- [ ] LMS cài được và Setup chạy OK trên emdash 0.36 (hoặc có báo cáo lỗi chi tiết).
- [ ] chessfenpgn render được trong demos/cloudflare.
- [ ] Đã xác nhận Learn Setup có giữ field tùy chỉnh hay không.
- [ ] Đã viết docs/plans/report_chess_phase0.md.

ĐIỂM DỪNG BẮT BUỘC: nếu LMS không chạy được trên emdash 0.36 thì KHÔNG tự patch. Ghi lỗi, đề xuất 2 phương án (pnpm patch trong thư mục patches/, hoặc fork LMS) rồi hỏi Thầy.
```

---

## Prompt Giai đoạn 1: Thư viện `@duongsinh/chess-kit`

```text
GIAI ĐOẠN 1: THƯ VIỆN @duongsinh/chess-kit (xem mục 4 "Giai đoạn 1" trong docs/plans/chess_lms_plan.md)

Mục tiêu: tạo packages/chess-kit, thư viện dùng chung (KHÔNG phải plugin) mà 3 plugin cờ sẽ dùng.

Cấu trúc package:
- package.json:
  - name "@duongsinh/chess-kit", "private": true, "type": "module", license MIT;
  - exports gồm "./core", "./react", "./progress", "./i18n", "./theme.css";
  - dependencies: chess.js và react-chessboard (lấy đúng phiên bản đang dùng trong packages/plugins/chessfenpgn), zod theo catalog của workspace;
  - peer: react.
  - Tham khảo cấu trúc tsconfig/vitest của packages/plugins/forms.
- src/core/ (logic thuần, không DOM, không Node built-in, chạy được trên Workers):
  - fen.ts: parseFen, validateFen (trả lỗi tiếng Việt dễ hiểu).
  - pgn.ts: parsePgn → { headers, startFen, tree }, với tree gồm mainline, comment, NAG và biến phụ. Hỗ trợ [SetUp "1"] [FEN "..."]. replayPositions(startFen, moves).
  - notation.ts: sanToVi / viToSan (N→M, B→T, R→X, Q→H, K→V, kể cả phong cấp =Q→=H); uciToSan / sanToUci theo FEN.
  - annotations.ts: parseArrows("e2e4 g1f3:red"), parseSquares("e4 d5").
  - puzzle.ts: checkPuzzleMove(fen, solutionUci[], plyIndex, moveUci) → { correct, opponentReply?, done }. Nếu nước cuối của lời giải là chiếu hết thì chấp nhận MỌI nước chiếu hết.
  - levels.ts: LEVELS gồm 6 cấp slug tot, ma, tuong, xe, hau, vua (nhãn tiếng Việt, màu, mô tả ngắn).
  - themes.ts: THEMES, danh mục chủ đề chiến thuật (slug + nhãn tiếng Việt).
- src/react/:
  - Board: orientation, arrows, highlights, size, theme thương hiệu.
  - PgnViewer: biên bản có comment, biến phụ thu gọn, header kỳ thủ/kết quả; phím ←→↑↓; lật bàn; nút đổi ký hiệu VN/quốc tế; responsive.
  - PositionEditor: xếp thế, quân dự bị, bên đi, quyền nhập thành → FEN.
  - MoveRecorder: đi từ một FEN để ghi chuỗi UCI.
  - PuzzlePlayer: giải câu đố. Khi giải xong thì phát window CustomEvent "duongsinh-chess:puzzle-solved" với detail { puzzleId }.
  - LecturePlayer: xem bài giảng theo từng bước.
- src/progress/: kho localStorage key "duongsinh-chess:progress:v1", có schema zod, giới hạn số bản ghi, mọi truy cập bọc try/catch, có export/import JSON.
- src/i18n/: từ điển vi (mặc định) và en, hàm t(key).
- src/theme.css: biến CSS --ds-navy #2B3990, --ds-gold, màu ô sáng/tối đủ tương phản cho quân đen; gold dùng cho nước vừa đi và ô gợi ý; font Roboto.

Test (vitest, viết TRƯỚC khi cài đặt):
- PGN bắt đầu từ thế tùy chỉnh ([FEN]) phải replay đúng. Đây là lỗi đang có trong packages/plugins/chessfenpgn/src/ChessBoardIsland.tsx: viết test thất bại trước.
- PGN có comment, NAG, biến phụ.
- sanToVi/viToSan hai chiều, có phong cấp, nhập thành, chiếu/chiếu hết.
- checkPuzzleMove: đúng nước, sai nước, mate thay thế được chấp nhận, đối phương đáp tự động.
- progress: dữ liệu hỏng bị bỏ qua an toàn, vượt giới hạn thì cắt bớt, export/import.

Tiêu chí hoàn thành:
- [ ] `pnpm --filter @duongsinh/chess-kit test` pass.
- [ ] Typecheck sạch, lint không tăng so với số ban đầu.
- [ ] README.md tiếng Việt ngắn: API chính và ví dụ.
- [ ] Đã viết docs/plans/report_chess_phase1.md.

Ngoài phạm vi: chưa sửa chessfenpgn và chưa tạo plugin mới (đó là việc của Giai đoạn 2–4).
```

---

## Prompt Giai đoạn 2: Nâng cấp plugin `chessfenpgn`

```text
GIAI ĐOẠN 2: NÂNG CẤP PLUGIN chessfenpgn, FEN + PGN (xem mục 4 "Giai đoạn 2" trong docs/plans/chess_lms_plan.md)

Mục tiêu: chessfenpgn dùng @duongsinh/chess-kit, sửa các lỗi đang có, thêm tùy chọn hiển thị, và vẫn tương thích ngược 100% với nội dung cũ.

BẤT BIẾN (không được đổi):
- id plugin "chessfenpgn", tên package "@emdash-cms/plugin-chessfenpgn";
- block "chess-fen" (field fen) và "chess-pgn" (field pgn);
- widget "chess-board".
Chỉ được THÊM field mới, và field mới phải là tùy chọn.

Việc cần làm (trong packages/plugins/chessfenpgn):
1. Thêm dependency "@duongsinh/chess-kit": "workspace:*". Thay logic trong src/ChessBoardIsland.tsx bằng PgnViewer/Board của chess-kit. Viết test hồi quy cho lỗi PGN có [FEN].
2. Thêm field Block Kit tùy chọn:
   - chess-fen: orientation (select white/black/auto), caption, arrows, highlights, size (select S/M/L);
   - chess-pgn: orientation, startPly (number_input), showHeaders (toggle), caption.
   - Đặt category "Cờ vua" cho cả 2 block.
3. ChessFen.astro / ChessPgn.astro: thêm interface Props có kiểu, bỏ div debug, truyền đủ prop mới vào island (client:visible), nạp theme.css.
4. Widget chess-board: hỗ trợ options.mode "fen" | "pgn". Khi lưu field json thì lưu { fen, pgn, orientation }. Vẫn đọc được giá trị FEN dạng chuỗi cũ.
5. Trang "Bàn cờ" (/editor):
   - Khai báo trong definePlugin({ admin: { pages: [...] } }) để trang hiện trên sidebar.
   - Dùng PositionEditor; có ô dán PGN và kiểm tra lỗi; có các nút copy FEN, PGN và chuỗi mũi tên.
   - Dùng component Kumo.
6. Đóng gói:
   - thêm tsconfig.json, vitest.config.ts, README.md tiếng Việt (cách chèn block, cú pháp arrows/highlights);
   - thêm astro vào peerDependencies, bỏ peer @phosphor-icons/react (không dùng).
7. Dùng agent-browser trong demos/cloudflare để chụp ảnh trước và sau: block FEN có mũi tên, PGN có header/biến phụ, chế độ hiển thị ký hiệu VN, và giao diện mobile.

Tiêu chí hoàn thành:
- [ ] Nội dung cũ (chỉ có fen/pgn) vẫn render đúng; có test chứng minh.
- [ ] PGN có [FEN] render đúng thế xuất phát.
- [ ] Trang "Bàn cờ" hiện trên sidebar admin.
- [ ] Test, typecheck và lint sạch.
- [ ] Đã viết docs/plans/report_chess_phase2.md, kèm ảnh trong docs/plans/assets/chess-phase2/.
```

---

## Prompt Giai đoạn 3: Plugin `chess-puzzles` (Câu đố)

```text
GIAI ĐOẠN 3: PLUGIN chess-puzzles, CÂU ĐỐ (xem mục 4 "Giai đoạn 3" trong docs/plans/chess_lms_plan.md)

Mục tiêu: tạo packages/plugins/chess-puzzles (package "@duongsinh/plugin-chess-puzzles", "private": true, id "chess-puzzles", định dạng native).

Mẫu tham khảo:
- packages/plugins/forms: descriptor, storage, routes, optionsRoute, PluginRouteError, test;
- packages/plugins/field-kit: field widget React;
- packages/plugins/embeds: blockComponents;
- thư mục src/setup/* của LMS (trong node_modules/@emdashlms/plugin hoặc github.com/emdash-learn/emdash-learn): cách converge schema idempotent.

Việc cần làm:
1. Descriptor chessPuzzlesPlugin():
   - adminEntry, componentsEntry;
   - capabilities ["content:read", "content:write"];
   - exports: ".", "./admin", "./astro".
2. Route "setup/run" (permission "schema:manage"):
   - Dùng SchemaRegistry (export từ "emdash") để tạo collection chess_puzzles một cách idempotent. Field đúng như kế hoạch: title, puzzle (json + widget "chess-puzzles:puzzle-editor"), prompt, level, themes, rating, hint, explanation, source.
   - Các giá trị level/themes lấy từ @duongsinh/chess-kit/core.
   - supports: drafts, revisions, search. urlPattern "/cau-do/{slug}".
   - Chạy 2 lần không lỗi và không nhân đôi field.
3. Field widget "puzzle-editor": PositionEditor → MoveRecorder ghi lời giải (gồm cả nước đáp của đối phương) → nút "Chạy thử".
4. PT block "chess-puzzle":
   - field puzzle (select, optionsRoute "puzzles/options");
   - các field nhập nhanh fen, solution, prompt, hint.
   - Route "puzzles/options" đặt permission "content:create" và trả { items: [{ id, name }] }, có tìm kiếm.
5. Hook content:beforeSave:
   - Duyệt mọi field portableText; với node _type "chess-puzzle" có puzzle thì snapshot fen/solution/prompt/hint/level/title từ bản ĐÃ XUẤT BẢN.
   - Câu đố không tồn tại hoặc chưa xuất bản thì giữ nguyên node và ghi cảnh báo.
   - Route "snapshots/refresh" (admin) làm mới snapshot theo trang (cursor).
6. Front-end:
   - PuzzleBlock.astro → island PuzzlePlayer, chỉ đọc dữ liệu đã snapshot trong node, KHÔNG query DB.
   - Ghi progress và phát sự kiện "duongsinh-chess:puzzle-solved".
   - Export thêm PuzzlePage.astro và PuzzleOfTheDay.astro cho site dùng.
7. Trang admin:
   - "Câu đố": tổng quan số câu theo cấp, nút Setup.
   - "Nhập câu đố": PGN nhiều ván, EPD (bm), CSV Lichess puzzle (lọc rating/chủ đề, tối đa 500 câu/lô). Tạo bản nháp qua ctx.content.create theo lô ~50, báo dòng lỗi.
8. settingsSchema:
   - defaultOrientation;
   - revealAfterFailures (number);
   - showRating (boolean).

Test:
- parser PGN, EPD, CSV;
- setup chạy idempotent;
- hook snapshot (integration, dùng setupTestDatabase trong packages/core/tests/utils/test-db.ts hoặc theo cách test của plugin forms);
- quyền của route options (Subscriber bị từ chối, Contributor được phép).

Tiêu chí hoàn thành:
- [ ] Soạn câu đố bằng widget → chèn vào bài → giải được ở ngoài site khi ẩn danh.
- [ ] Nhập được 20 câu từ một CSV Lichess mẫu (thêm file fixture nhỏ vào tests/).
- [ ] Trang công khai không tăng query; kiểm chứng bằng `pnpm query-counts` hoặc đếm query trong test.
- [ ] Test, typecheck, lint sạch. Có README tiếng Việt.
- [ ] Đã viết docs/plans/report_chess_phase3.md kèm ảnh chụp.
```

---

## Prompt Giai đoạn 4: Plugin `chess-lessons` (Bài học, Bài giảng, cầu nối LMS)

```text
GIAI ĐOẠN 4: PLUGIN chess-lessons, BÀI HỌC + BÀI GIẢNG + CẦU NỐI LMS (xem mục 4 "Giai đoạn 4" trong docs/plans/chess_lms_plan.md)

Mục tiêu: tạo packages/plugins/chess-lessons (package "@duongsinh/plugin-chess-lessons", "private": true, id "chess-lessons", định dạng native).

Plugin này KHÔNG được import code của chess-puzzles. Việc giao tiếp chỉ qua collection nội dung và sự kiện DOM.

Việc cần làm:
1. Route "setup/run" (schema:manage):
   - Kiểm tra courses/lessons của LMS đã tồn tại; nếu chưa có thì trả lỗi kèm hướng dẫn chạy Learn → Setup.
   - Thêm field (chỉ thêm, idempotent): courses gồm level, sessions, age_range; lessons gồm level, themes, objectives.
   - Tạo collection chess_lectures với field title, level, course (reference courses, tùy chọn), summary, script (json + widget "chess-lessons:lecture-builder"). urlPattern "/bai-giang/{slug}".
2. Các nút trên trang admin "Bài học cờ":
   - "Tạo khung lộ trình 6 cấp": tạo 6 khóa nháp Tốt → Vua, bỏ qua khóa đã có.
   - "Tạo bài học mẫu": bản nháp theo khung Khởi động (câu chuyện) → Kiến thức mới → Thực hành → Kiểm tra → Bài tập về nhà.
   - "Nạp dữ liệu mẫu": 1 khóa Cấp Tốt, 3 bài, 1 bài giảng. Nếu collection chess_puzzles có sẵn thì tạo thêm 10 câu đố.
3. Widget "lecture-builder":
   - Danh sách bước, kéo đổi thứ tự.
   - Mỗi bước kế thừa thế của bước trước và có thể đi tiếp nước.
   - Mỗi bước có mũi tên/ô sáng, narration, teacherNotes và câu hỏi tùy chọn.
4. PT block "chess-lecture":
   - Chọn bài giảng qua optionsRoute (permission "content:create").
   - Hook beforeSave snapshot các bước và LOẠI BỎ teacherNotes.
   - Front-end render LecturePlayer.
5. Export LecturePresenter.astro (chế độ trình chiếu):
   - Toàn màn hình; PageUp/PageDown/←/→; phím B tắt màn hình; đồng hồ.
   - teacherNotes chỉ render phía server khi Astro.locals.user có vai trò ≥ Contributor. Viết test hoặc kiểm chứng để chứng minh khách ẩn danh không nhận được ghi chú trong HTML.
6. Cầu nối tiến độ LMS:
   - Script front-end nghe "duongsinh-chess:puzzle-solved".
   - Khi mọi câu đố trên trang bài học đã giải xong thì gọi createLearnBrowserClient().completeLesson(lessonId) (import từ "@emdashlms/plugin/browser").
   - Bật/tắt bằng setting autoCompleteLesson.
7. Công cụ "Sinh đáp án" cho Knowledge Check: nhập FEN + nước đi, xuất danh sách acceptedAnswers (SAN quốc tế và VN, có/không có x, +, #) để dán vào câu hỏi short_text. Viết hướng dẫn trong README: đặt block chess-fen ngay trên block learnKnowledgeCheck.
8. Trang "Nhập từ Obsidian":
   - Dán hoặc tải lên 1 hay nhiều file .md, có frontmatter title, course (slug), order, level, themes, objectives.
   - Body chuyển bằng markdownToPortableText (import từ "emdash/client").
   - Code fence ```fen, ```pgn, ```puzzle (khóa fen:/solution:/prompt:/hint:) và ```lecture (slug) được đổi thành block cờ.
   - Tạo bài học NHÁP gắn vào khóa. Cảnh báo các ![[wikilink]] ảnh.
   - Ghi quy ước Markdown vào README kèm 1 file .md mẫu trong tests/fixtures/.

Test:
- Markdown → PT (đủ 4 loại fence);
- setup chạy idempotent và không xóa field của LMS;
- snapshot bài giảng không chứa teacherNotes;
- sinh đáp án đủ biến thể.

Tiêu chí hoàn thành:
- [ ] Nhập 1 file .md mẫu → có bài học nháp chứa block cờ đúng.
- [ ] Giải hết câu đố trong bài → LMS đánh dấu bài hoàn thành (kiểm tra bằng deviceProgress).
- [ ] Trang trình chiếu chạy được; khách ẩn danh không thấy ghi chú HLV.
- [ ] Test, typecheck, lint sạch. Có README tiếng Việt.
- [ ] Đã viết docs/plans/report_chess_phase4.md kèm ảnh chụp.

ĐIỂM DỪNG: nếu Giai đoạn 0 kết luận Learn Setup XÓA field tùy chỉnh thì không thêm field vào courses/lessons. Hỏi Thầy giữa 2 phương án: lưu metadata cờ trong collection riêng, hoặc chấp nhận chạy chess-lessons Setup lại sau mỗi lần chạy Learn Setup.
```

---

## Prompt Giai đoạn 5: Tích hợp site và nội dung mẫu

```text
GIAI ĐOẠN 5: TÍCH HỢP SITE demos/cloudflare + NỘI DUNG MẪU (xem mục 4 "Giai đoạn 5" và mục 7 trong docs/plans/chess_lms_plan.md)

Mục tiêu: site covuahocduong có đủ trang học cờ, đúng nhận diện Dương Sinh, và kiểm chứng toàn bộ luồng.

Việc cần làm:
1. Trong demos/cloudflare/astro.config.mjs, đăng ký đủ plugin: formsPlugin(), aiSearch(...) (giữ nguyên), lmsCorePlugin(), chessfenpgnPlugin(), chessPuzzlesPlugin(), chessLessonsPlugin(). Thêm dependency workspace tương ứng.
2. Tạo trang:
   - /khoa-hoc (nhóm theo 6 cấp);
   - /khoa-hoc/[slug] (khóa + bài theo order);
   - /bai-hoc/[slug] (PortableText, bài trước/sau, trạng thái hoàn thành từ deviceProgress);
   - /cau-do (lọc cấp/chủ đề + PuzzleOfTheDay);
   - /cau-do/[slug];
   - /bai-giang/[slug];
   - /bai-giang/[slug]/trinh-chieu.
   - Đổi urlPattern của courses/lessons sang /khoa-hoc/{slug} và /bai-hoc/{slug}.
3. Truy vấn:
   - dùng getEmDashCollection/getEmDashEntry, luôn lọc locale;
   - helper dùng chung bọc bằng requestCached;
   - trang khóa học tối đa 2 query;
   - chạy `pnpm query-counts` và giải trình mọi thay đổi.
4. Giao diện:
   - dùng layout/biến màu hiện có của DSC trong demos/cloudflare, nạp theme.css của chess-kit;
   - navy #2B3990 + gold, font Roboto, họa tiết ô cờ;
   - responsive mobile.
5. Chạy "Nạp dữ liệu mẫu" và đi hết checklist ở mục 7 của kế hoạch bằng agent-browser (desktop + mobile, ẩn danh và đăng nhập HLV). Chụp ảnh vào docs/plans/assets/chess-phase5/.
6. KHÔNG deploy production. Ghi các bước deploy (D1 migrations, wrangler deploy) vào báo cáo để Thầy tự quyết.

Tiêu chí hoàn thành:
- [ ] Toàn bộ checklist mục 7 của kế hoạch đạt; mục nào không đạt thì ghi rõ.
- [ ] `pnpm build`, typecheck demo bằng `pnpm --filter @emdash-cms/demo-cloudflare typecheck` (script `typecheck:demos` bỏ qua demo này) và lint sạch.
- [ ] Đã viết docs/plans/report_chess_phase5.md kèm ảnh chụp và hướng dẫn sử dụng ngắn cho HLV (soạn câu đố, soạn bài, trình chiếu).
```

---

## Prompt kiểm tra chéo (tùy chọn, sau mỗi giai đoạn)

```text
Đọc .claude/CLAUDE.md, docs/plans/chess_lms_plan.md và docs/plans/report_chess_phaseN.md.

Rà soát diff của giai đoạn N so với nhánh main (git diff main...HEAD). Dùng skill adversarial-reviewer, hoặc /code-review ở mức high.

Tập trung vào:
- tương thích ngược của block/field cũ;
- query thêm ở trang công khai;
- lộ teacherNotes hoặc lời giải ngoài ý muốn;
- quyền của route (permission);
- test có thật sự bắt được lỗi không;
- vi phạm quy tắc Kumo/RTL/comment.

Báo cáo các lỗi đã xác minh, sắp theo mức độ nghiêm trọng. Chỉ sửa những lỗi chắc chắn, nhỏ và nằm trong phạm vi giai đoạn; phần còn lại liệt kê để Thầy quyết định.
```

---

## Giai đoạn 6 (để sau)

Phần tài khoản học viên, đồng bộ tiến độ, bảng điều khiển HLV và MCP tool nhập câu đố (xem mục 4 "Giai đoạn 6" của kế hoạch) **chưa có prompt**. Khi Giai đoạn 5 xong và Thầy quyết định làm tiếp, hãy yêu cầu Claude lập kế hoạch chi tiết cho Giai đoạn 6 dựa trên các báo cáo phase 0–5.
