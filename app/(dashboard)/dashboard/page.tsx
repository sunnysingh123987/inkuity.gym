import { getGyms, getQRCodes, getAnalyticsSummary } from '@/lib/actions/gyms'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Dashboard - Inkuity',
  description: 'Overview of your gym analytics',
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: gyms } = await getGyms()
  const gym = gyms[0] || null

  // Fetch profile for greeting
  const { data: { user } } = await supabase.auth.getUser()
  let userName = ''
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    userName = profile?.full_name || user.user_metadata?.full_name || ''
  }

  // Fetch QR codes and analytics for the gym
  let qrCodes: any[] = []
  let analytics = { totalScans: 0, uniqueVisitors: 0, todayScans: 0, weekScans: 0, topQRCode: null as { name: string; scans: number } | null }

  if (gym) {
    const { data: qrData } = await getQRCodes(gym.id)
    qrCodes = qrData || []

    const analyticsSummary = await getAnalyticsSummary(gym.id)
    analytics = analyticsSummary
  }

  // Fetch recent members
  let recentMembers: any[] = []
  if (gym) {
    const { data: members, error } = await supabase
      .from('members')
      .select('id, full_name, email, membership_status, created_at')
      .eq('gym_id', gym.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!error && members) {
      recentMembers = members
    }
  }

  // Get total member count
  let totalMembers = 0
  if (gym) {
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gym.id)

    totalMembers = count || 0
  }

  return (
    <DashboardOverview
      gym={gym}
      userName={userName}
      qrCodes={qrCodes}
      analytics={analytics}
      recentMembers={recentMembers}
      totalMembers={totalMembers}
    />
  )
}
