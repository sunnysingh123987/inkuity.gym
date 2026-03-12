'use client'

import { useState, useRef } from 'react'
import { Member, Gym, Payment, PaymentWithMember, PaymentMethod, MembershipPlan } from '@/types/database'
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
  Search,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Plus,
  IndianRupee,
  Send,
  Upload,
  Settings,
  History,
  Users,
  Image,
  Pencil,
  Trash2,
  X,
  Loader2,
} from 'lucide-react'
import { updateMember } from '@/lib/actions/gyms'
import { createPayment, uploadPaymentQR, savePaymentQRUrl, saveMembershipPlans } from '@/lib/actions/payments'
import { toast } from '@/components/ui/toaster'
import { DatePicker } from '@/components/ui/date-picker'

interface PaymentsManagerProps {
  members: Member[]
  payments: PaymentWithMember[]
  gym: Gym | null
}

const PLAN_MONTHS: Record<string, number> = {
  '1_month': 1,
  '3_months': 3,
  '6_months': 6,
  '1_year': 12,
}

const DURATION_LABELS: Record<string, string> = {
  '1_month': '1 Month',
  '3_months': '3 Months',
  '6_months': '6 Months',
  '1_year': '1 Year',
}

const DURATION_KEYS = ['1_month', '3_months', '6_months', '1_year'] as const

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'paytm', label: 'Paytm' },
  { value: 'phonepe', label: 'PhonePe' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
]

const PAYMENT_TYPES = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'one_time', label: 'One-time' },
  { value: 'penalty', label: 'Penalty' },
] as const

export function PaymentsManager({ members: initialMembers, payments: initialPayments, gym }: PaymentsManagerProps) {
  const [members, setMembers] = useState(initialMembers)
  const [payments, setPayments] = useState(initialPayments)
  const [searchTerm, setSearchTerm] = useState('')
  const [historySearch, setHistorySearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [planData, setPlanData] = useState<Record<string, { plan: string; startDate: string; planName: string }>>({})

  // Record Payment Dialog
  const [recordOpen, setRecordOpen] = useState(false)
  const [recordMemberId, setRecordMemberId] = useState('')
  const [recordAmount, setRecordAmount] = useState('')
  const [recordMethod, setRecordMethod] = useState<PaymentMethod>('cash')
  const [recordType, setRecordType] = useState<'subscription' | 'one_time' | 'penalty'>('subscription')
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [recordDescription, setRecordDescription] = useState('')
  const [recordSubmitting, setRecordSubmitting] = useState(false)
  const [recordPlan, setRecordPlan] = useState('')
  const [recordStartDate, setRecordStartDate] = useState(new Date().toISOString().split('T')[0])
  const [recordPlanName, setRecordPlanName] = useState('')

  // QR upload
  const [qrUploading, setQrUploading] = useState(false)
  const [qrUrl, setQrUrl] = useState<string>(gym?.settings?.payment_qr_url || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Membership plans
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>(
    () => (gym?.settings?.membership_plans as MembershipPlan[]) || []
  )
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null)
  const [addingForDuration, setAddingForDuration] = useState<string | null>(null)
  const [planForm, setPlanForm] = useState({ name: '', price: '', description: '' })
  const [plansSaving, setPlansSaving] = useState(false)
  const [collapsedDurations, setCollapsedDurations] = useState<Record<string, boolean>>({})

  const getPlansForDuration = (duration: string) =>
    membershipPlans.filter((p) => p.duration === duration)

  const toggleDuration = (duration: string) =>
    setCollapsedDurations((prev) => ({ ...prev, [duration]: !prev[duration] }))

  const startAddPlan = (duration: string) => {
    setAddingForDuration(duration)
    setEditingPlan(null)
    setPlanForm({ name: '', price: '', description: '' })
  }

  const startEditPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan)
    setAddingForDuration(null)
    setPlanForm({ name: plan.name, price: String(plan.price), description: plan.description })
  }

  const cancelPlanForm = () => {
    setAddingForDuration(null)
    setEditingPlan(null)
    setPlanForm({ name: '', price: '', description: '' })
  }

  const handleSaveMembershipPlan = async () => {
    if (!planForm.name || !planForm.price || !gym) return

    let updated: MembershipPlan[]
    if (editingPlan) {
      updated = membershipPlans.map((p) =>
        p.id === editingPlan.id
          ? { ...p, name: planForm.name, price: parseFloat(planForm.price), description: planForm.description }
          : p
      )
    } else if (addingForDuration) {
      const newPlan: MembershipPlan = {
        id: crypto.randomUUID(),
        name: planForm.name,
        duration: addingForDuration as MembershipPlan['duration'],
        price: parseFloat(planForm.price),
        description: planForm.description,
      }
      updated = [...membershipPlans, newPlan]
    } else {
      return
    }

    setPlansSaving(true)
    const result = await saveMembershipPlans(gym.id, updated)
    if (result.success) {
      setMembershipPlans(updated)
      cancelPlanForm()
      toast.success(editingPlan ? 'Plan updated' : 'Plan added')
    } else {
      toast.error(result.error || 'Failed to save plan')
    }
    setPlansSaving(false)
  }

  const handleDeletePlan = async (planId: string) => {
    if (!gym) return
    const updated = membershipPlans.filter((p) => p.id !== planId)
    setPlansSaving(true)
    const result = await saveMembershipPlans(gym.id, updated)
    if (result.success) {
      setMembershipPlans(updated)
      toast.success('Plan deleted')
    } else {
      toast.error(result.error || 'Failed to delete plan')
    }
    setPlansSaving(false)
  }

  // Helpers
  const getWhatsAppLink = (phone: string | null) => {
    if (!phone) return null
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return null
    return `https://wa.me/${digits}`
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500/10 text-green-400',
      trial: 'bg-cyan-500/10 text-cyan-400',
      expired: 'bg-red-500/10 text-red-400',
      suspended: 'bg-yellow-500/10 text-yellow-400',
      cancelled: 'bg-muted text-muted-foreground',
      pending: 'bg-blue-500/10 text-blue-400',
    }
    return variants[status] || variants.pending
  }

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-400',
      pending: 'bg-yellow-500/10 text-yellow-400',
      failed: 'bg-red-500/10 text-red-400',
      refunded: 'bg-blue-500/10 text-blue-400',
    }
    return variants[status] || 'bg-muted text-muted-foreground'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: gym?.currency || 'INR' }).format(amount)
  }

  const formatMethodLabel = (method: string) => {
    return PAYMENT_METHODS.find((m) => m.value === method)?.label || method
  }

  // Filter members
  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase()
    return (
      m.full_name?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.phone?.includes(term) ||
      m.metadata?.member_id?.toLowerCase().includes(term)
    )
  })

  // Filter history
  const filteredPayments = payments.filter((p) => {
    if (!historySearch) return true
    const term = historySearch.toLowerCase()
    return (
      p.member?.full_name?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term) ||
      p.payment_method?.toLowerCase().includes(term) ||
      p.type?.toLowerCase().includes(term)
    )
  })

  // Get member's recent payments
  const getMemberPayments = (memberId: string) => {
    return payments
      .filter((p) => p.member_id === memberId)
      .slice(0, 3)
  }

  // Plan management
  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      const member = members.find((m) => m.id === id)
      if (member && !planData[id]) {
        setPlanData((prev) => ({
          ...prev,
          [id]: {
            plan: member.subscription_plan || '',
            startDate: member.subscription_start_date || new Date().toISOString().split('T')[0],
            planName: member.metadata?.plan_name || '',
          },
        }))
      }
    }
  }

  const calculateEndDate = (startDate: string, plan: string): string => {
    if (!startDate || !plan || !PLAN_MONTHS[plan]) return ''
    const start = new Date(startDate)
    start.setMonth(start.getMonth() + PLAN_MONTHS[plan])
    return start.toISOString().split('T')[0]
  }

  const handleSavePlan = async (memberId: string) => {
    const data = planData[memberId]
    if (!data?.plan || !data?.startDate) return

    setSaving(memberId)
    const endDate = calculateEndDate(data.startDate, data.plan)

    const member = members.find((m) => m.id === memberId)
    const updatedMetadata = { ...(member?.metadata || {}), plan_name: data.planName || null }

    const result = await updateMember(memberId, {
      subscription_plan: data.plan as any,
      subscription_start_date: data.startDate,
      subscription_end_date: endDate,
      membership_status: 'active',
      metadata: updatedMetadata,
    })

    if (result.success) {
      toast.success('Plan updated successfully')
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                subscription_plan: data.plan as any,
                subscription_start_date: data.startDate,
                subscription_end_date: endDate,
                membership_status: 'active',
                metadata: updatedMetadata,
              }
            : m
        )
      )
      setExpandedId(null)
    } else {
      toast.error(result.error || 'Failed to update plan')
    }
    setSaving(null)
  }

  // Record Payment
  const openRecordPayment = (memberId?: string) => {
    setRecordMemberId(memberId || '')
    setRecordAmount('')
    setRecordMethod('cash')
    setRecordType('subscription')
    setRecordDate(new Date().toISOString().split('T')[0])
    const now = new Date()
    setRecordTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    setRecordDescription('')

    // Pre-populate subscription details from member's existing data
    const member = memberId ? members.find((m) => m.id === memberId) : null
    setRecordPlan(member?.subscription_plan || '')
    // Extract YYYY-MM-DD from ISO timestamp (e.g. "2025-10-22T19:12:57.081+00:00" → "2025-10-22")
    const startDate = member?.subscription_start_date
      ? new Date(member.subscription_start_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
    setRecordStartDate(startDate)
    setRecordPlanName(member?.metadata?.plan_name || '')
    setRecordOpen(true)
  }

  const handleRecordPayment = async () => {
    if (!gym || !recordMemberId || !recordAmount) return

    setRecordSubmitting(true)

    // Combine date + time into ISO string
    const paymentDateTime = new Date(`${recordDate}T${recordTime || '00:00'}:00`).toISOString()

    const result = await createPayment({
      gym_id: gym.id,
      member_id: recordMemberId,
      amount: parseFloat(recordAmount),
      currency: gym.currency || 'INR',
      type: recordType,
      payment_method: recordMethod,
      description: recordDescription || undefined,
      payment_date: paymentDateTime,
    })

    if (result.success && result.data) {
      // Auto-update member status for subscription payments BEFORE closing dialog
      if (recordType === 'subscription' && recordPlan && recordStartDate) {
        const endDate = calculateEndDate(recordStartDate, recordPlan)
        const member = members.find((m) => m.id === recordMemberId)
        const updatedMetadata = { ...(member?.metadata || {}), plan_name: recordPlanName || null }
        const updateResult = await updateMember(recordMemberId, {
          subscription_plan: recordPlan as any,
          subscription_start_date: recordStartDate,
          subscription_end_date: endDate,
          membership_status: 'active',
          metadata: updatedMetadata,
        })
        if (updateResult.success) {
          setMembers((prev) =>
            prev.map((m) =>
              m.id === recordMemberId
                ? {
                    ...m,
                    subscription_plan: recordPlan as any,
                    subscription_start_date: recordStartDate,
                    subscription_end_date: endDate,
                    membership_status: 'active',
                    metadata: updatedMetadata,
                  }
                : m
            )
          )
          toast.success('Payment recorded & membership updated')
        } else {
          toast.error('Payment recorded but failed to update membership: ' + (updateResult.error || 'Unknown error'))
        }
      } else {
        toast.success('Payment recorded successfully')
      }

      setPayments((prev) => [result.data as PaymentWithMember, ...prev])
      setRecordOpen(false)

      // Offer WhatsApp share
      const member = members.find((m) => m.id === recordMemberId)
      if (member?.phone) {
        const receiptLink = buildWhatsAppReceiptLink(member, result.data)
        if (receiptLink) {
          window.open(receiptLink, '_blank')
          toast.success('Opening WhatsApp receipt')
        }
      }
    } else {
      toast.error(result.error || 'Failed to record payment')
    }
    setRecordSubmitting(false)
  }

  // WhatsApp receipt
  const buildWhatsAppReceiptLink = (member: Pick<Member, 'phone' | 'full_name'> | null, payment: Payment) => {
    if (!member?.phone) return null
    const digits = member.phone.replace(/\D/g, '')
    if (digits.length < 10) return null

    const lines = [
      `*Payment Receipt*`,
      ``,
      `Gym: ${gym?.name || 'N/A'}`,
      `Member: ${member.full_name || 'N/A'}`,
      `Amount: ${formatCurrency(payment.amount)}`,
      `Method: ${formatMethodLabel(payment.payment_method)}`,
      `Type: ${payment.type.replace('_', ' ')}`,
      `Date: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}`,
      `Status: ${payment.status}`,
      `Ref: ${payment.id.slice(0, 8).toUpperCase()}`,
      ``,
      `Thank you!`,
    ]

    return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join('\n'))}`
  }

  // QR upload
  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !gym) return

    setQrUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const uploadResult = await uploadPaymentQR(formData)
    if (uploadResult.success && uploadResult.url) {
      const saveResult = await savePaymentQRUrl(gym.id, uploadResult.url)
      if (saveResult.success) {
        setQrUrl(uploadResult.url)
        toast.success('Payment QR code uploaded')
      } else {
        toast.error(saveResult.error || 'Failed to save QR URL')
      }
    } else {
      toast.error(uploadResult.error || 'Failed to upload QR code')
    }
    setQrUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-4 w-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ─── MEMBERS TAB ─── */}
        <TabsContent value="members">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => openRecordPayment()} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Record Payment
              </Button>
            </div>

            {filteredMembers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No members found.</p>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">End Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {filteredMembers.map((member) => {
                          const isExpanded = expandedId === member.id
                          const memberPlan = planData[member.id]
                          const recentPayments = getMemberPayments(member.id)

                          return (
                            <tr key={member.id} className="hover:bg-muted/50">
                              <td className="px-6 py-4 text-sm font-medium text-foreground">{member.full_name || '—'}</td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">{member.phone || '—'}</td>
                              <td className="px-6 py-4">
                                <Badge className={getStatusBadge(member.membership_status)}>
                                  {member.membership_status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-sm text-foreground">
                                <div>
                                  {member.subscription_plan?.replace('_', ' ').toUpperCase() || 'Not Set'}
                                  {member.metadata?.plan_name && (
                                    <span className="block text-xs text-muted-foreground">{member.metadata.plan_name}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">
                                {(member.subscription_end_date || member.metadata?.subscription_end_date)
                                  ? new Date(member.subscription_end_date || member.metadata?.subscription_end_date).toLocaleDateString()
                                  : '—'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openRecordPayment(member.id)}
                                    className="gap-1"
                                  >
                                    <IndianRupee className="h-3.5 w-3.5" />
                                    Record
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── PAYMENT HISTORY TAB ─── */}
        <TabsContent value="history">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  className="pl-10"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>
              <Button onClick={() => openRecordPayment()} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Record Payment
              </Button>
            </div>

            {filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <History className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No payments found.</p>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Member</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {filteredPayments.map((payment) => {
                          const receiptLink = buildWhatsAppReceiptLink(payment.member, payment)
                          return (
                            <tr key={payment.id} className="hover:bg-muted/50">
                              <td className="px-6 py-4 text-sm text-foreground">
                                <div>{new Date(payment.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                                <div className="text-xs text-muted-foreground">{new Date(payment.payment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-foreground">
                                {payment.member?.full_name || '—'}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-foreground">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">
                                {formatMethodLabel(payment.payment_method)}
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground capitalize">
                                {payment.type.replace('_', ' ')}
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={getPaymentStatusBadge(payment.status)}>
                                  {payment.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                {receiptLink && (
                                  <a href={receiptLink} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="gap-1.5 text-green-500 border-green-500/30 hover:bg-green-500/10">
                                      <Send className="h-3.5 w-3.5" />
                                      Receipt
                                    </Button>
                                  </a>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── SETTINGS TAB ─── */}
        <TabsContent value="settings">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Payment QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a QR code image (e.g. your UPI/Paytm/PhonePe QR) that members can scan to make payments.
                </p>

                {qrUrl && (
                  <div className="rounded-lg border border-border p-4 bg-muted/30 inline-block">
                    <img
                      src={qrUrl}
                      alt="Payment QR Code"
                      className="max-w-[250px] max-h-[250px] rounded"
                    />
                  </div>
                )}

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleQRUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={qrUploading}
                    className="gap-1.5"
                  >
                    <Upload className="h-4 w-4" />
                    {qrUploading ? 'Uploading...' : qrUrl ? 'Replace QR Code' : 'Upload QR Code'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ─── MEMBERSHIP PLANS ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Membership Plans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Define plan variants under each duration tier. These will appear when assigning plans to members.
                </p>

                {DURATION_KEYS.map((duration) => {
                  const plans = getPlansForDuration(duration)
                  const isCollapsed = collapsedDurations[duration]

                  return (
                    <div key={duration} className="rounded-lg border border-border">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50"
                        onClick={() => toggleDuration(duration)}
                      >
                        <span>{DURATION_LABELS[duration]}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{plans.length} plan{plans.length !== 1 ? 's' : ''}</Badge>
                          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </div>
                      </button>

                      {!isCollapsed && (
                        <div className="border-t border-border px-4 py-3 space-y-3">
                          {plans.length === 0 && addingForDuration !== duration && (
                            <p className="text-xs text-muted-foreground">No plans defined for this duration.</p>
                          )}

                          {plans.map((plan) =>
                            editingPlan?.id === plan.id ? (
                              <div key={plan.id} className="rounded-md border border-primary/30 bg-muted/30 p-3 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Name</Label>
                                    <Input
                                      className="h-8 text-sm"
                                      value={planForm.name}
                                      onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
                                      placeholder="e.g. Basic (No Cardio)"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Price (₹)</Label>
                                    <Input
                                      className="h-8 text-sm"
                                      type="number"
                                      min="0"
                                      value={planForm.price}
                                      onChange={(e) => setPlanForm((f) => ({ ...f, price: e.target.value }))}
                                      placeholder="500"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Description</Label>
                                  <Input
                                    className="h-8 text-sm"
                                    value={planForm.description}
                                    onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Access to weights and machines only"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleSaveMembershipPlan} disabled={plansSaving || !planForm.name || !planForm.price} className="gap-1.5">
                                    {plansSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</> : 'Save'}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelPlanForm}>
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div key={plan.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                                <div>
                                  <span className="text-sm font-medium">₹{plan.price.toLocaleString('en-IN')}</span>
                                  <span className="text-sm text-muted-foreground"> — {plan.name}</span>
                                  {plan.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEditPlan(plan)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    onClick={() => handleDeletePlan(plan.id)}
                                    disabled={plansSaving}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )
                          )}

                          {addingForDuration === duration && (
                            <div className="rounded-md border border-primary/30 bg-muted/30 p-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Name</Label>
                                  <Input
                                    className="h-8 text-sm"
                                    value={planForm.name}
                                    onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Basic (No Cardio)"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Price (₹)</Label>
                                  <Input
                                    className="h-8 text-sm"
                                    type="number"
                                    min="0"
                                    value={planForm.price}
                                    onChange={(e) => setPlanForm((f) => ({ ...f, price: e.target.value }))}
                                    placeholder="500"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Description</Label>
                                <Input
                                  className="h-8 text-sm"
                                  value={planForm.description}
                                  onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))}
                                  placeholder="Access to weights and machines only"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveMembershipPlan} disabled={plansSaving || !planForm.name || !planForm.price} className="gap-1.5">
                                  {plansSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</> : 'Add Plan'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelPlanForm}>
                                  <X className="h-3.5 w-3.5 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {addingForDuration !== duration && !editingPlan && (
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => startAddPlan(duration)}>
                              <Plus className="h-3.5 w-3.5" />
                              Add Plan
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── RECORD PAYMENT DIALOG ─── */}
      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a collected payment from a member.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={recordMemberId}
                onChange={(e) => setRecordMemberId(e.target.value)}
              >
                <option value="">Select member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email || m.phone || m.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  value={recordAmount}
                  onChange={(e) => setRecordAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={recordMethod}
                  onChange={(e) => setRecordMethod(e.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as any)}
                >
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subscription plan fields */}
            {recordType === 'subscription' && (
              <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground uppercase">Subscription Details</p>
                <div className="space-y-2">
                  <Label className="text-xs">Duration</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={recordPlan}
                    onChange={(e) => { setRecordPlan(e.target.value); setRecordPlanName('') }}
                  >
                    <option value="">Select duration</option>
                    <option value="1_month">1 Month</option>
                    <option value="3_months">3 Months</option>
                    <option value="6_months">6 Months</option>
                    <option value="1_year">1 Year</option>
                  </select>
                </div>

                {recordPlan && getPlansForDuration(recordPlan).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">Plan Variant</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={recordPlanName}
                      onChange={(e) => {
                        setRecordPlanName(e.target.value)
                        const plan = getPlansForDuration(recordPlan).find(p => p.name === e.target.value)
                        if (plan) setRecordAmount(String(plan.price))
                      }}
                    >
                      <option value="">No specific plan</option>
                      {getPlansForDuration(recordPlan).map((p) => (
                        <option key={p.id} value={p.name}>
                          ₹{p.price.toLocaleString('en-IN')} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Start Date</Label>
                  <DatePicker
                    value={recordStartDate}
                    onChange={(val) => setRecordStartDate(val)}
                  />
                </div>

                {recordPlan && recordStartDate && (() => {
                  const endStr = calculateEndDate(recordStartDate, recordPlan)
                  if (!endStr) return null
                  const endFormatted = new Date(endStr + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  return (
                    <p className="text-xs text-muted-foreground">
                      End date: <strong>{endFormatted}</strong>
                    </p>
                  )
                })()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <DatePicker
                  value={recordDate}
                  onChange={(val) => setRecordDate(val)}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={recordTime}
                  onChange={(e) => setRecordTime(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Monthly subscription fee"
                value={recordDescription}
                onChange={(e) => setRecordDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={!recordMemberId || !recordAmount || recordSubmitting}
              className="gap-1.5"
            >
              {recordSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Recording...</>
              ) : (
                'Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
