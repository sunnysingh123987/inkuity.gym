'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Notification } from '@/types/database'
import { markAsRead, markAllAsRead } from '@/lib/actions/notifications'
import { useRouter } from 'next/navigation'

interface NotificationsDropdownProps {
  notifications: Notification[]
  unreadCount: number
  userId: string
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationsDropdown({ notifications, unreadCount, userId }: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localUnread, setLocalUnread] = useState(unreadCount)
  const [localNotifications, setLocalNotifications] = useState(notifications)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    )
    setLocalUnread((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(userId)
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setLocalUnread(0)
    router.refresh()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" aria-hidden="true" />
        {localUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {localUnread > 9 ? '9+' : localUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {localUnread > 0 && (
              <button
                className="text-xs text-brand-cyan-400 hover:underline"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {localNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              localNotifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${
                    !notification.is_read ? 'bg-brand-cyan-500/5' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id)
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-cyan-500 shrink-0" />
                    )}
                    <div className={!notification.is_read ? '' : 'ml-4'}>
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(notification.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
