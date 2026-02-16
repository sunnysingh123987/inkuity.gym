import Link from 'next/link'
import { QrCode } from 'lucide-react'

interface StandalonePageShellProps {
  children: React.ReactNode
  className?: string
}

export function StandalonePageShell({ children, className = '' }: StandalonePageShellProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/80 flex flex-col ${className}`}>
      <header className="flex-shrink-0 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Inkuity</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
