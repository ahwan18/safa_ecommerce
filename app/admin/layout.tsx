'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AdminProtectedLayout } from '@/components/admin/protected-layout'
import { AdminShell } from '@/components/admin/shell'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <AdminProtectedLayout>
      <AdminShell>{children}</AdminShell>
    </AdminProtectedLayout>
  )
}
