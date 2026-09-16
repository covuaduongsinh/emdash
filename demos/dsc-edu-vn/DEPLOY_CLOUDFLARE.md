# Triển khai Website dsc.edu.vn lên Cloudflare (Workers, D1, R2)

Website **dsc.edu.vn** được xây dựng trên kiến trúc Astro + EmDash CMS tương thích 100% với hạ tầng Cloudflare Serverless Edge.

---

## 1. Yêu cầu chuẩn bị (Prerequisites)

1. Cài đặt **Wrangler CLI** (nếu chưa có):
   ```bash
   pnpm add -g wrangler
   # hoặc
   npm install -g wrangler
   ```

2. Đăng nhập tài khoản Cloudflare:
   ```bash
   wrangler login
   ```

---

## 2. Khởi tạo Cơ sở dữ liệu D1 & Storage R2 trên Cloudflare

Chạy các lệnh sau từ terminal:

```bash
# 1. Tạo cơ sở dữ liệu Cloudflare D1
wrangler d1 create dsc_db

# 2. Tạo bucket Cloudflare R2 để lưu trữ hình ảnh/media
wrangler r2 bucket create dsc-media
```

*Lưu ý*: Sau khi tạo D1, Cloudflare sẽ trả về `database_id`. Hãy dán ID đó vào file `demos/dsc-edu-vn/wrangler.jsonc`:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "dsc_db",
    "database_id": "<DÁN_DATABASE_ID_CỦA_BẠN_VÀO_ĐÂY>"
  }
]
```

---

## 3. Khởi tạo Schema Database trên Cloudflare D1

Chạy migration để tạo các bảng hệ thống và bảng nội dung:
```bash
# Di chuyển vào thư mục dự án
cd demos/dsc-edu-vn

# Khởi tạo DB trên Cloudflare (Remote)
# EmDash tự động chạy migration khi khởi động lần đầu trên Cloudflare
```

---

## 4. Biên dịch & Triển khai (Deploy)

Chạy lệnh build và deploy trực tiếp:
```bash
# Set target Cloudflare và biên dịch
$env:DEPLOY_TARGET="cloudflare"
pnpm --filter dsc-edu-vn build

# Triển khai lên Cloudflare Workers
cd demos/dsc-edu-vn
wrangler deploy
```

---

## 5. Trỏ Tên miền dsc.edu.vn

1. Truy cập Cloudflare Dashboard -> **Workers & Pages** -> Chọn Worker `dsc-edu-vn`.
2. Vào tab **Settings** -> **Domains & Routes** -> Nhấn **Add Custom Domain**.
3. Nhập:
   - `dsc.edu.vn`
   - `www.dsc.edu.vn`
4. Cloudflare sẽ tự động cấu hình DNS và cấp phát SSL miễn phí.
