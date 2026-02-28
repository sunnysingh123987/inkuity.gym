import { getGyms, getQRCodes, getAnalyticsSummary } from '@/lib/actions/gyms'
import { getDashboardSettings } from '@/lib/dashboard-settings'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { createClient } from '@/lib/supabase/server'
import { getLiveCheckIns } from '@/lib/actions/checkin-flow'
import { getGymReviews, getFeedbackRequests } from '@/lib/actions/reviews'
import { getFinancialSummary } from '@/lib/actions/staff-expenses'

export const metadata = {
  title: 'Dashboard - Inkuity',
  description: 'Overview of your gym analytics',
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: gyms } = await getGyms()
  const gym = gyms[0] || null

  // Fetch profile for greeting
  const { data: { user } } = await supabase.auth.getUser()
  let userName = ''
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    userName = profile?.full_name || user.user_metadata?.full_name || ''
  }

  // Fetch QR codes and analytics for the gym
  let qrCodes: any[] = []
  let analytics = { totalScans: 0, uniqueVisitors: 0, todayScans: 0, weekScans: 0, topQRCode: null as { name: string; scans: number } | null }

  if (gym) {
    const { data: qrData } = await getQRCodes(gym.id)
    qrCodes = qrData || []

    const analyticsSummary = await getAnalyticsSummary(gym.id)
    analytics = analyticsSummary
  }

  // Fetch recent members
  let recentMembers: any[] = []
  if (gym) {
    const { data: members, error } = await supabase
      .from('members')
      .select('id, full_name, email, membership_status, created_at')
      .eq('gym_id', gym.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!error && members) {
      recentMembers = members
    }
  }

  // Get total member count
  let totalMembers = 0
  if (gym) {
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gym.id)

    totalMembers = count || 0
  }

  // Get member status breakdown
  let memberStatusBreakdown = { active: 0, trial: 0, inactive: 0 }
  if (gym) {
    const { data: allMembers } = await supabase
      .from('members')
      .select('membership_status')
      .eq('gym_id', gym.id)

    if (allMembers) {
      for (const m of allMembers) {
        if (m.membership_status === 'active') {
          memberStatusBreakdown.active++
        } else if (m.membership_status === 'trial') {
          memberStatusBreakdown.trial++
        } else {
          memberStatusBreakdown.inactive++
        }
      }
    }
  }

  // Get today's check-ins count
  const today = new Date().toISOString().split('T')[0]
  let todayCheckIns = 0
  if (gym) {
    const { count } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gym.id)
      .gte('check_in_at', today)

    todayCheckIns = count || 0
  }

  // Get this month's check-ins count
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  let monthCheckIns = 0
  if (gym) {
    const { count } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gym.id)
      .gte('check_in_at', monthStart)

    monthCheckIns = count || 0
  }

  // Get new members this month
  let newMembersThisMonth = 0
  if (gym) {
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gym.id)
      .gte('created_at', monthStart)

    newMembersThisMonth = count || 0
  }

  // Get today's workout sessions (check-ins with workout focus tags)
  let workoutSessions: { focus: string; count: number }[] = []
  if (gym) {
    const { data: todayCheckins } = await supabase
      .from('check_ins')
      .select('tags')
      .eq('gym_id', gym.id)
      .gte('check_in_at', today)

    if (todayCheckins) {
      const focusCounts: Record<string, number> = {}
      for (const ci of todayCheckins) {
        if (ci.tags) {
          for (const tag of ci.tags) {
            if (tag.startsWith('workout:')) {
              const focus = tag.replace('workout:', '')
              focusCounts[focus] = (focusCounts[focus] || 0) + 1
            }
          }
        }
      }
      workoutSessions = Object.entries(focusCounts)
        .map(([focus, count]) => ({ focus, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }
  }

  // Get this week's check-ins
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  let weekCheckIns = 0
  if (gym) {
    const { count } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gym.id)
      .gte('check_in_at', weekAgo)

    weekCheckIns = count || 0
  }

  // Get payment collection data
  let todayCollection = 0
  let monthCollection = 0
  let paymentsDue = 0
  let lastMonthCollection = 0
  if (gym) {
    // Today's completed payments
    const { data: todayPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('gym_id', gym.id)
      .eq('status', 'completed')
      .gte('payment_date', today)

    if (todayPayments) {
      todayCollection = todayPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    }

    // This month's completed payments
    const { data: monthPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('gym_id', gym.id)
      .eq('status', 'completed')
      .gte('payment_date', monthStart)

    if (monthPayments) {
      monthCollection = monthPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    }

    // Last month's completed payments (for % change)
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString()
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 59).toISOString()
    const { data: lastMonthPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('gym_id', gym.id)
      .eq('status', 'completed')
      .gte('payment_date', lastMonthStart)
      .lte('payment_date', lastMonthEnd)

    if (lastMonthPayments) {
      lastMonthCollection = lastMonthPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    }

    // Pending payments due this month
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString()
    const { data: pendingPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('gym_id', gym.id)
      .eq('status', 'pending')
      .gte('payment_date', monthStart)
      .lte('payment_date', monthEnd)

    if (pendingPayments) {
      paymentsDue = pendingPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    }
  }

  // Fetch expense/financial summary
  let financeSummary = { totalRevenue: 0, totalExpenses: 0, netProfit: 0, staffSalaryTotal: 0 }
  let lastMonthFinanceSummary = { totalRevenue: 0, totalExpenses: 0, netProfit: 0, staffSalaryTotal: 0 }
  if (gym) {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`

    const [currentResult, lastResult] = await Promise.all([
      getFinancialSummary(gym.id, currentMonth),
      getFinancialSummary(gym.id, lastMonthStr),
    ])
    if (currentResult.success && currentResult.data) financeSummary = currentResult.data
    if (lastResult.success && lastResult.data) lastMonthFinanceSummary = lastResult.data

    // Get top expenses this month
  }

  // Fetch today's live check-ins with member details (enhanced with subscription data)
  let liveCheckIns: any[] = []
  if (gym) {
    const { data: checkInData } = await getLiveCheckIns(gym.id)
    if (checkInData) {
      // Enhance with subscription_end_date and streak from members table
      const memberIds = checkInData.map((ci: any) => ci.member?.id).filter(Boolean)
      if (memberIds.length > 0) {
        const { data: memberDetails } = await supabase
          .from('members')
          .select('id, subscription_end_date, membership_status')
          .in('id', memberIds)

        // Get check-in counts for streak calculation
        const { data: recentCheckIns } = await supabase
          .from('check_ins')
          .select('member_id, check_in_at')
          .eq('gym_id', gym.id)
          .in('member_id', memberIds)
          .order('check_in_at', { ascending: false })
          .limit(memberIds.length * 30)

        const memberMap = new Map<string, any>()
        memberDetails?.forEach((m: any) => memberMap.set(m.id, m))

        // Calculate streaks
        const streakMap = new Map<string, number>()
        if (recentCheckIns) {
          const byMember = new Map<string, string[]>()
          for (const ci of recentCheckIns) {
            if (!ci.member_id) continue
            const dates = byMember.get(ci.member_id) || []
            const dateStr = new Date(ci.check_in_at).toISOString().split('T')[0]
            if (!dates.includes(dateStr)) dates.push(dateStr)
            byMember.set(ci.member_id, dates)
          }
          for (const [memberId, dates] of Array.from(byMember)) {
            dates.sort((a, b) => b.localeCompare(a))
            let streak = 0
            const todayStr = new Date().toISOString().split('T')[0]
            let checkDate = todayStr
            for (const d of dates) {
              if (d === checkDate) {
                streak++
                const prev = new Date(checkDate)
                prev.setDate(prev.getDate() - 1)
                checkDate = prev.toISOString().split('T')[0]
              } else if (d < checkDate) {
                break
              }
            }
            streakMap.set(memberId, streak)
          }
        }

        liveCheckIns = checkInData.map((ci: any) => {
          const details = ci.member?.id ? memberMap.get(ci.member.id) : null
          const streak = ci.member?.id ? (streakMap.get(ci.member.id) || 0) : 0
          let daysLeft: number | null = null
          if (details?.subscription_end_date) {
            const end = new Date(details.subscription_end_date)
            const now = new Date()
            daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          }
          return {
            ...ci,
            member: ci.member ? {
              ...ci.member,
              subscription_end_date: details?.subscription_end_date || null,
            } : null,
            streak,
            daysLeft,
          }
        })
      } else {
        liveCheckIns = checkInData || []
      }
    }
  }

  // Fetch recent reviews
  let recentReviews: any[] = []
  if (gym) {
    const { data: reviewsData } = await getGymReviews(gym.id)
    recentReviews = (reviewsData || []).slice(0, 5)
  }

  // Fetch feedback requests
  let feedbackRequests: any[] = []
  if (gym) {
    const { data: feedbackData } = await getFeedbackRequests(gym.id)
    feedbackRequests = feedbackData || []
  }

  // Fire-and-forget: sync member statuses and check subscription expiry notifications
  if (gym) {
    import('@/lib/actions/gyms').then(({ syncMemberStatuses }) => {
      syncMemberStatuses(gym.id).catch(() => {})
    }).catch(() => {})

    import('@/lib/actions/notifications').then(({ checkSubscriptionExpiry }) => {
      checkSubscriptionExpiry(gym.id).catch(() => {})
    }).catch(() => {})
  }

  const dashboardSettings = getDashboardSettings(gym)

  return (
    <DashboardOverview
      gym={gym}
      userName={userName}
      dashboardSettings={dashboardSettings}
      qrCodes={qrCodes}
      analytics={analytics}
      recentMembers={recentMembers}
      totalMembers={totalMembers}
      memberStatusBreakdown={memberStatusBreakdown}
      todayCheckIns={todayCheckIns}
      monthCheckIns={monthCheckIns}
      weekCheckIns={weekCheckIns}
      newMembersThisMonth={newMembersThisMonth}
      workoutSessions={workoutSessions}
      todayCollection={todayCollection}
      monthCollection={monthCollection}
      lastMonthCollection={lastMonthCollection}
      paymentsDue={paymentsDue}
      currency={gym?.currency || 'INR'}
      liveCheckIns={liveCheckIns}
      financeSummary={financeSummary}
      lastMonthFinanceSummary={lastMonthFinanceSummary}
      recentReviews={recentReviews}
      feedbackRequests={feedbackRequests}
    />
  )
}
