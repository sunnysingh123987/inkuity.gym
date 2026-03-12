import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getCustomTrackers } from '@/lib/actions/members-portal';
import { TrackersStandalonePage } from '@/components/member-portal/trackers/trackers-standalone-page';

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

  const trackersResult = await getCustomTrackers(memberId, gymId);

  const trackers = (trackersResult.data || []).map((tracker: any) => {
    const todayLog = tracker.tracker_daily_log?.[0];
    return {
      id: tracker.id,
      name: tracker.name,
      unit: tracker.unit,
      dailyTarget: tracker.daily_target,
      current: todayLog?.current_value || 0,
      icon: tracker.icon,
      color: tracker.color,
    };
  });

  return (
    <TrackersStandalonePage
      memberId={memberId}
      gymId={gymId}
      initialTrackers={trackers}
    />
  );
}
