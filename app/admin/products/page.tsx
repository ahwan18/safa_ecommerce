'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useProducts } from '@/lib/contexts/product-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropZone } from '@/components/ui/drop-zone'
import { AdminPageHeader, AdminStatTile } from '@/components/admin/ui'
import { exportToCSV } from '@/lib/utils/csv-export'

const emptyForm = {
  id: '',
  name: '',
  description: '',
  category: 'kaos' as 'kaos' | 'tote' | 'hoodie' | 'jersey' | 'jasa',
  price: 0,
  stock: 0,
  image: '',
  minOrder: 1,
}

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  // ── Filter & Search ──────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const handleAddNew = () => {
    setFormData({ ...emptyForm })
    setImagePreview('')
    setImageFile(null)
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (product: any) => {
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock ?? 0,
      image: product.image,
      minOrder: product.minOrder ?? 1,
    })
    setImagePreview(product.image || '')
    setImageFile(null)
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleImageChange = (file: File) => {
    setImageFile(file)
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    setFormData(prev => ({ ...prev, image: objectUrl }))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData(prev => ({ ...prev, image: '' }))
  }

  const handleSave = () => {
    if (!formData.name || !formData.description) {
      alert('Nama dan deskripsi harus diisi')
      return
    }

    if (editingId) {
      updateProduct(editingId, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: formData.price,
        stock: formData.stock,
        image: formData.image,
        minOrder: formData.minOrder,
      })
      alert('Produk berhasil diubah')
    } else {
      addProduct({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: formData.price,
        stock: formData.stock,
        image: formData.image,
        minOrder: formData.minOrder,
        printMethods: ['sablon', 'dtf'],
      })
      alert('Produk berhasil ditambahkan')
    }
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      deleteProduct(id)
    }
  }

  // ── Filtered products ────────────────────────────────────────────────────
  const filteredProducts = products.filter(p => {
    const matchSearch = search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchSearch && matchCategory
  })

  const handleExportCSV = () => {
    const rows = filteredProducts.map(p => [
      p.name,
      p.category,
      p.price.toString(),
      ((p as any).stock ?? 0).toString(),
      p.description,
    ])

    exportToCSV({
      filename: `daftar_produk_${new Date().toISOString().split('T')[0]}`,
      headers: ['Nama Produk', 'Kategori', 'Harga (Rp)', 'Stok', 'Deskripsi'],
      rows,
    })
  }

  return (
    <div className="space-y-6">
            <AdminPageHeader
              title="Produk"
              description="Kelola katalog, stok, gambar, dan harga produk yang tampil ke pelanggan."
              actions={
                <>
                <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </Button>
                <Button onClick={handleAddNew} className="px-6">
                  + Tambah Produk
                </Button>
                </>
              }
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <AdminStatTile label="Total Produk" value={products.length} hint="Dalam katalog" />
              <AdminStatTile label="Hasil Filter" value={filteredProducts.length} hint={categoryFilter === 'all' ? 'Semua kategori' : categoryFilter} tone="blue" />
              <AdminStatTile label="Total Stok" value={products.reduce((sum, p) => sum + ((p as any).stock ?? 0), 0)} hint="Unit tersedia" tone="green" />
            </div>

            {/* Form */}
            {showForm && (
              <Card className="p-8 border border-border mb-8 bg-muted/20">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-foreground/70 hover:text-foreground text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Nama & Harga */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nama Produk</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nama produk"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Harga (Rp)</label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formData.price === 0 ? '' : formData.price.toString()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '')
                          setFormData({ ...formData, price: raw === '' ? 0 : parseInt(raw) })
                        }}
                        placeholder="Contoh: 50000"
                      />
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Deskripsi</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Deskripsi produk"
                      rows={3}
                      className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  {/* Kategori & Stok */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Kategori</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="kaos">Kaos</option>
                        <option value="tote">Tote Bag</option>
                        <option value="hoodie">Hoodie</option>
                        <option value="jersey">Jersey</option>
                        <option value="jasa">Jasa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Stok</label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Upload Gambar */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Gambar Produk</label>
                    <DropZone
                      accept="image/*"
                      label="Klik atau drag & drop gambar produk"
                      hint="JPG, PNG, WEBP"
                      previewUrl={imagePreview}
                      file={imageFile}
                      onChange={handleImageChange}
                      onRemove={handleRemoveImage}
                      imagePreview
                      className="max-w-xs"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-2">
                    <Button onClick={handleSave} className="flex-1">
                      {editingId ? 'Simpan Perubahan' : 'Tambah Produk'}
                    </Button>
                    <Button
                      onClick={() => setShowForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Products Table */}
            <Card className="border border-border overflow-hidden">
              {/* ── Search & Filter bar ── */}
              <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
                  </svg>
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cari nama produk..."
                    className="pl-9 text-sm"
                  />
                </div>

                {/* Category filter chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { key: 'all',    label: 'Semua' },
                    { key: 'kaos',   label: 'Kaos' },
                    { key: 'hoodie', label: 'Hoodie' },
                    { key: 'tote',   label: 'Tote Bag' },
                    { key: 'jersey', label: 'Jersey' },
                    { key: 'jasa',   label: 'Jasa' },
                  ].map(c => (
                    <button
                      key={c.key}
                      onClick={() => setCategoryFilter(c.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        categoryFilter === c.key
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      {c.label}
                      {c.key !== 'all' && (
                        <span className="ml-1.5 opacity-70">
                          ({products.filter(p => p.category === c.key).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Result count */}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {filteredProducts.length} produk
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 text-xs font-bold text-foreground/60 uppercase tracking-wide">Produk</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-foreground/60 uppercase tracking-wide">Kategori</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-foreground/60 uppercase tracking-wide">Harga</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-foreground/60 uppercase tracking-wide">Stok</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-foreground/60 uppercase tracking-wide">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                          {search || categoryFilter !== 'all'
                            ? 'Tidak ada produk yang sesuai filter.'
                            : 'Belum ada produk.'}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b border-border/50 hover:bg-muted/20 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {product.image && (
                                <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 border border-border">
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-semibold text-foreground">{product.name}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-foreground/70 capitalize">
                              {product.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-primary">
                            Rp{product.price.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground/70">
                            {(product as any).stock != null ? `${(product as any).stock} pcs` : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(product)}
                                className="px-3 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-xs font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition text-xs font-medium"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
    </div>
  )
}
