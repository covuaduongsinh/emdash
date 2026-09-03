# Giai đoạn 12 — Phần V: Phụ lục + Rà soát nhất quán toàn sách

Tham chiếu: `book/01-DE-CUONG.md`, báo cáo GĐ1-GĐ11. Đây là giai đoạn cuối cùng.

## Chương cần viết (3 chương)

| # | Tên chương | File output | Nguồn |
|---|---|---|---|
| 49 | Bảng thuật ngữ đối chiếu Anh–Việt | `book/chuong/49-thuat-ngu.md` | Tổng hợp toàn sách, dựa trên bảng thuật ngữ tạm trong `01-DE-CUONG.md` |
| 50 | Lịch sử tính năng theo phiên bản | `book/chuong/50-lich-su-tinh-nang.md` | `packages/core/CHANGELOG.md` |
| 51 | Câu hỏi thường gặp & khắc phục sự cố | `book/chuong/51-cau-hoi-thuong-gap.md` | Tổng hợp từ README + các đoạn troubleshooting rải rác trong các chương đã viết |

## Việc rà soát bắt buộc (đã hoàn thành trước khi viết 3 chương này, ghi lại ở đây để đối chiếu)

1. **Quét và sửa mọi link "sẽ có ở phần sau của sổ tay"** trong 48 chương đã viết — đã hoàn thành bằng script tự động (`fix-links.mjs`) + sửa tay 12 trường hợp không khớp mẫu tự động. Xác nhận: `grep "sẽ có ở phần sau"` trả về 0 kết quả trên toàn `book/chuong/`.
2. **Xác minh mọi link chương trỏ tới file tồn tại** — đã chạy script kiểm tra, chỉ có 1 link "gãy tạm thời" tới Chương 51 (sẽ tự khớp sau khi viết xong chương này trong giai đoạn này).
3. **Đối chiếu thuật ngữ Chương 49 với cách dùng thực tế** — thực hiện khi viết Chương 49, dựa trên bảng thuật ngữ tạm đã áp dụng nhất quán qua 12 giai đoạn.
4. **Đánh dấu 51/51 chương "Đã xong"** trong `01-DE-CUONG.md` sau khi viết xong 3 chương phụ lục.

## Việc cần làm sau khi viết xong 3 chương

1. Cập nhật đề cương (49-51 + GĐ12 = "Đã xong"; toàn bộ 51/51 chương "Đã xong").
2. Viết `book/bao-cao/GD12-BAO-CAO.md` — báo cáo tổng kết toàn dự án (13 giai đoạn, 51 chương).
3. Thông báo hoàn tất cho người dùng.
