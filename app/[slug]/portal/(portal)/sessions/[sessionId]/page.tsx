import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getWorkoutSession } from '@/lib/actions/members-portal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Dumbbell, Trophy, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function SessionDetailPage({
  params,
}: {
  params: { slug: string; sessionId: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  const { data: workoutSession, error } = await getWorkoutSession(
    params.sessionId
  );

  if (error || !workoutSession) {
    redirect(`/${params.slug}/portal/sessions`);
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const routineName = Array.isArray(workoutSession.workout_routines)
    ? workoutSession.workout_routines[0]?.name
    : workoutSession.workout_routines?.name;

  const exercises = workoutSession.session_exercises || [];

  // Calculate total sets and volume
  const totalSets = exercises.reduce((sum: number, ex: any) => {
    return sum + (ex.exercise_sets?.length || 0);
  }, 0);

  const totalVolume = exercises.reduce((sum: number, ex: any) => {
    const exerciseSets = ex.exercise_sets || [];
    return (
      sum +
      exerciseSets.reduce((exSum: number, set: any) => {
        return exSum + (set.weight || 0) * (set.reps || 0);
      }, 0)
    );
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {routineName || 'Workout Session'}
          </h1>
          <p className="text-gray-600 mt-1">
            {formatDate(workoutSession.started_at)}
          </p>
        </div>
        <Link href={`/${params.slug}/portal/sessions`}>
          <Button variant="outline">Back to Sessions</Button>
        </Link>
      </div>

      {/* Session Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-indigo-600" />
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Status</p>
              <Badge
                variant={
                  workoutSession.status === 'completed'
                    ? 'default'
                    : workoutSession.status === 'in_progress'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {workoutSession.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Start Time
              </p>
              <p className="font-semibold">
                {formatTime(workoutSession.started_at)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Dumbbell className="h-4 w-4" />
                Duration
              </p>
              <p className="font-semibold">
                {formatDuration(workoutSession.duration_minutes)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Total Sets</p>
              <p className="font-semibold">{totalSets} sets</p>
            </div>
          </div>
          {totalVolume > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-indigo-600">
                {totalVolume.toLocaleString()} lbs
              </p>
            </div>
          )}
          {workoutSession.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-1">Notes</p>
              <p className="text-gray-900">{workoutSession.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Exercises</h2>

        {exercises
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((sessionExercise: any, index: number) => {
            const exercise = Array.isArray(sessionExercise.exercise_library)
              ? sessionExercise.exercise_library[0]
              : sessionExercise.exercise_library;

            const sets = sessionExercise.exercise_sets || [];
            const completedSets = sets.filter((s: any) => s.completed).length;

            return (
              <Card key={sessionExercise.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg">
                          {index + 1}. {exercise?.name || 'Exercise'}
                        </h3>
                        {exercise?.category && (
                          <Badge variant="secondary" className="mt-1">
                            {exercise.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {completedSets} {completedSets === 1 ? 'set' : 'sets'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {sets.length > 0 ? (
                    <div className="space-y-2">
                      {sets.map((set: any) => (
                        <div
                          key={set.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">Set {set.set_number}</Badge>
                            <div className="flex gap-4 text-sm">
                              {set.weight && (
                                <span>
                                  <span className="text-gray-600">Weight:</span>{' '}
                                  <span className="font-semibold">
                                    {set.weight} lbs
                                  </span>
                                </span>
                              )}
                              {set.reps && (
                                <span>
                                  <span className="text-gray-600">Reps:</span>{' '}
                                  <span className="font-semibold">
                                    {set.reps}
                                  </span>
                                </span>
                              )}
                              {set.duration_seconds && (
                                <span>
                                  <span className="text-gray-600">
                                    Duration:
                                  </span>{' '}
                                  <span className="font-semibold">
                                    {set.duration_seconds}s
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          {set.completed && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No sets logged for this exercise
                    </p>
                  )}
                  {sessionExercise.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-1">Notes:</p>
                      <p className="text-sm text-gray-900">
                        {sessionExercise.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {exercises.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No exercises recorded
            </h3>
            <p className="text-gray-600">
              This session doesn't have any exercises logged
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
