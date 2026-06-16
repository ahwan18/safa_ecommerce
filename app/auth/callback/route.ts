import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Jika login berhasil, lempar admin langsung ke panel dashboard admin, bukan ke landing page luar
  const next = searchParams.get('next') ?? '/admin/dashboard' 

  if (code) {
    const cookieStore = await cookies()
    
    // Inisialisasi server client lengkap dengan penulisan cookie session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component bisa mengabaikan jika set cookie gagal di tengah proses redirect
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Jika berhasil tukar token, arahkan langsung ke halaman admin/dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('Gagal menukar session callback:', error)
  }

  // Jika kode salah atau expired, kembalikan ke login dengan flag error
  return NextResponse.redirect(`${origin}/login?error=oauth-failed`)
}