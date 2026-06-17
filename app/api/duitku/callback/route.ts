import { NextRequest, NextResponse } from 'next/server'
import { createDuitkuInvoice } from '@/lib/duitku/create-invoice'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import {
  getDuitkuConfig,
  mapDuitkuResultToPaymentStatus,
  verifyDuitkuSignature,
} from '@/lib/duitku/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type DuitkuCallbackPayload = Record<string, string>

async function parseCallbackPayload(req: NextRequest): Promise<DuitkuCallbackPayload> {
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const json = await req.json()
    return Object.fromEntries(
      Object.entries(json || {}).map(([key, value]) => [key, value == null ? '' : String(value)])
    )
  }

  const formData = await req.formData()
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, typeof value === 'string' ? value : value.name])
  )
}

function toTransactionStatus(status: 'success' | 'failed' | 'cancelled') {
  if (status === 'success') return 'paid'
  if (status === 'cancelled') return 'cancelled'
  return 'failed'
}

export async function POST(req: NextRequest) {
  try {
    const config = getDuitkuConfig()
    if (!config) {
      console.error('Callback Duitku diterima, tetapi kredensial Duitku belum lengkap')
      return new Response('OK', { status: 200 })
    }

    const payload = await parseCallbackPayload(req)
    const merchantCode = payload.merchantCode
    const merchantOrderId = payload.merchantOrderId
    const amount = payload.amount
    const signature = payload.signature

    if (!merchantCode || !merchantOrderId || !amount || !signature) {
      console.error('Callback Duitku parameter tidak lengkap:', payload)
      return new Response('OK', { status: 200 })
    }

    if (merchantCode !== config.merchantCode) {
      console.error('Callback Duitku merchantCode tidak cocok:', merchantCode)
      return new Response('OK', { status: 200 })
    }

    const validSignature = verifyDuitkuSignature({
      merchantCode,
      merchantOrderId,
      amount,
      apiKey: config.apiKey,
      signature,
    })

    if (!validSignature) {
      console.error('Callback Duitku signature tidak valid:', {
        merchantCode,
        merchantOrderId,
        amount,
        reference: payload.reference,
      })
      return new Response('OK', { status: 200 })
    }

    const mappedStatus = mapDuitkuResultToPaymentStatus({
      resultCode: payload.resultCode,
      statusCode: payload.statusCode,
    })
    const paymentStatus = toTransactionStatus(mappedStatus)
    const orderStatus = mappedStatus === 'success' ? 'processing' : 'cancelled'
    const now = new Date().toISOString()

    const supabase = createServiceRoleClient() ?? await createClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, payment_status, status')
      .eq('order_number', merchantOrderId)
      .maybeSingle()

    if (orderError || !order) {
      console.error('Callback Duitku order tidak ditemukan:', { merchantOrderId, orderError })
      return new Response('OK', { status: 200 })
    }

    const shouldUpdateOrder =
      mappedStatus === 'success'
        ? order.payment_status !== 'paid'
        : !['paid', 'failed', 'cancelled'].includes(order.payment_status)

    if (shouldUpdateOrder) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          status: orderStatus,
          payment_provider: 'duitku',
          payment_reference: payload.reference || null,
          payment_paid_at: mappedStatus === 'success' ? now : null,
          payment_details: payload,
          updated_at: now,
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('Gagal update order dari callback Duitku:', updateError)
      }
    }

    const txPayload = {
      order_id: order.id,
      transaction_reference: payload.reference || `${merchantOrderId}-${payload.resultCode || 'callback'}`,
      amount: Number(amount) || 0,
      currency: 'IDR',
      payment_method: payload.paymentCode || null,
      payment_provider: 'duitku',
      payment_channel: payload.issuerCode || payload.paymentCode || null,
      status: paymentStatus,
      payment_details: payload,
    }

    const { error: txError } = await supabase
      .from('payment_transactions')
      .upsert(txPayload, { onConflict: 'transaction_reference' })

    if (txError) {
      console.error('Gagal upsert payment transaction Duitku:', txError)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Callback Duitku gagal diproses:', error)
    return new Response('OK', { status: 200 })
  }
}

// Compatibility untuk frontend lama yang masih memanggil PUT /api/duitku/callback.
export async function PUT(req: NextRequest) {
  try {
    const result = await createDuitkuInvoice(await req.json())
    return NextResponse.json(result.body, { status: result.status })
  } catch (error: any) {
    console.error('Create invoice Duitku compatibility error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat invoice Duitku', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ success: false }, { status: 405 })
}
