# Báo cáo Giai đoạn 2 — Phần II.A: Admin Panel, Đăng nhập, Soạn thảo, Media

Trạng thái: **Hoàn thành** — 4/4 chương đã viết.

## File đã tạo

| File | Nguồn đã đối chiếu |
|---|---|
| `book/chuong/06-lam-quen-admin-panel.md` | `docs/src/content/docs/concepts/admin-panel.mdx` |
| `book/chuong/07-dang-nhap-passkey.md` | `docs/src/content/docs/guides/authentication.mdx` (phần đăng nhập/provider/session/bảo mật, không lặp phần Roles/Invites — để dành GĐ4), `guides/atmosphere-auth.mdx` |
| `book/chuong/08-soan-thao-noi-dung.md` | `docs/src/content/docs/guides/working-with-content.mdx` |
| `book/chuong/09-thu-vien-media.md` | `docs/src/content/docs/guides/media-library.mdx` |

Đã cập nhật `book/01-DE-CUONG.md`: 4 chương + GĐ2 đánh dấu "Đã xong".

## Tóm tắt từng chương

6. **Làm quen giao diện quản trị** — Bảng 11 màn hình admin, hiển thị theo vai trò, form editor theo loại field, tóm lược Media/Plugin pages.
7. **Đăng nhập không mật khẩu bằng Passkey** — Passkey/WebAuthn, magic link, provider GitHub/Google/Atmosphere (chi tiết), quản lý passkey, session, bảo mật, troubleshooting, ghi chú Cloudflare Access (dẫn chiếu Chương 19/25).
8. **Soạn thảo nội dung và Portable Text** — Tạo/sửa/xoá nội dung, trạng thái, rich text editor, slash command, HTML block + sanitize, revision, bulk actions, tìm kiếm/lọc, lên lịch, Content API, dịch nội dung (i18n).
9. **Thư viện Media** — Upload, loại tệp hỗ trợ, storage backend (local/R2/S3), tổ chức folder, focal point, hiển thị responsive, media provider ngoài (Cloudflare Images/Stream), Media API.

## Vấn đề phát sinh

- **Phát hiện điểm không nhất quán giữa 2 nguồn gốc** (đã ghi chú minh bạch trong Chương 8, không tự ý chọn một phía): `concepts/content-model.mdx` mô tả field hệ thống `status` có 3 giá trị `draft`/`published`/`scheduled`, nhưng `guides/working-with-content.mdx` liệt kê 3 trạng thái hiển thị trong admin là `Draft`/`Published`/`Archived` (không có `Scheduled` như một trạng thái độc lập — lên lịch được mô tả là Draft + ngày tương lai). Đây không phải lỗi của người viết sổ tay mà là sự khác biệt trong chính tài liệu gốc; đã gắn nhãn "chưa xác nhận đầy đủ trong tài liệu gốc" đúng theo checklist chất lượng.
- Nội dung `guides/media-library.mdx` có phần rất kỹ thuật (kiểu `MediaValue`, `FileValue`, provider lookup) — đã lược bớt trong Chương 9 (chỉ tóm tắt, không dịch toàn bộ) vì chương này nhắm tới người biên tập nội dung; phần kỹ thuật đầy đủ để dành cho Chương 35 (REST API) ở GĐ8.

## Lưu ý cho Giai đoạn 3 (Menu, Widget, Taxonomy, Preview, Settings, Dark mode, i18n)

- Bảng thuật ngữ tạm tiếp tục được áp dụng nhất quán — không phát sinh thuật ngữ mới cần bổ sung vào bảng.
- Chương 16 (i18n) nên tham chiếu ngược lại phần "Dịch nội dung" đã tóm tắt sơ bộ ở Chương 8 để tránh trùng lặp, chỉ bổ sung phần cấu hình/kỹ thuật.
- Không có vấn đề về hạ tầng/ngữ cảnh — tiếp tục thực thi trực tiếp (không dùng fork lồng, như đã ghi trong báo cáo GĐ1).
