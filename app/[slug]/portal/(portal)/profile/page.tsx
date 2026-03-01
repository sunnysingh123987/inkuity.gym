import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { ProfilePageContent } from '@/components/member-portal/profile/profile-page-content';

export default async function ProfilePage({
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

  const [memberResult, gymResult] = await Promise.all([
    supabase.from('members').select('*').eq('id', memberId).single(),
    supabase.from('gyms').select('name, slug').eq('id', gymId).single(),
  ]);

  const member = memberResult.data;
  const gym = gymResult.data;

  return (
    <ProfilePageContent
      member={member}
      gymName={gym?.name || ''}
      gymSlug={params.slug}
      memberId={memberId}
    />
  );
}
