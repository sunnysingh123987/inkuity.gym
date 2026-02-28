import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGyms, getQRCodes } from '@/lib/actions/gyms'
import { getGymRoles } from '@/lib/actions/gym-roles'
import { SettingsForm } from '@/components/dashboard/settings/settings-form'
import { TeamManager } from '@/components/dashboard/team/team-manager'

export const metadata = {
  title: 'Settings - Inkuity',
  description: 'Manage your account settings',
}

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch gym and QR codes
  const { data: gyms } = await getGyms()
  const gym = gyms[0] || null

  let checkInQRCode = null
  let roles: any[] = []
  if (gym) {
    const { data: qrCodes } = await getQRCodes(gym.id)
    checkInQRCode = qrCodes?.find((qr: any) => qr.type === 'check-in') || qrCodes?.[0] || null
    const rolesResult = await getGymRoles(gym.id)
    roles = rolesResult.data || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <SettingsForm profile={profile} gym={gym} checkInQRCode={checkInQRCode} />

      {gym && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-1">Team</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage team members, assign roles, and configure permissions.
          </p>
          <TeamManager roles={roles} gym={gym} />
        </div>
      )}
    </div>
  )
}
