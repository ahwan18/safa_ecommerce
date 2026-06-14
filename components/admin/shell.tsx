'use client'

import { ReactNode, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/sidebar'

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/orders': 'Pesanan',
  '/admin/products': 'Produk',
  '/admin/reviews': 'Ulasan',
  '/admin/analytics': 'Laporan',
  '/admin/notifications': 'Notifikasi',
  '/admin/content': 'Konten',
  '/admin/settings': 'Pengaturan',
  '/admin/account': 'Akun Saya',
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const title = PAGE_TITLES[pathname] ?? 'Admin'

  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef6f6_100%)] text-slate-950">
      <div className="flex h-full">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              aria-label="Tutup menu"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative h-full w-[280px] max-w-[85vw] bg-white shadow-2xl">
              <AdminSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 shadow-sm backdrop-blur md:hidden">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Menu className="h-5 w-5" strokeWidth={2.2} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">{title}</p>
              <p className="text-xs text-slate-500">Safa Apparel</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="hidden h-16 items-center justify-between border-b border-slate-200 bg-white/75 px-8 shadow-sm backdrop-blur md:flex">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-500">Admin</span>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-slate-950">{title}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden h-10 w-[280px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-400 shadow-sm lg:flex">
                  <Search className="h-4 w-4" />
                  <span>Cari menu atau data...</span>
                </div>
                <span className="inline-flex h-8 items-center rounded-md border border-cyan-200 bg-cyan-50 px-3 text-xs font-bold text-cyan-800">
                  Online
                </span>
              </div>
            </div>
            <div key={pathname} className="admin-page-transition min-h-full p-4 sm:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-[1440px]">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
