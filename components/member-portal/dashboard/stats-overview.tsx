import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Flame, Dumbbell, ListChecks, Apple } from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    totalCheckIns: number;
    currentStreak: number;
    lastCheckIn: string | null;
    workoutCount: number;
    routineCount: number;
    hasActiveDiet: boolean;
  };
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const formatLastCheckIn = (dateString: string | null) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statCards = [
    {
      title: 'Total Check-ins',
      value: stats.totalCheckIns.toString(),
      description: `Last: ${formatLastCheckIn(stats.lastCheckIn)}`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}`,
      description: stats.currentStreak > 0 ? 'Keep it up!' : 'Start your streak today',
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Workouts Completed',
      value: stats.workoutCount.toString(),
      description: `${stats.routineCount} active ${stats.routineCount === 1 ? 'routine' : 'routines'}`,
      icon: Dumbbell,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Active Routines',
      value: stats.routineCount.toString(),
      description: stats.routineCount === 0 ? 'Create your first routine' : 'Ready to train',
      icon: ListChecks,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Diet Plan',
      value: stats.hasActiveDiet ? 'Active' : 'Not Set',
      description: stats.hasActiveDiet ? 'Track your nutrition' : 'Create a diet plan',
      icon: Apple,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
