'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function AccountPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    router.replace(isAuthenticated ? '/pesanan-saya' : '/login?redirect=/account')
  }, [isAuthenticated, isLoading, router])

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuat...</p>
      </main>
      <Footer />
    </>
  )
}
