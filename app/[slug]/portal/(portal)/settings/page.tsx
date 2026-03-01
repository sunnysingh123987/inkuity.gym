import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getMemberPaymentHistory } from '@/lib/actions/members-portal';
import { SettingsPageContent } from '@/components/member-portal/settings/settings-page-content';
import type { GymReview, FeedbackRequest } from '@/types/database';

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  const supabase = createAdminSupabaseClient();

  // Fetch all data in parallel
  const [paymentsResult, reviewResult, feedbackResult, memberResult] =
    await Promise.all([
      getMemberPaymentHistory(memberId, gymId),
      supabase
        .from('gym_reviews')
        .select('*')
        .eq('gym_id', gymId)
        .eq('member_id', memberId)
        .single(),
      supabase
        .from('feedback_requests')
        .select('*')
        .eq('member_id', memberId)
        .eq('gym_id', gymId)
        .eq('status', 'sent')
        .order('created_at', { ascending: false }),
      supabase
        .from('members')
        .select('metadata')
        .eq('id', memberId)
        .single(),
    ]);

  return (
    <SettingsPageContent
      memberId={memberId}
      gymId={gymId}
      gymSlug={params.slug}
      payments={paymentsResult.data || []}
      existingReview={(reviewResult.data as GymReview) || null}
      feedbackRequests={(feedbackResult.data || []) as FeedbackRequest[]}
      memberPreferences={memberResult.data?.metadata || {}}
      initialTab={searchParams.tab}
    />
  );
}
