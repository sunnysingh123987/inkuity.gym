import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getWorkoutRoutine, startWorkoutSession } from '@/lib/actions/members-portal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

async function handleStartSession(memberId: string, gymId: string, routineId: string, gymSlug: string) {
  'use server';
  const result = await startWorkoutSession(memberId, gymId, routineId);
  if (result.success) {
    redirect(`/${gymSlug}/portal/sessions/active`);
  }
}

export default async function StartWorkoutPage({
  params,
}: {
  params: { slug: string; routineId: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  const { data: routine } = await getWorkoutRoutine(params.routineId);

  if (!routine) {
    redirect(`/${params.slug}/portal/workouts`);
  }

  const exercises = routine.routine_exercises || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Start Workout: {routine.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Workout Overview</h3>
            {routine.description && (
              <p className="text-gray-600 mb-4">{routine.description}</p>
            )}
            <p className="text-sm text-gray-500">
              {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Exercises</h3>
            <div className="space-y-2">
              {exercises
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((re: any, index: number) => {
                  const exercise = Array.isArray(re.exercise_library)
                    ? re.exercise_library[0]
                    : re.exercise_library;

                  return (
                    <div key={re.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-500 w-8">
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{exercise?.name}</p>
                        <p className="text-sm text-gray-600">
                          {re.sets} sets × {re.reps || '—'} reps
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <form action={handleStartSession.bind(null, memberId, gymId, params.routineId, params.slug)}>
            <Button type="submit" size="lg" className="w-full">
              <Play className="h-5 w-5 mr-2" />
              Start Workout Now
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
