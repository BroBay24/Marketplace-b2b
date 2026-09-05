import { useState } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '#/components/ui/sheet'
import { DashboardSidebar } from './dashboard-sidebar'

export function DashboardHeader() {
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')
  return (
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b bg-white px-5 py-4 lg:px-10">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label="Buka navigasi"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetTitle className="sr-only">Navigasi distributor</SheetTitle>
            <SheetDescription className="sr-only">
              Pilih halaman dashboard
            </SheetDescription>
            <DashboardSidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="text-sm text-slate-500">
          Workspace <span className="mx-2 text-slate-300">/</span>{' '}
          <span className="font-semibold text-slate-800">Distributor</span>
        </span>
        <Badge variant="outline">Demo</Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-800">
          AD
        </span>
        <div className="text-sm">
          <p className="font-semibold">Admin Distributor</p>
          <p className="text-xs text-slate-500">Akun demonstrasi</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Logout (demo)"
          onClick={() =>
            setNotice('Logout belum tersedia pada akun demonstrasi.')
          }
        >
          <LogOut size={18} />
        </Button>
      </div>
      <p role="status" className="w-full text-sm text-slate-600 empty:hidden">
        {notice}
      </p>
    </header>
  )
}
