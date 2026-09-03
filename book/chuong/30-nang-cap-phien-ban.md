# 30. Nâng cấp phiên bản EmDash

Áp dụng cho vai trò: Quản trị viên/Vận hành

## Tổng quan

Chương này dành cho người vận hành site — người điều hành một site xây trên EmDash và muốn đưa nó lên phiên bản mới hơn. Chương này bao phủ gói `emdash` và `@emdash-cms/cloudflare`. Gói plugin có hướng dẫn riêng ([Chương 20](./20-cai-dat-plugin.md), mục "Nâng cấp Plugin khi cập nhật EmDash"), và thay đổi Collection/Field của riêng bạn nằm ở [Chương 27](./27-co-so-du-lieu.md) (mục "Evolving a Deployed Site").

## Release và số phiên bản

EmDash phát hành trước version 1.0, số phiên bản theo hai quy tắc:

- **Patch release** (vd 0.35.0 → 0.35.1) — mang bản sửa lỗi và cải tiến nhỏ.
- **Minor release** (vd 0.35 → 0.36) — mang tính năng mới và mọi thay đổi breaking. Thay đổi breaking được đánh dấu **Breaking** trong entry release, kèm hành động cụ thể bạn cần làm.

`emdash` và `@emdash-cms/cloudflare` được phát hành cùng nhau, dùng chung một số phiên bản — `@emdash-cms/cloudflare` phụ thuộc đúng phiên bản `emdash` khớp, nên nâng cấp cả hai gói trong cùng một bước. Gói plugin (vd `@emdash-cms/plugin-forms`) có số phiên bản riêng, tự khai báo phiên bản `emdash` tối thiểu cần.

Trang [releases](https://github.com/emdash-cms/emdash/releases) có một entry cho mỗi gói và phiên bản. Trước khi nâng cấp, đọc các entry `emdash` giữa phiên bản đang cài và phiên bản mục tiêu, và cùng khoảng đó cho `@emdash-cms/cloudflare` nếu site chạy trên Cloudflare.

## Trước khi nâng cấp

**Sao lưu trước.** Migration lõi mà một release mới áp dụng lên database không có bước hoàn tác (undo) — bản sao lưu là cách duy nhất quay lại trạng thái trước đó (xem lại [Chương 22](./22-sao-luu-phuc-hoi.md)).

Kiểm tra phiên bản Node.js trên máy build site, và với triển khai Node.js, trên cả server — xem yêu cầu ở [Chương 2](./02-cai-dat-lan-dau.md).

## Nâng cấp gói

Các lệnh dưới dùng pnpm, cho site tạo từ template Cloudflare. Với triển khai Node.js, bỏ qua `@emdash-cms/cloudflare`.

1. **Kiểm tra phiên bản đã cài và release mới nhất:**
   ```bash
   pnpm outdated emdash @emdash-cms/cloudflare
   ```

2. **Nâng cả hai gói lên release mới nhất.** `package.json` sinh từ template liệt kê gói với khoảng caret kiểu `^0.35.0`. Với phiên bản dưới 1.0, khoảng caret chỉ chấp nhận patch release (0.35.1, không phải 0.36.0) — `pnpm up` không kèm tuỳ chọn khác sẽ giữ trong khoảng đó. Cờ `--latest` viết lại khoảng thành release mới nhất và cài đặt nó:
   ```bash
   pnpm up --latest emdash @emdash-cms/cloudflare
   ```
   Thêm các gói plugin trong `package.json` của bạn vào cùng lệnh này.

3. **Build site:**
   ```bash
   pnpm build
   ```
   Build ghi ra manifest migration cho phiên bản đã cài. Nếu build lỗi, xem mục "Nếu site bị hỏng sau khi nâng cấp" bên dưới.

4. **Chạy site cục bộ và mở admin tại `/_emdash/admin`:**
   ```bash
   pnpm dev
   ```
   EmDash integration sinh `emdash-env.d.ts` khi dev server khởi động. Migration lõi đang chờ chạy ở request đầu tiên.

## Deploy và xác minh

Deploy bản build giống mọi thay đổi khác. Lệnh sau deploy site Cloudflare; với triển khai Node.js, khởi động lại tiến trình server với bản build mới:

```bash
pnpm wrangler deploy
```

Với chế độ migration runtime mặc định `auto`, site đã triển khai tự áp dụng migration lõi đang chờ ở request đầu tiên. Để áp dụng chúng **trước khi** code mới nhận traffic, và xác minh database đã triển khai sau đó, làm theo quy trình ở [Chương 27](./27-co-so-du-lieu.md) (mục "Quản lý Migration lõi") — lệnh `emdash migrate --check` thoát khác 0 khi database đã triển khai có migration đang chờ hoặc không rõ cho phiên bản đã cài.

Sau khi deploy, mở admin và một trang công khai của site để kiểm tra.

## Nếu site bị hỏng sau khi nâng cấp

- **Build lỗi, hoặc một trang của bạn lỗi lúc runtime:** đọc các entry release đánh dấu **Breaking** cho những phiên bản bạn đã bỏ qua, và thực hiện thay đổi được nêu.
- **Một plugin không nạp được:** đọc entry release riêng của plugin đó và xem [Chương 20](./20-cai-dat-plugin.md) (mục nâng cấp plugin).
- **Lỗi nhắc tới một API của Astro hoặc gói `@astrojs/*`:** EmDash yêu cầu Astro 6 trở lên — xem [hướng dẫn nâng cấp của Astro](https://docs.astro.build/en/upgrade-astro/) để cập nhật `astro` cùng các integration chính thức của nó.
- **Muốn quay lại release trước:** cài lại phiên bản gói trước đó. Việc cài lại **không** hoàn tác migration lõi — nếu release trước lỗi khi chạy trên database đã migrate, khôi phục từ bản sao lưu đã lấy trước khi nâng cấp.

## Xem thêm

- [Chương 20 — Cài đặt & Quản lý Plugin (người dùng cuối)](./20-cai-dat-plugin.md)
- [Chương 22 — Sao lưu và phục hồi dữ liệu](./22-sao-luu-phuc-hoi.md)
- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 27 — Cơ sở dữ liệu (SQLite/PostgreSQL/D1)](./27-co-so-du-lieu.md)
