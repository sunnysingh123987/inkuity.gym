import { Calendar, Dumbbell, ListChecks } from 'lucide-react';

interface CompactStatsProps {
  totalCheckIns: number;
  workoutCount: number;
  routineCount: number;
}

const stats = [
  { key: 'checkins', icon: Calendar, label: 'Check-ins', color: 'text-cyan-400' },
  { key: 'workouts', icon: Dumbbell, label: 'Workouts', color: 'text-purple-400' },
  { key: 'routines', icon: ListChecks, label: 'Routines', color: 'text-emerald-400' },
] as const;

export function CompactStats({ totalCheckIns, workoutCount, routineCount }: CompactStatsProps) {
  const values: Record<string, number> = {
    checkins: totalCheckIns,
    workouts: workoutCount,
    routines: routineCount,
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.key}
          className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex flex-col items-center gap-1"
        >
          <stat.icon className={`h-5 w-5 ${stat.color}`} />
          <span className="text-xl font-bold text-white">{values[stat.key]}</span>
          <span className="text-[11px] text-slate-500">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
