'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User, AuthSession } from '@/lib/types'

const COOKIE_NAME = 'app_auth_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

const CUSTOMER_SESSION_KEY = 'safa_customer_session'
const ADMIN_SESSION_KEY = 'safa_admin_session'
const LEGACY_SESSION_KEY = 'safa_custom_session'

function writeSessionCookie(session: { isLoggedIn: boolean; isAdmin: boolean; role: string }) {
  if (typeof document === 'undefined') return
  const value = encodeURIComponent(JSON.stringify(session))
  document.cookie = `${COOKIE_NAME}=${value};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0`
}

interface AuthContextType {
  session: AuthSession
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  changeEmail: (newEmail: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [session, setSession] = useState<AuthSession>({
    user: null,
    isLoggedIn: false,
    isAdmin: false,
    token: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  const persistSession = useCallback((newSession: AuthSession) => {
    setSession(newSession)
    const storageKey = newSession.isAdmin ? ADMIN_SESSION_KEY : CUSTOMER_SESSION_KEY
    localStorage.setItem(storageKey, JSON.stringify(newSession))
    if (newSession.isAdmin) {
      writeSessionCookie({
        isLoggedIn: newSession.isLoggedIn,
        isAdmin: newSession.isAdmin,
        role: 'admin',
      })
    } else {
      clearSessionCookie()
    }
  }, [])

  const clearSession = useCallback(() => {
    setSession({ user: null, isLoggedIn: false, isAdmin: false, token: null })
    localStorage.removeItem(CUSTOMER_SESSION_KEY)
    localStorage.removeItem(ADMIN_SESSION_KEY)
    localStorage.removeItem(LEGACY_SESSION_KEY)
    clearSessionCookie()
  }, [])

  useEffect(() => {
    let isMounted = true

    try {
      localStorage.removeItem(LEGACY_SESSION_KEY)
      const isAdminRoute = window.location.pathname.startsWith('/admin')
      const storageKey = isAdminRoute ? ADMIN_SESSION_KEY : CUSTOMER_SESSION_KEY
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed: AuthSession = JSON.parse(saved)
        if (isMounted && (isAdminRoute || !parsed.isAdmin)) {
          setSession(parsed)
        }
      }
    } catch (e) {
      console.error('Gagal restore sesi:', e)
    } finally {
      if (isMounted) setIsLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && supabaseSession?.user) {
        setIsLoading(true)
        
        const newSession: AuthSession = {
          user: {
            id: supabaseSession.user.id,
            email: supabaseSession.user.email || '',
            fullName: supabaseSession.user.user_metadata?.full_name || supabaseSession.user.user_metadata?.name || 'User',
            role: 'customer',
            status: 'active',
            createdAt: new Date(supabaseSession.user.created_at),
            updatedAt: new Date(supabaseSession.user.updated_at || supabaseSession.user.created_at),
          },
          isLoggedIn: true,
          isAdmin: false,
          token: supabaseSession.access_token,
        }

        if (isMounted) {
          persistSession(newSession)
          setIsLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [persistSession])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (dbError || !userData) throw new Error('Email atau password salah')
      if (userData.status !== 'active') throw new Error('Akun Anda dinonaktifkan.')

      let passwordMatch = false
      if (userData.password_hash && userData.password_hash.startsWith('$2')) {
        const bcrypt = await import('bcryptjs')
        passwordMatch = await bcrypt.compare(password, userData.password_hash)
      } else {
        passwordMatch = password === userData.password_hash
      }

      if (!passwordMatch) throw new Error('Email atau password salah')

      const newSession: AuthSession = {
        user: {
          id: userData.id.toString(),
          email: userData.email,
          fullName: userData.full_name || 'Admin',
          role: userData.role || 'admin',
          status: userData.status || 'active',
          createdAt: new Date(userData.created_at || Date.now()),
          updatedAt: new Date(userData.updated_at || Date.now()),
        },
        isLoggedIn: true,
        isAdmin: userData.role === 'admin',
        token: null,
      }

      persistSession(newSession)
    } finally {
      setIsLoading(false)
    }
  }, [persistSession])

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        const newSession: AuthSession = {
          user: {
            id: data.user.id,
            email: data.user.email || '',
            fullName: fullName,
            role: 'customer',
            status: 'active',
            createdAt: new Date(data.user.created_at),
            updatedAt: new Date(data.user.updated_at || data.user.created_at),
          },
          isLoggedIn: true,
          isAdmin: false,
          token: data.session?.access_token || null,
        }
        persistSession(newSession)
      }
    } catch (err: any) {
      throw new Error(err.message || 'Pendaftaran gagal')
    } finally {
      setIsLoading(false)
    }
  }, [persistSession])

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true)
    try {
      const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.safablon.my.id'
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${originUrl}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Error Google Login:', error)
      throw new Error(error.message || 'Gagal terhubung ke Google Login.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    const wasAdmin = session.isAdmin
    clearSession()
    await supabase.auth.signOut()
    if (wasAdmin) {
      router.push('/admin/login')
    } else {
      router.push('/')
    }
  }, [clearSession, router, session.isAdmin])

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error('Gagal memperbarui password')
  }

  const changeEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() })
    if (error) throw new Error('Gagal memperbarui email')
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session.user,
        isLoading,
        isAuthenticated: session.isLoggedIn,
        isAdmin: session.isAdmin,
        login,
        register,
        loginWithGoogle,
        logout,
        changePassword,
        changeEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider')
  return ctx
}