'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Product } from '@/lib/types'
import { useCart } from '@/lib/contexts/cart-context'
import { useAuth } from '@/lib/contexts/auth-context'
import { useReviews } from '@/lib/contexts/review-context'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const { getProductStats } = useReviews()
  const router = useRouter()
  const [added, setAdded] = useState(false)

  const stats = getProductStats(product.id)
  const isOutOfStock = product.stock != null && product.stock === 0
  const defaultMethod = product.printMethods[0] ?? 'sablon'

  function addToCart() {
    if (isOutOfStock) return
    if (!isAuthenticated) {
      router.push('/login?redirect=/cart')
      return
    }
    addItem(product, 1, defaultMethod)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addToCart()
  }

  function handleCheckout(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout')
      return
    }
    addItem(product, 1, defaultMethod)
    router.push('/checkout')
  }

  return (
    <div
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderRadius: 16,
        border: '1px solid rgb(229,231,235)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
      }}
    >
      <Link href={`/shop/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {/* Image */}
        <div style={{ position: 'relative', height: 180, backgroundColor: 'rgb(248,250,252)', flexShrink: 0 }}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'rgb(156,163,175)' }}>
              🧥
            </div>
          )}

          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <span style={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: 'rgb(107,114,128)',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 99,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {product.category}
            </span>
          </div>

          {isOutOfStock && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 99 }}>
                Stok Habis
              </span>
            </div>
          )}

          {!isOutOfStock && product.stock != null && product.stock <= 5 && (
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <span style={{ backgroundColor: 'rgb(245,158,11)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                Sisa {product.stock}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '14px 14px 0 14px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgb(17,24,39)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </h3>
          {stats.count > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ color: '#f59e0b', fontSize: 12, lineHeight: 1 }}>★</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgb(17,24,39)' }}>{stats.avg.toFixed(1)}</span>
              <span style={{ fontSize: 11, color: 'rgb(107,114,128)' }}>({stats.count})</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ color: '#d1d5db', fontSize: 12, lineHeight: 1 }}>★★★★★</span>
              <span style={{ fontSize: 11, color: 'rgb(156,163,175)' }}>Belum ada ulasan</span>
            </div>
          )}
          <p style={{ fontSize: 12, color: 'rgb(107,114,128)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1 }}>
            {product.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'rgb(30,58,95)' }}>
              Rp{product.price.toLocaleString('id-ID')}
            </span>
            {product.stock != null && !isOutOfStock && (
              <span style={{ fontSize: 11, color: 'rgb(107,114,128)' }}>Stok: {product.stock}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div style={{ padding: '10px 14px 14px 14px', display: 'flex', gap: 8 }}>
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 30,
            fontSize: 12,
            fontWeight: 700,
            border: '1.5px solid rgb(30,58,95)',
            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
            backgroundColor: isOutOfStock
              ? 'rgb(229,231,235)'
              : added
              ? 'rgb(34,197,94)'
              : '#fff',
            color: isOutOfStock ? 'rgb(156,163,175)' : added ? '#fff' : 'rgb(30,58,95)',
            transition: 'background-color 0.2s ease, color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          {added ? (
            <>✓ Keranjang</>
          ) : isOutOfStock ? (
            'Habis'
          ) : (
            <>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10 0l2 9m-12-9h14" />
              </svg>
              Keranjang
            </>
          )}
        </button>
        <button
          onClick={handleCheckout}
          disabled={isOutOfStock}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 30,
            fontSize: 12,
            fontWeight: 700,
            border: 'none',
            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
            backgroundColor: isOutOfStock ? 'rgb(229,231,235)' : 'rgb(30,58,95)',
            color: isOutOfStock ? 'rgb(156,163,175)' : '#fff',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Checkout
        </button>
      </div>
    </div>
  )
}
