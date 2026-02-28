'use client'

import { Logo } from '@/components/ui/logo'
import { NotificationsDropdown } from '@/components/dashboard/notifications-dropdown'
import type { Notification } from '@/types/database'

interface HeaderProps {
  notifications?: Notification[]
  unreadCount?: number
  userId?: string
}

export function Header({ notifications = [], unreadCount = 0, userId = '' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 lg:static">
      <div className="flex h-16 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        {/* Mobile logo */}
        <div className="flex flex-1 items-center gap-x-4 lg:gap-x-6">
          <div className="lg:hidden">
            <Logo href="/dashboard" />
          </div>

          <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
            <NotificationsDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              userId={userId}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
