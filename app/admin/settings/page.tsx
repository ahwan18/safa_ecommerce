'use client'

import { useState, type ReactNode } from 'react'
import { useWAConfig } from '@/lib/contexts/wa-config-context'
import { useCMS } from '@/lib/contexts/cms-context'
import { useShippingConfig } from '@/lib/contexts/shipping-config-context'
import { DestinationSearch } from '@/components/checkout/destination-search'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageHeader, AdminPanel, AdminPanelHeader } from '@/components/admin/ui'
import {
  AlertCircle,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Save,
  Truck,
  type LucideIcon,
} from 'lucide-react'

export default function AdminSettingsPage() {
  const { waNumber, setWaNumber } = useWAConfig()
  const { getContent, updateContent } = useCMS()
  const { originCity, setOriginCity } = useShippingConfig()

  // ── WA state ──────────────────────────────────────────────────────────────
  const [waInput, setWaInput] = useState(waNumber)
  const [waSaved, setWaSaved] = useState(false)
  const [waError, setWaError] = useState('')

  function handleSaveWA() {
    const clean = waInput.replace(/\D/g, '')
    if (!clean) { setWaError('Nomor WhatsApp tidak boleh kosong'); return }
    if (clean.length < 10 || clean.length > 15) { setWaError('Nomor WhatsApp harus 10–15 digit'); return }
    if (!clean.startsWith('62')) { setWaError('Gunakan format internasional, awali dengan 62 (contoh: 6281234567890)'); return }
    setWaError('')
    setWaNumber(clean)
    setWaSaved(true)
    setTimeout(() => setWaSaved(false), 3000)
  }

  // ── Location state ────────────────────────────────────────────────────────
  const contactContent = getContent('contact')
  const [locForm, setLocForm] = useState({
    address:   contactContent?.address   ?? '',
    mapsEmbed: contactContent?.mapsEmbed ?? '',
    mapsLink:  contactContent?.mapsLink  ?? '',
  })
  const [locSaving, setLocSaving] = useState(false)
  const [locSaved,  setLocSaved]  = useState(false)
  const [locError,  setLocError]  = useState('')

  async function handleSaveLoc() {
    if (!locForm.address.trim()) { setLocError('Alamat tidak boleh kosong'); return }
    setLocError('')
    setLocSaving(true)
    try {
      await updateContent('contact', {
        ...contactContent,
        address:   locForm.address.trim(),
        mapsEmbed: locForm.mapsEmbed.trim(),
        mapsLink:  locForm.mapsLink.trim(),
      })
      setLocSaved(true)
      setTimeout(() => setLocSaved(false), 3000)
    } catch {
      setLocError('Gagal menyimpan. Coba lagi.')
    } finally {
      setLocSaving(false)
    }
  }

  // ── Promo state ───────────────────────────────────────────────────────────
  const [originSaved, setOriginSaved] = useState(false)
  const handleSaveOrigin = () => {
    if (!originCity) return
    setOriginSaved(true)
    setTimeout(() => setOriginSaved(false), 2000)
  }

  const cleanWa = waInput.replace(/\D/g, '')

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pengaturan"
        description="Kelola konfigurasi yang berpengaruh langsung ke checkout, kontak pelanggan, dan informasi toko."
        meta="Konfigurasi operasional"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SettingOverviewItem
          icon={Truck}
          label="Pengiriman"
          value={originCity ? originCity.label : 'Belum dipilih'}
          tone="amber"
        />
        <SettingOverviewItem
          icon={MessageCircle}
          label="WhatsApp"
          value={cleanWa ? `+${cleanWa}` : 'Belum diatur'}
          tone="emerald"
        />
        <SettingOverviewItem
          icon={MapPin}
          label="Lokasi"
          value={locForm.address || 'Belum diatur'}
          tone="cyan"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <AdminPanel className="overflow-hidden">
            <AdminPanelHeader
              title="Pengiriman"
              description="Lokasi asal dipakai untuk menghitung ongkir otomatis saat checkout."
              action={<SectionIcon icon={Truck} tone="amber" />}
            />
            <div className="space-y-5 p-5">
              <DestinationSearch
                label="Kota / Kecamatan Asal Toko"
                placeholder="Cari kota asal pengiriman..."
                value={originCity}
                onChange={setOriginCity}
                helperText="Pilih lokasi gudang atau toko yang menjadi titik awal pengiriman."
              />

              {originCity && (
                <div className="grid gap-3 rounded-lg border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-950 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700">Asal saat ini</p>
                    <p className="mt-1 font-bold">{originCity.label}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-700">ID Raja Ongkir</p>
                    <p className="mt-1 font-mono font-bold">{originCity.id}</p>
                  </div>
                </div>
              )}

              {/* <Notice tone="blue" icon={Info}>
                Tambahkan <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono">RAJAONGKIR_API_KEY</code> di file{' '}
                <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono">.env.local</code>, lalu restart server dev.
              </Notice> */}

              {originSaved && (
                <Notice tone="green" icon={Check}>
                  Kota asal pengiriman tersimpan.
                </Notice>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSaveOrigin} disabled={!originCity} className="gap-2">
                  <Save className="h-4 w-4" />
                  Simpan Kota Asal
                </Button>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel className="overflow-hidden">
            <AdminPanelHeader
              title="Lokasi & Peta"
              description="Informasi ini tampil di section Hubungi Kami pada halaman utama."
              action={<SectionIcon icon={MapPin} tone="cyan" />}
            />
            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-4">
                <Field label="Alamat Lengkap" required>
                  <Input
                    value={locForm.address}
                    onChange={e => setLocForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="Jl. Merdeka No. 123, Kelurahan, Kecamatan, Kota"
                  />
                </Field>

                <Field label="URL Google Maps Embed">
                  <textarea
                    value={locForm.mapsEmbed}
                    onChange={e => setLocForm(p => ({ ...p, mapsEmbed: e.target.value }))}
                    rows={4}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Google Maps, Bagikan, Sematkan Peta, lalu salin URL dari atribut <code className="rounded bg-slate-100 px-1">src</code>.
                  </p>
                </Field>

                <Field label='Link "Lihat di Google Maps"'>
                  <Input
                    value={locForm.mapsLink}
                    onChange={e => setLocForm(p => ({ ...p, mapsLink: e.target.value }))}
                    placeholder="https://maps.google.com/?q=..."
                  />
                </Field>

                {locError && (
                  <Notice tone="red" icon={AlertCircle}>
                    {locError}
                  </Notice>
                )}

                {locSaved && (
                  <Notice tone="green" icon={Check}>
                    Lokasi berhasil disimpan dan tampil di halaman website.
                  </Notice>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleSaveLoc} disabled={locSaving} className="gap-2">
                    {locSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {locSaving ? 'Menyimpan...' : 'Simpan Lokasi'}
                  </Button>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-900">Preview Peta</p>
                  {locForm.mapsLink && (
                    <a
                      href={locForm.mapsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 no-underline hover:text-cyan-900"
                    >
                      Buka maps
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                {locForm.mapsEmbed ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <iframe
                      src={locForm.mapsEmbed}
                      width="100%"
                      height="300"
                      style={{ border: 0, display: 'block' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Preview peta"
                    />
                    {locForm.address && (
                      <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-600">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-700" />
                        <span className="line-clamp-2">{locForm.address}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500">
                    <MapPin className="h-9 w-9 text-slate-300" />
                    <p className="max-w-xs text-sm">Masukkan URL Maps Embed untuk menampilkan preview lokasi toko.</p>
                  </div>
                )}
              </div>
            </div>
          </AdminPanel>
        </div>

        <aside className="space-y-6">
          <AdminPanel className="overflow-hidden">
            <AdminPanelHeader
              title="Kontak WhatsApp"
              description="Dipakai oleh tombol chat di website."
              action={<SectionIcon icon={MessageCircle} tone="emerald" />}
            />
            <div className="space-y-4 p-5">
              <Field label="Nomor WhatsApp Admin">
                <div className="flex">
                  <div className="grid h-10 w-11 place-items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-sm font-bold text-slate-600">
                    +
                  </div>
                  <Input
                    value={waInput}
                    onChange={e => {
                      setWaInput(e.target.value.replace(/[^\d]/g, ''))
                      setWaError('')
                    }}
                    placeholder="6281234567890"
                    inputMode="numeric"
                    className="rounded-l-none font-mono"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Format internasional tanpa plus, contoh <span className="font-mono">6281234567890</span>.
                </p>
              </Field>

              {cleanWa.length >= 10 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Preview link</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-700">https://wa.me/{cleanWa}</p>
                </div>
              )}

              {waError && (
                <Notice tone="red" icon={AlertCircle}>
                  {waError}
                </Notice>
              )}

              {waSaved && (
                <Notice tone="green" icon={Check}>
                  Nomor WhatsApp berhasil disimpan.
                </Notice>
              )}

              <Button onClick={handleSaveWA} className="w-full gap-2">
                <Save className="h-4 w-4" />
                Simpan Nomor WhatsApp
              </Button>
            </div>
          </AdminPanel>

          <AdminPanel className="overflow-hidden">
            <AdminPanelHeader
              title="Metode Pembayaran"
              description="Metode yang aktif untuk pelanggan."
              action={<SectionIcon icon={CreditCard} tone="slate" />}
            />
            <div className="space-y-3 p-5">
              {['Transfer Bank', 'Kartu Kredit', 'E-Wallet'].map(method => (
                <div key={method} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-bold text-slate-900">{method}</span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </AdminPanel>
        </aside>
      </div>
    </div>
  )
}

function SettingOverviewItem({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone: 'amber' | 'emerald' | 'cyan'
}) {
  const tones = {
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  }

  return (
    <AdminPanel className="p-4">
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
          <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
        </div>
      </div>
    </AdminPanel>
  )
}

function SectionIcon({
  icon: Icon,
  tone,
}: {
  icon: LucideIcon
  tone: 'amber' | 'emerald' | 'cyan' | 'slate'
}) {
  const tones = {
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return (
    <span className={`grid h-9 w-9 place-items-center rounded-lg border ${tones[tone]}`}>
      <Icon className="h-4 w-4" />
    </span>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-900">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      {children}
    </label>
  )
}

function Notice({
  tone,
  icon: Icon,
  children,
}: {
  tone: 'blue' | 'green' | 'red'
  icon: LucideIcon
  children: ReactNode
}) {
  const tones = {
    blue: 'border-cyan-200 bg-cyan-50 text-cyan-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    red: 'border-rose-200 bg-rose-50 text-rose-700',
  }

  return (
    <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm font-medium ${tones[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 leading-6">{children}</div>
    </div>
  )
}
