import { getGyms } from '@/lib/actions/gyms'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'

export const metadata = {
  title: 'Dashboard - Inkuity',
  description: 'Overview of your gym analytics',
}

export default async function DashboardPage() {
  const { data: gyms } = await getGyms()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here&apos;s what&apos;s happening with your gyms.
        </p>
      </div>

      <DashboardOverview gyms={gyms} />
    </div>
  )
}
