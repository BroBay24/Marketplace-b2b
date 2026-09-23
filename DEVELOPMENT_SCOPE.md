# Status implementasi dan scope development lanjutan

Snapshot: **24 September 2026**. Dokumen ini menjadi titik mulai untuk melanjutkan Marketplace B2B dari kondisi codebase yang benar-benar ada.

**Prioritas 1 — model data dan backend demo persisten — selesai untuk scope yang disepakati.** Unit, integration, migration legacy, persistensi lintas restart, serta E2E Chromium telah lulus secara lokal. Pemeriksaan visual manual terhadap frame Figma dikecualikan berdasarkan keputusan pemilik; hasil otomatis responsif, aksesibilitas dasar, dan tema menjadi bukti desain untuk tahap ini.

## 1. Cara membaca status

- **Ada dan terverifikasi terbatas:** berkas implementasi tersedia dan pemeriksaan yang disebutkan telah dijalankan; bukan klaim seluruh acceptance criteria lulus.
- **Ada, belum terverifikasi:** kode tersedia, tetapi perilaku akhirnya belum diuji pada batas yang relevan.
- **Belum dibuat:** baru berupa rancangan, placeholder, atau belum memiliki implementasi.

Snapshot ini menggantikan uraian kondisi terkini dalam `BASELINE.md` yang mencatat tahap frontend awal. Rincian kebutuhan, arsitektur 14 tanggung jawab, ERD fondasi, ERD konseptual produk lengkap, dan sumber BRD/PRD/FSD tersedia di [docs/backend-foundation.md](docs/backend-foundation.md).

## 2. Yang sudah dikerjakan

| Area                     | Implementasi yang tersedia                                                                                                                          | Bukti dan batas verifikasi                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack                    | TanStack Start/React, PostgreSQL, Drizzle, Zod; server functions untuk komunikasi katalog                                                           | Instalasi pnpm frozen-lockfile, typecheck, lint, format check, dan build lulus; scaffold GraphQL tidak terpakai telah dihapus                       |
| Database lokal           | Cluster PostgreSQL terpisah di `.local/postgres`, Unix socket, peer authentication, tanpa listener TCP; dukungan `DATABASE_URL` pada koneksi server | `pnpm db:setup` lulus; perubahan committed bertahan melalui koneksi/proses baru dan restart PostgreSQL                                              |
| Model data               | Delapan tabel: companies, users, supplier verifications, addresses, categories, products, product price tiers, inventory                            | Schema dan tiga migration tersedia; migration kosong dan upgrade data legacy diuji                                                                  |
| Integritas dasar         | Foreign key kepemilikan/company/role, SKU unik per supplier, integer IDR, MOQ/step, stok nonnegatif dan `reserved <= on_hand`                       | Negative test FK, role/company, inventory, tier, dan batas field lulus                                                                              |
| Identitas model          | Buyer/Supplier terikat perusahaan sesuai jenisnya; Admin tanpa perusahaan bisnis; status user/company/verifikasi termasuk `suspended`               | Model tersedia, **belum autentikasi atau otorisasi berbasis sesi**                                                                                  |
| Seed                     | Dua Buyer, dua Supplier, satu Admin; perusahaan/alamat fiktif; `KRD302015` dan `KRDBESAR`; stok dan tier kanonis                                    | Seed dua kali tidak menggandakan data; perubahan sah pada harga/tier/stok tetap dipertahankan; seed produksi dijaga                                 |
| Aturan domain            | Validasi company/address/product/inventory dan kalkulasi harga all-units                                                                            | Unit test field FSD, integer, MOQ/step, tier, 500/501, dan overflow subtotal lulus                                                                  |
| Service katalog          | Search nama/SKU/supplier dan kategori; detail; hanya produk publik dengan company/verifikasi/tier/inventory sah; DTO publik eksplisit               | Integration test list/detail, wildcard literal, filter AND, status tersembunyi, dan field privat lulus                                              |
| Transport backend        | `listCatalog` dan `getCatalogProduct`, validasi input, error publik generik, `Cache-Control: no-store`                                              | E2E membuktikan SSR, gangguan database, error state, dan retry                                                                                      |
| UI katalog/detail        | Route `/catalog` dan `/catalog/$productId`, search/kategori, sort lokal, state kosong/error/404, tier/MOQ/stok, estimator domain, tema persisten    | Dua belas E2E Chromium lulus pada implementasi akhir                                                                                                |
| Design system Figma      | Inter lokal, token light/dark, aset SVG ekspor Figma, radius dan kontrol utama 48 px                                                                | Viewport 360/412/768, overflow, target 48 px, keyboard, kontras dasar, teks 200%, dan tema diuji; review visual manual dikecualikan untuk tahap ini |
| Halaman produk dashboard | `/dashboard/products` membaca katalog publik yang sama; form tambah lokal lama dilepas dari route                                                   | Bukan workspace supplier privat; tidak menyediakan CRUD                                                                                             |
| Dokumentasi arsitektur   | Peta 14 tanggung jawab end-to-end, ERD fondasi dan ERD transaksi konseptual, fixture serta batas tahap                                              | [docs/backend-foundation.md](docs/backend-foundation.md) tersedia. ERD transaksi bukan tabel transaksi yang sudah dibuat                            |

Rujukan kode utama:

- Database: [schema](src/server/db/schema.ts), [connection](src/server/db/connection.ts), [seed](src/server/db/seed.ts), [migration](drizzle/).
- Kontrak/domain: [catalog](src/domain/catalog.ts), [product-rules](src/domain/product-rules.ts).
- Backend: [catalog.server](src/server/catalog.server.ts), [catalog.functions](src/server/catalog.functions.ts).
- UI: [katalog](src/routes/catalog.tsx), [detail](src/routes/catalog_.$productId.tsx), [komponen katalog](src/components/catalog/catalog-ui.tsx), [styles](src/styles.css).
- Figma dan asal aset: [public/images/catalog/README.md](public/images/catalog/README.md).

## 3. Hasil pemeriksaan aktual

Pemeriksaan berikut dijalankan pada snapshot ini:

| Pemeriksaan                      | Hasil                                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | Lulus; pnpm lockfile menjadi sumber instalasi tunggal                                                                                    |
| `pnpm db:setup`                  | Lulus; migration termasuk `0002` diterapkan dan dua produk aktif tersedia tanpa mereset edit sah                                         |
| Unit test                        | Lulus 17/17: field FSD, inventory, pricing, overflow, dan guard seed                                                                     |
| Integration test                 | Lulus 10/10: migration kosong/legacy/invalid, seed, constraint, privasi, visibilitas, tier/inventory, dan restart                        |
| E2E Chromium                     | Lulus 12/12: SSR, navigasi, search/filter/sort, detail/404, empty/error/retry, estimator, tema, viewport, keyboard, kontras, dan console |
| `pnpm generate-routes`           | Lulus; route tree dibuat oleh generator                                                                                                  |
| `pnpm typecheck`                 | Lulus                                                                                                                                    |
| `pnpm lint`                      | Lulus                                                                                                                                    |
| `pnpm check`                     | Lulus setelah output/cache generated dikecualikan secara eksplisit                                                                       |
| `pnpm build`                     | Lulus; bundle client dan server terbentuk                                                                                                |
| `pnpm db:generate`               | Tidak menemukan drift schema baru                                                                                                        |

Test permanen tersedia di `tests/unit`, `tests/integration`, dan `e2e`. Integration/E2E memakai cluster privat `.local/postgres-test` dan database unik berawalan `marketplace_b2b_test_`; test tidak memakai atau me-restart `marketplace_demo`. Persistensi dibuktikan melalui write committed, proses/koneksi baru, restart cluster test PostgreSQL, dan pembacaan ulang.

Bukti desain otomatis terbatas pada Chromium dan pemeriksaan terpilih; ini bukan audit WCAG penuh atau perbandingan pixel-perfect. Review visual manual terhadap frame Figma dikecualikan dari kriteria penutupan tahap ini berdasarkan keputusan pemilik.

## 4. Urutan scope lanjutan

Urutan dependensi: **S0 → S1 → S2 → S3 → S4 → S5**. S6 memakai fondasi identitas, katalog, dan checkout yang sama. S7 menutup kebutuhan operasi/UAT lintas modul. Sebuah tahap hanya dinyatakan selesai setelah kriteria penerimaannya mempunyai bukti.

### S0 — Tutup pekerjaan fondasi yang sedang berjalan

Prioritas: **tertinggi; dikerjakan sebelum fitur transaksi baru**.

- [x] Buat test unit untuk SKU/field FSD, integer/negatif/pecahan, MOQ/step, tier pertama, duplikasi threshold, harga tier, dan overflow subtotal.
- [x] Buat integration test dengan database uji terisolasi: migration dari kosong, seed dua kali, FK lintas perusahaan, role/company, stok invalid, dan penolakan data invalid oleh database.
- [x] Uji seed ulang setelah harga/tier/stok diubah; perubahan yang sah harus tetap ada dan fixture tidak digandakan.
- [x] Uji visibilitas list **dan detail langsung** untuk produk draft/arsip, supplier belum disetujui, dan perusahaan suspended; assert field privat tidak masuk respons.
- [x] Uji perubahan data yang committed setelah restart aplikasi, koneksi baru, dan restart PostgreSQL. Reload browser saja tidak cukup sebagai bukti persistensi.
- [x] Buat test browser: SSR pertama, navigasi client, search/kategori/sort, detail/404, empty state, gangguan layanan/retry, estimasi harga, dan tema setelah reload/navigasi.
- [x] Pemeriksaan otomatis desain pada 360/412/768 px, overflow, target kontrol, keyboard, kontras dasar, teks 200%, dan light/dark lulus; review visual manual Figma dikecualikan oleh pemilik.
- [x] Satukan kalkulasi estimasi UI dengan aturan domain dan penanganan overflow.
- [x] Review integritas tier lintas baris: boundary katalog menolak produk tanpa tier/inventory atau pricing invalid. Enforcement atomik saat mutasi produk tetap harus dibuat bersama CRUD S2.
- [x] Tambahkan guard seed demo terhadap lingkungan produksi dan database eksternal tanpa opt-in.
- [x] Review migration `0001`: status `pending/rejected` dipetakan, `responsible_person` di-backfill, nilai legacy invalid ditolak eksplisit, dan status `suspended` ditambahkan melalui `0002`.
- [x] Perbarui README menjadi petunjuk pnpm/database/backend aktual; labeli `BASELINE.md` sebagai riwayat; selaraskan matriks bukti arsitektur.
- [x] Audit dependency/lockfile, tetapkan pnpm secara konsisten, hapus dependency demo mati, dan hapus `package-lock.json` lama.
- [x] Semua checks akhir dan diff telah ditinjau tanpa temuan blocker.

**Kriteria selesai:** checkout bersih dapat dipasang dan menjalankan database/katalog dengan instruksi terdokumentasi; suite test permanen lulus; persistensi terbukti; tidak ada kebocoran data privat; hasil verifikasi desain otomatis tercatat. Prioritas implementasi pertama ditutup.

### S1 — Identitas, sesi, dan batas akses perusahaan

- [ ] Implementasikan registrasi/login/logout, penyimpanan kredensial yang sesuai, sesi server dengan cookie HttpOnly, serta validasi input.
- [ ] Terapkan Buyer/Supplier/Admin dan status akun/perusahaan di setiap endpoint privat.
- [ ] Tentukan company dari sesi yang sah; jangan menerima identitas pemilik dari browser sebagai bukti akses.
- [ ] Tambahkan proteksi request yang mengubah data, pembatasan percobaan autentikasi, dan pengujian isolasi dua Buyer/dua Supplier.
- [ ] Ganti login, identitas header, dan logout demonstrasi menjadi perilaku nyata.

**Kriteria selesai:** sesi bertahan secara benar, logout membatalkan sesi, endpoint privat menolak request anonim/role salah, dan akun perusahaan A tidak dapat membaca atau mengubah data privat perusahaan B.

### S2 — Profil, verifikasi supplier, dan katalog yang dapat dikelola

- [ ] CRUD profil perusahaan dan alamat milik sendiri; default/arsip dan aturan penggunaan alamat.
- [ ] Workflow verifikasi supplier/Admin: pengajuan, permintaan perubahan, persetujuan, penangguhan, alasan, dan riwayat audit.
- [ ] CRUD produk, harga tier, inventory dan publikasi/arsip melalui akun supplier dengan validasi/transaksi server.
- [ ] Batasi publikasi dan transaksi baru supplier yang belum disetujui atau suspended; pertahankan akses yang diperlukan untuk kewajiban pesanan lama.
- [ ] Lengkapi katalog sesuai FSD: filter supplier, maksimum MOQ, penggabungan filter, pagination, serta sort dan filter konsisten pada server/URL. Saat ini sort hanya lokal pada hasil yang diterima.
- [ ] Ganti data makanan/minuman/statistik lama dalam `dashboard.index.tsx` dan fixture terkait. Ringkasan dashboard saat ini belum mengikuti sumber data katalog baru.
- [ ] Selaraskan workspace pemasok/Admin yang dikerjakan dengan frame Figma masing-masing.

**Kriteria selesai:** perubahan sah tersimpan dan terlihat setelah reload; hanya pemilik yang dapat mengubah; workflow Admin tercatat; produk yang tidak memenuhi syarat tidak muncul melalui list maupun detail.

### S3 — Cart dan checkout multi-supplier

- [ ] Model cart/item persisten per Buyer; cart tidak mereservasi stok.
- [ ] Review harga, MOQ/step, stok, alamat, biaya, dan perubahan data sebelum persetujuan checkout.
- [ ] Checkout atomik: parent checkout, sub-order per supplier, snapshot item/alamat/harga/biaya, serta reservasi stok.
- [ ] Idempotency key dan pemeriksaan konflik payload; penguncian/strategi konkurensi untuk mencegah overselling.
- [ ] Tenggat checkout dan pelepasan reservasi tepat sekali saat expired/batal sebelum dibayar.

**Kriteria selesai:** kegagalan satu item membatalkan seluruh commit; dua pembeli tidak memperoleh stok yang sama melebihi persediaan; request ulang tidak menggandakan pesanan; snapshot tidak berubah ketika katalog/profil diubah.

### S4 — Pembayaran sandbox dan rekonsiliasi

- [ ] Model payment attempt/event dan simulator atau integrasi sandbox yang dipilih serta didokumentasikan.
- [ ] Verifikasi event, deduplikasi, kecocokan referensi/nominal/IDR, serta transisi status sah; redirect browser tidak menetapkan lunas.
- [ ] Retry hanya setelah FAILED terkonfirmasi dan sebelum expiry; attempt baru tidak memperpanjang tenggat.
- [ ] Event terlambat/tidak cocok masuk REVIEW; PENDING/timeout/REVIEW tidak otomatis membuat attempt baru.

**Kriteria selesai:** event duplikat hanya memberi satu efek, nominal salah tidak membuka fulfillment, dan pembayaran sukses tidak langsung mengurangi `on_hand`.

### S5 — Fulfillment, penerimaan, riwayat, dan invoice demo

- [ ] Proses supplier per sub-order setelah pembayaran sah; shipment penuh sesuai baseline.
- [ ] Pengiriman mengurangi `on_hand` dan `reserved` tepat sekali; penerimaan eksplisit oleh Buyer.
- [ ] Tracking demo, histori, dan invoice berdasarkan snapshot transaksi.
- [ ] Laporan OPEN/IN_REVIEW memblokir operasi pada sub-order terkait; keputusan Admin tidak memaksa diterima/refund otomatis.

**Kriteria selesai:** status setiap supplier independen; satu supplier selesai tidak menyelesaikan seluruh checkout; histori/invoice tetap sama setelah data master diubah.

### S6 — RFQ, quotation, dan percakapan kontekstual

- [ ] RFQ satu SKU untuk supplier terkait; validasi kuantitas dan akses perusahaan.
- [ ] Quotation berversi, expiry, serta penerimaan versi terbaru yang sah hanya sekali.
- [ ] Penerimaan quotation dan pembuatan checkout/reservasi atomik; pisahkan jalur quotation dari cart biasa.
- [ ] Chat terikat konteks dan anggota yang sah; deduplikasi pesan; chat tidak mengubah harga formal.

**Kriteria selesai:** quotation lama/expired tidak dapat diterima; retry tidak menggandakan checkout; percakapan tidak dapat dibaca lintas perusahaan tanpa kewenangan yang ditetapkan.

### S7 — Notifikasi, operasi, dan penerimaan produk lengkap

- [ ] Notifikasi in-app per event/penerima, status baca, dan deduplikasi.
- [ ] Audit bisnis, log aman, metrik/tracing yang relevan, dan penanganan kegagalan worker/event.
- [ ] CI untuk lint/typecheck/build/unit/integration/E2E; database test terisolasi dan tidak memakai database pengguna.
- [ ] Target hosting/adapter runtime, TLS, pengelolaan environment/secret, migration deployment, backup dan uji restore.
- [ ] Jalankan UAT-A/B/C menurut dokumen sumber, uji konkurensi, dan matriks akses lintas role/perusahaan.
- [ ] Uji target performa PRD: p95 baca katalog/detail ≤2 detik pada 1.000 produk dan 20 pengguna bersamaan.
- [ ] Audit design system dan aksesibilitas seluruh layar yang sudah diimplementasikan; simpan bukti pengujian.

**Kriteria selesai:** hasil UAT dan pemeriksaan operasional terdokumentasi serta dapat diulang. Deployment produksi dinilai tersendiri; menjalankan `vite preview` belum membuktikan kesiapan produksi.

## 5. Batas scope dan keputusan yang tetap terbuka

Tetap gunakan aplikasi modular TanStack Start dengan PostgreSQL/Drizzle dan Zod. Peta 14 tanggung jawab adalah pembagian arsitektur, bukan kewajiban membangun 14 layanan. Tidak diperlukan penggantian stack untuk melanjutkan S0.

Pemilihan implementasi autentikasi, media privat/object storage, mekanisme worker/expiry, provider pembayaran sandbox, dan hosting diputuskan ketika tahap terkait dimulai dan dicatat dalam dokumen keputusan. Jangan menganggap provider tertentu sudah disetujui atau terpasang.

Pembayaran riil, escrow/wallet, pembiayaan/BNPL, payout, integrasi logistik nyata, pajak otomatis, dan ERP tetap di luar baseline. Jangan menambahkan fitur tersebut atau menyatakan keseluruhan desain Figma selesai hanya karena fondasi katalog sudah ada.

## 6. Prosedur melanjutkan pekerjaan

1. Baca `AGENTS.md`, dokumen ini, serta dokumen arsitektur; periksa working tree agar pekerjaan yang ada tidak tertimpa.
2. Mulai dari checklist S0 yang belum mempunyai bukti; jangan membuat ulang schema, katalog, atau token yang sudah tersedia.
3. Pertahankan isi `.env.local`; untuk checkout baru gunakan `.env.example`. Rahasia database tidak boleh memakai prefiks `VITE_`.
4. Setup lokal: `pnpm install --frozen-lockfile`, lalu `pnpm db:setup` dan `pnpm dev`. Gunakan `pnpm db:stop` untuk menghentikan cluster lokal; menghentikan cluster bukan reset data.
5. Catat perintah, hasil, keterbatasan, dan berkas test permanen setelah satu acceptance criterion terpenuhi.
6. Perbarui status dan tanggal dokumen ini setelah tahap selesai; bedakan bukti lokal, CI, commit, push, dan deployment.

**Titik mulai berikutnya: S0 — menutup pengujian dan integritas fondasi, bukan langsung membangun pembayaran atau transaksi penuh.**
