import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import {
  generateDuitkuRequestSignature,
  getDuitkuConfig,
  getDuitkuCreateInvoiceUrl,
} from '@/lib/duitku/server'

type CreateDuitkuInvoiceInput = {
  orderId?: string
  orderNumber?: string
  finalPrice?: number | string
  customerEmail?: string
  customerName?: string
  customerPhone?: string
}

function getPublicBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.safablon.my.id'
  return baseUrl.replace(/\/$/, '')
}

async function readDuitkuJson(response: Response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return {
      statusCode: String(response.status),
      statusMessage: text || response.statusText,
    }
  }
}

export async function createDuitkuInvoice(input: CreateDuitkuInvoiceInput) {
  const orderNumber = input.orderNumber || input.orderId
  const paymentAmount = Math.round(Number(input.finalPrice))

  if (!orderNumber || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return {
      ok: false as const,
      status: 400,
      body: { error: 'Data order tidak lengkap atau nominal pembayaran tidak valid' },
    }
  }

  const config = getDuitkuConfig()
  if (!config) {
    return {
      ok: false as const,
      status: 500,
      body: { error: 'Kredensial Duitku belum lengkap di environment server' },
    }
  }

  const baseUrl = getPublicBaseUrl()
  const timestamp = String(Date.now())
  const signature = generateDuitkuRequestSignature({
    merchantCode: config.merchantCode,
    timestamp,
    apiKey: config.apiKey,
  })

  const duitkuPayload = {
    paymentAmount,
    merchantOrderId: String(orderNumber),
    productDetails: `Pembayaran Order #${orderNumber} - Safa Sablon`,
    additionalParam: '',
    merchantUserInfo: input.customerEmail || '',
    paymentMethod: '',
    customerVaName: input.customerName || 'Safa Customer',
    email: input.customerEmail || 'customer@safasablon.com',
    phoneNumber: input.customerPhone || '',
    callbackUrl: `${baseUrl}/api/duitku/callback`,
    returnUrl: `${baseUrl}/checkout/success`,
    expiryPeriod: 60,
  }

  const duitkuResponse = await fetch(getDuitkuCreateInvoiceUrl(config.environment), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-duitku-signature': signature,
      'x-duitku-timestamp': timestamp,
      'x-duitku-merchantcode': config.merchantCode,
    },
    body: JSON.stringify(duitkuPayload),
  })

  const duitkuData = await readDuitkuJson(duitkuResponse)

  if (!duitkuResponse.ok || !duitkuData?.paymentUrl) {
    return {
      ok: false as const,
      status: duitkuResponse.ok ? 400 : duitkuResponse.status,
      body: {
        error: 'Duitku menolak membuat invoice',
        details: duitkuData,
      },
    }
  }

  try {
    const supabase = createServiceRoleClient() ?? await createClient()
    const { error } = await supabase
      .from('orders')
      .update({
        payment_provider: 'duitku',
        payment_reference: duitkuData.reference || null,
        payment_status: 'pending',
        payment_details: duitkuData,
      })
      .eq('order_number', orderNumber)

    if (error) {
      console.error('Gagal update order setelah create invoice Duitku:', error)
    }
  } catch (dbError) {
    console.error('Gagal update Supabase setelah create invoice Duitku:', dbError)
  }

  return {
    ok: true as const,
    status: 200,
    body: {
      redirectUrl: duitkuData.paymentUrl,
      reference: duitkuData.reference,
    },
  }
}
