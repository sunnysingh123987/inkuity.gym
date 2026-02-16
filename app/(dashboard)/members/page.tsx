import { getGyms } from '@/lib/actions/gyms'
import { MembersList } from '@/components/dashboard/members/members-list'

export const metadata = {
  title: 'Members - Inkuity',
  description: 'Manage your gym members',
}

export default async function MembersPage() {
  const { data: gyms } = await getGyms()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your gym members.
        </p>
      </div>

      <MembersList gyms={gyms} />
    </div>
  )
}
