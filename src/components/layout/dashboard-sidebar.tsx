import { Link } from '@tanstack/react-router'
import {
  Boxes,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Warehouse,
} from 'lucide-react'
import { env } from '#/env'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/products', label: 'Produk', icon: Package },
  { to: '/dashboard/orders', label: 'Pesanan', icon: ShoppingBag },
  { to: '/dashboard/inventory', label: 'Persediaan', icon: Warehouse },
  { to: '/dashboard/customers', label: 'Pelanggan', icon: Users },
] as const

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col p-6">
      <Link
        to="/"
        onClick={onNavigate}
        className="mb-12 flex items-center gap-3 text-xl font-extrabold tracking-tight"
      >
        <span className="rounded-xl bg-emerald-700 p-2 text-white">
          <Boxes size={24} />
        </span>
        {env.VITE_APP_NAME}
      </Link>
      <p className="mb-4 text-xs font-semibold tracking-widest text-slate-500">
        RUANG DISTRIBUTOR
      </p>
      <nav aria-label="Navigasi dashboard" className="space-y-2">
        {navigation.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact: to === '/dashboard' }}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-emerald-50"
            activeProps={{
              className: 'bg-emerald-50 !text-emerald-800 font-bold',
              'aria-current': 'page',
            }}
          >
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm">
        <p className="font-semibold text-emerald-900">Bisnis tumbuh bersama.</p>
        <p className="mt-2 leading-relaxed text-emerald-800">
          Satu tempat untuk mengelola kebutuhan distribusi Anda.
        </p>
        <Link
          to="/catalog"
          onClick={onNavigate}
          className="mt-4 inline-block font-semibold underline"
        >
          Lihat katalog toko →
        </Link>
      </div>
    </div>
  )
}
