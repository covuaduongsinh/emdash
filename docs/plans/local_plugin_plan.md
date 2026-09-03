# Kế hoạch Triển khai: Cài đặt Local Plugin (Plugin cục bộ) trong EmDash

## [Goal Description]
Bạn muốn tự phát triển một Plugin (tiện ích mở rộng) của riêng mình cho EmDash CMS và cài đặt nó trực tiếp vào dự án nội bộ mà không cần phải phát hành công khai lên Marketplace.

Trong EmDash, tính năng này hoàn toàn được hỗ trợ thông qua hệ thống **Local Plugins**. Bạn có thể viết mã nguồn plugin ngay trong thư mục mã nguồn của dự án (ví dụ `src/plugins/my-plugin/`) và đăng ký nó thông qua file cấu hình `astro.config.mjs`.

Kế hoạch dưới đây sẽ mô tả chi tiết cách tạo và cài đặt một Plugin cục bộ, từ việc tạo cấu trúc thư mục, viết mã nguồn cơ bản, cho đến cách đăng ký nó vào hệ thống lõi.

## User Review Required
> [!IMPORTANT]  
> Các plugin cục bộ (Local plugins) chạy trực tiếp trong cùng một phiên bản Node.js/Cloudflare Workers với lõi CMS (in-process) thay vì chạy trong môi trường cách ly (sandbox) như các plugin tải từ Marketplace. Vì vậy, code plugin của bạn sẽ có toàn quyền truy cập vào bộ nhớ và cơ sở dữ liệu.

## Open Questions
- Bạn muốn plugin cục bộ của mình phục vụ chức năng gì? (Ví dụ: Thêm một trường tùy chỉnh (Custom field) mới, thêm trang cấu hình Admin, hay lắng nghe các sự kiện Webhooks như `content:create`?).
- Bạn muốn tôi tạo sẵn cho bạn một Plugin mẫu cơ bản (ví dụ như Hello World in ra log khi có bài viết mới) để bạn lấy làm bộ khung (boilerplate) phát triển tiếp không?

## Proposed Changes

### 1. Tạo cấu trúc thư mục cho Local Plugin
Tạo một thư mục chứa mã nguồn plugin của bạn nằm bên trong thư mục `src` của dự án (ví dụ `demos/simple/src/plugins/my-custom-plugin`).

#### [NEW] `src/plugins/my-custom-plugin/index.ts`
Đây là file cốt lõi khai báo Plugin. File này cần xuất (export) ra 2 thành phần chính:
1. Hàm cài đặt trả về `PluginDescriptor` (Mô tả thông tin để EmDash nạp plugin).
2. Mã nguồn triển khai logic của plugin (sử dụng hàm `definePlugin`).

```typescript
import { definePlugin } from "emdash";

// 1. Hàm tạo Plugin Descriptor (Sử dụng trong astro.config.mjs)
export function myCustomPlugin() {
	return {
		id: "my-custom-plugin",
		version: "1.0.0",
		// Trỏ đến chính file này để Vite/Astro nạp mã khi build
		entrypoint: "./src/plugins/my-custom-plugin/index.ts", 
	};
}

// 2. Logic của Plugin
export function createPlugin() {
	return definePlugin({
		id: "my-custom-plugin",
		version: "1.0.0",
		hooks: {
			"plugin:activate": {
				handler: async (event, ctx) => {
					console.log("🚀 My Custom Plugin has been activated!");
				},
			},
			"content:create": {
				handler: async (event) => {
					console.log(`📝 Đã tạo nội dung mới: ${event.payload.slug}`);
				}
			}
		},
	});
}

// EmDash mong đợi hàm logic chính được export default
export default createPlugin;
```

---

### 2. Đăng ký Plugin vào cấu hình lõi của EmDash
Sửa đổi file cấu hình `astro.config.mjs` của dự án để nạp và kích hoạt Plugin vừa tạo.

#### [MODIFY] `astro.config.mjs`
```javascript
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";

// Import hàm khởi tạo từ file plugin cục bộ
import { myCustomPlugin } from "./src/plugins/my-custom-plugin/index.ts";

export default defineConfig({
	integrations: [
		emdash({
			database: /* ... */,
			storage: /* ... */,
			
			// Thêm plugin của bạn vào mảng plugins
			plugins: [
				myCustomPlugin(), // <--- Đăng ký plugin tại đây
			],
		}),
	],
});
```

## Verification Plan

### Automated Tests
Không áp dụng lệnh test tự động do đây là công việc cấu hình thủ công.

### Manual Verification
1. Sau khi chỉnh sửa, hệ thống dev server (`pnpm --filter emdash-demo dev`) sẽ tự động nạp lại (hot-reload).
2. Kiểm tra log của Terminal: Khi dự án khởi động thành công, hàm hook `"plugin:activate"` sẽ chạy và in ra dòng chữ `"🚀 My Custom Plugin has been activated!"`.
3. Quá trình cấu hình hoàn tất. Từ đó bạn có thể bổ sung tùy ý mã logic tương tác với admin UI hoặc hệ thống cơ sở dữ liệu.
