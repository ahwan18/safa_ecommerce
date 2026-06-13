# ScreenStudio E-Commerce Platform - Quick Start Guide

## 🎯 Platform Overview

Ini adalah platform e-commerce lengkap untuk bisnis sablon dan printing dengan fitur admin CMS yang komprehensif.

## 🌐 Public Pages (Customer Side)

### Landing Page (`/`)
- **Hero Section**: Judul, subtitle, CTA button
- **Services Section**: Menampilkan 3 metode printing (Sablon, DTF, Offset)
- **Products Showcase**: 6 produk unggulan dari katalog
- **Pricing Section**: 3 paket harga (Starter, Professional, Enterprise)
- **Contact Section**: Form kontak dan informasi kontak

### Shop (`/shop`)
- Filter produk berdasarkan kategori
- Sort produk (harga, populer, terbaru)
- Responsive grid product cards
- Link ke product detail

### Product Detail (`/shop/[id]`)
- Gambar produk full-size
- Deskripsi lengkap
- Pilih metode print (Sablon, DTF, Offset)
- Quantity selector dengan minimum order
- Add to cart functionality

### Shopping Cart (`/cart`)
- Daftar item di keranjang
- Edit quantity atau hapus item
- Ringkasan total (subtotal + shipping)
- Proceed to checkout button

### Checkout (`/checkout`)
Multi-step checkout:
1. **Shipping Info**: Nama, email, alamat lengkap
2. **Payment Method**: Pilih metode pembayaran
3. **Review**: Konfirmasi pesanan sebelum submit

### Order Tracking (`/order-tracking`)
- Search pesanan berdasarkan nomor order
- Lihat detail pesanan dengan status timeline
- Track posisi paket pengiriman

### Design Upload (`/design-upload`)
- Upload file desain (PDF, JPG, PNG, AI, PSD)
- Input detail pesanan (jumlah, warna, ukuran)
- Kontak langsung dari tim untuk konfirmasi

## 🔐 Admin Panel (`/admin`)

### Login
- **URL**: `/admin/login`
- **Default Password**: `admin123`
- Redirect ke dashboard setelah login berhasil

### Dashboard (`/admin`)
- Overview statistik (total pesanan, revenue, customers, diproses)
- Status breakdown dengan progress bar
- 5 pesanan terbaru
- Ringkasan performa bisnis

### Products Management (`/admin/products`)
- **Add Product**: Form untuk tambah produk baru
- **Edit Product**: Edit nama, harga, kategori, deskripsi
- **Delete Product**: Hapus produk dari katalog
- Table view semua produk dengan search

### Orders Management (`/admin/orders`)
- Daftar semua pesanan dengan status
- Klik pesanan untuk lihat detail
- Ubah status pesanan (Pending → Processing → Ready → Shipped → Delivered)
- View customer info dan alamat pengiriman

### Content Management (`/admin/content`)
Edit konten website:
- **Hero Section**: Title, subtitle, CTA text, background image
- **Services**: Info layanan printing (read-only)
- **Contact**: Phone, email, address, business hours
- **About**: Info perusahaan (read-only)

### Settings (`/admin/settings`)
- **Shipping**: Biaya pengiriman standar
- **Rush Order**: Biaya pesanan cepat
- **Minimum Order**: Nilai minimal pesanan
- **Discount**: Kode promo dan persentase diskon
<!-- Discount/promo removed -->

### Analytics (`/admin/analytics`)
- Total revenue, orders, customers, avg order value
- Revenue breakdown by status
- Monthly sales trends
- Top 5 products by sales
- Download reports (PDF/CSV)

## 🗂️ Project Structure

```
/app
  /(landing)          # Landing page
  /shop               # Shop & product detail
  /cart               # Shopping cart
  /checkout           # Multi-step checkout
  /order-tracking     # Order tracking pages
  /design-upload      # Design upload form
  /admin              # Admin panel
    /login            # Admin login
    /products         # Product management
    /orders           # Order management
    /content          # CMS content editor
    /settings         # Pricing & settings
    /analytics        # Reports & analytics

/components
  /header             # Navigation header
  /footer             # Footer with contact
  /landing            # Landing page sections
  /shop               # Shop components
  /admin              # Admin components

/lib
  /contexts           # React contexts (Cart, Auth, Orders, CMS)
  /types.ts           # TypeScript types
  /mock-data.ts       # Mock products data
```

## 💾 Data Storage

Semua data disimpan di **localStorage** (browser storage):
- `cart`: Items dalam keranjang
- `orders`: Daftar pesanan
- `adminToken`: Auth status admin
- `cmsContent`: Website content edits

Data akan persisten selama tidak clear browser cache.

## 🎨 Design System

**Color Palette:**
- **Primary (Navy)**: `oklch(0.25 0.15 260)` - CTA buttons, highlights
- **Accent (Gold)**: `oklch(0.65 0.18 60)` - Accents, icons
- **Background (Cream)**: `oklch(0.98 0.01 70)` - Main background
- **Foreground (Dark Navy)**: `oklch(0.15 0.02 250)` - Text

**Typography:**
- Geist Sans: Headlines & body
- Geist Mono: Technical content

## 🔑 Key Features

✓ Responsive design (mobile-first)
✓ Shopping cart with persistent storage
✓ Multi-step checkout flow
✓ Order tracking system
✓ Admin CMS untuk edit konten website
✓ Product management (CRUD)
✓ Order management & status tracking
✓ Analytics & reporting
✓ Pricing configuration
✓ Design upload form
✓ Beautiful minimalist luxury design
✓ No external backend required (mock data)

## 📝 Admin CMS Usage

1. Login dengan password "admin123"
2. Go to "Konten" tab
3. Edit Hero Section: judul, subtitle, tombol CTA
4. Edit Kontak: phone, email, address, jam operasional
5. Changes otomatis tersimpan di localStorage

## 🚀 Next Steps (Production)

Untuk production deployment, pertimbangkan:
- Setup backend database (Supabase, Firebase, PostgreSQL)
- Integrate real payment gateway (Stripe, Midtrans)
- Add email notifications
- Implement proper user authentication
- Add image hosting (Cloudinary, AWS S3)
- Analytics integration (Google Analytics, Mixpanel)

---

**Built with**: Next.js 16, React 19, Tailwind CSS 4, TypeScript
**Demo Password**: admin123
