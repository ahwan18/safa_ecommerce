'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AdminPageHeader } from '@/components/admin/ui'
import { exportToCSV } from '@/lib/utils/csv-export'

interface MockUser {
  id: string | number
  email: string
  fullName: string
  role: 'customer' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  phone?: string
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<MockUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<MockUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'customer' | 'admin'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    role: 'customer' as 'customer' | 'admin',
    status: 'active' as 'active' | 'inactive' | 'suspended',
  })

  // Mock users data
  useEffect(() => {
    const mockUsers: MockUser[] = [
      {
        id: 1,
        email: 'admin@screenstudio.com',
        fullName: 'Admin ScreenStudio',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-15',
      },
      {
        id: 2,
        email: 'customer@example.com',
        fullName: 'Budi Santoso',
        role: 'customer',
        status: 'active',
        phone: '08123456789',
        createdAt: '2024-02-20',
      },
      {
        id: 3,
        email: 'toko.online@example.com',
        fullName: 'Toko Online Jaya',
        role: 'customer',
        status: 'active',
        phone: '08198765432',
        createdAt: '2024-03-10',
      },
      {
        id: 4,
        email: 'personal@example.com',
        fullName: 'Rina Kusuma',
        role: 'customer',
        status: 'active',
        phone: '08112345678',
        createdAt: '2024-03-25',
      },
    ]
    setUsers(mockUsers)
  }, [])

  // Filter users
  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, filterRole])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      // Update user
      setUsers(users.map(u =>
        u.id === editingId
          ? {
            ...u,
            ...formData,
          }
          : u
      ))
      setEditingId(null)
    } else {
      // Add new user
      const newUser: MockUser = {
        id: Math.max(...users.map(u => typeof u.id === 'number' ? u.id : 0), 0) + 1,
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
      }
      setUsers([...users, newUser])
    }

    setFormData({
      email: '',
      fullName: '',
      phone: '',
      role: 'customer',
      status: 'active',
    })
    setShowForm(false)
  }

  const handleEdit = (u: MockUser) => {
    setFormData({
      email: u.email,
      fullName: u.fullName,
      phone: u.phone || '',
      role: u.role,
      status: u.status,
    })
    setEditingId(u.id)
    setShowForm(true)
  }

  const handleDelete = (id: string | number) => {
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      setUsers(users.filter(u => u.id !== id))
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      email: '',
      fullName: '',
      phone: '',
      role: 'customer',
      status: 'active',
    })
  }

  const handleExportCSV = () => {
    const rows = filteredUsers.map(u => [
      u.email,
      u.fullName,
      u.role === 'admin' ? 'Admin' : 'Pelanggan',
      u.status === 'active' ? 'Aktif' : u.status === 'inactive' ? 'Tidak Aktif' : 'Ditangguhkan',
      u.phone || '',
      u.createdAt,
    ])

    exportToCSV({
      filename: `daftar_pengguna_${new Date().toISOString().split('T')[0]}`,
      headers: ['Email', 'Nama Lengkap', 'Role', 'Status', 'Telepon', 'Bergabung'],
      rows,
    })
  }

  return (
    <>
          <div className="mb-8">
            <AdminPageHeader
              title="Manajemen Pengguna"
              description="Kelola pelanggan, admin, status akun, dan ekspor daftar pengguna."
              actions={
                <>
                <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </Button>
                <Button onClick={() => setShowForm(true)}>
                  + Tambah Pengguna
                </Button>
                </>
              }
            />

            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Input
                placeholder="Cari email atau nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="col-span-1 md:col-span-2"
              />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="px-4 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">Semua Role</option>
                <option value="customer">Pelanggan</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <Card className="border border-border mb-8 p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                {editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nama Lengkap</label>
                    <Input
                      type="text"
                      name="fullName"
                      placeholder="Nama lengkap"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Telepon</label>
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="08123456789"
                      value={formData.phone}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="customer">Pelanggan</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Tidak Aktif</option>
                      <option value="suspended">Ditangguhkan</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button type="submit">
                    {editingId ? 'Update Pengguna' : 'Tambah Pengguna'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Batal
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Users Table */}
          <Card className="border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-4 px-6 font-bold text-foreground">Email</th>
                    <th className="text-left py-4 px-6 font-bold text-foreground">Nama</th>
                    <th className="text-left py-4 px-6 font-bold text-foreground">Role</th>
                    <th className="text-left py-4 px-6 font-bold text-foreground">Status</th>
                    <th className="text-left py-4 px-6 font-bold text-foreground">Bergabung</th>
                    <th className="text-center py-4 px-6 font-bold text-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                        <td className="py-4 px-6 text-foreground">{u.email}</td>
                        <td className="py-4 px-6 text-foreground font-medium">{u.fullName}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin'
                              ? 'bg-accent/20 text-accent'
                              : 'bg-primary/20 text-primary'
                          }`}>
                            {u.role === 'admin' ? 'Admin' : 'Pelanggan'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            u.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : u.status === 'inactive'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {u.status === 'active' ? 'Aktif' : u.status === 'inactive' ? 'Tidak Aktif' : 'Ditangguhkan'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">{u.createdAt}</td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleEdit(u)}
                            className="text-primary hover:text-primary/80 font-medium text-xs mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="text-destructive hover:text-destructive/80 font-medium text-xs"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 px-6 text-center text-muted-foreground">
                        Tidak ada pengguna yang ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground mt-4">
            Total: {filteredUsers.length} pengguna
          </p>
    </>
  )
}
