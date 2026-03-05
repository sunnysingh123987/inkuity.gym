'use client';

import { useRouter } from 'next/navigation';
import { ScanLine, Dumbbell, ListChecks } from 'lucide-react';

interface DashboardQuickActionsProps {
  gymSlug: string;
}

const actions = [
  {
    label: 'Check In',
    icon: ScanLine,
    color: 'bg-cyan-500/15 text-cyan-400',
    href: (slug: string) => `/${slug}/portal/scan`,
  },
  {
    label: 'Workouts',
    icon: Dumbbell,
    color: 'bg-purple-500/15 text-purple-400',
    href: (slug: string) => `/${slug}/portal/workouts`,
  },
  {
    label: 'Routines',
    icon: ListChecks,
    color: 'bg-emerald-500/15 text-emerald-400',
    href: (slug: string) => `/${slug}/portal/trackers`,
  },
];

export function DashboardQuickActions({ gymSlug }: DashboardQuickActionsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => router.push(action.href(gymSlug))}
          className="flex flex-col items-center gap-2"
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.color}`}>
            <action.icon className="h-6 w-6" />
          </div>
          <span className="text-xs text-slate-400 font-medium">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
