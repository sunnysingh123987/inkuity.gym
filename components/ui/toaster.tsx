'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration: number
  createdAt: number
}

/* ------------------------------------------------------------------ */
/*  Global toast store (replaces sonner's toast())                     */
/* ------------------------------------------------------------------ */
let listeners: Array<(toasts: ToastItem[]) => void> = []
let toastQueue: ToastItem[] = []
let idCounter = 0

function notify() {
  for (const l of listeners) l([...toastQueue])
}

function addToast(type: ToastType, message: string, duration = 3500) {
  const id = `toast-${++idCounter}-${Date.now()}`
  toastQueue = [...toastQueue, { id, type, message, duration, createdAt: Date.now() }]
  notify()
}

function removeToast(id: string) {
  toastQueue = toastQueue.filter((t) => t.id !== id)
  notify()
}

/** Public API — drop-in replacement for sonner's toast */
export const toast = {
  success: (msg: string, opts?: { duration?: number }) => addToast('success', msg, opts?.duration),
  error: (msg: string, opts?: { duration?: number }) => addToast('error', msg, opts?.duration),
  info: (msg: string, opts?: { duration?: number }) => addToast('info', msg, opts?.duration),
  warning: (msg: string, opts?: { duration?: number }) => addToast('warning', msg, opts?.duration),
}

/* ------------------------------------------------------------------ */
/*  Animated icons                                                     */
/* ------------------------------------------------------------------ */
function SuccessIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="2"
        className="animate-toast-circle"
        style={{ strokeDasharray: 63, strokeDashoffset: 63 }}
      />
      <path
        d="M8 12.5l2.5 2.5 5.5-5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-toast-check"
        style={{ strokeDasharray: 14, strokeDashoffset: 14 }}
      />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] animate-toast-shake" fill="none">
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="2"
        className="animate-toast-circle"
        style={{ strokeDasharray: 63, strokeDashoffset: 63 }}
      />
      <path
        d="M15 9l-6 6M9 9l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-toast-x"
        style={{ strokeDasharray: 8.5, strokeDashoffset: 8.5 }}
      />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="2"
        className="animate-toast-circle"
        style={{ strokeDasharray: 63, strokeDashoffset: 63 }}
      />
      <path
        d="M12 8v0M12 12v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-toast-info-line"
        style={{ opacity: 0 }}
      />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        className="animate-toast-circle"
        style={{ strokeDasharray: 52, strokeDashoffset: 52 }}
      />
      <path
        d="M12 9v4M12 17v0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-toast-info-line"
        style={{ opacity: 0 }}
      />
    </svg>
  )
}

const iconMap: Record<ToastType, () => JSX.Element> = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
  warning: WarningIcon,
}

const colorMap: Record<ToastType, { text: string; border: string; glow: string }> = {
  success: {
    text: 'text-emerald-400',
    border: 'rgba(52, 211, 153, 0.5)',
    glow: 'rgba(52, 211, 153, 0.08)',
  },
  error: {
    text: 'text-red-400',
    border: 'rgba(248, 113, 113, 0.5)',
    glow: 'rgba(248, 113, 113, 0.08)',
  },
  info: {
    text: 'text-cyan-400',
    border: 'rgba(6, 182, 212, 0.5)',
    glow: 'rgba(6, 182, 212, 0.08)',
  },
  warning: {
    text: 'text-amber-400',
    border: 'rgba(251, 191, 36, 0.5)',
    glow: 'rgba(251, 191, 36, 0.08)',
  },
}

/* ------------------------------------------------------------------ */
/*  Single toast component                                             */
/* ------------------------------------------------------------------ */
function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [state, setState] = useState<'entering' | 'visible' | 'exiting'>('entering')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const colors = colorMap[item.type]
  const Icon = iconMap[item.type]

  useEffect(() => {
    // Enter
    requestAnimationFrame(() => setState('visible'))
    // Auto-dismiss
    timerRef.current = setTimeout(() => {
      setState('exiting')
      setTimeout(() => onDismiss(item.id), 350)
    }, item.duration)
    return () => clearTimeout(timerRef.current)
  }, [item.id, item.duration, onDismiss])

  const handleClick = () => {
    clearTimeout(timerRef.current)
    setState('exiting')
    setTimeout(() => onDismiss(item.id), 350)
  }

  return (
    <div
      onClick={handleClick}
      className={`
        relative cursor-pointer select-none
        transition-all duration-350 ease-out
        ${state === 'entering' ? 'opacity-0 -translate-y-3 scale-95' : ''}
        ${state === 'visible' ? 'opacity-100 translate-y-0 scale-100' : ''}
        ${state === 'exiting' ? 'opacity-0 -translate-y-2 scale-95' : ''}
      `}
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Glass container */}
      <div
        className="relative overflow-hidden rounded-2xl px-4 py-3 flex items-center gap-3 min-w-[260px] max-w-[380px]"
        style={{
          background: 'rgba(10, 15, 30, 0.82)',
          backdropFilter: 'blur(32px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 20px ${colors.glow}`,
        }}
      >
        {/* Animated border outline — countdown */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <rect
            x="1" y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx="16" ry="16"
            fill="none"
            stroke={colors.border}
            strokeWidth="1.5"
            className="animate-toast-border"
            style={{
              animationDuration: `${item.duration}ms`,
            }}
          />
        </svg>

        {/* Icon */}
        <div className={`relative z-10 flex-shrink-0 ${colors.text}`}>
          <Icon />
        </div>

        {/* Message */}
        <p className="relative z-10 text-sm font-medium text-white/90 leading-snug">
          {item.message}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Toaster container                                                  */
/* ------------------------------------------------------------------ */
export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    listeners.push(setToasts)
    return () => {
      listeners = listeners.filter((l) => l !== setToasts)
    }
  }, [])

  const handleDismiss = useCallback((id: string) => {
    removeToast(id)
  }, [])

  if (!mounted || toasts.length === 0) return null

  return createPortal(
    <div
      className="fixed top-0 left-0 right-0 z-[99999] flex flex-col items-center gap-2.5 pt-[max(env(safe-area-inset-top),12px)] px-4 pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard item={t} onDismiss={handleDismiss} />
        </div>
      ))}
    </div>,
    document.body
  )
}
