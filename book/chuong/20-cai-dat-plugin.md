# 20. Cài đặt & Quản lý Plugin (người dùng cuối)

Áp dụng cho vai trò: Quản trị viên/Vận hành

## Tổng quan

Plugin mở rộng EmDash qua một bề mặt mở rộng (extension surface) được định nghĩa sẵn — có thể phản ứng theo sự kiện vòng đời nội dung, lưu dữ liệu riêng, expose cài đặt cho admin, thêm trang vào admin panel, và phục vụ route API.

### Plugin có thể làm gì

- **Phản ứng theo sự kiện** — chạy code khi lưu nội dung, upload media, kiểm duyệt bình luận, tác vụ theo lịch, và sự kiện vòng đời plugin.
- **Lưu dữ liệu** — lưu bản ghi riêng của plugin trong collection có index, cộng thêm kho key-value riêng cho cài đặt/trạng thái.
- **Thêm trang admin** — đóng góp trang và widget dashboard cho admin panel, kèm form cài đặt tự sinh.
- **Phục vụ route API** — expose endpoint dưới `/_emdash/api/plugins/<id>/<route>` cho admin UI hoặc tích hợp bên ngoài.
- **Gọi API bên ngoài** — thực hiện HTTP request tới danh sách host đã khai báo (allowlist).
- **Gửi email** — gửi email giao dịch (transactional) qua provider đã cấu hình.

## Hai định dạng Plugin

- **Plugin sandboxed** — chạy trong runtime cách ly, quản lý bởi một sandbox runner có thể cấu hình. Cài được từ marketplace chỉ với một cú nhấp, chịu sự kiểm soát capability và tài nguyên, chỉ tiếp cận đúng API đã khai báo. **Đây là lựa chọn khuyến nghị cho hầu hết plugin.**
- **Plugin native** — chạy cùng tiến trình với site Astro của bạn. Có toàn quyền truy cập runtime, có thể đi kèm trang admin React và component render Portable Text, chèn HTML vào trang công khai. Cài bằng cách sửa code rồi deploy, chạy qua npm thay vì marketplace.

Nếu bạn đang cài một plugin do người khác viết, gần như luôn nên chọn sandboxed. Nếu bạn tự viết plugin, xem [Chương 39 — Viết Plugin đầu tiên (sandboxed)](./39-viet-plugin-dau-tien.md) để chọn định dạng phù hợp.

## Cài đặt từ Marketplace

Admin dashboard có sẵn trình duyệt marketplace để tìm, cài, và quản lý plugin.

### Điều kiện tiên quyết

**1. Cấu hình sandbox runner** — plugin marketplace chạy trong runtime cách ly, cần sandbox runner:

```typescript title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
  integrations: [
    emdash({
      marketplace: "https://marketplace.emdashcms.com",
      sandboxRunner: "@emdash-cms/sandbox-cloudflare",
    }),
  ],
});
```

Trên **Cloudflare Workers**, sandbox dùng Dynamic Worker Loader API (không cần thiết lập thêm). Trên **Node.js**, cài sandbox runner workerd:

```bash
npm install @emdash-cms/sandbox-workerd
```

Rồi truyền runner tường minh:

```typescript title="astro.config.mjs"
emdash({
  marketplace: "https://marketplace.emdashcms.com",
  sandboxRunner: "@emdash-cms/sandbox-workerd/sandbox",
})
```

Khi phát triển cục bộ, cài `miniflare` làm dev dependency để khởi động sandbox nhanh hơn:

```bash
npm install -D miniflare
```

**2. Quyền Admin** — chỉ Admin mới có thể cài hoặc gỡ plugin.

### Duyệt và cài đặt

1. Mở admin panel, vào **Plugins > Marketplace**.
2. Duyệt hoặc tìm kiếm plugin.
3. Nhấn vào thẻ plugin để xem trang chi tiết — README, ảnh chụp màn hình, capability, và kết quả kiểm toán bảo mật.
4. Nhấn **Install**.
5. Xem hộp thoại "capability consent" — cho biết plugin sẽ truy cập được những gì.
6. Xác nhận cài đặt.

Plugin sẽ được tải về, lưu trong bucket R2 của site, và nạp vào sandbox runner — hoạt động ngay lập tức.

### Capability Consent

Trước khi cài, bạn sẽ thấy hộp thoại liệt kê những gì plugin cần truy cập:

| Capability | Ý nghĩa |
| --- | --- |
| `content:read` | Đọc nội dung của bạn |
| `content:write` | Tạo, sửa, xoá nội dung |
| `media:read` | Truy cập thư viện Media |
| `media:write` | Upload và quản lý media |
| `network:request` | Gửi network request tới host cụ thể |

> Chỉ cài plugin từ tác giả bạn tin tưởng. Hệ capability giới hạn những gì plugin sandbox truy cập được, nhưng một plugin có `content:write` vẫn có thể sửa **bất kỳ** nội dung nào trên site.

### Kiểm toán bảo mật (Security Audit)

Mọi phiên bản plugin trên marketplace đều đã qua kiểm toán bảo mật tự động. Kết luận kiểm toán hiện trên thẻ plugin:

- **Pass** — không phát hiện vấn đề.
- **Warn** — có vấn đề nhỏ được gắn cờ (nên xem lại phát hiện).
- **Fail** — phát hiện vấn đề bảo mật đáng kể.

Xem báo cáo kiểm toán đầy đủ, gồm từng phát hiện và mức độ nghiêm trọng, trên trang chi tiết plugin.

### Cập nhật

Khi có phiên bản mới của plugin đã cài:

1. Vào **Plugins** trong admin panel.
2. Plugin marketplace hiện huy hiệu **Update available**.
3. Nhấn **Update** để xem changelog và các thay đổi capability (nếu có).
4. Nếu phiên bản mới cần thêm capability, bạn sẽ thấy phần chênh lệch (diff) và cần phê duyệt.
5. Xác nhận cập nhật.

> Cập nhật thêm capability mới luôn cần phê duyệt tường minh. Nếu một plugin trước chỉ đọc nội dung, nay muốn gửi network request, capability mới sẽ được làm nổi bật trước khi bạn xác nhận.

### Gỡ cài đặt

1. Vào **Plugins** trong admin panel.
2. Nhấn vào plugin marketplace muốn gỡ.
3. Nhấn **Uninstall**.
4. Chọn giữ lại hay xoá dữ liệu đã lưu của plugin.
5. Xác nhận.

Code sandbox của plugin bị xoá khỏi bucket R2 và ngừng chạy ngay lập tức.

## Cài đặt qua cấu hình (Plugin Native)

Plugin native — code của riêng bạn, hoặc gói cài qua npm — được thêm trực tiếp vào cấu hình Astro:

```typescript title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import seoPlugin from "@emdash-cms/plugin-seo";

export default defineConfig({
  integrations: [
    emdash({
      plugins: [
        seoPlugin({ generateSitemap: true }),
      ],
    }),
  ],
});
```

Plugin native: chạy cùng tiến trình (không sandbox), có toàn quyền truy cập API Node.js, được nạp lúc build và mỗi lần server khởi động, và **không thể** cài/gỡ từ admin UI.

> Chỉ dùng plugin native khi cần tính năng đòi hỏi tích hợp lúc build: trang admin React, component render Portable Text, hoặc chèn page fragment. Với mọi trường hợp khác, ưu tiên plugin sandboxed — có thể cài, cập nhật, gỡ ngay từ admin panel.

### So sánh Marketplace vs. Config

| | Marketplace (sandboxed) | Config (native hoặc in-process sandboxed) |
| --- | --- | --- |
| Cách cài | Một cú nhấp trong admin UI | Sửa code + `npm install` + deploy |
| Thực thi | Sandbox runtime qua runner đã cấu hình | Cùng tiến trình (hoặc sandbox nếu khai trong `sandboxed: []` và có runner) |
| Capability | Thực thi qua sandbox bridge — `ctx.*` + cách ly runtime | Chỉ `ctx.*` (plugin in-process có thể bỏ qua qua `fetch()`/env/import trực tiếp) |
| API Node.js | Không có | Toàn quyền (chỉ với in-process) |
| Trang admin React | Không (dùng Block Kit thay thế) | Có (plugin native) |
| Component render PT | Không | Có (plugin native) |
| Cập nhật | Một cú nhấp trong admin | Nâng version + deploy |
| Phù hợp cho | Hầu hết plugin | Plugin cần tích hợp lúc build |

## Registry của Plugin (thay thế thử nghiệm cho Marketplace)

Registry là phiên bản kế nhiệm phi tập trung (decentralized) của marketplace trung tâm — xây dựng trên AT Protocol (mạng đứng sau Bluesky). Nhà phát hành sở hữu bản ghi của họ; bất kỳ ai cũng có thể vận hành bộ tổng hợp (**aggregator**) để lập chỉ mục các plugin đó. Mỗi aggregator tự quy định những labeller nào phải duyệt một listing trước khi nó xuất hiện.

> **Thử nghiệm:** Registry đang trong giai đoạn phát triển tích cực, hành vi và cấu trúc dữ liệu có thể thay đổi — cố định (pin) EmDash đúng một phiên bản khi phụ thuộc vào registry, và kiểm tra changelog trước khi nâng cấp. Aggregator tham chiếu chạy tại `registry.emdashcms.com`.

### So sánh Marketplace và Registry

| | Marketplace | Registry |
| --- | --- | --- |
| Kiểm soát | Một công ty sở hữu và vận hành | Không có chủ sở hữu trung tâm — ai cũng vận hành được aggregator |
| Khám phá | Phục vụ bởi dịch vụ marketplace | Phục vụ bởi aggregator lập chỉ mục mạng |
| Kiểm duyệt | Đơn vị vận hành xét duyệt và có thể gỡ listing | Labeller duyệt đúng phiên bản listing, có thể block/takedown |
| Tin tưởng ai | Đơn vị vận hành marketplace | Aggregator bạn trỏ tới + labeller theo chính sách của nó |

Bạn chỉ cấu hình **một trong hai** cho một site. Khi `experimental.registry` được đặt, luồng duyệt/cài trong admin dùng registry.

### Bật Registry

Registry yêu cầu `sandboxRunner` vì plugin registry luôn chạy sandbox:

```typescript title="astro.config.mjs"
emdash({
  sandboxRunner: "@emdash-cms/sandbox-cloudflare",
  experimental: {
    registry: "https://registry.emdashcms.com",
  },
})
```

Dùng dạng object khi cần khai báo labeller được chấp nhận hoặc chính sách tuổi phiên bản:

```typescript title="astro.config.mjs"
emdash({
  sandboxRunner: "@emdash-cms/sandbox-cloudflare",
  experimental: {
    registry: {
      aggregatorUrl: "https://registry.emdashcms.com",
      acceptLabelers: "did:web:labels.emdashcms.com",
      policy: {
        minimumReleaseAge: "48h",
        minimumReleaseAgeExclude: ["did:plc:yourfirstpartydid"],
      },
    },
  },
})
```

`aggregatorUrl` phải dùng HTTPS ở production (`http://localhost` chỉ được phép khi phát triển). `policy.minimumReleaseAge` giữ lại các bản phát hành mới hơn ngưỡng này khi chọn phiên bản để cài/cập nhật, mở rộng thời gian để một takedown kịp có hiệu lực trước khi bản phát hành bị xâm phạm đến được site của bạn.

### Duyệt và cài từ Registry

1. Mở admin panel, vào **Plugins > Registry**.
2. Duyệt hoặc tìm kiếm — mỗi kết quả đã duyệt hiện tên listing, tên tác giả đã duyệt (hoặc publisher DID ổn định), và phiên bản mới nhất.
3. Mở một plugin để xem README, ảnh chụp màn hình, quyền truy cập khai báo, và lịch sử phát hành.
4. Nhấn **Install** và xem hộp thoại capability consent.
5. Xác nhận.

Việc cài đặt xác minh byte đã tải đúng checksum của release, xác nhận plugin id/version của bundle khớp với release, và capability khai báo khớp với những gì bạn đã duyệt. Cập nhật/gỡ hoạt động giống hệt plugin marketplace.

> Vì registry phi tập trung nên niềm tin phải tường minh. Chỉ trỏ `aggregatorUrl` tới một aggregator bạn tự vận hành hoặc tin tưởng ở mức tương đương một nguồn plugin trung tâm.

### Xây dựng trang khám phá riêng (dành cho lập trình viên nâng cao)

Gói `@emdash-cms/registry-client` cho phép xây dựng trang danh mục plugin, trang tìm kiếm, hoặc feed release của riêng bạn bên ngoài EmDash, dùng API khám phá (discovery) công khai, chỉ đọc của registry — chạy được ở bất kỳ đâu có `fetch` (Node, Workers, trình duyệt, hoặc site Astro). Đây là chủ đề nâng cao — nếu chỉ cần cài plugin lên site EmDash, bạn không cần đến gói này, chỉ cần bật registry trong cấu hình và dùng admin dashboard như bình thường.

## Nâng cấp Plugin khi cập nhật EmDash

Khi nâng cấp `emdash` và các gói plugin lên phiên bản mới nhất:

```sh
pnpm up --latest emdash @emdash-cms/plugin-audit-log @emdash-cms/plugin-webhook-notifier @emdash-cms/plugin-atproto
pnpm build
```

Sau khi nâng cấp, site có thể build và chạy được ngay mà không cần thay đổi gì thêm. Nếu build lỗi hoặc plugin ngừng nạp, cần rà lại các thay đổi breaking — xem đầy đủ trong changelog trên trang releases của từng gói. Một vài thay đổi breaking đáng chú ý gần đây (dành cho người vận hành site, không phải người viết plugin):

- **Registry release có thể dùng PDS blob** — nâng cấp EmDash trước khi cài một release mà gói không cung cấp URL ngoài.
- **`@emdash-cms/registry-cli` đổi tên thành `@emdash-cms/plugin-cli`** (binary `emdash-registry` → `emdash-plugin`) — chỉ ảnh hưởng site có publish plugin hoặc chạy lệnh registry.
- **Bỏ cờ `--artifact-base-url`** — CLI nay tự upload ảnh listing lên tài khoản Atmosphere dưới dạng blob.
- **Plugin phát hành chính thức đổi sang default export** — vd `@emdash-cms/plugin-audit-log`, `@emdash-cms/plugin-webhook-notifier`, `@emdash-cms/plugin-atproto` không còn dùng named export + factory call (`auditLogPlugin()`) mà dùng thẳng default export (`auditLog`). Cấu hình theo-từng-lần-cài trước đây truyền vào factory nay chuyển sang trang settings của plugin trong admin UI (lưu trong KV).

## Xem thêm

- [Chương 6 — Làm quen giao diện quản trị (Admin Panel)](./06-lam-quen-admin-panel.md)
- [Chương 30 — Nâng cấp phiên bản EmDash](./30-nang-cap-phien-ban.md)
- [Chương 39 — Viết Plugin đầu tiên (sandboxed)](./39-viet-plugin-dau-tien.md)
- [Chương 43 — Phát hành Plugin lên Registry](./43-phat-hanh-plugin.md)
- [Chương 44 — Plugin Native (nâng cao)](./44-plugin-native.md)
