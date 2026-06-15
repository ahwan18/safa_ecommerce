'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, AuthSession } from '@/lib/types'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import {
  getStoredPassword,
  setStoredPassword,
  migrateStoredPassword,
  getAdminLoginEmail,
  setAdminLoginEmail,
} from '@/lib/auth/password-store'
import {
  loginAdminWithDatabase,
  updateAdminEmailInDatabase,
  updateAdminPasswordInDatabase,
} from '@/lib/supabase/admin-auth-queries'


interface AuthContextType {
  session: AuthSession
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginAdmin: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (email: string, password: string, fullName: string, role?: 'customer' | 'admin') => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  changeEmail: (newEmail: string) => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const ADMIN_DB_TOKEN_PREFIX = 'admin_db:'

function sessionFromSupabaseUser(supaUser: {
  id: string
  email?: string
  user_metadata?: Record<string, any>
  created_at?: string
}, token?: string): AuthSession {
  const appUser: User = {
    id: supaUser.id,
    email: supaUser.email ?? '',
    fullName: supaUser.user_metadata?.full_name ?? supaUser.user_metadata?.name ?? supaUser.email?.split('@')[0] ?? 'Pengguna',
    role: 'customer',
    status: 'active',
    createdAt: new Date(supaUser.created_at ?? Date.now()),
    updatedAt: new Date(),
  }

  return {
    user: appUser,
    isLoggedIn: true,
    isAdmin: appUser.role === 'admin',
    token,
  }
}

function loadStoredSession() {
  const stored = localStorage.getItem('auth_session')
  if (!stored) return null

  const parsedSession = JSON.parse(stored)
  return {
    ...parsedSession,
    isAdmin: parsedSession.user?.role === 'admin',
  } as AuthSession
}

function getAdminDatabaseSessionToken(session: AuthSession) {
  return session.user?.role === 'admin' && session.token?.startsWith(ADMIN_DB_TOKEN_PREFIX)
    ? session.token.slice(ADMIN_DB_TOKEN_PREFIX.length)
    : null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession>({
    user: null,
    isLoggedIn: false,
    isAdmin: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Listen to Supabase auth state (handles Google OAuth callback and session persistence)
  useEffect(() => {
    let mounted = true

    if (!isSupabaseConfigured) {
      try {
        const hydratedSession = loadStoredSession()
        if (hydratedSession) {
          setSession(hydratedSession)
          syncSessionCookie(hydratedSession)
        }
      } catch (e) {
        console.error('Failed to parse session:', e)
      } finally {
        setIsLoading(false)
      }

      return () => {
        mounted = false
      }
    }

    // Get initial Supabase session (in case of OAuth redirect or persistent session)
    supabase.auth.getSession().then(({ data: { session: supaSession } }) => {
      if (!mounted) return

      if (supaSession?.user) {
        const newSession = sessionFromSupabaseUser(supaSession.user, supaSession.access_token)
        setSession(newSession)
        localStorage.setItem('auth_session', JSON.stringify(newSession))
        syncSessionCookie(newSession)
        setIsLoading(false)
        return
      }

      // Fall back to localStorage session (email/password mock login)
      try {
        const hydratedSession = loadStoredSession()
        if (hydratedSession) {
          setSession(hydratedSession)
          syncSessionCookie(hydratedSession)
        }
      } catch (e) {
        console.error('Failed to parse session:', e)
      }
      setIsLoading(false)
    })

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, supaSession) => {
      if (!mounted) return

      if (supaSession?.user) {
        const newSession = sessionFromSupabaseUser(supaSession.user, supaSession.access_token)
        setSession(newSession)
        localStorage.setItem('auth_session', JSON.stringify(newSession))
        syncSessionCookie(newSession)
      } else if (_event === 'SIGNED_OUT') {
        setSession({ user: null, isLoggedIn: false, isAdmin: false })
        localStorage.removeItem('auth_session')
        syncSessionCookie(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Save session to localStorage whenever it changes (email/password login only)
  useEffect(() => {
    if (session.isLoggedIn) {
      if (!session.token?.startsWith('eyJ')) {
        localStorage.setItem('auth_session', JSON.stringify(session))
      }
      syncSessionCookie(session)
    } else {
      localStorage.removeItem('auth_session')
      syncSessionCookie(null)
    }
  }, [session])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Try Supabase Auth first for real authentication
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (!error && data.user) {
          // Successfully authenticated with Supabase
          const newSession = sessionFromSupabaseUser(data.user, data.session.access_token)
          setSession(newSession)
          syncSessionCookie(newSession)
          return
        }
      }

      // Fall back to mock users for demo - in production, call backend API
      const mockUsers: Record<string, User & { password: string }> = {
        'admin@screenstudio.com': {
          id: '1',
          email: 'admin@screenstudio.com',
          fullName: 'Admin ScreenStudio',
          role: 'admin',
          status: 'active',
          password: 'admin123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'customer@example.com': {
          id: '2',
          email: 'customer@example.com',
          fullName: 'Budi Santoso',
          role: 'customer',
          status: 'active',
          phone: '08123456789',
          password: 'password123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'toko.online@example.com': {
          id: '3',
          email: 'toko.online@example.com',
          fullName: 'Toko Online Jaya',
          role: 'customer',
          status: 'active',
          phone: '08198765432',
          password: 'password123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const adminLoginEmail = getAdminLoginEmail()
      const resolvedEmail = email === adminLoginEmail && !mockUsers[email]
        ? 'admin@screenstudio.com'
        : email
      const mockUser = mockUsers[resolvedEmail]

      const validPassword = getStoredPassword(email) || getStoredPassword(resolvedEmail) || mockUser?.password
      if (!mockUser || validPassword !== password) {
        throw new Error('Email atau password salah')
      }

      const userWithoutPassword = { ...mockUser }
      delete (userWithoutPassword as Partial<typeof mockUser>).password
      if (resolvedEmail === 'admin@screenstudio.com' && email === adminLoginEmail && adminLoginEmail !== resolvedEmail) {
        userWithoutPassword.email = adminLoginEmail
      }
      const newSession: AuthSession = {
        user: userWithoutPassword,
        isLoggedIn: true,
        isAdmin: userWithoutPassword.role === 'admin',
        token: `token_${userWithoutPassword.id}_${Date.now()}`,
      }

      setSession(newSession)
      localStorage.setItem('auth_session', JSON.stringify(newSession))
      syncSessionCookie(newSession)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginAdmin = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Login admin membutuhkan koneksi Supabase database. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }

    setIsLoading(true)
    const normalizedEmail = email.trim().toLowerCase()
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log('[auth] loginAdmin start', { email: normalizedEmail })
    }
    try {
      const { user, sessionToken } = await loginAdminWithDatabase(normalizedEmail, password)
      const newSession: AuthSession = {
        user,
        isLoggedIn: true,
        isAdmin: true,
        token: `${ADMIN_DB_TOKEN_PREFIX}${sessionToken}`,
      }
      setSession(newSession)
      localStorage.setItem('auth_session', JSON.stringify(newSession))
      syncSessionCookie(newSession)
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.log('[auth] loginAdmin success', { userId: user.id, email: user.email, role: user.role })
      }
    } catch (err) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn('[auth] loginAdmin failed', { email: normalizedEmail, message: err instanceof Error ? err.message : String(err) })
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi. Isi .env.local untuk login Google.')
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) {
      throw new Error(error.message)
    }
  }

  const register = async (email: string, password: string, fullName: string, role: 'customer' | 'admin' = 'customer') => {
    setIsLoading(true)
    try {
      if (email.length < 5) {
        throw new Error('Email harus valid')
      }
      if (password.length < 6) {
        throw new Error('Password minimal 6 karakter')
      }
      if (fullName.length < 3) {
        throw new Error('Nama harus diisi dengan minimal 3 karakter')
      }

      // Check if user exists
      const stored = localStorage.getItem('auth_session')
      if (stored) {
        const existing = JSON.parse(stored)
        if (existing.user?.email === email) {
          throw new Error('Email sudah terdaftar')
        }
      }

      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        fullName,
        role,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const newSession: AuthSession = {
        user: newUser,
        isLoggedIn: true,
        isAdmin: role === 'admin',
        token: `token_${newUser.id}_${Date.now()}`,
      }

      setSession(newSession)
      localStorage.setItem('auth_session', JSON.stringify(newSession))
      syncSessionCookie(newSession)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Sign out from Supabase (handles Google session)
    if (isSupabaseConfigured) {
      supabase.auth.signOut()
    }
    setSession({
      user: null,
      isLoggedIn: false,
      isAdmin: false,
    })
    localStorage.removeItem('auth_session')
    syncSessionCookie(null)
  }

  const updateProfile = (updates: Partial<User>) => {
    if (session.user) {
      const updatedUser = {
        ...session.user,
        ...updates,
        updatedAt: new Date(),
      }
      const newSession = { ...session, user: updatedUser }
      setSession(newSession)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!session.user) {
      throw new Error('Sesi tidak ditemukan. Silakan login kembali.')
    }
    if (!currentPassword.trim()) {
      throw new Error('Password lama wajib diisi')
    }
    if (newPassword.length < 6) {
      throw new Error('Password baru minimal 6 karakter')
    }
    if (newPassword === currentPassword) {
      throw new Error('Password baru harus berbeda dari password lama')
    }

    const adminSessionToken = getAdminDatabaseSessionToken(session)
    if (adminSessionToken) {
      await updateAdminPasswordInDatabase(adminSessionToken, currentPassword, newPassword)
      return
    }

    const email = session.user.email
    const stored = getStoredPassword(email)

    if (!stored) {
      throw new Error('Akun ini tidak mendukung perubahan password.')
    }
    if (currentPassword !== stored) {
      throw new Error('Password lama tidak sesuai')
    }
    setStoredPassword(email, newPassword)
  }

  const changeEmail = async (newEmail: string) => {
    if (!session.user) {
      throw new Error('Sesi tidak ditemukan. Silakan login kembali.')
    }
    if (session.user.role !== 'admin') {
      throw new Error('Hanya admin yang dapat mengubah email dari halaman ini.')
    }

    const trimmed = newEmail.trim().toLowerCase()
    if (!trimmed) {
      throw new Error('Email wajib diisi')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new Error('Format email tidak valid')
    }
    if (trimmed === session.user.email.toLowerCase()) {
      throw new Error('Email baru sama dengan email saat ini')
    }

    const adminSessionToken = getAdminDatabaseSessionToken(session)
    if (adminSessionToken) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.log('[auth] changeEmail start', { from: session.user.email, to: trimmed })
      }
      try {
        const updatedUser = await updateAdminEmailInDatabase(adminSessionToken, trimmed)
        setSession({ ...session, user: updatedUser })
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.log('[auth] changeEmail success', { newEmail: updatedUser.email, role: updatedUser.role })
        }
      } catch (err) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.warn('[auth] changeEmail failed', { message: err instanceof Error ? err.message : String(err) })
        }
        throw err
      }
      return
    }

    const oldEmail = session.user.email
    migrateStoredPassword(oldEmail, trimmed)
    setAdminLoginEmail(trimmed)
    updateProfile({ email: trimmed })
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session.user || null,
        isLoading,
        login,
        loginAdmin,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        changePassword,
        changeEmail,
        isAuthenticated: session.isLoggedIn,
        isAdmin: session.isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth harus digunakan dalam AuthProvider')
  }
  return context
}

// Sync minimal session info to a cookie so server-side middleware can
// determine admin status even when the user authenticated via the
// mock (email/password) flow that does not use Supabase auth.
function syncSessionCookie(session: AuthSession | null) {
  if (typeof document === 'undefined') return
  try {
    if (!session || !session.isLoggedIn || !session.user) {
      document.cookie = 'app_auth_session=; Path=/; Max-Age=0; SameSite=Lax'
      return
    }
    const payload = JSON.stringify({
      isLoggedIn: true,
      isAdmin: session.user.role === 'admin',
      role: session.user.role,
    })
    // 7 days
    document.cookie = `app_auth_session=${encodeURIComponent(payload)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
  } catch (e) {
    console.error('Failed to sync session cookie:', e)
  }
}
