'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { name: 'Home', href: '#' },
  { name: 'Product', href: '#features' },
  { name: 'FAQ', href: '#faq' },
  { name: 'Contact us', href: '#contact' },
]

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('Home')

  return (
    <nav data-nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 transition-opacity hover:opacity-90">
            <img src="/logo.png" alt="Inkuity" className="h-8 w-auto" />
            <span className="text-lg font-bold text-foreground">Inkuity</span>
          </Link>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setActiveLink(link.name)}
                className={`text-sm font-medium transition-colors relative ${
                  activeLink === link.name
                    ? 'text-brand-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.name}
                {activeLink === link.name && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-brand-cyan-400 rounded-full" />
                )}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-brand-cyan-500 hover:bg-brand-cyan-600 px-6 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-cyan-500/25"
            >
              Get Started
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden -m-2.5 p-2.5 text-slate-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Toggle menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0B1120]/98 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`block rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                  activeLink === link.name
                    ? 'text-brand-cyan-400 bg-brand-cyan-500/10'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
                onClick={() => {
                  setActiveLink(link.name)
                  setMobileMenuOpen(false)
                }}
              >
                {link.name}
              </a>
            ))}
            <Link
              href="/register"
              className="block mt-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center justify-center w-full rounded-full bg-brand-cyan-500 px-6 py-2.5 text-sm font-semibold text-white">
                Get Started
              </span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
