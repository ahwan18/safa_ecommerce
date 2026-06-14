'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useCart } from '@/lib/contexts/cart-context'
import { useProducts } from '@/lib/contexts/product-context'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart()
  const { products } = useProducts()
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/cart')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-muted-foreground">Memuat...</p>
        </main>
        <Footer />
      </>
    )
  }

  const cartItems = items
    .map(item => ({ ...item, product: products.find(p => p.id === item.productId) }))
    .filter(item => item.product)

  const outOfStockItems = cartItems.filter(item => {
    const stock = (item.product as any)?.stock
    return stock != null && stock === 0
  })
  const hasOutOfStock = outOfStockItems.length > 0

  const subtotal = cartItems.reduce((total, item) => {
    return total + (item.product?.price || 0) * item.quantity
  }, 0)

  const total = subtotal

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Keranjang Anda kosong.')
      return
    }
    if (hasOutOfStock) {
      alert('Beberapa produk sudah habis stok. Hapus terlebih dahulu sebelum checkout.')
      return
    }
    router.push('/checkout')
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-foreground mb-12">Keranjang Belanja</h1>

          {hasOutOfStock && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm font-medium text-destructive">
                Beberapa produk sudah habis stok. Hapus dari keranjang sebelum melanjutkan checkout.
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              {cartItems.length === 0 ? (
                <Card className="p-12 text-center border border-border">
                  <p className="text-lg text-muted-foreground mb-6">
                    Keranjang Anda kosong
                  </p>
                  <Link href="/shop">
                    <Button>Lanjutkan Belanja</Button>
                  </Link>
                </Card>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <Card key={item.id} className="p-6 border border-border">
                      <div className="grid md:grid-cols-4 gap-6">
                        {/* Product Image */}
                        <div className="relative h-40 bg-muted rounded-lg overflow-hidden">
                          <Image
                            src={item.product?.image || ''}
                            alt={item.product?.name || ''}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="md:col-span-2">
                          <h3 className="font-bold text-foreground text-lg mb-2">
                            {item.product?.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {item.product?.description.substring(0, 100)}...
                          </p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground/70">
                              <span className="font-medium">Metode Cetak:</span> {item.selectedMethod}
                            </p>
                            <p className="text-primary font-bold">
                              Rp{(item.product?.price || 0).toLocaleString('id-ID')} x {item.quantity}
                            </p>
                            {/* Stock badge */}
                            {(() => {
                              const stock = (item.product as any)?.stock
                              if (stock == null) return null
                              if (stock === 0) return (
                                <span className="inline-block px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded">
                                  Stok Habis
                                </span>
                              )
                              if (stock <= 5) return (
                                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                                  Sisa {stock} pcs
                                </span>
                              )
                              return (
                                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                  Stok: {stock} pcs
                                </span>
                              )
                            })()}
                          </div>
                        </div>

                        {/* Quantity & Actions */}
                        <div className="flex flex-col items-end justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 border border-border rounded hover:bg-muted"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-medium text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 border border-border rounded hover:bg-muted"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Hapus
                          </button>
                          <p className="text-lg font-bold text-primary mt-2">
                            Rp{((item.product?.price || 0) * item.quantity).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-8 border border-border sticky top-20">
                <h2 className="text-2xl font-bold text-foreground mb-6">Ringkasan Pesanan</h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-foreground/70">
                    <span>Subtotal</span>
                    <span>Rp{subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-foreground/70">
                    <span>Pengiriman</span>
                    <span className="text-right text-xs sm:text-sm">Dihitung di checkout (Raja Ongkir)</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-foreground">Subtotal</span>
                  <span className="text-2xl font-bold text-primary">
                    Rp{total.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-6 pb-6 border-b border-border">
                  Total akhir termasuk ongkir akan ditampilkan di halaman checkout
                </p>

                <Button
                  onClick={handleCheckout}
                  className="w-full mb-3"
                  disabled={cartItems.length === 0 || hasOutOfStock}
                >
                  Lanjut ke Pembayaran
                </Button>

                <Link href="/shop">
                  <Button variant="outline" className="w-full">
                    Lanjutkan Belanja
                  </Button>
                </Link>

                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Estimasi pengiriman: 3-5 hari kerja
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Jaminan uang kembali 100% jika tidak puas
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
