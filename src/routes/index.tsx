import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Boxes, Package, Truck, Users } from 'lucide-react'
import { env } from '#/env'
import { buttonVariants } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'

export const Route = createFileRoute('/')({ component: Home })
function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
          <Boxes className="text-primary" />
          {env.VITE_APP_NAME}
        </Link>
        <Link to="/login" className={buttonVariants({ variant: 'outline' })}>
          Masuk
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="grid items-center gap-12 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Marketplace B2B Kemasan
            </p>
            <h1 className="text-5xl font-bold leading-[1.12] tracking-tight md:text-6xl">
              Kemasan tepat.
              <br />
              <span className="text-primary">Bisnis berkembang.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
              Temukan kemasan dari pemasok terverifikasi. Bandingkan harga
              bertingkat, jumlah minimum, dan ketersediaan untuk usaha Anda.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/catalog" className={buttonVariants({ size: 'lg' })}>
                Jelajahi katalog <ArrowRight size={18} />
              </Link>
              <Link
                to="/dashboard/products"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                Lihat daftar produk
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              Katalog demo · Produk dan perusahaan fiktif
            </p>
          </div>
          <div className="rounded-3xl bg-blue-900 p-8 text-white">
            <div className="mb-12 flex items-center justify-between">
              <Boxes size={34} />
              <span className="rounded-full border border-blue-700 px-3 py-1 text-xs text-blue-100">
                Untuk mitra usaha
              </span>
            </div>
            <p className="text-sm text-blue-200">
              Untuk setiap kebutuhan usaha,
            </p>
            <p className="mt-3 text-3xl font-semibold leading-snug">
              kemasan yang sesuai
              <br />
              dalam jumlah yang tepat.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-3 border-t border-blue-700 pt-6">
              {['Pemasok', 'Kemasan', 'Usaha Anda'].map((label, i) => (
                <div key={label}>
                  <p className="text-xs text-blue-200">0{i + 1}</p>
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
              title: 'Stok yang jelas',
              text: 'Periksa ketersediaan sebelum merencanakan pengadaan.',
            },
            {
              icon: Users,
              title: 'Pemasok terverifikasi',
              text: 'Kenali pemasok dan lokasi usaha di setiap produk.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardContent className="p-6">
                <Icon className="mb-5 text-primary" />
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
