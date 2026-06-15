'use client'

import Link from 'next/link'
import { WhatsAppInlineButton } from '@/components/whatsapp-button'

export function WhySection() {
  const features = [
    'Sablon Manual & Digital',
    'Bahan Premium Tersertifikasi',
    'Desain Custom Unlimited Revisi',
    'Pengiriman ke Seluruh Indonesia',
  ]

  return (
    <section
      style={{ backgroundColor: '#fff', paddingTop: 'clamp(40px, 10vw, 80px)', paddingBottom: 'clamp(40px, 10vw, 80px)' }}
      className="px-4 sm:px-6"
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="why-grid">
          {/* Left */}
          <div style={{ minWidth: 0 }}>
            {/* Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 99,
                padding: '5px 14px',
                marginBottom: 20,
                maxWidth: '100%',
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f97316', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316', whiteSpace: 'nowrap' }}>
                KEUNGGULAN KAMI
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(24px, 4vw, 42px)',
                fontWeight: 900,
                color: '#0d1b2a',
                lineHeight: 1.2,
                marginBottom: 16,
                wordBreak: 'break-word',
              }}
            >
              Sablon Berkualitas,{' '}
              <span style={{ color: '#f97316' }}>Bebas Khawatir</span>
            </h2>

            <p
              style={{
                fontSize: 'clamp(14px, 1.6vw, 15px)',
                color: '#64748b',
                lineHeight: 1.75,
                marginBottom: 28,
                maxWidth: 440,
              }}
            >
              Safa Apparel hadir untuk memberikan pengalaman mencetak terbaik. Dari desain hingga pengiriman, kami
              jaga setiap detail agar kamu puas.
            </p>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {features.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: '#f97316',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="12" height="12" fill="none" stroke="#fff" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href="/shop">
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#0d1b2a',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    padding: '11px 24px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  Lihat Produk
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Link>
              <WhatsAppInlineButton variant="outline" label="Ada Pertanyaan?" />
            </div>
          </div>

          {/* Right — image collage */}
          <div className="why-image-wrap" style={{ position: 'relative', minWidth: 0 }}>
            {/* Main big card */}
            <div
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #0d1b2a 0%, #1a3a5c 100%)',
                aspectRatio: '4/3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                position: 'relative',
                width: '100%',
              }}
            >
              <div style={{ textAlign: 'center', padding: 'clamp(16px, 4vw, 32px)' }}>
                <div style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: 12 }}>🧥</div>
                <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                  Custom Printing
                </p>
                <p style={{ fontSize: 'clamp(11px, 1.4vw, 13px)', color: 'rgba(255,255,255,0.6)' }}>
                  Kaos · Hoodie · Tote Bag · Jersey
                </p>
              </div>
              {/* Orange badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 20,
                  backgroundColor: '#f97316',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>10+</p>
                  <p style={{ fontSize: 10, opacity: 0.85 }}>Tahun Pengalaman</p>
                </div>
              </div>
            </div>

            {/* Small card — methods */}
            <div
              style={{
                position: 'absolute',
                top: -16,
                right: -16,
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: '14px 16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                border: '1px solid #f1f5f9',
                minWidth: 140,
              }}
              className="why-floating-card"
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#94a3b8',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Metode Cetak
              </p>
              {['Sablon', 'DTF', 'Offset'].map((m) => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f97316' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{m}</span>
                </div>
              ))}
            </div>

            {/* Arrow decoration */}
            <div
              style={{
                position: 'absolute',
                bottom: -20,
                right: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
              className="why-arrows"
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderBottom: `16px solid ${i % 2 === 0 ? '#f97316' : '#22d3ee'}`,
                    opacity: 0.3 + i * 0.25,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
