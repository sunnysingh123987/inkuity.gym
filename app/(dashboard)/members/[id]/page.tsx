import { notFound } from 'next/navigation'
import { getMemberById } from '@/lib/actions/gyms'
import { MemberDetailView } from '@/components/dashboard/members/member-detail-view'
import { createClient } from '@/lib/supabase/server'

interface MemberDetailPageProps {
  params: {
    id: string
  }
}

export const metadata = {
  title: 'Member Details - Inkuity',
  description: 'View member information and check-in history',
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { data: member } = await getMemberById(params.id)

  if (!member) {
    notFound()
  }

  // Fetch check-ins for this member
  const supabase = createClient()
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*')
    .eq('member_id', member.id)
    .order('check_in_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Member Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View member profile and check-in history.
        </p>
      </div>

      <MemberDetailView member={member} checkIns={checkIns || []} />
    </div>
  )
}
