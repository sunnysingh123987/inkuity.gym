'use client'

import Link from 'next/link'
import { Gym, QRCode as QRCodeType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Scan,
  TrendingUp,
  BarChart3,
  ArrowRight,
  UserPlus,
} from 'lucide-react'

interface DashboardOverviewProps {
  gym: Gym | null
  userName: string
  qrCodes: QRCodeType[]
  analytics: {
    totalScans: number
    uniqueVisitors: number
    todayScans: number
    weekScans: number
    topQRCode: { name: string; scans: number } | null
  }
  recentMembers: {
    id: string
    full_name: string | null
    email: string | null
    membership_status: string
    created_at: string
  }[]
  totalMembers: number
  memberStatusBreakdown: { active: number; trial: number; inactive: number }
}

export function DashboardOverview({
  gym,
  userName,
  qrCodes,
  analytics,
  recentMembers,
  totalMembers,
  memberStatusBreakdown,
}: DashboardOverviewProps) {
  const firstName = userName.split(' ')[0]

  if (!gym) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {firstName ? `Welcome, ${firstName}!` : 'Welcome!'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Something went wrong loading your gym. Please try refreshing.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening at <span className="font-medium text-foreground">{gym.name}</span>
          </p>
        </div>
        <Link href="/analytics">
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MembersPieStatCard
          totalMembers={totalMembers}
          breakdown={memberStatusBreakdown}
        />
        <StatCard
          title="Total Check-ins"
          value={analytics.totalScans.toLocaleString()}
          description="All time"
          icon={Scan}
          color="text-brand-purple-500"
        />
        <StatCard
          title="Today"
          value={analytics.todayScans.toLocaleString()}
          description="Check-ins today"
          icon={TrendingUp}
          color="text-brand-pink-500"
        />
        <StatCard
          title="This Week"
          value={analytics.weekScans.toLocaleString()}
          description="Last 7 days"
          icon={BarChart3}
          color="text-brand-blue-600"
        />
      </div>

      {/* Recent Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Members</CardTitle>
          <Link href="/members">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <UserPlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No members yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Members will appear here when they check in via your QR code.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentMembers.map((member) => (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="flex items-center justify-between py-3 hover:opacity-70 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-cyan-500/10 text-sm font-medium text-brand-cyan-400">
                      {(member.full_name || member.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.full_name || member.email || 'Unknown'}
                      </p>
                      {member.full_name && member.email && (
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={member.membership_status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MembersPieStatCard({
  totalMembers,
  breakdown,
}: {
  totalMembers: number
  breakdown: { active: number; trial: number; inactive: number }
}) {
  const total = breakdown.active + breakdown.trial + breakdown.inactive
  const activePercent = total > 0 ? (breakdown.active / total) * 100 : 0
  const trialPercent = total > 0 ? (breakdown.trial / total) * 100 : 0
  const inactivePercent = total > 0 ? (breakdown.inactive / total) * 100 : 0

  // SVG donut chart calculations
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const activeOffset = 0
  const trialOffset = (activePercent / 100) * circumference
  const inactiveOffset = ((activePercent + trialPercent) / 100) * circumference

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          Total Members
        </CardTitle>
        <Users className="h-4 w-4 text-brand-cyan-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold">{totalMembers.toLocaleString()}</div>
          {total > 0 && (
            <svg width="36" height="36" viewBox="0 0 40 40" className="shrink-0">
              <circle cx="20" cy="20" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              {breakdown.active > 0 && (
                <circle
                  cx="20" cy="20" r={radius}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="6"
                  strokeDasharray={`${(activePercent / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-activeOffset}
                  transform="rotate(-90 20 20)"
                  className="transition-all duration-700"
                />
              )}
              {breakdown.trial > 0 && (
                <circle
                  cx="20" cy="20" r={radius}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="6"
                  strokeDasharray={`${(trialPercent / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-trialOffset}
                  transform="rotate(-90 20 20)"
                  className="transition-all duration-700"
                />
              )}
              {breakdown.inactive > 0 && (
                <circle
                  cx="20" cy="20" r={radius}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="6"
                  strokeDasharray={`${(inactivePercent / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-inactiveOffset}
                  transform="rotate(-90 20 20)"
                  className="transition-all duration-700"
                />
              )}
            </svg>
          )}
        </div>
        <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            {breakdown.active}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-500" />
            {breakdown.trial}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            {breakdown.inactive}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  description: string
  icon: any
  color: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400 ring-green-500/20',
    trial: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
    expired: 'bg-red-500/10 text-red-400 ring-red-500/20',
    suspended: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
    cancelled: 'bg-muted text-muted-foreground ring-border',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        styles[status] || styles.pending
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
