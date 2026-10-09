# Kế hoạch v3: Bộ plugin cờ vua trên emdash-lms cho covuahocduong.com

> Prompt triển khai: [chess_lms_prompts.md](chess_lms_prompts.md).

> **v3, 2026-10-09.** Cập nhật sau commit `d7b6e5d` của Thầy: emdash-lms đã nằm trong repo và đã chạy trên production.
> Phần kỹ thuật LMS trong kế hoạch này **thay thế** `docs/plans/emdash-lms-installation-plan.md`.

## 1. Hiện trạng (đã kiểm tra commit `d7b6e5d` trên `main`)

**Mã nguồn emdash-lms**
- Nằm ở `packages/plugins/emdash-lms`: package `emdash-lms` 0.2.0, plugin id `lms`, MIT, tác giả Tô Triều.
- `exports` trỏ vào `dist` (bị gitignore). `pnpm build` ở gốc repo sẽ build ra.
- So với bản gốc GitHub (`5ce68d1`), chỉ có các thay đổi sau:
  - định dạng tab;
  - Việt hóa chữ trên trang bài học và trang checkout;
  - trang checkout nhận cả khóa học lẻ, dùng VND và SePay;
  - sửa đường dẫn Windows trong `integration.ts`.
- **Các lỗi L1–L10 vẫn còn nguyên** (xem 1.1).

**Site `demos/cloudflare` (covuahocduong.com)**
- Đã bật `lmsPlugin({ mode: "full", currency VND, checkout: { enabled: true, providers: ["sepay","stripe"] } })` cùng `chessfenpgnPlugin()`.
- Có `lmsIntegration({ layout: "./src/layouts/Layout.astro", styles: "plugin" })`.
- Đã deploy lên Cloudflare, D1 `emdash_db`.
- Nội dung đổi sang hướng "Cờ Vua Học Đường": gói hội viên thành "Thẻ thư viện", giá thành "đóng góp học phí".

**Schema trên D1 production được tạo bằng SQL tay** (`scripts/prepare-d1-lms.mjs`, `demos/cloudflare/scripts/*.sql`)
- Có 16 bảng `ec_*`, nhưng chỉ **11** collection được đăng ký.
- Thiếu đăng ký 5 collection: `memberships`, `lesson_progress`, `quiz_submissions`, `certificates`, `certificate_templates`.
- Dữ liệu hiện có: 6 danh mục, 6 khóa, 6 chương, 12 bài, 6 gói. Trong đó lẫn bài mẫu tiếng Anh của LMS ("Getting Started", "Fundamentals Course").
- Một số id không phải ULID (vd. `course_chess_intro`). Phải giữ nguyên các id này.

**`demos/dsc-edu-vn`** cũng import emdash-lms. Theo quyết định của Thầy, **không làm gì trên site này** (chỉ giữ cho API của LMS tương thích ngược để site không bị vỡ).

### 1.1 Danh sách lỗi (đã đối chiếu mã với lõi EmDash 0.36; Giai đoạn 0 sẽ xác nhận khi chạy thật)

| # | Lỗi | Hậu quả trên production |
|---|---|---|
| L1 | Handler viết `(ctx, input)`, nhưng EmDash gọi `handler(routeContext)` với 1 tham số (`packages/core/src/plugins/routes.ts:243`). `input` luôn `undefined` | **Mọi API của LMS đều lỗi** |
| L2 | `src/admin.tsx` dùng `export default { pages }`, còn EmDash dùng `import * as` và đọc export tên `pages` (`virtual-modules.ts:345`) | Admin LMS không hiện trang nào (và vốn chỉ là khung trống) |
| L3 | Route không khai `permission` nên mặc định cần `plugins:manage` | Học viên không gọi được `access`/`checkout` |
| L4 | `access` nhận `userId` từ body | Xem được quyền của người khác (IDOR) |
| L5 | `sepay.ts` bỏ qua xác thực khi thiếu secret, còn HMAC thì bị comment | **Giả được webhook "đã thanh toán"** ngay khi L1 được sửa |
| L6 | Route `webhook/:providerId`: router không hỗ trợ tham số | Webhook 404 |
| L7 | `/lesson/[slug]` không kiểm tra quyền truy cập | Bài trả phí ai cũng xem được |
| L8 | Trang và route tải toàn bộ collection rồi lọc bằng JS | Chậm và tốn query |
| L9 | Field `string` + `options.choices` sai cú pháp; đúng là `select` + `validation.options` | Admin hiện ô nhập tự do |
| L10 | Capability tên cũ, `as any`, không có test | — |
| L11 | 5 bảng `ec_*` chưa được đăng ký collection; `_emdash_fields.updated_at = 'undefined'` | `ctx.content` không đọc/ghi được ghi danh, tiến độ, chứng chỉ |
| L12 | Trang checkout gửi `<form method=POST>` tới route private: không có header `X-EmDash-Request`, không phải JSON, không có đăng nhập | **Nút "Đăng ký" trên production luôn lỗi** |

### 1.2 Ràng buộc của EmDash (đã kiểm chứng)
1. Form PT block chỉ có Block Kit, **không nhúng được bàn cờ kéo thả**. Soạn ở widget hoặc trang admin, block chỉ chọn theo id (`select` + `optionsRoute`).
2. Plugin không gọi được storage hay route của nhau. Nối qua collection nội dung, sự kiện DOM, hoặc thư viện chung.
3. `content:beforeSave` sửa được dữ liệu trước khi lưu, dùng để snapshot câu đố/bài giảng vào block (trang công khai thêm 0 query).
4. Quyền route:
   - mặc định `plugins:manage`;
   - biên tập: `content:create`;
   - học viên: `content:read` + `ctx.user` (không bao giờ lấy userId từ input);
   - công khai: `public: true`, không có `ctx.user`, nhưng POST vẫn bị kiểm tra Origin.
5. Trang công khai đọc người dùng qua `Astro.locals.user`. Học viên là role Subscriber.
6. Module admin phải export **tên** `pages`/`fields`. Muốn có mục sidebar thì khai trong `definePlugin({ admin: { pages } })`.
7. Có sẵn `markdownToPortableText` (`emdash/client`), `SchemaRegistry` (export từ `emdash`), `registerOrphanedTable` / `discoverOrphanedTables` (`packages/core/src/schema/registry.ts:1856,1910`).
8. Plugin trong `packages/plugins/*` không dùng Lingui. Chuỗi tiếng Việt gom vào từ điển của `chess-kit`.

## 2. Quyết định đã chốt với Thầy

| Hạng mục | Quyết định |
|---|---|
| Nền LMS | emdash-lms trong repo (`packages/plugins/emdash-lms`) là bản fork của Dương Sinh. Giữ id `lms`, tên package, tên collection/field và id dữ liệu |
| Site | **Chỉ covuahocduong.com** (`demos/cloudflare`). Không động vào `demos/dsc-edu-vn` |
| Đường dẫn | **Giữ nguyên** `/courses`, `/course/[slug]`, `/lesson/[slug]`, `/plans`, `/checkout/[id]`. Trang mới dùng tiếng Việt: `/cau-do`, `/bai-giang` |
| Cấp độ | **Chỉ 6 cấp Tốt → Mã → Tượng → Xe → Hậu → Vua** (field `level`) |
| Thanh toán | **Sửa SePay ngay ở Giai đoạn 2** (2b). Stripe tắt cho tới khi có khóa API |
| Tiến độ | Hai lớp: khách lưu trình duyệt; học viên đăng nhập lưu vào tài khoản; gộp khi đăng nhập |
| Kiến trúc | 1 thư viện `chess-kit` + 3 plugin cờ, cộng LMS fork |
| Ký hiệu | Lưu chuẩn quốc tế; hiển thị V/H/X/T/M mặc định, có nút chuyển |

## 3. Kiến trúc

```
packages/chess-kit                 @duongsinh/chess-kit, thư viện: core / react / progress / i18n / theme.css
packages/plugins/emdash-lms        LMS fork (id "lms"): quyền truy cập, ghi danh, tiến độ 2 lớp,
                                   SePay, quiz + câu hỏi "chess", giao thức "yêu cầu hoàn thành"
packages/plugins/chessfenpgn       giữ id; nâng cấp FEN/PGN + trang "Bàn cờ"
packages/plugins/chess-puzzles     kho câu đố, widget soạn, block chess-puzzle, trình nhập
packages/plugins/chess-lessons     field cờ cho khóa/bài, bài giảng + trình chiếu, khung 6 cấp, nhập Obsidian
```

**Phụ thuộc:** mọi package dùng `chess-kit`. Các plugin cờ không import lẫn nhau, cũng không import LMS.

**Giao thức "yêu cầu hoàn thành"**
- Block cần hoàn thành mới qua bài thì render `data-lms-requirement="<id>"` và phát `window` event `lms:requirement-done`.
- Trang bài học của LMS đếm số yêu cầu. Khi đủ thì đánh dấu hoàn thành: gọi route nếu học viên đã đăng nhập, lưu localStorage nếu là khách.

**Nguyên tắc**
- Chỉ thêm (additive): giữ nguyên id, collection, field, đường dẫn.
- Thêm `"private": true` cho emdash-lms để tránh vô tình publish trùng tên gói của tác giả.
- Thêm `NOTICE.md` ghi nguồn và danh sách thay đổi.
- Package mới cũng `"private": true`.

**An toàn production**
- Giữa 2a và 2b **không deploy**, vì sửa L1 mà chưa sửa L5 thì webhook bị giả được.
- Trước khi chạy Setup/converge trên production: Thầy chạy `wrangler d1 export emdash_db --remote` để có bản sao lưu, rồi thử trên bản sao ở local trước.
- Bản export chứa dữ liệu người dùng nên **không commit vào git**.
- Mọi lần deploy do Thầy quyết định.

## 4. Các giai đoạn

Mỗi giai đoạn là 1 phiên, kết thúc bằng commit + push và `docs/plans/report_chess_phaseN.md`. Giai đoạn 2 chia làm 2 phiên (2a, 2b).

### GĐ0: Kiểm kê và nền móng
- Chạy `pnpm install`, `pnpm build`, `pnpm lint:json`.
  - Đường dẫn `file:///C:/...` trong `packages/registry-verification/tsdown.config.ts`: sửa nếu làm hỏng build trên Linux.
  - Ghi lại build của emdash-lms (dist) có ổn không.
- Trong `packages/plugins/emdash-lms`:
  - thêm `"private": true`, `NOTICE.md`, `vitest.config.ts`;
  - chuyển `exports` sang `src` như `packages/plugins/forms`. Nếu việc này làm vỡ build demo thì giữ dist và ghi lại.
- Viết **test ghi nhận lỗi** (`it.fails` hoặc tương đương) cho L1, L2, L12.
- Kiểm toán schema: chạy demo ở local trên một bản sao D1. Ưu tiên bản export production do Thầy cung cấp; nếu không có thì dựng lại bằng chính các script SQL của Thầy. Ghi bảng đối chiếu bảng/collection/field (L11).
- Ghi hiện trạng thực tế L1–L12 (thấy / không thấy), chụp ảnh bằng agent-browser.

### GĐ1: `@duongsinh/chess-kit` (`packages/chess-kit`)
- **core** (chạy được trên Workers):
  - FEN/PGN (có `[FEN]`, comment, NAG, biến), `replayPositions`;
  - `sanToVi`/`viToSan`, `uciToSan`/`sanToUci`, `parseArrows`, `parseSquares`;
  - `checkPuzzleMove` (chấp nhận mọi nước chiếu hết), `gradeChessAnswer`;
  - `LEVELS` (6 cấp `tot,ma,tuong,xe,hau,vua`), `THEMES`.
- **react:** `Board`, `PgnViewer`, `PositionEditor`, `MoveRecorder`, `PuzzlePlayer`, `LecturePlayer`.
- **progress:** localStorage `duongsinh-chess:progress:v1` gồm `{puzzles, lectures, lessons}`; zod, có giới hạn, try/catch, export/import, `drainForSync()`.
- **i18n** (vi mặc định) và **theme.css** (navy `#2B3990` + gold, Roboto).
- **Test viết trước:** PGN `[FEN]`, ký hiệu, mate thay thế, chấm câu cờ, progress.

### GĐ2a: Ổn định LMS (`packages/plugins/emdash-lms`)
- **Sửa theo TDD:**
  - L1: 1 `RouteContext`, input zod, `PluginRouteError`.
  - L2: export tên; trang admin bằng Kumo.
  - L10.
- **L9 + L11: route `setup/run`** (`schema:manage`), idempotent:
  - Bảng có sẵn nhưng chưa đăng ký thì dùng `registerOrphanedTable`. Collection chưa có thì tạo bằng `SchemaRegistry`.
  - Thêm field còn thiếu. Đổi `string`+`choices` sang `select` (cùng cột TEXT).
  - **Không xóa, không đổi tên, không đổi id.**
  - Test trên bản sao D1 của GĐ0. Từ đây không dùng script SQL tay nữa.
- **L3, L4, L8: route học viên** (`permission: "content:read"`, chỉ dùng `ctx.user.id`):
  - `me/access`, `me/enroll` (khóa free), `progress/complete`, `progress/sync`, `me/progress`.
  - Dùng `where.fieldFilters` + phân trang.
  - Có test IDOR.
- **L7, L8: trang** (giữ đường dẫn cũ):
  - Trang khóa: 1 khóa theo slug + chương/bài của khóa đó, `requestCached`, tối đa 3 query.
  - Trang bài học: kiểm tra quyền phía server (free/`is_preview` thì cho xem; ngược lại cần đăng nhập + ghi danh hoặc thẻ thư viện còn hạn). Khách ẩn danh không phát sinh query kiểm tra quyền.
  - Thanh tiến độ, nút "Hoàn thành bài", giao thức "yêu cầu hoàn thành", gộp tiến độ khi đăng nhập.
- **Webhook và checkout chưa đăng ký route** cho tới 2b. Trang checkout tạm hiện "Đang bảo trì thanh toán". **Không deploy.**
- **Admin:** "Cài đặt LMS" (Setup, trạng thái schema), "Học viên" (ghi danh/tiến độ, ghi danh tay bằng email, cần `users:read`).
- **Xác minh cách học viên tự tạo tài khoản** (signup theo tên miền cho phép / magic link / lời mời) và ghi vào báo cáo. 2b cần kết quả này.

### GĐ2b: Thanh toán SePay (L5, L6, L12)
- **Luồng:** học viên đăng nhập → `/checkout/[id]` → route `checkout/create` (`content:read`, `ctx.user`, gọi bằng JSON + `X-EmDash-Request` qua `apiFetch`; bỏ form POST).
  - Tạo `orders` pending, mã đối soát `LMS-XXXXXXXX`, số tiền VND.
  - Hiện **VietQR** (ngân hàng/số TK/số tiền/nội dung) và trang chờ, tự kiểm tra lại qua `me/orders/get`.
- **Webhook `webhook/sepay`** (public, tên cố định, sửa L6):
  - Xác thực **bắt buộc** theo đúng tài liệu SePay hiện hành (API key hoặc chữ ký; phiên làm việc phải đọc docs SePay để xác nhận). Thiếu secret thì **từ chối**, không bỏ qua.
  - So khớp mã đơn, số tiền ≥ giá trị đơn, đúng tài khoản nhận.
  - **Idempotent** theo mã giao dịch SePay.
  - Sau đó kích hoạt `memberships` (thẻ thư viện, `expires_at` theo `billing_period`) hoặc `enrollments` (khóa lẻ).
- **Bí mật** (API key, số TK) đặt trong `settingsSchema` (`secret`) hoặc `process.env`, không bao giờ hard-code hay commit.
- **Admin "Đơn hàng":** danh sách, lọc trạng thái, xác nhận tay khi chuyển khoản sai nội dung (ghi người xác nhận).
- **Stripe:** không đăng ký khi chưa có khóa. Đề xuất Thầy bỏ `"stripe"` khỏi `providers`.
- **Test:**
  - webhook giả (sai hoặc thiếu khóa) bị từ chối;
  - trùng giao dịch chỉ kích hoạt 1 lần;
  - thiếu tiền không kích hoạt;
  - đơn của người khác không xem được.
- **Thử thật:** tài khoản/sandbox SePay của Thầy, chuyển khoản số nhỏ trên bản preview.
- **Báo cáo:** runbook deploy (backup D1 → Setup → cấu hình webhook URL trên SePay → deploy → thử). Thầy tự deploy.

### GĐ3: Quiz có câu hỏi cờ (trong LMS)
- **Schema:** `questions.type` thêm `chess`; `answers` có dạng `{fen, solution: UCI[], orientation, prompt}`. Áp qua `setup/run`.
- **Trang admin "Soạn quiz":** soạn quiz kèm câu hỏi trên 1 màn hình. Giao diện đổi theo loại câu; câu cờ dùng `PositionEditor` + `MoveRecorder`, và có nút lấy từ kho câu đố nếu `chess-puzzles` đang bật.
- **Route:**
  - `quiz/present` (public, bỏ đáp án);
  - `quiz/submit`: chấm phía server, câu cờ chấm bằng `gradeChessAnswer`. Có 2 dạng: bản public cho khách (không lưu) và bản `content:read` (lưu `quiz_submissions`). Hỗ trợ passmark, timer, allow_reset, random_order.
- **PT block `lms-quiz`:** island `QuizRunner`; đạt passmark thì phát `lms:requirement-done`.
- **Test:** chấm từng loại câu, present không lộ đáp án, quyền, IDOR.

### GĐ4: Nâng cấp `chessfenpgn`
- **Bất biến:** id, block `chess-fen`/`chess-pgn`, field `fen`/`pgn`, widget `chess-board`.
- Dùng `chess-kit`; viết test hồi quy cho lỗi `[FEN]`.
- **Field tùy chọn mới:**
  - `chess-fen`: orientation, caption, arrows, highlights, size;
  - `chess-pgn`: orientation, startPly, showHeaders, caption;
  - đặt `category: "Cờ vua"`.
- **Widget:** thêm `mode: fen|pgn`, vẫn đọc được FEN cũ.
- **Trang "Bàn cờ"** có trên sidebar.
- **Đóng gói:** tsconfig, vitest, README.

### GĐ5: Plugin `chess-puzzles`
- **Collection `chess_puzzles`** (`/cau-do/{slug}`): `title`, `puzzle` (json + widget `puzzle-editor`), `prompt`, `level` (6 cấp), `themes`, `rating`, `hint`, `explanation`, `source`.
- **PT block `chess-puzzle`:** chọn qua `puzzles/options` (`content:create`) hoặc nhập nhanh. Snapshot bằng `beforeSave`; có route `snapshots/refresh`.
- **Front-end:** `PuzzleBlock` đọc dữ liệu đã snapshot (0 query), render `data-lms-requirement`; export `PuzzlePage`, `PuzzleOfTheDay`.
- **Trình nhập:** PGN/EPD/CSV Lichess (≤ 500 câu/lô, tạo nháp theo lô ~50).
- **Settings + test.**

### GĐ6: Plugin `chess-lessons`
- **Setup** (additive trên collection LMS):
  - `courses`: `level` (6 cấp), `sessions`, `age_range`;
  - `lessons`: `level`, `themes`, `objectives`;
  - collection `chess_lectures` (`/bai-giang/{slug}`).
- **Widget `lecture-builder`:** các bước gồm thế cờ, mũi tên, lời giảng, `teacherNotes`, câu hỏi.
- **PT block `chess-lecture`:** snapshot, bỏ `teacherNotes`; render `LecturePlayer`.
- **`LecturePresenter.astro`** cho `/bai-giang/[slug]/trinh-chieu`: `teacherNotes` chỉ render phía server cho vai trò ≥ Contributor.
- **Các nút admin:** "Khung lộ trình 6 cấp", "Bài học mẫu", "Nạp dữ liệu mẫu" (không đụng 6 khóa đang có).
- **Nhập từ Obsidian:** frontmatter + `markdownToPortableText` + code fence `fen`/`pgn`/`puzzle`/`lecture`, tạo bài nháp vào `content`/`course_id`/`module_id`/`sort_order`.
- **Test.**

### GĐ7: Hoàn thiện covuahocduong.com
- Đăng ký đủ plugin trong `demos/cloudflare/astro.config.mjs`.
- **Trang mới:** `/cau-do`, `/cau-do/[slug]`, `/bai-giang/[slug]`, `/bai-giang/[slug]/trinh-chieu`. Giữ nguyên đường dẫn LMS cũ.
- **Giao diện:** CSS của LMS + `theme.css`, đúng nhận diện Dương Sinh; menu thêm "Câu đố".
- **Dọn nội dung:** đề xuất danh sách bài mẫu tiếng Anh cần xóa/ẩn. Thầy duyệt rồi mới làm, trong admin.
- **Kiểm chứng:** chạy hết mục 7, `pnpm query-counts`, agent-browser (khách / học viên / HLV, desktop và mobile). Viết runbook deploy cho Thầy.

### GĐ8–9 (để sau)
- **GĐ8:** chứng chỉ PDF, coupon, đánh giá khóa, Stripe.
- **GĐ9:** bảng điều khiển HLV, thống kê câu đố, MCP tool nhập nội dung từ Claude Desktop, cân nhắc chuyển dữ liệu giao dịch sang plugin storage.

## 5. Quy tắc bắt buộc
- Lint:
  - trước khi sửa: `pnpm lint:json | jq '.diagnostics | length'` phải sạch;
  - sau mỗi lần sửa: `pnpm lint:quick`;
  - sau mỗi đợt: typecheck.
- `pnpm format`; sửa lỗi theo TDD.
- Không sửa `packages/core`/`packages/admin` (nếu cần thì hỏi Thầy). Không sửa `demos/dsc-edu-vn`.
- Không thêm query cho trang công khai của khách.
- Không SQL tay lên D1. Schema chỉ đi qua `setup/run`.
- Không commit bí mật hoặc bản export D1.
- Không deploy. Thầy deploy theo runbook.
- Admin dùng Kumo + class Tailwind logic. Comment chỉ nói "vì sao". Không commit `messages.po`.
- Không dùng chessground (GPL).
- Không mở issue/PR ở `tohaitrieu/emdash-lms` nếu Thầy chưa đồng ý.

## 6. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Sửa L1 làm webhook giả được | 2a không đăng ký webhook/checkout; không deploy giữa 2a và 2b; 2b xác thực bắt buộc |
| Setup làm hỏng dữ liệu production | Backup bằng `wrangler d1 export`; thử trên bản sao; converge chỉ thêm; giữ id |
| Học viên không tự tạo được tài khoản | 2a xác minh; nếu bị chặn thì hỏi Thầy (lời mời của HLV / mở tên miền / đơn khách vãng lai) |
| Sửa LMS làm vỡ dsc-edu-vn | Giữ API tương thích ngược; ghi lại nếu vỡ, không tự sửa site đó |
| Block PT không kéo thả được | Soạn ở widget, snapshot khi lưu |
| Fork lệch upstream | `NOTICE.md` ghi rõ thay đổi |

## 7. Kiểm chứng tổng thể (cuối GĐ7)
1. `pnpm build`, typecheck, lint đều sạch; test của mọi package pass.
2. Chạy `pnpm --filter @emdash-cms/demo-cloudflare dev` trên bản sao D1. LMS Setup chạy 2 lần không đổi dữ liệu cũ, 6 khóa và 12 bài cũ vẫn hiện đúng.
3. Soạn một bài có `chess-fen`, `chess-pgn` (có `[FEN]`), `chess-puzzle`, `chess-lecture`, `lms-quiz` (có câu cờ).
4. Khách: xem bài free, giải hết câu đố/quiz thì bài hoàn thành (trình duyệt). Bài cần thẻ chỉ hiện giới thiệu.
5. Học viên:
   - đăng nhập, tiến độ được gộp lên tài khoản;
   - mua thẻ thư viện bằng SePay (sandbox), webhook kích hoạt thì mở được bài;
   - gửi lại webhook không kích hoạt lần 2; webhook giả bị từ chối.
6. Trình chiếu: khách không thấy ghi chú HLV.
7. `pnpm query-counts`: trang công khai không tăng query, hoặc có giải trình.

