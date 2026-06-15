'use client'

import { use, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useProducts } from '@/lib/contexts/product-context'
import { useCart } from '@/lib/contexts/cart-context'
import { useAuth } from '@/lib/contexts/auth-context'
import { useReviews } from '@/lib/contexts/review-context'
import { ReviewSection } from '@/components/review/review-section'
import { WhatsAppInlineButton } from '@/components/whatsapp-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { CartItem } from '@/lib/types'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = use(params)
  const { products } = useProducts()
  const { getProductStats } = useReviews()

  const product = products.find(p => p.id === id)
  const stats = product ? getProductStats(product.id) : { avg: 0, count: 0 }

  const [quantity, setQuantity] = useState(1)
  const [selectedMethod, setSelectedMethod] = useState<CartItem['selectedMethod']>('sablon')
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Produk tidak ditemukan</h1>
            <Link href="/shop">
              <Button>Kembali ke Toko</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/cart')
      return
    }
    addItem(product, quantity, selectedMethod)
    router.push('/cart')
  }

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link href="/shop" className="text-primary hover:text-primary/80">
              Toko
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{product.name}</span>
          </div>

          {/* Product Detail */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            
            {/* Image */}
            <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden min-h-96">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={500}
                  height={500}
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-4xl text-slate-400">
                  🧥
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-6">
              
              <div>
                <span className="text-xs font-bold text-accent uppercase tracking-wide">
                  {product.category}
                </span>
                <h1 className="text-4xl font-bold text-foreground mt-2 mb-4">
                  {product.name}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price */}
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground mb-2">Harga Mulai Dari</p>
                <p className="text-4xl font-bold text-primary">
                  Rp{product.price.toLocaleString('id-ID')}
                </p>
                {/* Rating inline */}
                {stats.count > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span style={{ color: '#f59e0b', fontSize: 16 }}>{'★'.repeat(Math.round(stats.avg))}{'☆'.repeat(5 - Math.round(stats.avg))}</span>
                    <span className="text-sm font-bold text-foreground">{stats.avg.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({stats.count} ulasan)</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Minimum pemesanan: {product.minOrder} pcs
                </p>
              </div>

              {/* Print Method */}
              <div className="border-t border-border pt-4">
                <p className="font-bold text-foreground mb-3">Metode Cetak</p>
                <div className="grid grid-cols-3 gap-2">
                  {product.printMethods.map(method => (
                    <button
                      key={method}
                      onClick={() => setSelectedMethod(method)}
                      className={`p-3 rounded-md border transition ${
                        selectedMethod === method
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-sm font-medium text-foreground capitalize">
                        {method === 'sablon'
                          ? 'Sablon'
                          : method === 'dtf'
                          ? 'DTF'
                          : 'Offset'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="border-t border-border pt-4">
                <p className="font-bold text-foreground mb-3">Jumlah</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-border rounded-md hover:bg-muted"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min={product.minOrder}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(product.minOrder, parseInt(e.target.value) || 0)
                      )
                    }
                    className="w-16 text-center border border-border rounded-md bg-background text-foreground"
                  />

                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 border border-border rounded-md hover:bg-muted"
                  >
                    +
                  </button>

                  <span className="ml-4 text-sm text-muted-foreground">
                    Min. {product.minOrder} pcs
                  </span>
                </div>
              </div>

              {/* Add to Cart */}
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="w-full mt-4"
              >
                Tambahkan ke Keranjang
              </Button>

              {/* WhatsApp consultation button */}
              <WhatsAppInlineButton
                ctx={{ type: 'product', productName: product.name, productCategory: product.category }}
                label="Tanya via WhatsApp"
                variant="outline"
                className="w-full justify-center"
              />

              {/* Features */}
              <Card className="p-6 border border-border bg-muted/20">
                <h3 className="font-bold text-foreground mb-4">Keunggulan Produk</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-foreground/70">
                    <span className="text-accent">✓</span> Bahan berkualitas premium
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground/70">
                    <span className="text-accent">✓</span> Desain custom sesuai keinginan
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground/70">
                    <span className="text-accent">✓</span> Hasil sablon tahan lama
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground/70">
                    <span className="text-accent">✓</span> Pengiriman cepat & aman
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Review Section */}
          <div className="border-t border-border pt-12">
            <ReviewSection productId={product.id} />
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-border pt-12">
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Produk Terkait
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {relatedProducts.map(relatedProduct => (
                  <Link
                    key={relatedProduct.id}
                    href={`/shop/${relatedProduct.id}`}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all border border-border h-full cursor-pointer">
                      <div className="relative h-48 bg-muted">
                        {relatedProduct.image ? (
                          <Image
                            src={relatedProduct.image}
                            alt={relatedProduct.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-3xl text-slate-400">
                            🧥
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-foreground line-clamp-2">
                          {relatedProduct.name}
                        </h3>
                        <p className="text-primary font-bold mt-2">
                          Rp{relatedProduct.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}
