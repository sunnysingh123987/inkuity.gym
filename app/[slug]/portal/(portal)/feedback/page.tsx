import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getFeedbackMessages } from '@/lib/actions/reviews';
import { FeedbackChat } from '@/components/member-portal/feedback/feedback-chat';
import { PageEntrance } from '@/components/animations/page-entrance';

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

  const chatResult = await getFeedbackMessages(memberId, gymId);

  return (
    <div className="space-y-4">
      <PageEntrance />
      <div data-animate>
        <h1 className="text-2xl font-bold text-white">Feedback</h1>
        <p className="text-slate-400 mt-1">
          Share your thoughts, suggestions, or questions directly with Inkuity.
        </p>
      </div>

      <div data-animate>
        <FeedbackChat
          memberId={memberId}
          gymId={gymId}
          initialMessages={chatResult.data || []}
        />
      </div>
    </div>
  );
}
