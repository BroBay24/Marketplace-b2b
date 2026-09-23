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
        <span className="rounded-xl bg-primary p-2 text-primary-foreground">
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
            className="flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent"
            activeProps={{
              className: 'bg-accent !text-primary font-bold',
              'aria-current': 'page',
            }}
          >
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border bg-accent p-4 text-sm">
        <p className="font-semibold text-foreground">Bisnis tumbuh bersama.</p>
        <p className="mt-2 leading-relaxed text-muted-foreground">
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
