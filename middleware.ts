import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

    const appSession = getAppAuthSession(request)
    if (appSession?.isLoggedIn) {
      isLoggedIn = true
      isAdmin = appSession.isAdmin || appSession.role === 'admin'
    }

    if (!isLoggedIn || !isAdmin) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If already on login page and has valid admin session, redirect to admin dashboard
  if (pathname === '/admin/login') {
    try {
      const appSession = getAppAuthSession(request)
      if (appSession?.isLoggedIn && (appSession.isAdmin || appSession.role === 'admin')) {
        const adminUrl = new URL('/admin', request.url)
        return NextResponse.redirect(adminUrl)
      }
    } catch {
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
