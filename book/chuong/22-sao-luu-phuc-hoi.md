# 22. Sao lưu và phục hồi dữ liệu

Áp dụng cho vai trò: Quản trị viên/Vận hành

## Tổng quan

EmDash cung cấp 3 tầng bảo vệ cho nội dung của bạn: từ khôi phục theo thời điểm (point-in-time recovery) không cần cấu hình gì trên Cloudflare, tới các bản lưu trữ (archive) tải về mà bạn tự giữ.

## Bản sao lưu chứa những gì

Một bản sao lưu chứa mọi thứ cần để dựng lại nội dung của site:

- Toàn bộ entry nội dung, kể cả draft, bài đã lên lịch, và mục trong thùng rác.
- Định nghĩa Collection và Field (mô hình nội dung của bạn).
- Taxonomy và các gán term.
- Menu, widget, section, và cài đặt SEO.
- Revision và metadata media.
- Site settings (tên, tagline, tuỳ chọn hiển thị).

Bản sao lưu **cố ý loại trừ**:

- Tài khoản người dùng, session, passkey, API token — dữ liệu xác thực không portable và không an toàn khi để trong một tệp tải về.
- Secret (secret ký preview, cấu hình plugin).
- Tệp nhị phân media — các tệp thật nằm trong bucket lưu trữ (R2, S3, hoặc cục bộ); bản sao lưu chỉ mang metadata để tham chiếu vẫn còn nguyên vẹn.

Bản sao lưu là tệp JSON theo cùng định dạng snapshot mà hệ thống preview của EmDash dùng, gắn phiên bản theo đúng release EmDash đã tạo ra nó.

## Tải xuống bằng một cú nhấp

Dưới **Settings → Backups** trong admin, nút **Download backup** sinh một bản sao lưu mới và tải về dưới dạng tệp JSON — yêu cầu vai trò Admin.

Đây là công cụ nên dùng trước các thao tác rủi ro: nhập hàng loạt (bulk import), thay đổi schema, hoặc nâng cấp lớn.

## Sao lưu tự động vào kho lưu trữ

Nếu site đã cấu hình storage backend (R2 trên Cloudflare, S3, hoặc lưu trữ cục bộ), bạn có thể bật sao lưu tự động hàng ngày:

1. Mở **Settings → Backups** trong admin.
2. Bật công tắc **Daily automatic backups**.
3. Chọn số bản sao lưu cần giữ (1–30) — bản cũ hơn tự động bị dọn.
4. Lưu. Sao lưu chạy như một phần của tác vụ bảo trì theo lịch của EmDash — không cần thiết lập cron riêng.

Bản lưu trữ được lưu dưới tiền tố `backups/` trong bucket, tên dạng `emdash-backup-<timestamp>-<random>.json`. Danh sách **Stored Backups** trong admin cho phép tải về hoặc xoá từng bản lưu trữ; **Back up now** tạo một bản theo yêu cầu ngay lập tức.

> Bản lưu trữ dùng chung bucket với tệp media. Route media của EmDash từ chối phục vụ bất cứ thứ gì dưới `backups/`, và tên bản lưu trữ có hậu tố ngẫu nhiên — nhưng nếu bạn expose thẳng bucket qua domain R2 công khai hoặc CDN, mọi thứ trong đó đều có thể truy cập được bằng URL. Ưu tiên phục vụ media qua EmDash (hoặc giới hạn domain công khai chỉ tới tiền tố media).

Sao lưu tự động "đi nhờ" (piggyback) trên nhịp bảo trì theo lịch — cùng cơ chế cấp năng lượng cho việc xuất bản theo lịch (xem lại [Chương 8](./08-soan-thao-noi-dung.md)): trên Cloudflare là cron trigger của Worker, trên Node là scheduler tích hợp sẵn. Nếu triển khai của bạn chưa cấu hình cron trigger, dùng **Back up now** hoặc nút tải xuống thay thế.

## Khôi phục theo thời điểm với D1 Time Travel

Nếu site chạy trên Cloudflare D1, bạn đã có sẵn khả năng khôi phục toàn bộ database theo thời điểm (point-in-time recovery) — luôn bật, không cần cấu hình:

```bash
# Xem bookmark hiện tại (nên làm trước các thao tác rủi ro)
npx wrangler d1 time-travel info my-database

# Khôi phục database về một thời điểm cụ thể
npx wrangler d1 time-travel restore my-database --timestamp=2026-07-08T13:00:00Z
```

Time Travel giữ 30 ngày lịch sử trên gói trả phí (7 ngày trên gói miễn phí) với độ chi tiết theo phút. Nó khôi phục **toàn bộ database** — nội dung, người dùng, cài đặt — nên đây là công cụ đúng cho khắc phục thảm hoạ ("import bị lỗi, đưa tôi về một giờ trước").

Xem thêm [tài liệu D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) của Cloudflare.

> Time Travel và bản sao lưu của EmDash bổ trợ cho nhau: Time Travel là lưới an toàn khắc phục thảm hoạ cho 30 ngày gần nhất; bản sao lưu tải về là bản lưu trữ bạn tự giữ, không hết hạn, sống sót qua cả việc xoá tài khoản hay database.

## Xuất database ra ngoài (offsite dump)

Để có bản dump SQL đầy đủ của database thô (kể cả bảng người dùng và xác thực), dùng Wrangler:

```bash
npx wrangler d1 export my-database --remote --output=backup.sql
```

Trên triển khai Node, database là một tệp SQLite duy nhất — sao chép nó khi server đã dừng, hoặc dùng `sqlite3 emdash.db ".backup backup.db"` để có bản sao nhất quán trong khi server vẫn chạy.

## Khôi phục từ bản sao lưu

Khôi phục từ một bản sao lưu JSON **cố ý chưa** được đưa thành thao tác một-cú-nhấp trong admin — ghi đè một database đang sống cần nhiều "ma sát" (friction) hơn một cái nút bấm. Các lựa chọn hiện có:

- **Cloudflare:** dùng D1 Time Travel (ở trên) để khôi phục theo thời điểm.
- **Bản dump đầy đủ:** nhập một dump từ `wrangler d1 export` bằng `npx wrangler d1 execute my-database --remote --file=backup.sql`.
- **Bản sao lưu JSON:** định dạng khớp với snapshot format của EmDash; một luồng khôi phục có hướng dẫn qua CLI đang được lên kế hoạch — theo dõi [Discussion #142](https://github.com/emdash-cms/emdash/discussions/142) trên GitHub của dự án.

## Lưu ý

- Đây là 3 công cụ khác nhau cho 3 tình huống khác nhau — không dùng lẫn: **Download backup**/sao lưu tự động cho lưu trữ dài hạn tự quản lý; **D1 Time Travel** cho khắc phục thảm hoạ tức thời trong 7-30 ngày gần nhất; **wrangler d1 export** cho dump SQL đầy đủ (kể cả dữ liệu nhạy cảm như user/auth) khi cần di chuyển hoặc kiểm toán.
- Vì bản sao lưu JSON không chứa dữ liệu xác thực, khôi phục từ bản sao lưu này **không** khôi phục lại được tài khoản người dùng/passkey — chỉ D1 Time Travel hoặc dump SQL đầy đủ mới làm được điều đó.

## Xem thêm

- [Chương 8 — Soạn thảo nội dung và Portable Text](./08-soan-thao-noi-dung.md)
- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 27 — Cơ sở dữ liệu (SQLite/PostgreSQL/D1)](./27-co-so-du-lieu.md)
- [Chương 28 — Bí mật cấu hình & biến môi trường](./28-bi-mat-cau-hinh.md)
