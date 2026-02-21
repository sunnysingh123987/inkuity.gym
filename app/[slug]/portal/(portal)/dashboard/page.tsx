import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { StatsOverview } from '@/components/member-portal/dashboard/stats-overview';
import { RecentActivity } from '@/components/member-portal/dashboard/recent-activity';
import { QuickActions } from '@/components/member-portal/dashboard/quick-actions';
import { PageEntrance } from '@/components/animations/page-entrance';

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

  // Block access for pending members
  if (member?.membership_status === 'pending') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Membership Pending</h2>
          <p className="text-gray-600 text-sm">
            Your membership request is being reviewed. You&apos;ll get full access once the gym owner approves your request.
          </p>
        </div>
      </div>
    );
  }

  // Get check-in stats
  const { count: totalCheckIns } = await supabase
    .from('check_ins')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('gym_id', gymId);

  // Get last check-in
  const { data: lastCheckIn } = await supabase
    .from('check_ins')
    .select('check_in_at')
    .eq('member_id', memberId)
    .eq('gym_id', gymId)
    .order('check_in_at', { ascending: false })
    .limit(1)
    .single();

  // Get workout count
  const { count: workoutCount } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('status', 'completed');

  // Get active workout routines count
  const { count: routineCount } = await supabase
    .from('workout_routines')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('is_active', true);

  // Get active diet plan
  const { data: activeDietPlan } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('member_id', memberId)
    .eq('is_active', true)
    .single();

  // Calculate current streak (simplified - count consecutive days)
  const { data: recentCheckIns } = await supabase
    .from('check_ins')
    .select('check_in_at')
    .eq('member_id', memberId)
    .eq('gym_id', gymId)
    .order('check_in_at', { ascending: false })
    .limit(30);

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

        if (diff === 1) {
          currentStreak++;
          prevDate = checkInDate;
        } else {
          break;
        }
      }
    }
  }

  // Get recent workout sessions
  const { data: recentWorkouts } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      started_at,
      completed_at,
      duration_minutes,
      status,
      workout_routines (
        name
      )
    `)
    .eq('member_id', memberId)
    .order('started_at', { ascending: false })
    .limit(5);

  const stats = {
    totalCheckIns: totalCheckIns || 0,
    currentStreak,
    lastCheckIn: lastCheckIn?.check_in_at || null,
    workoutCount: workoutCount || 0,
    routineCount: routineCount || 0,
    hasActiveDiet: !!activeDietPlan,
  };

  return (
    <div className="space-y-6">
      <PageEntrance />
      <div data-animate>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {member?.full_name || 'Member'}!
        </h1>
        <p className="text-gray-600 mt-1">
          Track your fitness journey and reach your goals
        </p>
      </div>

      <div data-animate>
        <StatsOverview stats={stats} />
      </div>

      <div data-animate className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity
            recentWorkouts={recentWorkouts || []}
            recentCheckIns={recentCheckIns?.slice(0, 5) || []}
          />
        </div>

        <div>
          <QuickActions gymSlug={params.slug} />
        </div>
      </div>
    </div>
  );
}
