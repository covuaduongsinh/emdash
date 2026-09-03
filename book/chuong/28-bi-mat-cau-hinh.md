# 28. Bí mật cấu hình & biến môi trường

Áp dụng cho vai trò: Quản trị viên/Vận hành

## Tổng quan

EmDash dùng một tập nhỏ các secret trải khắp preview, bình luận, xác thực, storage, và plugin. Chương này là danh mục **đầy đủ**: mỗi secret đến từ đâu, lưu ở đâu, cách xoay vòng (rotate), và điều gì hỏng nếu bị mất.

## Bảng tổng quan

| Secret | Nguồn | Lưu ở đâu | Ảnh hưởng nếu mất khoá |
| --- | --- | --- | --- |
| `EMDASH_ENCRYPTION_KEY` | Vận hành viên (`emdash secrets generate`) | Chỉ biến môi trường/Worker secret | Secret plugin đã mã hoá không thể khôi phục (khi tính năng mã hoá at-rest ra mắt) |
| Preview secret | Tự sinh (có thể override qua env) | Bảng `options` (`emdash:preview_secret`) | Liên kết preview đang tồn tại ngừng hoạt động; liên kết mới vẫn bình thường |
| IP salt | Tự sinh (có thể override qua env) | Bảng `options` (`emdash:ip_salt`) | Tính liên tục của rate-limit bình luận trước đó bị reset |
| Session & API token | Sinh theo từng session/token | Kho session / database (chỉ lưu hash) | Không ảnh hưởng — plaintext không bao giờ được lưu |
| Credential provider OAuth | Bạn tự cấp (console Google/GitHub) | Biến môi trường | Đăng nhập qua provider đó ngừng hoạt động tới khi thay thế |
| Turnstile secret | Bạn tự cấp (Cloudflare dashboard) | Biến môi trường | Xác minh CAPTCHA bình luận thất bại |
| Credential S3 | Bạn tự cấp (nhà cung cấp storage) | Biến môi trường hoặc cấu hình | Upload/download media thất bại tới khi thay thế |
| Secret Plugin | Bạn tự cấp (admin settings UI) | Database (cài đặt plugin/storage) | Nhập lại trong admin |
| CLI credentials | Luồng thiết bị `emdash login`/`emdash plugin publish` | `~/.config/emdash/auth.json` (quyền 0600) | Chạy lại luồng xác thực thiết bị |
| Registry CLI credentials | atproto OAuth của `emdash-plugin` | `~/.emdash/oauth/`, `~/.emdash/credentials.json` (quyền 0600) | Đăng nhập lại; danh tính sống ở PDS của bạn |

## Khoá mã hoá (Encryption Key)

`EMDASH_ENCRYPTION_KEY` là khoá của site để mã hoá secret plugin khi lưu trữ (at rest). Khoá này **do vận hành viên cấp và không bao giờ lưu trong database** — database chỉ giữ ciphertext, nên một bản sao lưu database bị lộ không làm lộ khoá.

Sinh khoá và đặt làm biến môi trường (hoặc Worker secret):

```bash
npx emdash secrets generate
# emdash_enc_v1_<43 base64url chars>

# Cloudflare:
wrangler secret put EMDASH_ENCRYPTION_KEY
```

Định dạng là `emdash_enc_v1_` theo sau bởi 32 byte ngẫu nhiên dạng base64url không đệm. Khoá được xác thực lúc runtime khởi động — giá trị sai định dạng ghi log lỗi cho vận hành viên mà không làm sập request path.

> Sao lưu khoá ở nơi bền vững (trình quản lý mật khẩu, KMS, kho secret của team). Mất khoá đồng nghĩa mất mọi secret đã mã hoá bằng nó — ciphertext trong database không thể khôi phục.

### Xoay vòng khoá (Rotation)

Biến này chấp nhận danh sách khoá phân tách bằng dấu phẩy. Mục **đầu tiên** là khoá chính, dùng cho lượt ghi mới; mọi mục đều được thử khi giải mã. Mỗi giá trị đã mã hoá được gắn dấu vân tay khoá 8 ký tự (`kid`, xem bằng `emdash secrets fingerprint <key>`), nên runtime tự chọn đúng khoá.

Để xoay vòng: sinh khoá mới, thêm vào đầu danh sách (`EMDASH_ENCRYPTION_KEY="new,old"`), deploy lại, rồi bỏ khoá cũ sau khi giá trị hiện có đã được mã hoá lại.

> Tầng mã hoá dùng khoá này **chưa hoạt động** — hiện tại khoá chỉ được xác thực nhưng chưa dùng, và secret plugin (mục bên dưới) vẫn lưu **không mã hoá**. Đặt khoá này ngay bây giờ để triển khai sẵn sàng ngay khi tính năng mã hoá secret plugin ra mắt, không cần lục lại cấu hình sau này.

## Secret tự sinh của site

Hai secret được tự sinh khi dùng lần đầu và lưu bền vững trong bảng `options` — ổn định qua các request, lần triển khai, và isolate. Việc sinh là nguyên tử (atomic) — nhiều cold start đồng thời hội tụ về cùng một giá trị.

### Preview secret

Ký (HMAC) URL preview. Lưu dưới `emdash:preview_secret`; 32 byte ngẫu nhiên, base64url.

- **Override:** đặt `EMDASH_PREVIEW_SECRET` (alias cũ: `PREVIEW_SECRET`) nếu cần cùng secret trên nhiều tiến trình hoặc muốn cố định vì lý do kiểm toán. Biến môi trường luôn thắng giá trị đã lưu.
- **Xoay vòng:** xoá dòng `emdash:preview_secret` (hoặc đổi biến env), rồi deploy lại. Ảnh hưởng: liên kết preview đã phát hành trước đó ngừng xác minh được — không gì khác bị hỏng, một secret mới được tự sinh (hoặc đọc từ env) ở request preview tiếp theo.
- **Nếu mất:** không có gì không thể khôi phục — liên kết preview vốn được thiết kế ngắn hạn (xem lại [Chương 13](./13-xem-truoc-preview.md)).

### IP salt

Làm muối (salt) cho hash SHA-256 của địa chỉ IP người bình luận (`ip_hash` trên comment), dùng để giới hạn tốc độ bình luận. Lưu dưới `emdash:ip_salt`. Riêng theo từng site, nên hash không thể tương quan chéo giữa các cài đặt EmDash khác nhau.

- **Override:** đặt `EMDASH_IP_SALT`. Để tương thích ngược, `EMDASH_AUTH_SECRET`/`AUTH_SECRET` cũng được xem xét — cài đặt trước đây suy ra salt từ các khoá này vẫn giữ hash ổn định.
- **Xoay vòng:** đổi biến env hoặc xoá dòng `emdash:ip_salt`. Ảnh hưởng: bình luận mới hash ra giá trị khác, nên đếm rate-limit bắt đầu lại cho mọi người — bình luận có sẵn và hash đã lưu không bị ảnh hưởng.
- **Nếu mất:** không mất dữ liệu — chỉ mất tính liên tục của rate-limit.

## Session và API token

- **Session** dùng kho session của Astro (Workers KV trên Cloudflare, filesystem trên Node). Cookie mang session ID mờ (opaque) — không có secret ký nào cần quản lý. Đăng xuất để kết thúc một session, hoặc xoá kho session (vd namespace KV) để buộc mọi người đăng nhập lại.
- **API token** (tiền tố `ec_pat_`, `ec_oat_`, `ec_ort_`) là giá trị ngẫu nhiên 256-bit mờ; **chỉ hash SHA-256** của nó được lưu. Plaintext chỉ hiện một lần lúc tạo. Xoay vòng bằng cách thu hồi và tạo lại trong admin.
- **Token mời, magic-link, và khôi phục** dùng một lần duy nhất, lưu dạng hash SHA-256 trong `auth_tokens`, có thời hạn (mời 7 ngày, magic link 15 phút).

Không có gì cần chủ động sao lưu hay xoay vòng — rò rỉ database chỉ lộ hash, và mọi token đều có thể thu hồi/cấp lại từ admin.

## Credential dịch vụ do bạn cung cấp

Credential cho dịch vụ ngoài được đọc từ biến môi trường, không bao giờ ghi vào database. Xoay vòng ở phía nhà cung cấp, cập nhật biến, deploy lại.

| Dịch vụ | Biến |
| --- | --- |
| Đăng nhập Google | `EMDASH_OAUTH_GOOGLE_CLIENT_ID`, `EMDASH_OAUTH_GOOGLE_CLIENT_SECRET` (hoặc alias không tiền tố) |
| Đăng nhập GitHub | `EMDASH_OAUTH_GITHUB_CLIENT_ID`, `EMDASH_OAUTH_GITHUB_CLIENT_SECRET` (hoặc alias không tiền tố) |
| Publish lên Marketplace (CI) | `EMDASH_MARKETPLACE_TOKEN` |
| Turnstile (bình luận) | `EMDASH_TURNSTILE_SECRET_KEY` (hoặc `TURNSTILE_SECRET_KEY`) |
| Lưu trữ tương thích S3 | `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION` |

Trên Cloudflare, đặt các biến này bằng `wrangler secret put`; cục bộ, đặt trong `.env`. R2 qua binding **không cần credential nào** — quyền truy cập được cấp qua binding trong `wrangler.jsonc`, đây là thiết lập khuyến nghị trên Workers (xem lại [Chương 26](./26-trien-khai-nodejs.md)).

## Secret của Plugin

Cài đặt mà plugin khai báo kiểu `type: "secret"` (API key cho email provider, CAPTCHA form...) được nhập trong admin UI và lưu trong database — trong bảng `options` dưới `plugin:<id>:settings:<key>`, hoặc trong kho key-value của plugin. Việc secret đã lưu có được hiện lại cho admin UI hay không tuỳ thuộc vào plugin — plugin viết đúng chuẩn chỉ trả về cờ "đã đặt giá trị" thay vì chính secret đó.

> Secret plugin hiện tại được lưu **không mã hoá** trong database. Bất kỳ ai có quyền truy cập database (kể cả bản sao lưu) đều đọc được. Ưu tiên dùng API key có phạm vi hạn chế, có thể thu hồi, và coi bản sao lưu database là dữ liệu nhạy cảm. Mã hoá at-rest dùng `EMDASH_ENCRYPTION_KEY` đang được lên kế hoạch — đặt khoá này ngay bây giờ để không cần migrate sau này.

- **Xoay vòng:** xoay vòng khoá ở phía nhà cung cấp, dán giá trị mới vào trang cài đặt của plugin — có hiệu lực ngay.
- **Nếu mất:** nhập lại giá trị trong admin — không có gì khác phụ thuộc vào nó.

## Credential CLI

CLI `emdash` giữ hai loại credential, cả hai trong `~/.config/emdash/auth.json` (tôn trọng `XDG_CONFIG_HOME`), tạo với quyền chỉ-chủ-sở-hữu (`0600`):

- **Site token** — `emdash login` xác thực với instance EmDash của bạn qua luồng thiết bị OAuth, lưu token theo URL instance. `emdash logout` xoá nó; mỗi lần gọi, `--token` hoặc `EMDASH_TOKEN` override token đã lưu.
- **Marketplace token** — `emdash plugin publish` xác thực với EmDash Marketplace qua luồng thiết bị GitHub, lưu JWT theo `marketplace:<origin>`. Với publish từ CI, đặt `EMDASH_MARKETPLACE_TOKEN` thay thế — ưu tiên hơn credential đã lưu.

Mất file này vô hại — chạy lại `emdash login` (hoặc `emdash plugin publish`, tự chạy lại luồng thiết bị).

## Credential CLI của Plugin Registry

CLI riêng `emdash-plugin` (gói `@emdash-cms/plugin-cli`) nhắm tới registry AT Protocol thử nghiệm. Việc publish ở đó gắn với danh tính AT Protocol của bạn (publisher DID) — bản thân site không giữ credential publish nào, và việc cài đặt xác minh artifact theo checksum từ bản ghi release gắn với DID đó.

- Xác thực qua atproto OAuth. Blob session/state OAuth nằm ở `~/.emdash/oauth/`, danh tính publisher (DID, handle, PDS) cache trong `~/.emdash/credentials.json` — cả hai đều ghi với quyền chỉ-chủ-sở-hữu.
- Trong CI, cấp danh tính qua `EMDASH_PUBLISHER_DID`, `EMDASH_PUBLISHER_HANDLE`, `EMDASH_PUBLISHER_PDS`; `EMDASH_REGISTRY_URL` override host registry. `publish` tự động từ CI vẫn cần file session OAuth trong `~/.emdash/oauth/` trên runner — chỉ riêng biến env không mang theo session OAuth.
- Xoay vòng hoặc thu hồi quyền publish thực hiện tại tài khoản AT Protocol của bạn (vd app password), không phải trong EmDash.

## Bảng tra nhanh xoay vòng

| Tôi muốn... | Làm điều này |
| --- | --- |
| Xoay vòng khoá mã hoá | Thêm khoá mới vào đầu: `EMDASH_ENCRYPTION_KEY="new,old"`, deploy lại, bỏ khoá cũ sau |
| Vô hiệu hoá mọi liên kết preview | Xoá dòng `emdash:preview_secret` trong `options` (hoặc đổi override env) |
| Reset hash rate-limit bình luận | Đổi `EMDASH_IP_SALT` (hoặc xoá dòng `emdash:ip_salt`) |
| Thu hồi API token bị lộ | Admin → Users → API tokens → revoke, rồi tạo token thay thế |
| Kết thúc mọi session | Xoá kho session (namespace KV Workers / thư mục session) |
| Thay credential provider | Xoay vòng ở phía provider, cập nhật biến env, deploy lại |
| Thay API key của plugin | Xoay vòng ở phía provider, nhập lại trong trang cài đặt plugin |

## Xem thêm

- [Chương 2 — Cài đặt lần đầu và Trình cài đặt (Setup Wizard)](./02-cai-dat-lan-dau.md)
- [Chương 13 — Xem trước (Preview) trước khi xuất bản](./13-xem-truoc-preview.md)
- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 26 — Triển khai trên Node.js](./26-trien-khai-nodejs.md)
- Chương 20 — Cài đặt & Quản lý Plugin (người dùng cuối) (đã có ở phần trước của sổ tay)
