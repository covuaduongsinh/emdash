# Báo cáo Giai đoạn 5 — Phần III.B: Sao lưu, Di chuyển WordPress, Nhập nội dung

Trạng thái: **Hoàn thành** — 3/3 chương đã viết.

## File đã tạo

| File | Nguồn đã đối chiếu |
|---|---|
| `book/chuong/22-sao-luu-phuc-hoi.md` | `guides/backups.mdx` |
| `book/chuong/23-di-chuyen-tu-wordpress.md` | `migration/from-wordpress.mdx`, `themes/porting-wp-themes.mdx` |
| `book/chuong/24-nhap-noi-dung.md` | `migration/content-import.mdx` |

Đã cập nhật `book/01-DE-CUONG.md`: 3 chương + GĐ5 đánh dấu "Đã xong".

## Tóm tắt từng chương

22. **Sao lưu và phục hồi** — 3 tầng bảo vệ (download 1-click, sao lưu tự động vào storage, D1 Time Travel), export SQL đầy đủ, giới hạn của khôi phục từ JSON.
23. **Di chuyển từ WordPress** — Phần 1: quy trình nhập WXR đầy đủ (7 bước), bảng chuyển đổi Gutenberg→Portable Text, ánh xạ status/taxonomy/custom field/ACF, redirect map. Phần 2: chuyển đổi theme 3 giai đoạn (thiết kế/template/tính năng động), bảng ánh xạ template hierarchy và template tag, seed file, checklist, trường hợp đặc biệt (child theme, block theme, page builder).
24. **Nhập nội dung từ nguồn khác** — 3 nguồn nhập (WXR/WordPress.com OAuth/REST probe), luồng 4 bước tổng quát (Connect→Analyze→Prepare→Execute), API endpoint, xử lý lỗi, nguồn nhập tuỳ chỉnh cho lập trình viên.

## Vấn đề phát sinh

- **Trùng lặp nội dung có chủ đích giữa Chương 23 và 24:** cả `migration/from-wordpress.mdx` và `migration/content-import.mdx` đều mô tả quy trình nhập WXR (một cái chi tiết theo góc nhìn "hướng dẫn từng bước", cái kia theo góc nhìn "kiến trúc nhập tổng quát 4 bước"). Đã xử lý bằng cách: Chương 23 giữ toàn bộ chi tiết thao tác từng bước (vì đây là chương "hướng dẫn di chuyển WP" chính), Chương 24 chỉ tóm tắt lại WXR trong 1 đoạn ngắn và dẫn chiếu ngược về Chương 23, tập trung phần riêng của nó là WordPress.com OAuth, REST probe, luồng 4 bước tổng quát, API endpoint, và nguồn nhập tuỳ chỉnh — tránh lặp nguyên văn.
- Chương 23 khá dài (gộp 2 nguồn lớn: content migration + theme porting) nhưng hợp lý về mặt chủ đề (cùng nói về "di chuyển từ WordPress"), đã chia rõ Phần 1/Phần 2 để dễ điều hướng.
- Phần cuối `content-import.mdx` (nguồn nhập tuỳ chỉnh, interface `ImportSource`) trỏ tới tài liệu `contributing/architecture.mdx` — đây là tài liệu **kiến trúc nội bộ dành cho người đóng góp code vào EmDash**, đã bị loại khỏi phạm vi sổ tay theo kế hoạch gốc. Đã ghi chú rõ ràng trong Chương 24 rằng chi tiết interface nằm ngoài phạm vi sổ tay, không tự ý mở rộng nội dung không có trong docs người dùng.

## Lưu ý cho Giai đoạn 6 (Triển khai: Cloudflare, Node.js, Database, Secrets, Object Cache, Updating)

- Không có thay đổi với bảng thuật ngữ tạm.
- Chương 25 (Cloudflare) nên tham chiếu ngược Chương 22 (D1 Time Travel đã giới thiệu) và Chương 20 (sandboxRunner đã giới thiệu ở phần cài plugin).
- Tiếp tục thực thi trực tiếp, không dùng fork lồng.
