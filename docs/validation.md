# Validation — Design v1.0

Tanggal: 15 September 2026. Hasil di bawah hanya mencakup pemeriksaan yang benar-benar dijalankan.

| Pemeriksaan | Hasil | Batas bukti |
| --- | --- | --- |
| Struktur Figma halaman 10 | Lulus: 326 frame, 163 per tema | Tidak ditemukan top-level overlap, overflow teks horizontal, target NAVIGATE <48 px, tujuan rusak, atau lintas tema tak disengaja |
| 13 hubungan prototype kritis | Lulus | Memeriksa destination reaction; bukan sesi usability |
| Screenshot Figma | Sampel diperiksa | Registrasi Supplier Light dan riwayat selesai Dark; CTA bawah fold memerlukan scroll |
| Domain bisnis D01–D20 | 20 lulus | MOQ/tier, atomic checkout, snapshots, payment, role, fulfillment, issues |
| Server boundary S01–S08 | 8 lulus | Sesi/Origin/idempotency/production flag; request/cookie adapter dimock |
| HTTP H01–H02 | 2 lulus | Real TanStack Start dev server: SSR /demo 200 + konten; /catalog 307 ke /demo |
| TypeScript | Lulus | Jalankan build dahulu untuk generasi Paraglide pada checkout bersih |
| Build Vite client/server | Lulus | Bukan deployment |
| Lint file implementasi | Lulus | Bukan klaim baseline repository bebas seluruh lint warning |
| Browser E01–E03 | Terblokir saat launch | Chromium executable tidak tersedia; unduhan CDN timeout. Tidak ada assertion UI yang dianggap lulus |
| Cloud Browser localhost | Terblokir | ERR_BLOCKED_BY_CLIENT; tidak dicoba untuk melewati pembatasan |
| Uji pengguna/aksesibilitas menyeluruh | Belum dijalankan | Tidak ada metrik usability atau klaim WCAG penuh |

## Perintah reproduksi

Node 24 digunakan pada validasi ini. Gunakan satu package manager secara konsisten; package-lock dan pnpm-lock disertakan.

```bash
npm ci
npm test
VITE_APP_NAME='Marketplace B2B' VITE_GRAPHQL_URL='http://localhost:4000/graphql' npm run build
npm run typecheck
npx eslint src/features/purchase src/routes/demo.tsx src/routes/catalog.tsx src/routes/index.tsx tests vitest.config.ts playwright.config.ts
npm run test:http
npx playwright install --with-deps chromium
npm run test:e2e
```

E01: dua supplier, gagal/retry bayar, pengemasan/resi independen, penerimaan sebagian lalu seluruhnya, reload riwayat. E02: mobile 360 px, Dark Mode dialog, konfirmasi eksplisit, Escape, lebar halaman. E03: expired tanpa retry. H01/H02 memakai request fixture dan tidak membutuhkan browser binary.

## Gate rilis aplikasi

1. Jalankan E01–E03 setelah browser tersedia; perbaiki kegagalan assertion, jangan hanya mengandalkan compile.
2. Review screenshot desktop/mobile Light/Dark, fokus keyboard, 200% zoom, pesan error dan kondisi koneksi gagal.
3. Uji tugas dengan perwakilan Buyer, Supplier, Admin; catat task completion, salah aksi, dan kebingungan harga/status. Tidak mengarang angka keberhasilan.
4. Review PR dan batas penyimpanan sandbox. Status Design v1.0 adalah baseline desain, bukan persetujuan merge/deployment.

## Status penyerahan

Baseline Design v1.0 ditandai pada kanvas Figma dan dokumen handoff. API named Version History tidak didukung konektor, sehingga tidak diklaim tersimpan sebagai versi bernama pada panel history.

Implementasi tersimpan pada branch lokal `feat/design-v1-purchase-flow`. Push ditolak pemeriksaan persetujuan otomatis karena publikasi kode ke repository belum dianggap terotorisasi secara spesifik. Tidak ada PR atau hasil CI yang diklaim. Workflow `.github/workflows/purchase-demo.yml` siap menjalankan test, build, typecheck, lint, serta Playwright setelah push dan pembuatan PR diizinkan.
