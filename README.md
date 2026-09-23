# DistribuHub Marketplace B2B

Aplikasi modular TanStack Start untuk katalog pengadaan kemasan B2B. Fondasi saat ini menggunakan PostgreSQL, Drizzle, Zod, server functions, dan data demo persisten.

## Prasyarat

- Node.js 22.12 atau lebih baru
- pnpm 12.3.4
- PostgreSQL 16 atau lebih baru (`pg_config`, `initdb`, `pg_ctl`, `psql`, dan `createdb` tersedia)
- Chromium Playwright untuk pengujian browser

## Setup lokal

```sh
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm db:setup
pnpm dev
```

Buka `http://localhost:3000/catalog`. `pnpm db:setup` membuat cluster privat di `.local/postgres`, memakai Unix socket tanpa listener TCP, menjalankan migration, lalu mengisi fixture demo. Menjalankan ulang seed mempertahankan perubahan sah pada harga, tier, dan stok.

Perintah database:

```sh
pnpm db:start
pnpm db:status
pnpm db:migrate
pnpm db:seed
pnpm db:stop
```

`pnpm db:stop` hanya menghentikan PostgreSQL dan tidak menghapus data. `DATABASE_URL` bersifat server-only. Seed ke database yang dikonfigurasi melalui `DATABASE_URL` memerlukan `ALLOW_DEMO_SEED=true` dan selalu ditolak saat `NODE_ENV=production`.

## Pemeriksaan

```sh
pnpm generate-routes
pnpm test
pnpm test:e2e
pnpm typecheck
pnpm lint
pnpm check
pnpm build
```

`pnpm test` menjalankan unit test dan integration test serial pada cluster privat `.local/postgres-test` dengan database acak berawalan `marketplace_b2b_test_`; database tersebut dihapus setelah test. `pnpm test:e2e` memakai database unik pada cluster test yang sama dan server khusus port 3001. Restart test tidak menghentikan cluster demo `.local/postgres` atau memakai database `marketplace_demo`.

Jika Chromium Playwright belum tersedia:

```sh
pnpm exec playwright install chromium
```

## Struktur utama

- `src/domain/`: kontrak katalog, validasi produk, dan aturan harga all-units.
- `src/server/db/`: koneksi, schema, seed, dan guard seed.
- `src/server/catalog.server.ts`: query katalog publik dan batas visibilitas.
- `src/routes/catalog.tsx`: katalog; `src/routes/catalog_.$productId.tsx`: detail produk.
- `drizzle/`: migration database berversi.
- `tests/unit/`: test aturan domain dan guard.
- `tests/integration/`: migration, constraint, seed, katalog, privasi, dan persistensi.
- `e2e/`: test SSR dan interaksi browser.

## Batas implementasi

Katalog hanya menampilkan produk aktif dari perusahaan aktif dengan supplier berstatus approved, inventory tersedia, dan tier harga yang memenuhi aturan publikasi. Respons publik tidak memuat email, alamat privat, atau dokumen verifikasi.

Autentikasi, sesi, CRUD supplier, cart, checkout, pembayaran, fulfillment, RFQ, dan notifikasi belum menjadi fitur aktif. Status terbaru dan urutan pekerjaan terdapat di `DEVELOPMENT_SCOPE.md`; riwayat frontend awal terdapat di `BASELINE.md`; keputusan arsitektur terdapat di `docs/backend-foundation.md`.
