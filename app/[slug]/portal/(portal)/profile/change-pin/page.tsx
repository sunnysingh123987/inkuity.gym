import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { ChangePinContent } from '@/components/member-portal/profile/change-pin-content';

export default async function ChangePinPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }

  return (
    <ChangePinContent
      memberId={authResult.data.memberId}
      gymSlug={params.slug}
    />
  );
}
