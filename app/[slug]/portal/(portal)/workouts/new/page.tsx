import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getExerciseLibrary } from '@/lib/actions/members-portal';
import { RoutineForm } from '@/components/member-portal/workouts/routine-form';

export default async function NewRoutinePage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  // Fetch exercise library
  const { data: exercises } = await getExerciseLibrary(gymId);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Create Workout Routine
        </h1>
        <p className="text-gray-600 mt-1">
          Build a custom workout plan with exercises from the library
        </p>
      </div>

      <RoutineForm
        exercises={exercises || []}
        memberId={memberId}
        gymId={gymId}
        gymSlug={params.slug}
      />
    </div>
  );
}
