import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  QrCode,
  BarChart3,
  Users,
  Shield,
  ArrowRight,
  Check,
  Sparkles,
  Dumbbell,
  Calendar,
  CreditCard,
  Smartphone,
  TrendingUp,
  Heart,
  Target,
  Zap,
  Star,
  Award,
} from 'lucide-react'

export const metadata = {
  title: 'Inkuity - Complete Gym Management Platform',
  description: 'Everything your gym needs. Manage memberships, track workouts, engage members, and grow your business - all in one powerful platform.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <img src="/logo.png" alt="Inkuity" className="h-8 w-auto" />
              <span className="text-xl font-bold tracking-tight text-slate-900">Inkuity</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Reviews</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                Sign in
              </Link>
              <Link href="/register">
                <Button className="rounded-xl bg-gradient-to-r from-brand-cyan-600 to-brand-pink-600 px-5 shadow-glow-cyan hover:shadow-glow-pink transition-all duration-300 hover:scale-105">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-cyan-50 via-white to-white">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.12),transparent)]" />
        <div className="absolute top-24 left-1/4 h-72 w-72 rounded-full bg-brand-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-brand-pink-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-cyan-200/60 bg-brand-cyan-50/80 px-4 py-1.5 text-sm font-medium text-brand-cyan-700">
                <Sparkles className="h-4 w-4" />
                Trusted by 500+ gyms worldwide
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Everything Your Gym Needs.{' '}
                <span className="bg-gradient-to-r from-brand-cyan-400 via-brand-purple-400 to-brand-pink-400 bg-clip-text text-transparent">
                  All in One Place.
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600 max-w-xl">
                Streamline memberships, automate scheduling, track workouts, manage nutrition plans, and grow your business with powerful analytics - all from one intuitive platform.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="gap-2 rounded-xl bg-gradient-to-r from-brand-cyan-600 to-brand-pink-600 px-8 py-6 text-base font-semibold shadow-glow-cyan hover:shadow-glow-pink transition-all duration-300 hover:scale-105"
                  >
                    Start Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl px-8 py-6 text-base font-semibold border-slate-300 hover:bg-slate-50"
                >
                  Watch Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-brand-cyan-400 to-brand-pink-400" />
                    ))}
                  </div>
                  <span className="text-sm text-slate-600">500+ gyms</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-sm text-slate-600">4.9/5 rating</span>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative lg:h-[500px] hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan-100 to-brand-pink-100 rounded-3xl shadow-2xl" />
              <div className="absolute inset-4 bg-white rounded-2xl shadow-inner flex items-center justify-center">
                <div className="text-center p-8">
                  <Dumbbell className="h-24 w-24 mx-auto text-brand-cyan-600 mb-4" />
                  <p className="text-slate-600 text-sm">Dashboard Preview</p>
                  <p className="text-xs text-slate-400 mt-2">Real gym management interface</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-slate-200/60 bg-slate-50/50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-500 mb-6">Trusted by leading fitness centers</p>
          <div className="flex justify-center items-center gap-12 flex-wrap opacity-60 grayscale">
            {['Fitness Pro', 'Elite Gym', 'Power House', 'Fit Zone', 'Gym Club'].map((name) => (
              <div key={name} className="text-lg font-bold text-slate-700">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Complete Gym Management Solution
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Everything you need to run a modern fitness business, from check-ins to workout tracking to member engagement
            </p>
          </div>

          {/* Primary Features */}
          <div className="mt-16 grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Smartphone,
                title: 'Member Portal & Mobile App',
                description: 'Give members their own branded portal to track workouts, nutrition, and progress.',
                gradient: 'from-brand-cyan-500 to-brand-cyan-500',
                color: 'brand-cyan',
              },
              {
                icon: QrCode,
                title: 'Smart QR Check-Ins',
                description: 'Contactless check-ins with instant notifications and attendance tracking.',
                gradient: 'from-brand-cyan-500 to-brand-cyan-600',
                color: 'brand-cyan',
              },
              {
                icon: Dumbbell,
                title: 'Workout Tracking',
                description: 'Create routines, log exercises, track PRs, and monitor member progress over time.',
                gradient: 'from-brand-pink-500 to-brand-pink-600',
                color: 'brand-pink',
              },
              {
                icon: Heart,
                title: 'Nutrition & Diet Plans',
                description: 'Build custom meal plans, track macros, and help members reach their goals.',
                gradient: 'from-brand-pink-500 to-brand-pink-600',
                color: 'brand-pink',
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Track attendance, retention, revenue, and member engagement with powerful dashboards.',
                gradient: 'from-brand-purple-500 to-brand-purple-600',
                color: 'brand-purple',
              },
              {
                icon: Users,
                title: 'Member Management',
                description: 'Complete CRM with profiles, memberships, billing, and communication tools.',
                gradient: 'from-brand-cyan-500 to-brand-cyan-600',
                color: 'brand-cyan',
              },
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/50 hover:border-brand-cyan-200/60"
                >
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Additional Features */}
          <div className="mt-16 rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-brand-cyan-50/30 p-8 sm:p-12">
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">Plus So Much More</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Calendar, text: 'Class Scheduling' },
                { icon: CreditCard, text: 'Payment Processing' },
                { icon: Target, text: 'Goal Setting' },
                { icon: TrendingUp, text: 'Performance Reports' },
                { icon: Shield, text: 'Secure & Private' },
                { icon: Zap, text: 'Automated Workflows' },
                { icon: Award, text: 'Achievements' },
                { icon: Users, text: 'Multi-Location' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan-600/10">
                      <Icon className="h-5 w-5 text-brand-cyan-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative bg-gradient-to-br from-brand-cyan-600 to-brand-pink-600 py-24 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Built for Gym Owners, Loved by Members
            </h2>
            <p className="mt-4 text-lg text-brand-cyan-100">
              Streamline your operations and deliver an exceptional member experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                stat: '3x',
                label: 'Faster Check-Ins',
                description: 'QR codes eliminate lines and paperwork',
              },
              {
                stat: '40%',
                label: 'Higher Retention',
                description: 'Engaged members stay longer',
              },
              {
                stat: '10hrs',
                label: 'Saved Per Week',
                description: 'Automate admin tasks',
              },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-5xl font-bold mb-2">{item.stat}</div>
                <div className="text-xl font-semibold mb-2">{item.label}</div>
                <div className="text-brand-cyan-100">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Loved by Gym Owners
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              See what fitness professionals are saying about Inkuity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Inkuity transformed how we manage our gym. The member portal alone has increased engagement by 60%.",
                author: "Sarah Johnson",
                role: "Owner, FitZone Gym",
                rating: 5,
              },
              {
                quote: "Finally, a platform that does it all. No more juggling 5 different apps. Everything in one place.",
                author: "Mike Chen",
                role: "Manager, PowerHouse Fitness",
                rating: 5,
              },
              {
                quote: "The workout tracking features are incredible. Our members love seeing their progress over time.",
                author: "Lisa Martinez",
                role: "Owner, Elite Training",
                rating: 5,
              },
            ].map((testimonial) => (
              <div key={testimonial.author} className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed mb-6">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-slate-900">{testimonial.author}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Start free and scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                features: [
                  '1 gym location',
                  'Up to 50 members',
                  'Basic QR check-ins',
                  '30 days analytics',
                  'Email support',
                ],
                cta: 'Get Started',
                popular: false,
              },
              {
                name: 'Professional',
                price: '$49',
                period: 'per month',
                features: [
                  'Up to 3 locations',
                  'Unlimited members',
                  'Full member portal',
                  'Workout & diet tracking',
                  '1 year analytics',
                  'Priority support',
                  'Custom branding',
                ],
                cta: 'Start Free Trial',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: '$149',
                period: 'per month',
                features: [
                  'Unlimited locations',
                  'Unlimited members',
                  'White-label solution',
                  'API access',
                  'Advanced analytics',
                  'Dedicated support',
                  'Custom integrations',
                ],
                cta: 'Contact Sales',
                popular: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-brand-purple-500 to-brand-pink-500 text-white shadow-2xl shadow-brand-purple-500/30 ring-2 ring-brand-purple-400/50 scale-105'
                    : 'border border-slate-200/60 bg-white shadow-sm hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-slate-900">
                    Most Popular
                  </div>
                )}
                <h3
                  className={`text-lg font-semibold ${
                    plan.popular ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span
                    className={`text-5xl font-bold ${
                      plan.popular ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`ml-2 ${
                      plan.popular ? 'text-brand-purple-100' : 'text-slate-500'
                    }`}
                  >
                    /{plan.period}
                  </span>
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`h-5 w-5 shrink-0 mt-0.5 ${
                          plan.popular ? 'text-brand-purple-100' : 'text-brand-cyan-500'
                        }`}
                      />
                      <span
                        className={
                          plan.popular ? 'text-brand-purple-50' : 'text-slate-600'
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="mt-8 block">
                  <Button
                    className={`w-full rounded-xl py-6 text-base font-semibold ${
                      plan.popular
                        ? 'bg-white text-brand-purple-600 shadow-lg hover:bg-brand-purple-50'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-cyan-600 via-brand-cyan-700 to-brand-pink-600 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_120%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            Ready to Transform Your Gym?
          </h2>
          <p className="mt-6 text-xl text-brand-cyan-100">
            Join 500+ gyms already growing their business with Inkuity. Start your free trial today.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="rounded-xl bg-white px-10 py-6 text-lg font-semibold text-brand-cyan-600 shadow-xl transition-all hover:bg-brand-cyan-50 hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl px-10 py-6 text-lg font-semibold border-2 border-white text-white hover:bg-white/10"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="mt-6 text-sm text-brand-cyan-100">
            ✓ No credit card required &nbsp;•&nbsp; ✓ 14-day free trial &nbsp;•&nbsp; ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-slate-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Inkuity" className="h-8 w-auto" />
                <span className="text-xl font-bold text-white">Inkuity</span>
              </div>
              <p className="text-slate-400 max-w-md">
                Complete gym management platform for modern fitness businesses. Streamline operations, engage members, and grow your revenue.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Inkuity. All rights reserved.
            </p>
            <div className="flex gap-6 text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
