'use client'

import { useState, useEffect } from 'react'
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import {
  BarChart3,
  Users,
  TrendingUp,
  Activity,
  Download,
  Calendar,
  Loader2,
} from 'lucide-react'
import {
  getCheckInTrends,
  getMemberGrowth,
  getPeakHours,
  getDeviceBreakdown,
  getTopMembers,
  getAnalyticsSummary,
  getRetentionMetrics,
} from '@/lib/actions/analytics'
import { transformCheckInTrends, transformPeakHours } from '@/lib/utils/analytics-data'
import {
  exportToCSV,
  formatCheckInsForExport,
  formatPeakHoursForExport,
  formatDeviceBreakdownForExport,
  formatTopMembersForExport,
} from '@/lib/utils/export'

interface AnalyticsDashboardProps {
  gyms: Gym[]
}

const COLORS = ['#4f46e5', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b']

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
  const [peakHours, setPeakHours] = useState<any[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<any[]>([])
  const [topMembers, setTopMembers] = useState<any[]>([])

  // Fetch analytics data
  useEffect(() => {
    if (!selectedGym) return

    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const days = parseInt(dateRange)

        // Fetch all analytics data in parallel
        const [summaryData, retentionData, trendsData, hoursData, devicesData, membersData] =
          await Promise.all([
            getAnalyticsSummary(selectedGym, days),
            getRetentionMetrics(selectedGym),
            getCheckInTrends(selectedGym, days),
            getPeakHours(selectedGym, days),
            getDeviceBreakdown(selectedGym, days),
            getTopMembers(selectedGym, 5),
          ])

        setSummary(summaryData)
        setRetention(retentionData.data)
        setCheckInTrends(transformCheckInTrends(trendsData.data))
        setPeakHours(transformPeakHours(hoursData.data))
        setDeviceBreakdown(devicesData.data)
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

    // Export check-in trends
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
      change: `${summary.growthPercentage >= 0 ? '+' : ''}${summary.growthPercentage}%`,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Members',
      value: summary.activeMembers.toLocaleString(),
      change: `${summary.totalMembers} total`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'This Week',
      value: summary.weekCheckIns.toLocaleString(),
      change: `${summary.todayCheckIns} today`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Retention Rate',
      value: `${retention.retentionRate}%`,
      change: 'Last 30 days',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  if (loading && !checkInTrends.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
              <Calendar className="h-4 w-4 text-gray-500" />
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
              className="ml-auto"
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                  {stat.change && (
                    <p className={`mt-1 text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-gray-500'}`}>
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

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Check-In Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {checkInTrends.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={checkInTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="checkIns"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={{ fill: '#4f46e5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No check-in data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceBreakdown.length > 0 ? (
              <>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {deviceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {deviceBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-gray-600">
                        {item.name} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No device data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Peak Hours</CardTitle>
        </CardHeader>
        <CardContent>
          {peakHours.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="checkIns" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No hourly data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Members */}
      {topMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{member.checkIns} check-ins</p>
                    <p className="text-xs text-gray-500">
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
