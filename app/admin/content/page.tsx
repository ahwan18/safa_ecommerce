'use client'

import { useState } from 'react'
import { useCMS } from '@/lib/contexts/cms-context'
import { DropZone } from '@/components/ui/drop-zone'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageHeader } from '@/components/admin/ui'

export default function AdminContentPage() {
  const { getContent, updateContent } = useCMS()
  const [activeTab, setActiveTab] = useState('hero')
  const [saved, setSaved] = useState(false)

  const heroContent = getContent('hero')
  const contactContent = getContent('contact')
  const servicesContent = getContent('services')
  const aboutContent = getContent('about')

  const [heroForm, setHeroForm] = useState(heroContent || {})
  const [contactForm, setContactForm] = useState(contactContent || {})
  const [bgImageFile, setBgImageFile] = useState<File | null>(null)

  function handleBgImageChange(file: File) {
    setBgImageFile(file)
    const url = URL.createObjectURL(file)
    setHeroForm((prev: any) => ({ ...prev, backgroundImage: url }))
  }

  function handleBgImageRemove() {
    setBgImageFile(null)
    setHeroForm((prev: any) => ({ ...prev, backgroundImage: '' }))
  }

  const handleHeroSave = () => {
    updateContent('hero', heroForm)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleContactSave = () => {
    updateContent('contact', contactForm)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
            <AdminPageHeader
              title="Kelola Konten"
              description="Perbarui konten utama website agar landing page tetap relevan untuk pelanggan."
            />

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-border">
              {[
                { id: 'hero', label: 'Hero Section' },
                { id: 'services', label: 'Layanan' },
                { id: 'contact', label: 'Kontak' },
                { id: 'about', label: 'Tentang' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-medium transition border-b-2 ${
                    activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-foreground/70 border-transparent hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Hero Section */}
            {activeTab === 'hero' && (
              <Card className="p-8 border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">Edit Hero Section</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Judul Utama
                    </label>
                    <Input
                      value={heroForm.title || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                      placeholder="Judul hero section"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Subtitle
                    </label>
                    <Input
                      value={heroForm.subtitle || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                      placeholder="Subtitle deskriptif"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Teks Tombol CTA
                    </label>
                    <Input
                      value={heroForm.ctaText || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, ctaText: e.target.value })}
                      placeholder="Teks tombol"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Background Image
                    </label>
                    <DropZone
                      accept="image/*"
                      label="Klik atau drag & drop gambar hero"
                      hint="JPG, PNG, WEBP (maks 5MB)"
                      previewUrl={heroForm.backgroundImage || ''}
                      file={bgImageFile}
                      onChange={handleBgImageChange}
                      onRemove={handleBgImageRemove}
                      imagePreview
                    />
                  </div>

                  {saved && (
                    <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm font-medium">
                      ✓ Perubahan berhasil disimpan
                    </div>
                  )}

                  <Button onClick={handleHeroSave} size="lg" className="w-full">
                    Simpan Perubahan
                  </Button>
                </div>
              </Card>
            )}

            {/* Services Section */}
            {activeTab === 'services' && (
              <Card className="p-8 border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">Edit Layanan</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Intro Layanan
                    </label>
                    <Input
                      value={servicesContent?.intro || ''}
                      placeholder="Pengantar section layanan"
                      disabled
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-foreground mb-4">Layanan yang Ditawarkan</h3>
                    <div className="space-y-4">
                      {servicesContent?.items?.map((service: any) => (
                        <div key={service.id} className="p-4 border border-border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-foreground">{service.title}</span>
                            <span className="text-2xl">{service.icon}</span>
                          </div>
                          <p className="text-sm text-foreground/70">{service.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-800 text-sm">
                    Untuk edit detail layanan, silakan hubungi tim support.
                  </div>
                </div>
              </Card>
            )}

            {/* Contact Section */}
            {activeTab === 'contact' && (
              <Card className="p-8 border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">Edit Informasi Kontak</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nomor Telepon
                    </label>
                    <Input
                      value={contactForm.phone || ''}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="+62 812-3456-7890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={contactForm.email || ''}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="info@screenstudio.id"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Alamat
                    </label>
                    <Input
                      value={contactForm.address || ''}
                      onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                      placeholder="Jl. Merdeka No. 123, Jakarta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Jam Operasional
                    </label>
                    <Input
                      value={contactForm.businessHours || ''}
                      onChange={(e) => setContactForm({ ...contactForm, businessHours: e.target.value })}
                      placeholder="Senin - Jumat: 08:00 - 17:00"
                    />
                  </div>

                  {saved && (
                    <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm font-medium">
                      ✓ Perubahan berhasil disimpan
                    </div>
                  )}

                  <Button onClick={handleContactSave} size="lg" className="w-full">
                    Simpan Perubahan
                  </Button>
                </div>
              </Card>
            )}

            {/* About Section */}
            {activeTab === 'about' && (
              <Card className="p-8 border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">Tentang ScreenStudio</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <p className="text-sm text-foreground/70 mb-4">
                      <span className="font-medium">Nama Perusahaan:</span> {aboutContent?.title}
                    </p>
                    <p className="text-sm text-foreground/70 mb-4">
                      <span className="font-medium">Deskripsi:</span> {aboutContent?.description}
                    </p>
                    <p className="text-sm text-foreground/70 mb-4">
                      <span className="font-medium">Tahun Berdiri:</span> {aboutContent?.established}
                    </p>
                    <p className="text-sm text-foreground/70">
                      <span className="font-medium">Proyekproyek Selesai:</span> {aboutContent?.projects}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-800 text-sm">
                    Konten "Tentang" merupakan informasi statis. Untuk perubahan, hubungi tim support.
                  </div>
                </div>
              </Card>
            )}
    </>
  )
}
