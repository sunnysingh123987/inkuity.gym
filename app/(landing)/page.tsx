import Link from 'next/link'
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

export const metadata = {
  title: 'Inkuity - Complete Gym Management Platform',
  description:
    'You build the business, we build the system. Complete gym management platform for modern fitness businesses.',
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
      'Setting up was incredibly easy. Within minutes we had our gym profile, QR codes, and member portal ready. The onboarding wizard made it effortless.',
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
    q: 'What is Inkuity?',
    a: 'Inkuity is a complete gym management platform that helps gym owners manage members, track check-ins via QR codes, view analytics, and run their business more efficiently.',
  },
  {
    q: 'How does QR code check-in work?',
    a: 'When you set up your gym on Inkuity, a unique QR code is generated automatically. Members scan the QR code at your gym entrance, enter their details, and check in instantly. You can see all check-ins in real time from your dashboard.',
  },
  {
    q: 'Is Inkuity free to use?',
    a: 'Yes! Inkuity is currently free for all gym owners. We believe in building trust first. Premium features may be introduced in the future, but the core platform will always have a free tier.',
  },
  {
    q: 'Can I manage multiple locations?',
    a: 'Currently, each Inkuity account supports one gym location. Multi-location support is on our roadmap and will be available soon.',
  },
  {
    q: 'How do I get started?',
    a: 'Simply click "Get Started", create your account, verify your email, and our onboarding wizard will guide you through setting up your gym profile and QR code in under 2 minutes.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We use industry-standard encryption, secure database storage (Supabase), and follow best practices for data protection. Your member data is never sold to third parties.',
  },
  {
    q: 'Can I contact support?',
    a: 'Yes! Reach us anytime at contact@inkuity.com. You can also use the "Request a Demo" form on this page to get in touch.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] antialiased text-white">
      <LandingNav />
      <LandingAnimations />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120] via-[#0a0f1a] to-[#0B1120]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(15,25,50,0.8),transparent)]" />
        <div className="absolute top-0 left-1/4 w-1 h-[60%] bg-gradient-to-b from-white/5 to-transparent rotate-[15deg] blur-sm" />
        <div className="absolute top-0 right-1/3 w-1 h-[50%] bg-gradient-to-b from-white/3 to-transparent rotate-[-10deg] blur-sm" />
        <div className="absolute top-0 left-1/2 w-[2px] h-[70%] bg-gradient-to-b from-white/4 to-transparent rotate-[5deg] blur-[2px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[400px] bg-gradient-to-t from-[#0B1120] via-[#0B1120]/80 to-transparent rounded-t-full blur-[1px]" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-brand-pink-500/3 rounded-full blur-[80px]" />

        <div className="relative z-10 text-center px-4 sm:px-6">
          <h1 data-hero-title className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wider uppercase leading-tight">
            <span data-hero-line-1 className="block text-white">You Build The Business</span>
            <span data-hero-line-2 className="block text-white mt-2">We Build The System</span>
          </h1>
          <p data-hero-line-2 className="mt-6 text-slate-400 text-lg max-w-xl mx-auto">
            The complete gym management platform. QR check-ins, member tracking, analytics &mdash; all in one place.
          </p>
          <div data-hero-line-2 className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-brand-cyan-500 hover:bg-brand-cyan-600 px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-cyan-500/25"
            >
              Get Started Free
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Request a Demo
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="relative bg-[#0B1120] py-16 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 data-trust-heading className="text-center text-xl sm:text-2xl font-bold text-white mb-10">
            Trusted by gym owners across the country
          </h2>
          <div data-trust-logos className="flex flex-wrap justify-center items-center gap-10 sm:gap-16">
            {[
              { name: 'FitZone', value: '500+', label: 'Members managed' },
              { name: 'Iron Temple', value: '10K+', label: 'Check-ins tracked' },
              { name: 'CrossFit Hub', value: '50+', label: 'Gyms onboarded' },
              { name: 'Flex Studio', value: '99.9%', label: 'Uptime' },
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
      <section className="relative bg-[#0B1120] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div data-support-left>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                How Inkuity powers<br />your gym
              </h2>
              <p className="mt-6 text-slate-400 leading-relaxed max-w-lg">
                From signup to your first member check-in, Inkuity streamlines every aspect of gym
                management so you can focus on what matters &mdash; your members.
              </p>
              <div className="mt-10 flex flex-wrap gap-8">
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
      <section id="features" className="relative bg-[#0B1120] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div data-features-heading className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight italic">
              Features built<br />for gym owners
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
            <div data-feature-card className="rounded-2xl bg-gradient-to-br from-[#0e1a2e] to-[#111d32] border border-white/5 p-6 min-h-[280px] relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <div className="h-8 w-8 bg-brand-cyan-400/20 rounded-full flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-brand-cyan-400" />
                </div>
              </div>
              <div className="mt-12 space-y-3">
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

            {/* Card 2 - Member Portal */}
            <div data-feature-card className="rounded-2xl bg-gradient-to-br from-[#0e1a2e] to-[#111d32] border border-white/5 p-6 min-h-[280px] relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <div className="h-8 w-8 bg-brand-purple-400/20 rounded-full flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-brand-purple-400" />
                </div>
              </div>
              <div className="mt-12 space-y-3">
                <h3 className="text-white font-semibold text-lg">Member Portal</h3>
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
            <div data-feature-card className="rounded-2xl bg-gradient-to-br from-[#0e1a2e] to-[#111d32] border border-white/5 p-6 min-h-[280px] relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <div className="h-8 w-8 bg-emerald-400/20 rounded-full flex items-center justify-center">
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <div className="mt-12 space-y-3">
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
          <div className="grid md:grid-cols-3 gap-6 mt-10">
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

      {/* ===== BENEFITS SECTION ===== */}
      <section className="relative bg-[#0B1120] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div data-benefits-heading>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-8">
                Why gym owners<br />choose Inkuity
              </h2>
              <div className="space-y-5">
                {[
                  'Free to get started, no credit card required',
                  'QR code check-in with zero setup for members',
                  'Real-time analytics and member insights',
                  'Branded member portal for your gym',
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
            <div data-benefits-mockup className="relative">
              <div className="rounded-2xl bg-[#111827] border border-white/10 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-cyan-400 to-brand-purple-400" />
                  <div>
                    <p className="text-white text-sm font-semibold">Your Gym Dashboard</p>
                    <p className="text-brand-cyan-400 text-xs">Live Overview</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { value: '142', label: 'Members' },
                    { value: '38', label: 'Today' },
                    { value: '94%', label: 'Retention' },
                    { value: '12', label: 'Streak' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#1a2332] rounded-lg p-3 text-center">
                      <p className="text-white font-bold text-lg">{stat.value}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1a2332] rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-3">Check-In Trends</p>
                    <div className="flex items-end gap-1 h-16">
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75].map((h, i) => (
                        <div key={i} className="flex-1 bg-brand-cyan-500/30 rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#1a2332] rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-3">Peak Hours</p>
                    <div className="flex justify-center">
                      <div className="relative h-16 w-16">
                        <div className="absolute inset-0 rounded-full border-[8px] border-brand-cyan-400" />
                        <div className="absolute inset-0 rounded-full border-[8px] border-brand-purple-500" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-[#1a2332] border border-white/10 rounded-xl p-3 shadow-xl">
                  <p className="text-slate-400 text-[10px]">This Week</p>
                  <p className="text-white font-bold text-sm">+23%</p>
                  <TrendingUp className="h-3 w-3 text-emerald-400 mt-1" />
                </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl px-5 py-3 shadow-xl flex items-center gap-2">
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
      <section id="pricing" className="relative bg-[#0B1120] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 data-pricing-heading className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-slate-400 text-sm mb-12 max-w-md mx-auto">
            Start for free. No hidden fees, no credit card required.
          </p>

          {/* Pricing Card */}
          <div data-pricing-card className="max-w-sm mx-auto">
            <div className="rounded-2xl bg-[#111827] border border-white/10 p-8 shadow-2xl relative">
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
                  'Branded member portal',
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
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {[
              { icon: Shield, text: 'Secure & Encrypted' },
              { icon: Zap, text: '2-Minute Setup' },
              { icon: Award, text: 'No Credit Card' },
              { icon: Calendar, text: 'Attendance History' },
              { icon: Users, text: 'Unlimited Members' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.text} className="flex items-center gap-2 text-slate-400 text-sm">
                  <Icon className="h-4 w-4 text-brand-cyan-400" />
                  <span>{item.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <section className="relative bg-[#0B1120] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 data-testimonial-left className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
              What gym owners are saying
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Hear from real gym owners who use Inkuity to manage their business every day.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} data-testimonial-left className="rounded-2xl bg-[#111827] border border-white/5 p-6 hover:-translate-y-1 transition-transform duration-300">
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

      {/* ===== FAQ SECTION ===== */}
      <section id="faq" className="relative bg-[#0B1120] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 data-faq-heading className="text-3xl sm:text-4xl font-bold text-white mb-4">
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
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-white hover:bg-white/[0.02] transition-colors list-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT + DEMO FORM ===== */}
      <section id="contact" className="relative bg-[#0B1120] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left - Contact Info */}
            <div data-testimonial-left>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
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
      <footer data-footer className="relative bg-[#0B1120] pt-16 pb-8 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div data-footer-col className="lg:col-span-1">
              <div className="flex items-center gap-1.5 mb-3">
                <img src="/logo.png" alt="Inkuity" className="h-8 w-auto" />
                <span className="text-lg font-bold text-foreground">Inkuity</span>
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
