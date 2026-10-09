# SỔ TAY HƯỚNG DẪN SỬ DỤNG VÀ TRẢI NGHIỆM DƯƠNG SINH CHESS SUITE

**Website Production:** [covuahocduong.com](https://covuahocduong.com) _(Worker: `https://covuahocduong.duongsinhchess.workers.dev`)_  
**Đơn vị phát triển:** Công ty CP Cờ vua Dương Sinh  
**Nền tảng công nghệ:** EmDash CMS + Cloudflare Workers + D1 Database + @duongsinh/chess-kit

---

## MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Hệ Thống 6 Cấp Độ Cờ Vua Dương Sinh](#2-hệ-thống-6-cấp-độ-cờ-vua-dương-sinh)
3. [Dữ Liệu Mẫu Đã Tạo & Đường Dẫn Trải Nghiệm Nhanh](#3-dữ-liệu-mẫu-đã-tạo--đường-dẫn-trải-nghiệm-nhanh)
   - 3.1. [Danh mục 18 Câu đố mẫu (3 câu/cấp x 6 cấp)](#31-danh-mục-18-câu-đố-mẫu-3-câucấp-x-6-cấp)
   - 3.2. [Danh mục 4 Bài giảng tương tác nhiều bước](#32-danh-mục-4-bài-giảng-tương-tác-nhiều-bước)
   - 3.3. [Danh mục 6 Khóa học & Lộ trình 6 cấp độ](#33-danh-mục-6-khóa-học--lộ-trình-6-cấp-độ)
   - 3.4. [Danh mục 4 Gói Thẻ Thư Viện & Bảng giá](#34-danh-mục-4-gói-thẻ-thư-viện--bảng-giá)
   - 3.5. [Kho giáo án mẫu Obsidian (.md)](#35-kho-giáo-án-mẫu-obsidian-md)
4. [Dành Cho Học Viên & Phụ Huynh](#4-dành-cho-học-viên--phụ-huynh)
   - 4.1. [Khám phá Khóa học & Học bài tương tác](#41-khám-phá-khóa-học--học-bài-tương-tác)
   - 4.2. [Giải câu đố chiến thuật & Câu đố mỗi ngày](#42-giải-câu-đố-chiến-thuật--câu-đố-mỗi-ngày)
   - 4.3. [Đăng ký Thẻ Thư Viện qua VietQR tự động](#43-đăng-ký-thẻ-thư-viện-qua-vietqr-tự-động)
   - 4.4. [Làm bài trắc nghiệm & Theo dõi tiến độ](#44-làm-bài-trắc-nghiệm--theo-dõi-tiến-độ)
5. [Dành Cho Huấn Luyện Viên (HLV) & Quản Trị Viên](#5-dành-cho-huấn-luyện-viên-hlv--quản-trị-viên)
   - 5.1. [Khởi tạo hệ thống & Nạp dữ liệu mẫu 1 chạm](#51-khởi-tạo-hệ-thống--nạp-dữ-liệu-mẫu-1-chạm)
   - 5.2. [Soạn bàn cờ FEN/PGN trong bài viết (Portable Text)](#52-soạn-bàn-cờ-fenpgn-trong-bài-viết-portable-text)
   - 5.3. [Quản trị Kho câu đố & Nhập hàng loạt](#53-quản-trị-kho-câu-đố--nhập-hàng-loạt)
   - 5.4. [Xây dựng Bài giảng nhiều bước (Lecture Builder)](#54-xây-dựng-bài-giảng-nhiều-bước-lecture-builder)
   - 5.5. [Chế độ Trình chiếu trên lớp & Máy chiếu (Lecture Presenter)](#55-chế-độ-trình-chiếu-trên-lớp--máy-chiếu-lecture-presenter)
   - 5.6. [Nhập giáo án thần tốc từ Vault Obsidian (.md)](#56-nhập-giáo-án-thần-tốc-từ-vault-obsidian-md)
   - 5.7. [Quản lý Đơn hàng, Hội viên & Kích hoạt Thẻ Thư Viện](#57-quản-lý-đơn-hàng-hội-viên--kích-hoạt-thẻ-thư-viện)
6. [Bảng Tra Cứu Đường Dẫn (URL Reference)](#6-bảng-tra-cứu-đường-dẫn-url-reference)

---

## 1. TỔNG QUAN HỆ THỐNG

**Dương Sinh Chess Suite** là giải pháp LMS và CMS cờ vua học đường hoàn chỉnh, được tích hợp liền mạch gồm:

- **@duongsinh/chess-kit:** Thư viện lõi xử lý FEN, SAN, UCI, 6 cấp độ cờ và bàn cờ tương tác chuẩn React.
- **emdash-lms:** Quản lý khóa học, chương bài, phân quyền học viên và thanh toán tự động qua SePay VietQR Napas 24/7.
- **plugin-chessfenpgn:** Khối nhúng thế cờ tĩnh FEN (có vẽ mũi tên/tô màu ô cờ) và ván cờ động PGN trong bài viết CMS.
- **plugin-chess-puzzles:** Ngân hàng câu đố phân bổ 6 cấp độ, câu đố mỗi ngày (Puzzle of the Day), bộ chấm nước đi tự động và công cụ nạp hàng loạt (CSV/EPD/PGN).
- **plugin-chess-lessons:** Bài giảng tương tác nhiều bước, ghi chú chuyên môn bảo mật cho HLV, chế độ trình chiếu máy chiếu và bộ nạp giáo án từ Markdown Obsidian.

---

## 2. HỆ THỐNG 6 CẤP ĐỘ CỜ VUA DƯƠNG SINH

Hệ thống được thiết kế theo thang phát triển chuẩn của Dương Sinh Chess:

| Mã cấp (`id`) | Tên Cấp Độ             | Màu Sắc Nhận Diện         | Đối Tượng Phù Hợp       | Trọng Tâm Đào Tạo                                            |
| :------------ | :--------------------- | :------------------------ | :---------------------- | :----------------------------------------------------------- |
| `tot`         | **Cấp Tốt (Pawn)**     | 🟢 `#10B981` (Xanh lá)    | Bắt đầu học             | Bàn cờ, đi quân, bắt quân, phong cấp, luật En Passant        |
| `ma`          | **Cấp Mã (Knight)**    | 🔵 `#3B82F6` (Xanh dương) | Sơ cấp (ELO ~800)       | Đòn tấn công đôi của Mã, chiếu thắt cổ, đòn chiếu bắt quân   |
| `tuong`       | **Cấp Tượng (Bishop)** | 🟣 `#8B5CF6` (Tím)        | Trung cấp 1 (ELO ~1000) | Ghim quân tuyệt đối, đòn chiếu xuyên (skewer), bẫy khai cuộc |
| `xe`          | **Cấp Xe (Rook)**      | 🟠 `#F59E0B` (Cam)        | Trung cấp 2 (ELO ~1200) | Chiếu hết hàng đáy (back-rank), chồng 2 Xe cột mở, cắt Vua   |
| `hau`         | **Cấp Hậu (Queen)**    | 🔴 `#EF4444` (Đỏ)         | Nâng cao (ELO ~1500)    | Khẩu pháo Hậu + Tượng, đòn thí Hậu công phá, Scholar's Mate  |
| `vua`         | **Cấp Vua (King)**     | 🟡 `#F59E0B` (Vàng kim)   | Chuyên sâu / Thi đấu    | Kỹ thuật đối Vua (opposition), đòn phối hợp Anastasia's Mate |

---

## 3. DỮ LIỆU MẪU ĐÃ TẠO & ĐƯỜNG DẪN TRẢI NGHIỆM NHANH

### 3.1. Danh mục 18 Câu đố mẫu (3 câu/cấp x 6 cấp)

Thầy có thể truy cập `/cau-do` hoặc xem từng câu đố trực tiếp tại các liên kết sau:

| Cấp độ    | Tên Câu Đố Mẫu                              | Chủ Đề Chiến Thuật            | Link Trực Tiếp                                  |
| :-------- | :------------------------------------------ | :---------------------------- | :---------------------------------------------- |
| **Tốt**   | Cấp Tốt: Đòn Bắt Đôi Của Tốt                | Đòn chĩa đôi d4-d5            | `/cau-do/tot-don-bat-doi-cua-tot`               |
| **Tốt**   | Cấp Tốt: Phong Cấp Tốt Quyết Định           | Phong Hậu e7-e8=Q             | `/cau-do/tot-phong-cap-tot-quyet-dinh`          |
| **Tốt**   | Cấp Tốt: Bắt Tốt Qua Đường (En Passant)     | Quy tắc e5xf6                 | `/cau-do/tot-bat-tot-qua-duong-en-passant`      |
| **Mã**    | Cấp Mã: Đòn Nhảy Mã Bắt Đôi Vua và Xe       | Royal Fork                    | `/cau-do/ma-don-nhay-ma-bat-doi-vua-va-xe`      |
| **Mã**    | Cấp Mã: Mã Nhảy Chiếu Hết Thắt Cổ Ở Góc     | Smothered Mate 1. Nf7#        | `/cau-do/ma-nhay-chieu-het-that-co-o-goc`       |
| **Mã**    | Cấp Mã: Đòn Nhảy Mã Chiếu Bắt Hậu           | Fork bắt Hậu                  | `/cau-do/ma-don-nhay-ma-chieu-bat-hau`          |
| **Tượng** | Cấp Tượng: Đòn Ghim Quân Tuyệt Đối          | Absolute Pin                  | `/cau-do/tuong-don-ghim-quan-tuyet-doi`         |
| **Tượng** | Cấp Tượng: Đòn Chiếu Xuyên (Skewer) Bắt Xe  | Skewer đường chéo lớn         | `/cau-do/tuong-don-chieu-xuyen-bat-xe`          |
| **Tượng** | Cấp Tượng: Đòn Ghim Tượng Tấn Công Xe Đen   | Counter Pin                   | `/cau-do/tuong-don-ghim-tuong-tan-cong-xe-den`  |
| **Xe**    | Cấp Xe: Chiếu Hết Hàng Đáy Kinh Điển        | Back Rank Mate                | `/cau-do/xe-chieu-het-hang-day-kinh-dien`       |
| **Xe**    | Cấp Xe: Chồng Hai Xe Thâm Nhập Cột Mở       | Doubled Rooks on Open File    | `/cau-do/xe-chong-hai-xe-tham-nhap-cot-mo`      |
| **Xe**    | Cấp Xe: Cắt Vua Bằng Xe Trong Tàn Cuộc      | Cutting Off                   | `/cau-do/xe-cat-vua-trong-tan-cuoc`             |
| **Hậu**   | Cấp Hậu: Phối Hợp Hậu Tượng Chiếu Hết h7    | Queen & Bishop Battery        | `/cau-do/hau-phoi-hop-hau-tuong-chieu-het-h7`   |
| **Hậu**   | Cấp Hậu: Chiếu Hết Scholar's Mate Nhanh Gọn | Checkmate in 1 (Qxf7#)        | `/cau-do/hau-chieu-het-scholars-mate-nhanh-gon` |
| **Hậu**   | Cấp Hậu: Đòn Thí Tượng Kéo Vua Đột Phá Hậu  | King Hunt Sacrifice           | `/cau-do/hau-don-thi-tuong-keo-vua-dot-pha-hau` |
| **Vua**   | Cấp Vua: Đòn Thí Hậu Chiếu Thắt Cổ          | Queen Sacrifice & Knight Mate | `/cau-do/vua-don-thi-hau-chieu-that-co`         |
| **Vua**   | Cấp Vua: Nghệ Thuật Đối Vua (Opposition)    | King Opposition & Zugzwang    | `/cau-do/vua-nghe-thuat-doi-vua-opposition`     |
| **Vua**   | Cấp Vua: Đòn Phối Hợp Anastasia's Mate      | Anastasia's Double Check      | `/cau-do/vua-don-phoi-hop-anastasia-mate`       |

---

### 3.2. Danh mục 4 Bài giảng tương tác nhiều bước

Mỗi bài giảng có 2 chế độ xem: **Chế độ Học viên** và **Chế độ Trình chiếu Máy chiếu (`/trinh-chieu`)**:

1. **Bài giảng 1: Khai cuộc Ý — Các nguyên lý phát triển quân cơ bản (5 bước)**
   - Link học viên: `/bai-giang/bai-giang-khai-cuoc-y-co-ban`
   - Link máy chiếu: `/bai-giang/bai-giang-khai-cuoc-y-co-ban/trinh-chieu`
2. **Bài giảng 2: Chiến thuật — Chiếu Mở & Chiếu Đôi Hủy Diệt (4 bước)**
   - Link học viên: `/bai-giang/bai-giang-don-chieu-mo-va-chieu-doi`
   - Link máy chiếu: `/bai-giang/bai-giang-don-chieu-mo-va-chieu-doi/trinh-chieu`
3. **Bài giảng 3: Tàn cuộc — Kỹ Thuật Chiếu Hết Bậc Thang Bằng 2 Xe (3 bước)**
   - Link học viên: `/bai-giang/bai-giang-ky-thuat-chieu-het-hai-xe`
   - Link máy chiếu: `/bai-giang/bai-giang-ky-thuat-chieu-het-hai-xe/trinh-chieu`
4. **Bài giảng 4: Khai cuộc — Bẫy Scholar's Mate (Chiếu Hết 4 Nước) & Cách Hóa Giải (3 bước)**
   - Link học viên: `/bai-giang/bai-giang-bay-scholars-mate`
   - Link máy chiếu: `/bai-giang/bai-giang-bay-scholars-mate/trinh-chieu`

---

### 3.3. Danh mục 6 Khóa học & Lộ trình 6 cấp độ

Thầy có thể truy cập `/courses` để xem toàn bộ danh mục khóa học hoặc vào từng khóa:

1. **Cờ Vua Cấp Tốt — Khóa Học Nhập Môn** (`/course/tot-nhap-mon`)
   - Bài 1: Làm Quen Bàn Cờ & Các Quân Cờ (`/lesson/tot-bai-1-nhap-mon-ban-co-quan-co`)
   - Bài 2: Quy Tắc Đi Quân & Ăn Quân Cơ Bản (`/lesson/tot-bai-2-quy-tac-di-quan-va-bat-quan`)
2. **Cờ Vua Cấp Mã — Chiến Thuật Sơ Cấp** (`/course/ma-so-cap`)
   - Bài 1: Đòn Tấn Công Đôi Của Quân Mã (`/lesson/ma-bai-1-don-bat-doi-cua-quan-ma`)
   - Bài 2: Đòn Chiếu Bắt Quân Nhẹ Trong Khai Cuộc (`/lesson/ma-bai-2-don-chieu-bat-quan-nhe`)
3. **Cờ Vua Cấp Tượng — Kỹ Năng Trung Cấp** (`/course/tuong-trung-cap`)
   - Bài 1: Nghệ Thuật Ghim Quân Tuyệt Đối (`/lesson/tuong-bai-1-don-ghim-quan-tuyet-doi`)
   - Bài 2: Đòn Chiếu Xuyên (Skewer) Bắt Quân Nặng (`/lesson/tuong-bai-2-don-chieu-xuyen-skewer`)
4. **Cờ Vua Cấp Xe — Chiến Thuật Nâng Cao** (`/course/xe-nang-cao`)
   - Bài 1: Kỹ Thuật Chiếu Hết Hàng Đáy (`/lesson/xe-bai-1-chieu-het-hang-day`)
   - Bài 2: Kiểm Soát Cột Mở & Thâm Nhập Hàng 7 (`/lesson/xe-bai-2-kiem-soat-cot-mo-va-hang-7`)
5. **Cờ Vua Cấp Hậu — Chiến Lược Chuyên Sâu** (`/course/hau-chuyen-sau`)
   - Bài 1: Phối Hợp Hậu & Tượng Tấn Công Điểm Yếu (`/lesson/hau-bai-1-phoi-hop-hau-tuong-tan-cong`)
   - Bài 2: Đòn Thí Hậu Đột Phá Chiến Lược (`/lesson/hau-bai-2-don-thi-hau-dot-pha-chien-luoc`)
6. **Cờ Vua Cấp Vua — Đỉnh Cao Kiện Tướng** (`/course/vua-kien-tuong`)
   - Bài 1: Nghệ Thuật Đối Vua (Opposition) Trong Tàn Cuộc (`/lesson/vua-bai-1-nghe-thuat-doi-vua-tan-cuoc`)
   - Bài 2: Đòn Phối Hợp Tuyệt Đỉnh Anastasia's Mate (`/lesson/vua-bai-2-don-phoi-hop-anastasia-mate`)

---

### 3.4. Danh mục 4 Gói Thẻ Thư Viện & Bảng giá

Truy cập trang đăng ký Thẻ Thư Viện tại `/plans`:

| Mã Gói              | Tên Gói Thẻ Thư Viện       | Thời Hạn  | Học Phí Niêm Yết | Quyền Lợi                                      |
| :------------------ | :------------------------- | :-------- | :--------------- | :--------------------------------------------- |
| `the-thang-30-ngay` | **Thẻ Tháng Tiêu Chuẩn**   | 30 ngày   | **99.000 đ**     | Mở khóa toàn bộ bài học Cấp Tốt & Cấp Mã       |
| `the-quy-90-ngay`   | **Thẻ Quý Học Đường**      | 90 ngày   | **249.000 đ**    | Mở khóa Cấp Tốt &rarr; Cấp Xe + Kho 500 câu đố |
| `the-nam-365-ngay`  | **Thẻ Năm Toàn Diện**      | 365 ngày  | **799.000 đ**    | Mở khóa trọn bộ 6 cấp độ + Bài kiểm tra HLV    |
| `the-kim-cuong-vip` | **Thẻ Kim Cương Trọn Đời** | Vĩnh viễn | **1.990.000 đ**  | Đặc quyền VIP + Tham gia giải đấu nội bộ       |

---

### 3.5. Kho giáo án mẫu Obsidian (.md)

Các file giáo án Markdown mẫu chuẩn bị sẵn để HLV thử nghiệm tính năng "Nhập từ Obsidian":

- [`packages/plugins/chess-lessons/tests/fixtures/sample_obsidian_lesson.md`](file:///D:/code/emdash/packages/plugins/chess-lessons/tests/fixtures/sample_obsidian_lesson.md) (Cấp Mã - Đòn tấn công đôi)
- [`packages/plugins/chess-lessons/tests/fixtures/sample_obsidian_tactics_bishop.md`](file:///D:/code/emdash/packages/plugins/chess-lessons/tests/fixtures/sample_obsidian_tactics_bishop.md) (Cấp Tượng - Ghim quân & Chiếu xuyên)
- [`packages/plugins/chess-lessons/tests/fixtures/sample_obsidian_endgame_rook.md`](file:///D:/code/emdash/packages/plugins/chess-lessons/tests/fixtures/sample_obsidian_endgame_rook.md) (Cấp Xe - Tàn cuộc Xe & Chiếu hết hàng đáy)

---

## 4. DÀNH CHO HỌC VIÊN & PHỤ HUYNH

### 4.1. Khám phá Khóa học & Học bài tương tác

1. Truy cập `/courses` để xem toàn bộ danh mục khóa học.
2. Chọn khóa học phù hợp với trình độ hiện tại của học viên.
3. Trong mỗi bài học (`/lesson/[slug]`):
   - Học lý thuyết qua hình ảnh và văn bản.
   - Thử nghiệm các nước đi trên bàn cờ tương tác FEN/PGN.
   - Làm câu đố tương tác ngay cuối bài học.

### 4.2. Giải câu đố chiến thuật & Câu đố mỗi ngày

1. Vào mục **"Câu đố"** (`/cau-do`).
2. Chọn cấp độ (Tốt, Mã, Tượng, Xe, Hậu, Vua) hoặc thử sức với **"Câu đố mỗi ngày"**.
3. Kéo thả quân cờ:
   - Đi đúng: Bàn cờ hiển thị màu xanh và tự động đáp trả nước tiếp theo của máy.
   - Đi sai: Bàn cờ báo đỏ, cho phép bấm **"Thử lại"** hoặc **"Xem gợi ý"**.

### 4.3. Đăng ký Thẻ Thư Viện qua VietQR tự động

1. Vào `/plans` &rarr; Chọn gói thẻ &rarr; Bấm **"Đăng ký ngay"**.
2. Tại trang thanh toán (`/checkout/[id]`):
   - Quét mã **VietQR** bằng ứng dụng ngân hàng bất kỳ.
   - Hệ thống SePay tự động nhận diện giao dịch qua Webhook trong 3–5 giây và nâng cấp tài khoản học viên lên gói **Subscriber** tức thì.

---

## 5. DÀNH CHO HUẤN LUYỆN VIÊN (HLV) & QUẢN TRỊ VIÊN

### 5.1. Khởi tạo hệ thống & Nạp dữ liệu mẫu 1 chạm

Vào trang quản trị CMS tại `/_emdash/admin`:

1. **LMS Settings:** Bấm **"Chạy LMS Setup"** để kích hoạt bảng CSDL khóa học và gói học.
2. **Quản lý Câu đố (`/plugins/chess-puzzles/puzzles`):**
   - Bấm **"Cài đặt CSDL (Setup)"**.
   - Bấm **"Nạp 6 câu đố mẫu (6 cấp)"** &rarr; Tự động nạp trọn bộ 18 câu đố chuẩn.
3. **Bài học cờ (`/plugins/chess-lessons/lessons`):**
   - Bấm **"Cài đặt CSDL (Setup)"**.
   - Bấm **"Khung lộ trình 6 cấp"** &rarr; Sinh 6 khóa học chuẩn Tốt &rarr; Vua kèm các bài học tương tác.
   - Bấm **"Nạp dữ liệu mẫu"** &rarr; Sinh 4 bài giảng tương tác nhiều bước.

### 5.2. Chế độ Trình chiếu trên lớp & Máy chiếu (Lecture Presenter)

Khi giảng dạy trên máy chiếu lớp học:

- Mở bất kỳ bài giảng nào và thêm `/trinh-chieu` vào đuôi URL (ví dụ: `/bai-giang/bai-giang-khai-cuoc-y-co-ban/trinh-chieu`).
- **Phím tắt điều khiển:**
  - `→` / `Space` / `PageDown`: Tiến tới bước tiếp theo.
  - `←` / `PageUp`: Lùi lại bước trước.
  - `B` (Blackout): Ẩn/Hiện bàn cờ để học sinh tập trung.
  - `F`: Bật/Tắt chế độ toàn màn hình.
- **Bảo mật:** Ghi chú HLV (Teacher Notes) chỉ hiển thị khi đăng nhập tài khoản HLV (Contributor trở lên). Khách hoặc học sinh xem sẽ hoàn toàn không thấy ghi chú trong mã nguồn HTML.

---

## 6. BẢNG TRA CỨU ĐƯỜNG DẪN (URL REFERENCE)

| Nhóm chức năng    | Đường dẫn (URL)                 | Mục đích                                |
| :---------------- | :------------------------------ | :-------------------------------------- |
| **Khóa học**      | `/courses`                      | Danh mục 6 khóa học theo lộ trình 6 cấp |
| **Chi tiết khóa** | `/course/[slug]`                | Chi tiết khóa học và danh mục bài học   |
| **Bài học**       | `/lesson/[slug]`                | Giao diện học bài tương tác             |
| **Câu đố**        | `/cau-do`                       | Ngân hàng câu đố & Câu đố mỗi ngày      |
| **Giải đố**       | `/cau-do/[slug]`                | Bàn cờ giải thế câu đố đơn lẻ           |
| **Bài giảng**     | `/bai-giang/[slug]`             | Bài giảng tương tác nhiều bước          |
| **Trình chiếu**   | `/bai-giang/[slug]/trinh-chieu` | Chế độ máy chiếu dành cho HLV           |
| **Gói học**       | `/plans`                        | Bảng giá Thẻ Thư Viện Cờ Vua Học Đường  |
| **Thanh toán**    | `/checkout/[orderId]`           | Trang quét mã VietQR SePay tự động      |
| **Quản trị CMS**  | `/_emdash/admin`                | Bảng điều khiển quản trị toàn diện      |

---

_Tài liệu được biên soạn và cập nhật tự động theo phiên bản phát hành mới nhất của Dương Sinh Chess Suite._
