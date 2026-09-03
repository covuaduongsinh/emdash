# 37. Hooks & vòng đời sự kiện

Áp dụng cho vai trò: Lập trình viên (viết plugin)

## Tổng quan

Hook cho phép plugin can thiệp và sửa hành vi EmDash tại các điểm cụ thể trong vòng đời nội dung, media, email, bình luận, và trang.

## Bảng tổng quan Hook

| Hook | Kích hoạt khi | Có thể sửa | Độc quyền |
| --- | --- | --- | --- |
| `content:beforeSave` | Trước khi lưu nội dung | Dữ liệu nội dung | Không |
| `content:afterSave` | Sau khi lưu nội dung | Không | Không |
| `content:beforeDelete` | Trước khi xoá nội dung | Có thể huỷ | Không |
| `content:afterDelete` | Sau khi xoá nội dung | Không | Không |
| `content:afterPublish` | Sau khi xuất bản nội dung | Không | Không |
| `content:afterUnpublish` | Sau khi gỡ xuất bản | Không | Không |
| `content:afterRestore` | Sau khi khôi phục nội dung | Không | Không |
| `content:afterSchedule` | Sau khi lên lịch nội dung | Không | Không |
| `content:afterUnschedule` | Sau khi huỷ lịch | Không | Không |
| `media:beforeUpload` | Trước khi upload tệp | Metadata tệp | Không |
| `media:afterUpload` | Sau khi upload tệp | Không | Không |
| `cron` | Tác vụ theo lịch kích hoạt | Không | Không |
| `email:beforeSend` | Trước khi gửi email | Message, có thể huỷ | Không |
| `email:deliver` | Gửi email qua transport | Không | Có |
| `email:afterSend` | Sau khi gửi email thành công | Không | Không |
| `comment:beforeCreate` | Trước khi lưu bình luận | Comment, có thể huỷ | Không |
| `comment:moderate` | Quyết định trạng thái duyệt bình luận | Status | Có |
| `comment:afterCreate` | Sau khi lưu bình luận | Không | Không |
| `comment:afterModerate` | Sau khi admin đổi trạng thái bình luận | Không | Không |
| `page:metadata` | Render head trang công khai | Đóng góp thẻ | Không |
| `page:fragments` | Render body trang công khai | Chèn script | Không |
| `plugin:install` | Khi plugin cài lần đầu | Không | Không |
| `plugin:activate` | Khi plugin được bật | Không | Không |
| `plugin:deactivate` | Khi plugin bị tắt | Không | Không |
| `plugin:uninstall` | Khi plugin bị gỡ | Không | Không |

## Hook Nội dung

### `content:beforeSave`

Chạy trước khi nội dung được lưu vào database. Dùng để validate, biến đổi, hoặc bổ sung nội dung. Để từ chối lưu, throw `ContentSaveRejectedError` (export từ `emdash`) — API trả lỗi `SAVE_REJECTED` kèm message, admin hiển thị cho editor. Lỗi throw khác cũng huỷ lưu nhưng response thay message bằng thông báo chung. Plugin chạy trong sandbox **không thể** từ chối lưu — sandbox log lỗi throw và việc lưu vẫn tiếp tục.

```ts
import { definePlugin } from "emdash";

export default definePlugin({
	id: "my-plugin",
	version: "1.0.0",
	hooks: {
		"content:beforeSave": async (event, ctx) => {
			const { content, collection, isNew } = event;
			if (isNew) {
				content.createdBy = "system";
			}
			content.modifiedAt = new Date().toISOString();
			return content;
		},
	},
});
```

**Event:** `{ content: Record<string, unknown>, collection: string, isNew: boolean }`. **Trả về:** object nội dung đã sửa để áp dụng thay đổi, hoặc `void` để giữ nguyên.

### `content:afterSave`

Chạy sau khi nội dung được lưu. Dùng cho side effect như thông báo, vô hiệu hoá cache, hoặc đồng bộ ngoài — không cần trả về giá trị.

```ts
hooks: {
  "content:afterSave": async (event, ctx) => {
    const { content, collection, isNew } = event;
    if (collection === "posts" && content.status === "published") {
      await ctx.http?.fetch("https://api.example.com/notify", {
        method: "POST",
        body: JSON.stringify({ postId: content.id }),
      });
    }
  },
}
```

### `content:beforeDelete`

Chạy trước khi xoá nội dung — dùng để validate hoặc ngăn xoá.

```ts
hooks: {
  "content:beforeDelete": async (event, ctx) => {
    const { id, collection } = event;
    const item = await ctx.content?.get(collection, id);
    if (item?.data.protected) {
      return false; // Huỷ xoá
    }
    return true;
  },
}
```

**Event:** `{ id: string, collection: string }`. **Trả về:** `false` để huỷ xoá, `true`/`void` để cho phép.

### `content:afterDelete`

Chạy sau khi xoá nội dung — dùng cho tác vụ dọn dẹp.

### `content:afterRestore` / `content:afterSchedule` / `content:afterUnschedule`

Chạy sau khi khôi phục/lên lịch/huỷ lịch nội dung tương ứng — cần capability `content:read`. Event: `{ content: Record<string, unknown>, collection: string }`. Không cần trả về giá trị.

```ts
hooks: {
  "content:afterRestore": async (event, ctx) => {
    ctx.log.info(`Restored ${event.collection}/${event.content.id}`);
  },
}
```

## Hook Media

### `media:beforeUpload`

Chạy trước khi upload tệp — dùng để validate, đổi tên, hoặc từ chối tệp.

```ts
hooks: {
  "media:beforeUpload": async (event, ctx) => {
    const { file } = event;
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File too large");
    }
    return {
      name: `${Date.now()}-${file.name}`,
      type: file.type,
      size: file.size,
    };
  },
}
```

**Event:** `{ file: { name, type, size } }`. **Trả về:** metadata tệp đã sửa, `void` để giữ nguyên, hoặc throw để từ chối upload.

### `media:afterUpload`

Chạy sau khi tệp đã upload — dùng cho xử lý, tạo thumbnail, hoặc trích metadata.

```ts
hooks: {
  "media:afterUpload": async (event, ctx) => {
    const { media } = event;
    if (media.mimeType.startsWith("image/")) {
      await ctx.kv.set(`media:${media.id}:analyzed`, { processedAt: new Date().toISOString() });
    }
  },
}
```

## Hook vòng đời Plugin

`plugin:install` (cài lần đầu — dùng để thiết lập ban đầu, tạo storage collection, seed dữ liệu), `plugin:activate` (bật), `plugin:deactivate` (tắt), `plugin:uninstall` (gỡ — event `{ deleteData: boolean }`, người dùng chọn có xoá dữ liệu hay không).

```ts
hooks: {
  "plugin:install": async (event, ctx) => {
    await ctx.kv.set("settings:enabled", true);
    ctx.log.info("Plugin installed successfully");
  },
  "plugin:uninstall": async (event, ctx) => {
    if (event.deleteData) {
      const items = await ctx.kv.list("settings:");
      for (const { key } of items) await ctx.kv.delete(key);
    }
  },
}
```

## Hook Cron

### `cron`

Kích hoạt khi một tác vụ theo lịch chạy. Lên lịch tác vụ bằng `ctx.cron.schedule()`.

```ts
hooks: {
  "cron": async (event, ctx) => {
    if (event.name === "daily-sync") {
      const data = await ctx.http?.fetch("https://api.example.com/data");
      ctx.log.info("Sync complete");
    }
  },
}
```

**Event:** `{ name: string, data?: Record<string, unknown>, scheduledAt: string }`.

## Hook Email

Chạy theo thứ tự: `email:beforeSend` → `email:deliver` → `email:afterSend`.

**`email:beforeSend`** (capability `hooks.email-events:register`) — middleware chạy trước khi gửi, biến đổi message hoặc huỷ gửi:

```ts
hooks: {
  "email:beforeSend": async (event, ctx) => {
    return { ...event.message, text: event.message.text + "\n\n—Sent from My Site" };
    // hoặc return false để huỷ gửi
  },
}
```

**`email:deliver`** (capability `hooks.email-transport:register`, **độc quyền**) — provider transport thật sự, chỉ một plugin được gửi email:

```ts
hooks: {
  "email:deliver": {
    exclusive: true,
    handler: async (event, ctx) => { await sendViaSES(event.message); },
  },
}
```

**`email:afterSend`** (capability `hooks.email-events:register`) — hook "gửi rồi thôi" (fire-and-forget) sau khi gửi thành công; lỗi được log nhưng không lan truyền.

## Hook Bình luận

Chạy theo thứ tự: `comment:beforeCreate` → `comment:moderate` → `comment:afterCreate`. `comment:afterModerate` kích hoạt riêng khi admin đổi trạng thái bình luận.

**`comment:beforeCreate`** (capability `users:read`) — middleware trước khi lưu bình luận, bổ sung/validate/từ chối:

```ts
hooks: {
  "comment:beforeCreate": async (event, ctx) => {
    if (event.comment.body.includes("http")) return false;
  },
}
```

Event: `{ comment: { collection, contentId, parentId, authorName, authorEmail, authorUserId, body, ipHash, userAgent }, metadata }`. Trả về: event đã sửa, `false` để từ chối, hoặc `void`.

**`comment:moderate`** (capability `users:read`, **độc quyền**) — quyết định bình luận được duyệt/chờ/spam, chỉ một provider kiểm duyệt hoạt động:

```ts
hooks: {
  "comment:moderate": {
    exclusive: true,
    handler: async (event, ctx) => {
      const score = await checkSpam(event.comment);
      return {
        status: score > 0.8 ? "spam" : score > 0.5 ? "pending" : "approved",
        reason: `Spam score: ${score}`,
      };
    },
  },
}
```

Event bổ sung: `collectionSettings` (`commentsEnabled`, `commentsModeration`, `commentsClosedAfterDays`, `commentsAutoApproveUsers`), `priorApprovedCount`. Trả về: `{ status: "approved" | "pending" | "spam", reason? }`.

**`comment:afterCreate`** (capability `users:read`) — hook fire-and-forget sau khi lưu, dùng cho thông báo. **`comment:afterModerate`** (capability `users:read`) — fire-and-forget khi admin đổi trạng thái thủ công, event gồm `previousStatus`, `newStatus`, `moderator`.

## Hook Trang (Page)

Chạy khi render trang công khai — cho phép plugin chèn metadata và script.

### `page:metadata`

Không cần capability. Đóng góp thẻ meta, thuộc tính Open Graph, dữ liệu có cấu trúc JSON-LD, hoặc thẻ link vào head trang:

```ts
hooks: {
  "page:metadata": async (event, ctx) => {
    return [
      { kind: "meta", name: "generator", content: "EmDash" },
      { kind: "property", property: "og:site_name", content: event.page.siteName },
      { kind: "jsonld", graph: { "@type": "WebSite", name: event.page.siteName } },
    ];
  },
}
```

4 loại đóng góp: `meta` (`name`, `content`, `key?`), `property` (Open Graph, `property`, `content`, `key?`), `link` (`rel`, `href`, `hreflang?`, `key?`), `jsonld` (`id?`, `graph`). Field `key` khử trùng lặp — chỉ đóng góp cuối cùng với cùng `key` được dùng.

### `page:fragments`

Cần capability `hooks.page-fragments:register` — **chỉ khả dụng cho plugin native** (không dùng được với plugin sandboxed). Chèn script hoặc HTML vào trang:

```ts
hooks: {
  "page:fragments": async (event, ctx) => {
    return [
      { kind: "external-script", placement: "body:end", src: "https://analytics.example.com/script.js", async: true },
      { kind: "inline-script", placement: "head", code: `window.siteId = "abc123";` },
    ];
  },
}
```

3 loại đóng góp: `external-script` (`placement`, `src`, `async?`, `defer?`, `attributes?`, `key?`), `inline-script` (`placement`, `code`, `attributes?`, `key?`), `html` (`placement`, `html`, `key?`). `placement` là `"head"`, `"body:start"`, hoặc `"body:end"`.

## Cấu hình Hook

Hook chấp nhận một hàm handler đơn giản, hoặc một object cấu hình:

```ts
hooks: {
  // Handler đơn giản
  "content:afterSave": async (event, ctx) => { ... },

  // Có cấu hình
  "content:beforeSave": {
    priority: 50,        // Số nhỏ hơn chạy trước (mặc định: 100)
    timeout: 10000,      // Thời gian chạy tối đa (ms, mặc định: 5000)
    dependencies: [],    // Chạy sau các plugin này
    errorPolicy: "abort", // "continue" hoặc "abort" (mặc định)
    handler: async (event, ctx) => { ... },
  },
}
```

| Tuỳ chọn | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `priority` | `number` | `100` | Thứ tự chạy (nhỏ hơn = trước) |
| `timeout` | `number` | `5000` | Thời gian chạy tối đa (ms) |
| `dependencies` | `string[]` | `[]` | ID plugin phải chạy trước |
| `errorPolicy` | `string` | `"abort"` | `"continue"` để bỏ qua lỗi |
| `exclusive` | `boolean` | `false` | Chỉ một plugin được làm provider hoạt động (cho hook kiểu provider như `email:deliver`, `comment:moderate`) |

## Ngữ cảnh Plugin (Plugin Context)

Mọi hook nhận một object context truy cập được API plugin:

```ts
interface PluginContext {
	plugin: { id: string; version: string };
	storage: PluginStorage;
	kv: KVAccess;
	content?: ContentAccess;
	media?: MediaAccess;
	http?: HttpAccess;
	log: LogAccess;
	site: { name: string; url: string; locale: string };
	url(path: string): string;
	users?: UserAccess;
	cron?: CronAccess;
	email?: EmailAccess;
}
```

> API context bị giới hạn bởi capability của plugin — khai báo capability cần thiết trong định nghĩa plugin (xem [Chương 39](./39-viet-plugin-dau-tien.md), [Chương 40](./40-api-routes-capabilities.md)).

## Xử lý lỗi

Lỗi trong hook được log và xử lý theo `errorPolicy`: `"abort"` (mặc định) — dừng thực thi, rollback transaction nếu có; `"continue"` — log lỗi và tiếp tục hook tiếp theo.

```ts
hooks: {
  "content:beforeSave": {
    errorPolicy: "continue",
    handler: async (event, ctx) => {
      try {
        await ctx.http?.fetch("https://api.example.com/validate");
      } catch (error) {
        ctx.log.warn("Validation service unavailable", error);
      }
    },
  },
}
```

## Thứ tự thực thi

Hook chạy theo thứ tự: (1) sắp theo `priority` tăng dần; (2) plugin có `dependencies` chạy sau các plugin phụ thuộc; (3) cùng priority thì thứ tự xác định nhưng không quy định cụ thể.

## Xem thêm

- [Chương 20 — Cài đặt & Quản lý Plugin (người dùng cuối)](./20-cai-dat-plugin.md)
- [Chương 39 — Viết Plugin đầu tiên (sandboxed)](./39-viet-plugin-dau-tien.md)
- [Chương 40 — API Routes & Capabilities của Plugin](./40-api-routes-capabilities.md)
- [Chương 44 — Plugin Native (nâng cao)](./44-plugin-native.md)
- [Chương 45 — Plugin Native: Page Fragments & Portable Text Components](./45-page-fragments-portable-text.md)
