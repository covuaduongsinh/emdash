# Báo cáo Giai đoạn 12 — Phần V: Phụ lục + Rà soát nhất quán toàn sách

Trạng thái: **Hoàn thành** — 3/3 chương đã viết. **Đây là giai đoạn cuối cùng — toàn bộ dự án 51/51 chương, 13/13 giai đoạn đã hoàn tất.**

## File đã tạo

| File | Nguồn đã đối chiếu |
|---|---|
| `book/chuong/49-thuat-ngu.md` | Tổng hợp toàn sách, chốt từ "Bảng thuật ngữ tạm" trong `01-DE-CUONG.md` |
| `book/chuong/50-lich-su-tinh-nang.md` | `packages/core/CHANGELOG.md` (2276 dòng, 40 phiên bản 0.0.2–0.36.0) |
| `book/chuong/51-cau-hoi-thuong-gap.md` | Tổng hợp từ các đoạn troubleshooting rải rác ở Chương 3, 7, 20, 23, 25, 27, 30, 39, 43, 47 |

Đã cập nhật `book/01-DE-CUONG.md`: chương 49, 50, 51 và dòng GĐ12 trong bảng giai đoạn đều đánh dấu "Đã xong". Xác nhận bằng grep: 0 kết quả cho "Chưa viết"/"Chưa bắt đầu"/"Đang làm" trong toàn file đề cương.

## Tóm tắt từng chương

49. **Bảng thuật ngữ đối chiếu Anh–Việt** — Chốt chính thức cách dùng thuật ngữ xuyên suốt sổ tay, chia theo nhóm: khái niệm nội dung cốt lõi, trạng thái nội dung, vai trò người dùng, xác thực & bảo mật, đường dẫn admin panel, plugin, triển khai & vận hành — mỗi thuật ngữ dẫn ngược về chương đã giới thiệu nó lần đầu.
50. **Lịch sử tính năng theo phiên bản** — Dòng thời gian chắt lọc (không dịch toàn bộ changelog) các mốc tính năng đáng chú ý từ `0.0.2` tới `0.36.0`, mỗi mục dẫn chiếu tới chương giải thích đầy đủ tính năng đó; kèm ghi chú rõ đây là ảnh chụp tại một thời điểm, khuyến nghị tham chiếu trực tiếp changelog/GitHub releases để có thông tin mới nhất.
51. **Câu hỏi thường gặp & khắc phục sự cố** — Gồm hai phần: (a) 8 câu hỏi tổng quát về định vị sản phẩm (EmDash có phải WordPress/headless CMS không, có bắt buộc Cloudflare không, sandboxed vs native...); (b) bảng khắc phục sự cố tổng hợp 18 dòng, gom lại toàn bộ bảng/mục troubleshooting đã có rải rác ở 9 chương trước, mỗi dòng dẫn thẳng tới chương gốc để xem chi tiết đầy đủ.

## Việc rà soát nhất quán toàn sách (bắt buộc theo kế hoạch gốc)

1. **Quét và sửa mọi link "sẽ có ở phần sau của sổ tay"** — hoàn thành ở phần đầu giai đoạn này (trước khi viết 3 chương phụ lục): dùng script `fix-links.mjs` tự động sửa 133/144 chỗ, sửa tay 12 chỗ còn lại có cách diễn đạt không khớp mẫu regex. Xác nhận bằng grep: 0 kết quả còn lại trên toàn `book/chuong/`.
2. **Xác minh mọi link chương trỏ tới file tồn tại** — chạy script kiểm tra toàn bộ `](./NN-slug.md)` trong 51 chương, đối chiếu với danh sách file thật trong `book/chuong/`. Không còn link gãy nào (link duy nhất từng gãy tạm thời — trỏ tới Chương 51 — nay đã hợp lệ vì chương 51 đã được viết trong giai đoạn này).
3. **Đối chiếu thuật ngữ Chương 49 với cách dùng thực tế** — thực hiện khi soạn Chương 49: mọi thuật ngữ trong bảng đều lấy đúng cách viết đã dùng nhất quán từ GĐ1, không phát sinh thuật ngữ mới hay cách viết khác.
4. **Sửa 2 placeholder nội bộ mới phát sinh trong chính GĐ12** — Chương 49 và 50 tham chiếu forward tới các chương phụ lục còn lại (viết trước khi các chương đó tồn tại); sau khi viết xong Chương 50 và 51, đã cập nhật "Xem thêm" của Chương 49 (2 link) và Chương 50 (1 link) thành link thật.
5. **Đánh dấu 51/51 chương "Đã xong"** trong `01-DE-CUONG.md` — hoàn thành, xác nhận bằng grep.

## Vấn đề phát sinh

- Không có mâu thuẫn thông tin mới phát sinh trong giai đoạn này.
- Điểm cần lưu ý duy nhất: Chương 50 (Lịch sử tính năng) là chương duy nhất trong sổ tay có tính chất "ảnh chụp thời điểm" — nội dung sẽ lạc hậu dần khi `emdash` phát hành thêm phiên bản mới. Đã ghi chú rõ trong chính chương đó và trong Chương 51 (mục "Khi câu trả lời không nằm trong sổ tay này"), trỏ người đọc về changelog/GitHub releases gốc thay vì để họ hiểu nhầm đây là danh sách còn cập nhật.

## Tổng kết toàn dự án

**Sổ tay hướng dẫn sử dụng EmDash — 51 chương, 13 giai đoạn, hoàn thành toàn bộ.**

### Số liệu

| Hạng mục | Số lượng |
|---|---|
| Chương nội dung | 51/51 (100%) |
| Giai đoạn triển khai | 13/13 (GĐ0–GĐ12) |
| Phần sách | 5 (Bắt đầu, Biên tập nội dung, Quản trị & Vận hành, Dành cho lập trình viên, Phụ lục) |
| File báo cáo giai đoạn | 13 (`book/bao-cao/GD01-BAO-CAO.md` → `GD12-BAO-CAO.md`, có tách GD08a/GD08b) |
| File chi tiết giai đoạn | 13 (`book/giai-doan/GD01-*.md` → `GD12-*.md`) |

### Cấu trúc 5 Phần

1. **Phần I — Bắt đầu** (chương 1–4): EmDash là gì, cài đặt lần đầu, thêm vào dự án có sẵn, so sánh WordPress/Astro.
2. **Phần II — Biên tập nội dung** (chương 5–18): khái niệm cốt lõi, đăng nhập, soạn thảo, media, taxonomy, menu, widget, section, dark mode, i18n, content types builder, bố cục trang.
3. **Phần III — Quản trị & Vận hành** (chương 19–33): người dùng/vai trò, cài plugin, di chuyển từ WordPress, triển khai Cloudflare/Node.js, cơ sở dữ liệu, sao lưu/phục hồi, object cache, nâng cấp phiên bản, công cụ dev.
4. **Phần IV — Dành cho lập trình viên** (chương 34–48): CLI, cấu hình, hooks, API routes/capabilities, REST API, MCP server, viết plugin (sandboxed/native), Block Kit/Field Kit, lưu trữ CLI plugin, phát hành plugin, xây dựng theme, seed files.
5. **Phần V — Phụ lục** (chương 49–51): thuật ngữ đối chiếu, lịch sử tính năng, FAQ & khắc phục sự cố.

### Ràng buộc kỹ thuật đã tuân thủ xuyên suốt

- **Nguyên tắc trung thực nguồn:** mọi chương đối chiếu trực tiếp với `.mdx` gốc trong repo (hoặc CHANGELOG/README cho các chương tổng hợp), không suy diễn hay bịa tính năng không có trong tài liệu.
- **Nhất quán ngôn ngữ:** tiếng Việt cho văn xuôi giải thích, giữ nguyên tiếng Anh cho thuật ngữ sản phẩm/tên tính năng/đường dẫn/tên lệnh — chốt chính thức ở Chương 49.
- **Nhất quán định dạng:** mỗi chương mở đầu bằng `# <N>. <Tiêu đề>` + dòng "Áp dụng cho vai trò: ...", kết thúc bằng mục "Xem thêm" với link tương đối.
- **Không trùng lặp nội dung:** chương sau dẫn chiếu ngược chương trước thay vì lặp lại chi tiết đã trình bày.

### Giới hạn đã biết

- **Fork lồng nhau không khả dụng** trong môi trường thực thi này (`"Fork is not available inside a forked worker"`) — toàn bộ 13 giai đoạn được thực hiện trực tiếp, không qua subagent, kể từ khi phát hiện giới hạn này ở GĐ1 (xem `book/bao-cao/GD01-BAO-CAO.md`).
- **Chương 50 (Lịch sử tính năng)** là ảnh chụp thời điểm biên soạn (tới phiên bản `0.36.0`) — sẽ cần cập nhật thủ công khi `emdash` phát hành phiên bản mới đáng chú ý.
- Sổ tay không thay thế tài liệu kỹ thuật gốc `docs/src/content/docs/` — đó vẫn là nguồn đầy đủ và chi tiết nhất bằng tiếng Anh; sổ tay này là bản diễn giải tiếng Việt có tổ chức lại theo hành trình người dùng.

## Việc cần làm tiếp theo (ngoài phạm vi dự án này)

Không còn việc nào thuộc phạm vi kế hoạch gốc (`docs/plans/2026-09-02-so-tay-huong-dan-su-dung-emdash.md`) — dự án đã hoàn thành đầy đủ. Việc bảo trì trong tương lai (nếu có) là: cập nhật Chương 50 khi có phiên bản `emdash` mới đáng chú ý, và bổ sung Chương 51 khi phát sinh câu hỏi/vướng mắc mới phổ biến từ người dùng thực tế.
