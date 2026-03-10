import { Flame } from 'lucide-react';

interface StreakHeroProps {
  streak: number;
  firstName: string;
}

export function StreakHero({ streak, firstName }: StreakHeroProps) {
  const isActive = streak > 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border',
          isActive
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
            : 'glass-pill text-slate-400'
        )}
      >
        <Flame className={cn('h-4 w-4', isActive ? 'text-amber-400' : 'text-slate-500')} />
        {isActive ? `${streak} day streak` : 'Start your streak!'}
      </div>
      <p className="text-lg text-slate-300">
        Hey, <span className="font-semibold text-white">{firstName}</span>
      </p>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
