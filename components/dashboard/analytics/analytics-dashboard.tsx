'use client'

import { useState, useEffect, useMemo } from 'react'
import { Gym } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import {
  BarChart3,
  Users,
  TrendingUp,
  Activity,
  Download,
  Calendar,
  Loader2,
  Clock,
  UserPlus,
} from 'lucide-react'
import {
  getCheckInTrends,
  getMemberGrowth,
  getPeakHours,
  getTopMembers,
  getAnalyticsSummary,
  getRetentionMetrics,
} from '@/lib/actions/analytics'
import { transformCheckInTrends, transformMemberGrowth, transformPeakHours } from '@/lib/utils/analytics-data'
import {
  exportToCSV,
  formatCheckInsForExport,
  formatPeakHoursForExport,
  formatTopMembersForExport,
} from '@/lib/utils/export'

interface AnalyticsDashboardProps {
  gyms: Gym[]
}

// Custom tooltip styling for dark theme
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export function AnalyticsDashboard({ gyms }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState('30')
  const [selectedGym, setSelectedGym] = useState(gyms[0]?.id || '')
  const [loading, setLoading] = useState(true)

  // State for analytics data
  const [summary, setSummary] = useState({
    totalCheckIns: 0,
    todayCheckIns: 0,
    weekCheckIns: 0,
    totalMembers: 0,
    activeMembers: 0,
    growthPercentage: 0,
  })
  const [retention, setRetention] = useState({
    retentionRate: 0,
    activeMembers: 0,
    totalMembers: 0,
  })
  const [checkInTrends, setCheckInTrends] = useState<any[]>([])
  const [memberGrowth, setMemberGrowth] = useState<any[]>([])
  const [peakHours, setPeakHours] = useState<any[]>([])
  const [topMembers, setTopMembers] = useState<any[]>([])

  // Compute average daily check-ins from trends
  const avgDailyCheckIns = useMemo(() => {
    if (checkInTrends.length === 0) return 0
    const total = checkInTrends.reduce((sum: number, d: any) => sum + d.checkIns, 0)
    return Math.round(total / checkInTrends.length)
  }, [checkInTrends])

  // Find peak hour from peak hours data
  const peakHourLabel = useMemo(() => {
    if (peakHours.length === 0) return '--'
    const peak = peakHours.reduce((max: any, cur: any) =>
      cur.checkIns > max.checkIns ? cur : max
    , peakHours[0])
    return peak.hour
  }, [peakHours])

  // Fetch analytics data
  useEffect(() => {
    if (!selectedGym) return

    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const days = parseInt(dateRange)

        const [summaryData, retentionData, trendsData, growthData, hoursData, membersData] =
          await Promise.all([
            getAnalyticsSummary(selectedGym, days),
            getRetentionMetrics(selectedGym),
            getCheckInTrends(selectedGym, days),
            getMemberGrowth(selectedGym, days),
            getPeakHours(selectedGym, days),
            getTopMembers(selectedGym, 5),
          ])

        setSummary(summaryData)
        setRetention(retentionData.data)
        setCheckInTrends(transformCheckInTrends(trendsData.data))
        setMemberGrowth(transformMemberGrowth(growthData.data))
        setPeakHours(transformPeakHours(hoursData.data))
        setTopMembers(membersData.data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [selectedGym, dateRange])

  const handleExport = () => {
    const gymName = gyms.find((g) => g.id === selectedGym)?.name || 'All'
    const date = new Date().toISOString().split('T')[0]

    exportToCSV(
      formatCheckInsForExport(
        checkInTrends.map((d) => ({ date: d.date, count: d.checkIns }))
      ),
      `${gymName}_checkin_trends_${date}`
    )
  }

  const stats = [
    {
      title: 'Total Check-Ins',
      value: summary.totalCheckIns.toLocaleString(),
      change: `${summary.growthPercentage >= 0 ? '+' : ''}${summary.growthPercentage}% vs last week`,
      icon: BarChart3,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Members',
      value: summary.activeMembers.toLocaleString(),
      change: `${summary.totalMembers} total`,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Retention Rate',
      value: `${retention.retentionRate}%`,
      change: `${retention.activeMembers} of ${retention.totalMembers} members`,
      icon: Activity,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Avg Daily Check-Ins',
      value: avgDailyCheckIns.toLocaleString(),
      change: `${summary.todayCheckIns} today`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'This Week',
      value: summary.weekCheckIns.toLocaleString(),
      change: `${summary.todayCheckIns} today`,
      icon: Calendar,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Peak Hour',
      value: peakHourLabel,
      change: 'Busiest time of day',
      icon: Clock,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
  ]

  if (loading && !checkInTrends.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                disabled={loading}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>

            <div>
              <select
                value={selectedGym}
                onChange={(e) => setSelectedGym(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                disabled={loading}
              >
                {gyms.map((gym) => (
                  <option key={gym.id} value={gym.id}>
                    {gym.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto sm:ml-auto"
              onClick={handleExport}
              disabled={loading || checkInTrends.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                  {stat.change && (
                    <p className={`mt-1 text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {stat.change}
                    </p>
                  )}
                </div>
                <div
                  className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1: Check-In Trends + Member Growth */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Check-In Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Check-In Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {checkInTrends.length > 0 ? (
              <div className="h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={checkInTrends}>
                    <defs>
                      <linearGradient id="checkInGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="checkIns"
                      name="Check-Ins"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fill="url(#checkInGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
                No check-in data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-400" />
              Member Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {memberGrowth.length > 0 ? (
              <div className="h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={memberGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Bar
                      dataKey="newMembers"
                      name="New Members"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      stackId="members"
                    />
                    <Bar
                      dataKey="returningMembers"
                      name="Returning"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      stackId="members"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
                No member growth data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            Peak Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {peakHours.length > 0 ? (
            <div className="h-[200px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours}>
                  <defs>
                    <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="checkIns"
                    name="Check-Ins"
                    fill="url(#peakGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
              No hourly data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Members */}
      {topMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-400" />
              Top Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{member.checkIns} check-ins</p>
                    <p className="text-xs text-muted-foreground">
                      Last: {new Date(member.lastCheckIn).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
