
# Báo cáo Giai đoạn 1: Khảo sát Kiến trúc

## Tổng quan Kiến trúc
EmDash là một hệ thống CMS trên nền Astro. Thay vì chỉ là một thư viện, nó hoạt động dưới dạng **Astro Integration**, chèn thêm các route API, Admin UI, và middleware vào một ứng dụng Astro.
Cấu trúc Monorepo (pnpm) phân chia rõ ràng:
- \packages/core\: Chứa \mdash-runtime.ts\ (trái tim hệ thống), các API handlers, cấu hình DB (Kysely), Storage.
- \packages/admin\: Là ứng dụng React SPA, được nhúng vào \/_emdash/admin/\ để làm giao diện quản trị. Chứa các file locale, components (Kumo).
- \packages/cloudflare\ / \uth\ / \locks\: Chứa adapter, auth, text editor data structures (Portable Text).
- \demos/\: Chứa các ứng dụng demo nghiệm thu. Đặc biệt \demos/simple\ (package \mdash-demo\) dùng Node.js + SQLite cục bộ, lý tưởng để thử nghiệm tại local.

## Các khái niệm cốt lõi (Core Concepts)
1. **Schema-driven Database**: Dữ liệu schema (Collections, Fields) được lưu trực tiếp trong DB (\_emdash_collections\, \_emdash_fields\). Bảng dữ liệu thật được sinh ra linh động dạng \c_posts\, \c_products\.
2. **Plugin Sandbox**: Plugin có khả năng khai báo quyền (\capabilities\) và được chạy qua \Worker Loaders\ hoặc an toàn tại local.
3. **Storage Abstraction**: Hệ thống File (Upload) được trừu tượng hoá qua \Storage\ interface, hỗ trợ R2, S3, hoặc Local.
4. **Localization (i18n)**: Ứng dụng hỗ trợ đa ngôn ngữ nội dung bằng mô hình 1 row per locale (dùng \	ranslation_group\). Giao diện quản trị dùng Lingui để dịch.

## Kết luận Giai đoạn 1
Hệ thống EmDash có kiến trúc vô cùng hiện đại, phân tách layer tốt và có định hướng tích hợp AI (ví dụ MCP servers).
Chúng ta đã sẵn sàng bước sang Giai đoạn 2: Cài đặt và Seed dữ liệu cho \mdash-demo\.

