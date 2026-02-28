import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getNotificationById, markAsRead } from '@/lib/actions/notifications'
import { ArrowLeft, Bell, Clock, Tag } from 'lucide-react'

interface NotificationDetailPageProps {
  params: {
    id: string
  }
}

export const metadata = {
  title: 'Notification Details - Inkuity',
  description: 'View notification details',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    trial_checkin: 'Trial Check-in',
    member_checkin: 'Member Check-in',
    subscription_expiry: 'Subscription Expiry',
    announcement: 'Announcement',
    payment: 'Payment',
    referral: 'Referral',
  }
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getNotificationTypeBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    trial_checkin: 'bg-blue-500/10 text-blue-500',
    member_checkin: 'bg-green-500/10 text-green-500',
    subscription_expiry: 'bg-amber-500/10 text-amber-500',
    announcement: 'bg-purple-500/10 text-purple-500',
    payment: 'bg-emerald-500/10 text-emerald-500',
    referral: 'bg-pink-500/10 text-pink-500',
  }
  return colors[type] || 'bg-muted text-muted-foreground'
}

export default async function NotificationDetailPage({ params }: NotificationDetailPageProps) {
  const { data: notification } = await getNotificationById(params.id)

  if (!notification) {
    notFound()
  }

  // Mark as read if not already
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }

  const metadata = notification.metadata || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan-500/10">
              <Bell className="h-5 w-5 text-brand-cyan-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{notification.title}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(notification.created_at)}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getNotificationTypeBadgeColor(notification.type)}`}>
                  <Tag className="h-3 w-3" />
                  {getNotificationTypeLabel(notification.type)}
                </span>
              </div>
            </div>
          </div>
          {notification.is_read ? (
            <span className="text-xs text-muted-foreground">Read</span>
          ) : (
            <span className="flex h-2.5 w-2.5 rounded-full bg-brand-cyan-500" />
          )}
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-sm text-foreground leading-relaxed">{notification.message}</p>
        </div>

        {Object.keys(metadata).length > 0 && (
          <div className="border-t border-border pt-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Details</h2>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {metadata.member_name && (
                <div>
                  <dt className="text-xs text-muted-foreground">Member</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {metadata.member_id ? (
                      <Link href={`/members/${metadata.member_id}`} className="text-brand-cyan-500 hover:underline">
                        {metadata.member_name}
                      </Link>
                    ) : (
                      metadata.member_name
                    )}
                  </dd>
                </div>
              )}
              {metadata.check_date && (
                <div>
                  <dt className="text-xs text-muted-foreground">Date</dt>
                  <dd className="text-sm font-medium text-foreground">{metadata.check_date}</dd>
                </div>
              )}
              {metadata.check_in_time && (
                <div>
                  <dt className="text-xs text-muted-foreground">Check-in Time</dt>
                  <dd className="text-sm font-medium text-foreground">{metadata.check_in_time}</dd>
                </div>
              )}
              {metadata.days_offset !== undefined && (
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {metadata.days_offset <= 0 ? 'Expiring Soon' : 'Expired'}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {metadata.member_id && (
          <div className="border-t border-border pt-4">
            <Link
              href={`/members/${metadata.member_id}`}
              className="inline-flex items-center gap-2 rounded-md bg-brand-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-cyan-600 transition-colors"
            >
              View Member Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
