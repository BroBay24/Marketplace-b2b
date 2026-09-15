# Implement portfolio purchase flow and Design v1 handoff

Katalog sebelumnya masih placeholder, sehingga desain pembelian multi-supplier belum dapat diuji sebagai satu alur aplikasi. Perubahan ini menambahkan `/demo` dengan katalog, MOQ/tier pricing, keranjang, checkout, simulasi pembayaran, pengemasan dan resi per supplier, penerimaan Buyer, serta laporan dan catatan Admin.

State dan aturan transaksi berjalan pada server functions TanStack Start. Sesi demo terisolasi melalui cookie opaque; semua data fiktif disimpan di memori server. UI memakai Inter, token Light/Dark, komponen existing, dialog konfirmasi, serta layout responsif. Halaman katalog diarahkan ke demo.

Handoff pada `docs/design-v1-handoff.md` memetakan role, aturan bisnis, kontrak command, acceptance criteria, dan backlog. Audit Figma tercatat pada `docs/figma-audit.json`.

Validasi: 20 domain tests, 8 server-boundary tests (adapter HTTP dimock), dan 2 HTTP tests lulus. Build client/server, typecheck, serta lint file perubahan lulus. Tiga browser E2E belum berhasil dimulai karena Chromium tidak tersedia dan unduhan timeout. Workflow PR disiapkan untuk mengulang pengujian di CI; hasilnya belum tersedia.

Batas: demo portofolio, bukan autentikasi akun atau pembayaran nyata. Restart server menghapus state; tidak ada stok lintas sesi, database persisten, atau multi-instance. RFQ backend, katalog Supplier lengkap, notifikasi, dan uji pengguna berada di backlog.

Target: `main`. Head: `feat/design-v1-purchase-flow`. Status: draft, menunggu persetujuan push dan hasil browser E2E.
