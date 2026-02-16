import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getWorkoutRoutines } from '@/lib/actions/members-portal';
import { RoutineCard } from '@/components/member-portal/workouts/routine-card';
import { Button } from '@/components/ui/button';
import { Plus, Dumbbell } from 'lucide-react';
import Link from 'next/link';

export default async function WorkoutsPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  const { data: routines } = await getWorkoutRoutines(
    memberId,
    gymId
  );

  const activeRoutines = routines?.filter((r) => r.is_active) || [];
  const inactiveRoutines = routines?.filter((r) => !r.is_active) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Workout Routines
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage your workout plans
          </p>
        </div>
        <Link href={`/${params.slug}/portal/workouts/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Routine
          </Button>
        </Link>
      </div>

      {/* Active Routines */}
      {activeRoutines.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Routines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRoutines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                gymSlug={params.slug}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Routines */}
      {inactiveRoutines.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-4">
            Inactive Routines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveRoutines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                gymSlug={params.slug}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {routines && routines.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
            <Dumbbell className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No workout routines yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first workout routine to start tracking your exercises
            and progress
          </p>
          <Link href={`/${params.slug}/portal/workouts/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Routine
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
