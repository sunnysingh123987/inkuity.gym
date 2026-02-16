'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// ============================================================
// ANALYTICS SERVER ACTIONS
// ============================================================

export interface CheckInTrendData {
  date: string;
  count: number;
}

export interface MemberGrowthData {
  date: string;
  newMembers: number;
  returningMembers: number;
  total: number;
}

export interface PeakHourData {
  hour: number;
  count: number;
}

export interface DeviceBreakdownData {
  name: string;
  value: number;
  percentage: number;
}

export interface TopMemberData {
  id: string;
  name: string;
  email: string;
  checkIns: number;
  lastCheckIn: string;
}

// ============================================================
// 1. CHECK-IN TRENDS
// ============================================================

export async function getCheckInTrends(
  gymId: string,
  days: number = 30
): Promise<{ data: CheckInTrendData[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: checkIns, error } = await supabase
      .from('check_ins')
      .select('check_in_at')
      .eq('gym_id', gymId)
      .gte('check_in_at', startDate.toISOString())
      .order('check_in_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const trendsMap = new Map<string, number>();

    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      trendsMap.set(dateStr, 0);
    }

    // Count check-ins per date
    checkIns?.forEach((checkIn) => {
      const dateStr = new Date(checkIn.check_in_at).toISOString().split('T')[0];
      trendsMap.set(dateStr, (trendsMap.get(dateStr) || 0) + 1);
    });

    const data: CheckInTrendData[] = Array.from(trendsMap.entries()).map(
      ([date, count]) => ({
        date,
        count,
      })
    );

    return { data };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

// ============================================================
// 2. MEMBER GROWTH
// ============================================================

export async function getMemberGrowth(
  gymId: string,
  days: number = 30
): Promise<{ data: MemberGrowthData[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: checkIns, error } = await supabase
      .from('check_ins')
      .select('check_in_at, member_id, member:members(created_at)')
      .eq('gym_id', gymId)
      .gte('check_in_at', startDate.toISOString())
      .order('check_in_at', { ascending: true });

    if (error) throw error;

    // Initialize dates
    const growthMap = new Map<string, { newMembers: Set<string>; returningMembers: Set<string> }>();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      growthMap.set(dateStr, { newMembers: new Set(), returningMembers: new Set() });
    }

    // Process check-ins
    checkIns?.forEach((checkIn: any) => {
      const checkInDate = new Date(checkIn.check_in_at).toISOString().split('T')[0];
      const memberCreatedDate = checkIn.member?.created_at
        ? new Date(checkIn.member.created_at).toISOString().split('T')[0]
        : null;

      const entry = growthMap.get(checkInDate);
      if (entry && checkIn.member_id) {
        if (checkInDate === memberCreatedDate) {
          entry.newMembers.add(checkIn.member_id);
        } else {
          entry.returningMembers.add(checkIn.member_id);
        }
      }
    });

    const data: MemberGrowthData[] = Array.from(growthMap.entries()).map(
      ([date, { newMembers, returningMembers }]) => ({
        date,
        newMembers: newMembers.size,
        returningMembers: returningMembers.size,
        total: newMembers.size + returningMembers.size,
      })
    );

    return { data };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

// ============================================================
// 3. PEAK HOURS
// ============================================================

export async function getPeakHours(
  gymId: string,
  days: number = 30
): Promise<{ data: PeakHourData[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: checkIns, error } = await supabase
      .from('check_ins')
      .select('check_in_at')
      .eq('gym_id', gymId)
      .gte('check_in_at', startDate.toISOString());

    if (error) throw error;

    // Initialize all hours (0-23)
    const hourMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourMap.set(i, 0);
    }

    // Count check-ins per hour
    checkIns?.forEach((checkIn) => {
      const hour = new Date(checkIn.check_in_at).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    const data: PeakHourData[] = Array.from(hourMap.entries()).map(
      ([hour, count]) => ({
        hour,
        count,
      })
    );

    return { data };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

// ============================================================
// 4. DEVICE BREAKDOWN
// ============================================================

export async function getDeviceBreakdown(
  gymId: string,
  days: number = 30
): Promise<{ data: DeviceBreakdownData[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: scans, error } = await supabase
      .from('scans')
      .select('device_type')
      .eq('gym_id', gymId)
      .gte('scanned_at', startDate.toISOString());

    if (error) throw error;

    // Count devices
    const deviceMap = new Map<string, number>();
    let total = 0;

    scans?.forEach((scan) => {
      const device = scan.device_type || 'Unknown';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
      total++;
    });

    const data: DeviceBreakdownData[] = Array.from(deviceMap.entries()).map(
      ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      })
    );

    return { data };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

// ============================================================
// 5. TOP MEMBERS
// ============================================================

export async function getTopMembers(
  gymId: string,
  limit: number = 10
): Promise<{ data: TopMemberData[]; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: topMembers, error } = await supabase
      .from('members')
      .select(`
        id,
        full_name,
        email,
        check_ins:check_ins(count)
      `)
      .eq('gym_id', gymId)
      .order('check_ins.count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get last check-in for each member
    const data: TopMemberData[] = await Promise.all(
      (topMembers || []).map(async (member: any) => {
        const { data: lastCheckIn } = await supabase
          .from('check_ins')
          .select('check_in_at')
          .eq('member_id', member.id)
          .eq('gym_id', gymId)
          .order('check_in_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: member.id,
          name: member.full_name || 'Unknown',
          email: member.email || 'N/A',
          checkIns: member.check_ins?.[0]?.count || 0,
          lastCheckIn: lastCheckIn?.check_in_at || 'Never',
        };
      })
    );

    return { data: data.filter((m) => m.checkIns > 0) };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

// ============================================================
// 6. RETENTION METRICS
// ============================================================

export async function getRetentionMetrics(
  gymId: string
): Promise<{ data: { retentionRate: number; activeMembers: number; totalMembers: number }; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    // Get total members
    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId);

    // Get members who checked in within last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeCheckIns } = await supabase
      .from('check_ins')
      .select('member_id')
      .eq('gym_id', gymId)
      .gte('check_in_at', thirtyDaysAgo.toISOString());

    const activeMembers = new Set(activeCheckIns?.map((c) => c.member_id) || []).size;
    const retentionRate = totalMembers && totalMembers > 0
      ? Math.round((activeMembers / totalMembers) * 100)
      : 0;

    return {
      data: {
        retentionRate,
        activeMembers,
        totalMembers: totalMembers || 0,
      },
    };
  } catch (error: any) {
    return {
      data: { retentionRate: 0, activeMembers: 0, totalMembers: 0 },
      error: error.message,
    };
  }
}

// ============================================================
// 7. SUMMARY STATS (Quick Overview)
// ============================================================

export async function getAnalyticsSummary(gymId: string, days: number = 7): Promise<{
  totalCheckIns: number;
  todayCheckIns: number;
  weekCheckIns: number;
  totalMembers: number;
  activeMembers: number;
  growthPercentage: number;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Total check-ins
    const { count: totalCheckIns } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId);

    // Today's check-ins
    const { count: todayCheckIns } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .gte('check_in_at', today);

    // This week's check-ins
    const { count: weekCheckIns } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .gte('check_in_at', weekAgo.toISOString());

    // Last week's check-ins (for growth calculation)
    const { count: lastWeekCheckIns } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .gte('check_in_at', twoWeeksAgo.toISOString())
      .lt('check_in_at', weekAgo.toISOString());

    // Total members
    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId);

    // Active members (checked in this week)
    const { data: activeCheckIns } = await supabase
      .from('check_ins')
      .select('member_id')
      .eq('gym_id', gymId)
      .gte('check_in_at', weekAgo.toISOString());

    const activeMembers = new Set(activeCheckIns?.map((c) => c.member_id) || []).size;

    // Growth percentage (this week vs last week)
    const growthPercentage = lastWeekCheckIns && lastWeekCheckIns > 0
      ? Math.round(((weekCheckIns || 0) - lastWeekCheckIns) / lastWeekCheckIns * 100)
      : 0;

    return {
      totalCheckIns: totalCheckIns || 0,
      todayCheckIns: todayCheckIns || 0,
      weekCheckIns: weekCheckIns || 0,
      totalMembers: totalMembers || 0,
      activeMembers,
      growthPercentage,
    };
  } catch (error: any) {
    return {
      totalCheckIns: 0,
      todayCheckIns: 0,
      weekCheckIns: 0,
      totalMembers: 0,
      activeMembers: 0,
      growthPercentage: 0,
      error: error.message,
    };
  }
}
