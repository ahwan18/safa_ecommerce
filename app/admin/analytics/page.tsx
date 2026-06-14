'use client'

import React, { useState, useMemo } from 'react'
import { useOrders } from '@/lib/contexts/order-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageHeader } from '@/components/admin/ui'
import { exportToCSV } from '@/lib/utils/csv-export'
import type { Order } from '@/lib/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10) // "YYYY-MM-DD"
}

function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}K`
  return `Rp${n.toLocaleString('id-ID')}`
}

function formatRpFull(n: number) {
  return `Rp${n.toLocaleString('id-ID')}`
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Tertunda',
  processing: 'Diproses',
  ready: 'Siap Kirim',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  ready: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

// ─── types ───────────────────────────────────────────────────────────────────

interface DailyRow {
  date: string
  total: number
  delivered: number
  cancelled: number
  pending: number
  revenue: number
  orders: Order[]
}

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminLaporanPage() {
  const { orders } = useOrders()

  // Filter state
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo)
  const [dateTo, setDateTo] = useState(today)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [sortCol, setSortCol] = useState<'date' | 'total' | 'revenue'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // ── filtered orders ──────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const d = toDateStr(o.createdAt)
      if (d < dateFrom || d > dateTo) return false
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      return true
    })
  }, [orders, dateFrom, dateTo, statusFilter])

  // ── summary cards ────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const total = filteredOrders.length
    const delivered = filteredOrders.filter(o => o.status === 'delivered').length
    const cancelled = filteredOrders.filter(o => o.status === 'cancelled').length
    const revenue = filteredOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + o.total, 0)
    const avgOrder = total > 0 ? revenue / total : 0
    return { total, delivered, cancelled, revenue, avgOrder }
  }, [filteredOrders])

  // ── daily rows ───────────────────────────────────────────────────────────
  const dailyRows = useMemo(() => {
    const map: Record<string, DailyRow> = {}
    filteredOrders.forEach(o => {
      const d = toDateStr(o.createdAt)
      if (!map[d]) map[d] = { date: d, total: 0, delivered: 0, cancelled: 0, pending: 0, revenue: 0, orders: [] }
      map[d].total++
      map[d].orders.push(o)
      if (o.status === 'delivered') map[d].delivered++
      if (o.status === 'cancelled') map[d].cancelled++
      if (['pending', 'processing'].includes(o.status)) map[d].pending++
      if (o.status !== 'cancelled') map[d].revenue += o.total
    })

    const rows = Object.values(map)

    // sort
    rows.sort((a, b) => {
      let diff = 0
      if (sortCol === 'date') diff = a.date.localeCompare(b.date)
      else if (sortCol === 'total') diff = a.total - b.total
      else diff = a.revenue - b.revenue
      return sortDir === 'asc' ? diff : -diff
    })

    return rows
  }, [filteredOrders, sortCol, sortDir])

  // ── sort toggle ──────────────────────────────────────────────────────────
  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function SortIcon({ col }: { col: typeof sortCol }) {
    if (sortCol !== col) return <span className="text-muted-foreground/40 ml-1">↕</span>
    return <span className="text-primary ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  // ── quick range presets ──────────────────────────────────────────────────
  function setRange(days: number) {
    setDateTo(today)
    setDateFrom(new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10))
  }

  // ── export CSV ───────────────────────────────────────────────────────────
  function handleExportCSV() {
    const rows = dailyRows.map(r => [
      r.date,
      r.total.toString(),
      r.delivered.toString(),
      r.cancelled.toString(),
      r.pending.toString(),
      r.revenue.toString(),
    ])

    exportToCSV({
      filename: `laporan_penjualan_${dateFrom}_${dateTo}`,
      headers: ['Tanggal', 'Total Pesanan', 'Selesai', 'Dibatalkan', 'Pending', 'Pendapatan'],
      rows,
    })
  }

  return (
    <div className="space-y-8">

            <AdminPageHeader
              title="Laporan"
              description="Analisis performa pesanan, status, dan pendapatan dalam rentang tanggal pilihan."
              actions={
                <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </Button>
              }
            />

            {/* ── Filter Bar ── */}
            <Card className="p-5 border border-border">
              <div className="flex flex-wrap gap-4 items-end">
                {/* Date range */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Dari Tanggal</label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Sampai Tanggal</label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
                </div>

                {/* Status filter */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Semua Status</option>
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Quick presets */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: '7 Hari', days: 7 },
                    { label: '30 Hari', days: 30 },
                    { label: '90 Hari', days: 90 },
                  ].map(p => (
                    <button
                      key={p.days}
                      onClick={() => setRange(p.days)}
                      className="px-3 py-2 text-xs font-medium border border-border rounded-md hover:bg-muted transition"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Pesanan', value: summary.total, color: 'text-foreground' },
                { label: 'Selesai', value: summary.delivered, color: 'text-green-600' },
                { label: 'Dibatalkan', value: summary.cancelled, color: 'text-red-600' },
                { label: 'Pendapatan', value: formatRp(summary.revenue), color: 'text-primary' },
                { label: 'Rata-rata/Pesanan', value: formatRp(summary.avgOrder), color: 'text-foreground' },
              ].map(c => (
                <Card key={c.label} className="p-5 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                </Card>
              ))}
            </div>

            {/* ── Daily Table ── */}
            <Card className="border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Laporan Harian</h2>
                <span className="text-sm text-muted-foreground">{dailyRows.length} hari</span>
              </div>

              {dailyRows.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <p className="text-sm">Tidak ada data untuk rentang tanggal ini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th
                          className="text-left py-3 px-4 font-semibold text-foreground/70 cursor-pointer hover:text-foreground select-none"
                          onClick={() => toggleSort('date')}
                        >
                          Tanggal <SortIcon col="date" />
                        </th>
                        <th
                          className="text-center py-3 px-4 font-semibold text-foreground/70 cursor-pointer hover:text-foreground select-none"
                          onClick={() => toggleSort('total')}
                        >
                          Total <SortIcon col="total" />
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-green-700">Selesai</th>
                        <th className="text-center py-3 px-4 font-semibold text-red-600">Dibatalkan</th>
                        <th className="text-center py-3 px-4 font-semibold text-yellow-700">Pending</th>
                        <th
                          className="text-right py-3 px-4 font-semibold text-foreground/70 cursor-pointer hover:text-foreground select-none"
                          onClick={() => toggleSort('revenue')}
                        >
                          Pendapatan <SortIcon col="revenue" />
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground/70">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyRows.map(row => (
                        <React.Fragment key={row.date}>
                          <tr
                            className="border-b border-border/50 hover:bg-muted/20 transition"
                          >
                            <td className="py-3 px-4 font-medium text-foreground">
                              {new Date(row.date + 'T00:00:00').toLocaleDateString('id-ID', {
                                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-foreground">{row.total}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-green-600">{row.delivered}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-red-600">{row.cancelled}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-yellow-700">{row.pending}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-primary">
                              {formatRpFull(row.revenue)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setExpandedDate(expandedDate === row.date ? null : row.date)}
                                className="px-3 py-1 text-xs font-medium border border-border rounded-md hover:bg-muted transition"
                              >
                                {expandedDate === row.date ? 'Tutup' : 'Lihat'}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded detail rows */}
                          {expandedDate === row.date && (
                            <tr className="bg-muted/10">
                              <td colSpan={7} className="px-6 py-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                  Detail Pesanan — {row.date}
                                </p>
                                <div className="overflow-x-auto rounded-lg border border-border">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-border bg-muted/40">
                                        <th className="text-left py-2 px-3 font-semibold text-foreground/70">No. Pesanan</th>
                                        <th className="text-left py-2 px-3 font-semibold text-foreground/70">Pelanggan</th>
                                        <th className="text-left py-2 px-3 font-semibold text-foreground/70">Produk</th>
                                        <th className="text-center py-2 px-3 font-semibold text-foreground/70">Status</th>
                                        <th className="text-right py-2 px-3 font-semibold text-foreground/70">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {row.orders.map(o => (
                                        <tr key={o.id} className="border-b border-border/40 hover:bg-muted/20">
                                          <td className="py-2 px-3 font-mono text-foreground">{o.orderNumber}</td>
                                          <td className="py-2 px-3 text-foreground/80">{o.shippingAddress.name}</td>
                                          <td className="py-2 px-3 text-foreground/70">
                                            {o.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLOR[o.status] ?? 'bg-muted text-foreground'}`}>
                                              {STATUS_LABEL[o.status] ?? o.status}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-right font-bold text-primary">
                                            {formatRpFull(o.total)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>

                    {/* Footer totals */}
                    <tfoot>
                      <tr className="border-t-2 border-border bg-muted/20">
                        <td className="py-3 px-4 font-bold text-foreground">Total</td>
                        <td className="py-3 px-4 text-center font-bold text-foreground">{summary.total}</td>
                        <td className="py-3 px-4 text-center font-bold text-green-600">{summary.delivered}</td>
                        <td className="py-3 px-4 text-center font-bold text-red-600">{summary.cancelled}</td>
                        <td className="py-3 px-4 text-center font-bold text-yellow-700">
                          {filteredOrders.filter(o => ['pending', 'processing'].includes(o.status)).length}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-primary">{formatRpFull(summary.revenue)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>

            {/* ── Status Breakdown ── */}
            <Card className="p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-5">Distribusi Status Pesanan</h2>
              <div className="space-y-3">
                {Object.entries(STATUS_LABEL).map(([status, label]) => {
                  const count = filteredOrders.filter(o => o.status === status).length
                  const pct = summary.total > 0 ? (count / summary.total) * 100 : 0
                  return (
                    <div key={status} className="flex items-center gap-4">
                      <span className="w-24 text-sm text-foreground/70 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-sm font-bold text-foreground text-right">{count}</span>
                      <span className="w-10 text-xs text-muted-foreground text-right">{pct.toFixed(0)}%</span>
                    </div>
                  )
                })}
              </div>
            </Card>
    </div>
  )
}
