import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getDuitkuConfig,
  mapDuitkuResultToPaymentStatus,
  verifyDuitkuSignature,
} from '@/lib/duitku/server'

// ============================================================
// POST /api/duitku/callback
// ------------------------------------------------------------
// Endpoint untuk menerima payment notification (callback) dari
// Duitku. Wajib:
//  - verifikasi signature (MD5) sebelum memproses data
//  - update payment_transactions dan orders sesuai status
//  - kembalikan HTTP 200 saat berhasil diproses
//  - idempotent: callback duplikat tidak menyebabkan efek ganda
// ============================================================

// Force Node.js runtime agar modul `crypto` stabil dan konsisten
// dengan kode verifikasi MD5 (lib/duitku/server.ts).
export const runtime = 'nodejs'
// Hindari cache – callback harus selalu dieksekusi.
export const dynamic = 'force-dynamic'

// Tipe payload callback Duitku (Pop / POP & VA – sebagian field
// mungkin tidak selalu dikirim, semuanya dibuat opsional).
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
  // Field tambahan (jika ada)
  [key: string]: any
}

const LOG_PREFIX = '[duitku-callback]'

export async function POST(req: NextRequest) {
  let rawBody: string | null = null
  let payload: DuitkuCallbackPayload | null = null

  try {
    // ----------------------------------------------------------
    // 1. Parse & validasi body
    // ----------------------------------------------------------
    try {
      rawBody = await req.text()
      if (!rawBody) {
        logWarn('Empty request body')
        return NextResponse.json(
          { success: false, message: 'Empty body' },
          { status: 400 },
        )
      }
      try {
        payload = JSON.parse(rawBody) as DuitkuCallbackPayload
      } catch {
        // Beberapa integrasi Duitku mengirim form-urlencoded.
        // Coba parse sebagai form data.
        const params = new URLSearchParams(rawBody)
        payload = Object.fromEntries(params.entries()) as DuitkuCallbackPayload
      }
    } catch (err) {
      logError('Failed to read request body', err)
      return NextResponse.json(
        { success: false, message: 'Invalid body' },
        { status: 400 },
      )
    }

    const data = payload as DuitkuCallbackPayload
    const merchantOrderId = String(data.merchantOrderId ?? '').trim()
    const amount = String(
      data.amount ?? data.paymentAmount ?? '',
    ).trim()
    const signature = String(data.signature ?? '').trim()
    const resultCode = String(data.resultCode ?? '').trim()
    const statusCode = String(data.statusCode ?? '').trim()
    const reference = String(data.reference ?? '').trim()

    if (!merchantOrderId) {
      logWarn('Missing merchantOrderId', { payload: data })
      return NextResponse.json(
        { success: false, message: 'merchantOrderId wajib diisi' },
        { status: 400 },
      )
    }
    if (!amount) {
      logWarn('Missing amount', { merchantOrderId })
      return NextResponse.json(
        { success: false, message: 'amount wajib diisi' },
        { status: 400 },
      )
    }
    if (!signature) {
      logWarn('Missing signature', { merchantOrderId })
      return NextResponse.json(
        { success: false, message: 'signature wajib diisi' },
        { status: 400 },
      )
    }

    // ----------------------------------------------------------
    // 2. Verifikasi signature
    // ----------------------------------------------------------
    const config = getDuitkuConfig()
    if (!config) {
      logError('Duitku configuration missing (DUITKU_MERCHANT_CODE / DUITKU_API_KEY)')
      return NextResponse.json(
        { success: false, message: 'Server belum dikonfigurasi untuk Duitku' },
        { status: 500 },
      )
    }

    // Pastikan merchantCode cocok dengan yang kita simpan (anti-spoof).
    if (data.merchantCode && data.merchantCode !== config.merchantCode) {
      logWarn('merchantCode mismatch', {
        merchantOrderId,
        received: data.merchantCode,
      })
      return NextResponse.json(
        { success: false, message: 'merchantCode tidak valid' },
        { status: 400 },
      )
    }

    const signatureValid = verifyDuitkuSignature({
      merchantCode: config.merchantCode,
      merchantOrderId,
      amount,
      apiKey: config.apiKey,
      signature,
    })
    if (!signatureValid) {
      logWarn('Invalid signature', { merchantOrderId })
      return NextResponse.json(
        { success: false, message: 'Signature tidak valid' },
        { status: 400 },
      )
    }

    // ----------------------------------------------------------
    // 3. Pemetaan status Duitku -> status internal
    // ----------------------------------------------------------
    const paymentStatus = mapDuitkuResultToPaymentStatus({
      resultCode,
      statusCode,
    })

    // ----------------------------------------------------------
    // 4. Cari order berdasarkan merchantOrderId (= order_number)
    //    lalu update dengan idempotency.
    // ----------------------------------------------------------
    const supabase = await createClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, payment_reference, final_price')
      .eq('order_number', merchantOrderId)
      .maybeSingle()

    if (orderError) {
      logError('Failed to lookup order', orderError, { merchantOrderId })
      // Kembalikan 200 agar Duitku tidak retry terus-menerus,
      // tapi log error untuk investigasi.
      return NextResponse.json(
        { success: false, message: 'Gagal lookup order' },
        { status: 200 },
      )
    }

    if (!order) {
      logWarn('Order not found for merchantOrderId', { merchantOrderId })
      return NextResponse.json(
        { success: false, message: 'Order tidak ditemukan' },
        { status: 200 },
      )
    }
    const orderAmount = Number(order.final_price ?? 0)
    const callbackAmount = Number(amount)

    if (orderAmount > 0 && callbackAmount !== orderAmount) {
    logWarn('Amount mismatch', {
        merchantOrderId,
        orderAmount,
        callbackAmount,
    })

    return NextResponse.json(
        {
        success: false,
        message: 'Amount mismatch',
        },
        { status: 200 }
    )
    }
    const currentPaymentStatus = String(order.payment_status ?? '').toLowerCase()
    const currentOrderStatus = String(order.status ?? '').toLowerCase()

    if (currentPaymentStatus === 'paid') {
    logInfo('Paid order ignored from further updates', {
        merchantOrderId,
    })

    return NextResponse.json({
        success: true,
        message: 'Order already paid',
    })
    }

    // Jika status final sudah FAILED/cancelled dan callback membawa
    // status yang sama, skip juga untuk mencegah duplicate update.
    if (
      paymentStatus === 'failed' &&
      (currentPaymentStatus === 'failed' || currentOrderStatus === 'cancelled')
    ) {
      logInfo('Order already in terminal failed/cancelled state', { merchantOrderId })
      return NextResponse.json({ success: true, message: 'Order sudah gagal' })
    }

    // ----------------------------------------------------------
    // 5. Update payment_transactions (history) dan orders
    // ----------------------------------------------------------
    const now = new Date().toISOString()
    const newPaymentStatus =
      paymentStatus === 'success' ? 'paid' : 'failed'
    const newOrderStatus =
      paymentStatus === 'success'
        ? // Jangan override status alur (processing/ready/shipped/delevired)
          // jika admin sudah memproses order; hanya naikkan dari
          // pending ke processing.
          currentOrderStatus === 'pending' || currentOrderStatus === ''
          ? 'processing'
          : currentOrderStatus
        : 'cancelled'

    // 5a. Insert/update payment_transactions.
    //    Kita upsert berdasarkan transaction_reference agar
    //    callback duplikat tetap 1 baris.
    if (reference) {
      const { error: txError } = await supabase
        .from('payment_transactions')
        .upsert(
          {
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
          },
          { onConflict: 'transaction_reference' },
        )
      if (txError) {
        logError('Failed to upsert payment_transactions', txError, { merchantOrderId })
      }
    }

    // 5b. Update ringkasan payment di orders.
    const orderUpdate: Record<string, any> = {
      payment_status: newPaymentStatus,
      payment_provider: 'duitku',
      payment_reference: reference || order.payment_reference || null,
      payment_details: data as any,
      updated_at: now,
    }
    if (paymentStatus === 'success') {
      orderUpdate.payment_paid_at = now
    }
    if (newOrderStatus && newOrderStatus !== currentOrderStatus) {
      orderUpdate.status = newOrderStatus
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', order.id)

    if (updateError) {
      logError('Failed to update order', updateError, { merchantOrderId })
      // Tetap 200 – Duitku tidak akan mengirim ulang jika kita respon
      // error 5xx, dan duplikat callback berikutnya bisa di-skip
      // lewat mekanisme idempotency.
      return NextResponse.json({
        success: false,
        message: 'Gagal update order',
      })
    }

    logInfo('Order updated successfully', {
      merchantOrderId,
      paymentStatus,
      resultCode,
      statusCode,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    logError('Unexpected error processing Duitku callback', err, {
      rawBody: safeTruncate(rawBody),
    })
    // Kembalikan 200 untuk mencegah retry bertubi-tubi dari Duitku,
    // error sudah dicatat untuk investigasi.
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 200 },
    )
  }
}

// ----------------------------------------------------------
// GET tidak diizinkan – hanya POST yang dipakai oleh Duitku.
// ----------------------------------------------------------
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } },
  )
}

// ----------------------------------------------------------
// Logger sederhana – cukup ke console (Vercel/cPanel akan
// menangkap ke log aplikasi). Pada production bisa diarahkan
// ke sistem log terpusat.
// ----------------------------------------------------------
function logInfo(message: string, meta?: Record<string, any>) {
  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} ${message}`, meta ?? {})
}

function logWarn(message: string, meta?: Record<string, any>) {
  // eslint-disable-next-line no-console
  console.warn(`${LOG_PREFIX} ${message}`, meta ?? {})
}

function logError(
  message: string,
  err?: unknown,
  meta?: Record<string, any>,
) {
  const errInfo =
    err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : err
  // eslint-disable-next-line no-console
  console.error(`${LOG_PREFIX} ${message}`, { error: errInfo, ...(meta ?? {}) })
}

function safeTruncate(input: string | null, max = 500): string | null {
  if (!input) return null
  return input.length > max ? `${input.slice(0, max)}…` : input
}
