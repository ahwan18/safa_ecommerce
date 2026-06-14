import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server'

// Read the cookie set by auth-context (mock email/password login flow)
function getAppAuthSession(request: NextRequest): { isLoggedIn: boolean; isAdmin: boolean; role?: string } | null {
  const raw = request.cookies.get('app_auth_session')?.value
  if (!raw) return null
  try {
    const decoded = decodeURIComponent(raw)
    const parsed = JSON.parse(decoded)
    if (parsed && typeof parsed === 'object') {
      return {
        isLoggedIn: Boolean(parsed.isLoggedIn),
        isAdmin: Boolean(parsed.isAdmin),
        role: typeof parsed.role === 'string' ? parsed.role : undefined,
      }
    }
    return null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is an admin route (except login page)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    let isAdmin = false
    let isLoggedIn = false

    if (isSupabaseServerConfigured) {
      try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          isLoggedIn = true
          const userRole = session.user?.user_metadata?.role
          isAdmin = userRole === 'admin'
        }
      } catch (error) {
        // Supabase session check failed (e.g. network issue). Fall through
        // to cookie-based check below; do not block access on this error.
        console.error('Middleware Supabase auth check failed:', error)
      }
    }

    // Fallback: mock/email-password login stores session in a cookie.
    if (!isLoggedIn) {
      const appSession = getAppAuthSession(request)
      if (appSession?.isLoggedIn) {
        isLoggedIn = true
        isAdmin = appSession.isAdmin || appSession.role === 'admin'
      }
    }

    if (!isLoggedIn || !isAdmin) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If already on login page and has valid admin session, redirect to admin dashboard
  if (pathname === '/admin/login') {
    try {
      if (isSupabaseServerConfigured) {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const userRole = session.user?.user_metadata?.role
          if (userRole === 'admin') {
            const adminUrl = new URL('/admin', request.url)
            return NextResponse.redirect(adminUrl)
          }
        }
      }

      // Check cookie-based session too
      const appSession = getAppAuthSession(request)
      if (appSession?.isLoggedIn && (appSession.isAdmin || appSession.role === 'admin')) {
        const adminUrl = new URL('/admin', request.url)
        return NextResponse.redirect(adminUrl)
      }
    } catch (error) {
      // Ignore errors on login page, let the page handle it
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}
