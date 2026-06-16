import bcrypt from 'bcryptjs'

/**
 * Memverifikasi apakah password text biasa cocok dengan hash Bcrypt dari database
 * @param password Input password dari form (misal: 'admin123')
 * @param hash Password terenkripsi dari tabel database users
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

// Menjaga fungsi bawaan agar tidak merusak komponen client lama yang mengimpor file ini
export function getAdminLoginEmail(): string {
  if (typeof window === 'undefined') return 'admin@screenstudio.com'
  return localStorage.getItem('safa_admin_login_email') || 'admin@screenstudio.com'
}

export function setAdminLoginEmail(email: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('safa_admin_login_email', email)
  }
}