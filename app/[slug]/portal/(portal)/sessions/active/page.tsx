import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getActiveWorkoutSession } from '@/lib/actions/members-portal';
import { ActiveSessionTracker } from '@/components/member-portal/sessions/active-session-tracker';

export default async function ActiveSessionPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  const { data: activeSession } = await getActiveWorkoutSession(
    memberId,
    gymId
  );

  if (!activeSession) {
    redirect(`/${params.slug}/portal/workouts`);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <ActiveSessionTracker
        session={activeSession}
        gymSlug={params.slug}
      />
    </div>
  );
}
