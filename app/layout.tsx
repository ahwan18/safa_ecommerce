import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/contexts/cart-context'
import { OrderProvider } from '@/lib/contexts/order-context'
import { AuthProvider } from '@/lib/contexts/auth-context'
import { CMSProvider } from '@/lib/contexts/cms-context'
import { ProductProvider } from '@/lib/contexts/product-context'
import { NotificationProvider } from '@/lib/contexts/notification-context'
import { ReviewProvider } from '@/lib/contexts/review-context'
import { AddressProvider } from '@/lib/contexts/address-context'
import { WAConfigProvider } from '@/lib/contexts/wa-config-context'
import { ShippingConfigProvider } from '@/lib/contexts/shipping-config-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'Safa Sablon - Sablon Profesional',
  description: 'Layanan sablon profesional untuk produk dan jasa. Desain custom, harga kompetitif, kualitas terjamin.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F0EB' },
    { media: '(prefers-color-scheme: dark)', color: '#1F1B2F' }
  ],
  userScalable: true,
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="bg-background">
      <body className="font-sans antialiased text-foreground">
        <AuthProvider>
          <WAConfigProvider>
          <ShippingConfigProvider>
          <CMSProvider>
            <NotificationProvider>
              <ReviewProvider>
                <AddressProvider>
                  <ProductProvider>
                    <CartProvider>
                      <OrderProvider>
                        {children}
                      </OrderProvider>
                    </CartProvider>
                  </ProductProvider>
                </AddressProvider>
              </ReviewProvider>
            </NotificationProvider>
          </CMSProvider>
          </ShippingConfigProvider>
          </WAConfigProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
