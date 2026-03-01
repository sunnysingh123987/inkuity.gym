import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getWorkoutRoutines, getLastSessionDates } from '@/lib/actions/members-portal';
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

  const [routinesResult, lastSessionDates] = await Promise.all([
    getWorkoutRoutines(memberId, gymId),
    getLastSessionDates(memberId, gymId),
  ]);

  return (
    <RoutinesPageContent
      routines={routinesResult.data || []}
      lastSessionDates={lastSessionDates}
      gymSlug={params.slug}
    />
  );
}
