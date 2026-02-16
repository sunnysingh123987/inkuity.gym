import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getWorkoutRoutine, getExerciseLibrary } from '@/lib/actions/members-portal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function RoutineDetailPage({
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      chest: 'bg-red-100 text-red-700',
      back: 'bg-blue-100 text-blue-700',
      legs: 'bg-green-100 text-green-700',
      shoulders: 'bg-yellow-100 text-yellow-700',
      arms: 'bg-purple-100 text-purple-700',
      biceps: 'bg-purple-100 text-purple-700',
      triceps: 'bg-purple-100 text-purple-700',
      core: 'bg-orange-100 text-orange-700',
      cardio: 'bg-pink-100 text-pink-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href={`/${params.slug}/portal/workouts`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Routines
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {routine.name}
              </h1>
              <Badge variant={routine.is_active ? 'default' : 'secondary'}>
                {routine.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {routine.description && (
              <p className="text-gray-600 mt-2">{routine.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Link href={`/${params.slug}/portal/workouts/${params.routineId}/start`}>
              <Button disabled={!routine.is_active || exercises.length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Start Workout
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <Card>
        <CardHeader>
          <CardTitle>Exercises ({exercises.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No exercises in this routine yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((routineExercise: any, index: number) => {
                  const exercise = Array.isArray(routineExercise.exercise_library)
                    ? routineExercise.exercise_library[0]
                    : routineExercise.exercise_library;

                  return (
                    <div
                      key={routineExercise.id}
                      className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-indigo-600">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {exercise?.name || 'Unknown Exercise'}
                            </h4>
                            {exercise?.category && (
                              <Badge
                                variant="secondary"
                                className={`mt-1 ${getCategoryColor(
                                  exercise.category
                                )}`}
                              >
                                {exercise.category}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {exercise?.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {exercise.description}
                          </p>
                        )}

                        {/* Exercise Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-gray-500">Sets:</span>
                            <span className="ml-1 font-semibold">
                              {routineExercise.sets}
                            </span>
                          </div>

                          {routineExercise.reps && (
                            <div>
                              <span className="text-gray-500">Reps:</span>
                              <span className="ml-1 font-semibold">
                                {routineExercise.reps}
                              </span>
                            </div>
                          )}

                          {routineExercise.duration_seconds && (
                            <div>
                              <span className="text-gray-500">Duration:</span>
                              <span className="ml-1 font-semibold">
                                {routineExercise.duration_seconds}s
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="text-gray-500">Rest:</span>
                            <span className="ml-1 font-semibold">
                              {routineExercise.rest_seconds}s
                            </span>
                          </div>
                        </div>

                        {routineExercise.notes && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Notes:</span>
                            <span className="ml-1 text-gray-700">
                              {routineExercise.notes}
                            </span>
                          </div>
                        )}

                        {/* Equipment */}
                        {exercise?.equipment && exercise.equipment.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {exercise.equipment.map((eq: string) => (
                              <Badge key={eq} variant="outline" className="text-xs">
                                {eq}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      {routine.schedule && routine.schedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {routine.schedule.map((day: string) => (
                <Badge key={day} variant="outline" className="capitalize">
                  {day}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
