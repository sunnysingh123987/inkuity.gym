'use client'

import { useState } from 'react'
import type { Staff, Expense, ExpenseWithStaff, Gym } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Receipt,
  BarChart3,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
  Filter,
  CalendarDays,
  RefreshCw,
} from 'lucide-react'
import {
  createStaff,
  updateStaff,
  deleteStaff,
  createExpense,
  updateExpense,
  deleteExpense,
  getFinancialSummary,
  getExpenses,
} from '@/lib/actions/staff-expenses'
import { toast } from 'sonner'

// ─── Constants ───────────────────────────────────────────────

const STAFF_ROLES = [
  { value: 'trainer', label: 'Trainer' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'manager', label: 'Manager' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'co-owner', label: 'Co-Owner' },
  { value: 'other', label: 'Other' },
]

const SALARY_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily', label: 'Daily' },
]

const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'staff_salary', label: 'Staff Salary' },
  { value: 'other', label: 'Other' },
]

const RECURRENCE_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

// ─── Props ───────────────────────────────────────────────────

interface StaffExpensesManagerProps {
  staff: Staff[]
  expenses: ExpenseWithStaff[]
  gym: Gym | null
  financialSummary: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    staffSalaryTotal: number
  } | null
}

// ─── Component ───────────────────────────────────────────────

export function StaffExpensesManager({
  staff: initialStaff,
  expenses: initialExpenses,
  gym,
  financialSummary: initialSummary,
}: StaffExpensesManagerProps) {
  // Staff state
  const [staffList, setStaffList] = useState<Staff[]>(initialStaff)
  const [staffDialogOpen, setStaffDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [staffSubmitting, setStaffSubmitting] = useState(false)
  const [staffForm, setStaffForm] = useState({
    full_name: '',
    role: 'trainer',
    phone: '',
    email: '',
    salary: '',
    salary_frequency: 'monthly' as 'monthly' | 'weekly' | 'daily',
    hire_date: new Date().toISOString().split('T')[0],
  })

  // Expense state
  const [expensesList, setExpensesList] = useState<ExpenseWithStaff[]>(initialExpenses)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseWithStaff | null>(null)
  const [expenseSubmitting, setExpenseSubmitting] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    category: 'rent',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurrence_frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    staff_id: '',
  })

  // Expense filters
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all')
  const [expenseStartDate, setExpenseStartDate] = useState('')
  const [expenseEndDate, setExpenseEndDate] = useState('')

  // Summary state
  const [summary, setSummary] = useState(initialSummary)
  const [summaryMonth, setSummaryMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [summaryLoading, setSummaryLoading] = useState(false)

  // ─── Helpers ───────────────────────────────────────────────

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: gym?.currency || 'INR',
    }).format(amount)
  }

  // ─── Staff Handlers ────────────────────────────────────────

  const openAddStaff = () => {
    setEditingStaff(null)
    setStaffForm({
      full_name: '',
      role: 'trainer',
      phone: '',
      email: '',
      salary: '',
      salary_frequency: 'monthly',
      hire_date: new Date().toISOString().split('T')[0],
    })
    setStaffDialogOpen(true)
  }

  const openEditStaff = (s: Staff) => {
    setEditingStaff(s)
    setStaffForm({
      full_name: s.full_name,
      role: s.role,
      phone: s.phone || '',
      email: s.email || '',
      salary: String(s.salary),
      salary_frequency: s.salary_frequency,
      hire_date: s.hire_date,
    })
    setStaffDialogOpen(true)
  }

  const handleStaffSubmit = async () => {
    if (!gym || !staffForm.full_name || !staffForm.salary) return

    setStaffSubmitting(true)

    if (editingStaff) {
      const result = await updateStaff(editingStaff.id, {
        full_name: staffForm.full_name,
        role: staffForm.role,
        phone: staffForm.phone || null,
        email: staffForm.email || null,
        salary: parseFloat(staffForm.salary),
        salary_frequency: staffForm.salary_frequency,
        hire_date: staffForm.hire_date,
      })
      if (result.success && result.data) {
        setStaffList((prev) => prev.map((s) => (s.id === editingStaff.id ? result.data! : s)))
        toast.success('Staff updated')
        setStaffDialogOpen(false)
      } else {
        toast.error(result.error || 'Failed to update staff')
      }
    } else {
      const result = await createStaff({
        gym_id: gym.id,
        full_name: staffForm.full_name,
        role: staffForm.role,
        phone: staffForm.phone || undefined,
        email: staffForm.email || undefined,
        salary: parseFloat(staffForm.salary),
        salary_frequency: staffForm.salary_frequency,
        hire_date: staffForm.hire_date,
      })
      if (result.success && result.data) {
        setStaffList((prev) => [...prev, result.data!])
        toast.success('Staff member added')
        setStaffDialogOpen(false)
      } else {
        toast.error(result.error || 'Failed to add staff')
      }
    }

    setStaffSubmitting(false)
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    const result = await deleteStaff(staffId)
    if (result.success) {
      setStaffList((prev) => prev.filter((s) => s.id !== staffId))
      toast.success('Staff member deleted')
    } else {
      toast.error(result.error || 'Failed to delete staff')
    }
  }

  const handleToggleActive = async (s: Staff) => {
    const result = await updateStaff(s.id, { is_active: !s.is_active })
    if (result.success && result.data) {
      setStaffList((prev) => prev.map((item) => (item.id === s.id ? result.data! : item)))
      toast.success(result.data.is_active ? 'Staff activated' : 'Staff deactivated')
    } else {
      toast.error(result.error || 'Failed to update status')
    }
  }

  // ─── Expense Handlers ─────────────────────────────────────

  const openAddExpense = () => {
    setEditingExpense(null)
    setExpenseForm({
      category: 'rent',
      description: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      is_recurring: false,
      recurrence_frequency: 'monthly',
      staff_id: '',
    })
    setExpenseDialogOpen(true)
  }

  const openEditExpense = (e: ExpenseWithStaff) => {
    setEditingExpense(e)
    setExpenseForm({
      category: e.category,
      description: e.description || '',
      amount: String(e.amount),
      expense_date: e.expense_date,
      is_recurring: e.is_recurring,
      recurrence_frequency: e.recurrence_frequency || 'monthly',
      staff_id: e.staff_id || '',
    })
    setExpenseDialogOpen(true)
  }

  const handleExpenseSubmit = async () => {
    if (!gym || !expenseForm.amount) return

    setExpenseSubmitting(true)

    if (editingExpense) {
      const result = await updateExpense(editingExpense.id, {
        category: expenseForm.category,
        description: expenseForm.description || null,
        amount: parseFloat(expenseForm.amount),
        expense_date: expenseForm.expense_date,
        is_recurring: expenseForm.is_recurring,
        recurrence_frequency: expenseForm.is_recurring ? expenseForm.recurrence_frequency : null,
        staff_id: expenseForm.staff_id || null,
      })
      if (result.success && result.data) {
        // Re-fetch to get staff join data
        const refreshed = await getExpenses(gym.id)
        if (refreshed.success && refreshed.data) {
          setExpensesList(refreshed.data)
        }
        toast.success('Expense updated')
        setExpenseDialogOpen(false)
      } else {
        toast.error(result.error || 'Failed to update expense')
      }
    } else {
      const result = await createExpense({
        gym_id: gym.id,
        category: expenseForm.category,
        description: expenseForm.description || undefined,
        amount: parseFloat(expenseForm.amount),
        expense_date: expenseForm.expense_date,
        is_recurring: expenseForm.is_recurring,
        recurrence_frequency: expenseForm.is_recurring ? expenseForm.recurrence_frequency : undefined,
        staff_id: expenseForm.staff_id || undefined,
      })
      if (result.success && result.data) {
        // Re-fetch to get staff join data
        const refreshed = await getExpenses(gym.id)
        if (refreshed.success && refreshed.data) {
          setExpensesList(refreshed.data)
        }
        toast.success('Expense added')
        setExpenseDialogOpen(false)
      } else {
        toast.error(result.error || 'Failed to add expense')
      }
    }

    setExpenseSubmitting(false)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    const result = await deleteExpense(expenseId)
    if (result.success) {
      setExpensesList((prev) => prev.filter((e) => e.id !== expenseId))
      toast.success('Expense deleted')
    } else {
      toast.error(result.error || 'Failed to delete expense')
    }
  }

  // Filter expenses client-side
  const filteredExpenses = expensesList.filter((e) => {
    if (expenseCategoryFilter !== 'all' && e.category !== expenseCategoryFilter) return false
    if (expenseStartDate && e.expense_date < expenseStartDate) return false
    if (expenseEndDate && e.expense_date > expenseEndDate) return false
    return true
  })

  // ─── Summary Handlers ─────────────────────────────────────

  const handleMonthChange = async (month: string) => {
    if (!gym) return
    setSummaryMonth(month)
    setSummaryLoading(true)
    const result = await getFinancialSummary(gym.id, month)
    if (result.success && result.data) {
      setSummary(result.data)
    } else {
      toast.error(result.error || 'Failed to load summary')
    }
    setSummaryLoading(false)
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff" className="gap-1.5">
            <Users className="h-4 w-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* ═══ STAFF TAB ═══ */}
        <TabsContent value="staff">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {staffList.length} staff member{staffList.length !== 1 ? 's' : ''}
              </p>
              <Button onClick={openAddStaff} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Staff
              </Button>
            </div>

            {staffList.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No staff members yet.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Salary</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Frequency</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hire Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {staffList.map((s) => (
                          <tr key={s.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 text-sm font-medium text-foreground">{s.full_name}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{s.role.replace('-', ' ')}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{s.phone || '--'}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{s.email || '--'}</td>
                            <td className="px-6 py-4 text-sm font-medium text-foreground">{formatCurrency(s.salary)}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{s.salary_frequency}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {new Date(s.hire_date).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                className={
                                  s.is_active
                                    ? 'bg-green-500/10 text-green-400 cursor-pointer'
                                    : 'bg-red-500/10 text-red-400 cursor-pointer'
                                }
                                onClick={() => handleToggleActive(s)}
                              >
                                {s.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditStaff(s)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteStaff(s.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ═══ EXPENSES TAB ═══ */}
        <TabsContent value="expenses">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="h-9 w-auto"
                  value={expenseStartDate}
                  onChange={(e) => setExpenseStartDate(e.target.value)}
                  placeholder="From"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  className="h-9 w-auto"
                  value={expenseEndDate}
                  onChange={(e) => setExpenseEndDate(e.target.value)}
                  placeholder="To"
                />
              </div>

              <div className="ml-auto">
                <Button onClick={openAddExpense} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No expenses found.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Recurring</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Staff</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {filteredExpenses.map((e) => (
                          <tr key={e.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 text-sm text-foreground">
                              {new Date(e.expense_date).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="secondary" className="capitalize">
                                {e.category.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate">
                              {e.description || '--'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                              {formatCurrency(e.amount)}
                            </td>
                            <td className="px-6 py-4">
                              {e.is_recurring ? (
                                <Badge className="bg-blue-500/10 text-blue-400 gap-1">
                                  <RefreshCw className="h-3 w-3" />
                                  {e.recurrence_frequency}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">One-time</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {e.staff?.full_name || '--'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditExpense(e)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteExpense(e.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ═══ SUMMARY TAB ═══ */}
        <TabsContent value="summary">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm">Month</Label>
              <Input
                type="month"
                className="h-9 w-auto"
                value={summaryMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
              />
              {summaryLoading && (
                <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
              )}
            </div>

            {summary ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                          <p className="text-2xl font-bold text-green-400">{formatCurrency(summary.totalRevenue)}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Expenses</p>
                          <p className="text-2xl font-bold text-red-400">{formatCurrency(summary.totalExpenses)}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <TrendingDown className="h-5 w-5 text-red-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Net Profit</p>
                          <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(summary.netProfit)}
                          </p>
                        </div>
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          summary.netProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          <IndianRupee className={`h-5 w-5 ${summary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Staff Salaries (Monthly)</p>
                          <p className="text-2xl font-bold text-amber-400">{formatCurrency(summary.staffSalaryTotal)}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-amber-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Revenue from Payments</span>
                        <span className="text-sm font-medium text-green-400">+{formatCurrency(summary.totalRevenue)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Total Expenses</span>
                        <span className="text-sm font-medium text-red-400">-{formatCurrency(summary.totalExpenses)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Staff Salaries (Estimated Monthly)</span>
                        <span className="text-sm font-medium text-amber-400">{formatCurrency(summary.staffSalaryTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-foreground">Net Profit</span>
                        <span className={`text-sm font-bold ${summary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(summary.netProfit)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No financial data available.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ STAFF DIALOG ═══ */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update staff member details.' : 'Add a new staff member to your gym.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={staffForm.full_name}
                onChange={(e) => setStaffForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={staffForm.role}
                onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value }))}
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="staff@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Salary *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">&#8377;</span>
                  <Input
                    type="number"
                    min="0"
                    className="pl-7"
                    value={staffForm.salary}
                    onChange={(e) => setStaffForm((f) => ({ ...f, salary: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={staffForm.salary_frequency}
                  onChange={(e) => setStaffForm((f) => ({ ...f, salary_frequency: e.target.value as any }))}
                >
                  {SALARY_FREQUENCIES.map((sf) => (
                    <option key={sf.value} value={sf.value}>{sf.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hire Date</Label>
              <Input
                type="date"
                value={staffForm.hire_date}
                onChange={(e) => setStaffForm((f) => ({ ...f, hire_date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStaffDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStaffSubmit}
              disabled={!staffForm.full_name || !staffForm.salary || staffSubmitting}
            >
              {staffSubmitting ? 'Saving...' : editingStaff ? 'Update' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EXPENSE DIALOG ═══ */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Update expense details.' : 'Record a new expense for your gym.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={expenseForm.category}
                onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={expenseForm.description}
                onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Monthly rent payment"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">&#8377;</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, expense_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={expenseForm.is_recurring}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, is_recurring: e.target.checked }))}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="is_recurring" className="text-sm cursor-pointer">
                  Recurring expense
                </Label>
              </div>

              {expenseForm.is_recurring && (
                <div className="space-y-2">
                  <Label>Recurrence Frequency</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={expenseForm.recurrence_frequency}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, recurrence_frequency: e.target.value as any }))}
                  >
                    {RECURRENCE_FREQUENCIES.map((rf) => (
                      <option key={rf.value} value={rf.value}>{rf.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Linked Staff (optional)</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={expenseForm.staff_id}
                onChange={(e) => setExpenseForm((f) => ({ ...f, staff_id: e.target.value }))}
              >
                <option value="">None</option>
                {staffList
                  .filter((s) => s.is_active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExpenseSubmit}
              disabled={!expenseForm.amount || expenseSubmitting}
            >
              {expenseSubmitting ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
