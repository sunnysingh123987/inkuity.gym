import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import {
  getWorkoutRoutines,
  getLastSessionDates,
  getActiveWorkoutSession,
} from '@/lib/actions/members-portal';
import { RoutinesPageContent } from '@/components/member-portal/trackers/routines-page-content';

export default async function TrackersPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  const [routinesResult, lastSessionDates, activeSessionResult] = await Promise.all([
    getWorkoutRoutines(memberId, gymId),
    getLastSessionDates(memberId, gymId),
    getActiveWorkoutSession(memberId, gymId),
  ]);

  const activeSessionData = activeSessionResult.success ? activeSessionResult.data : null;
  let activeSession = null;
  if (activeSessionData) {
    const sessionExercises = activeSessionData.session_exercises || [];
    const totalExercises = sessionExercises.length;
    // Count exercises that have at least one set logged today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedExercises = sessionExercises.filter((e: any) => {
      const sets = e.exercise_sets || [];
      return sets.some((s: any) => new Date(s.created_at) >= today);
    }).length;
    // Only show active session if at least one exercise has been logged
    if (completedExercises > 0) {
      activeSession = {
        routineId: activeSessionData.routine_id,
        sessionId: activeSessionData.id,
        totalExercises,
        completedExercises,
      };
    }
  }

  return (
    <RoutinesPageContent
      routines={routinesResult.data || []}
      lastSessionDates={lastSessionDates}
      gymSlug={params.slug}
      memberId={memberId}
      gymId={gymId}
      activeSession={activeSession}
    />
  );
}
