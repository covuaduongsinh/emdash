# Kế hoạch Triển khai: Plugin `chessfenpgn` cho EmDash CMS

## [Goal Description]
Xây dựng một (hoặc hai) plugin cục bộ tên là `chessfenpgn` cho EmDash CMS với giấy phép MIT, lấy cảm hứng từ các tính năng của plugin WordPress `rpb-chessboard`. Plugin này sẽ cung cấp công cụ soạn thảo và hiển thị sơ đồ thế cờ (FEN) và ván cờ đầy đủ (PGN).
Theo yêu cầu, ưu tiên có **nhập văn bản thô (raw)** VÀ **trình kéo thả quân cờ trực quan ngay trong khung nhập của CMS**. Mã nguồn sẽ được cấu trúc dưới dạng package chuẩn (VD: `packages/plugins/chessfenpgn`).

## User Review Required
> [!WARNING]
> **Giới hạn kiến trúc của EmDash (Quan trọng):**
> Trong WordPress (Gutenberg), một Block có thể chứa giao diện React kéo thả tự do. Tuy nhiên, trong EmDash CMS, các **PortableText Blocks** (khối chèn vào giữa bài viết) chỉ hỗ trợ form nhập liệu cơ bản (Text, Number, Select...) thông qua chuẩn Block Kit và hiển thị dạng "Thẻ thông tin" (Card) chung chung. **Ta KHÔNG THỂ nhúng một bàn cờ kéo thả trực tiếp vào form popup của Block chèn giữa bài viết được.**
>
> **Giải pháp kiến trúc thay thế (Workaround):**
> Để đáp ứng được cả nhu cầu "chèn giữa bài viết" VÀ "có giao diện kéo thả", tôi đề xuất plugin này sẽ cung cấp 3 tính năng kết hợp:
> 1. **Field Widget (Trường dữ liệu tùy chỉnh):** Tạo một widget tên là `chess-editor`. Nếu bạn tạo một trường (Field) độc lập cho bài viết (VD: trường "Ván cờ chính"), bạn **HOÀN TOÀN CÓ THỂ** sử dụng giao diện kéo thả trực quan trực tiếp!
> 2. **PortableText Blocks:** Cung cấp 2 khối chèn giữa bài viết (`chess-fen` và `chess-pgn`) nhưng chỉ cho phép nhập **văn bản thô (raw text)**.
> 3. **Admin Page (Trang công cụ phụ trợ):** Cung cấp một trang riêng trong Admin CMS (VD: `/admin/chess-editor`). Quản trị viên có thể vào đây, dùng chuột xếp cờ, sau đó nhấn "Copy FEN/PGN" và dán (paste) chuỗi văn bản thô đó vào PortableText Blocks!

## Open Questions
- Với giới hạn của EmDash như trên, bạn có đồng ý với giải pháp cung cấp cả Field Widget (cho trường độc lập) và Admin Page (để copy-paste vào bài viết) không?
- Về việc chia tách: Vì cả FEN và PGN đều xài chung thư viện `chess.js` và `react-chessboard`, việc tách thành 2 plugin `chessfen` và `chesspgn` sẽ làm code lặp lại và thư viện bị tải 2 lần. Do đó, tôi đề xuất vẫn gộp chung vào 1 plugin tên là `packages/plugins/chessfenpgn`. Bạn có đồng ý không?

## Proposed Changes

### 1. Khởi tạo Package Plugin `chessfenpgn`
#### [NEW] `packages/plugins/chessfenpgn/package.json`
Định nghĩa package name `@emdash-cms/plugin-chessfenpgn` với license MIT. Phụ thuộc vào `chess.js` và `react-chessboard`.

#### [NEW] `packages/plugins/chessfenpgn/src/index.ts`
Khai báo plugin, đăng ký PortableText Blocks (chỉ nhận text thô) và khai báo Field Widget:
```typescript
import { definePlugin } from "emdash";

export function chessfenpgnPlugin() {
	return {
		id: "chessfenpgn",
		version: "0.1.0",
		entrypoint: "@emdash-cms/plugin-chessfenpgn",
		adminEntry: "@emdash-cms/plugin-chessfenpgn/admin", // Import UI
		componentsEntry: "@emdash-cms/plugin-chessfenpgn/astro"
	};
}

export function createPlugin() {
	return definePlugin({
		id: "chessfenpgn",
		version: "0.1.0",
		admin: {
			portableTextBlocks: [
				{ type: "chess-fen", label: "Chess (FEN)", icon: "grid", fields: [{ type: "text_input", action_id: "fen", label: "Chuỗi FEN thô" }] },
				{ type: "chess-pgn", label: "Chess (PGN)", icon: "play", fields: [{ type: "text_input", action_id: "pgn", label: "Chuỗi PGN thô", multiline: true }] }
			],
			fieldWidgets: [
				{ name: "chess-board", label: "Bàn cờ kéo thả (FEN/PGN)", fieldTypes: ["string", "text", "json"] }
			]
		}
	});
}
export default createPlugin;
```

### 2. Xây dựng giao diện kéo thả (Admin UI)
#### [NEW] `packages/plugins/chessfenpgn/src/admin.tsx`
Export các Widget và Trang quản trị.
```typescript
import type { PluginAdminExports } from "emdash";
import { ChessWidget } from "./components/ChessWidget.tsx";
import { ChessEditorPage } from "./components/ChessEditorPage.tsx";

export const fields: PluginAdminExports["fields"] = {
	"chess-board": ChessWidget, // Giao diện kéo thả cho Field
};
export const pages: PluginAdminExports["pages"] = {
	"/editor": ChessEditorPage, // Trang công cụ để sinh chuỗi FEN/PGN
};
```

#### [NEW] `packages/plugins/chessfenpgn/src/components/ChessWidget.tsx`
Component React sử dụng `react-chessboard` và `chess.js` cho phép người dùng kéo thả quân cờ, tự động cập nhật và lưu chuỗi FEN/PGN vào CSDL của EmDash CMS.

### 3. Tích hợp vào Demo
#### [MODIFY] `demos/simple/package.json`
Thêm dependency `"@emdash-cms/plugin-chessfenpgn": "workspace:*"`.

#### [MODIFY] `demos/simple/astro.config.mjs`
Import và thêm `chessfenpgnPlugin()` vào mảng plugins.

## Verification Plan

### Manual Verification
1. Chạy dev server.
2. Mở `/admin/settings/plugins` để xem plugin đã kích hoạt.
3. Mở `/admin/_emdash/chessfenpgn/editor` (Trang công cụ Admin) để test tính năng kéo thả sinh mã.
4. Chèn Block `Chess (FEN)` vào nội dung bài viết và dán thử mã.
5. Tạo một Field Schema kiểu Text, gán Widget là `Bàn cờ kéo thả (FEN/PGN)`, mở trình soạn thảo bài viết để tận hưởng trải nghiệm kéo thả trực quan ngay trong CMS.
