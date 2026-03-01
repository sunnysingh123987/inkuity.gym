import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import {
  startWorkoutSession,
  getActiveWorkoutSession,
  completeWorkoutSession,
} from '@/lib/actions/members-portal';

export default async function StartWorkoutPage({
  params,
}: {
  params: { slug: string; routineId: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  // If there's already an active session, complete it first
  const { data: existingSession } = await getActiveWorkoutSession(memberId, gymId);
  if (existingSession) {
    await completeWorkoutSession(existingSession.id);
  }

  // Start a new session for this routine and redirect
  const result = await startWorkoutSession(memberId, gymId, params.routineId);
  if (result.success) {
    redirect(`/${params.slug}/portal/sessions/active`);
  }

  // If session creation failed, go back to routines
  redirect(`/${params.slug}/portal/trackers`);
}
