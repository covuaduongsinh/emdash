# 27. Cơ sở dữ liệu (SQLite/PostgreSQL/D1)

Áp dụng cho vai trò: Quản trị viên/Vận hành, Lập trình viên

## Tổng quan

EmDash hỗ trợ nhiều database backend — chọn theo mục tiêu triển khai:

| Database | Phù hợp nhất cho | Triển khai |
| --- | --- | --- |
| **D1** | Cloudflare Workers | Edge, phân tán toàn cầu |
| **Hyperdrive** | PostgreSQL trên Cloudflare Workers | Edge, dùng Postgres có sẵn |
| **PostgreSQL** | Production Node.js | Mọi nền tảng có Postgres |
| **libSQL** | Database từ xa | Edge hoặc Node.js |
| **SQLite** | Node.js, dev cục bộ | Máy chủ đơn |

## Cloudflare D1

D1 là database SQLite serverless của Cloudflare (đã dùng trong ví dụ ở [Chương 25](./25-trien-khai-cloudflare.md)):

```js title="astro.config.mjs"
import { d1 } from "@emdash-cms/cloudflare";

emdash({
	database: d1({ binding: "DB" }),
}),
```

| Tuỳ chọn | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `binding` | `string` | — | Tên binding D1 trong `wrangler.jsonc` |
| `session` | `string` | `"disabled"` | Chế độ read replication (xem lại Chương 25, mục Read Replica) |
| `bookmarkCookie` | `string` | `"__em_d1_bookmark"` | Tên cookie cho bookmark session |

> EmDash chạy migration lõi tự động theo mặc định ở request đầu tiên sau triển khai, hoặc một lần deploy có thể áp dụng chúng từ build manifest trước khi nhận traffic. Bạn phải tự khởi tạo database D1 riêng — xem mục "Quản lý Migration lõi" bên dưới.

## libSQL

libSQL là bản fork của SQLite hỗ trợ kết nối từ xa — dùng khi cần database từ xa mà không qua Cloudflare D1:

```js title="astro.config.mjs"
import { libsql } from "emdash/db";

emdash({
	database: libsql({
		url: process.env.LIBSQL_DATABASE_URL,
		authToken: process.env.LIBSQL_AUTH_TOKEN,
	}),
}),
```

| Tuỳ chọn | Kiểu | Mô tả |
| --- | --- | --- |
| `url` | `string` | URL database (`libsql://...` hoặc `file:...`) |
| `authToken` | `string` | Token xác thực runtime cho database từ xa (tuỳ chọn với database cục bộ) |
| `migrationAuthTokenEnv` | `string` | Tên biến chứa token migration (mặc định `TURSO_AUTH_TOKEN`) |

Dùng file libSQL cục bộ khi phát triển: `database: libsql({ url: "file:./data.db" })`.

## PostgreSQL

Hỗ trợ cho triển khai Node.js cần database quan hệ đầy đủ:

```js title="astro.config.mjs"
import { postgres } from "emdash/db";

emdash({
	database: postgres({
		connectionString: process.env.DATABASE_URL,
	}),
}),
```

Kết nối bằng connection string hoặc tham số riêng lẻ (`host`, `port`, `database`, `user`, `password`, `ssl`, `pool.min`/`pool.max`, `migrationConnectionStringEnv`).

> Cần cài package `pg`: `pnpm add pg`.

### Yêu cầu quyền role database

EmDash tự tạo và cập nhật bảng PostgreSQL của riêng nó. Migration lõi tạo/sửa bảng hệ thống và collection, content type tạo bảng `ec_*`, thêm/xoá field sửa bảng collection tương ứng. Role PostgreSQL cấu hình do đó cần **thẩm quyền schema trong suốt vòng đời site**, không chỉ lúc thiết lập ban đầu.

Dùng **một role chuẩn (canonical)** duy nhất cho EmDash. Role đó cần: `CONNECT` trên database; `USAGE` và `CREATE` trên schema đang dùng; quyền sở hữu (ownership) mọi bảng/hàm của EmDash (trực tiếp hoặc qua thành viên có `INHERIT` từ role sở hữu); và `SELECT`/`INSERT`/`UPDATE`/`DELETE` trên các bảng đó. Role **không cần** là superuser, không cần `CREATEDB`/`CREATEROLE`, không cần tạo extension. PostgreSQL không có quyền `ALTER`/`DROP` bảng cấp riêng — các thao tác đó thuộc về chủ sở hữu đối tượng; cấp `ALL` cho một role khác không biến role đó thành chủ sở hữu.

> **Giữ role ổn định:** PostgreSQL gán mỗi đối tượng cho role đã tạo ra nó. Dùng một role không hết hạn cho kết nối chính của EmDash — xoay vòng mật khẩu của cùng role vẫn an toàn, nhưng đổi user trong `DATABASE_URL` sang role khác **không** chuyển giao các đối tượng đã có; role thay thế có thể đọc/ghi được nhưng vẫn lỗi `must be owner of table` ở migration tiếp theo.

Hầu hết cài đặt dùng schema có sẵn của database (thường là `public`) — đơn giản nhất khi database dành riêng cho EmDash:

```sql
GRANT CONNECT ON DATABASE app TO emdash_app;
GRANT USAGE, CREATE ON SCHEMA public TO emdash_app;
```

EmDash dùng `current_schema()` hiện có của PostgreSQL — không tự tạo schema hay đặt `search_path`, nên cần xác minh kết nối trước khi triển khai bằng câu lệnh kiểm tra `current_database()`, `session_user`, `current_user`, `current_schema()`, `search_path`.

Dùng schema riêng (tuỳ chọn) khi EmDash dùng chung database với ứng dụng khác, hoặc muốn cách ly khỏi `public` — dễ cấu hình nhất trước lần setup EmDash đầu tiên. Việc này **không** tự di chuyển một cài đặt có sẵn từ `public`, cũng không tự sửa quyền sở hữu lẫn lộn (mixed ownership) — site có sẵn nên giữ nguyên schema hiện tại thay vì đổi.

### Connection Pooling

Adapter dùng `pg.Pool` bên dưới — điều chỉnh kích thước pool theo triển khai:

```js
database: postgres({
	connectionString: process.env.DATABASE_URL,
	pool: { min: 2, max: 20 },
});
```

## Hyperdrive (PostgreSQL trên Cloudflare Workers)

Dùng adapter `hyperdrive()` để chạy EmDash trên **Cloudflare Workers**, dựa trên PostgreSQL (hoặc tương thích, vd PlanetScale Postgres) có sẵn. [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) pool và tăng tốc kết nối qua mạng Cloudflare; dialect PostgreSQL của EmDash chạy truy vấn.

```js title="astro.config.mjs"
import { hyperdrive, r2 } from "@emdash-cms/cloudflare";

emdash({
	database: hyperdrive({ binding: "HYPERDRIVE" }),
	storage: r2({ binding: "MEDIA" }),
}),
```

**Yêu cầu:** `pg >= 8.16.3` (`pnpm add pg`), `compatibility_flags: ["nodejs_compat"]`, `compatibility_date >= "2024-09-23"`.

**Thiết lập:** chuẩn bị role PostgreSQL (như mục trên) → tạo cấu hình Hyperdrive với connection string của role đó → thêm binding vào `wrangler.jsonc`:

```sh
wrangler hyperdrive create emdash-db \
  --connection-string "postgres://user:password@host/db?sslmode=verify-full" \
  --caching-disabled
```

> **Bắt buộc tắt query cache trên binding chính:** cache của Hyperdrive **mặc định bật** và **phải tắt** cho binding EmDash chính. EmDash chạy tầng cache riêng và cần tính nhất quán "đọc-sau-ghi" (read-after-write) — admin và setup wizard ghi một dòng rồi đọc lại ngay. Nếu cache còn bật, Hyperdrive có thể trả kết quả trước-khi-ghi trong TTL của nó, làm hỏng setup (vd "collection already exists" rồi bảng tạo dở dang) và hiện nội dung cũ cho editor.

**Tuỳ chọn:**

| Tuỳ chọn | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `binding` | `string` | `"HYPERDRIVE"` | Tên binding Hyperdrive chính (đã tắt cache) |
| `cachedBinding` | `string` | — | Binding có bật cache tuỳ chọn cho đọc ẩn danh |
| `preferUncachedAfterWriteMs` | `number` | `60000`* | Sau khi publish nội dung, ưu tiên `binding` (không cache) trong khoảng ms này cho đọc công khai ẩn danh |
| `migrationConnectionStringEnv` | `string` | tự sinh theo binding | Biến môi trường chứa URL PostgreSQL gốc trực tiếp, dùng cho `emdash migrate` |
| `max` | `number` | `5` | Kích thước tối đa pool kết nối trong Worker tới Hyperdrive |

\* Chỉ áp dụng khi có `cachedBinding`.

**Phục vụ đọc ẩn danh từ cache (tuỳ chọn nâng cao):** vì request công khai ẩn danh (`GET`/`HEAD`) chịu được một khoảng "cũ" (staleness) ngắn, có thể chạy **hai cấu hình Hyperdrive trên cùng database**: một tắt cache (binding chính) và một bật cache (`cachedBinding`). EmDash tự định tuyến: đọc ẩn danh trang công khai → binding có cache (trừ khoảng thời gian ngắn sau khi publish); request đã xác thực, mutation, và mọi request dưới `/_emdash` → luôn dùng binding không cache; migration → luôn dùng binding chính.

> Cả hai cấu hình nên dùng **cùng một role** PostgreSQL, database, và schema.
>
> **Plugin sandboxed chỉ hoạt động với D1** — sandbox plugin bridge nói chuyện trực tiếp với binding D1, độc lập với adapter đã cấu hình, nên plugin sandboxed **không khả dụng** trên triển khai dùng Hyperdrive.

### Sửa quyền sở hữu PostgreSQL lẫn lộn (nâng cao)

Nếu một site từng dùng nhiều user PostgreSQL khác nhau, các bảng/hàm của EmDash có thể thuộc sở hữu của nhiều role khác nhau, gây lỗi `must be owner of table` khi migrate. Cách xử lý: chọn một role chuẩn, sao lưu database, kiểm tra chủ sở hữu từng bảng/hàm (`pg_class`/`pg_proc` join `pg_namespace`), rồi chuyển quyền sở hữu từng đối tượng lệch bằng `ALTER TABLE ... OWNER TO ...` / `ALTER FUNCTION ... OWNER TO ...` (dùng tên đủ schema). Đây là thao tác nâng cao, nên thực hiện với vai trò superuser hoặc role quản trị của nhà cung cấp — **không** dùng `REASSIGN OWNED` trừ khi role cũ dành riêng hoàn toàn cho database EmDash này, vì lệnh đó đổi chủ sở hữu **mọi** đối tượng của role trong database hiện tại, kể cả đối tượng không liên quan.

## SQLite

Dùng driver database tích hợp sẵn của Node.js — lựa chọn đơn giản nhất cho triển khai Node.js (đã dùng ở [Chương 26](./26-trien-khai-nodejs.md)):

```js title="astro.config.mjs"
import { sqlite } from "emdash/db";

emdash({
	database: sqlite({ url: "file:./data.db" }),
}),
```

`url` phải bắt đầu bằng `file:` — đường dẫn tương đối, tuyệt đối, hoặc từ biến môi trường (`file:${process.env.DATABASE_PATH}`). SQLite cần hệ thống tệp bền vững — không hoạt động trên nền tảng lưu trữ tạm thời (ephemeral) nếu không cấu hình thêm.

## Migration

EmDash chạy migration lõi tự động theo mặc định cho mọi dialect được hỗ trợ. Build/sync Astro cũng sinh ra một file `.emdash/migrations.json` đã xác thực, không chứa secret, mà `emdash migrate` có thể áp dụng trước khi triển khai. SQLite, libSQL, PostgreSQL, D1, và PostgreSQL gốc đứng sau Hyperdrive đều có executor triển khai riêng.

Với PostgreSQL, migration runtime chạy qua kết nối đã cấu hình; migration runtime của Hyperdrive luôn dùng binding chính. Migration quản lý theo triển khai (deployment-managed) của Hyperdrive kết nối trực tiếp tới PostgreSQL gốc. Migration lõi có thể tạo bảng/index/hàm, sửa/xoá cột và ràng buộc, cập nhật dòng có sẵn — một role chỉ kết nối/sửa dòng mà không sở hữu đối tượng EmDash hiện có là **không đủ**. Setup wizard **không thể** tự sửa quyền database bị thiếu vì migration runtime chạy trước setup.

Nếu database rỗng (chưa có Collection) và setup wizard chưa hoàn tất, EmDash cũng áp dụng seed file khi khởi động lần đầu — đọc từ `.emdash/seed.json`, đường dẫn trong `package.json#emdash.seed`, hoặc `seed/seed.json` (tuỳ file nào tìm thấy trước), inline vào build lúc biên dịch. Không có file nào thì dùng seed mặc định tích hợp sẵn. Lần khởi động sau vào database đã có sẵn nội dung sẽ giữ nguyên, không áp lại seed.

### Cấu hình theo môi trường

```js title="astro.config.mjs"
import { sqlite, libsql, postgres } from "emdash/db";
import { d1 } from "@emdash-cms/cloudflare";

const database = import.meta.env.PROD ? d1({ binding: "DB" }) : sqlite({ url: "file:./data.db" });

emdash({ database }),
```

## Thay đổi mô hình nội dung trên site đã triển khai (Evolving a Deployed Site)

EmDash lưu Collection, Field, Taxonomy trong database, cạnh chính nội dung. Deploy code mới **không** thay đổi mô hình nội dung đó — nhưng phiên bản EmDash mới có thể migrate bảng database do EmDash quản lý ở request đầu tiên.

### 4 luồng thay đổi khác nhau

| Luồng | Thay đổi gì | Cách thực hiện |
| --- | --- | --- |
| Sửa nội dung | Entry, media, settings | Admin panel hoặc Content API |
| Deploy code | Template, cấu hình, phiên bản EmDash | `wrangler deploy` — có thể migrate bảng do EmDash quản lý |
| Bootstrap lần đầu | Mọi thứ, từ rỗng | Migration + seed file + setup wizard, tự động lúc khởi động lần đầu |
| Thay đổi schema | Collection, field, taxonomy | Admin panel hoặc `emdash schema` trên site đang chạy |

Seed file chỉ tham gia vào luồng thứ ba — áp dụng **một lần** khi database rỗng và setup chưa hoàn tất. Deploy một seed file đã đổi vào database có sẵn **không có tác dụng gì** — thay đổi schema của site đang chạy luôn thực hiện qua admin panel hoặc API.

> Migration lõi cập nhật bảng nội bộ của EmDash và cấu trúc vật lý của bảng collection — **không** thêm/xoá Collection, Field, hay Taxonomy của bạn.

### Đổi schema trong admin panel

Cách chính để thay đổi mô hình một site đã triển khai. Mở **Content Types**, thêm/sửa/xoá Collection và Field — thay đổi có hiệu lực ngay lập tức (xem lại Chương 17). Sau khi đổi, sinh lại TypeScript type — lệnh `emdash types` đọc schema từ một instance đang chạy, có thể trỏ thẳng vào site đã triển khai:

```bash
npx emdash types --url https://example.com
```

### Đổi schema từ CLI

Lệnh `emdash schema` nói chuyện với instance đang chạy qua REST API, hoạt động với site đã triển khai giống hệt với dev cục bộ:

```bash
npx emdash login --url https://example.com
```

Hoặc tạo API token trong admin dưới **Settings → API Tokens**, truyền qua `--token` hoặc biến môi trường `EMDASH_TOKEN` — hữu ích cho CI.

```bash
npx emdash schema add-field posts subtitle --type string --label "Subtitle" --url https://example.com
npx emdash schema remove-field posts legacy_field --url https://example.com
npx emdash schema create projects --label Projects --url https://example.com
```

Vì đây là lệnh CLI thuần, có thể script hoá — một "migration" nội dung lặp lại được có thể là một shell script gồm nhiều lệnh `emdash schema`, đưa vào repo và chạy tuần tự trên từng môi trường.

> Xoá một field sẽ xoá cả cột và dữ liệu của nó — luôn test thay đổi schema trên môi trường preview trước khi chạy trên production.

### Giữ Seed File đồng bộ

Seed file nhúng trong build quyết định một database **mới** sẽ khởi tạo thành gì — môi trường preview mới, dựng lại sau thảm hoạ, hoặc một lần triển khai thứ hai của cùng site. Nếu seed vẫn mô tả blog mẫu ban đầu trong khi production đã tiến hoá thành thứ khác, mọi môi trường mới sẽ bootstrap sai mô hình.

Sau khi thay đổi schema của site đã triển khai, xuất mô hình đang chạy ngược lại vào repo:

```bash
npx wrangler d1 export emdash-db --remote --output=./prod.sql
sqlite3 prod.db < prod.sql
npx emdash export-seed --database prod.db > .emdash/seed.json
```

Seed xuất ra chứa settings, collection, taxonomy, menu, và widget area của site đang chạy. Thêm `--with-content` để gồm cả entry. Commit `.emdash/seed.json` đã cập nhật cùng với code phụ thuộc vào schema mới, để môi trường mới luôn bootstrap đúng mô hình mà code hiểu được.

### Diễn tập thay đổi trên môi trường Preview

Thay đổi schema mang tính phá huỷ (xoá field, tái cấu trúc Collection) an toàn nhất khi diễn tập trên một bản sao production dùng-một-lần:

1. Thêm môi trường preview với database D1 riêng vào `wrangler.jsonc`.
2. Sao chép production vào đó: `wrangler d1 export` rồi `wrangler d1 execute ... --file=./prod.sql`.
3. Deploy và chạy thay đổi schema trên URL preview.
4. Xác nhận site render đúng và admin hoạt động như mong đợi, rồi chạy đúng các lệnh đó trên production.

### Khắc phục khi đi sai hướng

- **Xoá nhầm một field:** cột và dữ liệu đã mất khỏi database đang chạy — khôi phục từ D1 Time Travel (xem lại [Chương 22](./22-sao-luu-phuc-hoi.md)), hoặc thêm lại field và khôi phục giá trị từ một bản `wrangler d1 export` cũ hơn.
- **Môi trường mới bootstrap sai mô hình:** seed nhúng đã cũ hoặc thiếu — cập nhật `.emdash/seed.json`, build lại, trỏ deploy vào database rỗng để bootstrap lại.
- **Schema và template không khớp:** deploy và thay đổi schema độc lập với nhau, nên sắp thứ tự có chủ đích — thay đổi cộng thêm (Collection mới, field tuỳ chọn mới) đi trước, rồi mới tới code dùng chúng; với việc xoá, deploy code ngừng dùng field trước, rồi mới xoá field.

## Quản lý Migration lõi (nâng cao — CI/CD)

Migration lõi cập nhật bảng của riêng EmDash và cột chuẩn trên bảng nội dung — **không** tạo/xoá/đổi tên Collection và Field của bạn (xem mục "Evolving a Deployed Site" ở trên cho việc đó).

Chế độ migration runtime mặc định là `auto`, nên triển khai có sẵn tiếp tục tự áp dụng migration lõi còn chờ khi khởi động. Migration quản lý theo triển khai cho phép một lần build migrate database trước khi code ứng dụng mới nhận traffic, rồi để runtime xác minh hoặc tin tưởng bước triển khai đó.

### Quy trình Build → Migrate → Deploy → Check

Một lần build/sync Astro ghi ra `.emdash/migrations.json` — manifest không chứa secret, ghi lại đúng phiên bản EmDash, tập migration theo thứ tự, cấu hình locale, và executor migration của adapter dùng cho build đó.

> Thêm `.emdash/migrations.json` vào `.gitignore` — job triển khai sinh và dùng file này từ workspace build, không thuộc về source control.

```bash
pnpm build
pnpm emdash migrate --status
```

Sau khi xác nhận target đúng là database dự định, bắt đầu migration tương tác — xem lại target một lần nữa tại prompt trước khi xác nhận:

```bash
pnpm emdash migrate
pnpm wrangler deploy
pnpm emdash migrate --check
```

`--status` báo cáo migration đã áp dụng/đang chờ/không rõ mà **không** thay đổi database. `emdash migrate` (không cờ) hiện target và hỏi xác nhận trước khi áp dụng migration đang chờ. `--check` **không bao giờ** áp dụng migration và thoát khác 0 khi có migration đã biết đang chờ hoặc database chứa bản ghi migration lạ (không rõ với build) — dùng khi cần kiểm tra tự động (CI).

Apply không tương tác và mọi apply có `--json` **bắt buộc** `--expected-target-fingerprint` — lệnh thất bại nếu target resolve không khớp. Dùng các cờ này trong job triển khai tự động, không dùng cho luồng tương tác ở trên.

### Chọn database tường minh (theo adapter)

| Adapter | Target trong manifest | Biến credential mặc định | Override hữu ích |
| --- | --- | --- | --- |
| SQLite | Đường dẫn database hoặc URL `file:` | — | `--database <path>` |
| libSQL | URL công khai | `TURSO_AUTH_TOKEN` | Cấu hình `migrationAuthTokenEnv` |
| PostgreSQL | Tên biến kết nối | `DATABASE_URL` | `--database-url-env <name>` |
| Cloudflare D1 | Tên binding Wrangler | `CLOUDFLARE_API_TOKEN` | `--d1`, `--account-id`, `--wrangler-config`, `--wrangler-env` |
| Hyperdrive | Binding chính và tên biến origin | Biến origin trực tiếp riêng theo binding | Cấu hình `migrationConnectionStringEnv` |

### Khởi tạo D1 trước khi migrate

Tạo database D1 và migrate schema của nó là hai thao tác **tách biệt** — `emdash migrate` không bao giờ tự tạo database còn thiếu:

1. Khởi tạo database, ghi lại UUID production: `pnpm wrangler d1 create my-site-production`.
2. Thêm UUID đó vào binding và environment dự định trong `wrangler.jsonc`.
3. Build site để binding D1 được ghi vào `.emdash/migrations.json`.
4. Đặt account ID và API token có quyền D1 Edit. Kiểm tra target đã chọn, rồi chạy migration tương tác — chỉ xác nhận prompt khi account và database khớp đúng production.

### Cấu hình migration D1 trong CI

D1 không có khoá migration cố vấn (advisory lock) như PostgreSQL — chỉ chạy **tối đa một** job migration cho mỗi cặp account + database UUID. Đặt secret `CLOUDFLARE_API_TOKEN` (quyền D1 Edit) và biến `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `EMDASH_TARGET_FINGERPRINT` (fingerprint in ra từ `emdash migrate --status` sau khi đã xem lại account/database cục bộ) trong môi trường CI. Ví dụ workflow GitHub Actions (rút gọn từ tài liệu gốc, đủ đầy đủ để tham khảo):

```yaml title=".github/workflows/deploy.yml"
name: Deploy
on:
  workflow_dispatch:
concurrency:
  group: emdash-migrations-${{ vars.CLOUDFLARE_ACCOUNT_ID }}-${{ vars.D1_DATABASE_ID }}
  cancel-in-progress: false
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Inspect EmDash migration target
        env: { CLOUDFLARE_API_TOKEN: "${{ secrets.CLOUDFLARE_API_TOKEN }}" }
        run: pnpm emdash migrate --status --json --account-id "${{ vars.CLOUDFLARE_ACCOUNT_ID }}" --d1 "${{ vars.D1_DATABASE_ID }}"
      - name: Apply EmDash migrations
        env:
          CLOUDFLARE_API_TOKEN: "${{ secrets.CLOUDFLARE_API_TOKEN }}"
          EMDASH_TARGET_FINGERPRINT: "${{ vars.EMDASH_TARGET_FINGERPRINT }}"
        run: pnpm emdash migrate --account-id "${{ vars.CLOUDFLARE_ACCOUNT_ID }}" --d1 "${{ vars.D1_DATABASE_ID }}" --expected-target-fingerprint "$EMDASH_TARGET_FINGERPRINT"
      - run: pnpm wrangler deploy
      - name: Check EmDash migrations
        env: { CLOUDFLARE_API_TOKEN: "${{ secrets.CLOUDFLARE_API_TOKEN }}" }
        run: pnpm emdash migrate --check --account-id "${{ vars.CLOUDFLARE_ACCOUNT_ID }}" --d1 "${{ vars.D1_DATABASE_ID }}"
```

> Chỉ cập nhật `EMDASH_TARGET_FINGERPRINT` sau khi đã xem lại target thay đổi cục bộ — thay đổi mà không kiểm tra sẽ mất đi lớp bảo vệ chống migrate nhầm database.

### Hyperdrive kết nối trực tiếp tới origin

Executor migration của Hyperdrive mở kết nối PostgreSQL trực tiếp tới origin — **không** gửi traffic migration qua Hyperdrive, không dùng cached binding tuỳ chọn. Runner triển khai phải tới được origin — đặt `migrationConnectionStringEnv` trên `hyperdrive()` khi biến mặc định theo binding không phù hợp, và chỉ cấp biến đó cho job migration.

### Áp dụng dần enforcement lúc runtime

```js title="astro.config.mjs"
emdash({
	database,
	migrations: {
		runtime: "check",
		dev: "auto",
	},
});
```

- `auto` — mặc định tương thích ngược. Runtime tự kiểm tra và áp dụng migration đang chờ khi khởi động.
- `check` — chỉ query trạng thái một chiều, trả 503 trước khi phục vụ request nếu có migration đã biết đang chờ. Chấp nhận bản ghi từ build tương thích mới hơn trong lúc rolling deployment.
- `manual` — không tự migrate hay query trạng thái lúc runtime. Chỉ dùng sau khi pipeline triển khai đã áp dụng và kiểm tra mọi build một cách đáng tin cậy.

`EMDASH_MIGRATIONS_MODE` có thể override chế độ runtime khi cùng một artifact được đưa qua nhiều môi trường. Lộ trình chuyển đổi thận trọng: `auto` khi mới đưa job triển khai vào → `check` khi job đã ổn định → `manual` khi có kiểm tra ngoài bắt buộc cho mọi lần triển khai.

### Tương thích trong lúc Rolling Deploy

Migration lõi theo trình tự expand/deploy/contract — một lần triển khai có thể tạm thời chạy song song isolate cũ và mới trên cùng database đã "expand", và một backfill có thể vẫn đang chạy. **Không "contract" schema** tới khi mọi phiên bản đã triển khai ngừng dùng phần đó.

## Xử lý sự cố Migration

| Vấn đề | Cách xử lý |
| --- | --- |
| Không tìm thấy migration manifest | Build/sync dự án trước; dùng `--manifest` cho vị trí khác chuẩn |
| Artifact không khớp EmDash của dự án | Rebuild và deploy ứng dụng cùng manifest với nhau; chạy CLI của dự án, không dùng bản cài global |
| Target thiếu hoặc mơ hồ | Khởi tạo target trước, rồi cung cấp rõ đường dẫn database/tên biến kết nối/selector D1 |
| Target fingerprint thay đổi | Dừng lại, xem kỹ account/environment/database hiển thị; chỉ cập nhật fingerprint mong đợi sau khi xác nhận đúng target |
| Có bản ghi migration lạ | Không xoá bản ghi hay chạy lại apply — xác nhận đúng phiên bản artifact và điều tra xem có build khác/mới hơn đã migrate database |
| Kết quả ghi D1 mơ hồ | Không chạy lại lệnh migration — chạy `emdash migrate --status` để kiểm tra, báo cáo lên nếu migration dừng giữa chừng |
| Hyperdrive không kết nối được | Test khả năng truy cập từ deployment runner tới origin PostgreSQL, xác minh biến origin trực tiếp |

## Xem thêm

- [Chương 17 — Xây dựng Loại nội dung (Content Types Builder)](./17-content-types-builder.md)
- [Chương 22 — Sao lưu và phục hồi dữ liệu](./22-sao-luu-phuc-hoi.md)
- [Chương 25 — Triển khai lên Cloudflare Workers](./25-trien-khai-cloudflare.md)
- [Chương 26 — Triển khai trên Node.js](./26-trien-khai-nodejs.md)
- [Chương 33 — Tổng quan công cụ cho dev: CLI, API, MCP](./33-tong-quan-cong-cu-dev.md)
- [Chương 48 — Seed Files](./48-seed-files.md)
