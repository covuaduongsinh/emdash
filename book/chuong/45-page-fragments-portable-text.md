# 45. Plugin Native: Page Fragments & Portable Text Components

Áp dụng cho vai trò: Lập trình viên

## Tổng quan

Chương này trình bày ba chủ đề chỉ dành cho plugin native: **Page Fragments** (chèn HTML/script/stylesheet thô vào trang công khai), **Portable Text rendering components** (component Astro render khối tuỳ chỉnh trên site công khai), và **phân phối plugin native qua npm**.

## Page Fragments

Hook `page:fragments` cho phép plugin đóng góp HTML thô, script, hoặc stylesheet vào trang công khai — công cụ đúng cho thẻ analytics, widget bên thứ ba, CSS tuỳ chỉnh, và bất cứ gì cần gửi JavaScript/markup trực tiếp vào trình duyệt khách.

Hook này **chỉ dành cho plugin native** vì output chạy như code first-party trong trình duyệt, ngoài mọi ranh giới sandbox. Nếu chỉ cần đóng góp metadata có cấu trúc (thẻ meta, OpenGraph, JSON-LD, `<link>` rel trong allowlist), dùng `page:metadata` thay thế — khả dụng cho cả sandboxed và native (xem lại [Chương 37](./37-hooks-vong-doi.md)).

### Capability

`page:fragments` cần capability `hooks.page-fragments:register`, khai cả trong `definePlugin()` lẫn trên descriptor:

```typescript title="src/index.ts"
return definePlugin({
	id: "analytics-gtm",
	version: "1.0.0",
	capabilities: ["hooks.page-fragments:register"],
});
```

### Fragment render ở đâu

Template opt-in nhận fragment bằng cách gồm component tương ứng từ `emdash/ui`:

- `<EmDashHead />` — render fragment `placement: "head"` cộng mọi đóng góp `page:metadata`.
- `<EmDashBodyStart />` — render fragment `placement: "body:start"`.
- `<EmDashBodyEnd />` — render fragment `placement: "body:end"`.

Template bỏ qua một trong các component này sẽ âm thầm bỏ qua fragment nhắm tới vị trí đó — plugin không lỗi, fragment chỉ đơn giản không xuất hiện. Ghi rõ yêu cầu vị trí trong README của plugin.

### Loại đóng góp

```typescript
type PageFragmentContribution =
	| { kind: "external-script"; placement: PagePlacement; src: string; async?: boolean; defer?: boolean; attributes?: Record<string, string>; key?: string; }
	| { kind: "inline-script"; placement: PagePlacement; code: string; attributes?: Record<string, string>; key?: string; }
	| { kind: "html"; placement: PagePlacement; html: string; key?: string; };
```

`PagePlacement` là `"head" | "body:start" | "body:end"`.

### Ví dụ

**Script ngoài** — chèn tag manager bên thứ ba vào `<head>`:

```typescript
"page:fragments": async (event, ctx) => {
	const containerId = await ctx.kv.get<string>("settings:gtmContainerId");
	if (!containerId) return null;
	return {
		kind: "external-script",
		placement: "head",
		src: `https://www.googletagmanager.com/gtm.js?id=${containerId}`,
		async: true,
	};
},
```

**Script nội tuyến** — chạy đoạn JavaScript nhỏ ở đầu `<body>`:

```typescript
"page:fragments": async (event, ctx) => {
	if (event.page.kind !== "content") return null;
	return {
		kind: "inline-script",
		placement: "body:start",
		code: `window.contentId = ${JSON.stringify(event.page.content?.id)};`,
	};
},
```

> Nội dung script nội tuyến được chèn nguyên văn. Coi mọi giá trị nội suy là output không tin cậy, dùng `JSON.stringify()` (hoặc tương đương) để escape — không bao giờ ghép trực tiếp input người dùng thô vào JS nội tuyến.

**Fragment HTML** — noscript fallback ở cuối `<body>`; **nhiều fragment cùng lúc** — trả về mảng để đóng góp nhiều fragment trong một lần gọi (ví dụ script + noscript fallback đi cùng nhau).

### Event Trang

Hook `page:fragments` nhận cùng hình dạng event với `page:metadata`:

```typescript
{
	page: {
		url: string;
		path: string;
		locale: string | null;
		kind: "content" | "custom";
		pageType: string;
		title: string | null;
		pageTitle?: string | null;
		description: string | null;
		canonical: string | null;
		image: string | null;
		content?: { collection: string; id: string; slug: string | null };
	}
}
```

Dùng `event.page.kind` và `event.page.pageType` để quyết định đóng góp hay không trên một trang cụ thể — vd bỏ qua analytics trên preview admin, chỉ chèn JSON-LD trên bài blog.

### Khi nào dùng `page:metadata` thay thế

Nếu nhu cầu thực sự là: mô tả meta/robots/Twitter card → `page:metadata` kiểu `meta`; thuộc tính OpenGraph → kiểu `property`; `<link>` canonical/alternate → kiểu `link`; đồ thị JSON-LD → kiểu `jsonld`. `page:metadata` hoạt động được trong plugin sandboxed, tự có validation/khử trùng lặp, và tránh gánh nặng tin cậy khi gửi HTML thô cho khách. Chỉ dùng `page:fragments` khi thật sự cần gửi JavaScript hoặc HTML.

## Component render Portable Text

Plugin thêm loại khối tuỳ chỉnh vào editor Portable Text — nhúng YouTube, đoạn code, thư viện ảnh, bất cứ gì ngoài tập khối mặc định. Plugin sandboxed khai được UI soạn thảo cho các khối này (bằng field Block Kit), nhưng component Astro **render** chúng trên site công khai phải nạp lúc build từ npm — đây là phần cần plugin native.

Nếu plugin chỉ cần field phía soạn thảo và ai khác cung cấp component render (hoặc site tự cung cấp cục bộ), có thể ở lại sandboxed. Nếu plugin cần tự cung cấp cả component render, cần là native.

### Khai loại khối

Cả sandboxed và native đều khai được loại khối. Plugin native khai trong `definePlugin()` dưới `admin.portableTextBlocks`:

```typescript title="src/index.ts"
admin: {
	portableTextBlocks: [
		{
			type: "youtube",
			label: "YouTube Video",
			icon: "video",                       // video, code, link, link-external
			placeholder: "Paste YouTube URL...",
			fields: [                            // Field Block Kit cho UI soạn thảo
				{ type: "text_input", action_id: "id", label: "YouTube URL" },
				{ type: "text_input", action_id: "title", label: "Title" },
				{ type: "text_input", action_id: "poster", label: "Poster Image URL" },
			],
		},
	],
},
```

Mỗi loại khối định nghĩa: `type` (tên loại khối, dùng trong `_type` của Portable Text), `label` (tên hiển thị trong menu slash command), `icon` (`video`/`code`/`link`/`link-external`, mặc định khối lập phương chung), `placeholder`, `fields` (form Block Kit để soạn — bỏ qua thì hiện ô nhập URL đơn giản).

### Render trên site công khai

Export component Astro từ một `componentsEntry` — tên export **bắt buộc** là `blockComponents`:

```typescript title="src/astro/index.ts"
import YouTube from "./YouTube.astro";
import CodePen from "./CodePen.astro";

export const blockComponents = {
	youtube: YouTube,
	codepen: CodePen,
};
```

Đặt `componentsEntry` trên descriptor:

```typescript title="src/index.ts"
export function myPlugin(): PluginDescriptor {
	return {
		id: "embeds",
		version: "1.0.0",
		format: "native",
		entrypoint: "@my-org/embeds",
		componentsEntry: "@my-org/embeds/astro",
	};
}
```

EmDash tự gộp component khối của plugin vào `<PortableText>` — tác giả site không cần import gì. Component do site cung cấp (khai trong prop `components` của `<PortableText>`) ưu tiên hơn mặc định của plugin.

### Export gói

Thêm export `./astro` vào `package.json`:

```json title="package.json"
{
	"exports": {
		".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
		"./admin": { "types": "./dist/admin.d.ts", "import": "./dist/admin.js" },
		"./astro": { "types": "./dist/astro/index.d.ts", "import": "./dist/astro/index.js" }
	}
}
```

Export `./astro` chạy phía server (Astro SSR), export `./admin` chạy phía trình duyệt (React), export `"."` là descriptor + `createPlugin` — giữ chúng ở file riêng vì bundle cho môi trường khác nhau.

> Plugin đóng gói sẵn `@emdash-cms/plugin-embeds` là ví dụ đầy đủ theo mẫu này — loại khối YouTube, Vimeo, Tweet, Bluesky, Mastodon, Gist, Link Preview, đều có cả field soạn thảo admin lẫn component render phía site.

### Biến thể thân thiện với Sandbox

Muốn plugin ở dạng sandboxed nhưng vẫn cung cấp trải nghiệm render mặc định: (1) phát hành plugin sandboxed (chỉ field soạn thảo) lên marketplace; (2) phát hành một gói native đồng hành riêng trên npm cung cấp component render Astro; (3) ghi tài liệu cả hai — người dùng cuối cài plugin sandboxed từ marketplace và `npm install` gói đồng hành để render. Cách này đánh đổi cài đặt một-bước để giữ phía soạn thảo trong sandbox — đi native hoàn toàn đơn giản hơn khi có render khối, nhưng cách chia tách này vẫn là một lựa chọn.

## Phân phối Plugin Native

Plugin native phân phối qua npm — một gói npm thông thường export descriptor factory cộng `createPlugin`. Vận hành viên site cài bằng `npm install` và đăng ký trong `astro.config.mjs`.

### Cấu trúc gói

```
@my-org/plugin-analytics/
├── src/
│   ├── index.ts          # Descriptor + createPlugin
│   ├── admin.tsx         # Component admin React (tuỳ chọn)
│   └── astro/            # Component Astro render khối PT (tuỳ chọn)
│       └── index.ts
├── dist/                 # output build
├── package.json
├── tsconfig.json
└── README.md
```

`package.json` cần khai `exports`, `scripts` build, và `peerDependencies`:

| Export | Bắt buộc nếu dùng… | Build cho |
| --- | --- | --- |
| `"."` | Luôn luôn | Server |
| `"./admin"` | Trang/widget admin React | Trình duyệt |
| `"./astro"` | Component render Portable Text | Server (SSR) |

Bỏ qua `./admin` và `./astro` nếu plugin không cần.

> Giữ `emdash` và `react` làm peer dependency, không phải dependency thường — site host cung cấp phiên bản thật; tự bundle bản sao gây xung đột phiên bản và trùng lặp React trong admin UI.

### Cấu hình Build

Plugin native phân phối dạng ES module — hầu hết tác giả dùng `tsdown` (hoặc `tsup`) với TypeScript, ngoại hoá `react`, `emdash`, `@emdash-cms/admin` để không bundle vào output. Component Astro (nếu có) không cần bundle — Astro tiêu thụ trực tiếp file `.astro` nguồn; liệt kê thư mục `astro/` trong `files` để gồm trong tarball npm.

### Versioning

Dùng semantic versioning. Bump major là tín hiệu cho vận hành viên rằng có thể cần thay đổi khi nâng cấp. Hình dạng `definePlugin()` và API plugin context ổn định, nhưng đổi hành vi hook/yêu cầu capability/schema settings theo cách ảnh hưởng site đã cài là breaking change.

> **Capability là một phần hợp đồng bề mặt của plugin.** Thêm capability ở một release không-major nghĩa là vận hành viên có sẵn nâng cấp và âm thầm cấp thêm capability mới — điều này ổn với plugin sandboxed (hộp thoại đồng ý hỏi lại), nhưng plugin native **không có** luồng đồng ý. Coi việc thêm capability là bump **major** cho plugin native, hoặc ghi rất nổi bật trong release note.

### README và tài liệu

README plugin tốt gồm: plugin làm gì (một câu), cách cài (`npm install ...` + đoạn `astro.config.mjs`), capability khai báo và dùng để làm gì, thay đổi template Astro cần thiết (vd `<EmDashHead />` cho `page:metadata`, `<EmDashBodyEnd />` cho `page:fragments`), cài đặt và ý nghĩa từng cái, ghi chú migrate giữa các major version.

### Publish lên npm

```bash
npm version patch     # hoặc minor/major
npm publish --access public
```

Với gói có scope, `--access public` bắt buộc ở lần publish đầu (npm mặc định gói có scope là private).

### Phát triển cục bộ với site host

Khi lặp lại trên plugin, link vào site test thay vì publish lại mỗi lần đổi:

```bash
# Trong gói plugin
pnpm build --watch

# Trong site test
pnpm add file:../plugins/my-plugin
```

Đăng ký plugin trong `astro.config.mjs` của site test rồi chạy dev server — handler hook chạy ở request tiếp theo sau khi `pnpm build` xong.

### Không có trên Marketplace

Plugin native **không thể** publish lên marketplace EmDash — marketplace chỉ dành cho sandboxed: mọi plugin publish đều chạy qua `emdash plugin bundle` (validate backend code tự chứa, không import Node.js built-in, dưới giới hạn kích thước), qua kiểm toán bảo mật, và chạy trong sandbox runtime khi cài. Một plugin dùng tính năng chỉ-native đôi khi bỏ được chúng để trở thành sandboxable — vd gỡ `page:fragments` hoặc chuyển `settingsSchema` thành trang settings Block Kit (xem lại [Chương 39](./39-viet-plugin-dau-tien.md)).

## Xem thêm

- [Chương 37 — Hooks & vòng đời sự kiện](./37-hooks-vong-doi.md)
- [Chương 39 — Viết Plugin đầu tiên (sandboxed)](./39-viet-plugin-dau-tien.md)
- [Chương 41 — Giao diện Plugin: Block Kit, Field Kit, Settings](./41-block-kit-field-kit.md)
- [Chương 44 — Plugin Native (nâng cao)](./44-plugin-native.md)
- [Chương 46 — Chuyển đổi Plugin WordPress sang EmDash](./46-chuyen-doi-plugin-wp.md)
