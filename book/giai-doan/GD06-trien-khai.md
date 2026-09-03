# Giai đoạn 6 — Phần III.C: Triển khai (Cloudflare, Node.js, DB, Secrets, Object Cache, Updating)

Tham chiếu: `book/01-DE-CUONG.md`, báo cáo GĐ1-GĐ5.

## Chương cần viết (6 chương)

| # | Tên chương | File output | Nguồn |
|---|---|---|---|
| 25 | Triển khai lên Cloudflare Workers | `book/chuong/25-trien-khai-cloudflare.md` | `deployment/cloudflare.mdx`, `deployment/storage.mdx` (phần R2) |
| 26 | Triển khai trên Node.js | `book/chuong/26-trien-khai-nodejs.md` | `deployment/nodejs.mdx`, `deployment/storage.mdx` (phần filesystem/S3) |
| 27 | Cơ sở dữ liệu (SQLite/PostgreSQL/D1) | `book/chuong/27-co-so-du-lieu.md` | `deployment/database.mdx`, `schema-evolution.mdx`, `core-migrations.mdx` |
| 28 | Bí mật cấu hình & biến môi trường | `book/chuong/28-bi-mat-cau-hinh.md` | `deployment/secrets.mdx` |
| 29 | Bộ nhớ đệm đối tượng (Object Cache) | `book/chuong/29-object-cache.md` | `deployment/object-cache.mdx` |
| 30 | Nâng cấp phiên bản EmDash | `book/chuong/30-nang-cap-phien-ban.md` | `deployment/updating.mdx` |

## Lưu ý đặc biệt

- `deployment/storage.mdx` dùng chung cho cả Chương 25 (phần R2) và Chương 26 (phần filesystem/S3) — đọc một lần, tách nội dung đúng chỗ.
- Chương 25 tham chiếu ngược Chương 22 (D1 Time Travel) và Chương 20 (sandboxRunner).

## Checklist chất lượng (như các giai đoạn trước)

- [ ] Đối chiếu nguồn, không suy diễn tính năng không có.
- [ ] Nhất quán thuật ngữ theo `01-DE-CUONG.md`.
- [ ] Định dạng chuẩn, không TODO.
- [ ] Liên kết chéo đúng quy ước.
- [ ] Cập nhật đề cương sau khi xong.

## Việc cần làm sau khi viết xong

1. Đọc lại 6 chương, cập nhật đề cương (chương 25-30 + GĐ6 = "Đã xong").
2. Viết `book/bao-cao/GD06-BAO-CAO.md`.
3. Tiếp tục tự động sang Giai đoạn 7.
