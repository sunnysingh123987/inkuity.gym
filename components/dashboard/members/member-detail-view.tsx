'use client'

import { useRouter } from 'next/navigation'
import { Member, CheckIn } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Mail, Phone, Calendar, Ruler, Weight, ShieldAlert, Heart } from 'lucide-react'

interface MemberDetailViewProps {
  member: Member
  checkIns: CheckIn[]
}

export function MemberDetailView({ member, checkIns }: MemberDetailViewProps) {
  const router = useRouter()

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
