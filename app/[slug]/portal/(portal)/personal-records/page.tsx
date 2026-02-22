import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getPersonalRecords, getPRSummary } from '@/lib/actions/personal-records';
import { PRTracker } from '@/components/member-portal/personal-records/pr-tracker';

export default async function PersonalRecordsPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  const [recordsResult, summaryResult] = await Promise.all([
    getPersonalRecords(memberId, gymId),
    getPRSummary(memberId, gymId),
  ]);

  return (
    <PRTracker
      records={recordsResult.data || []}
      summary={summaryResult.data || []}
      memberId={memberId}
      gymId={gymId}
      gymSlug={params.slug}
    />
  );
}
