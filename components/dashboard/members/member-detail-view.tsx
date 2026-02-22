'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Member, CheckIn, Payment } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Mail, Phone, Calendar, Ruler, Weight, ShieldAlert, Heart, IndianRupee, MessageCircle, Ban, CreditCard, Clock } from 'lucide-react'
import { blacklistMember, unblacklistMember } from '@/lib/actions/blacklist'

interface MemberDetailViewProps {
  member: Member
  checkIns: CheckIn[]
  payments: Payment[]
}

export function MemberDetailView({ member, checkIns, payments }: MemberDetailViewProps) {
  const router = useRouter()
  const [blacklistLoading, setBlacklistLoading] = useState(false)
  const [isBlacklisted, setIsBlacklisted] = useState(member.is_blacklisted ?? false)

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
        else alert('Failed: ' + result.error)
      } else {
        const reason = prompt('Enter reason for blacklisting this member:')
        if (!reason) { setBlacklistLoading(false); return }
        const result = await blacklistMember(member.id, reason)
        if (result.success) setIsBlacklisted(true)
        else alert('Failed: ' + result.error)
      }
    } catch {
      alert('An error occurred')
    } finally {
      setBlacklistLoading(false)
    }
  }

  const formatPlanLabel = (plan: string | null) => {
    const labels: Record<string, string> = {
      '1_month': '1 Month',
      '3_months': '3 Months',
      '6_months': '6 Months',
      '1_year': '1 Year',
      'custom': 'Custom',
    }
    return plan ? labels[plan] || plan : '—'
  }

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
        <Button asChild>
          <Link href="/dashboard/payments">
            <IndianRupee className="mr-2 h-4 w-4" />
            Record Payment
          </Link>
        </Button>

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

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Info
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                {member.subscription_start_date ? new Date(member.subscription_start_date).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="text-sm font-medium text-foreground">
                {member.subscription_end_date ? new Date(member.subscription_end_date).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
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
            <Link href="/dashboard/payments">View All</Link>
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
                        {new Date(payment.payment_date).toLocaleDateString()}
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
