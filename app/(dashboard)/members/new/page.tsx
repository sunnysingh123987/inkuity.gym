import Link from 'next/link'
import { getGyms } from '@/lib/actions/gyms'
import { CreateMemberForm } from '@/components/dashboard/members/create-member-form'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Add Member - Inkuity',
  description: 'Add a new member to your gym',
}

export default async function NewMemberPage() {
  const { data: gyms } = await getGyms()
  const gym = gyms?.[0] || null

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/members"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Members
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Add Member</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new member to your gym.
        </p>
      </div>

      <div className="max-w-2xl">
        <CreateMemberForm gymId={gym?.id || ''} />
      </div>
    </div>
  )
}
