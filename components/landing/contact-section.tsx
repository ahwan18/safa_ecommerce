'use client'

import { useCMS } from '@/lib/contexts/cms-context'
import { WhatsAppInlineButton } from '@/components/whatsapp-button'

const MAPS_DEFAULT =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.8195613!3d-6.194741!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5d2e764b12d%3A0x3d2ad6e1e0e9bcc8!2sJakarta%20Pusat!5e0!3m2!1sid!2sid!4v1700000000000!5e2!1sid!2sid'
const LINK_DEFAULT = 'https://maps.google.com/?q=Jakarta+Pusat,+Indonesia'

export function ContactSection() {
  const { getContent } = useCMS()
  const c = getContent('contact') ?? {}

  const address = c.address || 'Jl. Merdeka No. 123, Jakarta'
  const phone = c.phone || '+62 812-3456-7890'
  const email = c.email || 'info@safa-apparel.id'
  const hours = c.businessHours || 'Senin – Jumat, 08:00 – 17:00'
  const embed = c.mapsEmbed || MAPS_DEFAULT
  const link = c.mapsLink || LINK_DEFAULT

  const contacts = [
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      ),
      label: 'Telepon',
      value: phone,
      sub: hours,
      href: `tel:${phone}`,
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      label: 'Email',
      value: email,
      sub: 'Respon dalam 2 jam kerja',
      href: `mailto:${email}`,
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      label: 'Alamat',
      value: address,
      sub: null,
      href: link,
    },
  ]

  return (
    <section
      id="contact"
      style={{
        backgroundColor: '#f8fafc',
        paddingTop: 'clamp(40px, 10vw, 80px)',
        paddingBottom: 'clamp(40px, 10vw, 80px)',
      }}
      className="px-4 sm:px-6"
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* ── Section header ── */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 6vw, 52px)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: 99,
              padding: '5px 14px',
              marginBottom: 14,
              maxWidth: '100%',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f97316', flexShrink: 0 }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#f97316',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}
            >
              HUBUNGI KAMI
            </span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px, 4vw, 38px)',
              fontWeight: 900,
              color: '#0d1b2a',
              marginBottom: 10,
              wordBreak: 'break-word',
              padding: '0 8px',
            }}
          >
            Ada Pertanyaan? Kami Siap Membantu
          </h2>
          <p
            style={{
              fontSize: 'clamp(14px, 1.6vw, 15px)',
              color: '#64748b',
              maxWidth: 480,
              margin: '0 auto',
              lineHeight: 1.7,
              padding: '0 8px',
            }}
          >
            Hubungi kami melalui telepon, email, atau kunjungi lokasi kami langsung.
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="contact-grid">
          {/* ── LEFT: contact info ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {contacts.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.label === 'Alamat' ? '_blank' : undefined}
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 'clamp(14px, 3vw, 20px)',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget
                    el.style.borderColor = '#f97316'
                    el.style.boxShadow = '0 4px 16px rgba(249,115,22,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget
                    el.style.borderColor = '#e2e8f0'
                    el.style.boxShadow = 'none'
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: '#fff7ed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f97316',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        marginBottom: 3,
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#0d1b2a',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {item.value}
                    </p>
                    {item.sub && (
                      <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.sub}</p>
                    )}
                  </div>
                </div>
              </a>
            ))}

            {/* WhatsApp CTA */}
            <div style={{ marginTop: 4 }}>
              <WhatsAppInlineButton
                label="Konsultasi via WhatsApp"
                variant="default"
                className="w-full justify-center"
              />
            </div>

            {/* Hours card */}
            <div
              style={{
                backgroundColor: '#0d1b2a',
                borderRadius: 16,
                padding: 'clamp(14px, 3vw, 20px)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(249,115,22,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f97316',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 3,
                  }}
                >
                  Jam Operasional
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', wordBreak: 'break-word' }}>{hours}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                  Sabtu – Minggu: Tutup
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Maps ── */}
          <div
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', minHeight: 280 }}>
              <iframe
                src={embed}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi Safa Apparel"
              />
            </div>
            {/* Maps footer bar */}
            <div
              style={{
                backgroundColor: '#fff',
                borderTop: '1px solid #f1f5f9',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: '#fff7ed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="#f97316" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                  }}
                >
                  {address}
                </span>
              </div>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#f97316',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Buka Maps
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
