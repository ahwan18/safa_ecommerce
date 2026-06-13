'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminProtectedLayout } from '@/components/admin/protected-layout'
import { useWAConfig } from '@/lib/contexts/wa-config-context'
import { useCMS } from '@/lib/contexts/cms-context'
import { useShippingConfig } from '@/lib/contexts/shipping-config-context'
import { DestinationSearch } from '@/components/checkout/destination-search'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

  return (
    <AdminProtectedLayout>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 bg-background overflow-y-auto">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground">Pengaturan</h1>
              <p className="text-muted-foreground mt-2">Kelola pengiriman, diskon, dan konfigurasi lainnya</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Raja Ongkir */}
              <Card className="p-8 border border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-lg">🚚</div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Pengiriman (Raja Ongkir)</h2>
                    <p className="text-sm text-muted-foreground">Ongkir dihitung otomatis saat checkout</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <DestinationSearch
                    label="Kota / Kecamatan Asal Toko"
                    placeholder="Cari kota asal pengiriman..."
                    value={originCity}
                    onChange={setOriginCity}
                    helperText="Lokasi ini dipakai sebagai asal perhitungan ongkir ke pelanggan"
                  />

                  {originCity && (
                    <div className="p-4 bg-muted/20 rounded-lg text-sm text-foreground/70">
                      <p><span className="font-medium">Asal saat ini:</span> {originCity.label}</p>
                      <p className="mt-1"><span className="font-medium">ID Raja Ongkir:</span> {originCity.id}</p>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    <p className="font-semibold mb-1">API Key Raja Ongkir</p>
                    <p>Tambahkan <code className="bg-white/70 px-1 rounded">RAJAONGKIR_API_KEY</code> di file <code className="bg-white/70 px-1 rounded">.env.local</code>, lalu restart server dev.</p>
                  </div>

                  {originSaved && (
                    <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm font-medium">
                      ✓ Kota asal pengiriman tersimpan
                    </div>
                  )}

                  <Button onClick={handleSaveOrigin} size="lg" className="w-full" disabled={!originCity}>
                    Simpan Kota Asal
                  </Button>
                </div>
              </Card>

              {/* Discount & Promo removed */}
            </div>

            {/* WhatsApp Configuration */}
            <Card className="p-8 border border-border col-span-full lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#25d366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Nomor WhatsApp</h2>
                  <p className="text-sm text-muted-foreground">Nomor ini digunakan untuk semua tombol "Chat via WhatsApp" di website</p>
                </div>
              </div>

              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nomor WhatsApp Admin
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 py-2 bg-muted text-foreground rounded-l-md border border-border border-r-0 text-sm font-medium select-none">
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
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Format internasional tanpa + (contoh: <span className="font-mono">6281234567890</span>)
                  </p>
                  {waError && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {waError}
                    </p>
                  )}
                </div>

                {/* Preview link */}
                {waInput.replace(/\D/g, '').length >= 10 && (
                  <div className="p-3 bg-muted/30 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Preview link:</p>
                    <p className="text-xs font-mono text-foreground/70 break-all">
                      https://wa.me/{waInput.replace(/\D/g, '')}
                    </p>
                  </div>
                )}

                {waSaved && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                    Nomor WhatsApp berhasil disimpan
                  </div>
                )}

                <Button onClick={handleSaveWA} className="gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                  </svg>
                  Simpan Nomor WhatsApp
                </Button>
              </div>
            </Card>
            <div className="grid lg:grid-cols-2 gap-8 mt-8">
              {/* Location Configuration */}
              <Card className="p-8 border border-border lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Lokasi & Peta</h2>
                    <p className="text-sm text-muted-foreground">Tampil di section "Hubungi Kami" pada halaman utama</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left: form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Alamat Lengkap <span className="text-destructive">*</span>
                      </label>
                      <Input
                        value={locForm.address}
                        onChange={e => setLocForm(p => ({ ...p, address: e.target.value }))}
                        placeholder="Jl. Merdeka No. 123, Kelurahan, Kecamatan, Kota"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        URL Google Maps Embed
                      </label>
                      <textarea
                        value={locForm.mapsEmbed}
                        onChange={e => setLocForm(p => ({ ...p, mapsEmbed: e.target.value }))}
                        rows={4}
                        placeholder="https://www.google.com/maps/embed?pb=..."
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Google Maps → Bagikan → Sematkan Peta → salin URL dari atribut <code className="bg-muted px-1 rounded">src</code>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Link "Lihat di Google Maps"
                      </label>
                      <Input
                        value={locForm.mapsLink}
                        onChange={e => setLocForm(p => ({ ...p, mapsLink: e.target.value }))}
                        placeholder="https://maps.google.com/?q=..."
                      />
                    </div>

                    {locError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                        {locError}
                      </p>
                    )}

                    {locSaved && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                        Lokasi berhasil disimpan dan tampil di halaman website
                      </div>
                    )}

                    <Button onClick={handleSaveLoc} disabled={locSaving} className="gap-2 w-full">
                      {locSaving ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                        </svg>
                      )}
                      {locSaving ? 'Menyimpan...' : 'Simpan Lokasi'}
                    </Button>
                  </div>

                  {/* Right: preview */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Preview Peta</p>
                    {locForm.mapsEmbed ? (
                      <div className="rounded-xl overflow-hidden border border-border">
                        <iframe
                          src={locForm.mapsEmbed}
                          width="100%"
                          height="280"
                          style={{ border: 0, display: 'block' }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Preview peta"
                        />
                        {locForm.address && (
                          <div className="px-3 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground truncate">
                            📍 {locForm.address}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-[280px] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                        </svg>
                        <p className="text-sm">Masukkan URL Maps Embed untuk melihat preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-8 border border-border">
                <h3 className="font-bold text-foreground mb-4">▲ Metode Pembayaran</h3>
                <div className="space-y-2 text-sm text-foreground/70">
                  <p>✓ Transfer Bank</p>
                  <p>✓ Kartu Kredit</p>
                  <p>✓ E-Wallet</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedLayout>
  )
}
