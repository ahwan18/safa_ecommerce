import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  // Proteksi semua route /admin kecuali /admin/login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const appSession = getAppAuthSession(request)
    const isAdmin = appSession?.isLoggedIn && (appSession.isAdmin || appSession.role === 'admin')

    if (!isAdmin) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Kalau sudah login sebagai admin dan buka /admin/login → redirect ke dashboard
  if (pathname === '/admin/login') {
    const appSession = getAppAuthSession(request)
    if (appSession?.isLoggedIn && (appSession.isAdmin || appSession.role === 'admin')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}