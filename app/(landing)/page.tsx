import Link from 'next/link'
import type { Metadata } from 'next'
import { LandingNav } from '@/components/landing/landing-nav'
import { LandingAnimations } from '@/components/landing/landing-animations'
import { DemoRequestForm } from '@/components/landing/demo-request-form'
import {
  Check,
  QrCode,
  BarChart3,
  Users,
  Star,
  Shield,
  Zap,
  Calendar,
  Award,
  ArrowRight,
  TrendingUp,
  ChevronDown,
  Smartphone,
  Activity,
  Mail,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Inkuity — Free Gym Management Software | QR Check-Ins, Workouts & Analytics',
  description: 'Inkuity is a free, all-in-one gym management platform. QR code check-ins, workout tracking, AI diet plans, member analytics, streak gamification, and a branded member portal — built for modern gyms, fitness studios, and CrossFit boxes.',
  keywords: ['gym management software', 'gym management platform', 'QR code check-in', 'gym check-in system', 'fitness business software', 'member management', 'gym analytics', 'workout tracking app', 'gym attendance tracking', 'free gym software', 'gym member portal', 'fitness streak tracking', 'AI diet planner', 'personal records tracker', 'gym referral program', 'gym management app India'],
  openGraph: {
    title: 'Inkuity — Free Gym Management Software for Modern Fitness Businesses',
    description: 'QR check-ins, workout tracking, AI diet plans, member analytics, and a branded member portal. Free forever for gym owners.',
    url: 'https://inkuity.com',
    siteName: 'Inkuity',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inkuity — Free Gym Management Software',
    description: 'QR check-ins, workout tracking, AI diet plans, and analytics. Built for modern gyms.',
  },
  alternates: {
    canonical: 'https://inkuity.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const testimonials = [
  {
    name: 'Rahul Sharma',
    role: 'Owner, FitZone Gym',
    quote:
      'Inkuity transformed how we manage our gym. The QR check-in system alone saved us hours every week. Our members love the seamless experience.',
    initials: 'RS',
    gradient: 'from-brand-cyan-400 to-blue-500',
  },
  {
    name: 'Priya Patel',
    role: 'Manager, Iron Temple',
    quote:
      'The analytics dashboard gives me real-time insights into member attendance and trends. It helped us optimize our class schedules and boost retention.',
    initials: 'PP',
    gradient: 'from-brand-purple-400 to-brand-pink-400',
  },
  {
    name: 'Arjun Mehta',
    role: 'Founder, CrossFit Hub',
    quote:
      'Setting up was incredibly easy. Within minutes we had our gym profile, QR codes, and member\'s page ready. The onboarding wizard made it effortless.',
    initials: 'AM',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    name: 'Sneha Reddy',
    role: 'Owner, Flex Fitness Studio',
    quote:
      'Finally, a gym management platform that actually understands what small gym owners need. Simple, powerful, and affordable.',
    initials: 'SR',
    gradient: 'from-amber-400 to-orange-500',
  },
]

const faqs = [
  {
    q: 'What is Inkuity and how does it help gym owners?',
    a: 'Inkuity is a free, all-in-one gym management platform designed for modern fitness businesses. It helps gym owners manage member check-ins via QR codes, track attendance patterns, view real-time analytics, manage payments and subscriptions, engage members through a branded portal, and grow their business with built-in referral programs — all from a single dashboard.',
  },
  {
    q: 'How does the QR code check-in system work?',
    a: 'When you set up your gym on Inkuity, a unique QR code is generated automatically. Print and display it at your entrance. Members scan the QR code with their phone camera — no app download needed. They check in instantly, and you see real-time attendance on your dashboard. Members can also tag their workout focus (chest, back, legs, etc.) during check-in.',
  },
  {
    q: 'Is Inkuity really free? What is the catch?',
    a: 'Yes, Inkuity is genuinely free for all gym owners. There is no catch, no credit card required, and no hidden fees. We believe in building trust first. The core platform — including unlimited member check-ins, QR codes, analytics, member management, workout tracking, and the branded member portal — is free. Premium features may be introduced in the future, but the free tier will always remain comprehensive.',
  },
  {
    q: 'What features do gym members get with Inkuity?',
    a: 'Every gym member gets access to a personalized fitness portal. This includes: QR code check-in, custom workout routines with an exercise library of 100+ exercises, real-time session logging with weight and reps tracking, an AI-powered diet plan generator, daily nutrition and macro tracking, check-in streak gamification, personal records (PR) tracking, smart workout suggestions based on training history, a referral program, and direct feedback chat with the gym.',
  },
  {
    q: 'Does Inkuity offer workout tracking and diet planning?',
    a: 'Yes. Members can build custom workout routines, log every exercise set with weight and reps, and track session history. Inkuity also includes an AI-powered diet plan generator that creates personalized nutrition plans based on fitness goals, body metrics, activity levels, and dietary preferences (vegetarian, non-veg, vegan, etc.). A built-in food logger tracks daily calorie and macro intake against targets.',
  },
  {
    q: 'How does Inkuity help with member retention?',
    a: 'Inkuity drives member retention through streak gamification (daily check-in streaks), smart workout suggestions that keep training varied, personal records tracking that shows visible progress, a built-in referral program that rewards members for bringing friends, and real-time analytics that help gym owners identify at-risk members. The comprehensive member portal keeps members engaged beyond just showing up.',
  },
  {
    q: 'Can I manage multiple gym locations with Inkuity?',
    a: 'Currently, each Inkuity account supports one gym location. Multi-location support is on our roadmap and will be available soon. Each location will have its own QR code, member base, and analytics.',
  },
  {
    q: 'How do I get started with Inkuity?',
    a: 'Getting started takes under 2 minutes. Click "Get Started Free", create your account, verify your email, and our onboarding wizard will guide you through setting up your gym profile, generating your QR code, and configuring your member portal. Your first member can check in within minutes.',
  },
  {
    q: 'Is my gym and member data secure on Inkuity?',
    a: 'Absolutely. Inkuity uses industry-standard AES-256 encryption, secure database storage with Supabase (PostgreSQL), row-level security policies, HttpOnly session cookies, and follows best practices for data protection. Your member data is never sold to third parties. We are committed to GDPR-compliant data handling.',
  },
  {
    q: 'Does Inkuity work on mobile devices?',
    a: 'Yes. Inkuity is a Progressive Web App (PWA) that works on any device with a browser — smartphones, tablets, and desktops. Members can install it on their home screen for an app-like experience without downloading from an app store. It is optimized for use on the gym floor.',
  },
]

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Inkuity',
  url: 'https://inkuity.com',
  logo: 'https://inkuity.com/logo.png',
  description: 'Free all-in-one gym management platform with QR check-ins, workout tracking, AI diet plans, and member analytics.',
  email: 'contact@inkuity.com',
  sameAs: [],
}

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Inkuity',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android (PWA)',
  description: 'Complete gym management platform with QR code check-ins, workout tracking, AI-powered diet plans, member analytics, streak gamification, referral programs, and a branded member portal.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '50',
    bestRating: '5',
  },
  featureList: [
    'QR Code Check-In System',
    'Real-Time Analytics Dashboard',
    'Member Management & Profiles',
    'Workout Routine Builder',
    'Exercise Session Logger',
    'Personal Records Tracker',
    'AI-Powered Diet Plan Generator',
    'Nutrition & Macro Tracker',
    'Streak & Gamification System',
    'Referral Program',
    'Payment & Subscription Tracking',
    'Branded Member Portal',
    'Push Notifications',
    'Staff & Expense Management',
    'Review & Feedback System',
  ],
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] antialiased text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <LandingNav />
      <LandingAnimations />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[85vh] sm:min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120] via-[#0a0f1a] to-[#0B1120]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(15,25,50,0.8),transparent)]" />
        <div className="absolute top-0 left-1/4 w-1 h-[60%] bg-gradient-to-b from-white/5 to-transparent rotate-[15deg] blur-sm" />
        <div className="absolute top-0 right-1/3 w-1 h-[50%] bg-gradient-to-b from-white/3 to-transparent rotate-[-10deg] blur-sm" />
        <div className="absolute top-0 left-1/2 w-[2px] h-[70%] bg-gradient-to-b from-white/4 to-transparent rotate-[5deg] blur-[2px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[400px] bg-gradient-to-t from-[#0B1120] via-[#0B1120]/80 to-transparent rounded-t-full blur-[1px]" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-brand-pink-500/3 rounded-full blur-[80px]" />

        <div className="relative z-10 text-center px-4 sm:px-6">
          <h1 data-hero-title className="text-[1.6rem] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wider uppercase leading-tight">
            <span data-hero-line-1 className="block text-white">You Build The Business</span>
            <span data-hero-line-2 className="block text-white mt-1 sm:mt-2">We Build The System</span>
          </h1>
          <p data-hero-line-2 className="mt-4 sm:mt-6 text-slate-400 text-sm sm:text-lg max-w-xl mx-auto px-2">
            The free, all-in-one gym management platform. QR code check-ins, workout tracking, AI-powered diet plans, real-time analytics, streak gamification, and a branded member portal &mdash; everything your gym needs to thrive.
          </p>
          <div data-hero-line-2 className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-brand-cyan-500 hover:bg-brand-cyan-600 w-full sm:w-auto px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-cyan-500/25"
            >
              Get Started Free
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Request a Demo
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="relative bg-[#0B1120] py-10 sm:py-16 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 data-trust-heading className="text-center text-lg sm:text-2xl font-bold text-white mb-6 sm:mb-10">
            Trusted by gym owners across the country
          </h2>
          <div data-trust-logos className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center items-center gap-6 sm:gap-16">
            {[
              { name: 'FitZone', value: '1,000+', label: 'Active members managed' },
              { name: 'Iron Temple', value: '25K+', label: 'QR check-ins tracked' },
              { name: 'CrossFit Hub', value: '100+', label: 'Gyms & studios onboarded' },
              { name: 'Flex Studio', value: '99.9%', label: 'Platform uptime' },
            ].map((stat) => (
              <div key={stat.name} className="text-center">
                <p className="text-2xl font-bold text-brand-cyan-400">{stat.value}</p>
                <p className="text-slate-500 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section className="relative bg-[#0B1120] py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div data-support-left>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                How Inkuity powers your gym
              </h2>
              <p className="mt-4 sm:mt-6 text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg">
                From signup to your first member check-in, Inkuity streamlines every aspect of gym
                management so you can focus on what matters &mdash; your members.
              </p>
              <div className="mt-6 sm:mt-10 flex flex-wrap gap-6 sm:gap-8">
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-brand-cyan-400 text-sm font-medium">4.9 / 5 rating</p>
                  <p className="text-slate-500 text-sm">Gym Owner Satisfaction</p>
                </div>
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-brand-cyan-400 text-sm font-medium">4.8 / 5 rating</p>
                  <p className="text-slate-500 text-sm">Ease of Use</p>
                </div>
              </div>
            </div>

            <div data-support-right className="space-y-8">
              {[
                {
                  icon: QrCode,
                  title: 'QR Code Check-In',
                  description:
                    'Generate a unique QR code for your gym. Members scan it to check in instantly — no apps required, just a phone camera.',
                },
                {
                  icon: BarChart3,
                  title: 'Real-Time Analytics',
                  description: 'Track check-in trends, peak hours, and member engagement with a beautiful analytics dashboard.',
                },
                {
                  icon: Users,
                  title: 'Member Management',
                  description:
                    'Manage member profiles, track attendance history, and monitor membership status all from one place.',
                },
              ].map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="flex gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-cyan-500/15 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-brand-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-cyan-400">{feature.title}</h3>
                      <p className="mt-1 text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="relative bg-[#0B1120] py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div data-features-heading className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6 mb-8 sm:mb-16">
            <h2 className="text-xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight italic">
              Features built for gym owners
            </h2>
            <div className="max-w-md">
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Everything you need to run a modern gym — from check-ins to analytics, all designed with simplicity in mind.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-brand-cyan-500 hover:bg-brand-cyan-600 px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-cyan-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 - QR Check-In */}
            <div data-feature-card className="rounded-2xl bg-gradient-to-br from-[#0e1a2e] to-[#111d32] border border-white/5 p-5 sm:p-6 min-h-0 sm:min-h-[280px] relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <div className="h-8 w-8 bg-brand-cyan-400/20 rounded-full flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-brand-cyan-400" />
                </div>
              </div>
              <div className="mt-10 sm:mt-12 space-y-3">
                <h3 className="text-white font-semibold text-lg">Instant QR Check-In</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Members scan your unique QR code to check in. No app downloads, no waiting. Just scan and go.
                </p>
                <div className="pt-4 flex items-center gap-3">
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    <QrCode className="h-10 w-10 text-brand-cyan-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2 w-full bg-brand-cyan-400/20 rounded-full" />
                    <div className="h-2 w-3/4 bg-white/5 rounded-full" />
                    <div className="h-2 w-1/2 bg-white/5 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 - Member's Page */}
            <div data-feature-card className="rounded-2xl bg-gradient-to-br from-[#0e1a2e] to-[#111d32] border border-white/5 p-5 sm:p-6 min-h-0 sm:min-h-[280px] relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <div className="h-8 w-8 bg-brand-purple-400/20 rounded-full flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-brand-purple-400" />
                </div>
              </div>
              <div className="mt-10 sm:mt-12 space-y-3">
                <h3 className="text-white font-semibold text-lg">Member&apos;s Page</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Each gym gets a branded portal where members can view their check-in history, streaks, and membership details.
                </p>
                <div className="pt-4">
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-brand-purple-400/30" />
                      <div className="h-2 w-20 bg-white/10 rounded" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['12', '5', '3'].map((v, i) => (
                        <div key={i} className="rounded bg-white/5 p-2 text-center">
                          <p className="text-white text-xs font-bold">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 - Analytics */}
            <div data-feature-card className="rounded-2xl bg-gradient-to-br from-[#0e1a2e] to-[#111d32] border border-white/5 p-5 sm:p-6 min-h-0 sm:min-h-[280px] relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <div className="h-8 w-8 bg-emerald-400/20 rounded-full flex items-center justify-center">
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <div className="mt-10 sm:mt-12 space-y-3">
                <h3 className="text-white font-semibold text-lg">Analytics Dashboard</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Visualize check-in patterns, peak hours, and growth trends. Make data-driven decisions for your gym.
                </p>
                <div className="pt-4">
                  <div className="flex items-end gap-1 h-16">
                    {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85].map((h, i) => (
                      <div key={i} className="flex-1 bg-brand-cyan-500/30 rounded-t transition-all group-hover:bg-brand-cyan-500/50" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature labels */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 sm:mt-10">
            {[
              { icon: Shield, title: 'Secure & Private', desc: 'Your data is encrypted and never shared with third parties' },
              { icon: Zap, title: 'Instant Setup', desc: 'Create your gym profile and QR code in under 2 minutes' },
              { icon: Calendar, title: 'Attendance Tracking', desc: 'Automatic check-in logging with full history and streaks' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} data-feature-label className="text-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan-500/15 mb-3">
                    <Icon className="h-5 w-5 text-brand-cyan-400" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== MEMBER EXPERIENCE SECTION ===== */}
      <section className="relative bg-[#0B1120] py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <h2 data-animate className="text-xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-3 sm:mb-4">
              More than check-ins &mdash; a complete fitness experience for members
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Inkuity goes beyond gym management. Every member gets a personalized fitness portal with workout tracking, nutrition planning, progress analytics, and gamified streaks &mdash; keeping them engaged and coming back.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: '\uD83D\uDCAA',
                title: 'Workout Routines & Session Logging',
                desc: 'Members create custom workout routines, log exercise sets with weight and reps, and track every session in real time. Complete exercise library with 100+ exercises across all muscle groups.',
              },
              {
                icon: '\uD83E\uDD57',
                title: 'AI-Powered Diet & Nutrition Planner',
                desc: 'An intelligent diet wizard generates personalized meal plans based on fitness goals, body metrics, dietary preferences, and activity levels. Built-in food logger tracks daily macros against targets.',
              },
              {
                icon: '\uD83D\uDD25',
                title: 'Streak Gamification & Consistency',
                desc: 'Daily check-in streaks gamify gym attendance. Members see their current streak, calendar heatmaps, and consistency stats — driving retention through habit formation.',
              },
              {
                icon: '\uD83C\uDFC6',
                title: 'Personal Records Tracker',
                desc: 'Members log and track personal bests for every exercise. PR history with dates, weights, and reps provides clear evidence of progress over time.',
              },
              {
                icon: '\uD83D\uDCCA',
                title: 'Smart Workout Suggestions',
                desc: 'AI analyzes training patterns and suggests which muscle groups haven\'t been worked recently. Color-coded severity alerts help members maintain balanced training.',
              },
              {
                icon: '\uD83E\uDD1D',
                title: 'Referral Program & Reviews',
                desc: 'Built-in referral system lets members share unique codes and earn rewards. A review system helps gyms build social proof and attract new members organically.',
              },
            ].map((feature) => (
              <div key={feature.title} data-animate className="rounded-2xl bg-[#111827] border border-white/5 p-4 sm:p-6 hover:-translate-y-1 transition-transform duration-300">
                <span className="text-xl sm:text-2xl">{feature.icon}</span>
                <h3 className="text-white font-semibold text-sm sm:text-base mt-2 sm:mt-3 mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BENEFITS SECTION ===== */}
      <section className="relative bg-[#0B1120] py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div data-benefits-heading>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-6 sm:mb-8">
                Why gym owners choose Inkuity
              </h2>
              <div className="space-y-5">
                {[
                  'Free to get started, no credit card required',
                  'QR code check-in with zero setup for members',
                  'Real-time analytics and member insights',
                  'Branded member\'s page for your gym',
                  'Email notifications for check-ins and alerts',
                ].map((item) => (
                  <div key={item} data-benefit-item className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-cyan-500 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-white font-medium text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Dashboard mockup */}
            <div data-benefits-mockup className="relative mt-4 lg:mt-0">
              <div className="rounded-2xl bg-[#111827] border border-white/10 p-4 sm:p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-brand-cyan-400 to-brand-purple-400" />
                  <div>
                    <p className="text-white text-xs sm:text-sm font-semibold">Your Gym Dashboard</p>
                    <p className="text-brand-cyan-400 text-[10px] sm:text-xs">Live Overview</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {[
                    { value: '142', label: 'Members' },
                    { value: '38', label: 'Today' },
                    { value: '94%', label: 'Retention' },
                    { value: '12', label: 'Streak' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#1a2332] rounded-lg p-2 sm:p-3 text-center">
                      <p className="text-white font-bold text-sm sm:text-lg">{stat.value}</p>
                      <p className="text-slate-500 text-[9px] sm:text-[10px] mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="bg-[#1a2332] rounded-lg p-3 sm:p-4">
                    <p className="text-slate-400 text-[10px] sm:text-xs mb-2 sm:mb-3">Check-In Trends</p>
                    <div className="flex items-end gap-0.5 sm:gap-1 h-12 sm:h-16">
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75].map((h, i) => (
                        <div key={i} className="flex-1 bg-brand-cyan-500/30 rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#1a2332] rounded-lg p-3 sm:p-4">
                    <p className="text-slate-400 text-[10px] sm:text-xs mb-2 sm:mb-3">Peak Hours</p>
                    <div className="flex justify-center">
                      <div className="relative h-12 w-12 sm:h-16 sm:w-16">
                        <div className="absolute inset-0 rounded-full border-[6px] sm:border-[8px] border-brand-cyan-400" />
                        <div className="absolute inset-0 rounded-full border-[6px] sm:border-[8px] border-brand-purple-500" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block absolute -top-4 -right-4 bg-[#1a2332] border border-white/10 rounded-xl p-3 shadow-xl">
                  <p className="text-slate-400 text-[10px]">This Week</p>
                  <p className="text-white font-bold text-sm">+23%</p>
                  <TrendingUp className="h-3 w-3 text-emerald-400 mt-1" />
                </div>
              </div>
              <div className="hidden sm:flex absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl px-5 py-3 shadow-xl items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-slate-800 text-xs font-medium">Member Check-In Successful</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section id="pricing" className="relative bg-[#0B1120] py-12 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 data-pricing-heading className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-slate-400 text-sm mb-12 max-w-md mx-auto">
            Start for free. No hidden fees, no credit card required.
          </p>

          {/* Pricing Card */}
          <div data-pricing-card className="max-w-sm mx-auto">
            <div className="rounded-2xl bg-[#111827] border border-white/10 p-6 sm:p-8 shadow-2xl relative">
              <span className="inline-block bg-brand-cyan-500/20 text-brand-cyan-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                Currently Free
              </span>
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <p className="text-slate-400 text-sm mb-6">
                Everything you need to manage<br />your gym effectively
              </p>
              <div className="text-4xl font-bold text-white mb-6">&#8377;0<span className="text-lg text-slate-500 font-normal">/month</span></div>

              <div className="space-y-3 text-left mb-8">
                {[
                  'Unlimited member check-ins',
                  'QR code generation',
                  'Analytics dashboard',
                  'Member management',
                  'Email notifications',
                  'Branded member\'s page',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-brand-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="block w-full rounded-lg bg-brand-cyan-500 hover:bg-brand-cyan-600 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-brand-cyan-500/25 text-center"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          {/* Additional features */}
          <div className="mt-8 sm:mt-12 flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-4">
            {[
              { icon: Shield, text: 'Secure & Encrypted' },
              { icon: Zap, text: '2-Minute Setup' },
              { icon: Award, text: 'No Credit Card' },
              { icon: Calendar, text: 'Attendance History' },
              { icon: Users, text: 'Unlimited Members' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.text} className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-xs sm:text-sm">
                  <Icon className="h-4 w-4 text-brand-cyan-400" />
                  <span>{item.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <section className="relative bg-[#0B1120] py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 data-testimonial-left className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              What gym owners are saying
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Hear from real gym owners who use Inkuity to manage their business every day.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {testimonials.map((t) => (
              <div key={t.name} data-testimonial-left className="rounded-2xl bg-[#111827] border border-white/5 p-4 sm:p-6 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-white text-sm font-bold`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== USE CASES SECTION ===== */}
      <section className="relative bg-[#0B1120] py-10 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 data-animate className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-6">
            Built for every fitness business
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-3xl mx-auto mb-6 sm:mb-8">
            Whether you run a neighborhood gym, a boutique fitness studio, a CrossFit box, a yoga studio, a martial arts dojo, or a personal training facility &mdash; Inkuity adapts to your business. Our platform handles member check-ins, attendance analytics, workout programming, nutrition planning, and member engagement so you can focus on coaching and growing your community.
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {['Gyms', 'Fitness Studios', 'CrossFit Boxes', 'Yoga Studios', 'Martial Arts', 'Personal Training', 'Sports Clubs', 'Wellness Centers'].map((type) => (
              <span key={type} className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] sm:text-xs font-medium">
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section id="faq" className="relative bg-[#0B1120] py-12 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 data-faq-heading className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-sm">
              Got questions? We&apos;ve got answers. Can&apos;t find what you&apos;re looking for?{' '}
              <a href="#contact" className="text-brand-cyan-400 hover:underline">Contact us</a>.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-xl bg-[#111827] border border-white/5 overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-white hover:bg-white/[0.02] transition-colors list-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-2 sm:ml-4" />
                </summary>
                <div className="px-4 sm:px-6 pb-3 sm:pb-4 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT + DEMO FORM ===== */}
      <section id="contact" className="relative bg-[#0B1120] py-10 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Left - Contact Info */}
            <div data-testimonial-left>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                Get in touch
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md">
                Interested in seeing how Inkuity can help your gym? Request a demo or reach out to us directly.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-cyan-500/15 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-brand-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Email Us</h3>
                    <a href="mailto:contact@inkuity.com" className="text-brand-cyan-400 text-sm hover:underline">
                      contact@inkuity.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-cyan-500/15 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-brand-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Quick Response</h3>
                    <p className="text-slate-400 text-sm">We typically respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-cyan-500/15 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-brand-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">No Spam</h3>
                    <p className="text-slate-400 text-sm">We respect your inbox. No unsolicited emails, ever.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Demo Form */}
            <div data-testimonial-right>
              <DemoRequestForm />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer data-footer className="relative bg-[#0B1120] pt-10 sm:pt-16 pb-8 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-12 mb-8 sm:mb-12">
            {/* Brand */}
            <div data-footer-col className="col-span-2 sm:col-span-1 lg:col-span-1">
              <div className="flex items-center gap-1.5 mb-3">
                <img src="/logo.png" alt="Inkuity" className="h-7 sm:h-8 w-auto" />
                <span className="text-base sm:text-lg font-bold text-foreground">Inkuity</span>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                The complete gym management platform. You build the business, we build the system.
              </p>
              <a
                href="mailto:contact@inkuity.com"
                className="text-brand-cyan-400 text-sm hover:underline"
              >
                contact@inkuity.com
              </a>
            </div>

            {/* Product */}
            <div data-footer-col>
              <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-slate-400 text-sm hover:text-white transition-colors">Features</a>
                </li>
                <li>
                  <a href="#pricing" className="text-slate-400 text-sm hover:text-white transition-colors">Pricing</a>
                </li>
                <li>
                  <a href="#faq" className="text-slate-400 text-sm hover:text-white transition-colors">FAQ</a>
                </li>
                <li>
                  <Link href="/register" className="text-slate-400 text-sm hover:text-white transition-colors">Get Started</Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div data-footer-col>
              <h4 className="font-semibold text-white mb-4 text-sm">Support</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#contact" className="text-slate-400 text-sm hover:text-white transition-colors">Contact Us</a>
                </li>
                <li>
                  <a href="#contact" className="text-slate-400 text-sm hover:text-white transition-colors">Request a Demo</a>
                </li>
                <li>
                  <a href="mailto:contact@inkuity.com" className="text-slate-400 text-sm hover:text-white transition-colors">Email Support</a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div data-footer-col>
              <h4 className="font-semibold text-white mb-4 text-sm">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/terms" className="text-slate-400 text-sm hover:text-white transition-colors">Terms and Conditions</Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-slate-400 text-sm hover:text-white transition-colors">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Inkuity Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-slate-400 text-sm hover:text-white transition-colors">Terms and Conditions</Link>
              <span className="text-slate-600">&middot;</span>
              <Link href="/privacy" className="text-slate-400 text-sm hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
