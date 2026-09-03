# Hướng dẫn Lưu trữ & Triển khai Plugin Chessfenpgn

## 1. Tóm tắt
Plugin `chessfenpgn` hiện tại đã hoàn thiện 100% các tính năng theo yêu cầu:
- Kéo thả cờ và sinh mã FEN/PGN ở Admin Page (`/editor`).
- Chèn khối mã cờ (Chess FEN / Chess PGN) trong bài viết với Widget tùy chỉnh.
- Hiển thị bản vẽ bàn cờ hoàn chỉnh ngoài Frontend bằng Astro Component (`ChessFen.astro`, `ChessPgn.astro`).

Tất cả mã nguồn của plugin đã được đóng gói gọn gàng, tách biệt và hoàn toàn sử dụng giấy phép MIT (sử dụng thư viện `chess.js` và `react-chessboard`).

## 2. Cách Backup (Lưu trữ) Plugin
Vì plugin này do bạn tự phát triển (local plugin) và chưa đưa lên Marketplace, bạn cần sao lưu toàn bộ thư mục mã nguồn của plugin này.

**Thư mục cần copy:**
`packages/plugins/chessfenpgn`

Chỉ cần nén thư mục này lại (ví dụ `chessfenpgn.zip`) hoặc đẩy lên một kho lưu trữ GitHub riêng là bạn đã backup thành công.

## 3. Cách Cài đặt lại (Restore/Deploy) sang máy khác hoặc dự án EmDash khác

Khi bạn cài đặt một dự án EmDash mới (hoặc mang sang máy khác), hãy làm theo 3 bước sau để cài đặt plugin:

### Bước 1: Sao chép thư mục
Copy thư mục `chessfenpgn` vào trong dự án mới. Tốt nhất là đặt trong thư mục `packages/plugins/chessfenpgn` (nếu là dạng monorepo) hoặc đặt ngay trong thư mục gốc của dự án (ví dụ: `plugins/chessfenpgn`).

### Bước 2: Thêm Dependency
Mở file `package.json` của dự án chính (ví dụ dự án `emdash-demo` đang nằm ở thư mục `demos/simple/package.json`), thêm dòng sau vào phần `dependencies`:

```json
"dependencies": {
  "@emdash-cms/plugin-chessfenpgn": "workspace:*" // (Nếu dùng pnpm workspace)
  // HOẶC
  "@emdash-cms/plugin-chessfenpgn": "file:../../plugins/chessfenpgn" // (Nếu là đường dẫn thư mục)
}
```

Sau đó chạy lệnh cài đặt:
```bash
pnpm install
# hoặc npm install / yarn install
```
*(Quá trình này sẽ tự động cài luôn các thư viện phụ thuộc của plugin là `chess.js` và `react-chessboard`)*

### Bước 3: Đăng ký Plugin vào cấu hình Astro
Mở file `astro.config.mjs` của dự án chính và đăng ký plugin:

```javascript
import { defineConfig } from 'astro/config';
import emdash from 'emdash/astro';
import { chessfenpgnPlugin } from '@emdash-cms/plugin-chessfenpgn'; // 1. Import plugin

export default defineConfig({
  integrations: [
    emdash({
      plugins: [
        chessfenpgnPlugin() // 2. Kích hoạt plugin
      ]
    })
  ]
});
```

Chỉ với 3 bước trên, bạn khởi động lại Server (`pnpm dev`) là toàn bộ tính năng cờ vua sẽ lại hoạt động hoàn hảo trên máy tính mới.

## 4. Các câu hỏi mở (Cần bạn xác nhận)
Bạn có muốn tôi thử thực hiện lệnh giả lập đóng gói plugin này thành một file nén dạng `.tgz` (tarball) để bạn dễ dàng cất giữ luôn bây giờ không? (Dùng lệnh `pnpm pack`).
