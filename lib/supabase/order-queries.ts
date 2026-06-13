import { supabase } from './client'
import type { Order, OrderItem, Address } from '@/lib/types'

interface OrderRow {
  id: number
  order_number: string
  user_id: string | null
  total_price: number | string | null
  shipping_cost: number | string | null
  final_price: number | string
  status: string
  payment_status: string
  payment_method: string | null
  shipping_address: any
  shipping_info: any
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  notes: string | null
  payment_provider?: string | null
  payment_reference?: string | null
  payment_due_at?: string | null
  payment_paid_at?: string | null
  payment_details?: any
  created_at: string
  updated_at: string
  order_items?: any[]
}

function rowToOrder(row: OrderRow): Order {
  const items: OrderItem[] = (row.order_items || []).map((it: any) => ({
    productId: String(it.product_id ?? ''),
    productName: it.product_name ?? '',
    quantity: it.quantity ?? 1,
    price: Number(it.unit_price ?? 0),
    selectedMethod: it.selected_method ?? 'sablon',
    customization: it.customization ?? undefined,
  }))

  return {
    id: String(row.id),
    orderNumber: row.order_number,
    userId: String(row.user_id ?? ''),
    items,
    subtotal: Number(
      row.total_price ??
      items.reduce((s, i) => s + i.price * i.quantity, 0)
    ),
    shippingCost: Number(row.shipping_cost ?? 0),
    shippingInfo: row.shipping_info ?? undefined,
    total: Number(row.final_price),
    status: row.status as Order['status'],
    paymentStatus: row.payment_status as Order['paymentStatus'],
    shippingAddress: (row.shipping_address ?? {}) as Address,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    notes: row.notes ?? undefined,
  } as Order
}

function orderToInsert(order: Partial<Order>) {
  return {
    order_number: order.orderNumber,
    user_id: order.userId || null,
    total_price: order.subtotal ?? order.items?.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0),
    shipping_cost: order.shippingCost ?? 0,
    final_price: order.total ?? 0,
    status: order.status ?? 'pending',
    payment_status: order.paymentStatus ?? 'pending',
    payment_method: (order.items && order.items.length > 0) ? undefined : undefined,
    shipping_address: order.shippingAddress ?? null,
    shipping_info: order.shippingInfo ?? null,
    customer_name: order.shippingAddress?.name ?? null,
    customer_phone: order.shippingAddress?.phone ?? null,
    customer_email: order.shippingAddress?.email ?? null,
    notes: order.notes ?? null,
  }
}

export const getOrders = async (): Promise<{ data: Order[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('id', { ascending: true })

  if (error || !data) return { data: null, error }
  return { data: data.map(rowToOrder), error: null }
}

export const getOrdersByUser = async (userId: string): Promise<{ data: Order[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return { data: null, error }
  return { data: data.map(rowToOrder), error: null }
}

export const getOrderById = async (id: string): Promise<{ data: Order | null; error: any }> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return { data: null, error }
  return { data: rowToOrder(data as OrderRow), error: null }
}

export const createOrder = async (order: Partial<Order>): Promise<{ data: Order | null; error: any }> => {
  const insertData = orderToInsert(order)
  const { data: created, error } = await supabase
    .from('orders')
    .insert(insertData)
    .select('*')
    .single()

  if (error || !created) return { data: null, error }

  // Insert items if any
  if (order.items && order.items.length > 0) {
    const rows = order.items.map(i => ({
      order_id: (created as any).id,
      product_id: Number(i.productId) || null,
      product_name: i.productName || null,
      quantity: i.quantity || 1,
      unit_price: i.price || 0,
      selected_method: i.selectedMethod || null,
      design_url: i.customization?.designUrl || null,
      customization: i.customization || null,
    }))

    await supabase.from('order_items').insert(rows)
  }

  // Re-fetch with items
  return getOrderById(String((created as any).id))
}

export const updateOrderById = async (id: string, updates: Partial<Order>): Promise<{ data: Order | null; error: any }> => {
  const updateData: any = {}
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.paymentStatus !== undefined) updateData.payment_status = updates.paymentStatus
  if (updates.total !== undefined) updateData.final_price = updates.total
  if (updates.shippingCost !== undefined) updateData.shipping_cost = updates.shippingCost
  if (updates.notes !== undefined) updateData.notes = updates.notes
  if (updates.shippingAddress !== undefined) updateData.shipping_address = updates.shippingAddress

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) return { data: null, error }
  return getOrderById(String((data as any).id))
}

export default {
  getOrders,
  getOrdersByUser,
  getOrderById,
  createOrder,
  updateOrderById,
}
