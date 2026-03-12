'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Member, CheckIn, Payment, Gym, MembershipPlan } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ArrowLeft, User, Mail, Phone, Calendar, Ruler, Weight, ShieldAlert, Heart, IndianRupee, MessageCircle, Ban, CreditCard, Clock, Pencil, Save, Loader2, X } from 'lucide-react'
import { blacklistMember, unblacklistMember } from '@/lib/actions/blacklist'
import { updateMember } from '@/lib/actions/gyms'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from '@/components/ui/toaster'

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

interface MemberDetailViewProps {
  member: Member
  checkIns: CheckIn[]
  payments: Payment[]
  gym: Gym | null
}

export function MemberDetailView({ member: initialMember, checkIns, payments, gym }: MemberDetailViewProps) {
  const router = useRouter()
  const [member, setMember] = useState(initialMember)
  const [blacklistLoading, setBlacklistLoading] = useState(false)
  const [isBlacklisted, setIsBlacklisted] = useState(member.is_blacklisted ?? false)

  // Membership editing
  const [editingMembership, setEditingMembership] = useState(false)
  const [membershipSaving, setMembershipSaving] = useState(false)
  const [editPlan, setEditPlan] = useState(member.subscription_plan || '')
  const [editStartDate, setEditStartDate] = useState(() => {
    const d = member.subscription_start_date
    return d ? new Date(d).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  })
  const [editPlanName, setEditPlanName] = useState(member.metadata?.plan_name || '')

  const membershipPlans: MembershipPlan[] = (gym?.settings?.membership_plans as MembershipPlan[]) || []

  const getPlansForDuration = (duration: string) =>
    membershipPlans.filter((p) => p.duration === duration)

  const calculateEndDate = (startDate: string, plan: string): string => {
    if (!startDate || !plan || !PLAN_MONTHS[plan]) return ''
    const start = new Date(startDate)
    start.setMonth(start.getMonth() + PLAN_MONTHS[plan])
    return start.toISOString().split('T')[0]
  }

  const handleSaveMembership = async () => {
    if (!editPlan || !editStartDate) {
      toast.error('Please select a plan and start date')
      return
    }

    setMembershipSaving(true)
    const endDate = calculateEndDate(editStartDate, editPlan)
    const updatedMetadata = { ...(member.metadata || {}), plan_name: editPlanName || null }

    const result = await updateMember(member.id, {
      subscription_plan: editPlan as any,
      subscription_start_date: editStartDate,
      subscription_end_date: endDate,
      membership_status: 'active',
      metadata: updatedMetadata,
    })

    if (result.success) {
      setMember({
        ...member,
        subscription_plan: editPlan as any,
        subscription_start_date: editStartDate,
        subscription_end_date: endDate,
        membership_status: 'active',
        metadata: updatedMetadata,
      })
      setEditingMembership(false)
      toast.success('Membership updated to active')
      router.refresh()
    } else {
      toast.error('Failed to update membership: ' + (result.error || 'Unknown error'))
    }
    setMembershipSaving(false)
  }

  const startEditMembership = () => {
    setEditPlan(member.subscription_plan || '')
    setEditStartDate(
      member.subscription_start_date
        ? new Date(member.subscription_start_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    )
    setEditPlanName(member.metadata?.plan_name || '')
    setEditingMembership(true)
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

  const formatHeight = () => {
    const ft = member.metadata?.height_ft
    const inches = member.metadata?.height_in
    if (ft || inches) return `${ft || 0}' ${inches || 0}"`
    return '—'
  }

  const getWhatsAppUrl = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    return `https://wa.me/${digits}`
  }

  const handleBlacklistToggle = async () => {
    setBlacklistLoading(true)
    try {
      if (isBlacklisted) {
        const result = await unblacklistMember(member.id)
        if (result.success) setIsBlacklisted(false)
        else toast.error('Failed: ' + result.error)
      } else {
        const reason = prompt('Enter reason for blacklisting this member:')
        if (!reason) { setBlacklistLoading(false); return }
        const result = await blacklistMember(member.id, reason)
        if (result.success) setIsBlacklisted(true)
        else toast.error('Failed: ' + result.error)
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setBlacklistLoading(false)
    }
  }

  const formatPlanLabel = (plan: string | null) => {
    return plan ? DURATION_LABELS[plan] || plan : '—'
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const editEndDate = editPlan && editStartDate ? calculateEndDate(editStartDate, editPlan) : ''

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Blacklist Warning Banner */}
      {isBlacklisted && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <Ban className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">This member is blacklisted</p>
            {member.blacklist_reason && (
              <p className="text-xs text-red-400/80 mt-0.5">Reason: {member.blacklist_reason}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Members
        </Button>
        <Badge className={getStatusBadge(member.membership_status)}>
          {member.membership_status}
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {member.phone && (
          <Button variant="outline" asChild className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300">
            <a href={getWhatsAppUrl(member.phone)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </a>
          </Button>
        )}

        <Button
          variant={isBlacklisted ? 'outline' : 'destructive'}
          onClick={handleBlacklistToggle}
          disabled={blacklistLoading}
          className={isBlacklisted ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300' : ''}
        >
          <Ban className="mr-2 h-4 w-4" />
          {blacklistLoading ? 'Processing...' : isBlacklisted ? 'Remove from Blacklist' : 'Blacklist Member'}
        </Button>
      </div>

      {/* Subscription Info — Editable */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Membership
            </CardTitle>
            {!editingMembership && (
              <Button variant="outline" size="sm" onClick={startEditMembership} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingMembership ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Duration</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={editPlan}
                    onChange={(e) => { setEditPlan(e.target.value); setEditPlanName('') }}
                  >
                    <option value="">Select duration</option>
                    {Object.entries(DURATION_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {editPlan && getPlansForDuration(editPlan).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">Plan Variant</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={editPlanName}
                      onChange={(e) => setEditPlanName(e.target.value)}
                    >
                      <option value="">No specific plan</option>
                      {getPlansForDuration(editPlan).map((p) => (
                        <option key={p.id} value={p.name}>
                          ₹{p.price.toLocaleString('en-IN')} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Start Date</Label>
                  <DatePicker
                    value={editStartDate}
                    onChange={(val) => setEditStartDate(val)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">End Date (auto-calculated)</Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                    {editEndDate ? formatDate(editEndDate) : '—'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveMembership} disabled={membershipSaving || !editPlan || !editStartDate} className="gap-1.5">
                  {membershipSaving ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="h-3.5 w-3.5" />Save & Activate</>
                  )}
                </Button>
                <Button variant="ghost" onClick={() => setEditingMembership(false)} className="gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="text-sm font-semibold text-foreground">
                  {member.metadata?.plan_name || formatPlanLabel(member.subscription_plan)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={getStatusBadge(member.membership_status)}>
                  {member.membership_status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(member.subscription_start_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(member.subscription_end_date || member.metadata?.subscription_end_date)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Member Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow icon={User} label="Full Name" value={member.full_name || '—'} />
            <InfoRow icon={Mail} label="Email" value={member.email || '—'} />
            <InfoRow icon={Phone} label="Phone" value={member.phone || '—'} />
            <InfoRow icon={Calendar} label="Date of Birth" value={member.birth_date ? new Date(member.birth_date).toLocaleDateString() : '—'} />
            <InfoRow icon={User} label="Gender" value={member.gender || '—'} />
            <InfoRow icon={Ruler} label="Height" value={formatHeight()} />
            <InfoRow icon={Weight} label="Weight" value={member.metadata?.weight ? `${member.metadata.weight} kg` : '—'} />
          </div>
        </CardContent>
      </Card>

      {/* Emergency & Medical */}
      {(member.metadata?.emergency_contact_name || member.metadata?.emergency_contact_phone || member.metadata?.medical_conditions) && (
        <Card>
          <CardHeader>
            <CardTitle>Emergency & Medical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow icon={ShieldAlert} label="Emergency Contact" value={member.metadata?.emergency_contact_name || '—'} />
              <InfoRow icon={Phone} label="Emergency Phone" value={member.metadata?.emergency_contact_phone || '—'} />
            </div>
            {member.metadata?.medical_conditions && (
              <div className="mt-4 flex items-start gap-3 py-2">
                <Heart className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Medical Conditions</p>
                  <p className="text-sm font-medium text-foreground">{member.metadata.medical_conditions}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Recent Payments
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/payments">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-muted">
                      <td className="px-4 py-3 text-sm text-foreground">
                        <div>{new Date(payment.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                        <div className="text-xs text-muted-foreground">{new Date(payment.payment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {payment.currency === 'INR' ? '₹' : payment.currency} {payment.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground capitalize">
                        {payment.payment_method?.replace(/_/g, ' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={
                          payment.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          payment.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                          payment.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                          'bg-muted text-muted-foreground'
                        }>
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in History */}
      <Card>
        <CardHeader>
          <CardTitle>Check-in History</CardTitle>
        </CardHeader>
        <CardContent>
          {checkIns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No check-ins recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {checkIns.map((checkIn) => (
                    <tr key={checkIn.id} className="hover:bg-muted">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {new Date(checkIn.check_in_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {new Date(checkIn.check_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {checkIn.duration_minutes ? `${checkIn.duration_minutes} min` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {checkIn.tags?.map((tag) => (
                            <span key={tag} className="inline-flex items-center rounded-full bg-brand-cyan-500/10 px-2 py-0.5 text-xs text-brand-cyan-400">
                              {tag}
                            </span>
                          )) || '—'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
