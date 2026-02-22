import { getGyms } from '@/lib/actions/gyms'
import { getAnnouncements } from '@/lib/actions/announcements'
import { AnnouncementsManager } from '@/components/dashboard/announcements/announcements-manager'

export const metadata = {
  title: 'Announcements - Inkuity',
  description: 'Manage gym announcements and alerts for your members',
}

export default async function AnnouncementsPage() {
  const { data: gyms } = await getGyms()
  const gym = gyms[0] || null

  let announcements: any[] = []
  if (gym) {
    const result = await getAnnouncements(gym.id)
    announcements = result.data || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage announcements for your gym members.
        </p>
      </div>

      <AnnouncementsManager
        announcements={announcements}
        gymId={gym?.id || ''}
      />
    </div>
  )
}
