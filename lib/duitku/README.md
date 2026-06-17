# Duitku Callback Integration

Endpoint untuk menerima payment notification (callback) dari Duitku.

## Endpoint

```
POST /api/duitku/callback
Content-Type: application/json (atau application/x-www-form-urlencoded)
```

Checkout dari website membuat invoice melalui:

```
POST /api/duitku/invoice
Content-Type: application/json
```

## Environment Variables

Tambahkan ke `.env.local` (atau environment server):

```env
DUITKU_MERCHANT_CODE=YOUR_MERCHANT_CODE
DUITKU_API_KEY=YOUR_API_KEY
DUITKU_ENVIRONMENT=sandbox
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://www.safablon.my.id
NEXT_PUBLIC_API_URL=https://www.safablon.my.id
```

Gunakan `DUITKU_ENVIRONMENT=production` jika project Duitku sudah live/production.
`SUPABASE_SERVICE_ROLE_KEY` disarankan untuk server callback agar webhook Duitku bisa update order walaupun RLS aktif.

## Alur

1. Website membuat invoice ke Duitku POP Create Invoice API.
   Signature request memakai:
   ```
   signature = HMAC_SHA256(merchantCode + timestamp, apiKey)
   ```

2. Duitku mengirim POST callback ke endpoint ini dengan payload:
   ```json
   {
     "merchantCode": "DXXXX",
     "merchantOrderId": "ORD-2025-0001",
     "reference": "DXXXX-XXXX-XXXX",
     "amount": "150000",
     "resultCode": "00",
     "statusCode": "0",
     "statusMessage": "SUCCESS",
     "signature": "<hmac sha256 hex>"
   }
   ```

3. Server memverifikasi signature callback dengan rumus:
   ```
   signature = HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey)
   ```

4. Jika signature valid:
   - **SUCCESS** (`resultCode === "00"`) → order `payment_status` = `paid`, `status` naik ke `processing`
   - **FAILED** / **CANCELLED** → order `payment_status` = `failed`, `status` = `cancelled`

5. Server selalu mengembalikan HTTP `200` setelah callback diproses
   (baik sukses maupun gagal internal yang sudah di-log), agar Duitku
   tidak melakukan retry berlebihan.

## Idempotency

- Jika order sudah `paid`, callback `SUCCESS` berikutnya di-skip.
- Jika order sudah `failed` / `cancelled`, callback `FAILED` berikutnya di-skip.
- `payment_transactions` di-upsert berdasarkan `transaction_reference`
  sehingga callback duplikat untuk reference yang sama hanya membuat 1 baris.

## Catatan

- `merchantOrderId` di sisi Duitku dipetakan ke kolom `orders.order_number`.
- Pastikan `order_number` yang dikirim ke Duitku saat request transaksi
  sama dengan yang tersimpan di database.
- Jika memakai dashboard Duitku, pastikan Callback URL mengarah ke:
  `https://www.safablon.my.id/api/duitku/callback`
- Jika schema payment di Supabase belum lengkap, jalankan:
  `scripts/010_duitku_callback_fix.sql`
