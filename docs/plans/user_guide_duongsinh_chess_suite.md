# SỔ TAY HƯỚNG DẪN SỬ DỤNG VÀ TRẢI NGHIỆM DƯƠNG SINH CHESS SUITE

**Website:** [covuahocduong.com](https://covuahocduong.com)  
**Đơn vị phát triển:** Công ty CP Cờ vua Dương Sinh  
**Nền tảng:** EmDash CMS + Cloudflare Workers + D1 Database

---

## MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Hệ Thống 6 Cấp Độ Cờ Vua Dương Sinh](#2-hệ-thống-6-cấp-độ-cờ-vua-dương-sinh)
3. [Dành Cho Học Viên & Phụ Huynh](#3-dành-cho-học-viên--phụ-huynh)
   - 3.1. [Khám phá Khóa học & Lộ trình 6 cấp](#31-khám-phá-khóa-học--lộ-trình-6-cấp)
   - 3.2. [Học bài học tương tác & Bài giảng chuyên sâu](#32-học-bài-học-tương-tác--bài-giảng-chuyên-sâu)
   - 3.3. [Giải câu đố chiến thuật & Câu đố mỗi ngày](#33-giải-câu-đố-chiến-thuật--câu-đố-mỗi-ngày)
   - 3.4. [Đăng ký Thẻ Thư Viện qua chuyển khoản VietQR tự động](#34-đăng-ký-thẻ-thư-viện-qua-chuyển-khoản-vietqr-tự-động)
   - 3.5. [Làm bài trắc nghiệm & Theo dõi tiến độ](#35-làm-bài-trắc-nghiệm--theo-dõi-tiến-độ)
4. [Dành Cho Huấn Luyện Viên (HLV) & Quản Trị Viên](#4-dành-cho-huấn-luyện-viên-hlv--quản-trị-viên)
   - 4.1. [Khởi tạo hệ thống & Nạp dữ liệu mẫu 1 chạm](#41-khởi-tạo-hệ-thống--nạp-dữ-liệu-mẫu-1-chạm)
   - 4.2. [Soạn bàn cờ FEN/PGN trong bài viết (Portable Text Block)](#42-soạn-bàn-cờ-fenpgn-trong-bài-viết-portable-text-block)
   - 4.3. [Quản trị Kho câu đố & Nhập hàng loạt từ Lichess/EPD/PGN](#43-quản-trị-kho-câu-đố--nhập-hàng-loạt-từ-lichessepdpgn)
   - 4.4. [Xây dựng Bài giảng nhiều bước tương tác (Lecture Builder)](#44-xây-dựng-bài-giảng-nhiều-bước-tương-tác-lecture-builder)
   - 4.5. [Chế độ Trình chiếu trên lớp & Máy chiếu (Lecture Presenter)](#45-chế-độ-trình-chiếu-trên-lớp--máy-chiếu-lecture-presenter)
   - 4.6. [Nhập giáo án thần tốc từ Vault Obsidian (.md)](#46-nhập-giáo-án-thần-tốc-từ-vault-obsidian-md)
   - 4.7. [Quản lý Đơn hàng, Hội viên & Kích hoạt Thẻ Thư Viện](#47-quản-lý-đơn-hàng-hội-viên--kích-hoạt-thẻ-thư-viện)
5. [Bảng Tra Cứu Đường Dẫn (URL Reference)](#5-bảng-tra-cứu-đường-dẫn-url-reference)

---

## 1. TỔNG QUAN HỆ THỐNG

**Dương Sinh Chess Suite** là giải pháp LMS và quản trị nội dung cờ vua toàn diện cho trường học và câu lạc bộ cờ vua, gồm 5 phân hệ tích hợp:

- **@duongsinh/chess-kit:** Thư viện lõi xử lý cờ (chuẩn FEN, SAN, UCI, 6 cấp độ cờ, bàn cờ tương tác React không phụ thuộc GPL).
- **emdash-lms:** Hệ thống quản lý học tập (LMS), khóa học, chương bài, thanh toán học phí / Thẻ Thư Viện qua cổng SePay VietQR tự động.
- **plugin-chessfenpgn:** Khối nhúng thế cờ FEN và ván cờ PGN tương tác trực tiếp trong mọi bài viết CMS.
- **plugin-chess-puzzles:** Ngân hàng câu đố phân cấp 6 trình độ, câu đố mỗi ngày, bộ chấm nước đi tự động và nhập hàng loạt.
- **plugin-chess-lessons:** Bài giảng tương tác nhiều bước, ghi chú chuyên môn cho HLV, chế độ trình chiếu máy chiếu và nhập giáo án từ Obsidian.

---

## 2. HỆ THỐNG 6 CẤP ĐỘ CỜ VUA DƯƠNG SINH

Hệ thống được thiết kế theo thang phát triển chuẩn của Dương Sinh Chess, mã hóa đồng nhất trên toàn bộ website:

| Mã cấp (`id`) | Tên Cấp Độ             | Màu Sắc Nhận Diện         | Đối Tượng Phù Hợp       | Mô Tả                                         |
| :------------ | :--------------------- | :------------------------ | :---------------------- | :-------------------------------------------- |
| `tot`         | **Cấp Tốt (Pawn)**     | 🟢 `#10B981` (Xanh lá)    | Học viên mới bắt đầu    | Đi quân, bắt quân, luật cờ cơ bản             |
| `ma`          | **Cấp Mã (Knight)**    | 🔵 `#3B82F6` (Xanh dương) | Cơ bản (ELO ~800)       | Đòn chiến thuật cơ bản: Bắt đôi, chiếu mở     |
| `tuong`       | **Cấp Tượng (Bishop)** | 🟣 `#8B5CF6` (Tím)        | Trung cấp 1 (ELO ~1000) | Giằng quân, đòn chĩa, bẫy khai cuộc           |
| `xe`          | **Cấp Xe (Rook)**      | 🟠 `#F59E0B` (Cam)        | Trung cấp 2 (ELO ~1200) | Đòn phối hợp, tấn công cánh vua, tàn cuộc Xe  |
| `hau`         | **Cấp Hậu (Queen)**    | 🔴 `#EF4444` (Đỏ)         | Nâng cao (ELO ~1500)    | Chiến thuật phức hợp, đòn thí quân công phá   |
| `vua`         | **Cấp Vua (King)**     | 🟡 `#F59E0B` (Vàng kim)   | Chuyên sâu / Thi đấu    | Chiến lược đỉnh cao, nghệ thuật tính toán sâu |

---

## 3. DÀNH CHO HỌC VIÊN & PHỤ HUYNH

### 3.1. Khám phá Khóa học & Lộ trình 6 cấp

1. Truy cập trang chủ hoặc menu **"Khóa học"** (`/courses`).
2. Học viên thấy danh sách các khóa học được phân loại rõ ràng theo 6 cấp độ (Tốt, Mã, Tượng, Xe, Hậu, Vua).
3. Nhấp vào từng khóa học (`/course/[slug]`) để xem:
   - Mục tiêu bài học và độ tuổi phù hợp.
   - Danh sách các chương và từng bài học chi tiết.
   - Thử học các bài học miễn phí (bài học mở công khai).

### 3.2. Học bài học tương tác & Bài giảng chuyên sâu

1. Khi bấm vào một bài học (`/lesson/[slug]`):
   - **Nội dung đa phương tiện:** Bài viết kèm hình ảnh, video hướng dẫn.
   - **Bàn cờ tương tác:** Học viên có thể kéo thả quân trực tiếp trên bàn cờ để thử nghiệm các biến thể.
   - **Trình diễn ván cờ:** Bấm nút tới/lùi nước đi hoặc xem cây nước đi để hiểu sâu thế trận.
2. Bài giảng chuyên đề (`/bai-giang/[slug]`):
   - Học theo từng bước tuần tự.
   - Bàn cờ hiển thị mũi tên chỉ dẫn màu sắc và ô cờ nổi bật.
   - Sau khi đọc lời giải thích, bấm **"Bước tiếp theo"** để xem biến chuyển thế cờ.

### 3.3. Giải câu đố chiến thuật & Câu đố mỗi ngày

1. Truy cập mục **"Câu đố"** (`/cau-do`):
   - **Câu đố mỗi ngày (Daily Puzzle):** Thử thách mới mỗi ngày dành cho mọi học viên.
   - **Bộ lọc cấp độ:** Chọn cấp độ phù hợp (ví dụ: Cấp Tốt để rèn đòn Chiếu hết 1 nước; Cấp Mã rèn đòn Bắt đôi).
   - **Bộ lọc chủ đề:** Chiếu hết, Bắt đôi, Giằng quân, Tàn cuộc...
2. Trải nghiệm giải câu đố (`/cau-do/[slug]`):
   - Kéo quân đi nước cờ đúng.
   - Nếu đi đúng: Bàn cờ phát tín hiệu màu xanh và máy tự động đáp trả nước tiếp theo (nếu câu đố nhiều nước).
   - Nếu đi sai: Hệ thống báo đỏ và cho phép bấm nút **"Thử lại"** hoặc **"Xem gợi ý"**.

### 3.4. Đăng ký Thẻ Thư Viện qua chuyển khoản VietQR tự động

1. Truy cập mục **"Thẻ Thư Viện" / "Gói học"** (`/plans`).
2. Chọn gói Thẻ Thư Viện (Ví dụ: 1 tháng, 3 tháng, 1 năm).
3. Tại trang thanh toán (`/checkout/[id]`):
   - Hệ thống hiển thị mã **VietQR** chuẩn Napas 24/7 kèm Số tiền chính xác và Nội dung chuyển khoản tự động (ví dụ: `EMDASH ORDxxxxxx`).
4. Phụ huynh mở ứng dụng ngân hàng quét mã QR và chuyển khoản.
5. Ngay khi chuyển khoản thành công, hệ thống SePay tự động ghi nhận trong vòng 3–5 giây:
   - Tài khoản học viên tự động nâng cấp thành **Hội viên Thư Viện (Subscriber)**.
   - Tự động mở khóa toàn bộ bài học và kho câu đố nâng cao mà không cần chờ duyệt thủ công.

### 3.5. Làm bài trắc nghiệm & Theo dõi tiến độ

1. Cuối mỗi bài học có thể có bài trắc nghiệm (LMS Quiz).
2. Học viên chọn đáp án và bấm nộp bài để xem điểm số tức thì.
3. Khi hoàn thành bài học, bấm **"Đánh dấu hoàn thành"** để ghi nhận tiến độ và mở bài tiếp theo.

---

## 4. DÀNH CHO HUẤN LUYỆN VIÊN (HLV) & QUẢN TRỊ VIÊN

### 4.1. Khởi tạo hệ thống & Nạp dữ liệu mẫu 1 chạm

Khi thiết lập ban đầu hoặc cập nhật môi trường mới, HLV vào Quản trị CMS (`/_emdash/admin`):

1. **Khởi tạo CSDL LMS & Cổng thanh toán:**
   - Vào mục **LMS Settings** &rarr; Bấm **"Chạy LMS Setup"**.
2. **Khởi tạo CSDL Câu đố & Nạp 6 câu đố mẫu:**
   - Vào mục **Quản lý Câu đố** (`/plugins/chess-puzzles/puzzles`) &rarr; Bấm **"Cài đặt CSDL (Setup)"**.
   - Bấm nút **"Nạp 6 câu đố mẫu (6 cấp)"** &rarr; Hệ thống tự động tạo 6 câu đố chuẩn từ cấp Tốt đến cấp Vua.
3. **Khởi tạo Khung Lộ Trình 6 Cấp & Bài Học Mẫu:**
   - Vào mục **Bài học cờ** (`/plugins/chess-lessons/lessons`) &rarr; Bấm **"Cài đặt CSDL (Setup)"**.
   - Bấm **"Khung lộ trình 6 cấp"** &rarr; Tự động sinh 6 khóa học chuẩn Tốt &rarr; Vua.
   - Bấm **"Nạp dữ liệu mẫu"** &rarr; Tự động sinh khóa học "Nhập Môn Khai Cuộc Cờ Vua", 3 bài học kèm bài giảng và trắc nghiệm.

---

### 4.2. Soạn bàn cờ FEN/PGN trong bài viết (Portable Text Block)

Khi viết bài giảng, bài tin tức hoặc giáo trình trong EmDash Editor:

1. Trong trình soạn thảo văn bản, nhấn nút thêm khối (Block) và chọn **"Bàn cờ FEN/PGN"** (`chess-board`).
2. Có 2 chế độ hiển thị:
   - **Thế cờ tĩnh (FEN):** Dán chuỗi FEN hoặc dùng bàn cờ trực quan để xếp quân. Hỗ trợ vẽ mũi tên chỉ dẫn (ví dụ: `e2e4`, `g1f3`) và tô sáng ô cờ.
   - **Ván cờ động (PGN):** Dán biên bản ván cờ PGN. Học viên có thể bấm từng nước đi để xem diễn biến ván cờ.

---

### 4.3. Quản trị Kho câu đố & Nhập hàng loạt từ Lichess/EPD/PGN

#### Soạn câu đố đơn lẻ trực quan:

1. Vào **Nội dung** &rarr; **Kho câu đố** (`ec_chess_puzzles`) &rarr; **Tạo mới**.
2. Tại trường **Dữ liệu thế cờ & Nước đi (Puzzle Editor)**:
   - **Tab 1 - Xếp thế cờ:** Kéo thả quân lên bàn cờ để tạo thế bắt đầu, hoặc dán chuỗi FEN.
   - **Tab 2 - Ghi nước đi:** Kéo đi nước cờ đúng trực tiếp trên bàn cờ. Bộ ghi nước đi sẽ tự động lưu chuỗi nước giải (Solution).
   - **Tab 3 - Thử nghiệm:** Tự chơi thử để kiểm tra tính chính xác của câu đố.
3. Chọn Cấp độ (Tốt &rarr; Vua) và Chủ đề chiến thuật &rarr; Bấm **Xuất bản (Publish)**.

#### Nhập hàng loạt (Bulk Importer):

1. Vào mục **"Nhập câu đố"** (`/plugins/chess-puzzles/import`).
2. Chọn định dạng nguồn:
   - **Lichess CSV:** Hỗ trợ định dạng xuất chuẩn từ Lichess (`PuzzleId,FEN,Moves,Rating,Themes...`).
   - **EPD:** Chuỗi thế cờ EPD chuẩn quốc tế có chứa `bm` (Best move).
   - **PGN:** File ván cờ PGN có ghi chú biến thế câu đố.
3. Chọn file hoặc dán nội dung văn bản &rarr; Chọn cấp độ mặc định &rarr; Bấm **"Bắt đầu nhập dữ liệu"**.
4. Hệ thống hỗ trợ nạp tối đa 500 câu/lần với báo cáo lỗi chi tiết từng dòng.

---

### 4.4. Xây dựng Bài giảng nhiều bước tương tác (Lecture Builder)

Dành cho các chuyên đề chiến thuật hoặc bài giảng mở màn phức tạp:

1. Vào **Nội dung** &rarr; **Bài giảng cờ vua** (`ec_chess_lectures`) &rarr; **Tạo mới**.
2. Điền Tiêu đề, Chọn cấp độ và Khóa học liên kết.
3. Tại công cụ **Lecture Builder**:
   - Nhấn **"+ Thêm bước mới"**: Bước sau sẽ tự động kế thừa thế cờ của bước trước.
   - Điền **Lời giảng (Narration):** Lời HLV giải thích cho học sinh.
   - Điền **Ghi chú HLV (Teacher Notes):** Các bẫy tâm lý, câu hỏi gợi mở dành riêng cho HLV (bảo mật tuyệt đối, học sinh không bao giờ thấy).
   - Điền **Mũi tên & Ô sáng:** Tô đậm các đòn đánh mấu chốt.
   - Tùy chọn **Câu hỏi tương tác:** Yêu cầu học sinh tìm nước đi đúng trước khi chuyển bước.
4. Bấm **Lưu & Xuất bản**.

---

### 4.5. Chế độ Trình chiếu trên lớp & Máy chiếu (Lecture Presenter)

Khi HLV giảng dạy trực tiếp trên lớp có máy chiếu hoặc màn hình tương tác:

1. Mở bài giảng bất kỳ và thêm `/trinh-chieu` vào sau đường dẫn (ví dụ: `https://covuahocduong.com/bai-giang/nhap-mon-don-bat-doi/trinh-chieu`).
2. **Các phím tắt điều khiển bàn cờ:**
   - `→` hoặc `PageDown` hoặc `Phím Cách (Space)`: Tiến tới bước tiếp theo.
   - `←` hoặc `PageUp`: Quay lui lại bước trước.
   - `B` (Blackout): Ẩn bàn cờ tạm thời để học sinh tập trung nghe giảng hoặc giải bài tập trên bảng giấy. Bấm `B` lần nữa để hiện lại.
   - `F`: Bật/Tắt chế độ toàn màn hình (Fullscreen).
3. **Đồng hồ bấm giờ (Timer):** Tích hợp sẵn trên góc màn hình để đếm giờ làm bài cho học sinh.
4. **Bảo mật chuyên môn:**
   - Khi tài khoản HLV đăng nhập: Màn hình hiển thị khung _Ghi chú Huấn luyện viên (Teacher Notes)_.
   - Nếu là học sinh hoặc khách vãng lai: Toàn bộ ghi chú chuyên môn bị loại bỏ từ phía máy chủ, hoàn toàn không có trong mã nguồn HTML.

---

### 4.6. Nhập giáo án thần tốc từ Vault Obsidian (.md)

HLV có thể soạn toàn bộ giáo án trên ứng dụng **Obsidian** rồi nhập trực tiếp vào hệ thống:

1. Cấu trúc file Markdown chuẩn:

````markdown
---
title: Đòn Tấn Công Cánh Vua
course: trung-cap-chien-thuat
module: Chương 2: Các Đòn Đột Phá
order: 1
level: tuong
themes: ["tan-cong-canh-vua", "thi-quan"]
objectives: ["Nắm vững cấu trúc tốt f7/h7", "Cách phối hợp Hậu và Mã"]
---

# Mở đầu bài học

Chào các bạn, hôm nay chúng ta sẽ tìm hiểu đòn tấn công vào vị trí nhập thành của Vua đối phương.

```fen
r1bq1rk1/pppp1ppp/2n5/4p3/2B1P3/3P1N2/PPP2PPP/R1BQK2R w KQ - 0 6
arrows: c4f7
highlights: f7
```
````

Hãy chú ý vào ô f7, đây là điểm yếu chí tử...

```

2. Vào mục **"Nhập từ Obsidian"** trong trang quản trị &rarr; Tải file `.md` lên &rarr; Hệ thống tự động tạo bài học nháp, phân bổ đúng khóa học và chương bài.

---

### 4.7. Quản lý Đơn hàng, Hội viên & Kích hoạt Thẻ Thư Viện
1. **Xem danh sách đơn hàng:** Vào **LMS** &rarr; **Orders** để theo dõi các giao dịch mua thẻ.
2. **Trường hợp học viên chuyển khoản qua quầy hoặc tiền mặt:**
   - HLV/Admin tìm mã đơn hàng &rarr; Bấm **"Xác nhận thanh toán (Mark as Paid)"**.
   - Hệ thống tự động cấp quyền Hội viên cho học viên ngay lập tức.
3. **Quản lý học viên:** Vào **LMS** &rarr; **Enrollments** để xem thời hạn Thẻ Thư Viện và tiến độ học tập của từng học viên.

---

## 5. BẢNG TRA CỨU ĐƯỜNG DẪN (URL REFERENCE)

### Dành cho Khách & Học viên
| Đường dẫn (URL) | Chức năng |
| :--- | :--- |
| `/courses` | Danh sách toàn bộ khóa học cờ vua 6 cấp độ |
| `/course/[slug]` | Chi tiết khóa học và danh mục bài học |
| `/lesson/[slug]` | Giao diện học bài học tương tác |
| `/cau-do` | Ngân hàng câu đố cờ vua & Câu đố mỗi ngày |
| `/cau-do/[slug]` | Chi tiết câu đố và bàn cờ giải thế |
| `/bai-giang/[slug]` | Bài giảng chuyên đề nhiều bước |
| `/plans` | Bảng giá Thẻ Thư Viện Cờ Vua Học Đường |
| `/checkout/[orderId]` | Trang thanh toán quét mã VietQR tự động |

### Dành cho Huấn luyện viên & Quản trị viên
| Đường dẫn (URL) | Chức năng |
| :--- | :--- |
| `/_emdash/admin` | Bảng điều khiển quản trị CMS chính |
| `/plugins/chess-puzzles/puzzles` | Quản lý ngân hàng câu đố & Nạp câu đố mẫu |
| `/plugins/chess-puzzles/import` | Nhập câu đố hàng loạt (CSV/EPD/PGN) |
| `/plugins/chess-lessons/lessons` | Quản trị bài học & Khung lộ trình 6 cấp |
| `/plugins/chess-lessons/obsidian` | Nhập giáo án từ file Markdown Obsidian |
| `/bai-giang/[slug]/trinh-chieu` | Chế độ trình chiếu bài giảng trên máy chiếu lớp học |

---
*Tài liệu được cập nhật tự động đồng bộ theo phiên bản phát hành mới nhất của Dương Sinh Chess Suite.*
```
