'use client'

import { useState, useEffect } from 'react'
import { useOrders } from '@/lib/contexts/order-context'
import { useNotifications, buildStatusNotif } from '@/lib/contexts/notification-context'
import { Button } from '@/components/ui/button'
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminPanelHeader, AdminStatTile } from '@/components/admin/ui'
import { exportToCSV } from '@/lib/utils/csv-export'
// Diperbaiki: Menggunakan kurung kurawal sesuai perintah error TS lu agar membaca named export
import { supabase } from '@/lib/supabase/client'

const statusOptions = [
  { value: 'pending', label: 'Tertunda' },
  { value: 'processing', label: 'Diproses' },
  { value: 'ready', label: 'Siap Dikirim' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'delivered', label: 'Tiba' }
]

export default function AdminOrdersPage() {
  const { orders, updateOrder } = useOrders()
  const { addNotification } = useNotifications()
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  useEffect(() => {
    // AKTIVASI REALTIME: Dengerin setiap ada update status otomatis di tabel orders dari Webhook Duitku
    const channel = supabase
      .channel('admin-orders-webhook-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload: any) => {
          console.log('Realtime Update Diterima:', payload.new)
          
          if (payload.new && payload.new.id) {
            updateOrder(payload.new.id, {
              status: payload.new.status,
              payment_status: payload.new.payment_status,
              payment_reference: payload.new.payment_reference,
              updatedAt: new Date(payload.new.updated_at || Date.now())
            } as any)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [updateOrder])

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    ready: 'bg-purple-100 text-purple-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-green-100 text-green-800'
  }

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrder(orderId, { status: newStatus as any })
    const order = orders.find(o => o.id === orderId)
    if (order) {
      addNotification(buildStatusNotif(order.userId, order.orderNumber, order.id, newStatus))
    }
    alert('Status pesanan berhasil diubah')
  }

  const handleExportCSV = () => {
    const rows = orders.map(o => [
      o.orderNumber,
      o.shippingAddress.name,
      o.shippingAddress.email,
      o.status,
      new Date(o.createdAt).toLocaleDateString('id-ID'),
      o.total.toString(),
    ])

    exportToCSV({
      filename: `laporan_pesanan_${new Date().toISOString().split('T')[0]}`,
      headers: ['No. Pesanan', 'Pelanggan', 'Email', 'Status', 'Tanggal', 'Total (Rp)'],
      rows,
    })
  }

  const selectedOrderData = orders.find(o => o.id === selectedOrder)
  const pendingCount = orders.filter(o => o.status === 'pending').length
  const activeCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pesanan"
        description="Pantau pesanan masuk, ubah status, dan tindak lanjuti pengiriman dari satu ruang kerja."
        actions={
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatTile label="Total Pesanan" value={orders.length} hint="Semua status" tone="slate" />
        <AdminStatTile label="Perlu Diproses" value={activeCount} hint={`${pendingCount} masih tertunda`} tone="orange" />
        <AdminStatTile label="Nilai Pesanan" value={`Rp${totalRevenue.toLocaleString('id-ID')}`} hint="Akumulasi saat ini" tone="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Orders List */}
        <div>
          <AdminPanel className="overflow-hidden">
            <AdminPanelHeader title="Daftar Pesanan" description={`${orders.length} pesanan tercatat`} />

            <div className="max-h-[620px] space-y-3 overflow-y-auto p-4">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order.id)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      selectedOrder === order.id
                        ? 'border-slate-950 bg-slate-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-foreground">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.shippingAddress?.name || 'No Name'}
                        </p>
                      </div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${statusColors[order.status] || 'bg-slate-100'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('id-ID')}
                      </span>
                      <span className="font-bold text-primary">
                        Rp{order.total.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <AdminEmptyState title="Belum ada pesanan" description="Pesanan pelanggan akan muncul di sini." />
              )}
            </div>
          </AdminPanel>
        </div>

        {/* Order Details */}
        <div className="lg:col-span-1">
          {selectedOrderData ? (
            <AdminPanel className="sticky top-4 p-5">
              <h3 className="text-xl font-bold text-foreground mb-6">Detail Pesanan</h3>

              <div className="space-y-4 mb-6 pb-6 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Nomor Pesanan</p>
                  <p className="font-bold text-foreground">{selectedOrderData.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pelanggan</p>
                  <p className="font-bold text-foreground">{selectedOrderData.shippingAddress?.name || '-'}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrderData.shippingAddress?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">
                    Rp{selectedOrderData.total.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-3">Ubah Status</p>
                <select
                  value={selectedOrderData.status}
                  onChange={(e) => handleStatusChange(selectedOrderData.id, e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Alamat</p>
                  <p className="text-sm text-foreground/70">
                    {selectedOrderData.shippingAddress?.street}<br />
                    {selectedOrderData.shippingAddress?.city}, {selectedOrderData.shippingAddress?.province}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telepon</p>
                  <p className="text-sm text-foreground/70">{selectedOrderData.shippingAddress?.phone || '-'}</p>
                </div>
              </div>

              <Button className="w-full mt-6" size="sm">
                Cetak Label Pengiriman
              </Button>
            </AdminPanel>
          ) : (
            <AdminEmptyState title="Pilih pesanan" description="Detail, alamat, dan kontrol status akan tampil di sini." />
          )}
        </div>
      </div>
    </div>
  )
}