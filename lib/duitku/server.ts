import { createHmac } from 'crypto'

export interface DuitkuConfig {
  merchantCode: string
  apiKey: string
  environment: 'sandbox' | 'production'
}

export function getDuitkuConfig(): DuitkuConfig | null {
  const merchantCode = process.env.DUITKU_MERCHANT_CODE
  const apiKey = process.env.DUITKU_API_KEY
  const environment = process.env.DUITKU_ENVIRONMENT === 'production' ? 'production' : 'sandbox'

  if (!merchantCode || !apiKey) {
    return null
  }

  return { merchantCode, apiKey, environment }
}

export function getDuitkuCreateInvoiceUrl(environment: DuitkuConfig['environment']): string {
  if (process.env.DUITKU_CREATE_INVOICE_URL) {
    return process.env.DUITKU_CREATE_INVOICE_URL
  }

  return environment === 'production'
    ? 'https://api-prod.duitku.com/api/merchant/createInvoice'
    : 'https://api-sandbox.duitku.com/api/merchant/createInvoice'
}

/**
 * UNTUK CREATE INVOICE POP: HMAC_SHA256(merchantCode + timestamp, apiKey).
 */
export function generateDuitkuRequestSignature(params: {
  merchantCode: string
  timestamp: string
  apiKey: string
}): string {
  const { merchantCode, timestamp, apiKey } = params
  const raw = `${merchantCode}${timestamp}`
  return createHmac('sha256', apiKey).update(raw, 'utf8').digest('hex')
}

/**
 * UNTUK CALLBACK POP: HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey).
 */
export function generateDuitkuSignature(params: {
  merchantCode: string
  merchantOrderId: string
  amount: string
  apiKey: string
}): string {
  const { merchantCode, merchantOrderId, amount, apiKey } = params
  const raw = `${merchantCode}${amount}${merchantOrderId}`
  return createHmac('sha256', apiKey).update(raw, 'utf8').digest('hex')
}

export function verifyDuitkuSignature(params: {
  merchantCode: string
  merchantOrderId: string
  amount: string
  apiKey: string
  signature: string
}): boolean {
  if (!params.signature) return false
  const expected = generateDuitkuSignature({
    merchantCode: params.merchantCode,
    merchantOrderId: params.merchantOrderId,
    amount: params.amount,
    apiKey: params.apiKey,
  })
  return expected.toLowerCase() === params.signature.toLowerCase()
}

export function mapDuitkuResultToPaymentStatus(input: {
  resultCode?: string | null
  statusCode?: string | null
}): 'success' | 'failed' | 'cancelled' {
  const resultCode = String(input.resultCode ?? '').trim()
  const statusCode = String(input.statusCode ?? '').trim()

  if (resultCode === '00') return 'success'
  if (statusCode === '2') return 'cancelled'
  return 'failed'
}
