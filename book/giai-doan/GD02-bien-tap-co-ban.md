# Giai đoạn 2 — Phần II.A: Admin Panel, Đăng nhập, Soạn thảo, Media

Tham chiếu: `book/01-DE-CUONG.md`, `docs/plans/2026-09-02-so-tay-huong-dan-su-dung-emdash.md`, báo cáo GĐ1 (`book/bao-cao/GD01-BAO-CAO.md`).

## Chương cần viết (4 chương)

| # | Tên chương | File output | Nguồn |
|---|---|---|---|
| 6 | Làm quen giao diện quản trị (Admin Panel) | `book/chuong/06-lam-quen-admin-panel.md` | `docs/src/content/docs/concepts/admin-panel.mdx` + mô tả ảnh chụp màn hình (không nhúng ảnh) |
| 7 | Đăng nhập không mật khẩu bằng Passkey | `book/chuong/07-dang-nhap-passkey.md` | `docs/src/content/docs/guides/authentication.mdx` (phần đăng nhập), `guides/atmosphere-auth.mdx` |
| 8 | Soạn thảo nội dung và Portable Text | `book/chuong/08-soan-thao-noi-dung.md` | `docs/src/content/docs/guides/working-with-content.mdx` |
| 9 | Thư viện Media | `book/chuong/09-thu-vien-media.md` | `docs/src/content/docs/guides/media-library.mdx` |

## Thuật ngữ cần tái sử dụng

Đúng bảng "Thuật ngữ tạm" trong `01-DE-CUONG.md`. Chương 7 KHÔNG lặp lại toàn bộ nội dung Passkey đã giới thiệu sơ ở Chương 2 — chỉ dẫn chiếu ngược rồi đi sâu hơn (OAuth, magic link, Atmosphere/AT Protocol).

## Checklist chất lượng (bắt buộc)

- [ ] Đối chiếu nguồn, không suy diễn tính năng không có.
- [ ] Nhất quán thuật ngữ, đường dẫn admin panel trích dẫn chính xác.
- [ ] Định dạng: `# <Số>. <Tên chương>` + "Áp dụng cho vai trò: ..."; heading con nhất quán; không TODO.
- [ ] Liên kết chéo dùng đường dẫn tương đối; chương > 9 chưa viết thì ghi "(sẽ có ở phần sau của sổ tay)".
- [ ] Cập nhật `book/01-DE-CUONG.md` sau khi xong.

## Việc cần làm sau khi viết xong

1. Đọc lại 4 chương, cập nhật đề cương (chương 6-9 + GĐ2 = "Đã xong").
2. Viết `book/bao-cao/GD02-BAO-CAO.md`.
3. Tiếp tục tự động sang Giai đoạn 3, trừ khi có dấu hiệu quá tải ngữ cảnh.
