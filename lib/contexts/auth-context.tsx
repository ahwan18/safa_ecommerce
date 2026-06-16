'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User, AuthSession } from '@/lib/types'
import bcrypt from 'bcryptjs' // Kita pakai ini untuk verifikasi password tabel users

interface AuthContextType {
  session: AuthSession
  user: User | null
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>

  isAuthenticated: boolean
  isAdmin: boolean

  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  changeEmail: (newEmail: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* =========================
   MAPPER USER FOR CUSTOM DB
========================= */
function mapCustomUser(dbUser: any): User {
  return {
    id: dbUser.id.toString(), // konversi serial id ke string jika tipe data di type lu string
    email: dbUser.email,
    fullName: dbUser.full_name || 'User',
    role: dbUser.role || 'customer',
    status: dbUser.status || 'active',
    createdAt: new Date(dbUser.created_at ?? Date.now()),
    updatedAt: new Date(dbUser.updated_at ?? Date.now()),
  }
}

/* =========================
   PROVIDER
========================= */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession>({
    user: null,
    isLoggedIn: false,
    isAdmin: false,
    token: null,
  })

  const [isLoading, setIsLoading] = useState(true)

  /* =========================
     INIT SESSION (Membaca dari localStorage untuk custom session)
  ========================= */
  useEffect(() => {
    const init = () => {
      setIsLoading(true)
      try {
        const savedSession = localStorage.getItem('safa_custom_session')
        if (savedSession) {
          const parsed = JSON.parse(savedSession)
          setSession(parsed)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  /* =========================
     LOGIN (DIESEKUSI KE TABEL CUSTOM)
  ========================= */
  const login = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      // 1. Ambil data dari tabel public.users berdasarkan email
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (dbError || !userData) {
        throw new Error('Invalid login credentials')
      }

      // 2. Cek apakah status user aktif
      if (userData.status !== 'active') {
        throw new Error('Akun Anda dinonaktifkan')
      }

      // 3. Bandingkan password inputan dengan password_hash (Bcrypt) dari DB
      const isPasswordMatch = await bcrypt.compare(password, userData.password_hash)
      if (!isPasswordMatch) {
        throw new Error('Invalid login credentials')
      }

      // 4. Buat objek user & session baru yang clean
      const mappedUser = mapCustomUser(userData)
      const newSession: AuthSession = {
        user: mappedUser,
        isLoggedIn: true,
        isAdmin: mappedUser.role === 'admin',
        token: 'custom-session-token', // Dummy token agar interface tidak error
      }

      // 5. Simpan ke state dan localStorage agar persistent saat di-refresh (Aman untuk Vercel client-side)
      setSession(newSession)
      localStorage.setItem('safa_custom_session', JSON.stringify(newSession))

    } catch (error) {
      setIsLoading(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /* =========================
     REGISTER (OPSIONAL KE TABEL CUSTOM)
  ========================= */
  const register = async (email: string, password: string, fullName: string) => {
    setIsLoading(true)
    try {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      const { data, error } = await supabase
        .from('users')
        .insert([
          { email, password_hash: hashedPassword, full_name: fullName, role: 'customer', status: 'active' }
        ])
        .select()
        .single()

      if (error) throw error

      const mappedUser = mapCustomUser(data)
      const newSession: AuthSession = {
        user: mappedUser,
        isLoggedIn: true,
        isAdmin: false,
        token: 'custom-session-token',
      }

      setSession(newSession)
      localStorage.setItem('safa_custom_session', JSON.stringify(newSession))
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /* =========================
     GOOGLE LOGIN
  ========================= */
  const loginWithGoogle = async () => {
    throw new Error('Google Login tidak didukung pada custom credentials mode.')
  }

  /* =========================
     LOGOUT
  ========================= */
  const logout = async () => {
    localStorage.removeItem('safa_custom_session')
    setSession({
      user: null,
      isLoggedIn: false,
      isAdmin: false,
      token: null,
    })
  }

  const changePassword = async () => { throw new Error('Not implemented') }
  const changeEmail = async () => { throw new Error('Not implemented') }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session.user,
        isLoading,

        login,
        register,
        loginWithGoogle,
        logout,

        isAuthenticated: session.isLoggedIn,
        isAdmin: session.isAdmin,

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
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}