import { getGyms } from '@/lib/actions/gyms'
import { GymsList } from '@/components/dashboard/gyms/gyms-list'

export const metadata = {
  title: 'Gyms - Inkuity',
  description: 'Manage your gym locations',
}

export default async function GymsPage() {
  const { data: gyms } = await getGyms()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gyms</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your gym locations and their settings.
        </p>
      </div>

      <GymsList gyms={gyms} />
    </div>
  )
}
