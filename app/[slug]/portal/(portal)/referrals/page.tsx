import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getMemberReferrals } from '@/lib/actions/referrals';
import { ReferralTracker } from '@/components/member-portal/referrals/referral-tracker';
import { PageEntrance } from '@/components/animations/page-entrance';

export default async function ReferralsPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId } = authResult.data;

  const { data: referrals } = await getMemberReferrals(memberId);

  return (
    <div className="space-y-6">
      <PageEntrance />

      <div data-animate>
        <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
        <p className="text-gray-600 mt-1">
          Invite friends and earn rewards when they join
        </p>
      </div>

      <div data-animate>
        <ReferralTracker
          memberId={memberId}
          gymSlug={params.slug}
          referrals={referrals || []}
        />
      </div>
    </div>
  );
}
