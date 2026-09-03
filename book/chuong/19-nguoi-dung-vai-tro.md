# 19. Quản lý người dùng, vai trò và quyền hạn

Áp dụng cho vai trò: Quản trị viên/Vận hành

## Tổng quan

EmDash dùng kiểm soát truy cập theo vai trò (role-based access control) với 5 cấp độ. Chương này trình bày đầy đủ hệ vai trò, cách mời người dùng mới, và cách ánh xạ vai trò khi dùng Cloudflare Access — bổ sung cho phần đăng nhập đã trình bày ở [Chương 7](./07-dang-nhap-passkey.md).

## 5 vai trò (User Roles)

| Vai trò | Cấp độ | Mô tả |
| --- | --- | --- |
| **Subscriber** | 10 | Đọc nội dung đã published (không truy cập draft) |
| **Contributor** | 20 | Tạo nội dung (cần được duyệt để publish) |
| **Author** | 30 | Tạo/sửa/xuất bản nội dung của chính mình |
| **Editor** | 40 | Quản lý mọi nội dung |
| **Admin** | 50 | Toàn quyền, kể cả Settings |

Mỗi vai trò kế thừa quyền của mọi vai trò thấp hơn. **Người dùng đầu tiên luôn được tạo với vai trò Admin.**

### Subscriber và nội dung draft

Subscriber giữ quyền `content:read`, nên nội dung published dành riêng cho thành viên (member-only) có thể phục vụ cho độc giả đã đăng nhập. Họ **không thể** xem draft, nội dung đã lên lịch, nội dung trong thùng rác (trash), revision, hay URL preview — những thứ này yêu cầu quyền `content:read_drafts`, chỉ cấp từ Contributor trở lên. Endpoint danh sách và lấy chi tiết tự động lọc còn `status=published` với Subscriber; các view chỉ dành cho editor (`/compare`, `/revisions`, `/trash`, `/preview-url`) từ chối thẳng request của Subscriber.

## Mời người dùng mới

Admin có thể mời người dùng mới qua admin panel:

1. Vào **Settings** > **Users**.
2. Nhấn **Invite User**.
3. Nhập email người dùng và chọn vai trò.
4. Nhấn **Send Invite**.
5. Người dùng nhận email kèm liên kết mời.
6. Họ nhấn liên kết và đăng ký Passkey.

Lời mời có hiệu lực **7 ngày**. Admin có thể gửi lại hoặc thu hồi lời mời từ trang Users.

## Cho phép một nhóm đăng nhập mà không cần mời từng người

Để cho một nhóm đăng nhập mà không cần mời từng người, cấu hình một [provider đăng nhập](./07-dang-nhap-passkey.md) kèm allowlist. Provider Atmosphere chấp nhận `allowedHandles` và `allowedDIDs` (xem lại Chương 7); adapter Cloudflare Access cấp phát người dùng từ identity provider của bạn qua `autoProvision` và `roleMapping` (xem bên dưới). Bất kỳ provider nào đã cấu hình cũng có thể tạo tài khoản admin ban đầu.

## Ánh xạ vai trò với Cloudflare Access

Khi dùng Cloudflare Access làm phương thức xác thực (xem lại phần cuối Chương 7), bạn có thể ánh xạ nhóm trong identity provider (IdP) sang vai trò EmDash:

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import emdash from "emdash/astro";
import { d1, access } from "@emdash-cms/cloudflare";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	integrations: [
		emdash({
			database: d1({ binding: "DB" }),
			auth: access({
				teamDomain: "myteam.cloudflareaccess.com",
				audience: "abc123def456...", // Lấy từ Access app settings
			}),
		}),
	],
});
```

### Tuỳ chọn cấu hình

| Tuỳ chọn | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `teamDomain` | `string` | bắt buộc | Domain team Access của bạn (vd `myteam.cloudflareaccess.com`) |
| `audience` | `string` | bắt buộc | Application Audience (AUD) tag từ cài đặt Access |
| `autoProvision` | `boolean` | `true` | Tạo người dùng EmDash khi đăng nhập Access lần đầu |
| `defaultRole` | `number` | `30` | Vai trò cho người dùng không thuộc nhóm nào (30 = Author) |
| `syncRoles` | `boolean` | `false` | Cập nhật vai trò mỗi lần đăng nhập theo nhóm IdP |
| `roleMapping` | `object` | — | Ánh xạ tên nhóm IdP sang cấp vai trò |
| `audienceEnvVar` | `string` | `"CF_ACCESS_AUDIENCE"` | Tên biến môi trường chứa audience tag (thay vì hardcode) |

### Ví dụ ánh xạ nhóm

```js title="astro.config.mjs"
emdash({
	auth: access({
		teamDomain: "myteam.cloudflareaccess.com",
		audience: "abc123...",
		roleMapping: {
			Admins: 50, // Admin
			"Content Editors": 40, // Editor
			Writers: 30, // Author
		},
		defaultRole: 20, // Contributor cho người không thuộc nhóm nào
	}),
});
```

Nhóm khớp đầu tiên sẽ thắng nếu người dùng thuộc nhiều nhóm. **Người dùng đầu tiên** truy cập site luôn trở thành Admin, bất kể thuộc nhóm nào.

### Hành vi đồng bộ vai trò

Mặc định (`syncRoles: false`), vai trò của người dùng được đặt khi họ đăng nhập lần đầu và không đổi sau đó — cho phép admin tự điều chỉnh vai trò trong EmDash.

Đặt `syncRoles: true` nếu muốn nhóm IdP là nguồn quyết định (authoritative) — vai trò người dùng sẽ cập nhật mỗi lần đăng nhập theo nhóm hiện tại của họ.

## Xem thêm

- [Chương 7 — Đăng nhập không mật khẩu bằng Passkey](./07-dang-nhap-passkey.md)
- [Chương 6 — Làm quen giao diện quản trị (Admin Panel)](./06-lam-quen-admin-panel.md)
- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 35 — REST API tham chiếu](./35-rest-api.md)
