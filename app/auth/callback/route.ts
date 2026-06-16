import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server' // Pastikan path import client server lu bener

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Jika ada parameter 'next' setelah login sukses (misal mau dialihkan ke halaman tertentu)
  const next = searchParams.get('next') ?? '/'

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Jika sukses menukar token menjadi session, langsung lempar ke halaman tujuan (default: homepage)
        return NextResponse.redirect(`${origin}${next}`)
      }
      
      console.error('Auth exchange error:', error)
    } catch (err) {
      console.error('Unexpected auth callback error:', err)
    }
  }

  // Jika gagal atau code tidak ada, kembalikan ke halaman login dengan param error
  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}