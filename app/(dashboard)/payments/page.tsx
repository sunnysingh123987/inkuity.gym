import { getGyms, getMembers } from '@/lib/actions/gyms'
import { PaymentsManager } from '@/components/dashboard/payments/payments-manager'

export const metadata = {
  title: 'Payments - Inkuity',
  description: 'Manage member subscriptions and payments',
}

export default async function PaymentsPage() {
  const { data: gyms } = await getGyms()
  const gym = gyms[0] || null

  let members: any[] = []
  if (gym) {
    const { data } = await getMembers(gym.id)
    members = data || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage member subscriptions and payment plans.
        </p>
      </div>

      <PaymentsManager members={members} />
    </div>
  )
}
