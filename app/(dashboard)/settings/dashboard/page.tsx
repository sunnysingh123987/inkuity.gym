import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGyms } from '@/lib/actions/gyms'
import { getDashboardSettings } from '@/lib/dashboard-settings'
import { DashboardCustomizer } from '@/components/dashboard/settings/dashboard-customizer'

export const metadata = {
  title: 'Customize Dashboard - Inkuity',
  description: 'Choose which widgets to display on your dashboard',
}

export default async function DashboardSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: gyms } = await getGyms()
  const gym = gyms[0] || null

  if (!gym) {
    redirect('/dashboard')
  }

  const widgetSettings = getDashboardSettings(gym)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Customize Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which widgets and sections appear on your dashboard.
        </p>
      </div>

      <DashboardCustomizer gymId={gym.id} initialSettings={widgetSettings} />
    </div>
  )
}
