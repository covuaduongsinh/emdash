# 7. Đăng nhập không mật khẩu bằng Passkey

Áp dụng cho vai trò: Mọi vai trò (đặc biệt Quản trị viên/Vận hành khi cấu hình provider đăng nhập)

## Tổng quan

EmDash dùng xác thực bằng **Passkey** làm phương thức đăng nhập chính. Passkey chống phishing, không cần mật khẩu, và hoạt động xuyên thiết bị thông qua trình duyệt hoặc trình quản lý mật khẩu.

Ngoài Passkey, bạn có thể thêm các **provider đăng nhập gắn thêm được (pluggable)** — GitHub, Google, và **Atmosphere** (AT Protocol) có sẵn ngay trong hộp (out of the box), và cùng một giao diện provider này còn mở cho gói của bên thứ ba. Bất kỳ provider nào đã cấu hình cũng có thể dùng để tạo tài khoản admin đầu tiên, đăng nhập, hoặc liên kết với người dùng đã có.

Với site triển khai trên Cloudflare, **Cloudflare Access** cũng là một lựa chọn — nhưng khi bật, nó trở thành phương thức xác thực **duy nhất**, thay thế hoàn toàn Passkey/OAuth/magic link (xem phần cuối chương).

## Passkey hoạt động như thế nào

Passkey dùng WebAuthn — một chuẩn web tạo cặp khoá công khai (public-key credential) lưu trên thiết bị của bạn hoặc đồng bộ qua trình quản lý mật khẩu. Khi đăng nhập, thiết bị của bạn chứng minh đang sở hữu credential mà không bao giờ gửi mật khẩu qua mạng.

Lợi ích của xác thực Passkey:

- **Không có mật khẩu để nhớ hay bị lộ.**
- **Chống phishing** — credential gắn với đúng domain của site.
- **Đồng bộ xuyên thiết bị** — hoạt động với iCloud Keychain, Google Password Manager, 1Password...
- **Đăng nhập nhanh** — một chạm bằng sinh trắc học hoặc mã PIN.

## Các bước thực hiện

### Thiết lập người dùng đầu tiên

Lần đầu truy cập admin panel, Setup Wizard sẽ dẫn bạn tạo tài khoản admin (xem chi tiết luồng này ở [Chương 2](./02-cai-dat-lan-dau.md)). Email của bạn được lưu nhưng **không được xác minh** trong lần thiết lập ban đầu — bạn có thể cấu hình email sau để bật các tính năng như mời người dùng (invite) và đăng nhập bằng magic link.

### Đăng nhập những lần sau

1. Truy cập `/_emdash/admin`.
2. Nếu chưa đăng nhập, bạn sẽ thấy trang đăng nhập.
3. Nhấn **Sign in** để xác thực.
4. Trình duyệt yêu cầu Passkey (sinh trắc học, PIN, hoặc khoá bảo mật).
5. Sau khi xác minh, bạn được chuyển tới admin dashboard.

### Magic Link — phương án dự phòng

Nếu không dùng được Passkey (vd mất thiết bị), magic link là phương án thay thế — yêu cầu email đã được cấu hình.

1. Trên trang đăng nhập, nhấn **Sign in with email**.
2. Nhập địa chỉ email.
3. Kiểm tra hộp thư để lấy liên kết đăng nhập.
4. Nhấn vào liên kết để xác thực (có hiệu lực 15 phút).

> Magic link chỉ dùng được một lần và hết hạn sau 15 phút. Yêu cầu liên kết mới nếu liên kết cũ đã hết hạn.

### Các provider đăng nhập (OAuth)

Provider đăng nhập xuất hiện trên trang đăng nhập và trong Setup Wizard. Chúng có tính chất cộng dồn (additive) — Passkey vẫn hoạt động khi bật provider khác, và người dùng có thể liên kết một provider với tài khoản chỉ-dùng-Passkey đã có.

Cấu hình provider qua mảng `authProviders` trên EmDash integration:

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { github } from "emdash/auth/providers/github";
import { google } from "emdash/auth/providers/google";
import { atproto } from "@emdash-cms/auth-atproto";

export default defineConfig({
	integrations: [
		emdash({
			authProviders: [github(), google(), atproto()],
		}),
	],
});
```

Thứ tự trong mảng quyết định thứ tự hiển thị trên trang đăng nhập: provider dạng nút gọn hiện trước, provider cần form riêng (như Atmosphere, hỏi handle) hiện sau.

**GitHub:**

```js
import { github } from "emdash/auth/providers/github";
emdash({ authProviders: [github()] });
```

Đặt credential qua biến môi trường `EMDASH_OAUTH_GITHUB_CLIENT_ID`/`GITHUB_CLIENT_ID` và `EMDASH_OAUTH_GITHUB_CLIENT_SECRET`/`GITHUB_CLIENT_SECRET`. Callback URL của GitHub OAuth app: `https://your-site.example.com/_emdash/api/auth/oauth/github/callback`.

**Google:**

```js
import { google } from "emdash/auth/providers/google";
emdash({ authProviders: [google()] });
```

Đặt credential qua `EMDASH_OAUTH_GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_ID` và `EMDASH_OAUTH_GOOGLE_CLIENT_SECRET`/`GOOGLE_CLIENT_SECRET`. Redirect URI: `https://your-site.example.com/_emdash/api/auth/oauth/google/callback`.

### Atmosphere (AT Protocol) — chi tiết

**Atmosphere account** là danh tính di động, do người dùng sở hữu, dùng chung trên Bluesky và các ứng dụng khác trong mạng AT Protocol. Người dùng đăng nhập bằng handle (vd `alice.bsky.social`) và xác thực tại chính nhà cung cấp của họ — EmDash không bao giờ thấy mật khẩu.

Phù hợp khi: cộng tác viên đã có sẵn tài khoản Atmosphere; bạn muốn giới hạn theo domain tổ chức (`*.yourcompany.com`) mà không cần quản lý OAuth app hay lời mời; hoặc bạn muốn danh tính nhất quán với phần còn lại trong hệ sinh thái Atmosphere.

Cài đặt:

```bash
pnpm add @emdash-cms/auth-atproto
```

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { atproto } from "@emdash-cms/auth-atproto";

export default defineConfig({
	integrations: [
		emdash({
			authProviders: [atproto()],
			server: {
				host: "127.0.0.1", // bắt buộc khi phát triển cục bộ
			},
		}),
	],
});
```

Không cần client secret hay biến môi trường — provider tự phục vụ metadata tại `/.well-known/atproto-client-metadata.json`.

Cấu hình allowlist và role mặc định:

```js
atproto({
	allowedDIDs: ["did:plc:abc123..."],
	allowedHandles: ["*.example.com", "alice.bsky.social"],
	defaultRole: 30, // Author
});
```

| Tuỳ chọn | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `allowedDIDs` | `string[]` | không có (cho phép tất cả khi là user đầu tiên) | Allowlist theo DID — không thể giả mạo |
| `allowedHandles` | `string[]` | không có | Allowlist theo handle, hỗ trợ wildcard (`*.example.com`) |
| `defaultRole` | `number` | `10` (Subscriber) | Vai trò gán cho user được phép, sau user đầu tiên (luôn là Admin) |

Nếu không đặt allowlist nào, chỉ **người dùng đầu tiên** được đăng ký — người khác sẽ bị từ chối với lỗi `signup_not_allowed`. Khi có ít nhất một allowlist, người dùng được chấp nhận nếu khớp **DID** hoặc khớp **handle** (đã xác minh chéo qua DNS/HTTP để chống provider giả mạo).

> **Lưu ý về phát triển cục bộ:** chuẩn OAuth của AT Protocol yêu cầu redirect URI dạng loopback dùng địa chỉ IP (`127.0.0.1`), không dùng `localhost`. Nếu chỉ mở `http://localhost:4321`, phiên đăng nhập round-trip thành công nhưng cookie session không hiển thị sau khi quay về `127.0.0.1`, khiến bạn bị bật lại trang đăng nhập. Luôn mở `http://127.0.0.1:4321/_emdash/admin` khi test Atmosphere cục bộ, sau khi đặt `server.host: "127.0.0.1"`.

### Xây dựng provider riêng

Một provider chỉ đơn giản là một `AuthProviderDescriptor` — gồm `id`, nhãn hiển thị, và bất kỳ tổ hợp nào của component React phía admin, route handler, tiền tố route công khai, và collection lưu trữ. Gói `@emdash-cms/auth-atproto` là tài liệu tham khảo đầy đủ nhất cho một provider cần form đăng nhập tuỳ chỉnh, route OAuth, và lưu trữ bền vững (persistent storage) — chủ đề này dành cho lập trình viên, xem thêm Chương 37 (Hooks & vòng đời sự kiện) và tài liệu `reference/*.mdx` gốc.

## Quản lý Passkey

Người dùng quản lý Passkey của mình từ trang cài đặt tài khoản:

- **Add passkey** — đăng ký thêm Passkey dự phòng hoặc cho thiết bị khác.
- **Remove passkey** — xoá Passkey không dùng nữa.
- **Rename passkey** — đặt tên gợi nhớ cho từng Passkey.

Mỗi người dùng có thể đăng ký tối đa **10 Passkey**.

> Nên đăng ký Passkey trên nhiều thiết bị (vd laptop và điện thoại) để luôn có cách đăng nhập dự phòng.

## Phiên đăng nhập (Session)

Session dùng cookie an toàn, HttpOnly, SameSite=Lax, tồn tại 30 ngày với cơ chế "sliding expiration" — thời hạn được làm mới mỗi khi có hoạt động.

## Ghi chú bảo mật

- Passkey chỉ lưu **khoá công khai** — khoá riêng tư không bao giờ rời khỏi thiết bị.
- Xác minh challenge chống replay attack.
- Giới hạn tốc độ (rate limiting) chống brute force: 5 lần thử/phút/IP.
- Session dùng cookie HttpOnly, Secure, SameSite=Lax.
- Token magic link được băm SHA-256 — token gốc không bao giờ được lưu trữ.

## Xử lý sự cố

| Vấn đề | Nguyên nhân / Cách xử lý |
| --- | --- |
| "No passkeys registered" | Passkey có thể đã bị xoá khỏi trình quản lý mật khẩu — nhờ admin gửi magic link hoặc lời mời mới. |
| "Passkey authentication failed" | Passkey được tạo cho domain khác — Passkey gắn theo domain, cần đăng ký Passkey mới cho từng domain. |
| "Session expired" | Session mặc định 30 ngày với sliding expiration — nếu bị đăng xuất bất ngờ, xoá cookie và đăng nhập lại. |
| Mất hết Passkey | Nhờ admin khác gửi magic link (cần cấu hình email), đăng nhập bằng magic link rồi đăng ký Passkey mới. |
| "Account is not in the allowlist" (Atmosphere) | Handle/DID không nằm trong `allowedDIDs`/`allowedHandles`; kiểm tra pattern wildcard. |
| "Self-signup is not allowed" (Atmosphere) | Không có allowlist và bạn không phải người dùng đầu tiên — cần được thêm vào allowlist hoặc được admin mời. |

## Lưu ý về Cloudflare Access

Khi triển khai lên Cloudflare, bạn có thể dùng **Cloudflare Access** thay cho Passkey — Access xử lý xác thực ngay tại edge bằng identity provider có sẵn của tổ chức. Khi bật, Access trở thành phương thức xác thực **duy nhất**: Passkey, OAuth, magic link và tự đăng ký (self-signup) đều bị tắt. Đây là chủ đề cấu hình triển khai, được trình bày kỹ hơn ở [Chương 19 — Quản lý người dùng, vai trò và quyền hạn](./19-nguoi-dung-vai-tro.md) (vai trò/roleMapping) và [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md).

## Xem thêm

- [Chương 2 — Cài đặt lần đầu và Trình cài đặt (Setup Wizard)](./02-cai-dat-lan-dau.md)
- [Chương 6 — Làm quen giao diện quản trị (Admin Panel)](./06-lam-quen-admin-panel.md)
- [Chương 19 — Quản lý người dùng, vai trò và quyền hạn](./19-nguoi-dung-vai-tro.md)
- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 28 — Bí mật cấu hình & biến môi trường](./28-bi-mat-cau-hinh.md)
