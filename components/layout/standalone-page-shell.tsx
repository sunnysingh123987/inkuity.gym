import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

interface StandalonePageShellProps {
  children: React.ReactNode
  className?: string
}

export function StandalonePageShell({ children, className = '' }: StandalonePageShellProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-b from-background to-background flex flex-col ${className}`}>
      <header className="flex-shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo href="/" size="lg" />
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-brand-cyan-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-cyan-600"
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
