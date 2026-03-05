import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import {
  getMemberStreak,
  getCheckInCalendarData,
} from '@/lib/actions/members-portal';
import { StreakPageContent } from '@/components/member-portal/streak/streak-page-content';

export default async function StreakPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);

  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }

  const { memberId, gymId } = authResult.data;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [streakResult, calendarResult] = await Promise.all([
    getMemberStreak(memberId, gymId),
    getCheckInCalendarData(memberId, gymId, currentMonth, currentYear),
  ]);

  return (
    <StreakPageContent
      streak={streakResult.streak}
      initialCheckInDays={calendarResult.data || {}}
      memberId={memberId}
      gymId={gymId}
    />
  );
}
