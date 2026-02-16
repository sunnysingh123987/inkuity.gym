import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getWorkoutSessionHistory } from '@/lib/actions/members-portal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Dumbbell } from 'lucide-react';
import Link from 'next/link';

export default async function SessionsPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  const { data: sessions } = await getWorkoutSessionHistory(
    memberId,
    gymId
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
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
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workout Sessions</h1>
        <p className="text-gray-600 mt-1">
          View your workout history and progress
        </p>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {sessions.map((workoutSession) => {
            const routines = workoutSession.workout_routines as any;
            const routineName = Array.isArray(routines)
              ? routines[0]?.name
              : routines?.name;

            return (
              <Link
                key={workoutSession.id}
                href={`/${params.slug}/portal/sessions/${workoutSession.id}`}
              >
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {routineName || 'Workout Session'}
                          </h3>
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

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(workoutSession.started_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(workoutSession.started_at)}
                          </div>
                          {workoutSession.duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Dumbbell className="h-4 w-4" />
                              {formatDuration(workoutSession.duration_minutes)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No workout sessions yet
            </h3>
            <p className="text-gray-600">
              Start a workout routine to see your sessions here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
