import { redirect } from 'next/navigation';
import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { PortalHeader } from '@/components/member-portal/layout/portal-header';
import { PortalNav } from '@/components/member-portal/layout/portal-nav';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  // Check authentication
  const authResult = await getAuthenticatedMember(params.slug);

  if (!authResult.success || !authResult.data) {
    // Redirect to sign in page if not authenticated
    redirect(`/${params.slug}/portal/sign-in`);
  }

  const { memberId, gymId } = authResult.data;

  // Get full gym and member data
  const supabase = createAdminSupabaseClient();

  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name, slug, logo_url, address, city, state')
    .eq('id', gymId)
    .eq('slug', params.slug)
    .single();

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (!gym || !member) {
    redirect(`/${params.slug}/portal/sign-in`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader gym={gym} member={member} />

      <div className="flex">
        <PortalNav gymSlug={params.slug} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-64">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
