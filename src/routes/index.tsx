import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Boxes, Package, Truck, Users } from 'lucide-react'
import { env } from '#/env'
import { buttonVariants } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'

export const Route = createFileRoute('/')({ component: Home })
function Home() {
  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
          <Boxes className="text-emerald-700" />
          {env.VITE_APP_NAME}
        </Link>
        <Link to="/login" className={buttonVariants({ variant: 'outline' })}>
          Masuk
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="grid items-center gap-12 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              Marketplace B2B Distributor
            </p>
            <h1 className="text-5xl font-bold leading-[1.12] tracking-tight md:text-6xl">
              Distribusi lancar.
              <br />
              <span className="text-emerald-700">Bisnis berkembang.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
              Hubungkan distributor dengan toko mitra. Kelola produk, pesanan,
              dan persediaan dalam satu ruang kerja.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/login" className={buttonVariants({ size: 'lg' })}>
                Mulai sekarang <ArrowRight size={18} />
              </Link>
              <Link
                to="/catalog"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                Jelajahi katalog
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              Pratinjau frontend · Data demonstrasi
            </p>
          </div>
          <div className="rounded-3xl bg-emerald-900 p-8 text-white">
            <div className="mb-12 flex items-center justify-between">
              <Boxes size={34} />
              <span className="rounded-full border border-emerald-700 px-3 py-1 text-xs text-emerald-100">
                Untuk mitra usaha
              </span>
            </div>
            <p className="text-sm text-emerald-200">Dari gudang Anda,</p>
            <p className="mt-3 text-3xl font-semibold leading-snug">
              ke rak toko
              <br />
              di seluruh kota.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-3 border-t border-emerald-700 pt-6">
              {['Distributor', 'Produk', 'Toko mitra'].map((label, i) => (
                <div key={label}>
                  <p className="text-xs text-emerald-300">0{i + 1}</p>
                  <p className="mt-2 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          aria-label="Manfaat platform"
          className="grid gap-5 md:grid-cols-3"
        >
          {[
            {
              icon: Package,
              title: 'Katalog terorganisir',
              text: 'Informasi produk, satuan, dan harga yang mudah ditemukan.',
            },
            {
              icon: Truck,
              title: 'Operasional terhubung',
              text: 'Siapkan alur distribusi dari pesanan hingga persediaan.',
            },
            {
              icon: Users,
              title: 'Mitra bertumbuh',
              text: 'Bangun jaringan toko dengan layanan yang konsisten.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardContent className="p-6">
                <Icon className="mb-5 text-emerald-700" />
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
      <footer className="border-t px-6 py-6 text-center text-xs text-slate-500">
        {env.VITE_APP_NAME} · Ruang tumbuh untuk bisnis distribusi.
      </footer>
    </div>
  )
}
