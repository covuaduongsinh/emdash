# Bộ prompt triển khai v2: Dương Sinh Chess Suite (nền emdash-lms)

Đi kèm kế hoạch [chess_lms_plan.md](chess_lms_plan.md) bản v2, cập nhật 2026-10-09. Nền LMS là bản fork của `tohaitrieu/emdash-lms`.

Mỗi giai đoạn chạy trong **một phiên Claude Code mới** để không bị quá tải ngữ cảnh.

## Cách dùng

1. **Trước phiên đầu tiên:** merge nhánh `claude/vigilant-mccarthy-jfjram` (chứa kế hoạch này) vào `main`, hoặc mở phiên mới ngay trên nhánh đó.
2. Mở phiên mới, dán **Prompt chung** rồi tới **Prompt GĐ N** ngay bên dưới, trong cùng một tin nhắn.
3. Chạy đúng thứ tự GĐ0 → GĐ7:

   | GĐ | Nội dung |
   |---|---|
   | 0 | Nền móng |
   | 1 | chess-kit |
   | 2 | Ổn định LMS |
   | 3 | Quiz |
   | 4 | chessfenpgn |
   | 5 | chess-puzzles |
   | 6 | chess-lessons |
   | 7 | Tích hợp site |

   Khi xong một giai đoạn, đọc `docs/plans/report_chess_phaseN.md` rồi merge nhánh của phiên đó vào `main` trước khi mở phiên tiếp theo.
4. Nếu phiên dừng lại hỏi, trả lời rồi bảo nó làm tiếp. Không chuyển giai đoạn khi giai đoạn trước còn việc dở.
5. Tùy chọn: sau mỗi giai đoạn, chạy **Prompt kiểm tra chéo** trong một phiên khác. Nên chạy với GĐ2 và GĐ3 vì hai giai đoạn này đụng tới quyền truy cập và đáp án.

**Lệnh khởi động ngắn** (dùng thay cho việc dán cả 2 prompt; đổi `N`):

```text
Chạy `git fetch origin claude/vigilant-mccarthy-jfjram` và merge nhánh đó nếu chưa có docs/plans/chess_lms_prompts.md. Đọc file đó, rồi thực hiện nguyên văn "Prompt chung" và "Prompt GĐN". Làm xong thì viết docs/plans/report_chess_phaseN.md, commit và push.
```

---

## Prompt chung (dán đầu mỗi phiên)

```text
Bạn đang làm cho Thầy Tường (Công ty CP Cờ vua Dương Sinh). Trả lời bằng tiếng Việt, đi thẳng vào việc.

DỰ ÁN: "Dương Sinh Chess Suite" trên EmDash CMS gồm:
- emdash-lms: bản fork của github.com/tohaitrieu/emdash-lms, nằm ở packages/plugins/lms, id "lms";
- thư viện @duongsinh/chess-kit;
- 3 plugin cờ: chessfenpgn, chess-puzzles, chess-lessons.
Site đích là demos/cloudflare (worker covuahocduong).

TRƯỚC KHI LÀM:
1. Nếu chưa có docs/plans/chess_lms_plan.md thì chạy `git fetch origin claude/vigilant-mccarthy-jfjram` và merge nhánh đó vào nhánh làm việc.
2. Đọc kỹ:
   - .claude/CLAUDE.md (quy tắc repo, bắt buộc tuân thủ)
   - docs/plans/chess_lms_plan.md (kế hoạch v2; mục 1.2 liệt kê lỗi L1–L10 của emdash-lms)
   - mọi file docs/plans/report_chess_phase*.md đã có
3. Nạp skill `creating-plugins`. Docs của skill lệch code ở các chỗ sau, khi lệch thì tin code (packages/core/src/plugins/*) và docs/src/content/docs/plugins/**:
   - definePlugin bắt buộc có id;
   - không có usePluginAPI, dùng apiFetch/parseApiResponse từ "emdash/plugin-utils";
   - route plugin mặc định là private (cần plugins:manage) trừ khi khai báo permission hoặc public: true;
   - handler route native nhận ĐÚNG 1 tham số RouteContext (ctx.input, ctx.user, ctx.content…), xem packages/core/src/plugins/routes.ts;
   - module adminEntry được import dạng `import * as`, nên phải export TÊN `pages`, `widgets`, `fields` (không dùng export default).
4. Xác nhận các giai đoạn trước đã có trong code đúng như báo cáo. Thiếu thì dừng lại báo Thầy.
5. Chạy `pnpm install` rồi `pnpm lint:json | jq '.diagnostics | length'` và ghi lại con số ban đầu.

TRONG KHI LÀM:
- Chỉ làm đúng phạm vi của giai đoạn được giao bên dưới. Không refactor ngoài phạm vi.
- Không sửa packages/core hoặc packages/admin. Nếu thật sự cần thì dừng lại hỏi Thầy.
- Sửa lỗi theo TDD: viết test thất bại → sửa → chạy lại cho pass.
- Sau mỗi lần sửa: `pnpm lint:quick`. Sau mỗi đợt sửa: typecheck package liên quan.
- Trước khi commit: `pnpm format`.
- Route cho học viên chỉ được dùng ctx.user.id. TUYỆT ĐỐI không nhận userId từ body/query.
- Trang công khai cho khách không được thêm query DB. Dùng snapshot qua content:beforeSave và requestCached.
- Admin UI: dùng component Kumo, class Tailwind logic (ms-/me-/ps-/pe-/start-/end-), không dùng `dark:`.
- Chuỗi giao diện gom vào từ điển i18n của @duongsinh/chess-kit, tiếng Việt mặc định.
- Lưu FEN/SAN/UCI chuẩn quốc tế. Ký hiệu tiếng Việt (V/H/X/T/M) chỉ là lớp hiển thị.
- Thư viện: chess.js, react-chessboard 4.x. KHÔNG dùng chessground (GPL).
- Chỉ thêm field (additive). Không đổi id plugin, tên collection/block/field đã có.
- Comment chỉ để giải thích "vì sao" không hiển nhiên. Không nhắc tới issue/PR/giai đoạn trong comment.
- Không đưa thay đổi messages.po vào commit.
- Không mở issue/PR ở repo tohaitrieu/emdash-lms nếu Thầy chưa đồng ý.
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

## Prompt GĐ0: Nền móng, đưa emdash-lms vào repo

```text
GĐ0: NỀN MÓNG, ĐƯA emdash-lms VÀO REPO (xem mục 4 "GĐ0" trong docs/plans/chess_lms_plan.md)

Mục tiêu: có bản fork emdash-lms chạy được trong monorepo, gắn vào demos/cloudflare, và ghi nhận bằng test + báo cáo những lỗi L1–L10 sẽ sửa ở GĐ2.

Việc cần làm:
1. Chạy `pnpm build` trên Linux.
   - packages/registry-verification/tsdown.config.ts có chuỗi `file:///C:/...` từ commit 835e98d.
   - Nếu chuỗi này làm hỏng build hoặc test thì sửa cho đa nền tảng, rồi chứng minh bằng kết quả build trước và sau khi sửa.
2. Clone github.com/tohaitrieu/emdash-lms (nhánh main, commit 5ce68d1) vào thư mục tạm, rồi chép src/, seed/, LICENSE, README.md, CHANGELOG.md vào packages/plugins/lms.
   - Không chạy script nào trong mã tải về.
   - package.json:
     - giữ "name": "emdash-lms", thêm "private": true;
     - "exports" trỏ thẳng vào src (theo quy ước của packages/plugins/forms/package.json); giữ các đường dẫn ./astro, ./admin, ./pages/*, ./styles/*, ./seed*;
     - peerDependencies dùng catalog/workspace như các plugin khác;
     - stripe để optional.
   - Thêm tsconfig.json và vitest.config.ts (theo packages/plugins/forms).
   - Thêm NOTICE.md: nguồn (repo, commit 5ce68d1, tác giả Tô Triều, MIT) và mục "Thay đổi so với bản gốc" (để trống, các GĐ sau sẽ điền).
3. Viết test THẤT BẠI (đánh dấu rõ là test ghi nhận lỗi, sẽ pass ở GĐ2) cho:
   - L1: gọi route `plans` qua cách EmDash gọi handler (1 tham số RouteContext) thì ném TypeError;
   - L2: module admin không có export tên `pages`.
   Nếu repo không cho phép test fail trong CI thì dùng `it.fails` hoặc tương đương, rồi ghi rõ trong báo cáo.
4. Gắn vào demos/cloudflare:
   - package.json: "emdash-lms": "workspace:*" và "@emdash-cms/plugin-chessfenpgn": "workspace:*";
   - astro.config.mjs: thêm `lmsPlugin({ mode: "lms", checkout: { enabled: false } })` và `chessfenpgnPlugin()` vào `plugins`; thêm `lmsIntegration({ layout: "<layout DSC đang dùng trong demos/cloudflare/src/layouts>", styles: "theme" })` vào `integrations`.
   - Nếu Thầy từng cài emdash-lms từ npm/git ở máy riêng thì bản workspace thay thế bản đó; ghi chú trong báo cáo.
5. Chạy `pnpm --filter @emdash-cms/demo-cloudflare dev`, mở http://localhost:4321/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin, rồi:
   a. tạo schema LMS từ packages/plugins/lms/seed/courses.json (bằng emdash CLI, skill `emdash-cli`, hoặc tạo tay) và ghi lại cách đã làm;
   b. tạo 1 khóa, 1 chương, 1 bài (content có 1 block chess-fen), xem /courses, /course/<slug>, /lesson/<slug>;
   c. ghi lại hiện trạng thực tế của từng lỗi L1–L10 (thấy / không thấy / khác mô tả);
   d. chụp ảnh bằng skill agent-browser, lưu vào docs/plans/assets/chess-phase0/.

Tiêu chí hoàn thành:
- [ ] Build trên Linux sạch, hoặc đã ghi rõ lỗi có từ trước, không do mình gây ra.
- [ ] packages/plugins/lms có đủ LICENSE + NOTICE.md, typecheck được (các lỗi type của mã gốc liệt kê trong báo cáo, chưa sửa).
- [ ] Đã có test ghi nhận L1 và L2.
- [ ] demos/cloudflare chạy được, render được trang khóa học và bài học có block chess-fen.
- [ ] Đã viết docs/plans/report_chess_phase0.md, có bảng hiện trạng L1–L10.

ĐIỂM DỪNG BẮT BUỘC: nếu ngay cả schema và các trang của emdash-lms cũng không chạy được trên EmDash của repo thì dừng lại. Báo lỗi và đề xuất phương án cho Thầy chọn.
```

---

## Prompt GĐ1: Thư viện `@duongsinh/chess-kit`

```text
GĐ1: THƯ VIỆN @duongsinh/chess-kit (xem mục 4 "GĐ1" trong docs/plans/chess_lms_plan.md)

Mục tiêu: tạo packages/chess-kit, thư viện dùng chung (KHÔNG phải plugin) cho LMS và 3 plugin cờ.

Cấu trúc package:
- package.json:
  - name "@duongsinh/chess-kit", "private": true, "type": "module", license MIT;
  - exports gồm "./core", "./react", "./progress", "./i18n", "./theme.css";
  - dependencies: chess.js và react-chessboard (lấy đúng phiên bản đang dùng trong packages/plugins/chessfenpgn), zod theo catalog của workspace;
  - peer: react.
  - Tham khảo cấu trúc tsconfig/vitest của packages/plugins/forms.
- src/core/ (logic thuần, không DOM, không Node built-in, chạy được trên Workers):
  - fen.ts: parseFen, validateFen (lỗi tiếng Việt dễ hiểu).
  - pgn.ts: parsePgn → { headers, startFen, tree }, với tree gồm mainline, comment, NAG và biến phụ. Hỗ trợ [SetUp "1"] [FEN "..."]. replayPositions(startFen, moves).
  - notation.ts: sanToVi / viToSan (N→M, B→T, R→X, Q→H, K→V, kể cả phong cấp =Q→=H); uciToSan / sanToUci theo FEN.
  - annotations.ts: parseArrows("e2e4 g1f3:red"), parseSquares("e4 d5").
  - puzzle.ts:
    - checkPuzzleMove(fen, solutionUci[], plyIndex, moveUci) → { correct, opponentReply?, done }. Nếu nước cuối của lời giải là chiếu hết thì chấp nhận MỌI nước chiếu hết.
    - gradeChessAnswer({ fen, solution }, playedUci[]) → { correct, reason }, dùng để LMS chấm quiz phía server.
  - levels.ts: LEVELS gồm 6 cấp slug tot, ma, tuong, xe, hau, vua (nhãn tiếng Việt, màu, mô tả ngắn).
  - themes.ts: THEMES, danh mục chủ đề chiến thuật (slug + nhãn tiếng Việt).
- src/react/:
  - Board: orientation, arrows, highlights, size, theme.
  - PgnViewer: comment, biến thu gọn, header; phím ←→↑↓; lật bàn; nút VN/quốc tế; responsive.
  - PositionEditor: xếp thế, quân dự bị, bên đi, quyền nhập thành → FEN.
  - MoveRecorder: đi từ một FEN để ghi chuỗi UCI.
  - PuzzlePlayer: prop onSolved, và phát window CustomEvent "duongsinh-chess:puzzle-solved" với detail { puzzleId }.
  - LecturePlayer: xem bài giảng theo từng bước.
- src/progress/:
  - kho localStorage key "duongsinh-chess:progress:v1", dạng { puzzles, lectures, lessons };
  - schema zod, có giới hạn số bản ghi, mọi truy cập bọc try/catch, export/import JSON;
  - drainForSync() trả dữ liệu cần gộp lên tài khoản và đánh dấu đã đồng bộ.
- src/i18n/: từ điển vi (mặc định) và en, hàm t(key).
- src/theme.css: --ds-navy #2B3990, --ds-gold, màu ô sáng/tối đủ tương phản cho quân đen; gold dùng cho nước vừa đi và ô gợi ý; font Roboto.

Test (vitest, viết TRƯỚC khi cài đặt):
- PGN bắt đầu từ thế tùy chỉnh ([FEN]) phải replay đúng. Đây là lỗi đang có trong packages/plugins/chessfenpgn/src/ChessBoardIsland.tsx.
- PGN có comment, NAG, biến phụ.
- Ký hiệu hai chiều, có phong cấp, nhập thành, chiếu/chiếu hết.
- checkPuzzleMove: đúng nước, sai nước, mate thay thế được chấp nhận, đối phương đáp tự động.
- gradeChessAnswer: đúng toàn bộ chuỗi, sai giữa chừng, nước không hợp lệ.
- progress: dữ liệu hỏng bị bỏ qua an toàn, vượt giới hạn thì cắt bớt, export/import, drainForSync.

Tiêu chí hoàn thành:
- [ ] `pnpm --filter @duongsinh/chess-kit test` pass.
- [ ] Typecheck sạch, lint không tăng so với số ban đầu.
- [ ] Có README.md tiếng Việt ngắn: API chính và ví dụ.
- [ ] Đã viết docs/plans/report_chess_phase1.md.

Ngoài phạm vi: chưa sửa chessfenpgn, LMS hay plugin khác.
```

---

## Prompt GĐ2: Ổn định LMS (fork emdash-lms)

```text
GĐ2: ỔN ĐỊNH LMS, BẢN FORK packages/plugins/lms (xem mục 1.2 và mục 4 "GĐ2" trong docs/plans/chess_lms_plan.md)

Mục tiêu: emdash-lms chạy đúng trên EmDash của repo, an toàn về quyền, có trang khóa/bài tiếng Việt với kiểm tra quyền truy cập và tiến độ 2 lớp. Chưa làm bán hàng.

Việc cần làm (TDD: mỗi lỗi có test thất bại trước):
1. L1: viết lại mọi handler theo chữ ký 1 tham số RouteContext.
   - Input khai bằng `input: z.object(...)` (zod từ "astro/zod" hoặc như các plugin khác).
   - Lỗi trả bằng PluginRouteError.
   - Các test ghi nhận lỗi ở GĐ0 phải chuyển sang pass.
2. L2: src/admin.tsx export TÊN `pages`. Trang admin viết lại bằng Kumo, chuỗi tiếng Việt:
   - "Cài đặt LMS": nút Setup, trạng thái schema;
   - "Học viên": danh sách ghi danh và tiến độ, lọc theo khóa, ghi danh tay bằng email (capability users:read);
   - "Cài đặt".
   Ẩn Plans/Members/Orders khi checkout tắt.
3. L10: capability dùng tên mới (content:read, content:write, users:read), bỏ `as any`, typecheck sạch.
4. L9 + route "setup/run" (permission "schema:manage"):
   - Converge schema từ định nghĩa trong code (chuyển từ seed/*.json sang module TypeScript) bằng SchemaRegistry (export từ "emdash"), idempotent.
   - Đổi các field string + choices sang `select` + validation.options.
   - Không xóa hoặc đổi kiểu field tùy chỉnh. Chạy 2 lần không lỗi.
5. L3 + L4 + L8, route học viên:
   - Khai `permission: "content:read"` và CHỈ dùng ctx.user.id:
     - me/access (courseId, lessonId?)
     - me/enroll (chỉ khóa access_level free)
     - progress/complete (lessonId)
     - progress/sync (gộp dữ liệu từ chess-kit drainForSync)
     - me/progress (courseId)
   - Truy vấn dùng where.fieldFilters + phân trang, không list toàn bộ rồi lọc bằng JS.
   - Cập nhật enrollments.progress (%) và completed_at.
   - Test IDOR: truyền userId người khác trong body cũng không có tác dụng.
6. L6 + chế độ tắt bán hàng:
   - Khi checkout.enabled === false thì KHÔNG đăng ký route checkout và webhook.
   - Đổi route webhook sang tên cố định webhook/sepay, webhook/stripe (chỉ đăng ký khi bật).
   - L5 (xác thực Sepay) để GĐ8, ghi rõ trong NOTICE.md và báo cáo.
7. L7 + L8, trang front-end:
   - lmsIntegration thêm tùy chọn `routes` (additive, giữ mặc định cũ) để demo dùng /khoa-hoc, /khoa-hoc/[slug], /bai-hoc/[slug].
   - Trang khóa học: lấy 1 khóa theo slug, rồi chương và bài của khóa đó bằng filter, helper bọc requestCached, tối đa 3 query.
   - Trang bài học:
     - quyền phía server: free hoặc is_preview thì cho xem; ngược lại cần Astro.locals.user + enrollment; nếu không chỉ hiện giới thiệu + nút kêu gọi;
     - khách ẩn danh không phát sinh query kiểm tra quyền;
     - thanh tiến độ, nút "Hoàn thành bài".
   - Giao thức "yêu cầu hoàn thành":
     - script đếm phần tử [data-lms-requirement] và nghe event `lms:requirement-done`;
     - khi đủ thì: đã đăng nhập → gọi progress/complete; khách → lưu progress của chess-kit;
     - khi học viên đăng nhập thì tự gọi progress/sync một lần.
   - Chuỗi tiếng Việt, CSS variables giữ nguyên tên.
8. Cập nhật NOTICE.md (danh sách thay đổi) và README tiếng Việt (cấu hình, routes, giao thức yêu cầu hoàn thành).

Test:
- route (quyền từng vai trò Subscriber/Contributor/Admin, IDOR);
- setup chạy idempotent;
- quyền xem bài (free / preview / cần ghi danh);
- progress/complete và progress/sync;
- dùng setupTestDatabase (packages/core/tests/utils/test-db.ts) hoặc theo cách test của packages/plugins/forms.

Tiêu chí hoàn thành:
- [ ] L1, L2, L3, L4, L6, L7, L8, L9, L10 đã sửa và có test. L5 ghi là để GĐ8.
- [ ] `pnpm --filter emdash-lms test`, typecheck và lint sạch.
- [ ] Trong demos/cloudflare: Setup chạy OK, trang /khoa-hoc và /bai-hoc chạy; khách xem bài free được, bài trả phí bị chặn; học viên (Subscriber) hoàn thành bài thì HLV thấy trong trang "Học viên".
- [ ] `pnpm query-counts`: giải trình mọi thay đổi.
- [ ] Đã viết docs/plans/report_chess_phase2.md kèm ảnh chụp.

ĐIỂM DỪNG: nếu cần sửa packages/core (vd. router cần tham số đường dẫn) thì dừng lại hỏi Thầy.
```

---

## Prompt GĐ3: Quiz của LMS (có câu hỏi cờ)

```text
GĐ3: QUIZ CỦA LMS, CÓ CÂU HỎI CỜ (xem mục 4 "GĐ3" trong docs/plans/chess_lms_plan.md)

Mục tiêu: HLV soạn quiz trên một màn hình; học viên làm quiz ngay trong bài học; câu hỏi cờ chấm phía server bằng chess-kit.

Việc cần làm (trong packages/plugins/lms, dependency "@duongsinh/chess-kit": "workspace:*"):
1. Schema (additive, qua setup/run): `questions.type` thêm lựa chọn "chess". Với câu chess, `answers` = { fen, solution: UCI[], orientation, prompt }.
2. Route quản trị quiz/* (permission "content:edit_any"): tạo, sửa, xóa, sắp xếp quiz và câu hỏi qua ctx.content.
3. Trang admin "Soạn quiz" (React + Kumo):
   - danh sách quiz theo bài học, soạn quiz kèm các câu hỏi;
   - giao diện đổi theo loại: single/multiple (đáp án đúng), text/fill_blank (danh sách đáp án chấp nhận), chess (PositionEditor + MoveRecorder của chess-kit, có nút chạy thử);
   - nút "Lấy từ kho câu đố": gọi route /_emdash/api/plugins/chess-puzzles/puzzles/options khi plugin đó có mặt; nếu không có thì ẩn nút.
4. Route học viên:
   - quiz/present (public): trả quiz đã xuất bản, đã BỎ đáp án/lời giải, xáo câu nếu random_order.
   - quiz/submit:
     - chấm phía server; câu chess chấm bằng gradeChessAnswer;
     - trả điểm, đạt/không đạt, giải thích;
     - nếu ctx.user có mặt (route bản content:read) thì lưu quiz_submissions, tôn trọng allow_reset;
     - khách gọi bản public thì không lưu.
     - Chọn cách khai 2 route (vd. quiz/submit public và me/quiz/submit content:read) rồi ghi lại trong README.
   - timer_minutes: kiểm tra phía server theo started_at.
5. PT block "lms-quiz" (select quiz qua optionsRoute với permission "content:create"):
   - component Astro render island QuizRunner; câu chess dùng PuzzlePlayer;
   - render data-lms-requirement; khi đạt passmark thì phát `lms:requirement-done`.

Test:
- chấm từng loại câu hỏi;
- quiz/present KHÔNG chứa đáp án (assert trên JSON trả về);
- quyền các route quiz/*;
- lưu submission đúng user, IDOR;
- timer.

Tiêu chí hoàn thành:
- [ ] Soạn 1 quiz gồm 1 câu single, 1 câu text, 1 câu chess; chèn vào bài; khách làm được; học viên làm thì có bản ghi quiz_submissions.
- [ ] Test, typecheck, lint sạch. Cập nhật NOTICE.md và README.
- [ ] Đã viết docs/plans/report_chess_phase3.md kèm ảnh chụp.
```

---

## Prompt GĐ4: Nâng cấp plugin `chessfenpgn`

```text
GĐ4: NÂNG CẤP PLUGIN chessfenpgn, FEN + PGN (xem mục 4 "GĐ4" trong docs/plans/chess_lms_plan.md)

Mục tiêu: chessfenpgn dùng @duongsinh/chess-kit, sửa các lỗi đang có, thêm tùy chọn hiển thị, và vẫn tương thích ngược 100%.

BẤT BIẾN (không được đổi):
- id plugin "chessfenpgn", tên package "@emdash-cms/plugin-chessfenpgn";
- block "chess-fen" (field fen) và "chess-pgn" (field pgn);
- widget "chess-board".
Chỉ được THÊM field mới, và field mới phải là tùy chọn.

Việc cần làm (trong packages/plugins/chessfenpgn):
1. Thêm dependency "@duongsinh/chess-kit": "workspace:*". Thay logic trong src/ChessBoardIsland.tsx bằng PgnViewer/Board. Viết test hồi quy cho lỗi PGN có [FEN].
2. Thêm field Block Kit tùy chọn:
   - chess-fen: orientation (select white/black/auto), caption, arrows, highlights, size (select S/M/L);
   - chess-pgn: orientation, startPly (number_input), showHeaders (toggle), caption.
   - Đặt category "Cờ vua" cho cả 2 block.
3. ChessFen.astro / ChessPgn.astro: thêm interface Props có kiểu, bỏ div debug, truyền đủ prop mới vào island (client:visible), nạp theme.css.
4. Widget chess-board: hỗ trợ options.mode "fen" | "pgn". Khi lưu field json thì lưu { fen, pgn, orientation }. Vẫn đọc được chuỗi FEN cũ.
5. Trang "Bàn cờ" (/editor):
   - khai trong definePlugin({ admin: { pages: [...] } }) để hiện trên sidebar;
   - dùng PositionEditor; có ô dán PGN và kiểm tra lỗi; có các nút copy FEN, PGN và chuỗi mũi tên;
   - dùng component Kumo.
6. Đóng gói:
   - thêm tsconfig.json, vitest.config.ts, README.md tiếng Việt (cách chèn block, cú pháp arrows/highlights);
   - thêm astro vào peerDependencies, bỏ peer @phosphor-icons/react (không dùng).
7. Dùng agent-browser trong demos/cloudflare (trang /bai-hoc/...) để chụp ảnh trước và sau: FEN có mũi tên, PGN có header/biến phụ, ký hiệu VN, giao diện mobile.

Tiêu chí hoàn thành:
- [ ] Nội dung cũ (chỉ có fen/pgn) vẫn render đúng; có test chứng minh.
- [ ] PGN có [FEN] render đúng thế xuất phát.
- [ ] Trang "Bàn cờ" hiện trên sidebar admin.
- [ ] Test, typecheck, lint sạch.
- [ ] Đã viết docs/plans/report_chess_phase4.md, kèm ảnh trong docs/plans/assets/chess-phase4/.
```

---

## Prompt GĐ5: Plugin `chess-puzzles` (Câu đố)

```text
GĐ5: PLUGIN chess-puzzles, CÂU ĐỐ (xem mục 4 "GĐ5" trong docs/plans/chess_lms_plan.md)

Mục tiêu: tạo packages/plugins/chess-puzzles (package "@duongsinh/plugin-chess-puzzles", "private": true, id "chess-puzzles", native). Không import code của LMS hay plugin cờ khác.

Mẫu tham khảo:
- packages/plugins/forms: descriptor, routes, optionsRoute, PluginRouteError, test;
- packages/plugins/field-kit: field widget React;
- packages/plugins/embeds: blockComponents;
- route setup/run của packages/plugins/lms (GĐ2): cách converge schema.

Việc cần làm:
1. Descriptor chessPuzzlesPlugin():
   - adminEntry, componentsEntry;
   - capabilities ["content:read", "content:write"];
   - exports: ".", "./admin", "./astro".
2. Route "setup/run" (permission "schema:manage"):
   - tạo collection chess_puzzles idempotent bằng SchemaRegistry, với field title, puzzle (json + widget "chess-puzzles:puzzle-editor"), prompt, level, themes, rating, hint, explanation (portableText), source;
   - giá trị level/themes lấy từ @duongsinh/chess-kit/core;
   - supports: drafts, revisions, search; urlPattern "/cau-do/{slug}".
3. Field widget "puzzle-editor": PositionEditor → MoveRecorder ghi lời giải (gồm nước đáp) → "Chạy thử".
4. PT block "chess-puzzle":
   - field puzzle (select, optionsRoute "puzzles/options");
   - các field nhập nhanh fen, solution, prompt, hint.
   - Route "puzzles/options": permission "content:create", trả { items: [{ id, name }] }, có tìm kiếm và lọc cấp. LMS (GĐ3) cũng gọi route này.
5. Hook content:beforeSave:
   - duyệt mọi field portableText; với node _type "chess-puzzle" có puzzle thì snapshot fen/solution/prompt/hint/level/title từ bản ĐÃ XUẤT BẢN;
   - không tìm thấy thì giữ nguyên node và ghi cảnh báo;
   - route "snapshots/refresh" (admin) làm mới theo trang (cursor).
6. Front-end:
   - PuzzleBlock.astro → island PuzzlePlayer, chỉ đọc dữ liệu đã snapshot trong node, KHÔNG query DB;
   - render data-lms-requirement="puzzle:<id>"; khi giải xong thì phát `lms:requirement-done` và `duongsinh-chess:puzzle-solved`, rồi ghi progress;
   - export PuzzlePage.astro và PuzzleOfTheDay.astro cho site.
7. Trang admin:
   - "Câu đố": tổng quan theo cấp, nút Setup;
   - "Nhập câu đố": PGN nhiều ván, EPD (bm), CSV Lichess puzzle (lọc rating/chủ đề, tối đa 500 câu/lô). Tạo bản nháp qua ctx.content.create theo lô ~50, báo dòng lỗi.
8. settingsSchema:
   - defaultOrientation;
   - revealAfterFailures (number);
   - showRating (boolean).

Test:
- parser PGN, EPD, CSV;
- setup chạy idempotent;
- hook snapshot (integration);
- quyền của puzzles/options (Subscriber bị từ chối, Contributor được phép).

Tiêu chí hoàn thành:
- [ ] Soạn câu đố bằng widget → chèn vào bài LMS → khách giải được → bài được tính hoàn thành qua giao thức requirement.
- [ ] Nhập được 20 câu từ một CSV Lichess mẫu (fixture nhỏ trong tests/).
- [ ] Trang công khai không tăng query (`pnpm query-counts` hoặc đếm trong test).
- [ ] Test, typecheck, lint sạch. Có README tiếng Việt.
- [ ] Đã viết docs/plans/report_chess_phase5.md kèm ảnh chụp.
```

---

## Prompt GĐ6: Plugin `chess-lessons` (Bài học cờ, Bài giảng)

```text
GĐ6: PLUGIN chess-lessons, BÀI HỌC CỜ + BÀI GIẢNG (xem mục 4 "GĐ6" trong docs/plans/chess_lms_plan.md)

Mục tiêu: tạo packages/plugins/chess-lessons (package "@duongsinh/plugin-chess-lessons", "private": true, id "chess-lessons", native). Không import code của LMS hay chess-puzzles; chỉ làm việc qua collection nội dung.

Việc cần làm:
1. Route "setup/run" (schema:manage), additive và idempotent:
   - kiểm tra collection courses/modules/lessons của LMS đã có; nếu chưa thì trả lỗi hướng dẫn chạy LMS Setup;
   - thêm field: courses gồm level, sessions, age_range; lessons gồm level, themes, objectives;
   - tạo collection chess_lectures với field title, level, course (reference courses, tùy chọn), summary, script (json + widget "chess-lessons:lecture-builder"); urlPattern "/bai-giang/{slug}".
2. Các nút trên trang admin "Bài học cờ":
   - "Khung lộ trình 6 cấp": 6 khóa nháp Tốt → Vua, mỗi khóa 1 chương mẫu, bỏ qua khóa đã có;
   - "Bài học mẫu": bản nháp theo khung Khởi động (câu chuyện) → Kiến thức mới → Thực hành → Kiểm tra (lms-quiz) → Bài tập về nhà;
   - "Nạp dữ liệu mẫu": 1 khóa Cấp Tốt, 3 bài, 1 bài giảng, 1 quiz; thêm 10 câu đố nếu collection chess_puzzles có sẵn.
3. Widget "lecture-builder":
   - danh sách bước, kéo đổi thứ tự;
   - mỗi bước kế thừa thế của bước trước và có thể đi tiếp nước;
   - mỗi bước có mũi tên/ô sáng, narration, teacherNotes, câu hỏi tùy chọn.
4. PT block "chess-lecture":
   - chọn qua optionsRoute (permission "content:create");
   - hook beforeSave snapshot các bước và LOẠI BỎ teacherNotes;
   - front-end render LecturePlayer.
5. Export LecturePresenter.astro (chế độ trình chiếu):
   - toàn màn hình; PageUp/PageDown/←/→; phím B tắt màn hình; đồng hồ;
   - teacherNotes chỉ render phía server khi Astro.locals.user có vai trò ≥ Contributor. Có kiểm chứng rằng HTML gửi cho khách không chứa ghi chú.
6. Trang "Nhập từ Obsidian":
   - dán hoặc tải lên 1 hay nhiều .md, frontmatter title, course (slug), module (tên), order, level, themes, objectives;
   - body chuyển bằng markdownToPortableText (import từ "emdash/client");
   - code fence ```fen, ```pgn, ```puzzle (khóa fen:/solution:/prompt:/hint:), ```lecture (slug) được đổi thành block cờ;
   - tạo bài học NHÁP (content, course_id, module_id, sort_order); tạo chương nếu chưa có;
   - cảnh báo các ![[wikilink]];
   - ghi quy ước Markdown vào README, kèm file .md mẫu trong tests/fixtures/.

Test:
- Markdown → PT (đủ 4 loại fence);
- setup chạy idempotent và không xóa field của LMS;
- snapshot bài giảng không chứa teacherNotes;
- nạp dữ liệu mẫu chạy 2 lần không nhân đôi.

Tiêu chí hoàn thành:
- [ ] Nhập 1 file .md mẫu → có bài học nháp chứa block cờ đúng, nằm đúng khóa/chương.
- [ ] Trang trình chiếu chạy được; khách không thấy ghi chú HLV.
- [ ] Test, typecheck, lint sạch. Có README tiếng Việt.
- [ ] Đã viết docs/plans/report_chess_phase6.md kèm ảnh chụp.

ĐIỂM DỪNG: nếu LMS Setup (GĐ2) xóa hoặc ghi đè field do chess-lessons thêm thì dừng lại hỏi Thầy, kèm phương án.
```

---

## Prompt GĐ7: Tích hợp site và kiểm chứng toàn bộ

```text
GĐ7: TÍCH HỢP SITE demos/cloudflare + KIỂM CHỨNG TOÀN BỘ (xem mục 4 "GĐ7" và mục 7 trong docs/plans/chess_lms_plan.md)

Mục tiêu: site covuahocduong có đủ trang học cờ, đúng nhận diện Dương Sinh, và chạy hết checklist kiểm chứng.

Việc cần làm:
1. demos/cloudflare/astro.config.mjs:
   - plugins: formsPlugin(), aiSearch(...) (giữ nguyên), lmsPlugin({ mode: "lms", checkout: { enabled: false } }), chessfenpgnPlugin(), chessPuzzlesPlugin(), chessLessonsPlugin();
   - lmsIntegration({ layout, styles: "theme", routes: { courses: "/khoa-hoc", course: "/khoa-hoc/[slug]", lesson: "/bai-hoc/[slug]" } }), dùng đúng tên option đã làm ở GĐ2;
   - thêm dependency workspace tương ứng.
2. Trang bổ sung:
   - /cau-do (lọc cấp/chủ đề + PuzzleOfTheDay);
   - /cau-do/[slug] (PuzzlePage);
   - /bai-giang/[slug] (LecturePlayer);
   - /bai-giang/[slug]/trinh-chieu (LecturePresenter).
   - Dùng getEmDashCollection/getEmDashEntry, luôn lọc locale, helper bọc requestCached.
3. Giao diện:
   - CSS variables của LMS gán theo màu DSC, nạp theme.css của chess-kit;
   - navy #2B3990 + gold, Roboto, họa tiết ô cờ, responsive;
   - menu có mục "Khóa học", "Câu đố".
4. Chạy lần lượt: LMS Setup → Câu đố Setup → Bài học cờ Setup → Nạp dữ liệu mẫu. Sau đó đi hết checklist mục 7 của kế hoạch bằng agent-browser (desktop + mobile; khách, học viên Subscriber, HLV Contributor). Chụp ảnh vào docs/plans/assets/chess-phase7/.
5. Chạy `pnpm query-counts` và giải trình mọi thay đổi trên trang công khai.
6. KHÔNG deploy production. Ghi các bước deploy (D1, wrangler, chạy Setup trên production) vào báo cáo để Thầy tự quyết.

Tiêu chí hoàn thành:
- [ ] Toàn bộ checklist mục 7 đạt; mục nào không đạt thì ghi rõ.
- [ ] `pnpm build`, `pnpm --filter @emdash-cms/demo-cloudflare typecheck` (script typecheck:demos bỏ qua demo này), test các package và lint đều sạch.
- [ ] Đã viết docs/plans/report_chess_phase7.md, kèm ảnh chụp và hướng dẫn ngắn cho HLV: soạn câu đố, soạn bài, soạn quiz, nhập từ Obsidian, trình chiếu, xem tiến độ học viên.
```

---

## Prompt kiểm tra chéo (tùy chọn, sau mỗi giai đoạn)

```text
Đọc .claude/CLAUDE.md, docs/plans/chess_lms_plan.md và docs/plans/report_chess_phaseN.md.

Rà soát diff của giai đoạn N so với main (git diff main...HEAD). Dùng skill adversarial-reviewer, hoặc /code-review ở mức high.

Tập trung vào:
- quyền của route; route học viên có nhận userId từ input không (IDOR);
- route public có lộ đáp án, lời giải hay teacherNotes không;
- query thêm ở trang công khai;
- tương thích ngược của collection/block/field cũ;
- test có thật sự bắt được lỗi không;
- vi phạm quy tắc Kumo/RTL/comment.

Báo cáo các lỗi đã xác minh, sắp theo mức độ nghiêm trọng. Chỉ sửa những lỗi chắc chắn, nhỏ và nằm trong phạm vi giai đoạn; phần còn lại liệt kê để Thầy quyết định.
```

---

## GĐ8–GĐ9 (để sau, chưa có prompt)

- **GĐ8 Bán hàng:** sửa xác thực webhook Sepay (L5), bật checkout, gói hội viên, coupon, khóa trả phí, chứng chỉ PDF, kiểm thử bằng sandbox Sepay.
- **GĐ9 Công cụ HLV:** bảng điều khiển lớp/học viên, thống kê độ khó câu đố, bảng xếp hạng, MCP tool nhập câu đố/bài học từ Claude Desktop.

Khi GĐ7 xong và Thầy quyết định làm tiếp, hãy yêu cầu Claude lập kế hoạch chi tiết cho GĐ8/GĐ9 dựa trên các báo cáo GĐ0–GĐ7.
