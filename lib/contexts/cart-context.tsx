'use client'

import { createContext, ReactNode, useContext, useState, useEffect, useRef } from 'react'
import { CartItem, Product } from '@/lib/types'
import { useAuth } from '@/lib/contexts/auth-context'

type PrintMethod = CartItem['selectedMethod']

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity: number, method: PrintMethod, customization?: any) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const activeCartKey = user?.id ? `cart:${user.id}` : null
  const lastCartKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (isLoading) return

    setIsHydrated(false)

    if (!isAuthenticated || !activeCartKey) {
      setItems([])
      localStorage.removeItem('cart')
      if (lastCartKeyRef.current) {
        localStorage.removeItem(lastCartKeyRef.current)
        lastCartKeyRef.current = null
      }
      setIsHydrated(true)
      return
    }

    lastCartKeyRef.current = activeCartKey
    localStorage.removeItem('cart')

    const savedCart = localStorage.getItem(activeCartKey)
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (e) {
        console.error('Failed to load cart:', e)
      }
    } else {
      setItems([])
    }
    setIsHydrated(true)
  }, [activeCartKey, isAuthenticated, isLoading])

  useEffect(() => {
    if (isHydrated && isAuthenticated && activeCartKey) {
      localStorage.setItem(activeCartKey, JSON.stringify(items))
    }
  }, [activeCartKey, isAuthenticated, isHydrated, items])

  const addItem = (product: Product, quantity: number, method: PrintMethod, customization?: any) => {
    if (!isAuthenticated) return

    setItems(prev => {
      const existingItem = prev.find(
        item => item.productId === product.id && item.selectedMethod === method
      )
      if (existingItem) {
        return prev.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, {
        id: `${product.id}-${method}-${Date.now()}`,
        productId: product.id,
        quantity,
        selectedMethod: method,
        customization
      }]
    })
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity } : item
    ))
  }

  const clearCart = () => {
    setItems([])
    if (activeCartKey) {
      localStorage.removeItem(activeCartKey)
    }
  }

  const getTotal = () => {
    // This will be calculated with product prices from the store
    return items.length > 0 ? items.length * 50000 : 0
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, getTotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
