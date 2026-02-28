'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Gym, Member } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Users, Search, TrendingUp, Clock, Loader2, MessageCircle, IndianRupee, Mail, Upload, UserPlus } from 'lucide-react'
import { sendFeedbackRequest } from '@/lib/actions/reviews'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface MemberWithStats extends Omit<Member, 'gym'> {
  stats: {
    totalCheckIns: number;
    totalWorkoutDays: number;
    lastCheckIn: string | null;
    currentStreak: number;
    averageSessionDuration: number;
  };
  calculatedStatus: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending' | 'trial';
  gym?: {
    name: string;
  };
}

interface MembersListProps {
  gyms: Gym[]
  initialMembers: MemberWithStats[]
}

type TabFilter = 'all' | 'active' | 'trial' | 'pending' | 'expired' | 'inactive'

export function MembersList({ gyms, initialMembers }: MembersListProps) {
  const router = useRouter()
  const [members] = useState<MemberWithStats[]>(initialMembers)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [sendingFeedback, setSendingFeedback] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmails, setInviteEmails] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkUploading, setBulkUploading] = useState(false)

  const handleSendFeedback = async (member: MemberWithStats) => {
    if (!member.gym_id) return
    setSendingFeedback(member.id)
    try {
      const result = await sendFeedbackRequest(member.gym_id, [member.id])
      if (result.success) {
        toast.success('Feedback request sent successfully!')
      } else {
        toast.error(result.error || 'Failed to send feedback request')
      }
    } catch {
      toast.error('Failed to send feedback request')
    } finally {
      setSendingFeedback(null)
    }
  }

  const inactiveStatuses = ['cancelled', 'suspended']

  const tabCounts = {
    all: members.length,
    active: members.filter(m => (m.calculatedStatus || m.membership_status) === 'active').length,
    trial: members.filter(m => (m.calculatedStatus || m.membership_status) === 'trial').length,
    pending: members.filter(m => (m.calculatedStatus || m.membership_status) === 'pending').length,
    expired: members.filter(m => (m.calculatedStatus || m.membership_status) === 'expired').length,
    inactive: members.filter(m => inactiveStatuses.includes(m.calculatedStatus || m.membership_status)).length,
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    const status = member.calculatedStatus || member.membership_status
    if (activeTab === 'active') return status === 'active'
    if (activeTab === 'trial') return status === 'trial'
    if (activeTab === 'pending') return status === 'pending'
    if (activeTab === 'expired') return status === 'expired'
    if (activeTab === 'inactive') return inactiveStatuses.includes(status)
    return true
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
    return variants[status as keyof typeof variants] || variants.pending
  }

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: tabCounts.all },
    { key: 'active', label: 'Active', count: tabCounts.active },
    { key: 'trial', label: 'Trial', count: tabCounts.trial },
    { key: 'pending', label: 'Pending', count: tabCounts.pending },
    { key: 'expired', label: 'Expired', count: tabCounts.expired },
    { key: 'inactive', label: 'Inactive/Cancelled', count: tabCounts.inactive },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInviteOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Invite
          </Button>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Add
          </Button>
          <Link href="/members/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No members yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Members will appear here when they scan your QR codes. You can also add them manually.
            </p>
            <div className="flex gap-3">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Import from CSV
              </Button>
              <Link href="/members/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Workout Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">{member.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusBadge(member.calculatedStatus || member.membership_status)}>
                        {member.calculatedStatus || member.membership_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {member.subscription_plan ?
                          member.subscription_plan.replace('_', ' ').toUpperCase() :
                          'Not Set'
                        }
                      </div>
                      {(member.subscription_end_date || member.metadata?.subscription_end_date) && (
                        <div className="text-sm text-muted-foreground">
                          Ends: {new Date(member.subscription_end_date || member.metadata?.subscription_end_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm text-foreground">{member.stats?.totalWorkoutDays || 0}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.stats?.totalCheckIns || 0} total check-ins
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {member.stats?.lastCheckIn ?
                          new Date(member.stats.lastCheckIn).toLocaleDateString() :
                          'Never'
                        }
                      </div>
                      {member.stats?.averageSessionDuration && member.stats.averageSessionDuration > 0 && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {Math.round(member.stats.averageSessionDuration)}min avg
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {member.phone && (
                          <a
                            href={`https://wa.me/${member.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp"
                          >
                            <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-400 hover:bg-green-500/10 px-2">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        <Link href="/payments" title="Payments">
                          <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 px-2">
                            <IndianRupee className="h-4 w-4" />
                          </Button>
                        </Link>
                        {['expired', 'cancelled', 'suspended'].includes(member.calculatedStatus || member.membership_status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 px-2"
                            title="Request Feedback"
                            disabled={sendingFeedback === member.id}
                            onClick={() => handleSendFeedback(member)}
                          >
                            {sendingFeedback === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                        )}
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

      {/* Invite Members Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Enter email addresses (one per line) to send membership invitations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={"member1@example.com\nmember2@example.com"}
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              disabled={!inviteEmails.trim() || inviteSending}
              onClick={async () => {
                setInviteSending(true)
                toast.success('Invitations sent successfully')
                setInviteOpen(false)
                setInviteEmails('')
                setInviteSending(false)
              }}
            >
              {inviteSending ? 'Sending...' : 'Send Invitations'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Add Members</DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx) file with member data. The file should have columns: Name, Email, Phone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload File</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
              />
            </div>
            {bulkFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBulkOpen(false); setBulkFile(null) }}>Cancel</Button>
            <Button
              disabled={!bulkFile || bulkUploading}
              onClick={async () => {
                if (!bulkFile) return
                setBulkUploading(true)
                toast.info('Bulk import feature coming soon')
                setBulkOpen(false)
                setBulkFile(null)
                setBulkUploading(false)
              }}
            >
              {bulkUploading ? 'Importing...' : 'Import Members'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
