# 15. Chế độ tối & tuỳ biến giao diện quản trị

Áp dụng cho vai trò: Lập trình viên (cấu hình theme/component), Người biên tập nội dung (chọn ảnh phiên bản tối)

## Tổng quan

Một site quyết định dùng giao diện sáng hay tối theo một trong hai cách: theo tuỳ chọn hệ thống (system preference) của người xem, hoặc theo lựa chọn tường minh mà site lưu lại cho người xem đó. Các component của EmDash đọc cả hai tín hiệu này thông qua một quy ước duy nhất trên thẻ `<html>`. Chương này mô tả quy ước đó, cách gán một phiên bản ảnh tối (dark counterpart) cho field ảnh, và cách render bằng component `Image` từ `emdash/ui`.

## Quy ước Theme

Component và template dùng hai tín hiệu sau, theo đúng thứ tự:

1. Class `dark` hoặc `light` trên `<html>` sẽ cố định (pin) bảng màu — class thắng tuỳ chọn hệ thống.
2. Không có class nào thì bảng màu theo media query `prefers-color-scheme`.

Các template có sẵn lưu lựa chọn tường minh vào cookie `theme` và áp dụng trước khi trang vẽ lần đầu (before first paint) bằng một script nội tuyến trong `<head>`:

```html title="src/layouts/Base.astro"
<script is:inline>
	(function () {
		var c = document.cookie;
		var i = c.indexOf("theme=");
		var theme = i >= 0 ? c.slice(i + 6).split(";")[0] : null;
		if (theme === "dark" || theme === "light") {
			document.documentElement.classList.add(theme);
		}
	})();
</script>
```

Định nghĩa màu một lần bằng [`light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) và để class cố định bảng màu:

```css title="src/styles/global.css"
:root {
	color-scheme: light dark;
	--color-bg: light-dark(#ffffff, #0d0d0d);
	--color-text: light-dark(#1a1a1a, #ededed);
}
:root.light {
	color-scheme: light;
}
:root.dark {
	color-scheme: dark;
}
```

Site không có nút chuyển đổi theme thì không cần script — cứ để `<html>` không có class và tuỳ chọn hệ thống sẽ được áp dụng.

## Phiên bản ảnh tối (Dark Image Variant)

Một field ảnh có thể mang thêm ảnh thứ hai dùng cho bảng màu tối. Editor chọn ảnh này ngay cạnh ảnh chính, và component `Image` sẽ hiển thị đúng ảnh khớp với bảng màu của người xem.

### Bật slot cho một field

Slot này **tắt theo mặc định**. Bật riêng cho từng field, qua admin hoặc seed file.

**Trong admin:** mở **Content Types**, sửa field ảnh, bật công tắc **Dark mode variant**.

**Trong seed file:** đặt tuỳ chọn widget `darkVariant` trên field:

```json title="seed/seed.json"
{
	"slug": "featured_image",
	"label": "Featured Image",
	"type": "image",
	"options": { "darkVariant": true }
}
```

### Chọn ảnh phiên bản tối (dành cho biên tập viên)

1. Mở một entry và chọn ảnh chính như bình thường.
2. Nhấn **Add dark mode variant** bên dưới ảnh, chọn ảnh đối ứng cho chế độ tối từ thư viện Media.
3. Lưu entry.

Phiên bản tối được lưu bên trong giá trị field dưới tên `darkVariant`. Xoá ảnh chính sẽ xoá luôn phiên bản tối đi kèm; thay ảnh chính vẫn giữ nguyên phiên bản tối cho tới khi bạn thay hoặc xoá nó.

### Render phiên bản tối (dành cho lập trình viên)

Component `Image` tự render cả hai ảnh khi giá trị có kèm `darkVariant` và hiển thị đúng ảnh bằng CSS — không cần thay đổi gì trong template:

```astro title="src/pages/posts/[slug].astro"
---
import { Image } from "emdash/ui";
import { getEmDashEntry } from "emdash";

const { entry: post } = await getEmDashEntry("posts", Astro.params.slug);
---

{post?.data.featured_image && <Image image={post.data.featured_image} priority />}
```

Output chứa hai thẻ `<img>`. Ảnh chính có class `emdash-image--light`, phiên bản tối có class `emdash-image--dark`. Cả hai dùng chung `alt`, kích thước override, và thuộc tính loading của ảnh chính. Mỗi ảnh giữ màu placeholder riêng.

`id` bạn truyền vào giữ nguyên trên ảnh chính; phiên bản tối nhận cùng `id` kèm hậu tố `--dark` (vd `id="hero"` sinh ra `hero` và `hero--dark`).

Khi ảnh tối đến từ nguồn khác (vd một field ảnh thứ hai riêng), truyền tường minh:

```astro
<Image image={post.data.hero} darkVariant={post.data.hero_dark} />
```

### Hành vi tải ảnh (loading)

Cả hai ảnh đều lazy theo mặc định. Trình duyệt không tải ảnh lazy đang bị ẩn bằng `display: none`, nên người xem chỉ tải đúng ảnh khớp bảng màu của họ — ảnh còn lại chỉ tải khi bảng màu thay đổi.

Với `priority`, cả hai ảnh có `loading="eager"` và `fetchpriority="high"`, và cả hai đều tải xuống trong mọi bảng màu — vì theme được quyết định phía trình duyệt, server không thể biết trước người xem sẽ thấy phiên bản nào. Chỉ dùng `priority` cho ảnh chính hiển thị ngay khi tải trang (above-the-fold), để các ảnh khác ở chế độ lazy.

## Dùng quy ước theme khác

CSS đi kèm ẩn phiên bản không khớp bảng màu, dùng selector `:where()` trên phần `<html>` — nên bất kỳ rule nào của bạn nhắm tới `<html>` bằng class hoặc attribute đều thắng.

Nếu bộ chuyển theme của bạn đặt một attribute như `data-theme`, cách sửa nhanh nhất là cũng đặt class `dark`/`light` từ cùng đoạn code. Nếu không, ghi đè 4 trường hợp trong stylesheet của bạn:

```css title="src/styles/global.css"
:root[data-theme="dark"] .emdash-image--light,
:root[data-theme="light"] .emdash-image--dark {
	display: none;
}
:root[data-theme="dark"] .emdash-image--dark,
:root[data-theme="light"] .emdash-image--light {
	display: block;
}
```

Khớp giá trị `display` với cách stylesheet của bạn xử lý ảnh ở nơi khác (vd `inline` nếu bạn không reset `img` về `block`).

> Rule `prefers-color-scheme` của EmDash vẫn áp dụng khi `<html>` không mang class `light` hay `dark` nào. Các override ở trên có hiệu lực ngay khi attribute của bạn xuất hiện.

## Lưu ý

- Đây là tính năng nằm giữa ranh giới lập trình viên (thiết lập quy ước CSS/theme) và biên tập viên (chọn ảnh phiên bản tối) — cả hai vai trò cần đọc chương này.
- Xem lại phần "Hiển thị responsive" ở [Chương 9](./09-thu-vien-media.md) để hiểu thêm về component `Image` và tuỳ chọn `priority`.

## Xem thêm

- [Chương 9 — Thư viện Media](./09-thu-vien-media.md)
- [Chương 14 — Cài đặt trang web (Site Settings)](./14-cai-dat-site-settings.md)
- [Chương 17 — Xây dựng Loại nội dung (Content Types Builder)](./17-content-types-builder.md)
- [Chương 48 — Seed Files](./48-seed-files.md)
