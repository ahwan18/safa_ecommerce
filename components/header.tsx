'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/contexts/cart-context'
import { useAuth } from '@/lib/contexts/auth-context'
import { UserProfilePopup } from '@/components/user-profile-popup'
import { UserNotificationBell } from '@/components/notification-bell'
import { Button } from '@/components/ui/button'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { items } = useCart()
  const { isAuthenticated } = useAuth()

  // Bounce animation on cart count change
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const [bounce, setBounce] = useState(false)
  const prevCount = useRef(cartCount)

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBounce(true)
      setTimeout(() => setBounce(false), 400)
    }
    prevCount.current = cartCount
  }, [cartCount])

  // Close mobile menu when route hash changes (anchor link click)
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [mobileMenuOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 min-w-0">
            <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground text-sm font-semibold">S</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-foreground hidden sm:inline truncate">
              Safa Apparel
            </span>
          </Link>

          {/* Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/#home"
              className="text-sm font-medium transition-all duration-300 hover:text-primary hover:scale-105"
            >
              Home
            </Link>
            <Link
              href="/#shop"
              className="text-sm font-medium transition-all duration-300 hover:text-primary hover:scale-105"
            >
              Shop
            </Link>
            <Link
              href="/#contact"
              className="text-sm font-medium transition-all duration-300 hover:text-primary hover:scale-105"
            >
              Contact
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {/* Cart */}
            <Link
              href={isAuthenticated ? '/cart' : '/login?redirect=/cart'}
              className="relative"
              aria-label="Keranjang"
            >
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-secondary/60 transition w-10 h-10 sm:w-10 sm:h-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10 0l2 9m-12-9h14M17 6h2m-2 3h2"
                  />
                </svg>
                {cartCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: 'rgb(220,38,38)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 700,
                      transition: 'transform 0.15s ease',
                      transform: bounce ? 'scale(1.5)' : 'scale(1)',
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Login Button (Desktop) */}
            {!isAuthenticated && (
              <Link href="/login" className="hidden sm:inline-block">
                <Button size="sm" className="px-4 text-sm">
                  Login
                </Button>
              </Link>
            )}

            {/* Notification Bell — only when logged in */}
            {isAuthenticated && <UserNotificationBell />}

            {/* User Profile Popup */}
            {isAuthenticated && <UserProfilePopup />}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-secondary/60 transition w-10 h-10 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={
                    mobileMenuOpen
                      ? 'M6 18L18 6M6 6l12 12'
                      : 'M4 6h16M4 12h16M4 18h16'
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col gap-1 pb-4 border-t border-border pt-3">
            <Link
              href="/#home"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-3 text-sm font-medium rounded-md hover:bg-secondary/60 transition"
            >
              Home
            </Link>
            <Link
              href="/#shop"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-3 text-sm font-medium rounded-md hover:bg-secondary/60 transition"
            >
              Shop
            </Link>
            <Link
              href="/#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-3 text-sm font-medium rounded-md hover:bg-secondary/60 transition"
            >
              Contact
            </Link>

            {!isAuthenticated && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 pt-2"
              >
                <Button size="sm" className="w-full min-h-[44px]">
                  Login
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}