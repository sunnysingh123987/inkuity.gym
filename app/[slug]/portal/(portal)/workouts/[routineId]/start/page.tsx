import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { startWorkoutSession } from '@/lib/actions/members-portal';

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

  // Start a new session for this routine and redirect
  const result = await startWorkoutSession(memberId, gymId, params.routineId);
  if (result.success) {
    redirect(`/${params.slug}/portal/sessions/active`);
  }

  // If session creation failed, go back to routines
  redirect(`/${params.slug}/portal/routines`);
}
