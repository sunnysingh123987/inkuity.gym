import { getGyms } from '@/lib/actions/gyms'
import { getGymRoles } from '@/lib/actions/gym-roles'
import { TeamManager } from '@/components/dashboard/team/team-manager'

export const metadata = {
  title: 'Team - Inkuity',
  description: 'Manage team members, roles, and permissions',
}

export default async function TeamPage() {
  const { data: gyms } = await getGyms()
  const gym = gyms[0] || null

  let roles: any[] = []
  if (gym) {
    const rolesResult = await getGymRoles(gym.id)
    roles = rolesResult.data || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage team members, assign roles, and configure permissions.
        </p>
      </div>

      <TeamManager roles={roles} gym={gym} />
    </div>
  )
}
