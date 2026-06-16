'use client'

import { createContext, ReactNode, useContext, useState, useEffect } from 'react'
import { Order } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'

interface OrderContextType {
  orders: Order[]
  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  getOrderById: (id: string) => Order | undefined
  isLoading: boolean
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 1. Fetch data pesanan langsung dari Database Supabase saat pertama kali load
  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data) {
          // Menggunakan ...item agar properti wajib seperti items, paymentStatus, dll tetap terbawa
          const mappedOrders: Order[] = data.map((item: any) => ({
            ...item,
            id: item.id,
            orderNumber: item.order_number || item.orderNumber,
            userId: item.user_id || item.userId,
            status: item.status,
            total: item.total,
            createdAt: item.created_at || item.createdAt,
            shippingAddress: typeof item.shipping_address === 'string' 
              ? JSON.parse(item.shipping_address) 
              : (item.shipping_address || item.shippingAddress || {})
          }))
          
          setOrders(mappedOrders)
        }
      } catch (e) {
        console.error('Gagal mengambil data orders dari Supabase:', e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // 2. Pasang Listener Realtime secara global di sini agar state orders sinkron otomatis dari Duitku Webhook
  useEffect(() => {
    const channel = supabase
      .channel('global-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Mendengarkan INSERT dan UPDATE
          schema: 'public',
          table: 'orders',
        },
        (payload: any) => {
          console.log('Realtime DB Update dideteksi di Context:', payload)

          if (payload.eventType === 'INSERT') {
            const newItem = payload.new
            // Menggunakan ...newItem agar valid sesuai kontrak interface Order lu
            const mappedNewOrder: Order = {
              ...newItem,
              id: newItem.id,
              orderNumber: newItem.order_number || newItem.orderNumber,
              userId: newItem.user_id || newItem.userId,
              status: newItem.status,
              total: newItem.total,
              createdAt: newItem.created_at || newItem.createdAt,
              shippingAddress: typeof newItem.shipping_address === 'string'
                ? JSON.parse(newItem.shipping_address)
                : (newItem.shipping_address || newItem.shippingAddress || {})
            }
            setOrders(prev => [mappedNewOrder, ...prev])
          } 
          
          else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new
            setOrders(prev => prev.map(order => 
              order.id === updatedItem.id 
                ? { 
                    ...order, 
                    ...updatedItem, // Ambil semua field baru dari DB update
                    status: updatedItem.status,
                    payment_status: updatedItem.payment_status,
                    updatedAt: new Date(updatedItem.updated_at || Date.now())
                  } 
                : order
            ))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev])
  }

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(order =>
      order.id === id ? { ...order, ...updates } : order
    ))
  }

  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id)
  }

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrder, getOrderById, isLoading }}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider')
  }
  return context
}