# 46. Chuyển đổi Plugin WordPress sang EmDash

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

Nhiều plugin WordPress chuyển đổi được sang EmDash. Mô hình plugin khác biệt — TypeScript thay vì PHP, hook thay vì action/filter, lưu trữ có cấu trúc thay vì `wp_options` — nhưng hầu hết chức năng ánh xạ được gọn gàng.

## Đánh giá khả năng chuyển đổi

Không phải plugin nào cũng nên chuyển. Đánh giá trước khi bắt đầu:

- **Ứng viên tốt:** custom field, plugin SEO, xử lý nội dung, mở rộng admin UI, analytics, chia sẻ mạng xã hội, form.
- **Ứng viên kém:** tính năng multisite, tích hợp WooCommerce/Gutenberg, plugin can thiệp sâu vào nội bộ WordPress core.

## So sánh cấu trúc Plugin

```
wp-content/plugins/my-plugin/       →       my-plugin/
├── my-plugin.php                          ├── src/
├── includes/                              │   ├── index.ts    # definePlugin
│   ├── class-admin.php                    │   └── admin.tsx   # Admin UI (React)
│   └── class-api.php                      ├── package.json
└── admin/js/                              └── tsconfig.json
```

## Ánh xạ Hook

WordPress dùng `add_action()`/`add_filter()` với tên hook dạng chuỗi. EmDash dùng hook có kiểu khai trong định nghĩa plugin.

**Hook vòng đời:**

| WordPress | EmDash | Ghi chú |
| --- | --- | --- |
| `register_activation_hook()` | `plugin:install` | Chạy một lần khi cài lần đầu |
| Plugin được bật | `plugin:activate` | Chạy khi bật |
| Plugin bị tắt | `plugin:deactivate` | Chạy khi tắt |
| `register_uninstall_hook()` | `plugin:uninstall` | `event.deleteData` cho biết lựa chọn của user |

**Hook nội dung:**

| WordPress | EmDash | Ghi chú |
| --- | --- | --- |
| `wp_insert_post_data` | `content:beforeSave` | Trả nội dung đã sửa hoặc throw để huỷ |
| `save_post` | `content:afterSave` | Side effect sau khi lưu |
| `before_delete_post` | `content:beforeDelete` | Trả `false` để huỷ |
| `deleted_post` | `content:afterDelete` | Dọn dẹp sau khi xoá |

Ví dụ — WordPress đánh dấu sản phẩm giá cao là "premium":

```php title="WordPress"
add_action('save_post', function($post_id, $post, $update) {
    if ($post->post_type !== 'product') return;
    $price = get_post_meta($post_id, 'price', true);
    if ($price > 1000) {
        update_post_meta($post_id, 'is_premium', true);
    }
}, 10, 3);
```

```typescript title="EmDash"
hooks: {
    "content:afterSave": async (event, ctx) => {
        if (event.collection !== "products") return;
        const price = event.content.price as number;
        if (price > 1000) {
            await ctx.kv.set(`premium:${event.content.id}`, true);
        }
    },
}
```

**Hook media:**

| WordPress | EmDash | Ghi chú |
| --- | --- | --- |
| `wp_handle_upload_prefilter` | `media:beforeUpload` | Validate hoặc biến đổi |
| `add_attachment` | `media:afterUpload` | Phản ứng sau khi upload |

(Bảng đầy đủ hook và chi tiết từng loại đã có ở [Chương 37](./37-hooks-vong-doi.md).)

## Ánh xạ lưu trữ

**Options API → KV Store:**

```php title="WordPress"
$api_key = get_option('my_plugin_api_key', '');
update_option('my_plugin_api_key', 'abc123');
delete_option('my_plugin_api_key');
```

```typescript title="EmDash"
const apiKey = await ctx.kv.get<string>("settings:apiKey") ?? "";
await ctx.kv.set("settings:apiKey", "abc123");
await ctx.kv.delete("settings:apiKey");
```

> Dùng tiền tố `settings:` cho giá trị user tự cấu hình, `state:` cho trạng thái nội bộ plugin.

**Custom Table → Storage Collection:**

```php title="WordPress"
global $wpdb;
$table = $wpdb->prefix . 'my_plugin_items';
$wpdb->insert($table, ['name' => 'Item 1', 'status' => 'active']);
$items = $wpdb->get_results("SELECT * FROM $table WHERE status = 'active' LIMIT 10");
```

```typescript title="EmDash"
// Khai trong định nghĩa plugin
storage: {
    items: { indexes: ["status", "createdAt"] },
},

// Trong hook hoặc route:
await ctx.storage.items.put("item-1", {
    name: "Item 1", status: "active", createdAt: new Date().toISOString(),
});

const result = await ctx.storage.items.query({ where: { status: "active" }, limit: 10 });
```

(Chi tiết đầy đủ API storage ở [Chương 42](./42-luu-tru-cli-plugin.md).)

## Schema Settings

WordPress dùng Settings API cho form admin. EmDash dùng schema khai báo tự sinh UI:

```php title="WordPress"
add_action('admin_init', function() {
    register_setting('my_plugin', 'my_plugin_api_key');
    add_settings_section('main', 'Settings', null, 'my-plugin');
    add_settings_field('api_key', 'API Key', function() {
        $value = get_option('my_plugin_api_key');
        echo '<input type="text" name="my_plugin_api_key" value="' . esc_attr($value) . '">';
    }, 'my-plugin', 'main');
});
```

```typescript title="EmDash"
admin: {
    settingsSchema: {
        apiKey: { type: "secret", label: "API Key", description: "Your API key from the dashboard" },
        enabled: { type: "boolean", label: "Enabled", default: true },
        limit: { type: "number", label: "Item Limit", default: 100, min: 1, max: 1000 },
    },
}
```

## Admin UI

Trang admin WordPress là PHP; EmDash dùng component React:

```tsx title="src/admin.tsx"
import { useState, useEffect } from "react";

export const widgets = {
	summary: function SummaryWidget() {
		const [count, setCount] = useState(0);
		useEffect(() => {
			fetch("/_emdash/api/plugins/my-plugin/status")
				.then((r) => r.json())
				.then((data) => setCount(data.count));
		}, []);
		return <div>Total items: {count}</div>;
	},
};

export const pages = {
	settings: function SettingsPage() {
		return <div>Settings content</div>;
	},
};
```

Đăng ký trong định nghĩa plugin:

```typescript title="src/index.ts"
admin: {
    entry: "@my-org/my-plugin/admin",
    pages: [{ path: "/settings", label: "Dashboard" }],
    widgets: [{ id: "summary", title: "Summary", size: "half" }],
},
```

(Chi tiết đầy đủ ở [Chương 44](./44-plugin-native.md).)

## REST API → Route Plugin

```php title="WordPress"
register_rest_route('my-plugin/v1', '/items', [
    'methods' => 'GET',
    'callback' => function($request) {
        global $wpdb;
        $items = $wpdb->get_results("SELECT * FROM items LIMIT 50");
        return new WP_REST_Response($items);
    },
]);
```

```typescript title="EmDash"
routes: {
    items: {
        handler: async (ctx) => {
            const result = await ctx.storage.items.query({ limit: 50 });
            return { items: result.items };
        },
    },
},
```

Route khả dụng tại `/_emdash/api/plugins/{plugin-id}/{route-name}` (chi tiết đầy đủ ở [Chương 40](./40-api-routes-capabilities.md)).

## Quy trình chuyển đổi

1. **Phân tích plugin WordPress** — ghi lại nó làm gì: hook, thao tác database, trang admin, endpoint REST.
2. **Ánh xạ sang khái niệm EmDash** — hook WordPress → hook EmDash; `wp_options` → `ctx.kv`; bảng tuỳ chỉnh → Storage collection; trang admin → component React; endpoint REST → route plugin.
3. **Tạo khung plugin:**
   ```typescript title="src/index.ts"
   import { definePlugin } from "emdash";

   export function createPlugin() {
   	return definePlugin({
   		id: "my-ported-plugin",
   		version: "1.0.0",
   		capabilities: [],
   		storage: {},
   		hooks: {},
   		routes: {},
   		admin: {},
   	});
   }
   ```
4. **Cài đặt theo thứ tự:** Storage → Hooks → Admin UI → Routes.
5. **Test kỹ lưỡng** — xác nhận hook kích hoạt đúng, storage hoạt động, admin UI render đúng.

## Ví dụ: Plugin tính thời gian đọc

```php title="WordPress"
add_filter('wp_insert_post_data', function($data, $postarr) {
    if ($data['post_type'] !== 'post') return $data;
    $content = strip_tags($data['post_content']);
    $word_count = str_word_count($content);
    $read_time = ceil($word_count / 200);
    if (!empty($postarr['ID'])) {
        update_post_meta($postarr['ID'], '_read_time', $read_time);
    }
    return $data;
}, 10, 2);
```

```typescript title="EmDash — src/index.ts"
export function createPlugin() {
    return definePlugin({
        id: "read-time",
        version: "1.0.0",
        admin: {
            settingsSchema: {
                wordsPerMinute: { type: "number", label: "Words per minute", default: 200, min: 100, max: 400 },
            },
        },
        hooks: {
            "content:beforeSave": async (event, ctx) => {
                if (event.collection !== "posts") return;
                const wpm = await ctx.kv.get<number>("settings:wordsPerMinute") ?? 200;
                const text = JSON.stringify(event.content.body || "");
                const readTime = Math.ceil(text.split(/\s+/).length / wpm);
                return { ...event.content, readTime };
            },
        },
    });
}
```

> **Hỗ trợ bằng AI:** chuyển đổi plugin phức tạp hơn chuyển đổi theme. Cung cấp code plugin WordPress cùng tài liệu Plugin API của EmDash để AI sinh bản nháp đầu tiên — plugin phức tạp có thể cần vài lần lặp lại.

## Capability

Plugin phải khai capability cần thiết cho cách ly bảo mật:

| Capability | Cung cấp | Trường hợp dùng |
| --- | --- | --- |
| `network:request` | `ctx.http.fetch()` | Gọi API ngoài |
| `content:read` | `ctx.content.get()`, `.list()` | Đọc nội dung CMS |
| `content:write` | `ctx.content.create()`, v.v. | Sửa nội dung |
| `media:read` | `ctx.media.get()`, `.list()` | Đọc media |
| `media:write` | `ctx.media.getUploadUrl()` | Upload media |

(Bảng capability đầy đủ ở [Chương 40](./40-api-routes-capabilities.md).)

## Cạm bẫy thường gặp

- **Không có global state** — dùng storage thay vì biến toàn cục.
- **Mọi thứ đều bất đồng bộ** — luôn `await` lệnh gọi storage và API.
- **Không SQL trực tiếp** — dùng storage collection có cấu trúc.
- **Không có filesystem** — dùng Media API cho tệp.

## Xem thêm

- [Chương 23 — Di chuyển từ WordPress](./23-di-chuyen-tu-wordpress.md)
- [Chương 37 — Hooks & vòng đời sự kiện](./37-hooks-vong-doi.md)
- [Chương 39 — Viết Plugin đầu tiên (sandboxed)](./39-viet-plugin-dau-tien.md)
- [Chương 40 — API Routes & Capabilities của Plugin](./40-api-routes-capabilities.md)
- [Chương 42 — Lưu trữ dữ liệu Plugin & CLI plugin](./42-luu-tru-cli-plugin.md)
- [Chương 44 — Plugin Native (nâng cao)](./44-plugin-native.md)
