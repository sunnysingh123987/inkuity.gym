'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Gym, GymReviewWithMember } from '@/types/database'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Users,
  Shield,
  Dumbbell,
  ArrowRight,
  Star,
} from 'lucide-react'
import Link from 'next/link'

interface GymLandingPageProps {
  gym: Gym
  scanId?: string
  qrCode?: string
  referralCode?: string
  reviews?: GymReviewWithMember[]
}

export function GymLandingPage({ gym, referralCode, reviews = [] }: GymLandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const sections = containerRef.current.querySelectorAll('[data-animate]')
    gsap.set(sections, { y: 20, opacity: 0 })
    gsap.to(sections, {
      y: 0,
      opacity: 1,
      stagger: 0.1,
      duration: 0.6,
      ease: 'power2.out',
    })
  }, [])

  const hasAddress = gym.address || gym.city || gym.state
  const fullAddress = [gym.address, gym.city, gym.state, gym.zip_code].filter(Boolean).join(', ')
  const joinUrl = `/${gym.slug}/portal/sign-in?gymId=${gym.id}&gymName=${encodeURIComponent(gym.name)}${gym.logo_url ? `&gymLogo=${encodeURIComponent(gym.logo_url)}` : ''}${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ''}`

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0B1120] text-white">
      {/* Header / Hero */}
      <header className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120] via-[#0e1726] to-[#0B1120]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-cyan-500/5 rounded-full blur-[120px]" />

        <div className="relative z-10">
          {/* Top bar */}
          <div data-animate className="border-b border-white/5">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-14 items-center justify-between">
                <div className="flex items-center gap-2">
                  {gym.logo_url ? (
                    <img
                      src={gym.logo_url}
                      alt={gym.name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-brand-cyan-500 to-brand-purple-500">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white">{gym.name}</span>
                </div>
                <Link
                  href={joinUrl}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-cyan-500 hover:bg-brand-cyan-600 px-4 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-brand-cyan-500/20"
                >
                  Join the Gym
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Hero content */}
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div data-animate className="flex flex-col items-center text-center">
              {gym.logo_url ? (
                <img
                  src={gym.logo_url}
                  alt={gym.name}
                  className="h-24 w-24 rounded-2xl object-cover border border-white/10 shadow-2xl mb-6"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl flex items-center justify-center bg-gradient-to-br from-brand-cyan-500 to-brand-purple-500 shadow-2xl mb-6">
                  <Building2 className="h-12 w-12 text-white" />
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                {gym.name}
              </h1>

              {gym.description && (
                <p className="mt-4 text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
                  {gym.description}
                </p>
              )}

              {hasAddress && (
                <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{fullAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        {/* Quick Info Cards */}
        <div data-animate className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 -mt-8 relative z-20">
          {[
            { icon: Dumbbell, label: 'Full Equipment', color: 'text-brand-cyan-400', bg: 'bg-brand-cyan-500/10' },
            { icon: Clock, label: 'Open Daily', color: 'text-brand-purple-400', bg: 'bg-brand-purple-500/10' },
            { icon: Users, label: 'Active Community', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Shield, label: 'Safe & Secure', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="rounded-xl bg-[#111827] border border-white/5 p-4 text-center hover:border-white/10 transition-colors"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${item.bg} mb-2`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <p className="text-xs font-medium text-slate-300">{item.label}</p>
              </div>
            )
          })}
        </div>

        {/* Contact & Details Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div data-animate className="rounded-2xl bg-[#111827] border border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-5">Contact Information</h2>

            <div className="space-y-4">
              {hasAddress && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-brand-cyan-500/10 flex items-center justify-center mt-0.5">
                    <MapPin className="h-4 w-4 text-brand-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Address</p>
                    <p className="text-sm text-slate-500">{fullAddress}</p>
                  </div>
                </div>
              )}

              {gym.phone && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-brand-cyan-500/10 flex items-center justify-center mt-0.5">
                    <Phone className="h-4 w-4 text-brand-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Phone</p>
                    <a href={`tel:${gym.phone}`} className="text-sm text-brand-cyan-400 hover:underline">
                      {gym.phone}
                    </a>
                  </div>
                </div>
              )}

              {gym.email && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-brand-cyan-500/10 flex items-center justify-center mt-0.5">
                    <Mail className="h-4 w-4 text-brand-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Email</p>
                    <a href={`mailto:${gym.email}`} className="text-sm text-brand-cyan-400 hover:underline">
                      {gym.email}
                    </a>
                  </div>
                </div>
              )}

              {gym.website && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-brand-cyan-500/10 flex items-center justify-center mt-0.5">
                    <Globe className="h-4 w-4 text-brand-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Website</p>
                    <a
                      href={gym.website.startsWith('http') ? gym.website : `https://${gym.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-cyan-400 hover:underline"
                    >
                      {gym.website}
                    </a>
                  </div>
                </div>
              )}

              {!gym.phone && !gym.email && !gym.website && !hasAddress && (
                <p className="text-sm text-slate-500">No contact information available yet.</p>
              )}
            </div>
          </div>

          {/* Member Portal CTA */}
          <div data-animate className="rounded-2xl bg-gradient-to-br from-[#0e1a2e] to-[#111d32] border border-white/5 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Join the Gym</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Become a member and get access to your personal dashboard, check-in tracking, fitness streaks, and more.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  'Quick and easy sign-up process',
                  'Track your check-ins & fitness streaks',
                  'Access your personal dashboard',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-brand-cyan-500/20 flex items-center justify-center">
                      <svg className="h-3 w-3 text-brand-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={joinUrl}
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-brand-cyan-500 hover:bg-brand-cyan-600 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-brand-cyan-500/25"
            >
              Join the Gym
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div data-animate className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Member Reviews</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                      return (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(avg)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-transparent text-slate-600'
                          }`}
                        />
                      )
                    })}
                  </div>
                  <span className="text-sm text-slate-400">
                    {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((review) => {
                const firstName = review.member?.full_name?.split(' ')[0] || 'Member'
                return (
                  <div
                    key={review.id}
                    className="rounded-xl bg-[#111827] border border-white/5 p-5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {review.member?.avatar_url ? (
                        <img
                          src={review.member.avatar_url}
                          alt={firstName}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-cyan-500/10 text-sm font-medium text-brand-cyan-400">
                          {firstName[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">{firstName}</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-transparent text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* About Section (if description is long, show expanded) */}
        {gym.description && gym.description.length > 100 && (
          <div data-animate className="mt-6 rounded-2xl bg-[#111827] border border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">About {gym.name}</h2>
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{gym.description}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} {gym.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-xs text-slate-500 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-xs text-slate-500 hover:text-white transition-colors">
                Privacy
              </Link>
              <span className="text-xs text-slate-600">
                Powered by{' '}
                <a href="https://inkuity.com" className="text-brand-cyan-400 hover:underline">
                  Inkuity
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
