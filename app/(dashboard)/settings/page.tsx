import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGyms, getQRCodes } from '@/lib/actions/gyms'
import { SettingsForm } from '@/components/dashboard/settings/settings-form'

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
  if (gym) {
    const { data: qrCodes } = await getQRCodes(gym.id)
    checkInQRCode = qrCodes?.find((qr: any) => qr.type === 'check-in') || qrCodes?.[0] || null
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
    </div>
  )
}
