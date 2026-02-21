import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { createClient } from '@/lib/supabase/server'
import { getNotifications, getUnreadCount } from '@/lib/actions/notifications'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let notifications: any[] = []
  let unreadCount = 0
  const userId = user?.id || ''

  if (user) {
    const [notifResult, count] = await Promise.all([
      getNotifications(user.id),
      getUnreadCount(user.id),
    ])
    notifications = notifResult.data
    unreadCount = count
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar - Fixed on left */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="lg:pl-72">
        <Header
          notifications={notifications}
          unreadCount={unreadCount}
          userId={userId}
        />
        <main className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
