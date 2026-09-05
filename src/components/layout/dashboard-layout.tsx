import { Outlet } from '@tanstack/react-router'
import { DashboardSidebar } from './dashboard-sidebar'
import { DashboardHeader } from './dashboard-header'

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:fixed"
      >
        Lewati navigasi
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-white lg:block">
        <DashboardSidebar />
      </aside>
      <div className="lg:pl-64">
        <DashboardHeader />
        <main
          id="main-content"
          className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-10 lg:py-10"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
