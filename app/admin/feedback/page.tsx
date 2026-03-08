import { getAllFeedbackConversations } from '@/lib/actions/reviews';
import { FeedbackInbox } from '@/components/admin/feedback-inbox';

export default async function AdminFeedbackPage() {
  const result = await getAllFeedbackConversations();

  return (
    <FeedbackInbox conversations={result.data || []} />
  );
}
