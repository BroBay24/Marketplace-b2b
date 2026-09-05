import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Package,
  ShoppingBag,
  Warehouse,
  Wallet,
} from 'lucide-react'
import { Card, CardContent } from '#/components/ui/card'
import { buttonVariants } from '#/components/ui/button'
import { PageHeading } from '#/components/page-heading'
import { products, lowStockThreshold } from '#/data/products'
import { dashboardDemo, recentActivity } from '#/data/dashboard'
import { formatRupiah } from '#/lib/format'

export const Route = createFileRoute('/dashboard/')({ component: Dashboard })
function Dashboard() {
  const stats = [
    {
      label: 'Total produk',
      value: products.length,
      note: 'Dalam katalog distributor',
      icon: Package,
    },
    {
      label: 'Pesanan aktif',
      value: dashboardDemo.activeOrders,
      note: 'Menunggu proses & pengiriman',
      icon: ShoppingBag,
    },
    {
      label: 'Stok menipis',
      value: products.filter((p) => p.stock < lowStockThreshold).length,
      note: 'Kurang dari 20 satuan',
      icon: Warehouse,
    },
    {
      label: 'Penjualan bulan ini',
      value: formatRupiah(dashboardDemo.monthlySales),
      note: 'Total penjualan demonstrasi',
      icon: Wallet,
    },
  ]
  return (
    <>
      <PageHeading
        title="Ringkasan bisnis"
        description="Selamat datang kembali. Berikut gambaran aktivitas distribusi Anda."
      >
        <Link to="/dashboard/products" className={buttonVariants()}>
          Kelola produk <ArrowUpRight size={16} />
        </Link>
      </PageHeading>
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Mode demonstrasi — seluruh ringkasan dan aktivitas menggunakan data
        contoh.
      </div>
      <section
        aria-label="Ringkasan distributor"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, note, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <Icon size={19} className="text-emerald-700" />
              </div>
              <p className="mt-6 text-2xl font-bold tracking-tight">{value}</p>
              <p className="mt-2 text-xs text-slate-500">{note}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Aktivitas terbaru</h2>
            <p className="mt-1 text-sm text-slate-500">
              Kabar terkini dari operasional Anda.
            </p>
            <ul className="mt-6 divide-y">
              {recentActivity.map((item) => (
                <li key={item.title} className="flex gap-4 py-5">
                  <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Package size={17} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                    <p className="mt-2 text-xs text-slate-400">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-emerald-800 bg-emerald-900 text-white">
          <CardContent className="p-7">
            <Warehouse size={36} className="mb-8 text-emerald-300" />
            <h2 className="text-2xl font-semibold leading-snug">
              Pastikan rak mitra
              <br />
              selalu terisi.
            </h2>
            <p className="mt-4 text-sm leading-7 text-emerald-100">
              Pantau ketersediaan produk dan siapkan pengadaan untuk produk
              dengan stok menipis.
            </p>
            <Link
              to="/dashboard/inventory"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white"
            >
              Lihat persediaan <ArrowUpRight size={16} />
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
