import { notFound } from 'next/navigation'
import { getMemberById } from '@/lib/actions/gyms'
import { EditMemberForm } from '@/components/dashboard/members/edit-member-form'

interface EditMemberPageProps {
  params: {
    id: string
  }
}

export const metadata = {
  title: 'Edit Member - Inkuity',
  description: 'Edit member information and subscription details',
}

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const { data: member } = await getMemberById(params.id)

  if (!member) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Member</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update member information and manage subscription details.
        </p>
      </div>

      <EditMemberForm member={member} />
    </div>
  )
}