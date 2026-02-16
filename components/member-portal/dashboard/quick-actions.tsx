'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Plus, Dumbbell, Apple, Calendar } from 'lucide-react';

interface QuickActionsProps {
  gymSlug: string;
}

export function QuickActions({ gymSlug }: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      title: 'Start Workout',
      description: 'Begin a new workout session',
      icon: Dumbbell,
      color: 'text-brand-purple-400',
      bgColor: 'bg-slate-800',
      hoverColor: 'hover:bg-slate-700',
      onClick: () => router.push(`/${gymSlug}/portal/workouts`),
    },
    {
      title: 'Create Routine',
      description: 'Design a new workout routine',
      icon: Plus,
      color: 'text-brand-cyan-400',
      bgColor: 'bg-slate-800',
      hoverColor: 'hover:bg-slate-700',
      onClick: () => router.push(`/${gymSlug}/portal/workouts/new`),
    },
    {
      title: 'View Diet Plan',
      description: 'Track your nutrition',
      icon: Apple,
      color: 'text-brand-pink-400',
      bgColor: 'bg-slate-800',
      hoverColor: 'hover:bg-slate-700',
      onClick: () => router.push(`/${gymSlug}/portal/diet`),
    },
    {
      title: 'Check-in History',
      description: 'View your attendance',
      icon: Calendar,
      color: 'text-brand-blue-400',
      bgColor: 'bg-slate-800',
      hoverColor: 'hover:bg-slate-700',
      onClick: () => router.push(`/${gymSlug}/portal/check-ins`),
    },
  ];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={action.onClick}
                className={`w-full flex items-center p-4 rounded-lg ${action.bgColor} ${action.hoverColor} transition-colors text-left`}
              >
                <div className="flex-shrink-0">
                  <Icon className={`h-6 w-6 ${action.color}`} />
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

        <div className="mt-6 pt-6 border-t border-slate-800">
          <Button
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => router.push(`/${gymSlug}`)}
          >
            Back to Gym Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
