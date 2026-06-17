import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getDuitkuConfig,
  mapDuitkuResultToPaymentStatus,
  verifyDuitkuSignature,
  generateDuitkuRequestSignature,
} from '@/lib/duitku/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DuitkuCallbackPayload {
  merchantCode?: string
  merchantOrderId?: string
  reference?: string
  paymentCode?: string
  amount?: string | number
  paymentAmount?: string | number
  merchantUserId?: string
  productCode?: string
  resultCode?: string
  statusCode?: string
  statusMessage?: string
  signature?: string
  [key: string]: any
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, finalPrice, customerEmail } = body
    const orderNumber = body.orderNumber || orderId

    if (!orderNumber || !finalPrice) {
      return NextResponse.json({ error: 'Data order tidak lengkap' }, { status: 400 })
    }

    const config = getDuitkuConfig()
    if (!config) {
      return NextResponse.json({ error: 'Konfigurasi Duitku di server belum lengkap' }, { status: 500 })
    }

    const paymentAmount = Math.round(Number(finalPrice))

    const signature = generateDuitkuRequestSignature({
      merchantCode: config.merchantCode,
      merchantOrderId: String(orderNumber),
      paymentAmount: paymentAmount,
      apiKey: config.apiKey,
    })

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.safablon.my.id'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || baseUrl

    const duitkuPayload = {
      merchantCode: config.merchantCode,
      paymentAmount: paymentAmount,
      merchantOrderId: String(orderNumber),
      productDetails: `Pembayaran Order #${orderNumber} - Safa Sablon`,
      email: customerEmail || 'customer@safasablon.com',
      paymentMethod: '',
      expiryPeriod: 1440,
      callbackUrl: `${baseUrl}/api/duitku/callback`,
      returnUrl: `${siteUrl}/checkout/success`,
      signature: signature
    }

    const duitkuResponse = await fetch('https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duitkuPayload),
    })

    const duitkuData = await duitkuResponse.json()

    if (!duitkuData.paymentUrl) {
      return NextResponse.json({ error: 'Gagal membuat invoice di Duitku', details: duitkuData }, { status: 500 })
    }

    const supabase = await createClient()
    
    await supabase
      .from('orders')
      .update({
        payment_provider: 'duitku',
        payment_reference: duitkuData.reference || null,
        payment_status: 'pending'
      })
      .eq('order_number', orderNumber)

    return NextResponse.json({ redirectUrl: duitkuData.paymentUrl })

  } catch (error: any) {
    console.error('Error Checkout:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let rawBody: string | null = null
  let payload: DuitkuCallbackPayload | null = null

  try {
    rawBody = await req.text()
    if (!rawBody) return new Response('Empty body', { status: 400 })
    try {
      payload = JSON.parse(rawBody) as DuitkuCallbackPayload
    } catch {
      const params = new URLSearchParams(rawBody)
      payload = Object.fromEntries(params.entries()) as DuitkuCallbackPayload
    }

    const data = payload as DuitkuCallbackPayload
    const merchantOrderId = String(data.merchantOrderId ?? '').trim()
    const amount = String(data.amount ?? data.paymentAmount ?? '').trim()
    const signature = String(data.signature ?? '').trim()
    const resultCode = String(data.resultCode ?? '').trim()
    const statusCode = String(data.statusCode ?? '').trim()
    const reference = String(data.reference ?? '').trim()

    if (!merchantOrderId || !amount || !signature) {
      return new Response('Missing required fields', { status: 400 })
    }

    const config = getDuitkuConfig()
    if (!config) return new Response('Server config missing', { status: 500 })

    if (data.merchantCode && data.merchantCode !== config.merchantCode) {
      return new Response('Invalid merchantCode', { status: 400 })
    }

    const signatureValid = verifyDuitkuSignature({
      merchantCode: config.merchantCode,
      merchantOrderId,
      amount,
      apiKey: config.apiKey,
      signature,
    })

    if (!signatureValid) return new Response('Invalid Signature', { status: 400 })

    const paymentStatus = mapDuitkuResultToPaymentStatus({ resultCode, statusCode })
    const supabase = await createClient()
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, payment_reference, total')
      .eq('order_number', merchantOrderId)
      .maybeSingle()

    if (orderError || !order) {
      return new Response('OK', { status: 200 })
    }

    const dbTotal = Number(order.total ?? 0)
    if (dbTotal > 0 && Math.round(Number(amount)) !== Math.round(dbTotal)) {
      return new Response('OK', { status: 200 })
    }

    if (String(order.payment_status).toLowerCase() === 'paid') {
      return new Response('OK', { status: 200 })
    }

    if (paymentStatus === 'failed' && (order.payment_status === 'failed' || order.status === 'cancelled')) {
      return new Response('OK', { status: 200 })
    }

    const now = new Date().toISOString()
    const newPaymentStatus = paymentStatus === 'success' ? 'paid' : 'failed'
    const newOrderStatus = paymentStatus === 'success' 
      ? (order.status === 'pending' || !order.status ? 'processing' : order.status)
      : 'cancelled'

    if (reference) {
      await supabase
        .from('payment_transactions')
        .upsert({
          order_id: order.id,
          transaction_reference: reference,
          amount: Number(amount) || 0,
          currency: 'IDR',
          payment_method: data.paymentMethod ?? null,
          payment_provider: 'duitku',
          payment_channel: data.productCode ?? data.paymentCode ?? null,
          status: newPaymentStatus,
          payment_details: data as any,
          updated_at: now,
        }, { onConflict: 'transaction_reference' })
    }

    const orderUpdate: Record<string, any> = {
      payment_status: newPaymentStatus,
      payment_provider: 'duitku',
      payment_reference: reference || order.payment_reference || null,
      payment_details: data as any,
      updated_at: now,
    }

    if (paymentStatus === 'success') orderUpdate.payment_paid_at = now
    if (newOrderStatus && newOrderStatus !== order.status) orderUpdate.status = newOrderStatus

    await supabase.from('orders').update(orderUpdate).eq('id', order.id)

    return new Response('OK', { status: 200 })

  } catch (err) {
    return new Response('Internal error', { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST, PUT' } })
}