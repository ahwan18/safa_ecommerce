'use client'

import { useState } from 'react'
import { useReviews } from '@/lib/contexts/review-context'
import { Card } from '@/components/ui/card'
import { AdminPageHeader } from '@/components/admin/ui'

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= rating ? '#f59e0b' : '#d1d5db', fontSize: 14 }}>★</span>
      ))}
    </span>
  )
}

export default function AdminReviewsPage() {
  const { reviews, toggleVisibility, deleteReview } = useReviews()
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [filterVisible, setFilterVisible] = useState<'all' | 'visible' | 'hidden'>('all')

  // All reviews including hidden (admin sees all)
  const all = [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filtered = all.filter(r => {
    if (filterRating && r.rating !== filterRating) return false
    if (filterVisible === 'visible' && !r.isVisible) return false
    if (filterVisible === 'hidden' && r.isVisible) return false
    return true
  })

  const totalVisible = all.filter(r => r.isVisible).length
  const avgRating = all.filter(r => r.isVisible).length
    ? all.filter(r => r.isVisible).reduce((s, r) => s + r.rating, 0) / totalVisible
    : 0
  const starCounts = [5,4,3,2,1].map(s => ({ star: s, count: all.filter(r => r.rating === s && r.isVisible).length }))

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const d = Math.floor(diff / 86400000)
    if (d === 0) return 'Hari ini'
    if (d === 1) return 'Kemarin'
    return `${d} hari lalu`
  }

  return (
    <>

            <AdminPageHeader
              title="Ulasan"
              description="Moderasi ulasan pelanggan, jaga kualitas testimoni, dan pantau rating toko."
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-5 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Total Ulasan</p>
                <p className="text-3xl font-bold text-foreground">{all.length}</p>
              </Card>
              <Card className="p-5 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Rata-rata Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</p>
                  {avgRating > 0 && <span style={{ color: '#f59e0b', fontSize: 18 }}>★</span>}
                </div>
              </Card>
              {starCounts.slice(0, 2).map(({ star, count }) => (
                <Card key={star} className="p-5 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Rating {star} ★</p>
                  <p className="text-3xl font-bold text-foreground">{count}</p>
                </Card>
              ))}
            </div>

            {/* Star breakdown */}
            <Card className="p-6 border border-border mb-8">
              <h3 className="text-sm font-bold text-foreground mb-4">Distribusi Rating</h3>
              <div className="space-y-2">
                {starCounts.map(({ star, count }) => {
                  const pct = totalVisible > 0 ? (count / totalVisible) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-12 flex-shrink-0">{star} ★</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-bold text-foreground w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={filterRating ?? 'all'}
                onChange={e => setFilterRating(e.target.value === 'all' ? null : Number(e.target.value))}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Semua Rating</option>
                {[5,4,3,2,1].map(s => <option key={s} value={s}>{s} Bintang</option>)}
              </select>
              <select
                value={filterVisible}
                onChange={e => setFilterVisible(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Semua Status</option>
                <option value="visible">Ditampilkan</option>
                <option value="hidden">Disembunyikan</option>
              </select>
              <span className="self-center text-sm text-muted-foreground">{filtered.length} ulasan</span>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <Card className="border border-border">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-5xl mb-4">⭐</div>
                  <p className="text-lg font-semibold text-foreground mb-2">Belum ada ulasan</p>
                  <p className="text-sm text-muted-foreground">Ulasan dari pelanggan akan muncul di sini.</p>
                </div>
              </Card>
            ) : (
              <Card className="border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-3 px-4 font-semibold text-foreground/70">Pelanggan</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground/70">Produk</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground/70">Rating</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground/70">Komentar</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground/70">Tanggal</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground/70">Status</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground/70">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(r => (
                        <tr key={r.id} className={`border-b border-border/50 transition ${!r.isVisible ? 'opacity-50' : 'hover:bg-muted/20'}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#1e3a5f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                {r.userFullName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-foreground truncate max-w-[120px]">{r.userFullName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-foreground/70 truncate max-w-[150px]">{r.productName}</td>
                          <td className="py-3 px-4 text-center"><Stars rating={r.rating} /></td>
                          <td className="py-3 px-4">
                            <p className="text-foreground/80 line-clamp-2 max-w-[200px]">{r.reviewText}</p>
                            {r.reviewImageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.reviewImageUrl} alt="foto" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, marginTop: 4, border: '1px solid #e5e7eb' }} />
                            )}
                          </td>
                          <td className="py-3 px-4 text-foreground/60 whitespace-nowrap">{timeAgo(r.createdAt)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {r.isVisible ? 'Tampil' : 'Tersembunyi'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => toggleVisibility(r.id)}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                {r.isVisible ? 'Sembunyikan' : 'Tampilkan'}
                              </button>
                              <span className="text-border">|</span>
                              <button
                                onClick={() => { if (confirm('Hapus ulasan ini?')) deleteReview(r.id) }}
                                className="text-xs font-medium text-destructive hover:underline"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

    </>
  )
}
