import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getWorkoutSessionHistory } from '@/lib/actions/members-portal';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Dumbbell } from 'lucide-react';
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


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Workout Sessions</h1>
        <p className="text-slate-400 mt-1">
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
                <Card className="bg-slate-900 border-slate-800 hover:bg-slate-800/70 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-white">
                            {routineName || 'Workout Session'}
                          </h3>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(workoutSession.started_at)}
                          </div>
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
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No workout sessions yet
            </h3>
            <p className="text-slate-400">
              Start a workout routine to see your sessions here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
