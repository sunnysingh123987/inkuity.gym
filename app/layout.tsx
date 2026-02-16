import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Inkuity - Gym QR Code Analytics Platform',
  description: 'Generate QR codes for your gym and track member analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={plusJakarta.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
