'use client'

/**
 * auth-context.tsx — VERSI FINAL
 *
 * Strategi:
 * - Tetap pakai tabel public.users (tidak migrasi ke Supabase Auth)
 * - Session disimpan di COOKIE (bukan hanya localStorage) supaya middleware bisa baca
 * - Password di-hash dengan bcryptjs (tidak lagi plain text)
 * - changePassword & changeEmail langsung update public.users
 *
 * Dependency tambahan yang perlu diinstall:
 *   npm install bcryptjs
 *   npm install --save-dev @types/bcryptjs
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User, AuthSession } from '@/lib/types'

/* =========================
   COOKIE HELPERS
========================= */
const COOKIE_NAME = 'app_auth_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 hari

function writeSessionCookie(session: { isLoggedIn: boolean; isAdmin: boolean; role: string }) {
  if (typeof document === 'undefined') return
  const value = encodeURIComponent(JSON.stringify(session))
  document.cookie = `${COOKIE_NAME}=${value};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0`
}

/* =========================
   MAPPER
========================= */
function mapDbUser(dbUser: any): User {
  return {
    id: dbUser.id.toString(),
    email: dbUser.email,
    fullName: dbUser.full_name || 'User',
    role: dbUser.role || 'customer',
    status: dbUser.status || 'active',
    phone: dbUser.phone ?? undefined,
    avatarUrl: dbUser.avatar_url ?? undefined,
    createdAt: new Date(dbUser.created_at ?? Date.now()),
    updatedAt: new Date(dbUser.updated_at ?? Date.now()),
  }
}

/* =========================
   CONTEXT TYPE
========================= */
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

/* =========================
   PROVIDER
========================= */
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
    localStorage.setItem('safa_custom_session', JSON.stringify(newSession))
    writeSessionCookie({
      isLoggedIn: newSession.isLoggedIn,
      isAdmin: newSession.isAdmin,
      role: newSession.user?.role ?? 'customer',
    })
  }, [])

  const clearSession = useCallback(() => {
    setSession({ user: null, isLoggedIn: false, isAdmin: false, token: null })
    localStorage.removeItem('safa_custom_session')
    clearSessionCookie()
  }, [])

  /* -----------------------------------------------
     Init: restore session dari localStorage + sync cookie
  ----------------------------------------------- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('safa_custom_session')
      if (saved) {
        const parsed: AuthSession = JSON.parse(saved)
        setSession(parsed)
        writeSessionCookie({
          isLoggedIn: parsed.isLoggedIn,
          isAdmin: parsed.isAdmin,
          role: parsed.user?.role ?? 'customer',
        })
      }
    } catch (e) {
      console.error('Gagal restore sesi:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /* =========================
     LOGIN
  ========================= */
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (dbError || !userData) {
        throw new Error('Email atau password salah')
      }

      if (userData.status !== 'active') {
        throw new Error('Akun Anda dinonaktifkan. Hubungi administrator.')
      }

      let passwordMatch = false

      if (userData.password_hash && userData.password_hash.startsWith('$2')) {
        // Password sudah bcrypt
        const bcrypt = await import('bcryptjs')
        passwordMatch = await bcrypt.compare(password, userData.password_hash)
      } else {
        // Password masih plain text — cek lalu upgrade otomatis
        passwordMatch = password === userData.password_hash
        if (passwordMatch) {
          const bcrypt = await import('bcryptjs')
          const hashed = await bcrypt.hash(password, 10)
          await supabase
            .from('users')
            .update({ password_hash: hashed, updated_at: new Date().toISOString() })
            .eq('id', userData.id)
        }
      }

      if (!passwordMatch) {
        throw new Error('Email atau password salah')
      }

      const mappedUser = mapDbUser(userData)
      const newSession: AuthSession = {
        user: mappedUser,
        isLoggedIn: true,
        isAdmin: mappedUser.role === 'admin',
        token: null,
      }

      persistSession(newSession)
    } finally {
      setIsLoading(false)
    }
  }, [persistSession])

  /* =========================
     REGISTER
  ========================= */
  const register = useCallback(async (email: string, password: string, fullName: string) => {
    setIsLoading(true)
    try {
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash(password, 10)

      const { data, error } = await supabase
        .from('users')
        .insert([{
          email: email.trim().toLowerCase(),
          password_hash: hashedPassword,
          full_name: fullName,
          role: 'customer',
          status: 'active',
        }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') throw new Error('Email sudah terdaftar')
        throw new Error(error.message)
      }

      const mappedUser = mapDbUser(data)
      const newSession: AuthSession = {
        user: mappedUser,
        isLoggedIn: true,
        isAdmin: false,
        token: null,
      }

      persistSession(newSession)
    } finally {
      setIsLoading(false)
    }
  }, [persistSession])

  /* =========================
     GOOGLE LOGIN
  ========================= */
  const loginWithGoogle = useCallback(async () => {
    throw new Error('Login dengan Google tidak tersedia.')
  }, [])

  /* =========================
     LOGOUT
  ========================= */
  const logout = useCallback(async () => {
    clearSession()
    router.push('/')
  }, [clearSession, router])

  /* =========================
     CHANGE PASSWORD
  ========================= */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!session.user) throw new Error('Tidak ada sesi aktif')

    const { data: userData, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', session.user.id)
      .single()

    if (error || !userData) throw new Error('Gagal memverifikasi akun')

    const bcrypt = await import('bcryptjs')
    let isMatch = false
    if (userData.password_hash.startsWith('$2')) {
      isMatch = await bcrypt.compare(currentPassword, userData.password_hash)
    } else {
      isMatch = currentPassword === userData.password_hash
    }

    if (!isMatch) throw new Error('Password lama salah')

    const newHashed = await bcrypt.hash(newPassword, 10)
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHashed, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)

    if (updateError) throw new Error('Gagal menyimpan password baru')
  }, [session.user])

  /* =========================
     CHANGE EMAIL
  ========================= */
  const changeEmail = useCallback(async (newEmail: string) => {
    if (!session.user) throw new Error('Tidak ada sesi aktif')

    const trimmed = newEmail.trim().toLowerCase()

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', trimmed)
      .neq('id', session.user.id)
      .maybeSingle()

    if (existing) throw new Error('Email sudah digunakan akun lain')

    const { error } = await supabase
      .from('users')
      .update({ email: trimmed, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)

    if (error) throw new Error('Gagal menyimpan email baru')

    const updatedUser: User = { ...session.user, email: trimmed }
    const updatedSession: AuthSession = { ...session, user: updatedUser }
    persistSession(updatedSession)
  }, [session, persistSession])

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

/* =========================
   HOOK
========================= */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider')
  return ctx
}
