'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Gym, Member } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Search, Mail, Phone, Calendar, TrendingUp, Clock, Edit } from 'lucide-react'
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
  calculatedStatus?: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending';
  gym?: {
    name: string;
  };
}

export function MembersList({ gyms }: MembersListProps) {
  const [members, setMembers] = useState<MemberWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      // Get all members for all gyms owned by the current user
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

  const filteredMembers = members.filter(member =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800',
      pending: 'bg-blue-100 text-blue-800',
    }
    return variants[status as keyof typeof variants] || variants.pending
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No members yet</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gym
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workout Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.gym?.name || 'Unknown Gym'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusBadge(member.calculatedStatus || member.membership_status)}>
                        {member.calculatedStatus || member.membership_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.subscription_plan ?
                          member.subscription_plan.replace('_', ' ').toUpperCase() :
                          'Not Set'
                        }
                      </div>
                      {member.subscription_end_date && (
                        <div className="text-sm text-gray-500">
                          Ends: {new Date(member.subscription_end_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{member.stats?.totalWorkoutDays || 0}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.stats?.totalCheckIns || 0} total check-ins
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.stats?.lastCheckIn ?
                          new Date(member.stats.lastCheckIn).toLocaleDateString() :
                          'Never'
                        }
                      </div>
                      {member.stats?.averageSessionDuration && member.stats.averageSessionDuration > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {Math.round(member.stats.averageSessionDuration)}min avg
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/members/${member.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
