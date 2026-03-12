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
  Calendar,
  Users,
  Zap,
  Clock,
  MessageCircle,
  Star,
} from 'lucide-react'
import { FeedbackResponses } from '@/components/dashboard/feedback/feedback-responses'
import { type DashboardWidgetSettings } from '@/lib/dashboard-settings'
import { Badge } from '@/components/ui/badge'
import { updateMember } from '@/lib/actions/gyms'
import { toast } from '@/components/ui/toaster'

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
  workoutSessions?: { focus: string; count: number }[]
  todayCollection: number
  monthCollection: number
  lastMonthCollection: number
  paymentsDue: number
  currency: string
  liveCheckIns: {
    id: string
    check_in_at: string
    check_out_at?: string | null
    member: {
      id: string
      full_name: string | null
      phone: string | null
      avatar_url: string | null
      membership_status: string
      subscription_end_date?: string | null
    } | null
    streak?: number
    daysLeft?: number | null
  }[]
  inGymNow?: number
  financeSummary?: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    staffSalaryTotal: number
  }
  lastMonthFinanceSummary?: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    staffSalaryTotal: number
  }
  recentReviews?: GymReviewWithMember[]
  feedbackRequests?: FeedbackRequestWithMember[]
  dashboardSettings?: DashboardWidgetSettings
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
  inGymNow = 0,
  financeSummary,
  lastMonthFinanceSummary,
  recentReviews = [],
  feedbackRequests = [],
  dashboardSettings,
}: DashboardOverviewProps) {
  const widgets = dashboardSettings || {
    statsCards: true,
    liveCheckIns: true,
    recentMembers: true,
    paymentSummary: true,
    workoutSessions: true,
    reviews: true,
    feedback: true,
  }
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
      {widgets.statsCards && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MembersPieStatCard
            totalMembers={totalMembers}
            breakdown={memberStatusBreakdown}
          />
          {widgets.paymentSummary && (
            <CollectionCard
              todayCollection={todayCollection}
              monthCollection={monthCollection}
              lastMonthCollection={lastMonthCollection}
              paymentsDue={paymentsDue}
              currency={currency}
            />
          )}
          {financeSummary && (
            <FinanceMetricsCard
              financeSummary={financeSummary}
              lastMonthFinanceSummary={lastMonthFinanceSummary}
              currency={currency}
            />
          )}
          <CheckInMetricsCard
            todayCheckIns={todayCheckIns}
            weekCheckIns={weekCheckIns}
            monthCheckIns={monthCheckIns}
            totalCheckIns={analytics.totalScans}
            inGymNow={inGymNow}
          />
        </div>
      )}

      {/* Today's Live Check-ins */}
      {widgets.liveCheckIns && <Card>
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
            <div className="max-h-96 overflow-y-auto divide-y divide-border pr-1">
              {liveCheckIns.map((checkIn) => {
                const member = checkIn.member
                const name = member?.full_name || 'Unknown Member'
                const initial = name[0].toUpperCase()
                const time = new Date(checkIn.check_in_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const isStillIn = !checkIn.check_out_at
                const phone = member?.phone
                const whatsappLink = phone
                  ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
                  : null
                const streak = checkIn.streak || 0
                const daysLeft = checkIn.daysLeft

                return (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between py-3 gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {member?.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={name}
                          className="h-9 w-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-cyan-500/10 text-sm font-medium text-brand-cyan-400 shrink-0">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                          </span>
                          {isStillIn ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                              In gym
                            </span>
                          ) : (
                            <span className="text-slate-500">Left</span>
                          )}
                          {streak > 0 && (
                            <span className="flex items-center gap-1 text-amber-400">
                              <Zap className="h-3 w-3" />
                              {streak}d streak
                            </span>
                          )}
                          {daysLeft != null && (
                            <span className={`${daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                              {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Expires today' : 'Expired'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {member && (
                        <StatusBadge status={member.membership_status} />
                      )}
                      {member?.membership_status === 'trial' && (
                        <TrialStatusButton memberId={member.id} memberName={name} />
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
      </Card>}

      {/* Recent Members */}
      {widgets.recentMembers && <Card>
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
      </Card>}

      {/* Feedback Responses */}
      {widgets.feedback && feedbackRequests.length > 0 && (
        <FeedbackResponses feedbackRequests={feedbackRequests} />
      )}

      {/* Recent Reviews */}
      {widgets.reviews && recentReviews.length > 0 && (
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

/* ─── Finance Metrics Card ──────────────────────────────────────────── */

function FinanceMetricsCard({
  financeSummary,
  lastMonthFinanceSummary,
  currency,
}: {
  financeSummary: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    staffSalaryTotal: number
  }
  lastMonthFinanceSummary?: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    staffSalaryTotal: number
  }
  currency: string
}) {
  const lastPnl = lastMonthFinanceSummary?.netProfit || 0
  const pnlChange = lastPnl !== 0
    ? ((financeSummary.netProfit - lastPnl) / Math.abs(lastPnl)) * 100
    : 0

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="pt-5 pb-4 px-5 flex flex-col justify-center h-full space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Monthly P&amp;L
        </p>

        {/* Net Profit */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Net Profit</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`text-2xl font-bold tabular-nums ${financeSummary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatAmount(financeSummary.netProfit, currency)}
            </span>
            {pnlChange !== 0 && (
              <span className={`text-xs font-medium flex items-center gap-0.5 ${pnlChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pnlChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {pnlChange > 0 ? '+' : ''}{pnlChange.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Revenue vs Expenses */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Revenue</p>
            <p className="text-sm font-bold text-green-400 tabular-nums">
              {formatAmount(financeSummary.totalRevenue, currency)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Expenses</p>
            <p className="text-sm font-bold text-red-400 tabular-nums">
              {formatAmount(financeSummary.totalExpenses, currency)}
            </p>
          </div>
        </div>

        {financeSummary.staffSalaryTotal > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Staff Salaries</p>
              <p className="text-sm font-bold text-amber-400 tabular-nums">
                {formatAmount(financeSummary.staffSalaryTotal, currency)}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Trial Status Button ──────────────────────────────────────────── */

function TrialStatusButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [updating, setUpdating] = useState(false)

  const handleActivate = async () => {
    setUpdating(true)
    const result = await updateMember(memberId, { membership_status: 'active' })
    if (result.success) {
      toast.success(`${memberName} activated`)
    } else {
      toast.error(result.error || 'Failed to update status')
    }
    setUpdating(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs gap-1 text-brand-cyan-400 border-brand-cyan-500/30 hover:bg-brand-cyan-500/10"
      onClick={handleActivate}
      disabled={updating}
    >
      {updating ? '...' : 'Activate'}
    </Button>
  )
}

/* ─── Check-in Metrics Card ─────────────────────────────────────────── */

function CheckInMetricsCard({
  todayCheckIns,
  weekCheckIns,
  monthCheckIns,
  totalCheckIns,
  inGymNow = 0,
}: {
  todayCheckIns: number
  weekCheckIns: number
  monthCheckIns: number
  totalCheckIns: number
  inGymNow?: number
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

        {/* In Gym Now - prominent display */}
        {inGymNow > 0 && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-sm font-medium text-green-400">In Gym Now</span>
            </div>
            <span className="text-lg font-bold tabular-nums text-green-400">{inGymNow}</span>
          </div>
        )}

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
