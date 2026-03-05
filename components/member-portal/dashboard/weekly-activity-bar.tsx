import { Progress } from '@/components/ui/progress';

interface WeeklyActivityBarProps {
  weeklyCheckIns: number;
  weeklyWorkouts: number;
  weeklyGoal?: number;
}

export function WeeklyActivityBar({
  weeklyCheckIns,
  weeklyWorkouts,
  weeklyGoal = 5,
}: WeeklyActivityBarProps) {
  const total = weeklyCheckIns + weeklyWorkouts;
  const progress = Math.min((total / weeklyGoal) * 100, 100);

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between gap-4">
        <div className="shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-sm text-slate-500">/{weeklyGoal}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">This Week</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {weeklyCheckIns} check-in{weeklyCheckIns !== 1 ? 's' : ''}, {weeklyWorkouts} workout{weeklyWorkouts !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex-1">
          <Progress
            value={progress}
            className="h-3 bg-slate-700/50"
            indicatorClassName="bg-gradient-to-r from-cyan-500 to-purple-500"
          />
        </div>
      </div>
    </div>
  );
}
