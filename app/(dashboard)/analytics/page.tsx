import { getGyms } from '@/lib/actions/gyms'
import { AnalyticsDashboard } from '@/components/dashboard/analytics/analytics-dashboard'

export const metadata = {
  title: 'Analytics - Inkuity',
  description: 'View your gym analytics and insights',
}

export default async function AnalyticsPage() {
  const { data: gyms } = await getGyms()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track scans, visitor trends, and insights across your gyms.
        </p>
      </div>

      <AnalyticsDashboard gyms={gyms} />
    </div>
  )
}
