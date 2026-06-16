'use client'

import Link from 'next/link'
import { useCMS } from '@/lib/contexts/cms-context'
import { WhatsAppInlineButton } from '@/components/whatsapp-button'

export function HeroSection() {
  // Mengambil data langsung dari CMS Context agar sinkron dengan Admin Panel
  const { getContent } = useCMS()
  const heroContent = getContent('hero') || {}

  // Menyesuaikan key dengan yang disimpan oleh Admin Panel lu
  const title = heroContent.title || 'Selamat Datang di Safa Apparel Sablon & Printing'
  const subtitle = heroContent.subtitle || 'Wujudkan desain impianmu bersama kami. Sablon kaos, hoodie, tote bag, jersey, dan berbagai produk custom berkualitas tinggi dengan harga kompetitif.'
  const ctaText = heroContent.ctaText || 'Pesan Sekarang'
  const displayImage = heroContent.backgroundImage || '/mockup-produk.png'

  return (
    <section
      id="home"
      style={{
        background: 'linear-gradient(135deg, #0d1b2a 0%, #162536 50%, #0d1b2a 100%)',
        minHeight: '85vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 'clamp(40px, 8vw, 40px)',
        paddingBottom: 'clamp(40px, 8vw, 40px)',
      }}
      className="px-4 sm:px-6"
    >
      {/* Background decorative modern glows */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: 'clamp(220px, 50vw, 500px)',
            height: 'clamp(220px, 50vw, 500px)',
            borderRadius: '50%',
            backgroundColor: 'rgba(249,115,22,0.06)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '15%',
            width: 'clamp(180px, 40vw, 400px)',
            height: 'clamp(180px, 40vw, 400px)',
            borderRadius: '50%',
            backgroundColor: 'rgba(34,211,238,0.03)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div className="hero-grid">
          {/* LEFT CONTENT */}
          <div style={{ minWidth: 0 }}>
            {/* Pill label */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 99,
                padding: '6px 16px',
                marginBottom: 24,
                maxWidth: '100%',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#f97316',
                  boxShadow: '0 0 8px #f97316',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.8)',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Safa Apparel — Sablon Profesional
              </span>
            </div>

            {/* Main Heading */}
            <h1
              style={{
                fontSize: 'clamp(28px, 6vw, 56px)',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.15,
                marginBottom: 20,
                letterSpacing: '-0.02em',
                wordBreak: 'break-word',
              }}
            >
              {title === 'Selamat Datang di Safa Apparel Sablon & Printing' ? (
                <>
                  Selamat Datang di <span style={{ color: '#f97316' }}>Safa Apparel</span>
                  <br />
                  Sablon & Printing
                </>
              ) : (
                title
              )}
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: 'clamp(14px, 1.6vw, 16px)',
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.8,
                marginBottom: 36,
                maxWidth: 480,
              }}
            >
              {subtitle}
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
                marginBottom: 40,
              }}
            >
              <Link href="/shop">
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#f97316',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    padding: '14px 32px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 20px rgba(249,115,22,0.25)',
                    minHeight: 48,
                    width: 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ea6c00'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f97316'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {ctaText}
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Link>
              <WhatsAppInlineButton variant="outline" label="Konsultasi Gratis" />
            </div>

            {/* Mini Features */}
            <div
              style={{
                display: 'flex',
                gap: 24,
                flexWrap: 'wrap',
              }}
            >
              {[
                { text: 'Kualitas Premium' },
                { text: 'Free Konsultasi' },
                { text: 'Pengiriman Cepat' },
              ].map((f) => (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#f97316', fontWeight: 900, fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT CONTENT: CLEAN SHOWCASE IMAGE */}
          <div
            className="hero-image-wrap"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              minWidth: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Kontainer Utama Gambar diubah menjadi Persegi & Sudut Tumpul (Estetik) */}
            <div
              style={{
                width: '100%',
                maxWidth: 440,
                aspectRatio: '1/1',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.4s ease-out',
                borderRadius: '24px', 
                overflow: 'hidden', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <img
                src={displayImage}
                alt="Safa Apparel Premium Showcase"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}