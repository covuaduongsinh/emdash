# Kế hoạch: Viết Sổ tay Hướng dẫn Sử dụng EmDash (Tiếng Việt)

## Bối cảnh

Dự án `D:\code\emdash` là **EmDash** — một CMS dạng tích hợp Astro (định vị là "WordPress hiện đại xây lại từ đầu"), gồm: gói `emdash` cắm vào site Astro có sẵn, một admin panel React SPA (`/_emdash/admin`), REST API, CLI (`emdash`/`em`), và MCP server tuỳ chọn. Triển khai trên Cloudflare Workers (D1+R2) hoặc Node.js (SQLite/PostgreSQL).

Dự án đã có bộ docs kỹ thuật (Starlight) khá đầy đủ tại `docs/src/content/docs/`, nhưng đó là tài liệu tham khảo rời rạc theo từng tính năng, viết bằng tiếng Anh, xen lẫn nội dung cho dev và cho người dùng cuối. Người dùng cần một **cuốn sổ tay hướng dẫn sử dụng thống nhất, bằng tiếng Việt**, tổng hợp và biên soạn lại toàn bộ tư liệu này thành một tài liệu mạch lạc, bao quát **đầy đủ mọi vai trò**: người biên tập nội dung không kỹ thuật, quản trị viên/vận hành, và lập trình viên (viết plugin/theme, dùng CLI/API/MCP).

Vì khối lượng nội dung lớn (51 chương dự kiến, ~26.000 dòng tư liệu nguồn quy đổi), việc triển khai phải được **chia giai đoạn** để chạy qua nhiều phiên làm việc mà không quá tải ngữ cảnh, kèm cơ chế báo cáo và bàn giao giữa các phiên.

**Xác nhận với người dùng:** Ngôn ngữ sổ tay = **Tiếng Việt** (giữ nguyên thuật ngữ kỹ thuật/tên tính năng tiếng Anh khi cần). Phạm vi = **Đầy đủ mọi vai trò kể cả dev** (biên tập viên, quản trị/vận hành, lập trình viên plugin/theme).

## Quy trình tổng thể (4 bước tự động nối tiếp)

1. **Kế hoạch này** → người dùng duyệt qua ExitPlanMode.
2. **Tự động viết Đề cương chi tiết** (`book/01-DE-CUONG.md`) — mục lục đầy đủ 51 chương, tóm tắt mỗi chương, nguồn tư liệu tham chiếu, bảng thuật ngữ tạm. Không cần duyệt lại riêng — viết xong là chuyển tiếp luôn sang bước 3.
3. **Tự động viết từng chương theo giai đoạn** — mỗi giai đoạn xử lý một nhóm chương liên quan (xem bảng giai đoạn bên dưới), viết xong tạo báo cáo giai đoạn.
4. **Bàn giao khi cần** — nếu giữa chừng một giai đoạn có nguy cơ quá tải ngữ cảnh hoặc hết quota, dừng lại và viết file bàn giao kèm prompt dán sẵn cho phiên mới, thay vì cố viết tiếp cho hết.

## Cấu trúc thư mục sản phẩm

```
docs/plans/
└── 2026-09-02-so-tay-huong-dan-su-dung-emdash.md   # bản kế hoạch này, chép vào repo làm nguồn tham chiếu lâu dài

book/
├── 01-DE-CUONG.md                    # đề cương/mục lục toàn sách — "nguồn sự thật" về cấu trúc
├── chuong/
│   ├── 01-emdash-la-gi.md
│   ├── 02-cai-dat-lan-dau.md
│   ├── ...
│   └── 51-cau-hoi-thuong-gap.md      # đặt tên: <NN>-<slug-khong-dau>.md, NN khớp số chương trong đề cương
├── giai-doan/
│   ├── GD01-nhap-mon-cai-dat.md      # việc cần làm chi tiết cho từng giai đoạn (viết trước khi thực thi giai đoạn đó)
│   └── ... (GD02 .. GD12)
├── bao-cao/
│   ├── GD01-BAO-CAO.md               # báo cáo kết quả sau khi hoàn thành mỗi giai đoạn
│   └── ...
└── ban-giao/
    └── BAN-GIAO-GD<NN>-<mo-ta>.md    # chỉ tạo khi phải dừng giữa chừng một giai đoạn; kèm prompt dán sẵn
```

## Danh sách 51 chương (5 Phần)

**Phần I — Nhập môn & Cài đặt** (mọi vai trò)
1. EmDash là gì và dành cho ai — `introduction.mdx`, `why-emdash.mdx`
2. Cài đặt lần đầu và Trình cài đặt (Setup Wizard) — `getting-started.mdx`, `TEMPLATES.md`
3. Thêm EmDash vào dự án Astro có sẵn — `existing-project.mdx`
4. So sánh với WordPress / Astro thuần — `coming-from/wordpress.mdx`, `coming-from/astro.mdx`, `coming-from/astro-for-wp-devs.mdx`
5. Các khái niệm cốt lõi (bản đồ thuật ngữ) — `concepts/collections.mdx`, `concepts/content-model.mdx`

**Phần II — Dành cho người biên tập nội dung**
6. Làm quen giao diện quản trị (Admin Panel) — `concepts/admin-panel.mdx` + ảnh chụp màn hình
7. Đăng nhập không mật khẩu bằng Passkey — `guides/authentication.mdx`, `guides/atmosphere-auth.mdx`
8. Soạn thảo nội dung và Portable Text — `guides/working-with-content.mdx`
9. Thư viện Media — `guides/media-library.mdx`
10. Menu điều hướng — `guides/menus.mdx`
11. Widget & Vùng Widget — `guides/widgets.mdx`
12. Phân loại nội dung (Taxonomies) — `guides/taxonomies.mdx`
13. Xem trước (Preview) trước khi xuất bản — `guides/preview.mdx`
14. Cài đặt trang web (Site Settings) — `guides/site-settings.mdx`
15. Chế độ tối & tuỳ biến giao diện quản trị — `guides/dark-mode.mdx`
16. Đa ngôn ngữ cho nội dung — `guides/internationalization.mdx`

**Phần III — Dành cho quản trị viên / vận hành**
17. Xây dựng Loại nội dung (Content Types Builder) — `concepts/collections.mdx` (phần builder), `reference/field-types.mdx`
18. Bố cục trang & Section — `guides/page-layouts.mdx`, `guides/sections.mdx`
19. Quản lý người dùng, vai trò và quyền hạn — phần Roles trong `guides/authentication.mdx`
20. Cài đặt & Quản lý Plugin (người dùng cuối) — `plugins/overview.mdx`, `installing.mdx`, `registry.mdx`, `registry-client.mdx`, `upgrading-sites.mdx`
21. Chủ đề (Themes) — cài đặt và tuỳ biến cơ bản — `themes/overview.mdx`
22. Sao lưu và phục hồi dữ liệu — `guides/backups.mdx`
23. Di chuyển từ WordPress — `migration/from-wordpress.mdx`, `themes/porting-wp-themes.mdx`
24. Nhập nội dung từ nguồn khác — `migration/content-import.mdx`
25. Triển khai lên Cloudflare Workers — `deployment/cloudflare.mdx`, `deployment/storage.mdx`
26. Triển khai trên Node.js — `deployment/nodejs.mdx`, `deployment/storage.mdx`
27. Cơ sở dữ liệu (SQLite/PostgreSQL/D1) — `deployment/database.mdx`, `schema-evolution.mdx`, `core-migrations.mdx`
28. Bí mật cấu hình & biến môi trường — `deployment/secrets.mdx`
29. Bộ nhớ đệm đối tượng (Object Cache) — `deployment/object-cache.mdx`
30. Nâng cấp phiên bản EmDash — `deployment/updating.mdx`
31. Thanh toán tích hợp x402 — `guides/x402-payments.mdx`
32. Công cụ AI tích hợp sẵn — `guides/ai-tools.mdx`

**Phần IV — Dành cho lập trình viên**
33. Tổng quan công cụ cho dev: CLI, API, MCP — `reference/cli.mdx`
34. Truy vấn nội dung trong code Astro — `guides/querying-content.mdx`
35. REST API tham chiếu — `reference/rest-api.mdx`, `reference/api.mdx`
36. Cấu hình EmDash (`emdash.config`) — `reference/configuration.mdx`
37. Hooks & vòng đời sự kiện — `reference/hooks.mdx`
38. Máy chủ MCP cho AI Agent — `reference/mcp-server.mdx`
39. Viết Plugin đầu tiên (sandboxed) — `creating-plugins/choosing-a-format.mdx`, `your-first-plugin.mdx`, `manifest.mdx`
40. API Routes & Capabilities của Plugin — `creating-plugins/api-routes.mdx`, `capabilities.mdx`, `hooks.mdx`
41. Giao diện Plugin: Block Kit, Field Kit, Settings — `creating-plugins/block-kit.mdx`, `plugins/field-kit.mdx`, `creating-plugins/settings.mdx`
42. Lưu trữ dữ liệu Plugin & CLI plugin — `creating-plugins/storage.mdx`, `creating-plugins/cli.mdx`
43. Phát hành Plugin lên Registry — `creating-plugins/publishing.mdx`, `migrating-to-the-cli.mdx`
44. Plugin Native (nâng cao) — `creating-native-plugins/your-first-native-plugin.mdx`, `react-admin.mdx`
45. Plugin Native: Page Fragments & Portable Text Components — `page-fragments.mdx`, `portable-text-components.mdx`, `distributing.mdx`
46. Chuyển đổi Plugin WordPress sang EmDash — `migration/porting-plugins.mdx`
47. Xây dựng Theme từ đầu — `themes/creating-themes.mdx`
48. Seed Files — dữ liệu khởi tạo cho Theme — `themes/seed-files.mdx`

**Phần V — Phụ lục**
49. Bảng thuật ngữ đối chiếu Anh–Việt — tổng hợp toàn sách
50. Lịch sử tính năng theo phiên bản — `packages/core/CHANGELOG.md`
51. Câu hỏi thường gặp & khắc phục sự cố — tổng hợp từ các đoạn troubleshooting rải rác + README

*Loại khỏi sổ tay (tài liệu kiến trúc/đóng góp code, không phải hướng dẫn sử dụng):* `concepts/architecture.mdx`, `contributing/*`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/technical-specs/*`.

## Chia giai đoạn triển khai (13 giai đoạn)

| Giai đoạn | Nội dung | Chương |
|---|---|---|
| GĐ0 | Viết Đề cương chi tiết toàn sách | — |
| GĐ1 | Phần I — Nhập môn & Cài đặt | 1–5 |
| GĐ2 | Phần II.A — Admin Panel, Đăng nhập, Soạn thảo, Media | 6–9 |
| GĐ3 | Phần II.B — Menu, Widget, Taxonomy, Preview, Settings, Dark mode, i18n | 10–16 |
| GĐ4 | Phần III.A — Content Types, Layout, Users/Roles, Plugin (end-user), Theme cơ bản | 17–21 |
| GĐ5 | Phần III.B — Sao lưu, Di chuyển WP, Nhập nội dung | 22–24 |
| GĐ6 | Phần III.C — Triển khai (Cloudflare, Node.js, DB, Secrets, Object Cache, Updating) | 25–30 |
| GĐ7 | Phần III.D — x402 Payments, AI Tools | 31–32 |
| GĐ8 | Phần IV.A — CLI/API/Config/Hooks/MCP (có thể tách GĐ8a/GĐ8b nếu quá tải — CLI+Config+Hooks / REST API+MCP) | 33–38 |
| GĐ9 | Phần IV.B — Viết Plugin sandboxed (từ đầu đến publish) | 39–43 |
| GĐ10 | Phần IV.C — Plugin Native + Porting Plugin WP | 44–46 |
| GĐ11 | Phần IV.D — Xây dựng Theme + Seed Files | 47–48 |
| GĐ12 | Phần V — Phụ lục (Thuật ngữ, Changelog, FAQ) + rà soát nhất quán toàn sách | 49–51 |

Mỗi giai đoạn (trừ GĐ0): trước khi viết chương, tạo file `giai-doan/GD<NN>-*.md` nêu rõ danh sách chương, nguồn `.mdx` cụ thể, thuật ngữ cần tái sử dụng. Sau khi viết xong toàn bộ chương trong giai đoạn, tạo `bao-cao/GD<NN>-BAO-CAO.md` (file đã tạo, vấn đề phát sinh, việc tồn đọng). Nếu phải dừng giữa chừng một giai đoạn do quá tải/hết quota, tạo `ban-giao/BAN-GIAO-GD<NN>-*.md` ghi rõ chương nào xong/dở dang, kèm khối prompt sẵn để dán vào phiên mới (prompt phải chỉ định: đọc file bàn giao này + `01-DE-CUONG.md` trước, rồi tiếp tục đúng điểm dang dở).

## Checklist chất lượng cho mỗi chương (nhắc lại trong từng file giai đoạn)

- **Đối chiếu nguồn:** mọi tính năng nêu ra phải truy được về đúng file `.mdx` nguồn; không suy diễn/bịa tính năng không có trong docs; code mẫu (CLI, REST endpoint, config) copy chính xác cú pháp từ nguồn; nếu nguồn không rõ, ghi chú "chưa xác nhận trong tài liệu gốc".
- **Nhất quán thuật ngữ:** đối chiếu bảng thuật ngữ tạm trong `01-DE-CUONG.md` (sau GĐ12 là chương 49 chính thức); tên vai trò (Subscriber/Contributor/Author/Editor/Admin), trạng thái (draft/published/scheduled), đường dẫn admin panel giữ nguyên tiếng Anh xuyên suốt.
- **Định dạng:** mỗi chương mở đầu bằng `# <Số>. <Tên chương>` + dòng "Áp dụng cho vai trò: ..."; cấu trúc heading con thống nhất (Tổng quan / Các bước thực hiện / Lưu ý / Xem thêm); không để sót "TODO"/"[cần bổ sung]" — thiếu thật thì ghi vào báo cáo giai đoạn, không giấu trong chương.
- **Liên kết:** link chéo dùng đường dẫn tương đối trong `book/chuong/`; không link tới chương chưa tồn tại (ghi "sẽ có ở phần sau" thay vì link chết).

## Kiểm chứng

- Sau mỗi giai đoạn: đọc lại từng chương vừa viết, đối chiếu với file `.mdx` nguồn tương ứng để xác nhận không có thông tin bịa đặt; kiểm tra format nhất quán theo checklist trên.
- Cuối GĐ12: rà soát toàn cục — kiểm tra mọi liên kết chéo giữa 51 chương hoạt động đúng, bảng thuật ngữ chương 49 khớp với cách dùng thực tế trong các chương trước, đối chiếu `01-DE-CUONG.md` đã đánh dấu đủ 51/51 chương "Đã xong".
- Người dùng có thể mở bất kỳ file `book/chuong/*.md` nào để đọc thử và yêu cầu chỉnh sửa trực tiếp trong quá trình triển khai.
