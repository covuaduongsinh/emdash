# 40. API Routes & Capabilities của Plugin

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

Chương này trình bày hai chủ đề cốt lõi khi viết plugin sandboxed: **API Routes** (expose endpoint REST cho admin UI và tích hợp ngoài) và **Capabilities** (khai báo plugin cần gì, sandbox thực thi ra sao). Phần cuối tóm tắt cách hook hoạt động trong ngữ cảnh plugin sandboxed cụ thể (chi tiết đầy đủ từng hook đã có ở [Chương 37](./37-hooks-vong-doi.md)).

## API Routes

Plugin expose route API cho admin UI và tích hợp ngoài. Route mount dưới `/_emdash/api/plugins/<slug>/<route-name>` (`<slug>` là field `slug` trong `emdash-plugin.jsonc`, lộ ra lúc runtime dưới dạng `ctx.plugin.id`), chạy trong sandbox runtime với cùng `PluginContext` mà hook nhận được.

### Định nghĩa route

Khai route trong default export của `src/plugin.ts`:

```typescript title="src/plugin.ts"
import type { SandboxedPlugin } from "emdash/plugin";
import { z } from "astro/zod";

export default {
	routes: {
		status: {
			handler: async (_routeCtx, ctx) => {
				return { ok: true, plugin: ctx.plugin.id };
			},
		},

		submissions: {
			input: z.object({
				formId: z.string().optional(),
				limit: z.number().default(50),
				cursor: z.string().optional(),
			}),
			handler: async (routeCtx, ctx) => {
				const { formId, limit, cursor } = routeCtx.input;

				const result = await ctx.storage.submissions.query({
					where: formId ? { formId } : undefined,
					orderBy: { createdAt: "desc" },
					limit,
					cursor,
				});

				return result;
			},
		},
	},
} satisfies SandboxedPlugin;
```

`satisfies SandboxedPlugin` suy luận `routeCtx` và `ctx` — không cần chú thích tham số. Handler route sandboxed nhận **2 tham số**: `(routeCtx, ctx)` — `routeCtx` mang dữ liệu dạng request (`{ input, request, requestMeta }`); `ctx` là `PluginContext` giống hệt bên trong hook.

### Lọc field nội dung đã index

Plugin có capability `content:read` lọc được field tuỳ chỉnh mà Collection đánh dấu `indexed`. Bộ lọc chạy trong database, kết hợp bằng logic `AND`:

```typescript
const result = await ctx.content.list("items", {
	where: {
		fieldFilters: {
			priority: { in: ["urgent", "high"] },
			score: { gte: 80 },
			resolved: false,
		},
	},
});
```

Giá trị vô hướng khớp chính xác. Dùng `null` để khớp null, `{ in: [...] }` cho tập giá trị chính xác, hoặc `gt`/`gte`/`lt`/`lte` cho so sánh khoảng. EmDash từ chối lọc field chưa index, giá trị không khớp kiểu field, và hơn 20 field filter mỗi truy vấn (`in` tối đa 50 giá trị; tổng ngân sách toán hạng cho giá trị chính xác + biên khoảng + thành viên `in` là 50 mỗi truy vấn; khớp null không tính vào ngân sách).

### URL Route

Route mount tại `/_emdash/api/plugins/<slug>/<route-name>` — tên route có thể chứa `/` cho đường dẫn lồng nhau. Vd plugin `forms` với route `status` → `/_emdash/api/plugins/forms/status`; route `settings/save` → `/_emdash/api/plugins/seo/settings/save`.

> `slug` của plugin phải khớp `/^[a-z][a-z0-9_-]*$/` — bắt đầu chữ thường, sau đó chữ/số/gạch nối/gạch dưới. Slug lấp một path segment Astro duy nhất, nên bất cứ gì ngoài mẫu này (tên có scope, số ở đầu, dấu chấm, dấu gạch chéo) sẽ không route được và cũng bị từ chối khi khởi tạo storage index.

### Xác thực và CSRF

**Route plugin được xác thực theo mặc định.** Dispatcher yêu cầu session (hoặc token có scope `admin`) trước khi gọi handler. Route riêng tư (private) mặc định dùng permission `plugins:manage` để tương thích ngược — đặt `permission` hẹp hơn khi thao tác thuộc về một capability RBAC có sẵn (content/media/schema/settings):

```typescript
routes: {
	create: {
		permission: "content:create",
		input: z.object({ title: z.string() }),
		handler: async (routeCtx, ctx) => { /* ... */ },
	},
},
```

Route riêng tư cần header CSRF `X-EmDash-Request: 1` cho request xác thực bằng cookie (admin UI tự gửi; request bằng token được miễn).

Để route bỏ qua xác thực và CSRF, đánh dấu `public: true`:

```typescript
routes: {
	track: {
		public: true,
		input: z.object({ event: z.string() }),
		handler: async (routeCtx, ctx) => {
			ctx.log.info("Tracked", { event: routeCtx.input.event });
			return { ok: true };
		},
	},
},
```

> Route public bỏ qua hoàn toàn xác thực, scope, và CSRF — ai trên internet cũng gọi được. Chỉ dùng `public: true` cho endpoint thật sự cần nhận traffic ngoài (webhook, endpoint tìm kiếm công khai) và validate input cẩn thận.

**Người gọi đã xác thực:** trên route riêng tư, `routeCtx.user` là user đã xác thực gọi request — đã resolve và cấp quyền trước khi handler chạy, dùng được cho logic theo-từng-user (API key riêng, kết nối OAuth, tuỳ chọn plugin quản lý):

```typescript
routes: {
	"connect/start": {
		handler: async (routeCtx, ctx) => {
			// Không bao giờ đọc user thực hiện từ request body — bất kỳ session
			// đã xác thực nào cũng có thể giả mạo user khác theo cách đó.
			const caller = routeCtx.user;
			if (!caller) throw new Error("No caller bound");
			await ctx.kv.set(`user:${caller.id}:connection`, { startedAt: Date.now() });
			return { userId: caller.id };
		},
	},
},
```

`routeCtx.user` là `undefined` trên route public và với request xác thực bằng token không gắn với user (machine token). Hình dạng khớp `UserInfo` mà `ctx.users` trả về: `{ id, email, name, role, createdAt }` — không có field nhạy cảm.

**Cache response public:** response API mặc định `Cache-Control: private, no-store`. Route public phục vụ cùng dữ liệu cho mọi người có thể opt-in cache CDN/trình duyệt bằng `cacheControl`:

```typescript
routes: {
	catalog: {
		public: true,
		cacheControl: "public, max-age=60, stale-while-revalidate=300",
		handler: async (ctx) => listProducts(ctx),
	},
},
```

Header chỉ áp dụng cho **response GET thành công của route public** — lỗi không bao giờ cache, method khác giữ mặc định, đặt `cacheControl` trên route riêng tư không có tác dụng.

### Expose Route thành MCP tool

Plugin có thể expose tường minh một số route riêng tư qua MCP server (xem lại [Chương 38](./38-mcp-server.md)) — MCP exposure **không bao giờ** tự suy luận từ danh sách route:

```typescript
const createEventInput = z.object({
	title: z.string().min(1),
	startsAt: z.string().datetime(),
});

export default {
	routes: {
		"events/create": {
			permission: "content:create",
			input: createEventInput,
			handler: async (routeCtx, ctx) => {
				return { id: await createEvent(routeCtx.input, ctx) };
			},
		},
	},
	mcp: {
		tools: {
			createEvent: {
				description: "Create a calendar event when the user asks to add one.",
				route: "events/create",
				input: createEventInput,
				output: z.object({ id: z.string() }),
				destructive: false,
			},
		},
	},
} satisfies SandboxedPlugin;
```

EmDash expose tool này dưới tên `<pluginId>__createEvent`. Route tham chiếu phải là private và khai `permission`. Schema input bắt buộc; schema output tuỳ chọn. Đặt `destructive: true` cho tool xoá/ghi đè/publish/tính phí hoặc thao tác khó hoàn tác. Admin phải tự bật MCP tool của plugin sau khi xem lại tên/mô tả/route/permission/cờ destructive — gọi tool cần cả permission route lẫn scope `mcp:tools` hoặc `mcp:tools:<pluginId>`.

### Validate Input

`input` nhận một schema Zod. Dispatcher parse body request (POST/PUT/PATCH) hoặc query string URL (GET/HEAD/DELETE), validate, rồi truyền kết quả có kiểu vào handler dưới dạng `routeCtx.input`. Input sai trả `400` trước khi handler chạy.

Với method không có body, input lấy từ query string — key lặp lại thành mảng (`?tag=a&tag=b` → `{ tag: ["a", "b"] }`), key đơn giữ nguyên vô hướng. Mọi giá trị query là **chuỗi** — dùng `z.coerce` cho field không phải chuỗi:

```typescript
routes: {
	list: {
		// GET /_emdash/api/plugins/<slug>/list?status=open&limit=20&tag=a&tag=b
		input: z.object({
			status: z.enum(["open", "closed"]).optional(),
			limit: z.coerce.number().int().max(100).default(20),
			tag: z.array(z.string()).optional(),
		}),
		handler: async (routeCtx, ctx) => { /* ... */ },
	},
},
```

### Giá trị trả về và Lỗi

Trả về bất kỳ giá trị serialize-JSON được nào — dispatcher tự bọc trong khuôn chuẩn của EmDash (`{ success: true, data: <giá trị của bạn> }`), phục vụ dạng `application/json`.

Throw để trả response lỗi — bất cứ gì không phải lỗi plugin đã biết trả về message chung (exception nội bộ bị che, không lộ stack trace/lỗi database). Để có status code cụ thể, throw một `Response`:

```typescript
handler: async (routeCtx, ctx) => {
	const item = await ctx.storage.items.get(routeCtx.input.id);
	if (!item) {
		throw new Response(JSON.stringify({ error: "Not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}
	return item;
},
```

### Truy cập Request

`routeCtx.request` là **`SandboxedRequest`**: bản ghi portable `{ url, method, headers }` hoạt động giống hệt in-process và trong isolate. `headers` là `Record<string, string>` với key viết thường — truy cập bằng tên viết thường, hoặc duyệt qua `Object.entries`. `routeCtx.requestMeta` mang IP, user agent, và dữ liệu geo đã chuẩn hoá xuyên nền tảng (khi có).

### Mẫu thường gặp

**Cài đặt qua KV** — plugin sandboxed đọc/ghi cài đặt qua kho KV, quy ước tiền tố `settings:`. Form `settingsSchema` tự sinh chỉ dành cho native — plugin sandboxed expose đọc/ghi qua route rồi render form bằng Block Kit (xem [Chương 41](./41-block-kit-field-kit.md)).

**Danh sách phân trang** — trả phân trang kiểu cursor từ truy vấn storage, khớp hình dạng phần còn lại của EmDash dùng (`items`, `cursor`, `hasMore`).

**Proxy API ngoài** — proxy request qua `ctx.http` (cần capability `network:request` và một entry trong `allowedHosts`).

### Gọi route từ admin UI

Dùng `usePluginAPI()` từ gói admin — tự thêm header CSRF `X-EmDash-Request` và tiền tố plugin id:

```typescript
import { usePluginAPI } from "@emdash-cms/admin";

function SettingsPage() {
	const api = usePluginAPI();
	const handleSave = async (settings) => { await api.post("settings/save", settings); };
	const loadSettings = async () => { return api.get("settings"); };
}
```

### Gọi route từ queue/scheduled handler

Handler sự kiện nền tảng (Cloudflare Queue consumer, handler `scheduled()` tuỳ chỉnh) không có HTTP request nên không có `locals.emdash`. Dùng `withEmDashRuntime()` từ `emdash/middleware` để lấy runtime trực tiếp và gọi route plugin không cần request:

```typescript title="src/worker.ts"
import { withEmDashRuntime } from "emdash/middleware";

export default {
	async queue(batch: MessageBatch) {
		await withEmDashRuntime(async (runtime) => {
			for (const message of batch.messages) {
				const result = await runtime.handlePluginApiRoute(
					"my-plugin", "POST", "/finishJob",
					new Request("https://internal/", { method: "POST", body: JSON.stringify(message.body) }),
				);
				if (result.success) message.ack(); else message.retry();
			}
		});
	},
};
```

> `withEmDashRuntime()` chỉ dùng phía server và **hoàn toàn tin cậy** — callback nhận runtime thô, không kiểm tra auth/CSRF (cùng mức tin cậy như plugin cron). Validate mọi input ngoài (kể cả nội dung message queue) trước khi truyền vào route plugin.

### Gọi route từ ngoài

Route public gọi trực tiếp bằng `curl`; route riêng tư cần session hoặc API token có scope `admin`:

```bash
curl -X POST https://your-site.com/_emdash/api/plugins/forms/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Hello", "email": "user@example.com"}'
```

## Capabilities

Plugin sandboxed bị cách ly theo mặc định. Để làm bất cứ gì ngoài đọc/ghi KV và storage của chính nó, plugin phải **khai capability** trong manifest. Sandbox bridge kiểm soát mọi API host-provided dựa trên khai báo đó — plugin không khai `content:read` không có `ctx.content`; không khai `network:request` không có `ctx.http`.

### Khai báo Capability

```jsonc title="emdash-plugin.jsonc"
{
	"slug": "plugin-hello",
	"capabilities": ["content:read", "network:request"],
	"allowedHosts": ["api.example.com"]
}
```

Chỉ khai đúng những gì plugin thực sự cần — khai báo capability cũng là thứ marketplace hiện cho vận hành viên trên hộp thoại đồng ý; capability thừa gây ma sát lúc cài và là dấu hiệu cảnh báo khi kiểm toán.

### Tham chiếu Capability

| Capability | Cấp quyền truy cập |
| --- | --- |
| `content:read` | `ctx.content.get()`, `ctx.content.list()` |
| `content:write` | `ctx.content.create()`, `.update()`, `.delete()` (ngầm cấp `content:read`) |
| `taxonomies:read` | `ctx.taxonomies.getAll()`, `.getTerms()`, `.getEntryTerms()` |
| `media:read` | `ctx.media.get()`, `.list()` |
| `media:write` | `ctx.media.getUploadUrl()`, `.upload()`, `.delete()` (ngầm cấp `media:read`) |
| `network:request` | `ctx.http.fetch()` — giới hạn `allowedHosts` |
| `network:request:unrestricted` | `ctx.http.fetch()` không giới hạn host (chỉ dùng cho URL do user cấu hình) |
| `users:read` | `ctx.users.get()`, `.getByEmail()`, `.list()` |
| `email:send` | `ctx.email.send()` (cần plugin provider email đã cấu hình) |
| `hooks.email-transport:register` | Đăng ký hook `email:deliver` độc quyền (provider transport) |
| `hooks.email-events:register` | Đăng ký hook `email:beforeSend`/`email:afterSend` |
| `hooks.page-fragments:register` | Đăng ký hook `page:fragments` (chỉ plugin native) |

Vài điểm cần biết: `content:write` tự ngầm cấp `content:read`; `media:write` ngầm cấp `media:read`; `network:request:unrestricted` ngầm cấp `network:request` — không cần khai cả hai. Taxonomy là bề mặt **chỉ đọc** riêng biệt, độc lập với `content:read` — khai cả hai nếu plugin đọc cả nội dung *và* phân loại của nó; không có quyền ghi taxonomy từ plugin. `network:request:unrestricted` dành cho URL do user tự cấu hình (vd plugin webhook nơi vận hành viên tự gõ URL đích) — plugin luôn gọi API đã biết trước nên dùng `network:request` + `allowedHosts`. `email:send` bị chặn bởi cấu hình, không chỉ capability — `ctx.email` chỉ có khi một plugin khác đã đăng ký transport `email:deliver`.

**Tạo nội dung theo locale:** `ctx.content.create()` nhận tham số thứ ba tuỳ chọn cho locale của entry mới: `ctx.content.create("posts", { title: "..." }, { locale: "zh-tw" })`. So khớp locale không phân biệt hoa/thường, lưu theo đúng cách viết trong cấu hình locale của site.

### Allowlist Host mạng

Plugin có `network:request` chỉ fetch được host trong `allowedHosts`. Hỗ trợ wildcard cho subdomain:

```jsonc
"capabilities": ["network:request"],
"allowedHosts": [
	"api.example.com",     // host chính xác
	"*.cdn.example.com"    // mọi subdomain của cdn.example.com
]
```

Bridge kiểm tra host của URL request so với allowlist trước khi chuyển tiếp — request tới host chưa khai báo throw ngay trong plugin, không bao giờ rời sandbox.

### Sandbox thực thi những gì

Khi sandbox runner đang hoạt động, runtime thực thi: (1) **giới hạn capability** — factory PluginContext chỉ điền `ctx.content`/`ctx.taxonomies`/`ctx.media`/`ctx.http`/`ctx.users`/`ctx.email` khi capability tương ứng đã khai; (2) **phạm vi storage/KV** — mọi thao tác storage/KV giới hạn theo slug plugin, không đọc được KV/storage của plugin khác; (3) **cách ly mạng** — `fetch()` trực tiếp và primitive mạng khác bị runner chặn, chỉ `ctx.http.fetch()` (qua kiểm tra host của bridge) mới ra ngoài được; (4) **không có binding host** — plugin sandboxed không thấy biến môi trường, filesystem, hay platform binding nào dù host worker có; (5) **giới hạn tài nguyên** — CPU/subrequest/wall-clock/memory theo mỗi lần gọi (runner Cloudflare: 50ms CPU, 10 subrequest, 30 giây wall-clock, ~128MB memory; runner Node.js workerd chỉ thực thi wall-clock qua `Promise.race`, không thực thi CPU/memory). Hook vượt giới hạn runner bị huỷ; timeout hook của EmDash (`timeout` trong cấu hình hook) áp trần chặt hơn phía trên.

### Sandbox KHÔNG thực thi những gì

- **Hành vi bên trong một capability đã cấp** — plugin có `content:write` sửa được **mọi** nội dung, không chỉ nội dung của mình. Capability chỉ nói "plugin này ghi được nội dung", không nói "chỉ ghi nội dung nó tạo". Review lúc kiểm toán là cách kiểm soát duy nhất với những gì plugin thực sự làm trong phạm vi được cấp.
- **Tin cậy vận hành viên trên Node.js** — khi sandbox runner báo không khả dụng, plugin trong `sandboxed: []` bị bỏ qua; chuyển sang `plugins: []` chạy in-process nhưng không có isolate V8, không giới hạn tài nguyên, plugin gọi `fetch()` trực tiếp hoặc đọc biến môi trường được — coi như mức tin cậy của native.
- **Kênh phụ (side channel)** — timing, log output, dữ liệu lưu trữ đều thấy được với ai có quyền truy cập môi trường host phù hợp — không dùng sandbox làm ranh giới bảo mật chống lại chính vận hành viên chạy nó.

### Đồng ý Capability

Khi vận hành viên cài plugin sandboxed từ marketplace, EmDash hiện hộp thoại đồng ý liệt kê capability đã khai. Cập nhật thêm capability (vd plugin trước chỉ đọc nội dung, giờ muốn gửi network request) hiện dưới dạng diff capability, cần phê duyệt mới trước khi phiên bản mới có hiệu lực.

### Validate lúc bundle

`emdash-plugin bundle` và `emdash-plugin publish` kiểm tra thêm: mọi capability khai báo phải nằm trong tập được công nhận (lỗi gõ làm build fail); `network:request` cần `allowedHosts` không rỗng, `network:request:unrestricted` cần rỗng; `backend.js` đã bundle không được import Node.js built-in (`fs`, `path`, `child_process`...) — sandbox runtime không cung cấp.

## Hook trong Plugin sandboxed (tóm tắt)

Mọi hook plugin theo cùng chữ ký `(event, ctx) => ReturnType` và bảng đầy đủ 24 hook đã trình bày ở [Chương 37](./37-hooks-vong-doi.md). Riêng với plugin **sandboxed**, cần lưu ý:

- **`content:beforeSave` không huỷ được lưu trong sandbox** — plugin sandbox log lỗi throw ra nhưng việc lưu vẫn tiếp tục. Muốn huỷ lưu (throw `ContentSaveRejectedError`), plugin phải chạy ở host process (plugin native, hoặc plugin sandboxed chuyển sang `plugins: []`).
- **`page:fragments` chỉ dành cho plugin native** — output của hook này chạy như code first-party trong trình duyệt khách, ngoài mọi ranh giới sandbox. Plugin sandboxed dùng `page:metadata` cho đóng góp trang an toàn với sandbox.
- **`page:metadata` khả dụng cho cả sandboxed và native** — core validate, khử trùng lặp, và render đóng góp; plugin chỉ trả dữ liệu có cấu trúc, không bao giờ trả HTML thô.
- Cấu hình hook (`priority`, `timeout`, `dependencies`, `errorPolicy`, `exclusive`) và thứ tự thực thi giống hệt mô tả ở Chương 37.

## Xem thêm

- [Chương 37 — Hooks & vòng đời sự kiện](./37-hooks-vong-doi.md)
- [Chương 38 — Máy chủ MCP cho AI Agent](./38-mcp-server.md)
- [Chương 39 — Viết Plugin đầu tiên (sandboxed)](./39-viet-plugin-dau-tien.md)
- [Chương 41 — Giao diện Plugin: Block Kit, Field Kit, Settings](./41-block-kit-field-kit.md)
- [Chương 42 — Lưu trữ dữ liệu Plugin & CLI plugin](./42-luu-tru-cli-plugin.md)
- [Chương 44 — Plugin Native (nâng cao)](./44-plugin-native.md)
