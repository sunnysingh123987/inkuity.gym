'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { Menu, Bell, X, QrCode, LogOut } from 'lucide-react'
import { Sidebar } from './sidebar'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Gyms', href: '/gyms' },
  { name: 'QR Codes', href: '/qr-codes' },
  { name: 'Members', href: '/members' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Settings', href: '/settings' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error.message)
        return
      }
      setMobileMenuOpen(false)
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Unexpected logout error', err)
    }
  }

  return (
    <header className="sticky top-0 z-40 lg:static">
      <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <div className="lg:hidden flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Inkuity</span>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-gray-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs overflow-y-auto bg-white">
            <div className="flex h-full flex-col">
              {/* Close button at top */}
              <div className="flex items-center justify-between h-16 border-b border-gray-200 px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    Inkuity
                  </span>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 p-2.5 text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Sidebar content for mobile */}
              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      pathname === item.href ||
                        pathname.startsWith(item.href + '/')
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Sign Out button at bottom */}
              <div className="border-t border-gray-200 p-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
