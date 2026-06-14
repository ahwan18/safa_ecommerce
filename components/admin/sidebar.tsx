'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Bell,
  Box,
  FileText,
  Home,
  LogOut,
  Settings,
  ShoppingBag,
  Star,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useNotifications } from '@/lib/contexts/notification-context'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  badge?: boolean
}

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Utama',
    items: [
      { href: '/admin', label: 'Dashboard', exact: true, icon: Home },
      { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
      { href: '/admin/products', label: 'Produk', icon: Box },
      { href: '/admin/reviews', label: 'Ulasan', icon: Star },
    ],
  },
  {
    label: 'Laporan',
    items: [
      { href: '/admin/analytics', label: 'Laporan', icon: BarChart3 },
      { href: '/admin/notifications', label: 'Notifikasi', badge: true, icon: Bell },
    ],
  },
  {
    label: 'Konfigurasi',
    items: [
      { href: '/admin/content', label: 'Konten', icon: FileText },
      { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
      { href: '/admin/account', label: 'Akun Saya', icon: UserRound },
    ],
  },
]

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const { adminUnreadCount } = useNotifications()
  const notifCount = adminUnreadCount()

  const handleLogout = () => {
    logout()
    router.push('/admin/login')
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname === href || (href !== '/admin' && pathname.startsWith(href))
  }

  return (
    <aside className="flex h-full w-[264px] min-w-[264px] flex-col border-r border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[1px_0_0_rgba(15,23,42,0.02)]">
      <div className="border-b border-slate-100 px-4 py-4">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 no-underline">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 shadow-[0_12px_25px_rgba(15,23,42,0.18)]">
            <span className="text-base font-black text-white">SA</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black leading-none text-slate-950">Safa Apparel</p>
            <p className="mt-1 text-[11px] font-semibold text-cyan-700">Admin Workspace</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              {group.label}
            </p>
            {group.items.map(item => {
              const active = isActive(item.href, item.exact)
              const badge = item.badge ? notifCount : 0
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`group relative mb-1 flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm no-underline transition duration-200 ${
                    active
                      ? 'border-slate-900 bg-slate-950 font-bold text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]'
                      : 'border-transparent font-semibold text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950 hover:shadow-sm'
                  }`}
                >
                  {active && <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-cyan-400" />}
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-cyan-50 group-hover:text-cyan-700'}`}>
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="min-w-[20px] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white shadow-sm">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <Link href="/admin/account" onClick={onNavigate} className="mb-2 block rounded-lg border border-slate-200 bg-white p-3 no-underline shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/40">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-900 text-sm font-black text-white">
              {user?.fullName?.charAt(0).toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">{user?.fullName ?? 'Admin'}</p>
              <p className="truncate text-xs text-slate-500">{user?.email ?? 'Akun Saya'}</p>
            </div>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.2} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
