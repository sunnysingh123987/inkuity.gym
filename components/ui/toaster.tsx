'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'white',
          color: '#1f2937',
          border: '1px solid #e5e7eb',
        },
        className: 'rounded-xl shadow-lg',
      }}
    />
  )
}
