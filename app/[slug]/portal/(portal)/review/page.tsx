import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { ReviewForm } from '@/components/member-portal/reviews/review-form';
import { PageEntrance } from '@/components/animations/page-entrance';
import type { GymReview } from '@/types/database';

export default async function ReviewPage({
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

  // Fetch existing review for this member
  const { data: existingReview } = await supabase
    .from('gym_reviews')
    .select('*')
    .eq('gym_id', gymId)
    .eq('member_id', memberId)
    .single();

  return (
    <div className="space-y-6">
      <PageEntrance />
      <div data-animate>
        <h1 className="text-2xl font-bold text-gray-900">
          {existingReview ? 'Your Review' : 'Leave a Review'}
        </h1>
        <p className="text-gray-600 mt-1">
          {existingReview
            ? 'You can update your review below.'
            : 'Share your experience and help others find this gym.'}
        </p>
      </div>

      <div data-animate className="max-w-lg">
        <ReviewForm
          gymId={gymId}
          memberId={memberId}
          existingReview={(existingReview as GymReview) || null}
        />
      </div>
    </div>
  );
}
