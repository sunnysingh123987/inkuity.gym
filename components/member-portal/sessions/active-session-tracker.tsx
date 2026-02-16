'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, Trophy } from 'lucide-react';
import { ExerciseSetLogger } from './exercise-set-logger';
import { SessionTimer } from './session-timer';
import { completeWorkoutSession } from '@/lib/actions/members-portal';
import { toast } from 'sonner';

interface ActiveSessionTrackerProps {
  session: any;
  gymSlug: string;
}

export function ActiveSessionTracker({
  session,
  gymSlug,
}: ActiveSessionTrackerProps) {
  const router = useRouter();
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set()
  );
  const [completing, setCompleting] = useState(false);

  const exercises = session.session_exercises || [];
  const totalExercises = exercises.length;
  const completedCount = completedExercises.size;
  const progress = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  const routineName = Array.isArray(session.workout_routines)
    ? session.workout_routines[0]?.name
    : session.workout_routines?.name;

  const handleExerciseComplete = (exerciseId: string) => {
    setCompletedExercises(new Set([...completedExercises, exerciseId]));
  };

  const handleCompleteWorkout = async () => {
    if (completedCount < totalExercises) {
      const confirmed = confirm(
        `You've completed ${completedCount} of ${totalExercises} exercises. Are you sure you want to finish?`
      );
      if (!confirmed) return;
    }

    setCompleting(true);

    const result = await completeWorkoutSession(session.id);

    if (result.success) {
      toast.success('Workout completed! Great job! 💪');
      router.push(`/${gymSlug}/portal/sessions/${session.id}`);
    } else {
      toast.error(result.error || 'Failed to complete workout');
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                {routineName || 'Workout Session'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {totalExercises} exercises
              </p>
            </div>
            <SessionTimer startTime={session.started_at} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold">
                {completedCount} / {totalExercises} exercises
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        {exercises
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((sessionExercise: any, index: number) => {
            const exercise = Array.isArray(sessionExercise.exercise_library)
              ? sessionExercise.exercise_library[0]
              : sessionExercise.exercise_library;

            const isCompleted = completedExercises.has(sessionExercise.id);

            return (
              <Card
                key={sessionExercise.id}
                className={isCompleted ? 'bg-green-50 border-green-200' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <Circle className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {index + 1}. {exercise?.name || 'Exercise'}
                        </h3>
                        {exercise?.category && (
                          <Badge variant="secondary" className="mt-1">
                            {exercise.category}
                          </Badge>
                        )}
                        {exercise?.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {exercise.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ExerciseSetLogger
                    sessionExerciseId={sessionExercise.id}
                    onComplete={() => handleExerciseComplete(sessionExercise.id)}
                    isCompleted={isCompleted}
                  />
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Complete Workout Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleCompleteWorkout}
            disabled={completing}
            size="lg"
            className="w-full"
          >
            {completing ? (
              'Completing...'
            ) : (
              <>
                <Trophy className="h-5 w-5 mr-2" />
                Finish Workout
              </>
            )}
          </Button>
          {completedCount < totalExercises && (
            <p className="text-sm text-center text-gray-500 mt-2">
              {totalExercises - completedCount} exercises remaining
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
