# Giai đoạn 1 — Phần I: Nhập môn & Cài đặt

Tham chiếu: `book/01-DE-CUONG.md` (đề cương gốc), `docs/plans/2026-09-02-so-tay-huong-dan-su-dung-emdash.md` (kế hoạch tổng).

## Chương cần viết (5 chương)

| # | Tên chương | File output | Nguồn |
|---|---|---|---|
| 1 | EmDash là gì và dành cho ai | `book/chuong/01-emdash-la-gi.md` | `docs/src/content/docs/introduction.mdx`, `docs/src/content/docs/why-emdash.mdx` |
| 2 | Cài đặt lần đầu và Trình cài đặt (Setup Wizard) | `book/chuong/02-cai-dat-lan-dau.md` | `docs/src/content/docs/getting-started.mdx`, `TEMPLATES.md`, `README.md` |
| 3 | Thêm EmDash vào dự án Astro có sẵn | `book/chuong/03-them-vao-du-an-co-san.md` | `docs/src/content/docs/existing-project.mdx` |
| 4 | So sánh với WordPress / Astro thuần | `book/chuong/04-so-sanh-wordpress-astro.md` | `docs/src/content/docs/coming-from/wordpress.mdx`, `astro.mdx`, `astro-for-wp-devs.mdx` |
| 5 | Các khái niệm cốt lõi (bản đồ thuật ngữ) | `book/chuong/05-khai-niem-cot-loi.md` | `docs/src/content/docs/concepts/collections.mdx`, `concepts/content-model.mdx` |

## Thuật ngữ cần tái sử dụng

Dùng đúng bảng "Thuật ngữ tạm" trong `book/01-DE-CUONG.md` — đặc biệt các khái niệm sẽ xuất hiện lần đầu ở chương 5 (Collection, Field, Live Collections) phải dùng đúng cách viết sẽ áp dụng cho toàn bộ các chương sau.

## Độ dài mục tiêu mỗi chương

~150–300 dòng markdown/chương (chương 5 có thể dài hơn vì là chương "từ điển khái niệm" nền tảng).

## Checklist chất lượng (bắt buộc cho từng chương)

- [ ] Đối chiếu nguồn: mọi tính năng nêu ra truy được về đúng file `.mdx` nguồn; không suy diễn tính năng không có; nếu nguồn không rõ ghi chú "chưa xác nhận trong tài liệu gốc".
- [ ] Nhất quán thuật ngữ theo bảng thuật ngữ tạm; tên đường dẫn, lệnh CLI trích dẫn chính xác.
- [ ] Định dạng: mở đầu bằng `# <Số>. <Tên chương>` + dòng "Áp dụng cho vai trò: ..."; heading con thống nhất (Tổng quan / Các bước thực hiện / Lưu ý / Xem thêm); không để sót "TODO"/"[cần bổ sung]".
- [ ] Liên kết chéo dùng đường dẫn tương đối `./NN-slug.md`; không link chương chưa viết (ghi "sẽ có ở phần sau của sổ tay").
- [ ] Cập nhật trạng thái chương trong `book/01-DE-CUONG.md` thành "Đã xong" sau khi viết xong.

## Việc cần làm sau khi viết xong 5 chương

1. Đọc lại cả 5 file để rà lỗi chính tả/định dạng.
2. Cập nhật `book/01-DE-CUONG.md`: đánh dấu GĐ1 = "Đã xong", 5 chương = "Đã xong".
3. Viết báo cáo `book/bao-cao/GD01-BAO-CAO.md`.
4. Chuyển sang Giai đoạn 2 (không cần hỏi lại người dùng, tiếp tục tự động theo kế hoạch đã duyệt) — trừ khi ngữ cảnh phiên hiện tại có dấu hiệu quá tải, khi đó viết file bàn giao trước khi dừng.
