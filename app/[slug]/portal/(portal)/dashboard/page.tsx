import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { WorkoutSuggestions } from '@/components/member-portal/dashboard/workout-suggestions';
import { PageEntrance } from '@/components/animations/page-entrance';
import { getWorkoutSuggestions } from '@/lib/actions/members-portal';
import { getActiveAnnouncements } from '@/lib/actions/announcements';
import { ActiveAnnouncements } from '@/components/member-portal/dashboard/active-announcements';
import { DashboardQuickActions } from '@/components/member-portal/dashboard/dashboard-quick-actions';
import { AutoCheckoutWarning } from '@/components/member-portal/dashboard/auto-checkout-warning';
import { WeeklyActivityBar } from '@/components/member-portal/dashboard/weekly-activity-bar';
import { CompactStats } from '@/components/member-portal/dashboard/compact-stats';
import { getActiveCheckIn, getLiveGymTraffic, getPeakHourToday, getHourlyTrafficAverage, getGymTodayStart } from '@/lib/actions/checkin-flow';

export default async function DashboardPage({
  params,
}: {
  params: { slug: string };
}) {
  // Get authenticated member (layout already checks, but we need the data)
  const authResult = await getAuthenticatedMember(params.slug);

  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }

  const { memberId, gymId } = authResult.data;
  const supabase = createAdminSupabaseClient();

  // Get member data
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  // Block access for pending/trial members
  if (member?.membership_status === 'pending' || member?.membership_status === 'trial') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Membership Pending</h2>
          <p className="text-slate-400 text-sm">
            Your membership request is being reviewed. You&apos;ll get full access once the gym owner approves your request.
          </p>
        </div>
      </div>
    );
  }

  // Parallelize all independent DB queries
  const [
    { count: totalCheckIns },
    { count: workoutCount },
    { count: routineCount },
    { data: recentCheckIns },
    hourlyTraffic,
    suggestionsResult,
    announcementsResult,
    activeCheckIn,
    liveTraffic,
    peakHour,
    gymTodayStart,
  ] = await Promise.all([
    supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('gym_id', gymId),
    supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('status', 'completed'),
    supabase
      .from('workout_routines')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('is_active', true),
    supabase
      .from('check_ins')
      .select('check_in_at')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('check_in_at', { ascending: false })
      .limit(30),
    getHourlyTrafficAverage(gymId),
    getWorkoutSuggestions(memberId, gymId),
    getActiveAnnouncements(gymId),
    getActiveCheckIn(memberId, gymId),
    getLiveGymTraffic(gymId),
    getPeakHourToday(gymId),
    getGymTodayStart(gymId),
  ]);

  const workoutSuggestions = suggestionsResult.data?.suggestions || [];
  const lastWorkoutsMap = suggestionsResult.data?.lastWorkouts || {};
  const activeAnnouncements = announcementsResult.data || [];

  let currentStreak = 0;
  if (recentCheckIns && recentCheckIns.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCheckInDate = new Date(recentCheckIns[0].check_in_at);
    lastCheckInDate.setHours(0, 0, 0, 0);

    // Check if last check-in was today or yesterday
    const daysDiff = Math.floor(
      (today.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 1) {
      currentStreak = 1;
      let prevDate = lastCheckInDate;

      for (let i = 1; i < recentCheckIns.length; i++) {
        const checkInDate = new Date(recentCheckIns[i].check_in_at);
        checkInDate.setHours(0, 0, 0, 0);

        const diff = Math.floor(
          (prevDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diff === 0) {
          // Same day duplicate, skip
          continue;
        } else if (diff === 1) {
          currentStreak++;
          prevDate = checkInDate;
        } else {
          break;
        }
      }
    }
  }

  // Check if already checked in today (gym-timezone-aware)
  const alreadyCheckedInToday = recentCheckIns?.some((ci) =>
    new Date(ci.check_in_at).getTime() >= new Date(gymTodayStart).getTime()
  ) ?? false;

  const firstName = member?.full_name?.split(' ')[0] || 'Member';

  return (
    <div className="space-y-5">
      <PageEntrance />

      <div data-animate>
        <p className="text-lg text-slate-300 text-center">
          Hey, <span className="font-semibold text-white">{firstName}</span>
        </p>
      </div>

      {activeAnnouncements.length > 0 && (
        <div data-animate>
          <ActiveAnnouncements announcements={activeAnnouncements} />
        </div>
      )}

      <div data-animate>
        <DashboardQuickActions
          gymSlug={params.slug}
          alreadyCheckedIn={alreadyCheckedInToday}
          activeCheckIn={activeCheckIn}
          memberId={memberId}
          gymId={gymId}
          liveTraffic={liveTraffic}
        />
        {activeCheckIn && (
          <AutoCheckoutWarning
            checkInTime={activeCheckIn.check_in_at}
            memberId={memberId}
            gymId={gymId}
          />
        )}
      </div>

      <div data-animate>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-[11px] text-slate-500">In Gym Now</span>
            </div>
            <span className="text-xl font-bold text-white">{liveTraffic}</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex flex-col items-center gap-1">
            <span className="text-[11px] text-slate-500">Peak Hour</span>
            {peakHour ? (
              <span className="text-xl font-bold text-white">
                {peakHour.hour % 12 || 12}{peakHour.hour < 12 ? 'am' : 'pm'}
              </span>
            ) : (
              <span className="text-sm text-slate-500">No data yet</span>
            )}
          </div>
        </div>
      </div>

      {hourlyTraffic.some((d) => d.count > 0) && (
        <div data-animate>
          <WeeklyActivityBar data={hourlyTraffic} />
        </div>
      )}

      <div data-animate>
        <CompactStats
          totalCheckIns={totalCheckIns || 0}
          workoutCount={workoutCount || 0}
          routineCount={routineCount || 0}
        />
      </div>

      <div data-animate>
        <WorkoutSuggestions
          suggestions={workoutSuggestions}
          lastWorkouts={lastWorkoutsMap}
        />
      </div>
    </div>
  );
}
