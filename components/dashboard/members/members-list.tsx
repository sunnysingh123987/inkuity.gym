'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Gym, Member } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Search, TrendingUp, Clock, Eye, Loader2 } from 'lucide-react'
import { getMembers, calculateMembershipStatus, getMemberStats } from '@/lib/actions/gyms'

interface MembersListProps {
  gyms: Gym[]
}

interface MemberWithStats extends Omit<Member, 'gym'> {
  stats?: {
    totalCheckIns: number;
    totalWorkoutDays: number;
    lastCheckIn: string | null;
    currentStreak: number;
    averageSessionDuration: number;
  };
  calculatedStatus?: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending' | 'trial';
  gym?: {
    name: string;
  };
}

type TabFilter = 'all' | 'active' | 'inactive' | 'trial'

export function MembersList({ gyms }: MembersListProps) {
  const [members, setMembers] = useState<MemberWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabFilter>('all')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const allMembers: MemberWithStats[] = []

      for (const gym of gyms) {
        const { data: membersData } = await getMembers(gym.id)

        if (membersData) {
          const membersWithStats = await Promise.all(
            membersData.map(async (member) => {
              const stats = await getMemberStats(member.id)
              const calculatedStatus = await calculateMembershipStatus(member)
              return {
                ...member,
                stats,
                calculatedStatus,
                gym: member.gym,
              }
            })
          )
          allMembers.push(...membersWithStats);
        }
      }

      setMembers(allMembers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading members:', error);
      setLoading(false);
    }
  }

  const inactiveStatuses = ['expired', 'cancelled', 'suspended']

  const tabCounts = {
    all: members.length,
    active: members.filter(m => (m.calculatedStatus || m.membership_status) === 'active').length,
    trial: members.filter(m => (m.calculatedStatus || m.membership_status) === 'trial').length,
    inactive: members.filter(m => inactiveStatuses.includes(m.calculatedStatus || m.membership_status)).length,
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    const status = member.calculatedStatus || member.membership_status
    if (activeTab === 'active') return status === 'active'
    if (activeTab === 'trial') return status === 'trial'
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-12 bg-muted rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: tabCounts.all },
    { key: 'active', label: 'Active', count: tabCounts.active },
    { key: 'trial', label: 'Trial', count: tabCounts.trial },
    { key: 'inactive', label: 'Inactive', count: tabCounts.inactive },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
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

        <div className="flex gap-3">
          <Button variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Import
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
                    Gym
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
                  <tr key={member.id} className="hover:bg-muted">
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
                      <div className="text-sm text-foreground">{member.gym?.name || 'Unknown Gym'}</div>
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
                      {member.subscription_end_date && (
                        <div className="text-sm text-muted-foreground">
                          Ends: {new Date(member.subscription_end_date).toLocaleDateString()}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/members/${member.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
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
  )
}
