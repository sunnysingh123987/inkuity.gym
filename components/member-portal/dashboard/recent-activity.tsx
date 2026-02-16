import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Dumbbell, Clock } from 'lucide-react';

interface RecentActivityProps {
  recentWorkouts: any[];
  recentCheckIns: any[];
}

export function RecentActivity({
  recentWorkouts,
  recentCheckIns,
}: RecentActivityProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
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
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Recent Workouts */}
          {recentWorkouts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                <Dumbbell className="h-4 w-4 mr-2 text-brand-purple-400" />
                Recent Workouts
              </h3>
              <div className="space-y-3">
                {recentWorkouts.map((workout) => {
                  const routineName = Array.isArray(workout.workout_routines)
                    ? workout.workout_routines[0]?.name
                    : workout.workout_routines?.name;

                  return (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-brand-purple-500/10 flex items-center justify-center">
                          <Dumbbell className="h-5 w-5 text-brand-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {routineName || 'Workout Session'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(workout.started_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {workout.status === 'completed' && (
                          <div className="flex items-center text-xs text-slate-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(workout.duration_minutes)}
                          </div>
                        )}
                        {workout.status === 'in_progress' && (
                          <span className="text-xs text-amber-400 font-medium">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Check-ins */}
          {recentCheckIns.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-brand-cyan-400" />
                Recent Check-ins
              </h3>
              <div className="space-y-2">
                {recentCheckIns.map((checkIn, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-brand-cyan-500/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-brand-cyan-400" />
                      </div>
                      <p className="text-sm text-slate-300">
                        {formatDate(checkIn.check_in_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {recentWorkouts.length === 0 && recentCheckIns.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-800 mb-3">
                <Calendar className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-300">No recent activity</p>
              <p className="text-xs text-slate-400 mt-1">
                Start by checking in or completing a workout
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
