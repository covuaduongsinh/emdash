# Bộ prompt triển khai v3: Dương Sinh Chess Suite cho covuahocduong.com

Đi kèm kế hoạch [chess_lms_plan.md](chess_lms_plan.md) bản v3 (2026-10-09). LMS là bản emdash-lms nằm sẵn trong repo tại `packages/plugins/emdash-lms`. Chỉ làm trên site `demos/cloudflare` (covuahocduong.com).

Mỗi giai đoạn chạy trong **một phiên Claude Code mới**.

## Cách dùng

1. **Trước phiên đầu tiên:** merge nhánh `claude/vigilant-mccarthy-jfjram` vào `main`, rồi mở phiên mới từ `main`.
2. Dán **Prompt chung** rồi tới **Prompt GĐ…** ngay bên dưới, trong cùng một tin nhắn.
3. Thứ tự: **GĐ0 → GĐ1 → GĐ2a → GĐ2b → GĐ3 → GĐ4 → GĐ5 → GĐ6 → GĐ7**.

   | GĐ | Nội dung |
   |---|---|
   | 0 | Kiểm kê |
   | 1 | chess-kit |
   | 2a | Ổn định LMS |
   | 2b | SePay |
   | 3 | Quiz |
   | 4 | chessfenpgn |
   | 5 | Câu đố |
   | 6 | Bài học/Bài giảng |
   | 7 | Hoàn thiện site |

   Xong mỗi giai đoạn: đọc `docs/plans/report_chess_phaseN.md`, merge vào `main`, rồi mới mở phiên tiếp theo.
4. **Chuẩn bị cho GĐ0:** Thầy chạy lệnh sau trên máy có quyền Cloudflare rồi đưa file cho phiên làm việc (đặt ngoài git, ví dụ thư mục tạm của phiên):

   ```bash
   wrangler d1 export emdash_db --remote --output=emdash_db-backup.sql
   ```

   **Không commit file này**, vì nó chứa dữ liệu người dùng.
5. **Không deploy giữa GĐ2a và GĐ2b.** Mọi lần deploy, Thầy tự làm theo runbook trong báo cáo.
6. Sau GĐ2a, GĐ2b và GĐ3 **bắt buộc** chạy Prompt kiểm tra chéo trong một phiên khác trước khi merge.

**Lệnh khởi động ngắn** (đổi `X` thành 0, 1, 2a, 2b, 3…):

```text
Đọc docs/plans/chess_lms_prompts.md rồi thực hiện nguyên văn "Prompt chung" và "Prompt GĐX". Làm xong thì viết docs/plans/report_chess_phaseX.md, commit và push.
```

---

## Prompt chung (dán đầu mỗi phiên)

```text
Bạn đang làm cho Thầy Tường (Công ty CP Cờ vua Dương Sinh). Trả lời bằng tiếng Việt, đi thẳng vào việc.

DỰ ÁN: "Dương Sinh Chess Suite" cho covuahocduong.com (Cờ Vua Học Đường), chạy trên EmDash CMS + Cloudflare (worker covuahocduong, D1 emdash_db). Gồm:
- emdash-lms: bản fork của tohaitrieu/emdash-lms, nằm ở packages/plugins/emdash-lms, plugin id "lms", ĐANG CHẠY TRÊN PRODUCTION;
- thư viện @duongsinh/chess-kit;
- 3 plugin cờ: chessfenpgn (đã có), chess-puzzles, chess-lessons.
Site duy nhất: demos/cloudflare. KHÔNG sửa demos/dsc-edu-vn.

TRƯỚC KHI LÀM:
1. Đọc kỹ:
   - .claude/CLAUDE.md (quy tắc repo, bắt buộc tuân thủ);
   - docs/plans/chess_lms_plan.md (kế hoạch v3; mục 1.1 là danh sách lỗi L1–L12, mục 5 là quy tắc);
   - mọi file docs/plans/report_chess_phase*.md đã có.
2. Nạp skill `creating-plugins`. Docs của skill lệch code ở các chỗ sau, khi lệch thì tin code (packages/core/src/plugins/*) và docs/src/content/docs/plugins/**:
   - definePlugin bắt buộc có id;
   - không có usePluginAPI, dùng apiFetch/parseApiResponse từ "emdash/plugin-utils";
   - route mặc định private (cần plugins:manage) trừ khi khai permission hoặc public: true;
   - handler route native nhận ĐÚNG 1 tham số RouteContext (ctx.input, ctx.user, ctx.content…), xem packages/core/src/plugins/routes.ts;
   - module adminEntry được import dạng `import * as`, nên phải export TÊN `pages`/`widgets`/`fields`.
3. Xác nhận các giai đoạn trước đã có trong code đúng như báo cáo. Thiếu thì dừng lại báo Thầy.
4. Chạy `pnpm install`, `pnpm build`, rồi `pnpm lint:json | jq '.diagnostics | length'` và ghi lại con số ban đầu.

QUY TẮC:
- Chỉ làm đúng phạm vi giai đoạn. Không refactor ngoài phạm vi.
- Không sửa packages/core hoặc packages/admin. Nếu thật sự cần thì dừng lại hỏi Thầy.
- Sửa lỗi theo TDD: test thất bại → sửa → pass.
- Sau mỗi lần sửa: `pnpm lint:quick`. Sau mỗi đợt: typecheck. Trước khi commit: `pnpm format`.
- Tương thích ngược tuyệt đối:
  - giữ id plugin, tên collection/field/block, id dữ liệu (kể cả id không phải ULID như course_chess_intro);
  - giữ đường dẫn /courses, /course/[slug], /lesson/[slug], /plans, /checkout/[id];
  - chỉ THÊM field;
  - giữ API của emdash-lms tương thích để demos/dsc-edu-vn vẫn build được.
- Schema chỉ thay đổi qua route setup/run. KHÔNG chạy SQL tay lên D1, KHÔNG tạo script SQL mới.
- Route học viên chỉ dùng ctx.user.id, TUYỆT ĐỐI không nhận userId từ input.
- Trang công khai cho khách không được thêm query DB (dùng snapshot content:beforeSave và requestCached).
- Không commit bí mật (API key, số tài khoản) hoặc file export D1. Bí mật đọc từ settings dạng secret hoặc process.env.
- KHÔNG deploy, KHÔNG gọi wrangler với --remote. Chỉ viết runbook để Thầy tự làm.
- Admin UI: dùng component Kumo, class Tailwind logic (ms-/me-/ps-/pe-/start-/end-), không dùng `dark:`.
- Chuỗi giao diện tiếng Việt, gom vào i18n của @duongsinh/chess-kit khi package này đã có.
- Cấp độ dùng 6 cấp Tốt → Mã → Tượng → Xe → Hậu → Vua (LEVELS trong chess-kit/core).
- Lưu FEN/SAN/UCI chuẩn quốc tế; ký hiệu V/H/X/T/M chỉ là lớp hiển thị.
- Dùng chess.js và react-chessboard 4.x. KHÔNG dùng chessground (GPL).
- Comment chỉ để giải thích "vì sao". Không nhắc issue/PR/giai đoạn trong comment.
- Không commit messages.po.
- Không mở issue/PR ở tohaitrieu/emdash-lms nếu Thầy chưa đồng ý.
- Bị chặn thật sự thì hỏi Thầy đúng 1 câu, kèm phương án đề xuất.
- Mọi file kế hoạch và báo cáo CHỈ lưu trong docs/plans/ (trên máy Thầy là D:\code\emdash\docs\plans). Không tạo docs/plan/ hay thư mục kế hoạch nào khác. Nếu công cụ lưu kế hoạch vào thư mục nội bộ thì chép bản cuối vào docs/plans/.

KẾT THÚC PHIÊN:
1. Viết docs/plans/report_chess_phaseX.md, gồm:
   - đã làm gì (kèm đường dẫn file);
   - lệnh kiểm chứng và kết quả thật;
   - chỗ lệch so với kế hoạch và lý do;
   - việc tồn đọng;
   - runbook deploy nếu giai đoạn có thay đổi cần lên production;
   - ghi chú bàn giao.
2. Commit theo Conventional Commits, push lên nhánh của phiên. Không tạo PR trừ khi Thầy yêu cầu.
3. Tóm tắt cho Thầy trong 5–10 dòng.
```

---

## Prompt GĐ0: Kiểm kê và nền móng

```text
GĐ0: KIỂM KÊ VÀ NỀN MÓNG (xem mục 1 và mục 4 "GĐ0" trong docs/plans/chess_lms_plan.md)

Mục tiêu: xác nhận bằng chạy thật hiện trạng của emdash-lms và schema D1, rồi chuẩn bị nền (test, NOTICE, private) cho GĐ2a. Chưa sửa lỗi L1–L12.

Việc cần làm:
1. Build:
   - chạy `pnpm build` trên Linux;
   - packages/registry-verification/tsdown.config.ts có chuỗi `file:///C:/...` (commit 835e98d): nếu làm hỏng build/test thì sửa cho đa nền tảng, kèm kết quả trước và sau;
   - ghi lại emdash-lms (tsdown → dist) build có ổn không.
2. packages/plugins/emdash-lms:
   - thêm "private": true vào package.json;
   - thêm NOTICE.md: nguồn tohaitrieu/emdash-lms @5ce68d1, tác giả Tô Triều, MIT; mục "Thay đổi so với bản gốc" liệt kê các thay đổi đã có trong commit d7b6e5d (Việt hóa, checkout VND/SePay cho khóa lẻ, sửa đường dẫn Windows);
   - thêm vitest.config.ts theo packages/plugins/forms;
   - thử chuyển "exports" sang src theo quy ước packages/plugins/forms. Nếu demos/cloudflare hoặc demos/dsc-edu-vn build lỗi vì việc này thì giữ dist và ghi lại lý do.
3. Viết test GHI NHẬN LỖI (dùng `it.fails` hoặc tương đương, ghi rõ sẽ chuyển thành test thường ở GĐ2a/2b):
   - L1: gọi handler route `plans` theo cách EmDash gọi (1 tham số RouteContext) thì ném lỗi;
   - L2: module admin không có export tên `pages`;
   - L12: route checkout không public, không nhận form-urlencoded.
4. Kiểm toán schema (L11):
   - nếu Thầy đã đưa file emdash_db-backup.sql thì nạp vào một SQLite cục bộ ngoài git rồi chạy demo trên bản đó;
   - nếu chưa có thì dựng bản sao bằng demos/cloudflare/scripts/lms-schema.sql + remote-lms-seed.sql + update-academic-data.sql, và ghi rõ là bản dựng lại;
   - lập bảng đối chiếu: bảng ec_* ↔ _emdash_collections ↔ _emdash_fields (thiếu gì, sai type gì, các giá trị updated_at='undefined');
   - dùng SchemaRegistry.discoverOrphanedTables() (packages/core/src/schema/registry.ts) để liệt kê bảng mồ côi.
5. Chạy `pnpm --filter @emdash-cms/demo-cloudflare dev` (dữ liệu local), vào bằng dev-bypass. Ghi hiện trạng L1–L12 (thấy / không thấy / khác mô tả):
   - mở /courses, /course/<slug>, /lesson/<slug>, /plans, /checkout/<id>;
   - bấm "Đăng ký" ở trang checkout;
   - mở các trang admin của LMS.
   Chụp ảnh bằng agent-browser, lưu vào docs/plans/assets/chess-phase0/. Ảnh không được chứa email hay dữ liệu thật của người dùng.

Tiêu chí hoàn thành:
- [ ] Build sạch, hoặc đã ghi rõ lỗi có từ trước, không do mình gây ra.
- [ ] Có NOTICE.md, "private": true, vitest; test ghi nhận L1/L2/L12 chạy được.
- [ ] Có bảng kiểm toán schema và bảng hiện trạng L1–L12 trong báo cáo.
- [ ] Không có file dữ liệu D1 nào bị commit.
- [ ] Đã viết docs/plans/report_chess_phase0.md.

ĐIỂM DỪNG: nếu thiếu bản sao D1 khiến không kiểm toán được dữ liệu thật thì vẫn làm trên bản dựng lại, nhưng ở cuối báo cáo phải đề nghị Thầy cung cấp file export trước khi bắt đầu GĐ2a.
```

---

## Prompt GĐ1: Thư viện `@duongsinh/chess-kit`

```text
GĐ1: THƯ VIỆN @duongsinh/chess-kit (xem mục 4 "GĐ1" trong docs/plans/chess_lms_plan.md)

Mục tiêu: tạo packages/chess-kit, thư viện dùng chung (KHÔNG phải plugin) cho LMS và 3 plugin cờ.

Cấu trúc:
- package.json:
  - name "@duongsinh/chess-kit", "private": true, "type": "module", MIT;
  - exports "./core", "./react", "./progress", "./i18n", "./theme.css";
  - dependencies chess.js và react-chessboard (đúng phiên bản trong packages/plugins/chessfenpgn), zod theo catalog;
  - peer react;
  - tsconfig/vitest theo packages/plugins/forms.
- src/core/ (không DOM, không Node built-in, chạy được trên Workers):
  - fen.ts: parseFen, validateFen (lỗi tiếng Việt);
  - pgn.ts: parsePgn → { headers, startFen, tree }, tree gồm mainline, comment, NAG, biến; hỗ trợ [SetUp]/[FEN]; replayPositions;
  - notation.ts: sanToVi/viToSan (N→M, B→T, R→X, Q→H, K→V, cả phong cấp); uciToSan/sanToUci;
  - annotations.ts: parseArrows("e2e4 g1f3:red"), parseSquares("e4 d5");
  - puzzle.ts:
    - checkPuzzleMove(fen, solutionUci[], plyIndex, moveUci) → { correct, opponentReply?, done }, chấp nhận MỌI nước chiếu hết nếu nước cuối của lời giải là chiếu hết;
    - gradeChessAnswer({ fen, solution }, playedUci[]) → { correct, reason }, dùng để chấm phía server;
  - levels.ts: LEVELS gồm 6 cấp tot, ma, tuong, xe, hau, vua (nhãn, màu, mô tả);
  - themes.ts: THEMES (chủ đề chiến thuật, nhãn tiếng Việt).
- src/react/:
  - Board (orientation, arrows, highlights, size, theme);
  - PgnViewer (comment, biến thu gọn, header, phím ←→↑↓, lật bàn, nút VN/quốc tế, responsive);
  - PositionEditor (xếp thế, quân dự bị, bên đi, nhập thành → FEN);
  - MoveRecorder (ghi chuỗi UCI từ một FEN);
  - PuzzlePlayer (prop onSolved; phát window CustomEvent "duongsinh-chess:puzzle-solved");
  - LecturePlayer.
- src/progress/:
  - localStorage "duongsinh-chess:progress:v1" dạng { puzzles, lectures, lessons };
  - zod, có giới hạn, try/catch, export/import JSON;
  - drainForSync().
- src/i18n/: từ điển vi (mặc định) + en, hàm t(key).
- src/theme.css: --ds-navy #2B3990, --ds-gold, màu ô đủ tương phản cho quân đen; gold cho nước vừa đi và gợi ý; Roboto.

Test (viết TRƯỚC):
- PGN có [FEN] replay đúng (đây là lỗi đang có ở chessfenpgn/src/ChessBoardIsland.tsx);
- comment, NAG, biến;
- ký hiệu hai chiều (phong cấp, nhập thành, +/#);
- checkPuzzleMove (đúng, sai, mate thay thế, nước đáp);
- gradeChessAnswer;
- progress (dữ liệu hỏng, vượt giới hạn, export/import, drainForSync).

Tiêu chí hoàn thành:
- [ ] `pnpm --filter @duongsinh/chess-kit test` pass; typecheck, lint sạch.
- [ ] Có README tiếng Việt ngắn.
- [ ] Đã viết docs/plans/report_chess_phase1.md.

Ngoài phạm vi: chưa sửa LMS, chessfenpgn hay plugin khác.
```

---

## Prompt GĐ2a: Ổn định LMS

```text
GĐ2a: ỔN ĐỊNH LMS, packages/plugins/emdash-lms (xem mục 1.1 và mục 4 "GĐ2a" trong docs/plans/chess_lms_plan.md, cùng báo cáo GĐ0)

Mục tiêu: LMS chạy đúng, an toàn về quyền, schema hợp lệ trên dữ liệu đang có; có kiểm tra quyền xem bài và tiến độ 2 lớp. Thanh toán để GĐ2b.

CẢNH BÁO AN TOÀN: sửa L1 làm mọi route chạy được trở lại, trong đó có webhook. Vì vậy ở GĐ2a KHÔNG đăng ký route checkout và webhook (để GĐ2b). Trang /checkout/[id] tạm hiện "Đang bảo trì thanh toán, vui lòng liên hệ". Phiên này KHÔNG deploy.

Việc cần làm (TDD; các test ghi nhận lỗi ở GĐ0 phải chuyển thành test thường và pass):
1. L1:
   - mọi handler nhận 1 RouteContext;
   - khai `input: z.object(...)`;
   - lỗi dùng PluginRouteError.
2. L2 + admin (React + Kumo, tiếng Việt), export TÊN `pages`:
   - "Cài đặt LMS": nút Setup, trạng thái schema;
   - "Học viên": ghi danh/tiến độ, lọc theo khóa, ghi danh tay bằng email (capability users:read);
   - "Cài đặt".
   Plans/Orders để GĐ2b.
3. L10: capability tên mới (content:read, content:write, users:read), bỏ `as any`, typecheck sạch.
4. L9 + L11: route "setup/run" (permission "schema:manage"), idempotent:
   - định nghĩa schema bằng module TypeScript, lấy từ seed/*.json;
   - bảng ec_* có sẵn mà chưa đăng ký → SchemaRegistry.registerOrphanedTable;
   - collection chưa có → tạo bằng SchemaRegistry;
   - field thiếu → thêm;
   - field string + choices → select + validation.options (cùng cột TEXT);
   - KHÔNG xóa, đổi tên hay đổi id;
   - sửa các _emdash_fields có updated_at='undefined' bằng API của registry nếu có; nếu không có API thì ghi lại, không chạy SQL tay;
   - test: chạy 2 lần không đổi gì; chạy trên bản sao D1 của GĐ0 thì 6 khóa / 12 bài cũ vẫn đọc được.
5. L3, L4, L8: route học viên (permission "content:read", chỉ dùng ctx.user.id):
   - me/access (courseId, lessonId?), me/enroll (chỉ khóa access_level free), progress/complete (lessonId), progress/sync (dữ liệu từ chess-kit drainForSync), me/progress (courseId);
   - truy vấn bằng where.fieldFilters + phân trang;
   - cập nhật enrollments.progress và completed_at;
   - test IDOR: truyền userId người khác cũng không có tác dụng;
   - giữ export cũ (checkCourseAccess…) để demos/dsc-edu-vn không vỡ.
6. L7, L8: trang (giữ nguyên đường dẫn):
   - /course/[slug]: 1 khóa theo slug + chương/bài của khóa đó qua filter, helper bọc requestCached, tối đa 3 query;
   - /lesson/[slug]:
     - quyền phía server: free hoặc is_preview thì cho xem; ngược lại cần Astro.locals.user + (ghi danh hoặc thẻ thư viện active còn hạn);
     - không đủ quyền thì hiện giới thiệu + nút "Đăng ký thẻ thư viện" (trỏ /plans);
     - khách ẩn danh không phát sinh query kiểm tra quyền;
   - thanh tiến độ, nút "Hoàn thành bài";
   - giao thức yêu cầu hoàn thành: đếm [data-lms-requirement], nghe `lms:requirement-done`; đủ thì gọi progress/complete (đã đăng nhập) hoặc lưu localStorage (khách); đăng nhập thì gọi progress/sync một lần.
7. Xác minh và ghi vào báo cáo cách học viên tạo tài khoản trên site này: self-signup theo tên miền cho phép, magic link, lời mời (xem packages/auth/src/signup.ts và trang đăng nhập). GĐ2b cần kết quả này.
8. Cập nhật NOTICE.md và README tiếng Việt.

Tiêu chí hoàn thành:
- [ ] L1, L2, L3, L4, L7, L8, L9, L10, L11 đã sửa và có test. L5, L6, L12 ghi rõ là để GĐ2b.
- [ ] `pnpm --filter emdash-lms test`, typecheck, lint sạch; demos/dsc-edu-vn vẫn typecheck được (chỉ kiểm tra, không sửa).
- [ ] Trên bản sao D1: Setup chạy OK; khách xem được bài free/preview; bài cần thẻ bị chặn; học viên Subscriber hoàn thành bài thì trang "Học viên" thấy.
- [ ] `pnpm query-counts`: giải trình mọi thay đổi.
- [ ] Đã viết docs/plans/report_chess_phase2a.md kèm ảnh chụp. Ghi rõ "KHÔNG deploy cho tới khi xong GĐ2b".

ĐIỂM DỪNG:
- cần sửa packages/core;
- học viên không có cách nào tự tạo tài khoản (đưa phương án: HLV mời, mở tên miền, hoặc đơn khách vãng lai theo email);
- Setup có nguy cơ làm mất dữ liệu trên bản sao D1.
```

---

## Prompt GĐ2b: Thanh toán SePay

```text
GĐ2b: THANH TOÁN SePay, packages/plugins/emdash-lms (xem mục 4 "GĐ2b" trong docs/plans/chess_lms_plan.md và báo cáo GĐ2a)

Mục tiêu: học viên mua thẻ thư viện hoặc khóa lẻ bằng chuyển khoản VietQR qua SePay, được kích hoạt tự động, và không thể bị giả mạo.

Chuẩn bị: hỏi Thầy (nếu chưa có) thông tin tài khoản SePay sandbox/thật, ngân hàng, số tài khoản nhận, API key webhook. Phiên làm việc KHÔNG ghi các giá trị này vào repo; chỉ cấu hình qua settings secret hoặc biến môi trường.

Việc cần làm (TDD):
1. Đọc tài liệu chính thức hiện hành của SePay về webhook (cách xác thực: header API key / chữ ký, các trường payload, mã giao dịch) và về VietQR. Ghi link và tóm tắt vào báo cáo. Không đoán.
2. L12, luồng mua:
   - /checkout/[id] (giữ đường dẫn, giữ ?type=course):
     - chưa đăng nhập thì mời đăng nhập/tạo tài khoản (theo kết quả GĐ2a);
     - đã đăng nhập thì gọi route "checkout/create" bằng apiFetch (JSON + X-EmDash-Request), bỏ <form method=POST>.
   - checkout/create (permission "content:read", ctx.user.id):
     - tạo orders pending gồm user_id, type, item_id, amount VND tính phía server từ giá/sale_price, mã đối soát LMS-XXXXXXXX duy nhất, hết hạn sau N giờ;
     - trả thông tin để hiện VietQR (ngân hàng, số tài khoản, số tiền, nội dung).
   - Trang chờ: hiện QR + nội dung chuyển khoản, tự kiểm tra trạng thái qua "me/orders/get" (chỉ đơn của chính mình).
3. L5 + L6, webhook:
   - route "webhook/sepay" (public, tên cố định; bỏ "webhook/:providerId");
   - xác thực BẮT BUỘC theo docs SePay; thiếu cấu hình hoặc sai khóa thì từ chối (401), không bao giờ bỏ qua;
   - tìm đơn theo mã đối soát trong nội dung;
   - kiểm tra số tiền ≥ amount, tài khoản nhận đúng, đơn còn pending và chưa hết hạn;
   - idempotent theo mã giao dịch SePay (lưu lại; gửi lại cùng giao dịch thì trả 200 mà không kích hoạt lần 2);
   - kích hoạt: type membership → tạo/gia hạn memberships (status active, expires_at theo billing_period); type course → tạo enrollments (source purchase, order_id);
   - ghi log không chứa dữ liệu nhạy cảm.
4. Admin (Kumo, tiếng Việt):
   - "Đơn hàng": lọc theo trạng thái; "Xác nhận tay" cho đơn chuyển khoản sai nội dung (ghi người xác nhận và lý do);
   - "Thẻ thư viện" (plans) và "Hội viên" (members);
   - "Cài đặt thanh toán": các field secret.
5. Stripe: không đăng ký khi chưa có khóa. Ghi đề xuất bỏ "stripe" khỏi providers trong demos/cloudflare/astro.config.mjs và chỉ sửa nếu Thầy đồng ý.
6. Trang /plans: bỏ huy hiệu giảm giá kiểu thương mại theo định hướng học đường đã có; nút trỏ tới /checkout/[id].

Test:
- webhook thiếu/sai khóa bị từ chối;
- payload hợp lệ thì kích hoạt đúng;
- gửi lại cùng giao dịch không kích hoạt 2 lần;
- thiếu tiền không kích hoạt;
- đơn hết hạn không kích hoạt;
- mã đơn không tồn tại → 200 nhưng không làm gì (theo khuyến nghị của SePay, xác nhận trong docs);
- me/orders/get không xem được đơn người khác;
- amount luôn tính phía server.

Tiêu chí hoàn thành:
- [ ] L5, L6, L12 đã sửa và có test; checkout/webhook chỉ được đăng ký khi đã cấu hình đủ.
- [ ] Thử với sandbox SePay (hoặc payload mẫu đúng định dạng docs nếu chưa có sandbox; ghi rõ trong báo cáo).
- [ ] Test, typecheck, lint sạch.
- [ ] docs/plans/report_chess_phase2b.md có runbook deploy: backup D1 → deploy bản preview → chạy Setup → cấu hình webhook URL /_emdash/api/plugins/lms/webhook/sepay trên SePay → chuyển khoản thử số tiền nhỏ → deploy production. Thầy tự làm.

ĐIỂM DỪNG:
- không đọc được tài liệu SePay;
- chưa có cấu hình SePay để thử (vẫn làm phần code + test với payload mẫu, rồi hỏi Thầy).
```

---

## Prompt GĐ3: Quiz có câu hỏi cờ

```text
GĐ3: QUIZ CÓ CÂU HỎI CỜ, trong packages/plugins/emdash-lms (xem mục 4 "GĐ3" trong docs/plans/chess_lms_plan.md)

Mục tiêu: HLV soạn quiz trên một màn hình; học viên làm quiz ngay trong bài; câu hỏi cờ chấm phía server bằng chess-kit.

Việc cần làm (dependency "@duongsinh/chess-kit": "workspace:*"):
1. Schema (qua setup/run, additive): questions.type thêm lựa chọn "chess"; câu chess có answers = { fen, solution: UCI[], orientation, prompt }.
2. Route quản trị "quiz/*" (permission "content:edit_any"): CRUD và sắp xếp quiz + câu hỏi qua ctx.content.
3. Trang admin "Soạn quiz" (React + Kumo):
   - giao diện đổi theo loại câu: single/multiple, text/fill_blank, chess (PositionEditor + MoveRecorder, có nút chạy thử);
   - nút "Lấy từ kho câu đố" gọi /_emdash/api/plugins/chess-puzzles/puzzles/options nếu plugin đó có mặt, không có thì ẩn.
4. Route học viên:
   - "quiz/present" (public): chỉ quiz đã xuất bản, BỎ đáp án/lời giải, xáo câu nếu random_order;
   - "quiz/submit":
     - chấm phía server, câu chess dùng gradeChessAnswer;
     - trả điểm, đạt/không đạt, giải thích;
     - bản public cho khách thì không lưu; bản "me/quiz/submit" (content:read) thì lưu quiz_submissions theo ctx.user.id, tôn trọng allow_reset;
     - timer kiểm tra phía server.
5. PT block "lms-quiz" (chọn quiz qua optionsRoute, permission "content:create"): component Astro render island QuizRunner; câu chess dùng PuzzlePlayer; render data-lms-requirement; đạt passmark thì phát `lms:requirement-done`.

Test:
- chấm từng loại câu;
- JSON trả về từ quiz/present KHÔNG chứa đáp án;
- quyền;
- IDOR;
- timer.

Tiêu chí hoàn thành:
- [ ] 1 quiz gồm 3 câu (single, text, chess) chèn vào bài; khách làm được; học viên làm thì có bản ghi quiz_submissions.
- [ ] Test, typecheck, lint sạch; cập nhật NOTICE.md, README.
- [ ] Đã viết docs/plans/report_chess_phase3.md kèm ảnh chụp và runbook deploy (chạy Setup để thêm lựa chọn "chess").
```

---

## Prompt GĐ4: Nâng cấp `chessfenpgn`

```text
GĐ4: NÂNG CẤP PLUGIN chessfenpgn (xem mục 4 "GĐ4" trong docs/plans/chess_lms_plan.md)

BẤT BIẾN:
- id "chessfenpgn", package "@emdash-cms/plugin-chessfenpgn";
- block "chess-fen" (fen) và "chess-pgn" (pgn);
- widget "chess-board".
Chỉ THÊM field tùy chọn.

Việc cần làm (trong packages/plugins/chessfenpgn):
1. Dùng "@duongsinh/chess-kit": "workspace:*". Thay logic trong src/ChessBoardIsland.tsx bằng PgnViewer/Board. Viết test hồi quy cho lỗi PGN có [FEN].
2. Field Block Kit tùy chọn:
   - chess-fen: orientation (white/black/auto), caption, arrows, highlights, size (S/M/L);
   - chess-pgn: orientation, startPly, showHeaders, caption;
   - category "Cờ vua".
3. ChessFen.astro / ChessPgn.astro: interface Props có kiểu, bỏ div debug, truyền prop mới vào island (client:visible), nạp theme.css.
4. Widget chess-board: options.mode "fen" | "pgn"; field json lưu { fen, pgn, orientation }; vẫn đọc được chuỗi FEN cũ.
5. Trang "Bàn cờ" (/editor): khai trong definePlugin({ admin: { pages } }) để hiện trên sidebar; dùng PositionEditor; kiểm tra PGN; các nút copy FEN, PGN và chuỗi mũi tên; Kumo.
6. Đóng gói:
   - tsconfig, vitest, README tiếng Việt;
   - thêm peer astro, bỏ peer @phosphor-icons/react.
7. Chụp ảnh trước và sau trên trang /lesson/<slug> của demos/cloudflare: FEN có mũi tên, PGN có header/biến, ký hiệu VN, mobile.

Tiêu chí hoàn thành:
- [ ] Nội dung cũ vẫn render đúng (có test).
- [ ] PGN có [FEN] đúng thế xuất phát.
- [ ] Trang "Bàn cờ" có trên sidebar.
- [ ] Test, typecheck, lint sạch.
- [ ] Đã viết docs/plans/report_chess_phase4.md kèm ảnh trong docs/plans/assets/chess-phase4/.
```

---

## Prompt GĐ5: Plugin `chess-puzzles`

```text
GĐ5: PLUGIN chess-puzzles, CÂU ĐỐ (xem mục 4 "GĐ5" trong docs/plans/chess_lms_plan.md)

Mục tiêu: tạo packages/plugins/chess-puzzles (package "@duongsinh/plugin-chess-puzzles", "private": true, id "chess-puzzles", native). Không import code của LMS hay plugin cờ khác.

Mẫu tham khảo:
- packages/plugins/forms (routes, optionsRoute, PluginRouteError, test);
- packages/plugins/field-kit (field widget);
- packages/plugins/embeds (blockComponents);
- route setup/run của emdash-lms (GĐ2a).

Việc cần làm:
1. Descriptor chessPuzzlesPlugin(): adminEntry, componentsEntry, capabilities ["content:read", "content:write"], exports ".", "./admin", "./astro".
2. Route "setup/run" (schema:manage): tạo collection chess_puzzles idempotent, field title, puzzle (json + widget "chess-puzzles:puzzle-editor"), prompt, level (6 cấp từ chess-kit), themes, rating, hint, explanation (portableText), source; supports drafts/revisions/search; urlPattern "/cau-do/{slug}".
3. Widget "puzzle-editor": PositionEditor → MoveRecorder (gồm nước đáp) → "Chạy thử".
4. PT block "chess-puzzle":
   - field puzzle (select, optionsRoute "puzzles/options") + các field nhập nhanh fen, solution, prompt, hint;
   - route "puzzles/options": permission "content:create", trả { items: [{ id, name }] }, có tìm kiếm và lọc cấp.
5. Hook content:beforeSave:
   - duyệt các field portableText; node "chess-puzzle" có puzzle thì snapshot fen/solution/prompt/hint/level/title từ bản ĐÃ XUẤT BẢN;
   - không tìm thấy thì giữ nguyên node và cảnh báo;
   - route "snapshots/refresh" (admin) làm mới theo trang.
6. Front-end:
   - PuzzleBlock.astro → island PuzzlePlayer, chỉ dùng dữ liệu đã snapshot, KHÔNG query DB;
   - render data-lms-requirement="puzzle:<id>"; giải xong thì phát `lms:requirement-done` + `duongsinh-chess:puzzle-solved` và ghi progress;
   - export PuzzlePage.astro, PuzzleOfTheDay.astro.
7. Admin:
   - "Câu đố": tổng quan theo cấp, Setup;
   - "Nhập câu đố": PGN, EPD, CSV Lichess (≤ 500 câu/lô; tạo nháp theo lô ~50; báo dòng lỗi).
8. settingsSchema: defaultOrientation, revealAfterFailures, showRating.

Test:
- parser PGN/EPD/CSV;
- setup idempotent;
- snapshot (integration);
- quyền của puzzles/options (Subscriber bị từ chối, Contributor được phép).

Tiêu chí hoàn thành:
- [ ] Soạn câu đố → chèn vào bài LMS → khách giải được → bài tính hoàn thành.
- [ ] Nhập được 20 câu từ CSV Lichess mẫu (fixture trong tests/).
- [ ] Trang công khai không tăng query.
- [ ] Test, typecheck, lint sạch. Có README.
- [ ] Đã viết docs/plans/report_chess_phase5.md kèm ảnh chụp và runbook (thêm plugin vào astro.config, chạy Setup).
```

---

## Prompt GĐ6: Plugin `chess-lessons`

```text
GĐ6: PLUGIN chess-lessons, BÀI HỌC CỜ + BÀI GIẢNG (xem mục 4 "GĐ6" trong docs/plans/chess_lms_plan.md)

Mục tiêu: tạo packages/plugins/chess-lessons (package "@duongsinh/plugin-chess-lessons", "private": true, id "chess-lessons", native). Không import code của LMS hay chess-puzzles.

Việc cần làm:
1. Route "setup/run" (schema:manage), additive, idempotent:
   - kiểm tra courses/modules/lessons đã có (nếu chưa thì hướng dẫn chạy LMS Setup);
   - thêm field courses gồm level (6 cấp), sessions, age_range; lessons gồm level, themes, objectives;
   - tạo collection chess_lectures: title, level, course (reference courses, tùy chọn), summary, script (json + widget "chess-lessons:lecture-builder"); urlPattern "/bai-giang/{slug}".
2. Các nút trên trang admin "Bài học cờ":
   - "Khung lộ trình 6 cấp": 6 khóa nháp Tốt → Vua, mỗi khóa 1 chương mẫu, bỏ qua khóa đã có;
   - "Bài học mẫu": Khởi động (câu chuyện) → Kiến thức mới → Thực hành → Kiểm tra (lms-quiz) → Bài tập về nhà;
   - "Nạp dữ liệu mẫu": 1 khóa, 3 bài, 1 bài giảng, 1 quiz, thêm 10 câu đố nếu có chess_puzzles. KHÔNG đụng 6 khóa/12 bài đang có.
3. Widget "lecture-builder": danh sách bước, kéo đổi thứ tự; mỗi bước kế thừa thế của bước trước, có mũi tên/ô sáng, narration, teacherNotes, câu hỏi tùy chọn.
4. PT block "chess-lecture": chọn qua optionsRoute (content:create); beforeSave snapshot các bước và LOẠI BỎ teacherNotes; front-end render LecturePlayer.
5. LecturePresenter.astro (trình chiếu):
   - toàn màn hình, PageUp/PageDown/←/→, phím B tắt màn hình, đồng hồ;
   - teacherNotes chỉ render phía server khi Astro.locals.user có vai trò ≥ Contributor; có kiểm chứng rằng HTML gửi cho khách không chứa ghi chú.
6. "Nhập từ Obsidian":
   - đầu vào .md có frontmatter title, course (slug), module (tên), order, level, themes, objectives;
   - body chuyển bằng markdownToPortableText ("emdash/client"); fence ```fen/```pgn/```puzzle/```lecture thành block cờ;
   - tạo bài NHÁP (content, course_id, module_id, sort_order), tạo chương nếu chưa có;
   - cảnh báo ![[wikilink]];
   - README có quy ước Markdown cho vault OBSIDIAN2026, kèm file .md mẫu trong tests/fixtures/.

Test:
- Markdown → PT;
- setup idempotent và không xóa field LMS;
- snapshot không chứa teacherNotes;
- nạp dữ liệu mẫu chạy 2 lần không nhân đôi.

Tiêu chí hoàn thành:
- [ ] Nhập 1 file .md mẫu → bài nháp đúng khóa/chương, có block cờ.
- [ ] Trình chiếu chạy được; khách không thấy ghi chú HLV.
- [ ] Test, typecheck, lint sạch. Có README.
- [ ] Đã viết docs/plans/report_chess_phase6.md kèm ảnh và runbook.

ĐIỂM DỪNG: LMS Setup xóa hoặc ghi đè field do chess-lessons thêm.
```

---

## Prompt GĐ7: Hoàn thiện covuahocduong.com

```text
GĐ7: HOÀN THIỆN covuahocduong.com, demos/cloudflare (xem mục 4 "GĐ7" và mục 7 trong docs/plans/chess_lms_plan.md)

Việc cần làm:
1. demos/cloudflare/astro.config.mjs:
   - đủ plugin: formsPlugin(), chessfenpgnPlugin(), lmsPlugin({...} giữ cấu hình VND/SePay đã chốt ở GĐ2b), chessPuzzlesPlugin(), chessLessonsPlugin(), aiSearch(...);
   - giữ nguyên lmsIntegration và đường dẫn LMS;
   - thêm dependency workspace.
2. Trang mới: /cau-do (lọc cấp/chủ đề + PuzzleOfTheDay), /cau-do/[slug], /bai-giang/[slug], /bai-giang/[slug]/trinh-chieu. Dùng getEmDashCollection/getEmDashEntry, lọc locale, requestCached.
3. Giao diện:
   - CSS variables của LMS theo màu thương hiệu, nạp theme.css của chess-kit, navy #2B3990 + gold, Roboto, họa tiết ô cờ, responsive;
   - Header/Footer thêm "Câu đố";
   - giữ định hướng Cờ Vua Học Đường đã có.
4. Dọn nội dung: liệt kê các khóa/bài mẫu tiếng Anh (Getting Started, Fundamentals Course…) và đề xuất ẩn/xóa. CHỈ làm sau khi Thầy duyệt, và làm qua admin.
5. Chạy hết checklist mục 7 của kế hoạch trên bản sao D1 bằng agent-browser (desktop + mobile; khách, học viên Subscriber, HLV Contributor). Chụp ảnh vào docs/plans/assets/chess-phase7/.
6. `pnpm query-counts` và giải trình mọi thay đổi trên trang công khai.
7. KHÔNG deploy. Viết runbook deploy đầy đủ: backup D1 → deploy preview → Setup của LMS, chess-puzzles, chess-lessons → kiểm tra → deploy production → kiểm tra SePay bằng giao dịch nhỏ.

Tiêu chí hoàn thành:
- [ ] Checklist mục 7 đạt; mục nào không đạt thì ghi rõ.
- [ ] `pnpm build`, `pnpm --filter @emdash-cms/demo-cloudflare typecheck`, test các package, lint đều sạch.
- [ ] Đã viết docs/plans/report_chess_phase7.md kèm ảnh, runbook, và hướng dẫn ngắn cho HLV (soạn câu đố, bài, quiz; nhập từ Obsidian; trình chiếu; xem tiến độ; xác nhận đơn hàng).
```

---

## Prompt kiểm tra chéo (bắt buộc sau GĐ2a, GĐ2b, GĐ3; tùy chọn với các giai đoạn khác)

```text
Đọc .claude/CLAUDE.md, docs/plans/chess_lms_plan.md và docs/plans/report_chess_phaseX.md.

Rà soát diff của giai đoạn X so với main (git diff main...HEAD). Dùng skill adversarial-reviewer, hoặc /code-review ở mức high.

Tập trung vào:
- quyền của từng route; route học viên có nhận userId từ input không (IDOR);
- webhook SePay: xác thực bắt buộc, idempotency, kiểm tra số tiền/tài khoản/hết hạn, amount tính phía server;
- route public có lộ đáp án, lời giải hay teacherNotes không;
- setup/run có thể xóa hoặc đổi dữ liệu cũ không;
- bí mật hoặc dữ liệu D1 có bị commit không;
- query thêm ở trang công khai;
- tương thích ngược (id, field, đường dẫn, API mà dsc-edu-vn dùng);
- test có thật sự bắt được lỗi không.

Báo cáo các lỗi đã xác minh, sắp theo mức độ nghiêm trọng. Chỉ sửa lỗi chắc chắn, nhỏ, trong phạm vi giai đoạn; còn lại liệt kê để Thầy quyết định.
```

---

## GĐ8–GĐ9 (để sau, chưa có prompt)

- **GĐ8:** chứng chỉ PDF, coupon, đánh giá khóa, Stripe.
- **GĐ9:** bảng điều khiển HLV, thống kê câu đố, MCP tool nhập nội dung từ Claude Desktop, cân nhắc chuyển dữ liệu giao dịch sang plugin storage.

Khi xong GĐ7, hãy yêu cầu Claude lập kế hoạch chi tiết cho GĐ8/GĐ9 dựa trên các báo cáo.
