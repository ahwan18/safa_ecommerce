# Duitku Callback Integration

Endpoint untuk menerima payment notification (callback) dari Duitku.

## Endpoint

```
POST /api/duitku/callback
Content-Type: application/json (atau application/x-www-form-urlencoded)
```

## Environment Variables

Tambahkan ke `.env.local` (atau environment server):

```env
DUITKU_MERCHANT_CODE=YOUR_MERCHANT_CODE
DUITKU_API_KEY=YOUR_API_KEY
```

## Alur

1. Duitku mengirim POST callback ke endpoint ini dengan payload:
   ```json
   {
     "merchantCode": "DXXXX",
     "merchantOrderId": "ORD-2025-0001",
     "reference": "DXXXX-XXXX-XXXX",
     "amount": "150000",
     "resultCode": "00",
     "statusCode": "0",
     "statusMessage": "SUCCESS",
     "signature": "<md5 hex>"
   }
   ```

2. Server memverifikasi signature dengan rumus:
   ```
   signature = md5(merchantCode + merchantOrderId + amount + apiKey)
   ```

3. Jika signature valid:
   - **SUCCESS** (`resultCode === "00"`) → order `payment_status` = `paid`, `status` naik ke `processing`
   - **FAILED** / **CANCELLED** → order `payment_status` = `failed`, `status` = `cancelled`

4. Server selalu mengembalikan HTTP `200` setelah callback diproses
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
