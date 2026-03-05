import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getWorkoutSessionHistory } from '@/lib/actions/members-portal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Clock, Calendar } from 'lucide-react';
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

  const { data: sessions } = await getWorkoutSessionHistory(memberId, gymId, 50);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Workouts</h1>
        <p className="text-slate-400 mt-1 text-sm">Your workout history</p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Dumbbell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No workouts yet</h3>
            <p className="text-slate-500 text-sm">
              Start a workout from your routines to see your history here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session: any) => {
            const routineName = Array.isArray(session.workout_routines)
              ? session.workout_routines[0]?.name
              : session.workout_routines?.name;
            const duration = formatDuration(session.duration_minutes);

            return (
              <Link
                key={session.id}
                href={`/${params.slug}/portal/sessions/${session.id}`}
              >
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-800/80 transition-colors mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                    <Dumbbell className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {routineName || 'Workout Session'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(session.started_at)}
                      </span>
                      {duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {duration}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={session.status === 'completed' ? 'default' : 'secondary'}
                    className="shrink-0 text-[10px]"
                  >
                    {session.status}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
