# DistribuHub frontend baseline

Baseline berjalan di scaffold TanStack Start yang sudah ada, tanpa backend atau autentikasi nyata.

## Menjalankan

Gunakan pnpm (lockfile utama: `pnpm-lock.yaml`). Pertahankan nilai environment lokal yang sudah ada; untuk checkout baru, salin `.env.example` ke `.env.local`, lalu jalankan:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`VITE_APP_NAME` wajib berupa string nonkosong dan `VITE_GRAPHQL_URL` wajib berupa URL. Keduanya adalah konfigurasi publik. GraphQL client hanya disiapkan, tidak mengirim request selama demo.

## Struktur

- `src/routes/dashboard.tsx`: shared layout; `dashboard.index.tsx` dan `dashboard.*.tsx`: nested pages.
- `src/components/layout/`: sidebar, mobile sheet, header, dan layout dashboard.
- `src/components/products/`: TanStack Table v9 (`useTable`), kolom, dan TanStack Form.
- `src/components/ui/`: tujuh komponen shadcn; menggunakan utility `src/lib/utils.ts` yang sudah tersedia.
- `src/data/products.ts`: enam produk typed, terpisah dari UI.
- `src/data/dashboard.ts`: ringkasan dan aktivitas demo.
- `src/lib/format.ts`: formatter Rupiah.
- `src/env.ts`, `src/lib/graphql-client.ts`: validasi T3Env dan client GraphQL.
- `src/router.tsx`: QueryClient baru per instance router agar cache tidak dibagi antar-request SSR.

Route: `/`, `/login`, `/catalog`, `/dashboard`, `/dashboard/products`, `/dashboard/orders`, `/dashboard/inventory`, `/dashboard/customers`.

Produk tambahan hanya berada di state halaman produk; meninggalkan atau memuat ulang halaman mengembalikan data awal. Ringkasan dashboard tetap memakai fixture. Login/logout dan edit merupakan demonstrasi. Stok menipis berarti stok kurang dari 20, termasuk produk habis.

## Pemeriksaan dan batasan

```sh
pnpm generate-routes
pnpm typecheck
pnpm lint
pnpm build
pnpm start
```

Route tree dihasilkan oleh CLI/plugin, bukan diedit manual. `pnpm start` adalah preview lokal hasil build Vite pada `dist/`; adapter deployment produksi belum ditambahkan. Script scaffold sebelumnya menunjuk `.output/server` yang tidak dihasilkan konfigurasi ini, dan build berisi operator shell HTML-escaped.

Script test dan test runner belum tersedia. Pengujian browser sementara memeriksa route, pencarian, empty state, validasi form, penambahan produk, drawer mobile, dan console.

`pnpm check` memeriksa seluruh repository dan masih melaporkan format file scaffold lama yang tidak terkait baseline. File implementasi diperiksa format secara terpisah. ESLint tidak memeriksa output generate Paraglide, route tree, dan build; aturan source tetap aktif.

Peer warnings bawaan: `graphql-request@7.4.0` menyatakan GraphQL 14–16 sementara dependency pengguna adalah GraphQL 17; `@eslint/js@10` mengharapkan ESLint 10 sementara scaffold memakai ESLint 9. Versi pengguna dipertahankan. Selaraskan kompatibilitas GraphQL sebelum integrasi backend. Konfigurasi MCP, Sentry, dan Paraglide dari scaffold dipertahankan; tidak ada integrasi baru ditambahkan.

Langkah berikutnya: sepakati kontrak API produk dan autentikasi, lalu ganti sumber data lokal dengan query/mutation GraphQL dan tambahkan pengujian integrasi permanen.
