import { NextRequest, NextResponse } from 'next/server'
import { createDuitkuInvoice } from '@/lib/duitku/create-invoice'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const result = await createDuitkuInvoice(await req.json())
    return NextResponse.json(result.body, { status: result.status })
  } catch (error: any) {
    console.error('Create invoice Duitku error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat invoice Duitku', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
