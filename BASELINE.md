# DistribuHub frontend baseline

Baseline berjalan di scaffold TanStack Start yang sudah ada, tanpa backend atau autentikasi nyata.

## Catatan pekerjaan dari awal

Pekerjaan dimulai dengan membaca struktur scaffold, `package.json`, konfigurasi TypeScript, Vite, routing, environment, konfigurasi shadcn, dan status Git. Perubahan pengguna yang sudah ada di `package.json` dan `pnpm-lock.yaml` dipertahankan. Package manager yang digunakan adalah pnpm karena repository memiliki `pnpm-lock.yaml`; repository tidak diubah menjadi monorepo dan remote Git tidak diubah.

Audit dependency menemukan TanStack Query, TanStack Table, GraphQL, `graphql-request`, T3Env, Tailwind, dan konfigurasi shadcn sudah tersedia. TanStack Form belum tersedia, sehingga hanya `@tanstack/react-form` yang ditambahkan secara langsung. Komponen shadcn yang dibutuhkan kemudian ditambahkan: button, card, input, label, badge, table, dan sheet. Dependency `cn` serta dependency UI yang tidak diperlukan dihapus atau diarahkan ke utility `src/lib/utils.ts` yang sudah dimiliki scaffold.

Environment publik disiapkan melalui `.env.example` dan `.env.local`. `VITE_APP_NAME` divalidasi sebagai string nonkosong dan `VITE_GRAPHQL_URL` sebagai URL. `.env.local` tetap di-ignore Git dan nilai Sentry lokal yang sudah ada tidak disentuh. Client `graphql-request` dibuat sebagai persiapan integrasi backend, tetapi tidak dipakai untuk data demo.

Landing page DistribuHub, halaman login visual, dan placeholder katalog dibuat lebih dulu. Setelah itu dibuat route parent `/dashboard` dengan nested route untuk dashboard utama, produk, pesanan, persediaan, dan pelanggan. Route tree kemudian dibuat ulang menggunakan generator TanStack Router; file hasil generator tidak diedit manual.

Data produk distributor makanan dan minuman dipisahkan ke `src/data/products.ts` dengan tipe `Product`, enam SKU unik, status aktif/nonaktif, dan aturan stok menipis di bawah 20. Ringkasan dan aktivitas dashboard diletakkan di `src/data/dashboard.ts`. Utility `formatRupiah` dipisahkan ke `src/lib/format.ts`.

Dashboard dibagi menjadi sidebar desktop, header, layout bersama, dan sheet navigasi mobile. Navigasi memiliki indikator route aktif, label aksesibel, skip link keyboard, identitas pengguna demo, dan tombol logout visual. Dashboard utama menampilkan total produk, pesanan aktif, stok menipis, penjualan bulan ini, dan aktivitas terbaru.

Halaman produk memakai TanStack Table v9 dengan `useTable`, kolom SKU, nama, kategori, satuan, harga, stok, status, dan aksi. Pencarian bekerja pada nama atau SKU, tabel memiliki overflow horizontal, status tetap memiliki teks, dan empty state ditampilkan bila hasil kosong. Form tambah produk memakai TanStack Form dan Zod untuk memvalidasi field wajib, SKU duplikat, harga positif, stok nonnegatif, serta status yang sah. Submit hanya menambah state lokal dan menampilkan pesan demonstrasi.

Pada pemeriksaan awal, script build scaffold memiliki operator shell HTML-escaped dan mengarah ke output server yang tidak dihasilkan konfigurasi ini. Script build diperbaiki menjadi `vite build`, script start menjadi `vite preview`, dan script `typecheck` ditambahkan. TanStack Query dipasang di router sebagai `QueryClientProvider` per instance router supaya cache tidak terbagi antar-request SSR.

Pesan `[Client] Error restoring session` kemudian ditelusuri. Pesan tersebut tidak ada di source atau dependency aplikasi; prefiks `[Client]` berasal dari console piping `@tanstack/devtools-vite`, yang meneruskan error dari browser atau ekstensi browser ke terminal. Console piping dinonaktifkan di `vite.config.ts`; panel Devtools tetap tersedia dan error aplikasi tetap dapat dilihat di console browser.

## Riwayat commit dan publikasi

- `1d3167e feat: establish marketplace frontend baseline` — implementasi frontend, dependency, environment, route, data dummy, layout, tabel, form, dan dokumentasi baseline.
- `9875541 fix: isolate browser console errors` — menonaktifkan console piping Devtools agar error session browser tidak tampil sebagai error `[Client]` di terminal.

Kedua commit dibuat di branch `main` dan telah di-push ke `origin/main`. Setelah push terakhir, branch lokal dan remote berada pada commit yang sama.

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
