import { createHash } from 'crypto'

export interface DuitkuConfig {
  merchantCode: string
  apiKey: string
}

export function getDuitkuConfig(): DuitkuConfig | null {
  const merchantCode = process.env.DUITKU_MERCHANT_CODE
  const apiKey = process.env.DUITKU_API_KEY

  if (!merchantCode || !apiKey) {
    return null
  }

  return { merchantCode, apiKey }
}

/**
 * 1. UNTUK CHECKOUT: Menghasilkan signature SHA256 untuk Request Invoice ke Duitku.
 * Rumus resmi: sha256(merchantCode + merchantOrderId + paymentAmount + apiKey)
 */
export function generateDuitkuRequestSignature(params: {
  merchantCode: string
  merchantOrderId: string
  paymentAmount: number
  apiKey: string
}): string {
  const { merchantCode, merchantOrderId, paymentAmount, apiKey } = params
  const raw = `${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`
  return createHash('md5').update(raw, 'utf8').digest('hex')
}

/**
 * 2. UNTUK WEBHOOK: Menghasilkan signature MD5 untuk Callback dari Duitku.
 * Rumus resmi: md5(merchantCode + merchantOrderId + amount + apiKey)
 */
export function generateDuitkuSignature(params: {
  merchantCode: string
  merchantOrderId: string
  amount: string
  apiKey: string
}): string {
  const { merchantCode, merchantOrderId, amount, apiKey } = params
  const raw = `${merchantCode}${merchantOrderId}${amount}${apiKey}`
  return createHash('md5').update(raw, 'utf8').digest('hex')
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