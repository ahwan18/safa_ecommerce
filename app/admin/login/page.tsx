'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { loginAdmin, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAdmin) {
      router.push('/admin')
    }
  }, [isAdmin, router])

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  setError('')
  setIsLoading(true)

  if (!email.trim()) {
    setError('Masukkan email')
    setIsLoading(false)
    return
  }

  if (!password.trim()) {
    setError('Masukkan password')
    setIsLoading(false)
    return
  }

  try {
    await loginAdmin(email, password)
    router.push('/admin')
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Email atau password salah. Silakan coba lagi.')
  } finally {
    setIsLoading(false)
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 border border-border">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground text-2xl font-bold">S</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">ScreenStudio Admin</h1>
          <p className="text-muted-foreground mt-2">Akses panel administrasi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Admin
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email"
              className="w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? 'Memproses...' : 'Login'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Sesi login akan tersimpan otomatis. Anda tidak perlu login ulang setelah refresh halaman atau berpindah tab.
          </p>
        </div>
      </Card>
    </div>
  )
}
