'use client';

import { AnimatedFire } from '@/components/member-portal/streak/animated-fire';

interface StreakHeroProps {
  streak: number;
  firstName: string;
  checkedInToday?: boolean;
}

export function StreakHero({ streak, firstName, checkedInToday = false }: StreakHeroProps) {
  const isActive = streak > 0;
  const atRisk = isActive && !checkedInToday;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold border',
          isActive
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
            : 'glass-pill text-slate-400'
        )}
      >
        <AnimatedFire streak={streak} atRisk={atRisk} className="h-5 w-5" />
        {isActive ? `${streak} ${streak === 1 ? 'day' : 'days'} streak` : 'Start your streak!'}
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
