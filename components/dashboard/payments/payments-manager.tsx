'use client'

import { useState } from 'react'
import { Member } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Search, MessageCircle, ChevronDown, ChevronUp, CreditCard } from 'lucide-react'
import { updateMember } from '@/lib/actions/gyms'
import { toast } from 'sonner'

interface PaymentsManagerProps {
  members: Member[]
}

const PLAN_DURATIONS: Record<string, number> = {
  '1_month': 30,
  '3_months': 90,
  '6_months': 180,
  '1_year': 365,
}

export function PaymentsManager({ members: initialMembers }: PaymentsManagerProps) {
  const [members, setMembers] = useState(initialMembers)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  // Plan update state per member
  const [planData, setPlanData] = useState<Record<string, { plan: string; startDate: string }>>({})

  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase()
    return (
      m.full_name?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.phone?.includes(term) ||
      m.metadata?.member_id?.toLowerCase().includes(term)
    )
  })

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
          },
        }))
      }
    }
  }

  const calculateEndDate = (startDate: string, plan: string): string => {
    if (!startDate || !plan || !PLAN_DURATIONS[plan]) return ''
    const start = new Date(startDate)
    start.setDate(start.getDate() + PLAN_DURATIONS[plan])
    return start.toISOString().split('T')[0]
  }

  const handleSavePlan = async (memberId: string) => {
    const data = planData[memberId]
    if (!data?.plan || !data?.startDate) return

    setSaving(memberId)
    const endDate = calculateEndDate(data.startDate, data.plan)

    const result = await updateMember(memberId, {
      subscription_plan: data.plan as any,
      subscription_start_date: data.startDate,
      subscription_end_date: endDate,
      membership_status: 'active',
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

  const getWhatsAppLink = (phone: string | null) => {
    if (!phone) return null
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return null
    return `https://wa.me/${digits}`
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone, or member ID..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredMembers.map((member) => {
                    const whatsAppLink = getWhatsAppLink(member.phone)
                    const isExpanded = expandedId === member.id
                    const memberPlan = planData[member.id]

                    return (
                      <tr key={member.id} className="hover:bg-muted">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{member.full_name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{member.email || '—'}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{member.phone || '—'}</td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusBadge(member.membership_status)}>
                            {member.membership_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {member.subscription_plan?.replace('_', ' ').toUpperCase() || 'Not Set'}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {member.subscription_end_date
                            ? new Date(member.subscription_end_date).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleExpand(member.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span className="ml-1">Update Plan</span>
                            </Button>
                            {whatsAppLink && (
                              <a href={whatsAppLink} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="text-green-500 border-green-500/30 hover:bg-green-500/10">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                          </div>

                          {/* Expandable Plan Update */}
                          {isExpanded && memberPlan && (
                            <div className="mt-3 p-3 rounded-lg border border-border bg-muted/50 space-y-3">
                              <div className="space-y-2">
                                <Label className="text-xs">Plan</Label>
                                <select
                                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                  value={memberPlan.plan}
                                  onChange={(e) =>
                                    setPlanData((prev) => ({
                                      ...prev,
                                      [member.id]: { ...prev[member.id], plan: e.target.value },
                                    }))
                                  }
                                >
                                  <option value="">Select plan</option>
                                  <option value="1_month">1 Month</option>
                                  <option value="3_months">3 Months</option>
                                  <option value="6_months">6 Months</option>
                                  <option value="1_year">1 Year</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Start Date</Label>
                                <Input
                                  type="date"
                                  className="h-9"
                                  value={memberPlan.startDate}
                                  onChange={(e) =>
                                    setPlanData((prev) => ({
                                      ...prev,
                                      [member.id]: { ...prev[member.id], startDate: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                              {memberPlan.plan && memberPlan.startDate && (
                                <p className="text-xs text-muted-foreground">
                                  End date: {calculateEndDate(memberPlan.startDate, memberPlan.plan)}
                                </p>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleSavePlan(member.id)}
                                disabled={!memberPlan.plan || !memberPlan.startDate || saving === member.id}
                              >
                                {saving === member.id ? 'Saving...' : 'Save Plan'}
                              </Button>
                            </div>
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
  )
}
