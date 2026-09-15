# Design v1.0 — handoff pembelian portofolio

Tanggal baseline: 15 September 2026. Penanda v1.0 tersimpan pada kanvas dan handoff; named Version History tidak dapat dibuat melalui konektor. Cakupan rilis desain ini adalah demonstrasi pembelian kemasan dua supplier hingga penerimaan. Ini tidak menyatakan bahwa seluruh marketplace siap produksi.

- [Figma, halaman 10](https://www.figma.com/design/SbyjMJzXLacghRNc79o6Mk/Marketplace-b2b?node-id=263-4)
- [Handoff v1.0 di Figma](https://www.figma.com/design/SbyjMJzXLacghRNc79o6Mk/Marketplace-b2b?node-id=395-2)
- [BRD](https://docs.google.com/document/d/1VJt5j8YSoa1g4YLt3ciMLlTazDXPd1m9JNSV8pzLuAU/edit), [PRD](https://docs.google.com/document/d/16g_F0CpneOGb9MEMP_aSXqLOjpw96OcP1U8MlLoLUKk/edit), [FSD](https://docs.google.com/document/d/1IPD8PjJ9SPFFiSfnz9BwcuTpIHXHgvcxzM7J1pDP3mg/edit)

Dokumen ini memperinci implementasi alur pembelian; bukan revisi diam-diam atas seluruh BRD/PRD/FSD. Persyaratan di luar implementasi ditandai sebagai backlog.

## Menjalankan prototype Figma

Halaman `10 · Modern / Buyer + Supplier + Admin — Prototype` memiliki 326 frame utama (163 Light + 163 Dark), 12 contoh responsif, dan 12 titik mulai. Frame dikelompokkan menurut panduan, akun, katalog, checkout, pembayaran, RFQ, pesanan, Supplier, Admin, dan pendukung. Kedua tema sejajar; contoh responsif/backlog dipisahkan.

1. Pilih frame Panduan, klik Present, lalu pilih Flow `00 · Light — Panduan` atau `00 · Dark — Panduan`.
2. Gunakan Fit to screen. Buyer memakai frame mobile 412 px; Supplier/Admin memakai workspace desktop. Gulir area konten untuk tombol di bawah fold. Ukuran desain tidak menyiratkan aplikasi native sudah dibangun.
3. Jalankan pembelian Buyer, lanjutkan melalui pintu skenario Supplier A/B, kemudian kembali ke skenario penerimaan Buyer.
4. Tombol lintas role pada panduan hanya untuk demonstrasi. Prototype memakai snapshot layar; perubahan pada satu skenario tidak menyimpan transaksi global seperti aplikasi.
5. Uji gagal bayar, kedaluwarsa, perlu pemeriksaan, laporan masalah, registrasi Supplier, dan lupa kata sandi dari pintu skenario masing-masing.

Perbaikan utama: registrasi Supplier bertahap (akun, perusahaan, dokumen, review), contoh unggah/validasi gagal, reset kata sandi, riwayat sesuai hasil transaksi, serta workspace Supplier ditangguhkan yang tetap bisa memproses pesanan lama dalam jalur terbatas. Tidak ada aksi logout/login autentik di prototype.

## Matriks peran implementasi /demo

| Persona | Tindakan | Batas |
| --- | --- | --- |
| Buyer | Katalog, keranjang, alamat checkout, pembayaran simulasi, riwayat, invoice, penerimaan, laporan | Tidak dapat memproses pengemasan/resi atau menutup laporan |
| Supplier A/B | Melihat pesanan miliknya yang dibayar, memulai pengemasan, memasukkan resi | Server menolak subpesanan supplier lain dan pesanan belum dibayar; hanya payload miliknya dikirim |
| Admin | Melihat transaksi demo dan mencatat penanganan laporan aktif | Tidak dapat mengonfirmasi penerimaan, menandai lunas, atau refund |

Pergantian persona sengaja tersedia di sandbox portofolio. Ini **bukan autentikasi produksi** atau sistem role berbasis akun nyata. State satu browser terisolasi dari browser lain.

## Aturan bisnis

1. **Uang:** integer IDR, tanpa floating point. Dua SKU demo, masing-masing dari satu supplier. A: MOQ 100, stok awal 5.000, harga Rp5.500. Mulai 501 pcs, seluruh unit A menjadi Rp5.000. B: MOQ 50, stok awal 2.000, harga Rp8.000. Kelipatan pembelian 1 setelah MOQ.
2. **Ongkir:** A Rp25.000, B Rp20.000. Pajak dan biaya layanan demo Rp0. Satu SKU per supplier pada seed v1; memperluas katalog memerlukan pengelompokan banyak baris per supplier dan kalkulasi ongkir yang sesuai.
3. **Total acuan:** 100 A × Rp5.500 + 50 B × Rp8.000 + Rp45.000 = **Rp995.000**. ID snapshot Figma `CHK-0915-01`; aplikasi menghasilkan `CHK-DEMO-0001` dan subpesanan `-1`, `-2`.
4. **Keranjang:** bukan reservasi. Jumlah harus integer, memenuhi MOQ, dan tidak melebihi stok tersedia. Jumlah 0 menghapus baris. Menekan tambah kembali mempertahankan jumlah yang sudah ada.
5. **Checkout:** server memvalidasi semua baris, alamat, telepon, stok, dan `expectedTotal`. Perubahan harga memerlukan persetujuan ulang. Kegagalan tidak membuat transaksi/reservasi parsial. Satu transaksi pembayaran pending/failed/review per sesi. Snapshot harga, jumlah, ongkir, dan alamat disimpan saat checkout; keranjang dikosongkan.
6. **Reservasi:** berlaku 24 jam bagi pending/failed. Kedaluwarsa melepas reservasi tepat sekali. Simulasi paid yang sah mengurangi stok dan melepas reservasi; replay paid tidak mengurangi stok dua kali. State review memerlukan penanganan manual di luar v1; reservasi sebelum kedaluwarsa tetap ditahan sampai sesi demo berakhir/reset.
7. **Pembayaran:** v1 hanya simulator, tanpa transfer. Failed boleh retry sebelum tenggat dengan referensi baru dan total sama. Pending/review tidak boleh retry. Paid terlambat, nominal berbeda, atau sesudah expired masuk review dan tidak membuka pemenuhan. Tidak ada settlement, escrow, kredit, layanan jasa bayar, atau refund nyata.
8. **Pemenuhan:** supplier hanya memproses pesanan miliknya yang dibayar. `ready → processing → shipped`; nomor resi minimal 5 karakter. Pengiriman penuh per subpesanan, tanpa split shipment. Buyer mengonfirmasi `shipped → completed` setelah memeriksa barang. Tidak ada auto-complete berdasarkan timer/kurir.
9. **Multi-supplier:** penerimaan A tidak menyelesaikan B. Label `Sebagian selesai` sampai seluruh subpesanan selesai. Riwayat aplikasi berasal dari state server, tidak mengarah ke snapshot lama.
10. **Laporan:** Buyer dapat melapor pada pesanan dikirim, minimal 10 karakter. Laporan aktif menahan penerimaan subpesanan terkait. Admin mencatat penanganan minimal 10 karakter; status tetap dikirim sampai Buyer mengonfirmasi. Tidak ada refund atau penyelesaian otomatis.

## State dan kontrak server

`src/features/purchase/domain.ts` adalah sumber aturan. `demo.functions.ts` menyediakan server functions dengan validasi Zod; `demo.server.ts` menangani sesi dan penyimpanan sandbox.

| Operasi | Input | Hasil dan guard |
| --- | --- | --- |
| `getDemo` GET | Cookie sesi | `{actor, state}` atau null; no-store; terapkan expiry |
| `startDemo` POST | `actor`, `reset` | Buat/lanjutkan sandbox; rotasi cookie opaque; same-origin |
| `runDemoCommand` POST | `requestId` UUID, `command` | Snapshot + `error`; sesi dan Origin diperiksa |
| `cart` | productId, quantity | MOQ/stok/role Buyer |
| `checkout` | expectedTotal, address | Snapshot dan reservasi atomik dalam proses demo |
| `payment` / `retry` | purchaseId, result/amount | Transisi pembayaran simulator |
| `fulfill` | purchaseId, orderId, next, tracking? | Kepemilikan supplier, status berurutan, resi/penerimaan |
| `report` / `resolve` | purchaseId, orderId, message/note | Role, status, panjang catatan |

Endpoint HTTP dihasilkan TanStack Start; jangan mengunci URL internal hasil build sebagai public API. Klien menggunakan `useServerFn`. UUID sama dengan command dan persona sama bersifat idempotent dalam sesi (maksimal 500 request terakhir); UUID sama untuk payload berbeda ditolak. Klien menonaktifkan aksi selama permintaan berjalan. Perlindungan ini tidak menggantikan transaksi database/idempotency persisten produksi.

Penyimpanan memakai Map server, 24 jam, maksimal 1.000 sesi. Restart menghapus data. Tidak ada sinkronisasi multi-instance, akun nyata, database produksi, payment webhook, atau stok bersama antar pembeli. Cookie HttpOnly, SameSite Strict, Secure pada HTTPS. Aktivasi produksi memerlukan `B2B_DEMO_ENABLED=true`. Jangan menyimpan data pribadi nyata pada demo.

## Acceptance criteria dan bukti

Kode AC berikut merupakan matriks v1 ini; D/S/H/E adalah suite implementasi, bukan klaim seluruh TC-01–TC-20 FSD telah dijalankan.

| ID | Given / When / Then | Bukti |
| --- | --- | --- |
| AC01 | Dengan MOQ 100, jumlah 99/pecahan ditolak; 100 diterima | D01 |
| AC02 | Jumlah A 500 memakai 5.500; 501 memakai 5.000 untuk semua unit | D02 |
| AC03 | Keranjang 100 A + 50 B menampilkan total 995.000 tanpa reservasi | D03; E01 menunggu browser |
| AC04 | Stok B kurang atau harga berubah saat checkout: tidak ada reservasi/pesanan parsial | D04–D06 |
| AC05 | Harga katalog/alamat profil berubah: snapshot order lama tetap | D07 |
| AC06 | Replay paid tidak menggandakan pengurangan stok; failed retry memakai referensi baru | D08–D10, S04 |
| AC07 | Expiry melepas stok sekali; paid terlambat/beda nominal masuk review | D11–D12 |
| AC08 | Supplier lain/unpaid tidak boleh diproses; resi wajib dan status berurutan | D13–D15, D19, S05, S08 |
| AC09 | Buyer menerima A: B tetap aktif; semua selesai setelah menerima keduanya | D16, D20; E01 menunggu browser |
| AC10 | Laporan menahan hanya order terkait; Admin resolve tidak auto-receive | D17–D18 |
| AC11 | Tanpa sesi/cross-origin ditolak; sesi terisolasi dan token lama invalid | S01–S08 (adapter HTTP dimock) |
| AC12 | Dark Mode termasuk dialog; mobile 360 px tidak meluber; Escape menutup dialog | Implementasi tersedia; E02 menunggu browser |
| AC13 | /demo benar-benar dirender server; /catalog menuju implementasi | H01–H02 |
| AC14 | Expired tidak menawarkan retry pembayaran | D11; E03 menunggu browser |

## Sistem visual dan handoff komponen

Inter, H1 24/Bold, H2 18/Semibold, body 14/1.5, label 12. Radius tombol/input 12, kartu 16. Margin mobile 20; spacing utama 8/16/24/32; tombol minimum 48. Tekan 0.98, fokus terlihat, reduced motion dihormati. Semantic CSS custom properties mengikuti palet Light/Dark Figma. Header dan navigasi bawah memakai blur 20. Ikon Lucide; ilustrasi kardus diekspor dari Figma ke `public/design/packing-box.svg`.

Gunakan komponen Button/Card/Input yang sudah ada, bukan library UI kedua. Form penerimaan, pengiriman, laporan, dan reset memakai Radix Dialog. Label kontrol, status live, serta pesan kesalahan tersedia. Pemeriksaan aksesibilitas browser/keyboard lengkap masih menjadi gate, bukan klaim telah lulus.

## Backlog setelah v1

- Uji klik E01–E03 dan review visual pada desktop/mobile Light/Dark; uji pengguna Buyer/Supplier/Admin.
- Autentikasi nyata, verifikasi Supplier, password reset email, role dari server identity; larangan akses akun ditangguhkan sesuai desain.
- Backend RFQ dan quote versioning, chat, katalog/CRUD/media Supplier lengkap, notifikasi Supplier/Admin.
- Database persisten, transaksi stok dengan konkurensi, lintas pembeli, audit persisten, recovery, observabilitas.
- Provider pembayaran/logistik, webhook verification dan rekonsiliasi hanya jika proyek diperluas; perlu aturan bisnis terpisah.

Baseline v1 boleh direview sebagai portofolio desain dan alur demo. Rilis aplikasi penuh menunggu gate pada [validation.md](validation.md).
