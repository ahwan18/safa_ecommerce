'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

function getSafeRedirect(fallback: string) {
  const redirect = new URLSearchParams(window.location.search).get('redirect')
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return fallback
  }
  return redirect
}

export default function RegisterPage() {
  const router = useRouter()
  const { register, loginWithGoogle, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    fullName: '',
  })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login dengan Google gagal')
      setGoogleLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password || !formData.fullName) {
      setError('Semua field harus diisi')
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Password tidak sesuai')
      return
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    try {
      await register(formData.email, formData.password, formData.fullName, 'customer')
      router.push(getSafeRedirect('/account'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md border border-border">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Daftar</h1>
            <p className="text-muted-foreground mb-8">Buat akun ScreenStudio Anda</p>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nama Lengkap
                </label>
                <Input
                  type="text"
                  name="fullName"
                  placeholder="Nama lengkap Anda"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="nama@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Min. 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? '✕' : '○'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="passwordConfirm"
                    placeholder="Ketik ulang password"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full pr-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || googleLoading}
                className="w-full"
              >
                {isLoading ? 'Memproses...' : 'Daftar'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground">atau</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isLoading || googleLoading}
                className="w-full mt-4 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {googleLoading ? 'Menghubungkan...' : 'Daftar dengan Google'}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
