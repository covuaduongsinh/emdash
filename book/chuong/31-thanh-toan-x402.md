# 31. Thanh toán tích hợp x402

Áp dụng cho vai trò: Lập trình viên, Quản trị viên/Vận hành

## Tổng quan

Gói `@emdash-cms/x402` thêm hỗ trợ [giao thức thanh toán x402](https://www.x402.org/) cho bất kỳ site Astro nào trên Cloudflare. Nó chạy như một Astro integration độc lập, và phối hợp với field CMS của EmDash để định giá theo từng trang khi bạn dùng EmDash.

x402 là giao thức thanh toán "gốc HTTP" (HTTP-native). Khi client yêu cầu tài nguyên trả phí mà chưa thanh toán, server trả về `402 Payment Required` kèm hướng dẫn thanh toán dạng máy đọc được. Agent và trình duyệt hiểu x402 có thể tự hoàn tất thanh toán rồi thử lại request.

### Khi nào dùng

Trường hợp dùng phổ biến nhất là **bot-only mode** — thu phí AI agent và scraper khi truy cập nội dung, trong khi khách người thật đọc miễn phí. Chế độ này dùng Cloudflare Bot Management để phân biệt bot với người. Bạn cũng có thể bắt buộc thanh toán cho mọi khách, hoặc chỉ kiểm tra header thanh toán mà không bắt buộc (render có điều kiện).

## Cài đặt và thiết lập

```bash
pnpm add @emdash-cms/x402
```

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import { x402 } from "@emdash-cms/x402";

export default defineConfig({
	integrations: [
		x402({
			payTo: "0xYourWalletAddress",
			network: "eip155:8453", // Base mainnet
			defaultPrice: "$0.01",
			botOnly: true,
			botScoreThreshold: 30,
		}),
	],
});
```

Thêm type reference để TypeScript biết `Astro.locals.x402`:

```ts title="src/env.d.ts"
/// <reference types="@emdash-cms/x402/locals" />
```

## Cách dùng cơ bản

Integration đặt một "enforcer" tại `Astro.locals.x402`. Gọi `enforce()` trong frontmatter trang để chặn nội dung sau lớp thanh toán:

```astro title="src/pages/posts/[...slug].astro"
---
const { x402 } = Astro.locals;

const result = await x402.enforce(Astro.request, {
  price: "$0.05",
  description: "Premium article",
});

// Nếu request chưa có thanh toán hợp lệ, enforce() trả về Response 402.
// Trả thẳng response đó để gửi hướng dẫn thanh toán cho client.
if (result instanceof Response) return result;

// Thanh toán đã xác minh (hoặc bỏ qua ở chế độ botOnly). Áp header
// response để client có bằng chứng thanh toán đã hoàn tất.
x402.applyHeaders(result, Astro.response);
---

<article>
  <h1>Premium content</h1>
</article>
```

`enforce()` trả về một trong hai: một **`Response`** (402) — client cần thanh toán, trả thẳng response đó; hoặc một **`EnforceResult`** — request tiếp tục xử lý (nội dung đã được trả tiền, hoặc việc bắt buộc bị bỏ qua vì là người thật ở chế độ botOnly).

## Chế độ Bot-Only

Khi `botOnly` là `true`, integration đọc `request.cf.botManagement.score` để phân loại: điểm dưới ngưỡng (mặc định 30) → coi là bot, bắt buộc thanh toán; điểm bằng hoặc trên ngưỡng → coi là người, bỏ qua bắt buộc; không có dữ liệu bot management (dev cục bộ, triển khai không phải Cloudflare) → coi là người.

`EnforceResult` có cờ `skipped` để phân biệt "không cần trả tiền" với "đã trả tiền":

```astro
---
const result = await x402.enforce(Astro.request, { price: "$0.01" });
if (result instanceof Response) return result;

x402.applyHeaders(result, Astro.response);

// result.paid    — true nếu thanh toán đã xác minh
// result.skipped — true nếu bỏ qua bắt buộc (là người ở chế độ botOnly)
// result.payer   — địa chỉ ví của người trả tiền (nếu đã trả)
---
```

> Chế độ bot-only cần triển khai trên Cloudflare có bật Bot Management. Ở phát triển cục bộ, mọi request được coi là người và việc bắt buộc bị bỏ qua.

## Định giá theo từng trang với EmDash

Khi dùng EmDash, thêm một field `number` thông thường vào Collection để định giá theo từng trang, đọc nó lúc xử lý request:

```astro title="src/pages/posts/[...slug].astro"
---
import { getEmDashEntry } from "emdash";

const { slug } = Astro.params;
const { entry } = await getEmDashEntry("posts", slug);

if (!entry) return Astro.redirect("/404");

const { x402 } = Astro.locals;

const result = await x402.enforce(Astro.request, {
  price: entry.data.price || "$0.01",
  description: entry.data.title,
});
if (result instanceof Response) return result;

x402.applyHeaders(result, Astro.response);
---

<article>
  <h1>{entry.data.title}</h1>
</article>
```

## Kiểm tra thanh toán mà không bắt buộc

Dùng `hasPayment()` để kiểm tra request có header thanh toán hay không, mà không xác minh hay bắt buộc — hữu ích cho render có điều kiện (hiện nội dung khác nhau cho khách đã trả tiền và chưa trả tiền):

```astro
---
const { x402 } = Astro.locals;
const hasPaid = x402.hasPayment(Astro.request);
---

{hasPaid ? (
  <p>Full premium content here.</p>
) : (
  <p>Subscribe for the full article.</p>
)}
```

> `hasPayment()` chỉ kiểm tra header thanh toán có tồn tại hay không — **không** xác minh nó hợp lệ. Dùng `enforce()` khi cần thanh toán đã xác minh.

## Tham chiếu cấu hình

| Tuỳ chọn | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `payTo` | `string` | bắt buộc | Địa chỉ ví đích |
| `network` | `string` | bắt buộc | Định danh mạng CAIP-2 (vd `eip155:8453`) |
| `defaultPrice` | `Price` | — | Giá mặc định, có thể override theo từng trang |
| `facilitatorUrl` | `string` | `https://x402.org/facilitator` | URL dịch vụ trung gian thanh toán |
| `scheme` | `string` | `"exact"` | Lược đồ thanh toán |
| `maxTimeoutSeconds` | `number` | `60` | Timeout tối đa cho chữ ký thanh toán |
| `evm` | `boolean` | `true` | Bật hỗ trợ chain EVM |
| `svm` | `boolean` | `false` | Bật hỗ trợ Solana (cần `@x402/svm`) |
| `botOnly` | `boolean` | `false` | Chỉ bắt buộc thanh toán với bot |
| `botScoreThreshold` | `number` | `30` | Ngưỡng điểm bot (1-99, càng thấp càng có khả năng là bot) |

**Định dạng giá:** chuỗi dollar (`"$0.10"`), chuỗi số (`"0.10"`), số (`0.10`), hoặc object tường minh (`{ amount: "100000", asset: "0x...", extra: {} }`).

**Định danh mạng** theo chuẩn [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md): Base mainnet `eip155:8453`, Base Sepolia `eip155:84532`, Ethereum `eip155:1`, Solana `solana:mainnet`.

## Tuỳ chọn Enforce (ghi đè theo từng trang)

```ts
await x402.enforce(Astro.request, {
	price: "$0.25",
	payTo: "0xDifferentWallet",
	network: "eip155:1",
	description: "Article: How x402 Works",
	mimeType: "text/html",
});
```

## Hỗ trợ Solana

Solana là tuỳ chọn opt-in — cài `@x402/svm` và bật trong cấu hình:

```bash
pnpm add @x402/svm
```

```js title="astro.config.mjs"
x402({
	payTo: "YourSolanaAddress",
	network: "solana:mainnet",
	svm: true,
	evm: false, // Tắt EVM nếu chỉ dùng Solana
});
```

## Cách hoạt động

1. Integration `x402()` đăng ký middleware tạo enforcer, đặt tại `Astro.locals.x402`.
2. Cấu hình được truyền vào middleware qua Vite virtual module (`virtual:x402/config`).
3. Khi `enforce()` được gọi, nó kiểm tra header `payment-signature` trên request.
4. Nếu không có header thanh toán, trả về `402 Payment Required` kèm hướng dẫn trong header `PAYMENT-REQUIRED`.
5. Nếu có header thanh toán, nó được xác minh qua dịch vụ trung gian (facilitator) và tất toán.
6. Sau khi tất toán, header `PAYMENT-RESPONSE` được đặt trên response qua `applyHeaders()`.

Resource server khởi tạo lười (lazy) ở request đầu tiên và được cache suốt vòng đời Worker.

## Xem thêm

- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 34 — Truy vấn nội dung trong code Astro](./34-truy-van-noi-dung.md)
