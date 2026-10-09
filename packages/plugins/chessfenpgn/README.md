# Plugin Chess FEN/PGN cho EmDash CMS

Plugin `@emdash-cms/plugin-chessfenpgn` (id: `chessfenpgn`) cung cấp khả năng nhúng bàn cờ cờ vua tương tác, hiển thị thế cờ tĩnh FEN và diễn biến ván đấu PGN cho EmDash CMS.

## Tính Năng Nổi Bật

- **Thế cờ tĩnh (FEN - `chess-fen`)**:
  - Nhúng bàn cờ thế tĩnh từ chuỗi FEN chuẩn quốc tế.
  - Tùy chỉnh góc nhìn bàn cờ (`white`, `black`, `auto` theo lượt đi trong FEN).
  - Hỗ trợ vẽ mũi tên chỉ dẫn (`arrows`, ví dụ: `e2e4 g1f3:red`).
  - Hỗ trợ tô sáng các ô cờ quan trọng (`highlights`, ví dụ: `e4 d5`).
  - 3 tùy chọn kích thước bàn cờ: Nhỏ (`S` - 320px), Vừa (`M` - 460px), Lớn (`L` - 600px).
  - Tùy chọn chú thích thế cờ (`caption`).

- **Diễn biến ván đấu (PGN - `chess-pgn`)**:
  - Nhúng trình duyệt ván cờ đầy đủ tính năng (`PgnViewer`).
  - Phân tích và hiển thị chính xác các ván cờ có tag `[FEN]` và `[SetUp "1"]`.
  - Hỗ trợ duyệt nước đi bằng chuột, phím mũi tên bàn phím (`←`, `→`, `↑`, `↓`), hoặc thanh điều khiển.
  - Hỗ trợ chú thích nước đi (`{ comment }`), ký hiệu đánh giá (`$1`, `$2`, `NAG`), và các biến phụ (`variations`).
  - Nút chuyển đổi nhanh ký hiệu cờ: Tiếng Việt (`V/H/X/T/M`) ↔ Quốc tế (`K/Q/R/B/N`).
  - Tùy chọn lật bàn cờ, hiển thị/ẩn header thông tin ván đấu.

- **Trường dữ liệu Bàn cờ (`chess-board`)**:
  - Widget kéo thả trực quan dùng trong quản trị.
  - Tương thích ngược với dữ liệu chuỗi FEN cũ và cấu trúc JSON mới `{ fen, pgn, orientation }`.

- **Trang Quản trị "Bàn cờ" (`/editor`)**:
  - Tích hợp vào thanh sidebar của EmDash Admin.
  - Giao diện Kumo hiện đại, hỗ trợ xếp quân cờ nhanh (`PositionEditor`), kiểm tra tính hợp lệ của FEN/PGN và sao chép cấu hình khối JSON vào bài viết chỉ với 1 click.

## Cài Đặt & Sử Dụng

### Trong cấu hình EmDash (`astro.config.mjs`)

```js
import { chessfenpgnPlugin } from "@emdash-cms/plugin-chessfenpgn";

export default defineConfig({
	plugins: [chessfenpgnPlugin()],
});
```

## Giấy Phép

MIT License © Công ty CP Cờ vua Dương Sinh / EmDash CMS.
