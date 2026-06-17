'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useCart } from '@/lib/contexts/cart-context'
import { useOrders } from '@/lib/contexts/order-context'
import { useProducts } from '@/lib/contexts/product-context'
import { useAuth } from '@/lib/contexts/auth-context'
import { useNotifications, buildOrderNotif, buildAdminNewOrderNotif, buildAdminDesignNotif } from '@/lib/contexts/notification-context'
import { useAddresses, type UserAddress } from '@/lib/contexts/address-context'
import { Order, Address } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DropZone } from '@/components/ui/drop-zone'
import { ShippingSelector } from '@/components/checkout/shipping-selector'
import { useShippingConfig } from '@/lib/contexts/shipping-config-context'
import { estimateCartWeightGrams } from '@/lib/shipping/utils'
import type { ShippingSelection } from '@/lib/shipping/types'
import { AddressFormModal } from '@/components/address/address-form-modal'
import { createOrder } from '@/lib/supabase/order-queries'

type CheckoutStep = 'shipping' | 'design' | 'payment' | 'review'

function addrToCheckout(a: UserAddress): Address {
  return {
    name: a.recipientName,
    phone: a.phone,
    email: '',
    street: a.fullAddress,
    city: a.city,
    province: a.province,
    postalCode: a.postalCode,
  }
}

export default function CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>('shipping')
  const [loading, setLoading] = useState(false)
  const { items, clearCart } = useCart()
  const { addOrder } = useOrders()
  const { products, updateProduct } = useProducts()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { addNotification } = useNotifications()
  const { getUserAddresses, addAddress } = useAddresses()
  const { originCity } = useShippingConfig()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/checkout')
    }
  }, [authLoading, isAuthenticated, router])

  const userId = user?.id?.toString() ?? ''
  const savedAddresses = getUserAddresses(userId)
  const defaultAddr = savedAddresses.find(a => a.isDefault) ?? savedAddresses[0]

  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(defaultAddr?.id ?? null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [manualAddress, setManualAddress] = useState<Address>({
    name: '', phone: '', email: '',
    street: '', city: '', province: '', postalCode: '',
  })

  const selectedSaved = savedAddresses.find(a => a.id === selectedAddrId)
  const address: Address = selectedSaved
    ? { ...addrToCheckout(selectedSaved), email: user?.email ?? '' }
    : manualAddress

  const isAddressComplete = selectedSaved
    ? true
    : Object.values(manualAddress).every(v => v !== '')

  const [paymentMethod, setPaymentMethod] = useState('duitku')
  const [shippingSelection, setShippingSelection] = useState<ShippingSelection | null>(null)

  useEffect(() => {
    setShippingSelection(null)
  }, [selectedAddrId, manualAddress.city, manualAddress.province, manualAddress.postalCode])

  const [designs, setDesigns] = useState<Record<string, { file: File | null; preview: string; notes: string }>>({})

  const cartItems = items
    .map(item => ({ ...item, product: products.find(p => p.id === item.productId) }))
    .filter(item => item.product)

  const outOfStockItems = cartItems.filter(item => {
    const stock = (item.product as { stock?: number })?.stock
    return stock != null && stock === 0
  })
  const hasOutOfStock = outOfStockItems.length > 0

  const subtotal = cartItems.reduce((t, item) => t + (item.product?.price || 0) * item.quantity, 0)
  const weightGrams = estimateCartWeightGrams(cartItems.map(item => item.quantity))
  const shipping = shippingSelection?.cost ?? 0
  const total = subtotal + shipping

  const addressShippingHint = selectedSaved
    ? {
        city: selectedSaved.city,
        province: selectedSaved.province,
        district: selectedSaved.district,
        postalCode: selectedSaved.postalCode,
      }
    : manualAddress.city.trim() && manualAddress.province.trim()
      ? {
          city: manualAddress.city,
          province: manualAddress.province,
          postalCode: manualAddress.postalCode,
        }
      : null

  const handleAddressChange = (field: keyof Address, value: string) => {
    setManualAddress(prev => ({ ...prev, [field]: value }))
  }

  const handleDesignFile = (itemId: string, file: File) => {
    const preview = URL.createObjectURL(file)
    setDesigns(prev => ({ ...prev, [itemId]: { ...prev[itemId], file, preview, notes: prev[itemId]?.notes || '' } }))
  }

  const handleDesignNotes = (itemId: string, notes: string) => {
    setDesigns(prev => ({ ...prev, [itemId]: { ...prev[itemId], notes, file: prev[itemId]?.file || null, preview: prev[itemId]?.preview || '' } }))
  }

  const handleRemoveDesign = (itemId: string) => {
    setDesigns(prev => ({ ...prev, [itemId]: { file: null, preview: '', notes: prev[itemId]?.notes || '' } }))
  }

  const handlePlaceOrder = async () => {
    if (!isAddressComplete) {
      alert('Mohon lengkapi semua data pengiriman')
      return
    }
    if (!shippingSelection) {
      alert('Mohon pilih layanan kurir pengiriman')
      return
    }
    if (hasOutOfStock) {
      alert('Beberapa produk sudah habis stok. Hapus dari keranjang terlebih dahulu.')
      return
    }

    setLoading(true)
    try {
      const orderNumber = `ORD-${Date.now()}`
      const targetUserId = userId || `user-${Date.now()}`

      // 1. Simpan order ke database agar callback Duitku bisa memperbarui statusnya.
      const newOrder: Order = {
        id: orderNumber,
        orderNumber,
        userId: targetUserId,
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.product?.name || '',
          quantity: item.quantity,
          price: item.product?.price || 0,
          selectedMethod: item.selectedMethod,
          customization: {
            designUrl: designs[item.id]?.preview || item.customization?.designUrl,
            notes: designs[item.id]?.notes || item.customization?.notes,
          },
        })),
        subtotal,
        shippingCost: shippingSelection.cost,
        shippingInfo: shippingSelection,
        total,
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: address,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const { data: savedOrder, error: orderError } = await createOrder(newOrder)
      if (orderError) {
        throw new Error(orderError.message || 'Gagal menyimpan pesanan')
      }

      // 2. Buat invoice pembayaran Duitku
      const response = await fetch('/api/duitku/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderNumber,
          orderNumber: orderNumber,
          finalPrice: total,
          customerEmail: user?.email || address.email || 'customer@safasablon.com',
          customerName: address.name,
          customerPhone: address.phone,
        }),
      })

      const paymentData = await response.json()

      if (!response.ok || !paymentData.redirectUrl) {
        throw new Error(paymentData.error || 'Gagal membuat tautan pembayaran Duitku')
      }

      // Potong stock lokal sementara
      cartItems.forEach(item => {
        const currentStock = (item.product as { stock?: number })?.stock
        if (currentStock != null) {
          updateProduct(item.productId, { stock: Math.max(0, currentStock - item.quantity) } as any)
        }
      })

      addOrder(savedOrder ?? newOrder)

      // Kirim Notifikasi Sistem internal
      addNotification(buildOrderNotif(targetUserId, orderNumber, orderNumber))
      addNotification(buildAdminNewOrderNotif(orderNumber, orderNumber, address.name))
      const hasDesign = cartItems.some(item => designs[item.id]?.file)
      if (hasDesign) {
        addNotification(buildAdminDesignNotif(orderNumber, orderNumber))
      }

      clearCart()

      // 3. Redirect otomatis ke halaman pembayaran Duitku
      window.location.assign(paymentData.redirectUrl)

    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Gagal membuat pesanan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const steps: { key: CheckoutStep; label: string }[] = [
    { key: 'shipping', label: 'Pengiriman' },
    { key: 'design', label: 'Desain' },
    { key: 'payment', label: 'Pembayaran' },
    { key: 'review', label: 'Konfirmasi' },
  ]
  const stepIndex = steps.findIndex(s => s.key === step)

  if (authLoading || !isAuthenticated) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Memuat...</p>
        </div>
        <Footer />
      </>
    )
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Keranjang Anda kosong</h1>
            <Link href="/shop"><Button>Kembali ke Toko</Button></Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-foreground mb-10">Checkout</h1>

          {hasOutOfStock && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm font-medium text-destructive">
                Produk berikut sudah habis stok:{' '}
                {outOfStockItems.map(i => i.product?.name).join(', ')}. Hapus dari keranjang terlebih dahulu.
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-8">
                {steps.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      i < stepIndex ? 'bg-primary text-primary-foreground' :
                      i === stepIndex ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i < stepIndex ? '✓' : i + 1}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${i === stepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                    {i < steps.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
                  </div>
                ))}
              </div>

              {step === 'shipping' && (
                <Card className="p-6 border border-border">
                  <h2 className="text-xl font-bold text-foreground mb-5">Alamat Pengiriman</h2>

                  {savedAddresses.length > 0 ? (
                    <div className="space-y-3 mb-5">
                      {savedAddresses.map(addr => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => setSelectedAddrId(addr.id)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedAddrId === addr.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              selectedAddrId === addr.id ? 'border-primary' : 'border-muted-foreground'
                            }`}>
                              {selectedAddrId === addr.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-full">{addr.label}</span>
                                {addr.isDefault && (
                                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">⭐ Utama</span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-foreground">{addr.recipientName}</p>
                              <p className="text-xs text-muted-foreground">{addr.phone}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {addr.fullAddress}, {addr.district}, {addr.city}, {addr.province} {addr.postalCode}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="w-full p-3.5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Alamat Baru
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 mb-5">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                        <p className="text-xs text-blue-700">
                          Belum ada alamat tersimpan.{' '}
                          <button type="button" onClick={() => setShowAddModal(true)} className="font-semibold underline">
                            Tambah alamat baru
                          </button>
                          {' '}atau isi form di bawah.
                        </p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Nama Lengkap</label>
                          <Input value={manualAddress.name} onChange={e => handleAddressChange('name', e.target.value)} placeholder="Nama lengkap" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Nomor Telepon</label>
                          <Input value={manualAddress.phone} onChange={e => handleAddressChange('phone', e.target.value)} placeholder="08xx-xxxx-xxxx" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                        <Input type="email" value={manualAddress.email} onChange={e => handleAddressChange('email', e.target.value)} placeholder="email@example.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Alamat</label>
                        <Input value={manualAddress.street} onChange={e => handleAddressChange('street', e.target.value)} placeholder="Jl. Contoh No. 123" />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Kota</label>
                          <Input value={manualAddress.city} onChange={e => handleAddressChange('city', e.target.value)} placeholder="Jakarta" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Provinsi</label>
                          <Input value={manualAddress.province} onChange={e => handleAddressChange('province', e.target.value)} placeholder="DKI Jakarta" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Kode Pos</label>
                          <Input value={manualAddress.postalCode} onChange={e => handleAddressChange('postalCode', e.target.value)} placeholder="12345" />
                        </div>
                      </div>
                    </div>
                  )}

                  <ShippingSelector
                    originCityId={originCity?.id}
                    weightGrams={weightGrams}
                    addressHint={addressShippingHint}
                    value={shippingSelection}
                    onChange={setShippingSelection}
                  />

                  <div className="flex gap-4 pt-2">
                    <Link href="/cart" className="flex-1">
                      <Button variant="outline" className="w-full">Kembali</Button>
                    </Link>
                    <Button
                      onClick={() => setStep('design')}
                      disabled={!isAddressComplete || !shippingSelection}
                      className="flex-1"
                    >
                      Lanjut ke Desain
                    </Button>
                  </div>
                </Card>
              )}

              {step === 'design' && (
                <Card className="p-8 border border-border">
                  <h2 className="text-xl font-bold text-foreground mb-2">Upload Desain</h2>
                  <p className="text-sm text-muted-foreground mb-6">Upload file desain untuk setiap produk. Opsional.</p>
                  <div className="space-y-6">
                    {cartItems.map(item => {
                      const stock = (item.product as { stock?: number })?.stock
                      const isOOS = stock != null && stock === 0
                      return (
                        <div key={item.id} className={`p-5 rounded-lg border ${isOOS ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/20'}`}>
                          <div className="flex items-center gap-3 mb-4">
                            {item.product?.image && (
                              <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 border border-border">
                                <Image src={item.product.image} alt={item.product.name} fill className="object-cover" unoptimized />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">{item.product?.name}</p>
                              <p className="text-xs text-muted-foreground">{item.quantity} pcs · {item.selectedMethod}</p>
                            </div>
                          </div>
                          {!isOOS && (
                            <>
                              <DropZone
                                accept=".pdf,.jpg,.jpeg,.png,.ai,.psd,.svg"
                                label="Klik atau drag & drop file desain"
                                hint="PDF, JPG, PNG, AI, PSD, SVG (maks 10MB)"
                                previewUrl={designs[item.id]?.preview}
                                file={designs[item.id]?.file}
                                onChange={(file) => handleDesignFile(item.id, file)}
                                onRemove={() => handleRemoveDesign(item.id)}
                                imagePreview
                                className="mb-3"
                              />
                              <textarea
                                value={designs[item.id]?.notes || ''}
                                onChange={e => handleDesignNotes(item.id, e.target.value)}
                                placeholder="Catatan desain (opsional)"
                                rows={2}
                                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md resize-none"
                              />
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-4 pt-6">
                    <Button variant="outline" onClick={() => setStep('shipping')} className="flex-1">Kembali</Button>
                    <Button onClick={() => setStep('payment')} disabled={hasOutOfStock} className="flex-1">Lanjut ke Pembayaran</Button>
                  </div>
                </Card>
              )}

              {step === 'payment' && (
                <Card className="p-8 border border-border">
                  <h2 className="text-xl font-bold text-foreground mb-6">Metode Pembayaran</h2>
                  <div className="space-y-3 mb-8">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('duitku')}
                      className="w-full p-5 border-2 rounded-xl transition text-left border-primary bg-primary/5"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-foreground">Duitku Payment Gateway</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Dukung Virtual Account, QRIS, E-Wallet, dan Kartu Kredit secara real-time</p>
                        </div>
                        <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded">Otomatis</span>
                      </div>
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep('design')} className="flex-1">Kembali</Button>
                    <Button onClick={() => setStep('review')} className="flex-1">Lanjut ke Konfirmasi</Button>
                  </div>
                </Card>
              )}

              {step === 'review' && (
                <Card className="p-8 border border-border">
                  <h2 className="text-xl font-bold text-foreground mb-6">Konfirmasi Pesanan</h2>
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Pengiriman ke</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {address.name} · {address.phone}<br />
                        {address.street}, {address.city}, {address.province} {address.postalCode}
                      </p>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Kurir</p>
                      {shippingSelection ? (
                        <p className="text-sm text-foreground/80">
                          {shippingSelection.courierName} {shippingSelection.service} — Rp{shippingSelection.cost.toLocaleString('id-ID')}
                          <br />
                          <span className="text-muted-foreground">Estimasi {shippingSelection.etd} hari</span>
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Belum dipilih</p>
                      )}
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Pembayaran</p>
                      <p className="text-sm text-foreground/80">Gateway Otomatis (Duitku)</p>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <Button variant="outline" onClick={() => setStep('payment')} className="flex-1">Kembali</Button>
                      <Button onClick={handlePlaceOrder} disabled={loading || hasOutOfStock} className="flex-1">
                        {loading ? 'Memproses Gateway...' : 'Bayar Sekarang'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 border border-border sticky top-20">
                <h2 className="text-lg font-bold text-foreground mb-4">Ringkasan Pesanan</h2>
                <div className="space-y-3 mb-4 pb-4 border-b border-border max-h-72 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between items-start gap-2">
                      <p className="text-sm truncate text-foreground/80">{item.product?.name} × {item.quantity}</p>
                      <span className="text-sm font-medium text-foreground flex-shrink-0">
                        Rp{((item.product?.price || 0) * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mb-4 pb-4 border-b border-border text-sm">
                  <div className="flex justify-between text-foreground/70">
                    <span>Subtotal</span>
                    <span>Rp{subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-foreground/70">
                    <span>Pengiriman</span>
                    <span>
                      {shippingSelection
                        ? `Rp${shipping.toLocaleString('id-ID')}`
                        : 'Menghitung...'}
                    </span>
                  </div>
                  {shippingSelection && (
                    <p className="text-xs text-muted-foreground">
                      {shippingSelection.courierName} {shippingSelection.service}
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">Rp{total.toLocaleString('id-ID')}</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {showAddModal && user && (
        <AddressFormModal
          onSave={async data => {
            const newAddr = addAddress({ ...data, userId })
            setSelectedAddrId(newAddr.id)
            setShowAddModal(false)
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  )
}
