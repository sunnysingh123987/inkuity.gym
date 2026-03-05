'use client';

import { useState } from 'react';
import { RoutineCardRedesigned } from '@/components/member-portal/workouts/routine-card-redesigned';
import { WorkoutLogSheet } from '@/components/member-portal/workouts/workout-log-sheet';
import { Dumbbell, Settings, Plus } from 'lucide-react';
import Link from 'next/link';

interface RoutinesPageContentProps {
  routines: any[];
  lastSessionDates: Record<string, string>;
  gymSlug: string;
  memberId: string;
  gymId: string;
  activeSession: { routineId: string; sessionId: string } | null;
}

export function RoutinesPageContent({
  routines,
  lastSessionDates,
  gymSlug,
  memberId,
  gymId,
  activeSession,
}: RoutinesPageContentProps) {
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-white">My routines</h1>
        <Settings className="h-5 w-5 text-brand-cyan-400" />
      </div>

      {/* Routine list */}
      {routines.length > 0 ? (
        <div className="space-y-3">
          {routines.map((routine) => (
            <RoutineCardRedesigned
              key={routine.id}
              routine={routine}
              gymSlug={gymSlug}
              lastSessionDate={lastSessionDates[routine.id]}
              activeSessionId={routine.id === activeSession?.routineId ? activeSession?.sessionId : undefined}
              onSelect={(r) => setSelectedRoutine(r)}
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
        </div>
      )}

      {/* Add Routine button */}
      <Link href={`/${gymSlug}/portal/workouts/new`} className="block">
        <button className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:border-slate-600 hover:text-white transition-colors flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          Add Routine
        </button>
      </Link>

      {/* Workout log bottom sheet */}
      <WorkoutLogSheet
        routine={selectedRoutine}
        gymSlug={gymSlug}
        memberId={memberId}
        gymId={gymId}
        open={!!selectedRoutine}
        onClose={() => setSelectedRoutine(null)}
      />
    </div>
  );
}
