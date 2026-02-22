import { getGyms, getMembers } from '@/lib/actions/gyms'
import { getPayments } from '@/lib/actions/payments'
import { PaymentsManager } from '@/components/dashboard/payments/payments-manager'

export const metadata = {
  title: 'Payments - Inkuity',
  description: 'Manage member subscriptions and payments',
}

export default async function PaymentsPage() {
  const { data: gyms } = await getGyms()
  const gym = gyms[0] || null

  let members: any[] = []
  let payments: any[] = []
  if (gym) {
    const [membersResult, paymentsResult] = await Promise.all([
      getMembers(gym.id),
      getPayments(gym.id),
    ])
    members = membersResult.data || []
    payments = paymentsResult.data || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage member subscriptions, record payments, and track history.
        </p>
      </div>

      <PaymentsManager members={members} payments={payments} gym={gym} />
    </div>
  )
}
