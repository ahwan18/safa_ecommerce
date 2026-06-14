'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/contexts/notification-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminPageHeader } from '@/components/admin/ui'
import type { AppNotification, NotificationType } from '@/lib/types'

const TYPE_LABEL: Record<NotificationType, string> = {
  order:   'Pesanan',
  payment: 'Pembayaran',
  design:  'Desain',
  account: 'Akun',
  system:  'Sistem',
}

const TYPE_COLOR: Record<NotificationType, { bg: string; text: string }> = {
  order:   { bg: 'bg-blue-100',   text: 'text-blue-700' },
  payment: { bg: 'bg-green-100',  text: 'text-green-700' },
  design:  { bg: 'bg-purple-100', text: 'text-purple-700' },
  account: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  system:  { bg: 'bg-gray-100',   text: 'text-gray-700' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Kemarin'
  return `${d} hari lalu`
}

export default function AdminNotificationsPage() {
  const router = useRouter()
  const { adminNotifications, adminUnreadCount, markRead, markAllRead, clearAll } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all')

  const all = adminNotifications()
  const unread = adminUnreadCount()

  const filtered = all.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.isRead
    return n.type === filter
  })

  function handleClick(n: AppNotification) {
    markRead(n.id)
    if (n.referenceUrl) router.push(n.referenceUrl)
  }

  const filterTabs = [
    { key: 'all',     label: 'Semua' },
    { key: 'unread',  label: `Belum Dibaca${unread > 0 ? ` (${unread})` : ''}` },
    { key: 'order',   label: 'Pesanan' },
    { key: 'payment', label: 'Pembayaran' },
    { key: 'design',  label: 'Desain' },
    { key: 'system',  label: 'Sistem' },
  ] as const

  return (
    <>

            <AdminPageHeader
              title="Notifikasi"
              description={unread > 0 ? `${unread} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
              actions={
                <>
                {unread > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllRead('admin', 'admin')}
                  >
                    Tandai Semua Dibaca
                  </Button>
                )}
                {all.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => clearAll('admin', 'admin')}
                  >
                    Hapus Semua
                  </Button>
                )}
                </>
              }
            />

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto pb-px">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    filter === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification list */}
            {filtered.length === 0 ? (
              <Card className="border border-border">
                <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                  <div className="text-6xl mb-4">🔔</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Belum ada notifikasi</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Notifikasi aktivitas seperti pesanan baru, upload desain, dan pembayaran akan muncul di sini.
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="border border-border overflow-hidden">
                <div className="divide-y divide-border">
                  {filtered.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`flex items-start gap-4 px-6 py-4 transition-colors ${
                        n.referenceUrl ? 'cursor-pointer hover:bg-muted/40' : ''
                      } ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                    >
                      {/* Unread indicator */}
                      <div className="flex-shrink-0 mt-2">
                        {!n.isRead
                          ? <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          : <div className="w-2.5 h-2.5 rounded-full bg-transparent" />
                        }
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className={`text-sm ${!n.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                              {n.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[n.type]?.bg ?? 'bg-muted'} ${TYPE_COLOR[n.type]?.text ?? 'text-foreground'}`}>
                              {TYPE_LABEL[n.type] ?? n.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Action hint */}
                        {n.referenceUrl && (
                          <p className="text-xs text-primary mt-1.5 font-medium">
                            Klik untuk melihat detail →
                          </p>
                        )}
                      </div>

                      {/* Mark read button */}
                      {!n.isRead && (
                        <button
                          onClick={e => { e.stopPropagation(); markRead(n.id) }}
                          className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground transition mt-1"
                          title="Tandai sudah dibaca"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {filtered.length > 0 && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Menampilkan {filtered.length} dari {all.length} notifikasi
              </p>
            )}

    </>
  )
}
