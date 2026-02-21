'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      style={{ zIndex: 60 }}
      toastOptions={{
        style: {
          background: 'hsl(217 33% 10%)',
          color: 'hsl(210 40% 98%)',
          border: '1px solid hsl(217 33% 18%)',
        },
        className: 'rounded-xl shadow-lg',
      }}
    />
  )
}
