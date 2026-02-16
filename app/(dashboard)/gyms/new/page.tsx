import { CreateGymForm } from '@/components/dashboard/gyms/create-gym-form'

export const metadata = {
  title: 'Create Gym - Inkuity',
  description: 'Add a new gym location',
}

export default function CreateGymPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Gym</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new gym location to start generating QR codes and tracking analytics.
        </p>
      </div>

      <div className="max-w-2xl">
        <CreateGymForm />
      </div>
    </div>
  )
}
