'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useOrders } from '@/lib/contexts/order-context'
import { useAuth } from '@/lib/contexts/auth-context'
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminPanelHeader,
  AdminStatTile,
} from '@/components/admin/ui'

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; bar: string }> = {
  pending: { label: 'Menunggu', bg: 'bg-amber-50', text: 'text-amber-800', bar: 'bg-amber-500' },
  processing: { label: 'Diproses', bg: 'bg-sky-50', text: 'text-sky-800', bar: 'bg-sky-500' },
  ready: { label: 'Siap', bg: 'bg-violet-50', text: 'text-violet-800', bar: 'bg-violet-500' },
  shipped: { label: 'Dikirim', bg: 'bg-cyan-50', text: 'text-cyan-800', bar: 'bg-cyan-500' },
  delivered: { label: 'Selesai', bg: 'bg-emerald-50', text: 'text-emerald-800', bar: 'bg-emerald-500' },
  cancelled: { label: 'Batal', bg: 'bg-rose-50', text: 'text-rose-800', bar: 'bg-rose-500' },
}

function formatRpShort(n: number) {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}K`
  return `Rp${n.toLocaleString('id-ID')}`
}

export default function AdminDashboard() {
  const { orders } = useOrders()
  const { user } = useAuth()

  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const totalCustomers = new Set(orders.map(order => order.userId)).size
  const activeOrders = orders.filter(order => !['delivered', 'cancelled'].includes(order.status)).length

  const statusCounts = useMemo(() => {
    return orders.reduce<Record<string, number>>((map, order) => {
      map[order.status] = (map[order.status] ?? 0) + 1
      return map
    }, {})
  }, [orders])

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
  }, [orders])

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {}
    orders
      .filter(order => order.status !== 'cancelled')
      .forEach(order => {
        order.items.forEach(item => {
          if (!map[item.productId]) {
            map[item.productId] = { name: item.productName, qty: 0, revenue: 0 }
          }
          map[item.productId].qty += item.quantity
          map[item.productId].revenue += item.price * item.quantity
        })
      })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }, [orders])

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-5 sm:space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description={`Selamat datang kembali, ${user?.fullName ?? 'Admin'}. Pantau aktivitas toko dan pesanan prioritas hari ini.`}
        meta={today}
        actions={
          <Link href="/admin/orders">
            <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Kelola Pesanan
            </button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatTile label="Total Pesanan" value={totalOrders} hint="Sepanjang waktu" />
        <AdminStatTile label="Pesanan Aktif" value={activeOrders} hint="Belum selesai" tone="orange" />
        <AdminStatTile label="Pendapatan" value={formatRpShort(totalRevenue)} hint="Semua transaksi" tone="green" />
        <AdminStatTile label="Pelanggan" value={totalCustomers} hint="Akun unik" tone="blue" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
        <AdminPanel>
          <AdminPanelHeader title="Status Pesanan" description="Distribusi pekerjaan yang perlu dipantau tim." />
          <div className="space-y-3.5 p-4 sm:space-y-4 sm:p-5">
            {['pending', 'processing', 'ready', 'shipped', 'delivered'].map(status => {
              const count = statusCounts[status] ?? 0
              const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0
              const cfg = STATUS_CONFIG[status]

              return (
                <div
                  key={status}
                  className="grid grid-cols-[64px_minmax(0,1fr)_32px] items-center gap-2.5 sm:grid-cols-[88px_minmax(0,1fr)_36px] sm:gap-3"
                >
                  <span className="truncate text-xs font-medium text-slate-600 sm:text-sm">{cfg.label}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-right text-sm font-black text-slate-950">{count}</span>
                </div>
              )
            })}
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader title="Akses Cepat" description="Aksi yang paling sering dipakai." />
          <div className="space-y-2 p-3.5 sm:p-4">
            {[
              { href: '/admin/products', label: 'Tambah Produk' },
              { href: '/admin/orders', label: 'Lihat Pesanan' },
              { href: '/admin/reviews', label: 'Kelola Ulasan' },
              { href: '/admin/analytics', label: 'Lihat Laporan' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                {item.label}
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </AdminPanel>
      </div>

      {topProducts.length > 0 && (
        <AdminPanel>
          <AdminPanelHeader title="Produk Terlaris" description="Produk dengan kontribusi pendapatan tertinggi." />
          <div className="space-y-3.5 p-4 sm:space-y-4 sm:p-5">
            {topProducts.map((product, index) => {
              const maxRevenue = topProducts[0].revenue
              const pct = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0

              return (
                <div
                  key={product.name}
                  className="grid grid-cols-[20px_minmax(0,1fr)_72px] items-center gap-2.5 sm:grid-cols-[24px_minmax(0,1fr)_96px] sm:gap-3"
                >
                  <span className="text-right text-xs font-black text-slate-400">{index + 1}</span>
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center justify-between gap-2.5">
                      <span className="truncate text-sm font-bold text-slate-950">{product.name}</span>
                      <span className="shrink-0 text-[11px] text-slate-500 sm:text-xs">{product.qty} pcs</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-950" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-right text-xs font-black text-slate-950 sm:text-sm">
                    {formatRpShort(product.revenue)}
                  </span>
                </div>
              )
            })}
          </div>
        </AdminPanel>
      )}

      <AdminPanel className="overflow-hidden">
        <AdminPanelHeader
          title="Pesanan Terbaru"
          description="Aktivitas pesanan terbaru yang masuk ke sistem."
          action={
            <Link href="/admin/orders" className="text-sm font-bold text-slate-950 no-underline hover:text-slate-600">
              Lihat semua
            </Link>
          }
        />

        {recentOrders.length === 0 ? (
          <div className="p-4 sm:p-5">
            <AdminEmptyState title="Belum ada pesanan" description="Saat pelanggan checkout, pesanan terbaru akan tampil di sini." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Nomor Pesanan', 'Pelanggan', 'Total', 'Status', 'Tanggal'].map(header => (
                    <th
                      key={header}
                      className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.08em] text-slate-500 sm:px-5"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm font-bold text-slate-950 sm:px-5 sm:py-4">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600 sm:px-5 sm:py-4">
                        {order.shippingAddress.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm font-black text-slate-950 sm:px-5 sm:py-4">
                        Rp{order.total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 sm:px-5 sm:py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${cfg.bg} ${cfg.text}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500 sm:px-5 sm:py-4">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  )
}
