import { Header } from '@/components/header'

import { Footer } from '@/components/footer'

import { HeroSection } from '@/components/landing/hero-section'

import { WhySection } from '@/components/landing/why-section'

import { ProductsSection } from '@/components/landing/products-section'

import { ContactSection } from '@/components/landing/contact-section'

import { WhatsAppFloatingButton } from '@/components/whatsapp-button'



export default function LandingPage() {

  return (

    <div className="overflow-x-hidden">

      <Header />

      <main className="min-h-screen">

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
