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
    redirect(`/${params.slug}/portal/trackers`);
  }

  const exercises = routine.routine_exercises || [];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      chest: 'bg-red-500/10 text-red-400',
      back: 'bg-blue-500/10 text-blue-400',
      legs: 'bg-green-500/10 text-green-400',
      shoulders: 'bg-yellow-500/10 text-yellow-400',
      arms: 'bg-purple-500/10 text-purple-400',
      biceps: 'bg-purple-500/10 text-purple-400',
      triceps: 'bg-purple-500/10 text-purple-400',
      core: 'bg-orange-500/10 text-orange-400',
      cardio: 'bg-pink-500/10 text-pink-400',
    };
    return colors[category] || 'bg-slate-800 text-slate-300';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href={`/${params.slug}/portal/trackers`}
          className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Routines
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {routine.name}
              </h1>
              <Badge variant={routine.is_active ? 'default' : 'secondary'}>
                {routine.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {routine.description && (
              <p className="text-slate-400 mt-2">{routine.description}</p>
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
            <div className="text-center py-8 text-slate-500">
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
                      className="flex items-start gap-4 p-4 border border-slate-700 rounded-lg bg-slate-800"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-cyan-500/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-brand-cyan-400">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-white">
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
                          <p className="text-sm text-slate-400 mt-2">
                            {exercise.description}
                          </p>
                        )}

                        {/* Exercise Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-slate-500">Sets:</span>
                            <span className="ml-1 font-semibold">
                              {routineExercise.sets}
                            </span>
                          </div>

                          {routineExercise.reps && (
                            <div>
                              <span className="text-slate-500">Reps:</span>
                              <span className="ml-1 font-semibold">
                                {routineExercise.reps}
                              </span>
                            </div>
                          )}

                          {routineExercise.duration_seconds && (
                            <div>
                              <span className="text-slate-500">Duration:</span>
                              <span className="ml-1 font-semibold">
                                {routineExercise.duration_seconds}s
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="text-slate-500">Rest:</span>
                            <span className="ml-1 font-semibold">
                              {routineExercise.rest_seconds}s
                            </span>
                          </div>
                        </div>

                        {routineExercise.notes && (
                          <div className="mt-2 text-sm">
                            <span className="text-slate-500">Notes:</span>
                            <span className="ml-1 text-slate-300">
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
