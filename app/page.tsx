import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/components/landing/hero-section'
import { WhySection } from '@/components/landing/why-section'
import { ProductsSection } from '@/components/landing/products-section'
import { ContactSection } from '@/components/landing/contact-section'
import { WhatsAppFloatingButton } from '@/components/whatsapp-button'

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden min-h-screen flex flex-col">
      <Header />
      
      {/* Tambahan padding top agar konten tidak tertutup header fixed */}
      <main className="flex-1 pt-14 sm:pt-16">
        <HeroSection />
        <WhySection />
        <ProductsSection />
        <ContactSection />
      </main>
      
      <Footer />
      <WhatsAppFloatingButton />
    </div>
  )
}