import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { FeedbackForm } from '@/components/member-portal/feedback/feedback-form';
import { PageEntrance } from '@/components/animations/page-entrance';
import type { FeedbackRequest } from '@/types/database';
import { MessageSquare } from 'lucide-react';

export default async function FeedbackPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);

  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }

  const { memberId, gymId } = authResult.data;
  const supabase = createAdminSupabaseClient();

  // Fetch pending feedback requests for this member
  const { data: feedbackRequests } = await supabase
    .from('feedback_requests')
    .select('*')
    .eq('member_id', memberId)
    .eq('gym_id', gymId)
    .eq('status', 'sent')
    .order('created_at', { ascending: false });

  const pendingRequests = (feedbackRequests || []) as FeedbackRequest[];

  return (
    <div className="space-y-6">
      <PageEntrance />
      <div data-animate>
        <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
        <p className="text-gray-600 mt-1">
          Your gym has requested your feedback. Help them improve by sharing your thoughts.
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <div data-animate className="rounded-2xl bg-slate-900 border border-slate-800 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 mb-3">
              <MessageSquare className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-white">No feedback requests</p>
            <p className="text-xs text-slate-400 mt-1">
              You don&apos;t have any pending feedback requests at the moment.
            </p>
          </div>
        </div>
      ) : (
        <div data-animate className="space-y-4 max-w-lg">
          {pendingRequests.map((request) => (
            <FeedbackForm key={request.id} feedbackRequest={request} />
          ))}
        </div>
      )}
    </div>
  );
}
