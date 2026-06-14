'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageHeader } from '@/components/admin/ui'

function NoticeBanner({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      className={`flex items-start gap-2.5 p-4 rounded-lg text-sm font-medium border ${
        type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {type === 'success' ? (
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {message}
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted-foreground mb-2">{label}</label>
      <div className="h-11 px-3 flex items-center rounded-md border border-border bg-muted/40 text-foreground font-medium text-sm">
        {value}
      </div>
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-11 pr-11 ${error ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
          aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {visible ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858 3.03a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
  )
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  customer: 'Pelanggan',
}

export default function AdminAccountPage() {
  const { user, changePassword, changeEmail } = useAuth()

  const [emailInput, setEmailInput] = useState(user?.email ?? '')
  const [emailError, setEmailError] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailNotice, setEmailNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    setEmailInput(user?.email ?? '')
  }, [user?.email])

  const username = user?.fullName ?? '—'
  const roleLabel = user?.role ? (ROLE_LABEL[user.role] ?? user.role) : '—'
  const emailChanged = emailInput.trim().toLowerCase() !== (user?.email ?? '').toLowerCase()

  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailNotice(null)
    setEmailError('')

    const trimmed = emailInput.trim()
    if (!trimmed) {
      setEmailError('Email wajib diisi')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Format email tidak valid')
      return
    }
    if (!emailChanged) {
      setEmailNotice({ type: 'error', message: 'Tidak ada perubahan email untuk disimpan.' })
      return
    }

    setSavingEmail(true)
    try {
      await changeEmail(trimmed)
      setEmailNotice({ type: 'success', message: 'Email berhasil diperbarui.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan email'
      setEmailNotice({ type: 'error', message })
    } finally {
      setSavingEmail(false)
    }
  }

  function validatePasswordForm() {
    const errors: Record<string, string> = {}
    if (!currentPassword.trim()) errors.currentPassword = 'Password lama wajib diisi'
    if (!newPassword.trim()) errors.newPassword = 'Password baru wajib diisi'
    else if (newPassword.length < 6) errors.newPassword = 'Minimal 6 karakter'
    if (!confirmPassword.trim()) errors.confirmPassword = 'Konfirmasi password wajib diisi'
    else if (newPassword !== confirmPassword) errors.confirmPassword = 'Konfirmasi password tidak sama'
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordNotice(null)
    if (!validatePasswordForm()) return

    setSavingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordErrors({})
      setPasswordNotice({ type: 'success', message: 'Password berhasil diubah.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah password'
      if (message.toLowerCase().includes('password lama')) {
        setPasswordErrors(prev => ({ ...prev, currentPassword: message }))
      }
      setPasswordNotice({ type: 'error', message })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-4xl">
            <AdminPageHeader
              title="Akun Saya"
              description="Kelola identitas dan kredensial admin yang sedang login."
            />

            <div className="space-y-6">
              {/* Account info */}
              <Card className="p-5 sm:p-8 border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5986] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Informasi Akun</h2>
                    <p className="text-sm text-muted-foreground">Username dan role tidak dapat diubah</p>
                  </div>
                </div>

                {emailNotice && <div className="mb-5"><NoticeBanner {...emailNotice} /></div>}

                <form onSubmit={handleSaveEmail} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <ReadOnlyField label="Username" value={username} />
                    <ReadOnlyField label="Role" value={roleLabel} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <Input
                      type="email"
                      value={emailInput}
                      onChange={e => {
                        setEmailInput(e.target.value)
                        setEmailError('')
                        setEmailNotice(null)
                      }}
                      placeholder="admin@contoh.com"
                      className={`h-11 ${emailError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                    />
                    {emailError && <p className="text-xs text-destructive mt-1.5">{emailError}</p>}
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Email digunakan untuk identitas akun admin
                    </p>
                  </div>

                  <div className="pt-1">
                    <Button type="submit" className="h-11 gap-2 w-full sm:w-auto" disabled={savingEmail || !emailChanged}>
                      {savingEmail && (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {savingEmail ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Change password */}
              <Card className="p-5 sm:p-8 border border-border">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground">Ubah Password</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verifikasi password lama sebelum menyimpan password baru
                  </p>
                </div>

                {passwordNotice && <div className="mb-5"><NoticeBanner {...passwordNotice} /></div>}

                <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-5">
                  <PasswordField
                    label="Password Lama"
                    value={currentPassword}
                    onChange={v => { setCurrentPassword(v); setPasswordErrors(p => ({ ...p, currentPassword: '' })) }}
                    placeholder="Masukkan password saat ini"
                    error={passwordErrors.currentPassword}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <PasswordField
                      label="Password Baru"
                      value={newPassword}
                      onChange={v => { setNewPassword(v); setPasswordErrors(p => ({ ...p, newPassword: '' })) }}
                      placeholder="Minimal 6 karakter"
                      error={passwordErrors.newPassword}
                    />
                    <PasswordField
                      label="Konfirmasi Password Baru"
                      value={confirmPassword}
                      onChange={v => { setConfirmPassword(v); setPasswordErrors(p => ({ ...p, confirmPassword: '' })) }}
                      placeholder="Ulangi password baru"
                      error={passwordErrors.confirmPassword}
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" className="h-11 gap-2 w-full sm:w-auto" disabled={savingPassword}>
                      {savingPassword && (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {savingPassword ? 'Menyimpan...' : 'Simpan Password Baru'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
    </div>
  )
}
