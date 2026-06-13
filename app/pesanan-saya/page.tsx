'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuth } from '@/lib/contexts/auth-context'
import { useOrders } from '@/lib/contexts/order-context'
import { useReviews } from '@/lib/contexts/review-context'
import { ReviewModal } from '@/components/review/review-modal'
import { WhatsAppInlineButton } from '@/components/whatsapp-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Order } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

const ORDER_STATUS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:    { label: 'Menunggu Pembayaran', bg: '#fffbeb', text: '#92400e', dot: '#f59e0b' },
  processing: { label: 'Diproses',            bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  ready:      { label: 'Siap Dikirim',         bg: '#faf5ff', text: '#6b21a8', dot: '#a855f7' },
  shipped:    { label: 'Dikirim',              bg: '#ecfeff', text: '#155e75', dot: '#06b6d4' },
  delivered:  { label: 'Selesai',              bg: '#f0fdf4', text: '#14532d', dot: '#22c55e' },
  cancelled:  { label: 'Dibatalkan',           bg: '#fff1f2', text: '#9f1239', dot: '#f43f5e' },
}

const PAY_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Belum Dibayar', bg: '#fffbeb', text: '#92400e' },
  paid:    { label: 'Lunas',          bg: '#f0fdf4', text: '#14532d' },
  failed:  { label: 'Gagal',          bg: '#fff1f2', text: '#9f1239' },
}

const TIMELINE = [
  { key: 'created',    label: 'Pesanan Dibuat' },
  { key: 'paid',       label: 'Pembayaran Diterima' },
  { key: 'processing', label: 'Sedang Diproduksi' },
  { key: 'quality',    label: 'Quality Control' },
  { key: 'ready',      label: 'Siap Dikirim' },
  { key: 'shipped',    label: 'Dalam Pengiriman' },
  { key: 'delivered',  label: 'Pesanan Selesai' },
]

function getActiveStep(status: string, payStatus: string): number {
  if (status === 'delivered')   return 7
  if (status === 'shipped')     return 6
  if (status === 'ready')       return 5
  if (status === 'processing')  return payStatus === 'paid' ? 3 : 2
  if (status === 'pending')     return payStatus === 'paid' ? 2 : 1
  return 1
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Chip({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span style={{
      display: 'inline-block', backgroundColor: bg, color: text,
      fontSize: 11, fontWeight: 700, padding: '3px 10px',
      borderRadius: 99, whiteSpace: 'nowrap', lineHeight: 1.5,
    }}>
      {label}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: '#9ca3af',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: 12,
    }}>
      {children}
    </p>
  )
}

function InfoGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
      {items.map(({ label, value }) => (
        <div key={label} style={{ backgroundColor: '#f9fafb', borderRadius: 10, padding: '10px 14px', border: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, lineHeight: 1 }}>{label}</p>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</div>
        </div>
      ))}
    </div>
  )
}

// ── Order Detail Panel ────────────────────────────────────────────────────────

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const os = ORDER_STATUS[order.status]
  const ps = PAY_STATUS[order.paymentStatus]
  const activeStep = order.status === 'cancelled' ? -1 : getActiveStep(order.status, order.paymentStatus)

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1.5px solid #e5e7eb',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
    }}>
      {/* ── Detail Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
            {order.orderNumber}
          </span>
          {os && <Chip label={os.label} bg={os.bg} text={os.text} />}
          {ps && <Chip label={ps.label} bg={ps.bg} text={ps.text} />}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            width: 28, height: 28, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9ca3af', fontSize: 18, lineHeight: 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── 1. Timeline ── */}
        {order.status === 'cancelled' ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 20px', backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3', borderRadius: 12,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>❌</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#9f1239', marginBottom: 2 }}>Pesanan Dibatalkan</p>
              <p style={{ fontSize: 12, color: '#e11d48' }}>Pesanan ini telah dibatalkan.</p>
            </div>
          </div>
        ) : (
          <div>
            <SectionTitle>Timeline Pesanan</SectionTitle>
            <div style={{ paddingLeft: 4 }}>
              {TIMELINE.map((step, i) => {
                const done = activeStep > i
                const active = activeStep === i + 1
                const last = i === TIMELINE.length - 1
                return (
                  <div key={step.key} style={{ display: 'flex', gap: 16 }}>
                    {/* Dot + line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: done ? '#1e3a5f' : active ? '#fff' : '#f1f5f9',
                        border: active ? '2.5px solid #1e3a5f' : done ? 'none' : '2px solid #e2e8f0',
                        fontSize: 10, fontWeight: 800, color: '#fff',
                      }}>
                        {done && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {active && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#1e3a5f' }} />}
                      </div>
                      {!last && (
                        <div style={{ width: 2, flexGrow: 1, minHeight: 20, backgroundColor: done ? '#1e3a5f' : '#e2e8f0', margin: '3px 0' }} />
                      )}
                    </div>
                    {/* Text */}
                    <div style={{ paddingBottom: last ? 0 : 20, paddingTop: 1 }}>
                      <p style={{
                        fontSize: 13, lineHeight: 1.4,
                        fontWeight: active ? 700 : done ? 600 : 400,
                        color: done ? '#0f172a' : active ? '#1e3a5f' : '#94a3b8',
                      }}>
                        {step.label}
                      </p>
                      {active && (
                        <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Sedang berlangsung</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 2. Informasi Pesanan ── */}
        <div>
          <SectionTitle>Informasi Pesanan</SectionTitle>
          <InfoGrid items={[
            { label: 'Nomor Pesanan', value: <span style={{ fontFamily: 'monospace' }}>{order.orderNumber}</span> },
            { label: 'Tanggal Pesanan', value: new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { label: 'Status Pesanan', value: os ? <Chip label={os.label} bg={os.bg} text={os.text} /> : order.status },
            { label: 'Status Pembayaran', value: ps ? <Chip label={ps.label} bg={ps.bg} text={ps.text} /> : order.paymentStatus },
          ]} />
        </div>

        {/* ── 3. Produk ── */}
        <div>
          <SectionTitle>Detail Produk</SectionTitle>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            {order.items.map((item, i) => (
              <div key={i} style={{
                padding: '14px 16px',
                borderBottom: i < order.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{item.productName}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 4, columnGap: 16, fontSize: 12, color: '#64748b' }}>
                    <span>Jenis: <b style={{ color: '#334155' }}>{item.selectedMethod}</b></span>
                    <span>Qty: <b style={{ color: '#334155' }}>{item.quantity} pcs</b></span>
                    <span>Harga: <b style={{ color: '#334155' }}>Rp{item.price.toLocaleString('id-ID')}/pcs</b></span>
                  </div>
                  {item.customization?.notes && (
                    <p style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 6, paddingLeft: 8, borderLeft: '2px solid #e2e8f0' }}>
                      {item.customization.notes}
                    </p>
                  )}
                  {item.customization?.designUrl && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      {/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.customization.designUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.customization.designUrl} alt="desain" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📄</div>
                      )}
                      <div>
                        <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>File Desain</p>
                        <a href={item.customization.designUrl} download target="_blank" rel="noreferrer"
                          style={{ fontSize: 12, color: '#1e3a5f', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                          Download
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#1e3a5f' }}>Rp{(item.price * item.quantity).toLocaleString('id-ID')}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>subtotal</p>
                </div>
              </div>
            ))}
            {/* Ringkasan biaya */}
            <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
              {[
                { label: 'Subtotal Produk', value: `Rp${(order.total - 50000).toLocaleString('id-ID')}` },
                { label: 'Ongkos Kirim',    value: 'Rp50.000' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                  <span>{row.label}</span><span>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 6 }}>
                <span>Total Pembayaran</span>
                <span style={{ color: '#1e3a5f' }}>Rp{order.total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Pengiriman ── */}
        <div>
          <SectionTitle>Alamat Pengiriman</SectionTitle>
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{order.shippingAddress.name}</p>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>{order.shippingAddress.phone}</p>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              {order.shippingAddress.street},{' '}{order.shippingAddress.city},{' '}{order.shippingAddress.province}{' '}{order.shippingAddress.postalCode}
            </p>
            {order.status === 'shipped' && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#06b6d4', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#155e75' }}>Dalam pengiriman · Resi: <span style={{ fontFamily: 'monospace' }}>PENDING</span></span>
              </div>
            )}
          </div>
        </div>

        {/* ── 5. Pembayaran ── */}
        <div>
          <SectionTitle>Pembayaran</SectionTitle>
          <InfoGrid items={[
            { label: 'Status',   value: ps ? <Chip label={ps.label} bg={ps.bg} text={ps.text} /> : order.paymentStatus },
            { label: 'Total',    value: <span style={{ color: '#1e3a5f', fontWeight: 800 }}>Rp{order.total.toLocaleString('id-ID')}</span> },
            { label: 'Tanggal', value: new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) },
          ]} />
        </div>

      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PesananSayaPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { orders } = useOrders()

  const [expandedId, setExpandedId]     = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch]             = useState('')
  const [reviewTarget, setReviewTarget] = useState<{ order: Order } | null>(null)
  const [toast, setToast]               = useState<string | null>(null)

  const { getReviewByOrderId } = useReviews()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const myOrders = useMemo(
    () => orders
      .filter(o => String(o.userId) === String(user?.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, user?.id]
  )

  const countOf = (s: string) => myOrders.filter(o => o.status === s).length

  const filteredOrders = useMemo(() => {
    let list = filterStatus === 'all' ? myOrders : myOrders.filter(o => o.status === filterStatus)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.items.some(i => i.productName.toLowerCase().includes(q))
      )
    }
    return list
  }, [myOrders, filterStatus, search])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/pesanan-saya')
    }
  }, [isAuthenticated, isLoading, router])

  if (!isLoading && !isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Memuat...</p>
        </div>
        <Footer />
      </>
    )
  }

  const tabs = [
    { key: 'all',        label: 'Semua',              count: myOrders.length },
    { key: 'pending',    label: 'Menunggu',            count: countOf('pending') },
    { key: 'processing', label: 'Diproses',            count: countOf('processing') },
    { key: 'shipped',    label: 'Dikirim',             count: countOf('shipped') },
    { key: 'delivered',  label: 'Selesai',             count: countOf('delivered') },
    { key: 'cancelled',  label: 'Dibatalkan',          count: countOf('cancelled') },
  ]

  return (
    <>
      <Header />
      <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 16px 60px' }}>

          {/* ── Page Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Pesanan Saya</h1>
              <p style={{ fontSize: 13, color: '#64748b' }}>Kelola dan pantau seluruh pesanan Anda di sini.</p>
            </div>
            <Link href="/shop">
              <Button size="sm" className="shrink-0">Belanja Sekarang</Button>
            </Link>
          </div>

          {/* ── Search ── */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setExpandedId(null) }}
              placeholder="Cari nomor pesanan atau nama produk..."
              className="pl-9 bg-white"
            />
          </div>

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
            {tabs.map(tab => {
              const active = filterStatus === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => { setFilterStatus(tab.key); setExpandedId(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap',
                    backgroundColor: active ? '#1e3a5f' : '#fff',
                    color: active ? '#fff' : '#64748b',
                    boxShadow: active ? '0 2px 8px rgba(30,58,95,0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                  <span style={{
                    fontSize: 11, fontWeight: 700, minWidth: 18, height: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 99, padding: '0 5px',
                    backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: active ? '#fff' : '#94a3b8',
                  }}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Empty State ── */}
          {filteredOrders.length === 0 && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📦</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Belum ada pesanan</p>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
                {search
                  ? `Tidak ada pesanan yang cocok dengan "${search}".`
                  : filterStatus === 'all'
                  ? 'Kamu belum pernah melakukan pemesanan. Yuk mulai belanja!'
                  : `Tidak ada pesanan dengan status "${ORDER_STATUS[filterStatus]?.label ?? filterStatus}".`}
              </p>
              <Link href="/shop"><Button>Belanja Sekarang</Button></Link>
            </div>
          )}

          {/* ── Order Cards ── */}
          {filteredOrders.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredOrders.map(order => {
                const isExpanded = expandedId === order.id
                const os = ORDER_STATUS[order.status]
                const ps = PAY_STATUS[order.paymentStatus]
                const totalQty = order.items.reduce((s, i) => s + i.quantity, 0)

                return (
                  <div key={order.id}>
                    {/* Card */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      style={{
                        backgroundColor: '#fff',
                        border: isExpanded ? '1.5px solid #1e3a5f' : '1px solid #e5e7eb',
                        borderRadius: 14,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: isExpanded
                          ? '0 4px 20px rgba(30,58,95,0.12)'
                          : '0 1px 4px rgba(0,0,0,0.05)',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                    >
                      {/* Card header row */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', backgroundColor: isExpanded ? '#f0f4ff' : '#f8fafc',
                        borderBottom: '1px solid #f1f5f9', gap: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
                          {/* Status dot */}
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: os?.dot ?? '#94a3b8', flexShrink: 0 }} />
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
                            {order.orderNumber}
                          </span>
                          {os && <Chip label={os.label} bg={os.bg} text={os.text} />}
                          {ps && <Chip label={ps.label} bg={ps.bg} text={ps.text} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>
                            {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <svg
                            style={{ width: 15, height: 15, color: isExpanded ? '#1e3a5f' : '#94a3b8', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.items.map(i => i.productName).join(', ')}
                          </p>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                            <span>Metode: <strong style={{ color: '#334155' }}>{[...new Set(order.items.map(i => i.selectedMethod))].join(', ')}</strong></span>
                            <span>Qty: <strong style={{ color: '#334155' }}>{totalQty} pcs</strong></span>
                            <span>{order.items.length} produk</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 16, fontWeight: 800, color: '#1e3a5f', marginBottom: 4 }}>
                            Rp{order.total.toLocaleString('id-ID')}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                            <button
                              onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : order.id) }}
                              style={{
                                fontSize: 12, fontWeight: 700, color: isExpanded ? '#fff' : '#1e3a5f',
                                backgroundColor: isExpanded ? '#1e3a5f' : '#fff',
                                border: '1.5px solid #1e3a5f', borderRadius: 7,
                                padding: '4px 12px', cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >
                              {isExpanded ? '▲ Tutup' : 'Lihat Detail'}
                            </button>

                            {/* Tombol Ulasan — hanya pesanan selesai */}
                            {order.status === 'delivered' && (() => {
                              const existingReview = getReviewByOrderId(order.id)
                              return (
                                <button
                                  onClick={e => { e.stopPropagation(); setReviewTarget({ order }) }}
                                  style={{
                                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                    borderRadius: 7, padding: '4px 12px',
                                    border: '1.5px solid #f59e0b',
                                    backgroundColor: existingReview ? '#fffbeb' : '#f59e0b',
                                    color: existingReview ? '#92400e' : '#fff',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {existingReview ? '✏ Edit Ulasan' : '⭐ Beri Ulasan'}
                                </button>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detail panel */}
                    {isExpanded && (
                      <OrderDetail order={order} onClose={() => setExpandedId(null)} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Review Modal */}
      {reviewTarget && user && (
        <ReviewModal
          orderId={reviewTarget.order.id}
          productId={reviewTarget.order.items[0]?.productId ?? ''}
          productName={reviewTarget.order.items.map(i => i.productName).join(', ')}
          userId={String(user.id)}
          userFullName={user.fullName}
          existingReview={getReviewByOrderId(reviewTarget.order.id)}
          onClose={() => setReviewTarget(null)}
          onSuccess={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#1e3a5f', color: '#fff', padding: '12px 24px',
          borderRadius: 12, fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 99999, whiteSpace: 'nowrap',
        }}>
          ✓ {toast}
        </div>
      )}
    </>
  )
}
