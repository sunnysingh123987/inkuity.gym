'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getUiSvg } from '@/lib/svg-icons';

interface QuickActionsProps {
  gymSlug: string;
}

export function QuickActions({ gymSlug }: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      title: 'Start Workout',
      description: 'Begin a new workout session',
      svgIcon: getUiSvg('workouts'),
      bgColor: 'glass-action',
      hoverColor: 'glass-hover',
      onClick: () => router.push(`/${gymSlug}/portal/routines`),
    },
    {
      title: 'Create Routine',
      description: 'Design a new workout routine',
      svgIcon: getUiSvg('workouts'),
      bgColor: 'glass-action',
      hoverColor: 'glass-hover',
      onClick: () => router.push(`/${gymSlug}/portal/workouts/new`),
    },
    {
      title: 'Track Meals',
      description: 'Log food and track macros',
      svgIcon: getUiSvg('diet'),
      bgColor: 'glass-action',
      hoverColor: 'glass-hover',
      onClick: () => router.push(`/${gymSlug}/portal/diet`),
    },
    {
      title: 'PR Tracker',
      description: 'Track your personal records',
      svgIcon: getUiSvg('personal-record'),
      bgColor: 'glass-action',
      hoverColor: 'glass-hover',
      onClick: () => router.push(`/${gymSlug}/portal/routines?tab=prs`),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => {
            return (
              <button
                key={action.title}
                onClick={action.onClick}
                className={`w-full flex items-center p-4 rounded-lg ${action.bgColor} ${action.hoverColor} transition-colors text-left`}
              >
                <div className="flex-shrink-0">
                  <img src={action.svgIcon} alt="" className="h-6 w-6 opacity-80" />
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-semibold text-white">
                    {action.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-white/[0.06]">
          <Button
            variant="outline"
            className="w-full border-slate-700 text-slate-300 glass-hover hover:text-white"
            onClick={() => router.push(`/${gymSlug}`)}
          >
            Back to Gym Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
