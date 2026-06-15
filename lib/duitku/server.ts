// ============================================================
// Duitku Server Helpers
// ------------------------------------------------------------
// Utilitas untuk verifikasi signature callback Duitku serta
// pembacaan konfigurasi merchant.
//
// Dokumentasi callback Duitku (Pop/POP):
//   signature = MD5(merchantCode + merchantOrderId + amount + apiKey)
//
// Environment variables yang dibaca (server-side only):
//   - DUITKU_MERCHANT_CODE
//   - DUITKU_API_KEY
// ============================================================

import { createHash } from 'crypto'

export interface DuitkuConfig {
  merchantCode: string
  apiKey: string
}

/**
 * Membaca konfigurasi Duitku dari environment.
 * Mengembalikan null jika konfigurasi tidak lengkap agar caller
 * bisa memutuskan untuk menolak callback.
 */
export function getDuitkuConfig(): DuitkuConfig | null {
  const merchantCode = process.env.DUITKU_MERCHANT_CODE
  const apiKey = process.env.DUITKU_API_KEY

  if (!merchantCode || !apiKey) {
    return null
  }

  return { merchantCode, apiKey }
}

/**
 * Menghasilkan signature MD5 untuk callback Duitku.
 * Rumus resmi: md5(merchantCode + merchantOrderId + amount + apiKey).
 * `amount` mengikuti apa yang dikirim Duitku (string angka tanpa separator).
 */
export function generateDuitkuSignature(params: {
  merchantCode: string
  merchantOrderId: string
  amount: string
  apiKey: string
}): string {
  const { merchantCode, merchantOrderId, amount, apiKey } = params
  const raw = `${merchantCode}${merchantOrderId}${amount}${apiKey}`
  return md5Hex(raw)
}

/**
 * Verifikasi signature yang dikirim Duitku pada callback.
 * Mengembalikan true hanya jika signature cocok (case-insensitive).
 */
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
  // Bandingkan case-insensitive karena MD5 hex bisa huruf besar/kecil
  return expected.toLowerCase() === params.signature.toLowerCase()
}

/**
 * Pemetaan status Duitku ke status internal.
 * - resultCode "00" => SUCCESS
 * - statusCode "2"  => CANCELLED
 * - lainnya         => FAILED
 */
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

// ----------------------------------------------------------
// Utilitas internal: MD5 heksadesimal (Node.js crypto)
// ----------------------------------------------------------
function md5Hex(input: string): string {
  return createHash('md5').update(input, 'utf8').digest('hex')
}
