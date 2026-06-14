import { supabase } from './client'
import type { User } from '@/lib/types'

export interface AdminLoginResult {
  user: User
  sessionToken: string
}

interface AdminAuthRow {
  id: number
  email: string
  full_name: string
  role: 'admin'
  status: 'active' | 'inactive' | 'suspended'
  phone?: string | null
  avatar_url?: string | null
  created_at?: string | null
  updated_at?: string | null
  session_token?: string
}

function rowToUser(row: AdminAuthRow): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: 'admin',
    status: row.status,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: new Date(row.created_at ?? Date.now()),
    updatedAt: new Date(row.updated_at ?? Date.now()),
  }
}

export async function loginAdminWithDatabase(email: string, password: string): Promise<AdminLoginResult> {
  const { data, error } = await supabase.rpc('login_admin_user', {
    p_email: email.trim().toLowerCase(),
    p_password: password,
  })

  if (error) throw new Error(error.message)
  if (!data || !Array.isArray(data) || !data[0]?.session_token) {
    throw new Error('Email atau password salah')
  }

  return {
    user: rowToUser(data[0] as AdminAuthRow),
    sessionToken: data[0].session_token,
  }
}

export async function updateAdminEmailInDatabase(sessionToken: string, newEmail: string): Promise<User> {
  const { data, error } = await supabase.rpc('update_admin_email', {
    p_session_token: sessionToken,
    p_new_email: newEmail.trim().toLowerCase(),
  })

  if (error) throw new Error(error.message)
  if (!data || !Array.isArray(data) || !data[0]) {
    throw new Error('Gagal menyimpan email')
  }

  return rowToUser(data[0] as AdminAuthRow)
}

export async function updateAdminPasswordInDatabase(
  sessionToken: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const { error } = await supabase.rpc('update_admin_password', {
    p_session_token: sessionToken,
    p_current_password: currentPassword,
    p_new_password: newPassword,
  })

  if (error) throw new Error(error.message)
}
