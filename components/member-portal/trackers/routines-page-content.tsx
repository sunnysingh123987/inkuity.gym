'use client';

import { RoutineCardRedesigned } from '@/components/member-portal/workouts/routine-card-redesigned';
import { Dumbbell, Plus } from 'lucide-react';
import Link from 'next/link';

interface RoutinesPageContentProps {
  routines: any[];
  lastSessionDates: Record<string, string>;
  gymSlug: string;
}

export function RoutinesPageContent({
  routines,
  lastSessionDates,
  gymSlug,
}: RoutinesPageContentProps) {
  const activeCount = routines.filter((r) => r.is_active).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Your Workout Plans</h1>
        {activeCount > 0 && (
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-brand-cyan-500/15 text-brand-cyan-400 text-sm font-semibold border border-brand-cyan-500/30">
            {activeCount} Active {activeCount === 1 ? 'Plan' : 'Plans'}
          </span>
        )}
      </div>

      {/* Routine list */}
      {routines.length > 0 ? (
        <div className="space-y-4">
          {routines.map((routine) => (
            <RoutineCardRedesigned
              key={routine.id}
              routine={routine}
              gymSlug={gymSlug}
              lastSessionDate={lastSessionDates[routine.id]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-cyan-500/10 mb-4">
            <Dumbbell className="h-8 w-8 text-brand-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No routines yet
          </h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Create your first workout routine to start tracking your progress
          </p>
          <Link href={`/${gymSlug}/portal/workouts/new`}>
            <button className="px-6 py-3 rounded-full bg-brand-cyan-500 text-white font-semibold hover:bg-brand-cyan-600 transition-colors">
              Create Your First Routine
            </button>
          </Link>
        </div>
      )}

      {/* Floating action button */}
      <Link
        href={`/${gymSlug}/portal/workouts/new`}
        className="fixed bottom-24 right-6 z-50"
      >
        <button className="h-14 w-14 rounded-full bg-brand-cyan-500 flex items-center justify-center hover:bg-brand-cyan-600 transition-colors shadow-lg shadow-brand-cyan-500/25">
          <Plus className="h-6 w-6 text-white" />
        </button>
      </Link>
    </div>
  );
}
