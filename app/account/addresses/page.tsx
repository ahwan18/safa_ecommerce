'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuth } from '@/lib/contexts/auth-context'
import { useAddresses, type UserAddress } from '@/lib/contexts/address-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AddressFormModal, type AddressFormState } from '@/components/address/address-form-modal'

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold whitespace-nowrap
      transition-all duration-300 animate-in fade-in slide-in-from-bottom-4
      ${type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success'
        ? <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
      }
      {message}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function AddressCardSkeleton() {
  return (
    <div className="border border-gray-100 rounded-2xl p-5 bg-white animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-24 bg-yellow-50 rounded-full" />
      </div>
      <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
      <div className="h-3 w-24 bg-gray-100 rounded mb-4" />
      <div className="h-3 w-full bg-gray-100 rounded mb-1.5" />
      <div className="h-3 w-3/4 bg-gray-100 rounded mb-4" />
      <div className="flex gap-2 pt-4 border-t border-gray-50">
        <div className="h-7 w-16 bg-gray-100 rounded-lg" />
        <div className="h-7 w-16 bg-gray-100 rounded-lg" />
      </div>
    </div>
  )
}

// ── Label emoji map ───────────────────────────────────────────────────────────
const LABEL_EMOJI: Record<string, string> = {
  Rumah: '🏠', Kantor: '🏢', Gudang: '🏭', Kost: '🛏',
}
function labelEmoji(label: string) {
  return LABEL_EMOJI[label] ?? '📍'
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirm({
  name,
  onConfirm,
  onCancel,
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-150">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">Hapus Alamat?</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Yakin ingin menghapus alamat <strong className="text-gray-700">{name}</strong>?{' '}
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">Batal</Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
          >
            Hapus
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Address Card ──────────────────────────────────────────────────────────────
function AddressCard({
  addr,
  isOptimistic = false,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  addr: UserAddress
  isOptimistic?: boolean
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}) {
  return (
    <div className={`group relative bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden
      ${addr.isDefault
        ? 'border-slate-800 shadow-md shadow-slate-100'
        : 'border-gray-100 hover:border-slate-300 hover:shadow-md hover:shadow-gray-100 hover:-translate-y-0.5'
      }
      ${isOptimistic ? 'opacity-60 pointer-events-none' : ''}
    `}>
      {/* Default accent bar */}
      {addr.isDefault && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-700 to-slate-500" />
      )}

      <div className="p-5">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-700 text-xs font-bold rounded-full border border-slate-100">
            {labelEmoji(addr.label)} {addr.label}
          </span>
          {addr.isDefault && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
              ⭐ Alamat Utama
            </span>
          )}
        </div>

        {/* Info */}
        <p className="font-bold text-gray-900 text-sm leading-snug">{addr.recipientName}</p>
        <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
        <p className="text-sm text-gray-600 leading-relaxed mt-2">{addr.fullAddress}</p>
        <p className="text-xs text-gray-500 mt-1">
          {addr.district}, {addr.city}, {addr.province} {addr.postalCode}
        </p>
        {addr.landmark && (
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <span>📌</span> {addr.landmark}
          </p>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 mt-4 pt-3.5 border-t border-gray-50 flex-wrap">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>

          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-300 bg-white hover:bg-red-50 transition-all active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus
          </button>

          {!addr.isDefault && (
            <button
              onClick={onSetDefault}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 px-3 py-1.5 rounded-lg border border-amber-200 hover:border-amber-400 bg-amber-50 hover:bg-amber-100 transition-all active:scale-95 ml-auto"
            >
              ⭐ Jadikan Utama
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AddressesPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { getUserAddresses, addAddress, updateAddress, deleteAddress, setDefault } = useAddresses()

  const [pageReady, setPageReady] = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [editTarget, setEditTarget]     = useState<UserAddress | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserAddress | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set())

  // Simulate data load for skeleton (context loads from localStorage synchronously after hydration)
  useEffect(() => {
    const t = setTimeout(() => setPageReady(true), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/account/addresses')
    }
  }, [authLoading, isAuthenticated, router])

  if (!authLoading && !isAuthenticated) {
    return null
  }

  const isLoading = authLoading || !pageReady

  const userId = String(user?.id ?? '')
  const myAddresses = !isLoading && user
    ? getUserAddresses(userId).sort((a, b) =>
        a.isDefault ? -1 : b.isDefault ? 1
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : []

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleSave(data: AddressFormState) {
    if (editTarget) {
      // Optimistic update — mark as pending
      setOptimisticIds(s => new Set(s).add(editTarget.id))
      updateAddress(editTarget.id, { ...data })
      showToast('Alamat berhasil diperbarui')
      setEditTarget(null)
      setTimeout(() => setOptimisticIds(s => { const n = new Set(s); n.delete(editTarget.id); return n }), 600)
    } else {
      addAddress({ ...data, userId })
      showToast('Alamat berhasil ditambahkan')
      setShowForm(false)
    }
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteAddress(deleteTarget.id)
    showToast('Alamat berhasil dihapus')
    setDeleteTarget(null)
  }

  function handleSetDefault(id: string) {
    setOptimisticIds(s => new Set(s).add(id))
    setDefault(id, userId)
    showToast('Alamat utama berhasil diperbarui')
    setTimeout(() => setOptimisticIds(s => { const n = new Set(s); n.delete(id); return n }), 600)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Page header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                📍 Alamat Pengiriman
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola alamat pengiriman yang tersimpan di akun Anda.
              </p>
            </div>
            {!isLoading && myAddresses.length > 0 && (
              <Button
                onClick={() => { setEditTarget(null); setShowForm(true) }}
                className="shrink-0 flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Tambah Alamat</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            )}
          </div>

          {/* ── Loading Skeleton ── */}
          {isLoading && (
            <div className="grid sm:grid-cols-2 gap-4">
              {[0, 1, 2].map(i => <AddressCardSkeleton key={i} />)}
            </div>
          )}

          {/* ── Empty State ── */}
          {!isLoading && myAddresses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-white border-2 border-dashed border-gray-200 flex items-center justify-center mb-5 text-4xl shadow-sm">
                📍
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Belum ada alamat pengiriman</h3>
              <p className="text-sm text-gray-400 mb-7 max-w-xs leading-relaxed">
                Tambahkan alamat pengiriman agar proses checkout lebih cepat dan mudah.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 shadow-sm px-6"
                size="lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Alamat Pertama
              </Button>
            </div>
          )}

          {/* ── Address Grid ── */}
          {!isLoading && myAddresses.length > 0 && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                {myAddresses.map(addr => (
                  <AddressCard
                    key={addr.id}
                    addr={addr}
                    isOptimistic={optimisticIds.has(addr.id)}
                    onEdit={() => { setEditTarget(addr); setShowForm(false) }}
                    onDelete={() => setDeleteTarget(addr)}
                    onSetDefault={() => handleSetDefault(addr.id)}
                  />
                ))}

                {/* Ghost card — add new */}
                <button
                  onClick={() => { setEditTarget(null); setShowForm(true) }}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-slate-400 hover:text-slate-600 hover:bg-white transition-all duration-200 min-h-[180px] group active:scale-95"
                >
                  <div className="w-11 h-11 rounded-full border-2 border-dashed border-gray-200 group-hover:border-slate-400 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Tambah Alamat Baru</p>
                    <p className="text-xs mt-0.5 text-gray-400">Klik untuk menambahkan</p>
                  </div>
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-6">
                {myAddresses.length} alamat tersimpan
                <span className="mx-2">·</span>
                Alamat utama otomatis dipilih saat checkout
              </p>
            </>
          )}

        </div>
      </main>
      <Footer />

      {/* Form Modal */}
      {(showForm || editTarget) && (
        <AddressFormModal
          isEdit={!!editTarget}
          initial={editTarget ? {
            label:         editTarget.label,
            recipientName: editTarget.recipientName,
            phone:         editTarget.phone,
            province:      editTarget.province,
            city:          editTarget.city,
            district:      editTarget.district,
            postalCode:    editTarget.postalCode,
            fullAddress:   editTarget.fullAddress,
            landmark:      editTarget.landmark ?? '',
            isDefault:     editTarget.isDefault,
          } : undefined}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.label}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </>
  )
}
