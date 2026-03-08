import { redirect } from 'next/navigation';
import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { PortalHeader } from '@/components/member-portal/layout/portal-header';
import { PortalNav } from '@/components/member-portal/layout/portal-nav';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { SetCurrentGymCookie } from '@/components/pwa/set-current-gym-cookie';
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

  // Calculate streak for header
  const { data: recentCheckIns } = await supabase
    .from('check_ins')
    .select('check_in_at')
    .eq('member_id', memberId)
    .eq('gym_id', gymId)
    .order('check_in_at', { ascending: false })
    .limit(30);

  let currentStreak = 0;
  if (recentCheckIns && recentCheckIns.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = new Date(recentCheckIns[0].check_in_at);
    lastDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 1) {
      currentStreak = 1;
      let prevDate = lastDate;
      for (let i = 1; i < recentCheckIns.length; i++) {
        const d = new Date(recentCheckIns[i].check_in_at);
        d.setHours(0, 0, 0, 0);
        const diff = Math.floor((prevDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) continue;
        if (diff === 1) { currentStreak++; prevDate = d; }
        else break;
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PortalHeader gym={gym} member={member} streak={currentStreak} />

      <div className="flex justify-center">
        <PortalNav gymSlug={params.slug} />

        <main className="w-full max-w-md p-4 pb-24">
          {children}
        </main>
      </div>

      <SetCurrentGymCookie slug={params.slug} />
      <InstallPrompt />
    </div>
  );
}
