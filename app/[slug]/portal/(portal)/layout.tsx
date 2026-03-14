import { redirect } from 'next/navigation';
import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { PortalHeader } from '@/components/member-portal/layout/portal-header';
import { PortalNav } from '@/components/member-portal/layout/portal-nav';
import { LiveSessionWidget } from '@/components/member-portal/layout/live-session-widget';
import { RouteLoadingBar } from '@/components/ui/route-loading-bar';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { SetCurrentGymCookie } from '@/components/pwa/set-current-gym-cookie';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActiveCheckIn } from '@/lib/actions/checkin-flow';
import { getActiveWorkoutSession, getMemberStreak } from '@/lib/actions/members-portal';

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  // Check authentication
  const authResult = await getAuthenticatedMember(params.slug);

  if (!authResult.success || !authResult.data) {
    // Redirect to sign in page if not authenticated
    redirect(`/${params.slug}/portal/sign-in`);
  }

  const { memberId, gymId } = authResult.data;

  // Get full gym and member data + active check-in + streak in parallel
  const supabase = createAdminSupabaseClient();

  const [{ data: gym }, { data: member }, activeCheckIn, streakResult] = await Promise.all([
    supabase
      .from('gyms')
      .select('id, name, slug, logo_url, address, city, state')
      .eq('id', gymId)
      .eq('slug', params.slug)
      .single(),
    supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single(),
    getActiveCheckIn(memberId, gymId),
    getMemberStreak(memberId, gymId),
  ]);

  if (!gym || !member) {
    redirect(`/${params.slug}/portal/sign-in`);
  }

  const currentStreak = streakResult.streak || 0;
  const checkedInToday = streakResult.checkedInToday || !!activeCheckIn;
  const streakAtRisk = streakResult.atRisk || false;

  // If checked in, fetch active workout session
  let activeWorkout = null;
  if (activeCheckIn) {
    const workoutResult = await getActiveWorkoutSession(memberId, gymId);
    activeWorkout = workoutResult.data;
  }

  return (
    <div className="min-h-screen relative">
      <RouteLoadingBar />
      <div className="gradient-mesh" aria-hidden="true" />
      <div className="relative z-10">
        <PortalHeader gym={gym} member={member} streak={currentStreak} checkedInToday={checkedInToday} streakAtRisk={streakAtRisk} />

        <div className="flex justify-center">
          <PortalNav gymSlug={params.slug} />

          <main className={`w-full max-w-md p-4 ${activeCheckIn ? 'pb-40' : 'pb-24'}`}>
            {children}
          </main>
        </div>

        {activeCheckIn && (
          <LiveSessionWidget
            checkInTime={activeCheckIn.check_in_at}
            memberId={memberId}
            gymId={gymId}
            gymSlug={params.slug}
            activeWorkout={activeWorkout}
          />
        )}

        <SetCurrentGymCookie slug={params.slug} />
        <InstallPrompt />
      </div>
    </div>
  );
}
