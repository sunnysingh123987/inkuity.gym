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
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Recent Workouts */}
          {recentWorkouts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Dumbbell className="h-4 w-4 mr-2 text-purple-600" />
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
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Dumbbell className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {routineName || 'Workout Session'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(workout.started_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {workout.status === 'completed' && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(workout.duration_minutes)}
                          </div>
                        )}
                        {workout.status === 'in_progress' && (
                          <span className="text-xs text-amber-600 font-medium">
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
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                Recent Check-ins
              </h3>
              <div className="space-y-2">
                {recentCheckIns.map((checkIn, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-700">
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
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">No recent activity</p>
              <p className="text-xs text-gray-500 mt-1">
                Start by checking in or completing a workout
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
