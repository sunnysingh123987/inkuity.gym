'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Gym, QRCode as QRCodeType, GymReviewWithMember, FeedbackRequestWithMember } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  ArrowRight,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Activity,
  Calendar,
  Users,
  Zap,
  Clock,
  MessageCircle,
  MessageSquare,
  Star,
} from 'lucide-react'
import { FeedbackResponses } from '@/components/dashboard/feedback/feedback-responses'

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
  todayCheckIns: number
  monthCheckIns: number
  weekCheckIns: number
  newMembersThisMonth: number
  workoutSessions: { focus: string; count: number }[]
  todayCollection: number
  monthCollection: number
  lastMonthCollection: number
  paymentsDue: number
  currency: string
  liveCheckIns: {
    id: string
    check_in_at: string
    member: {
      id: string
      full_name: string | null
      phone: string | null
      avatar_url: string | null
      membership_status: string
    } | null
  }[]
  recentReviews?: GymReviewWithMember[]
  feedbackRequests?: FeedbackRequestWithMember[]
}

export function DashboardOverview({
  gym,
  userName,
  analytics,
  recentMembers,
  totalMembers,
  memberStatusBreakdown,
  todayCheckIns,
  monthCheckIns,
  weekCheckIns,
  newMembersThisMonth,
  workoutSessions,
  todayCollection,
  monthCollection,
  lastMonthCollection,
  paymentsDue,
  currency,
  liveCheckIns,
  recentReviews = [],
  feedbackRequests = [],
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

      {/* Stats Grid - 4 cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MembersPieStatCard
          totalMembers={totalMembers}
          breakdown={memberStatusBreakdown}
        />
        <CollectionCard
          todayCollection={todayCollection}
          monthCollection={monthCollection}
          lastMonthCollection={lastMonthCollection}
          paymentsDue={paymentsDue}
          currency={currency}
        />
        <WorkoutSessionsCard sessions={workoutSessions} todayCheckIns={todayCheckIns} />
        <CheckInMetricsCard
          todayCheckIns={todayCheckIns}
          weekCheckIns={weekCheckIns}
          monthCheckIns={monthCheckIns}
          totalCheckIns={analytics.totalScans}
        />
      </div>

      {/* Today's Live Check-ins */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Today&apos;s Check-ins</CardTitle>
            <span className="inline-flex items-center rounded-full bg-brand-cyan-500/10 px-2 py-0.5 text-xs font-medium text-brand-cyan-400 ring-1 ring-inset ring-brand-cyan-500/20">
              {liveCheckIns.length}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {liveCheckIns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No check-ins yet today</p>
              <p className="text-xs text-muted-foreground mt-1">
                Members will appear here as they check in.
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-border pr-1">
              {liveCheckIns.map((checkIn) => {
                const member = checkIn.member
                const name = member?.full_name || 'Unknown Member'
                const initial = name[0].toUpperCase()
                const time = new Date(checkIn.check_in_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const phone = member?.phone
                const whatsappLink = phone
                  ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
                  : null

                return (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      {member?.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-cyan-500/10 text-sm font-medium text-brand-cyan-400">
                          {initial}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member && (
                        <StatusBadge status={member.membership_status} />
                      )}
                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-green-500 hover:bg-green-500/10 transition-colors"
                          title={`WhatsApp ${name}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Feedback Responses */}
      {feedbackRequests.length > 0 && (
        <FeedbackResponses feedbackRequests={feedbackRequests} />
      )}

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Recent Reviews</CardTitle>
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                {(recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length).toFixed(1)} avg
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {recentReviews.map((review) => {
                const name = review.member?.full_name || 'Unknown Member'
                const initial = name[0].toUpperCase()
                const date = new Date(review.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })

                return (
                  <div key={review.id} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        {review.member?.avatar_url ? (
                          <img
                            src={review.member.avatar_url}
                            alt={name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-cyan-500/10 text-sm font-medium text-brand-cyan-400">
                            {initial}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-transparent text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{date}</span>
                    </div>
                    {review.review_text && (
                      <p className="text-xs text-muted-foreground ml-11 line-clamp-2">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ─── Members Donut Chart Card ──────────────────────────────────────── */

function MembersPieStatCard({
  totalMembers,
  breakdown,
}: {
  totalMembers: number
  breakdown: { active: number; trial: number; inactive: number }
}) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null)
  const total = breakdown.active + breakdown.trial + breakdown.inactive
  const activePercent = total > 0 ? (breakdown.active / total) * 100 : 0
  const trialPercent = total > 0 ? (breakdown.trial / total) * 100 : 0
  const inactivePercent = total > 0 ? (breakdown.inactive / total) * 100 : 0

  const radius = 70
  const strokeWidth = 20
  const size = 200
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  const segments = [
    {
      key: 'active',
      label: 'Active',
      count: breakdown.active,
      percent: activePercent,
      color: '#22c55e',
      glowColor: 'rgba(34, 197, 94, 0.3)',
    },
    {
      key: 'trial',
      label: 'Trial',
      count: breakdown.trial,
      percent: trialPercent,
      color: '#06b6d4',
      glowColor: 'rgba(6, 182, 212, 0.3)',
    },
    {
      key: 'inactive',
      label: 'Inactive',
      count: breakdown.inactive,
      percent: inactivePercent,
      color: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.3)',
    },
  ]

  let cumulativePercent = 0

  const handleSegmentInteraction = (key: string) => {
    setActiveSegment((prev) => (prev === key ? null : key))
  }

  const activeData = activeSegment
    ? segments.find((s) => s.key === activeSegment)
    : null

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="flex flex-col items-center pt-5 pb-4 px-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">All members</p>

        {/* Circular Chart */}
        <div className="relative">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="drop-shadow-lg"
          >
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              opacity={0.3}
            />

            {segments.map((segment) => {
              if (segment.count === 0) return null
              const dashLength = (segment.percent / 100) * circumference
              const gapLength = circumference - dashLength
              const offset = -(cumulativePercent / 100) * circumference
              cumulativePercent += segment.percent

              const isActive = activeSegment === segment.key
              const isOtherActive =
                activeSegment !== null && activeSegment !== segment.key

              return (
                <circle
                  key={segment.key}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={isActive ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={`${dashLength} ${gapLength}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${center} ${center})`}
                  className="transition-all duration-500 ease-out cursor-pointer"
                  opacity={isOtherActive ? 0.3 : 1}
                  filter={isActive ? `drop-shadow(0 0 6px ${segment.glowColor})` : undefined}
                  onMouseEnter={() => setActiveSegment(segment.key)}
                  onMouseLeave={() => setActiveSegment(null)}
                  onClick={() => handleSegmentInteraction(segment.key)}
                />
              )
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {activeData ? (
              <div className="flex flex-col items-center animate-in fade-in duration-200">
                <span
                  className="text-3xl font-bold tabular-nums"
                  style={{ color: activeData.color }}
                >
                  {activeData.count}
                </span>
                <span className="text-xs font-medium text-muted-foreground mt-0.5">
                  {activeData.label}
                </span>
                <span
                  className="text-[10px] font-medium mt-0.5"
                  style={{ color: activeData.color }}
                >
                  {activeData.percent.toFixed(0)}%
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {totalMembers}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {segments.map((segment) => (
            <button
              key={segment.key}
              className={`flex items-center gap-1.5 text-xs transition-opacity duration-200 ${
                activeSegment && activeSegment !== segment.key
                  ? 'opacity-40'
                  : 'opacity-100'
              }`}
              onMouseEnter={() => setActiveSegment(segment.key)}
              onMouseLeave={() => setActiveSegment(null)}
              onClick={() => handleSegmentInteraction(segment.key)}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-muted-foreground font-medium">
                {segment.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Collection Card ───────────────────────────────────────────────── */

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '\u20B9',
  EUR: '\u20AC',
  GBP: '\u00A3',
}

function formatAmount(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' '
  return `${symbol}${amount.toLocaleString()}/-`
}

function CollectionCard({
  todayCollection,
  monthCollection,
  lastMonthCollection,
  paymentsDue,
  currency,
}: {
  todayCollection: number
  monthCollection: number
  lastMonthCollection: number
  paymentsDue: number
  currency: string
}) {
  const monthChange = lastMonthCollection > 0
    ? ((monthCollection - lastMonthCollection) / lastMonthCollection) * 100
    : 0

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="pt-5 pb-4 px-5 flex flex-col justify-center h-full space-y-5">
        {/* Today's Collection */}
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground">Today&apos;s Collection</p>
          <p className="text-2xl font-bold tabular-nums mt-1">
            {formatAmount(todayCollection, currency)}
          </p>
        </div>

        <div className="border-t border-border" />

        {/* This Month Collection */}
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground">This Month Collection</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-2xl font-bold tabular-nums">
              {formatAmount(monthCollection, currency)}
            </span>
            {monthChange !== 0 && (
              <span className={`text-xs font-medium flex items-center gap-0.5 ${
                monthChange > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {monthChange > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                ({monthChange > 0 ? '+' : ''}{monthChange.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Payments Due */}
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground">Payments Due This Month</p>
          <p className="text-2xl font-bold tabular-nums mt-1">
            {formatAmount(paymentsDue, currency)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Today's Workout Sessions Card ─────────────────────────────────── */

const WORKOUT_COLORS: Record<string, string> = {
  chest: '#ef4444',
  back: '#3b82f6',
  shoulders: '#f59e0b',
  arms: '#8b5cf6',
  legs: '#22c55e',
  core: '#ec4899',
  cardio: '#f97316',
  'full-body': '#06b6d4',
}

const WORKOUT_ICONS: Record<string, typeof Dumbbell> = {
  chest: Dumbbell,
  back: Activity,
  shoulders: Dumbbell,
  arms: Dumbbell,
  legs: Zap,
  core: Activity,
  cardio: Activity,
  'full-body': Dumbbell,
}

function WorkoutSessionsCard({
  sessions,
  todayCheckIns,
}: {
  sessions: { focus: string; count: number }[]
  todayCheckIns: number
}) {
  const maxCount = sessions.length > 0 ? Math.max(...sessions.map((s) => s.count)) : 1

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="pt-5 pb-4 px-5 h-full flex flex-col">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Today&apos;s Workout Sessions
        </p>

        {sessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
            <Dumbbell className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No workout data yet today</p>
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            {sessions.map((session) => {
              const Icon = WORKOUT_ICONS[session.focus] || Dumbbell
              const color = WORKOUT_COLORS[session.focus] || '#6b7280'
              const barWidth = (session.count / maxCount) * 100

              return (
                <div key={session.focus} className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div
                      className="h-6 rounded-md flex items-center px-2 text-xs font-medium text-white transition-all duration-500"
                      style={{
                        width: `${Math.max(barWidth, 20)}%`,
                        backgroundColor: color,
                      }}
                    >
                      {session.focus}
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground shrink-0 w-5 text-right">
                    {session.count}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Check-in Metrics Card ─────────────────────────────────────────── */

function CheckInMetricsCard({
  todayCheckIns,
  weekCheckIns,
  monthCheckIns,
  totalCheckIns,
}: {
  todayCheckIns: number
  weekCheckIns: number
  monthCheckIns: number
  totalCheckIns: number
}) {
  const metrics = [
    { label: 'Today', value: todayCheckIns, icon: TrendingUp, color: 'text-brand-cyan-400' },
    { label: 'This Week', value: weekCheckIns, icon: BarChart3, color: 'text-brand-purple-400' },
    { label: 'This Month', value: monthCheckIns, icon: Calendar, color: 'text-brand-pink-400' },
    { label: 'All Time', value: totalCheckIns, icon: Users, color: 'text-green-400' },
  ]

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="pt-5 pb-4 px-5 h-full flex flex-col">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Check-in Metrics
        </p>

        <div className="flex-1 space-y-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-sm text-muted-foreground">{metric.label}</span>
              </div>
              <span className="text-sm font-bold tabular-nums">{metric.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Status Badge ──────────────────────────────────────────────────── */

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
