'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestDemo } from '@/lib/actions/contact'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'

export function DemoRequestForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await requestDemo({ name: name.trim(), email: email.trim(), message: message.trim() })

      if (!result.success) {
        setError(result.error || 'Something went wrong.')
        return
      }

      setSuccess(true)
      setName('')
      setEmail('')
      setMessage('')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-[#1a2332]/80 border border-white/10 p-8 backdrop-blur-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 mb-4">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Request Sent!</h3>
        <p className="text-slate-400 text-sm mb-6">
          Thank you for your interest. We&apos;ll get back to you within 24 hours.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-brand-cyan-400 text-sm font-medium hover:underline"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-[#1a2332]/80 border border-white/10 p-8 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-8 rounded-full bg-brand-cyan-500/20 flex items-center justify-center">
          <Send className="h-4 w-4 text-brand-cyan-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Request a Demo</h3>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full rounded-lg bg-[#111827] border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan-500/50 focus:border-brand-cyan-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg bg-[#111827] border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan-500/50 focus:border-brand-cyan-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Message</label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your gym and what you're looking for..."
            required
            className="w-full rounded-lg bg-[#111827] border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan-500/50 focus:border-brand-cyan-500/50 transition-colors resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-cyan-500 hover:bg-brand-cyan-600 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-brand-cyan-500/25 disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </span>
          ) : (
            'Request Demo'
          )}
        </button>
        <p className="text-center text-slate-400 text-sm">
          or{' '}
          <Link href="/register" className="text-white underline underline-offset-2 hover:text-brand-cyan-400 transition-colors">
            Get Started Now
          </Link>
        </p>
      </form>
    </div>
  )
}
