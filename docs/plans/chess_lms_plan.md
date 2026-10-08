# Kế hoạch: Bộ plugin cờ vua cho EmDash LMS (Dương Sinh Chess Suite)

> Ngày lập: 2026-10-08. Prompt triển khai từng giai đoạn: [chess_lms_prompts.md](chess_lms_prompts.md).

## 1. Bối cảnh

Thầy Tường đã cài plugin LMS `@emdashlms/plugin` (id `lms-core`, v0.1, MIT, repo `github.com/emdash-learn/emdash-learn`) cho site `demos/cloudflare` (worker `covuahocduong`). Mục tiêu là biến LMS này thành nền tảng dạy cờ vua theo lộ trình 6 cấp Tốt → Mã → Tượng → Xe → Hậu → Vua: sơ đồ FEN, ván cờ PGN, câu đố, bài học và bài giảng.

**Những gì LMS v0.1 đã có:**
- Collection `courses` (title, subtitle, description, body, cover_image, difficulty, estimated_hours).
- Collection `lessons` (title, course là reference, order, summary, body, video_url, duration_seconds).
- Knowledge Check có 4 loại câu hỏi cố định: `single_choice`, `multiple_choice`, `true_false`, `short_text`. Không mở rộng được loại câu hỏi.
- PT block `learnKnowledgeCheck`.
- Browser client `createLearnBrowserClient()` với `completeLesson` và `deviceProgress`.
- Tiến độ lưu localStorage. Chưa có tài khoản, ghi danh hay chứng chỉ.

**Những gì repo đã có:** plugin `packages/plugins/chessfenpgn` (native, id `chessfenpgn`):
- PT block `chess-fen` (field `fen`) và `chess-pgn` (field `pgn`).
- Field widget `chess-board` (chỉ lưu FEN).
- Trang `/editor` (không hiện trên sidebar).
- Island `ChessBoardIsland.tsx`, dùng chess.js 1.4 và react-chessboard 4.7.3.
- Không có test.
- Có lỗi: PGN có header `[FEN]` (bắt đầu từ thế cờ tùy chỉnh) bị hiển thị sai.

**Ràng buộc kỹ thuật của EmDash** (đã kiểm chứng trong mã nguồn):
1. Form của PT block chỉ là Block Kit (text, number, select, toggle, repeater, media_picker). **Không thể nhúng bàn cờ kéo thả vào form block.** Dữ liệu phức tạp phải soạn ở field widget React hoặc trang admin, rồi block chỉ chọn theo id. Đây là pattern `select` + `optionsRoute` của plugin forms.
2. Plugin không gọi được storage hay route của plugin khác. Cách nối an toàn:
   - collection nội dung dùng chung (`ctx.content`),
   - DOM CustomEvent ở front-end,
   - thư viện npm dùng chung.
3. Hook `content:beforeSave` (cần `content:read` + `content:write`) được phép sửa dữ liệu trước khi lưu. Ta dùng nó để chép sẵn (snapshot) dữ liệu câu đố/bài giảng vào block, nên **trang công khai không phát sinh thêm query** (đúng quy tắc logged-out hot path).
4. Route plugin mặc định yêu cầu `plugins:manage`. Route cho biên tập viên đặt `permission: "content:create"`. Route cho học viên đăng nhập sau này đặt `permission: "content:read"` và dùng `ctx.user`.
5. Plugin native được dùng `adminEntry` (React + Kumo) và `componentsEntry` (Astro `blockComponents`). Trang admin chỉ hiện trên sidebar khi khai báo trong `definePlugin({ admin: { pages } })`.
6. Plugin trong `packages/plugins/*` không dùng Lingui. Chuỗi giao diện tiếng Việt được gom vào từ điển trong `chess-kit`.
7. `markdownToPortableText` có sẵn (`packages/core/src/client/portable-text.ts`, export qua `emdash/client`) và dùng được cho trình nhập từ Obsidian.
8. `SchemaRegistry` được export từ `emdash` để tạo collection và field một cách idempotent. Cách làm mẫu là `src/setup/*` của LMS.

## 2. Quyết định đã chốt với Thầy

| Hạng mục | Quyết định |
|---|---|
| Site đích | `demos/cloudflare` (covuahocduong) |
| Kiến trúc | 1 thư viện dùng chung + 3 plugin |
| Tiến độ học viên | Giai đoạn đầu lưu localStorage. Thiết kế sẵn để sau gắn với tài khoản |
| Ký hiệu | Lưu chuẩn quốc tế (FEN/SAN/UCI). Hiển thị tiếng Việt V/H/X/T/M mặc định, có nút chuyển sang quốc tế |

## 3. Kiến trúc tổng thể

```
packages/chess-kit                (@duongsinh/chess-kit — thư viện, KHÔNG phải plugin)
  ├─ ./core      logic thuần, chạy được trên Workers: FEN/PGN, ký hiệu VN, kiểm tra lời giải, 6 cấp, chủ đề
  ├─ ./react     Board, PgnViewer, PositionEditor, MoveRecorder, PuzzlePlayer, LecturePlayer
  ├─ ./progress  kho tiến độ localStorage (zod, có giới hạn, export/import)
  ├─ ./i18n      từ điển vi (mặc định) + en
  └─ ./theme.css biến CSS thương hiệu (navy #2B3990 + gold, Roboto)

packages/plugins/chessfenpgn      (@emdash-cms/plugin-chessfenpgn — GIỮ id & tên, nâng cấp)
  Sơ đồ FEN + ván cờ PGN + trang "Bàn cờ" (studio)

packages/plugins/chess-puzzles    (@duongsinh/plugin-chess-puzzles, id chess-puzzles)
  Collection chess_puzzles + widget soạn câu đố + block chess-puzzle + trình nhập PGN/EPD/Lichess CSV

packages/plugins/chess-lessons    (@duongsinh/plugin-chess-lessons, id chess-lessons)
  Cầu nối LMS: thêm field cờ cho courses/lessons, bài giảng (chess_lectures + chế độ trình chiếu),
  tự hoàn thành bài học khi giải hết câu đố, nhập bài từ Obsidian
```

**Luồng phụ thuộc:** cả 3 plugin chỉ phụ thuộc `chess-kit`, không phụ thuộc lẫn nhau.
- `chess-puzzles` phát sự kiện `duongsinh-chess:puzzle-solved` trên `window`.
- `chess-lessons` nghe sự kiện đó và gọi `completeLesson()` của LMS.
- Tắt một plugin không làm hỏng các plugin còn lại.

**Nguyên tắc dữ liệu:**
- Hằng số 6 cấp (`tot, ma, tuong, xe, hau, vua`) và danh mục chủ đề chiến thuật nằm trong `chess-kit/core`. Mọi field `level` / `themes` ở các plugin dùng chung giá trị này.
- Chỉ thêm field (additive). Không đổi id plugin, tên block hay tên field đã có, để nội dung cũ không hỏng.
- Package mới đặt `"private": true` cho tới khi Thầy quyết định phát hành, nên chưa cần changeset.

## 4. Các giai đoạn triển khai

Mỗi giai đoạn chạy trong 1 phiên riêng, kết thúc bằng commit + push và file báo cáo `docs/plans/report_chess_phaseN.md`.

### Giai đoạn 0: Nền móng và kiểm tra tương thích
- Chạy `pnpm install`, `pnpm build`, `pnpm lint:json` trên Linux.
  - Commit 835e98d để lại đường dẫn Windows trong `packages/registry-verification/tsdown.config.ts` (`file:///C:/...`). Nếu đường dẫn này làm hỏng build thì sửa cho đa nền tảng.
- Thêm `@emdashlms/plugin` vào `demos/cloudflare/package.json` và thêm `lmsCorePlugin()` vào `plugins` trong `demos/cloudflare/astro.config.mjs`.
  - **Rủi ro chính:** LMS khai báo peer `emdash ^0.31.1`, còn repo đang ở `0.36.0`.
  - Chạy dev, vào admin bằng dev-bypass, chạy **Learn → Setup**, tạo 1 khóa và 1 bài học rồi xem.
  - Nếu không tương thích: ghi rõ lỗi trong báo cáo và đề xuất phương án (`patches/` của pnpm hoặc fork). Dừng lại hỏi Thầy.
- Thêm `@emdash-cms/plugin-chessfenpgn` vào `demos/cloudflare`.
- Xác nhận LMS Setup giữ nguyên field tùy chỉnh khi thêm vào `courses`/`lessons`. Giai đoạn 4 phụ thuộc vào điều này.

### Giai đoạn 1: Thư viện `@duongsinh/chess-kit` (`packages/chess-kit`)

**`core`**
- `parseFen`, `validateFen`.
- `parsePgn`: header, mainline, comment, NAG, cây biến; hỗ trợ `[SetUp]`/`[FEN]`.
- `replayPositions`.
- `sanToVi`/`viToSan`: N→M, B→T, R→X, Q→H, K→V; phong cấp `=Q`→`=H`.
- `parseArrows("e2e4 g1f3:red")`, `parseSquares("e4 d5")`.
- `checkPuzzleMove`: chấp nhận đúng nước trong lời giải. Nếu nước cuối của lời giải là chiếu hết thì chấp nhận **mọi nước chiếu hết**.
- `LEVELS`: slug, nhãn, màu, mô tả cho 6 cấp.
- `THEMES`: ghim, chĩa đôi, xiên, tấn công đôi, chiếu hết 1/2/3 nước, phá phòng thủ, thu hút, tàn cuộc Tốt…

**`react`** (dùng chung cho admin và island front-end; react-chessboard 4.x + chess.js)
- `Board`: hướng bàn, mũi tên, ô tô sáng, kích thước, theme thương hiệu.
- `PgnViewer`: biên bản kèm comment, biến phụ thu gọn, header kỳ thủ/kết quả, phím ←→↑↓, lật bàn, nút VN/quốc tế, responsive mobile.
- `PositionEditor`: xếp thế, quân dự bị, bên đi, quyền nhập thành → FEN.
- `MoveRecorder`: đi nước từ một FEN để ghi lời giải.
- `PuzzlePlayer`, `LecturePlayer`.

**`progress`**
- Key `duongsinh-chess:progress:v1`, dạng `{ puzzles: {[id]: {solvedAt, attempts, hintsUsed}}, lectures: {[id]: {lastStep}} }`.
- Validate bằng zod, giới hạn số bản ghi, mọi truy cập bọc try/catch, có export/import JSON.

**`i18n`, `theme.css`**
- Màu bàn cờ phải đủ tương phản cho quân đen.
- Gold dùng cho nước vừa đi và ô gợi ý.

**Test (vitest)**
- Viết **test thất bại trước** cho lỗi PGN có `[FEN]`.
- Chuyển ký hiệu, kiểm tra lời giải (kể cả mate thay thế), giới hạn của kho tiến độ.

### Giai đoạn 2: Nâng cấp `chessfenpgn` (FEN + PGN)

**Tương thích ngược:** giữ id `chessfenpgn`, block `chess-fen`/`chess-pgn`, field `fen`/`pgn`, widget `chess-board`.

**Thay logic trùng lặp bằng `chess-kit`**
- Xóa logic trong `ChessBoardIsland.tsx`.
- Bỏ div debug trong `ChessFen.astro`.
- Thêm `Props` có kiểu.

**Field Block Kit mới (tùy chọn)**
- `chess-fen`: `orientation` (white/black/auto), `caption`, `arrows`, `highlights`, `size` (S/M/L).
- `chess-pgn`: `orientation`, `startPly`, `showHeaders`, `caption`.
- Đặt `category: "Cờ vua"` cho các block.

**Widget `chess-board`**
- Thêm `options.mode: "fen" | "pgn"`.
- Đọc được cả chuỗi FEN cũ.

**Trang "Bàn cờ"**
- Khai báo trong `admin.pages` để hiện trên sidebar.
- Gồm `PositionEditor`, dán và kiểm tra PGN, các nút copy FEN / PGN / "chuỗi mũi tên".
- Dùng component Kumo và class Tailwind logic (`ms-*`, `ps-*`…).

**Đóng gói**
- Bổ sung `tsconfig.json`, `vitest.config.ts`, README tiếng Việt.
- Thêm `astro` vào peer.
- Bỏ peer `@phosphor-icons/react` vì không dùng.

### Giai đoạn 3: Plugin `chess-puzzles` (Câu đố)

**Collection `chess_puzzles`**
- Tạo bởi route `setup/run` (permission `schema:manage`, idempotent, làm theo cách của LMS và dùng `SchemaRegistry`).
- `supports`: drafts, revisions, search. `urlPattern`: `/cau-do/{slug}`.
- Field:
  - `title` (string, bắt buộc).
  - `puzzle`: json, widget `chess-puzzles:puzzle-editor`, dạng `{fen, solution: UCI[], orientation}`.
  - `prompt` (vd. "Trắng đi, chiếu hết sau 2 nước").
  - `level`: select 6 cấp.
  - `themes`: multiSelect.
  - `rating`: integer.
  - `hint`: text.
  - `explanation`: portableText, có thể chứa `chess-fen`.
  - `source` (vd. "Giáo trình Nga – Tập 2, bài 14").

**Widget `puzzle-editor`** (React)
- Xếp thế, sau đó ghi lời giải gồm nước của người giải và nước đáp của đối phương.
- Có nút chạy thử.

**PT block `chess-puzzle`**
- `puzzle`: select, `optionsRoute: "puzzles/options"` với `permission: "content:create"`, tìm theo tên và lọc theo cấp.
- Các field nhập nhanh không cần kho: `fen`, `solution` (SAN hoặc UCI), `prompt`, `hint`.

**Hook `content:beforeSave`**
- Với mỗi node `chess-puzzle` có `puzzle`, chép `fen/solution/prompt/hint/level/title` từ bản **đã xuất bản** vào node.
- Kết quả là trang công khai render không cần query thêm.
- Route `snapshots/refresh` (admin) duyệt lại các bài có câu đố khi kho thay đổi, có phân trang.

**Front-end**
- `PuzzleBlock.astro` render island `PuzzlePlayer`.
- Đi sai thì báo và cho thử lại. Có gợi ý. Chỉ cho "Xem lời giải" sau N lần sai (lấy từ settings).
- Giải xong thì ghi vào `progress` và phát `duongsinh-chess:puzzle-solved`.
- Export thêm component cho trang site: `PuzzlePage`, `PuzzleOfTheDay`.

**Trang admin**
- "Câu đố": tổng quan, nút Setup, số câu theo cấp.
- "Nhập câu đố":
  - Nguồn: PGN nhiều ván (`[FEN]` + mainline làm lời giải), EPD (`bm`), CSV Lichess puzzle (CC0; lọc theo rating, chủ đề, ≤ 500 câu/lô).
  - Tạo bản nháp qua `ctx.content.create` theo lô khoảng 50.
  - Báo các dòng lỗi.

**Settings:** hướng bàn mặc định, số lần sai trước khi được xem lời giải, có hiện rating cho học viên hay không.

**Test**
- Parser PGN/EPD/CSV.
- Hook snapshot (integration, dùng `setupTestDatabase`).
- Quyền của `puzzles/options`.

### Giai đoạn 4: Plugin `chess-lessons` (Bài học, Bài giảng, cầu nối LMS)

**Setup** (`setup/run`, `schema:manage`)
- Kiểm tra `courses`/`lessons` của LMS đã có. Nếu chưa, hướng dẫn chạy Learn → Setup.
- Thêm field (additive):
  - `courses`: `level`, `sessions` (số buổi), `age_range`.
  - `lessons`: `level`, `themes`, `objectives` (mục tiêu bài học).
- Nút "Tạo khung lộ trình 6 cấp": tạo 6 khóa nháp Tốt → Vua nếu chưa có.
- Nút "Tạo bài học mẫu": bản nháp có khung chuẩn Dương Sinh.
  - Khởi động (câu chuyện).
  - Kiến thức mới (FEN/PGN).
  - Thực hành (câu đố).
  - Kiểm tra (`learnKnowledgeCheck`).
  - Bài tập về nhà.

**Bài giảng: collection `chess_lectures`** (`urlPattern: /bai-giang/{slug}`)
- Field: `title`, `level`, `course` (reference tùy chọn), `summary`.
- Field `script`: json, widget `chess-lessons:lecture-builder`.
  - Dạng `{steps: [{id, title, fen | {pgn, ply}, arrows, highlights, narration, teacherNotes, question?: {prompt, answers}}]}`.
- Widget `lecture-builder`: danh sách bước, kéo đổi thứ tự. Mỗi bước kế thừa thế của bước trước, cho phép đi tiếp nước, vẽ mũi tên.
- PT block `chess-lecture`:
  - Chọn bài giảng qua `optionsRoute`.
  - Snapshot các bước qua `beforeSave`, **bỏ `teacherNotes`**.
  - Front-end render `LecturePlayer` để học viên xem từng bước trong bài học.
- Chế độ trình chiếu: export `LecturePresenter.astro` cho trang site `/bai-giang/[slug]/trinh-chieu`.
  - Toàn màn hình, bàn cờ lớn.
  - PageUp/PageDown (dùng được bút trình chiếu), phím B để tắt màn hình, đồng hồ.
  - `teacherNotes` chỉ render phía server khi `Astro.locals.user` có vai trò ≥ Contributor (HLV). Khách ẩn danh không bao giờ nhận được ghi chú.

**Cầu nối tiến độ LMS**
- Script front-end nghe `duongsinh-chess:puzzle-solved`.
- Khi mọi câu đố trên trang bài học đã giải xong, gọi `createLearnBrowserClient().completeLesson(lessonId)`.
- Bật/tắt bằng setting `autoCompleteLesson`.

**Trợ giúp Knowledge Check**
- Loại câu hỏi của LMS là cố định. Cách soạn câu hỏi cờ: đặt block `chess-fen` ngay trên block `learnKnowledgeCheck` và dùng câu hỏi `short_text`.
- Trang admin có công cụ "Sinh đáp án": nhập FEN + nước đi, xuất danh sách `acceptedAnswers` đủ biến thể (Qh7#, Qxh7#, Hh7#, Hxh7#, có/không có +/#) để dán vào.

**Nhập từ Obsidian** (trang admin)
- Dán hoặc tải lên 1 hay nhiều `.md`.
- Frontmatter: `title`, `course` (slug), `order`, `level`, `themes`, `objectives`.
- Body đi qua `markdownToPortableText`. Các code fence `fen`, `pgn`, `puzzle` (khóa `fen:`/`solution:`/`prompt:`/`hint:`), `lecture` (slug) được đổi thành block cờ tương ứng.
- Tạo bài học **nháp** gắn vào khóa.
- Cảnh báo các `![[wikilink]]` ảnh chưa xử lý.
- Ghi quy ước Markdown vào README để Thầy soạn trong vault OBSIDIAN2026.

**Test:** chuyển đổi Markdown → PT, snapshot bài giảng (không lộ `teacherNotes`), route setup idempotent.

### Giai đoạn 5: Tích hợp site `demos/cloudflare` và nội dung mẫu

**Đăng ký plugin** trong `astro.config.mjs`:

```js
plugins: [
  formsPlugin(),
  aiSearch(...),
  lmsCorePlugin(),
  chessfenpgnPlugin(),
  chessPuzzlesPlugin(),
  chessLessonsPlugin(),
]
```

**Trang site**
- `/khoa-hoc`: theo 6 cấp.
- `/khoa-hoc/[slug]`: khóa học kèm danh sách bài theo `order`.
- `/bai-hoc/[slug]`: body, bài trước/sau, nút hoàn thành.
- `/cau-do`: lọc cấp/chủ đề, câu đố hôm nay.
- `/cau-do/[slug]`.
- `/bai-giang/[slug]` và `/bai-giang/[slug]/trinh-chieu`.

**Yêu cầu kỹ thuật cho trang**
- Đổi `urlPattern` của `courses`/`lessons` sang đường dẫn tiếng Việt.
- Dùng `getEmDashCollection`/`getEmDashEntry`, lọc `locale`, bọc helper bằng `requestCached`.
- Trang khóa học tối đa 2 query. Chạy `pnpm query-counts` để kiểm tra.

**Giao diện:** áp `theme.css`, font Roboto, họa tiết ô cờ, đúng nhận diện Dương Sinh.

**Nội dung mẫu**
- Nút "Nạp dữ liệu mẫu" trong `chess-lessons`: 1 khóa Cấp Tốt, 3 bài học, 10 câu đố, 1 bài giảng.
- Không sửa `seed/seed.json` gốc.

**Kiểm thử**
- Kiểm thử thủ công bằng agent-browser trên desktop và mobile.
- Chụp ảnh màn hình vào báo cáo.
- Deploy production chỉ khi Thầy đồng ý.

### Giai đoạn 6 (để sau, chưa làm): Tài khoản học viên và báo cáo HLV
- Route private `permission: "content:read"` (Subscriber) dùng `ctx.user.id`.
- Storage `progress` với index `[userId, puzzleId]`. Đồng bộ localStorage lên tài khoản khi đăng nhập.
- Bảng điều khiển HLV theo lớp/học viên, thống kê độ khó câu đố, bảng xếp hạng.
- Mở route nhập câu đố thành MCP tool (`mcp` trong `definePlugin`) để Claude Desktop tạo câu đố thẳng từ vault Obsidian.

## 5. Quy tắc bắt buộc (theo `CLAUDE.md` của repo)
- Trước khi sửa: `pnpm lint:json | jq '.diagnostics | length'` phải sạch.
- Trong khi làm: `pnpm lint:quick` sau mỗi lần sửa, `pnpm typecheck` sau mỗi đợt sửa, `pnpm format` (oxfmt, tab).
- Sửa lỗi theo TDD: test thất bại → sửa → xác minh.
- Không sửa `packages/core` hay `packages/admin` (scope discipline, tránh xung đột khi đồng bộ upstream). Nếu thật sự cần, ghi vào báo cáo và hỏi Thầy.
- Không thêm query vào trang công khai. Dùng snapshot `beforeSave` và `requestCached`.
- Admin UI dùng Kumo, token màu `kumo-*` trừ phần bàn cờ, class Tailwind logic.
- Comment chỉ giải thích "vì sao" không hiển nhiên.
- Import nội bộ dùng đuôi `.js`. Import kiểu dùng `import type`.
- Không đưa thay đổi `messages.po` vào commit.
- Thư viện: chess.js (BSD-2), react-chessboard (MIT), dữ liệu Lichess (CC0). **Không dùng chessground (GPL).**

## 6. Rủi ro và cách xử lý

| Rủi ro | Xử lý |
|---|---|
| LMS yêu cầu emdash ^0.31, repo là 0.36 | Giai đoạn 0 kiểm chứng trước. Nếu hỏng thì dừng và hỏi Thầy |
| Block PT không có giao diện kéo thả | Soạn ở widget/collection, block chọn theo id, snapshot khi lưu |
| Snapshot cũ khi câu đố được sửa | Lưu lại bài học hoặc chạy route `snapshots/refresh` |
| React island nặng trên mobile | `client:visible` và đo bundle. Tối ưu sau nếu cần |
| Xung đột khi đồng bộ upstream | Code mới nằm trong package riêng, không đụng core |
| Đường dẫn Windows trong tsdown config | Sửa ở Giai đoạn 0 nếu làm hỏng build Linux |

## 7. Kiểm chứng tổng thể (cuối Giai đoạn 5)
1. `pnpm build && pnpm typecheck && pnpm lint:json` sạch. `pnpm --filter "@duongsinh/*" test` và test của `chessfenpgn` đều pass.
2. `pnpm --filter @emdash-cms/demo-cloudflare dev` rồi vào `/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin`.
3. Trong admin:
   - Learn → Setup, Câu đố → Setup, Bài học cờ → Setup, Nạp dữ liệu mẫu.
   - Tạo câu đố bằng widget. Nhập 20 câu từ CSV Lichess.
   - Soạn bài học có `chess-fen`, `chess-pgn` (có `[FEN]`), `chess-puzzle`, `chess-lecture`, `learnKnowledgeCheck`.
4. Ngoài site, ở chế độ ẩn danh:
   - Xem bài học, giải hết câu đố → LMS đánh dấu hoàn thành.
   - Đổi ký hiệu VN/quốc tế.
   - Mở trang trình chiếu: không thấy ghi chú HLV. Đăng nhập HLV thì thấy.
5. `pnpm query-counts`: trang công khai không tăng query so với snapshot cũ, hoặc nếu tăng thì có giải trình.

