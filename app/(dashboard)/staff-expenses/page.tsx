import { getGyms } from '@/lib/actions/gyms'
import { getStaff, getExpenses, getFinancialSummary } from '@/lib/actions/staff-expenses'
import { StaffExpensesManager } from '@/components/dashboard/staff-expenses/staff-expenses-manager'

export const metadata = {
  title: 'Staff & Expenses - Inkuity',
  description: 'Manage staff members and track gym expenses',
}

export default async function StaffExpensesPage() {
  const { data: gyms } = await getGyms()
  const gym = gyms[0] || null

  let staff: any[] = []
  let expenses: any[] = []
  let financialSummary = null

  if (gym) {
    const [staffResult, expensesResult, summaryResult] = await Promise.all([
      getStaff(gym.id),
      getExpenses(gym.id),
      getFinancialSummary(gym.id),
    ])
    staff = staffResult.data || []
    expenses = expensesResult.data || []
    financialSummary = summaryResult.data || null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Staff & Expenses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your staff, track expenses, and view financial summaries.
        </p>
      </div>

      <StaffExpensesManager
        staff={staff}
        expenses={expenses}
        gym={gym}
        financialSummary={financialSummary}
      />
    </div>
  )
}
