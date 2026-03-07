'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoutineCardRedesigned } from '@/components/member-portal/workouts/routine-card-redesigned';
import { WorkoutLogSheet } from '@/components/member-portal/workouts/workout-log-sheet';
import { Dumbbell, ClipboardList, Plus } from 'lucide-react';
import Link from 'next/link';

interface RoutinesPageContentProps {
  routines: any[];
  lastSessionDates: Record<string, string>;
  gymSlug: string;
  memberId: string;
  gymId: string;
  activeSession: { routineId: string; sessionId: string; totalExercises: number; completedExercises: number } | null;
}

export function RoutinesPageContent({
  routines,
  lastSessionDates,
  gymSlug,
  memberId,
  gymId,
  activeSession,
}: RoutinesPageContentProps) {
  const router = useRouter();
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  // Keyed by routine ID so progress persists after sheet closes
  const [liveProgressMap, setLiveProgressMap] = useState<Record<string, { completed: number; total: number }>>({});

  const handleProgressChange = useCallback((completed: number, total: number) => {
    setSelectedRoutine((current: any) => {
      if (current?.id) {
        setLiveProgressMap((prev) => ({ ...prev, [current.id]: { completed, total } }));
      }
      return current;
    });
  }, []);

  const handleSheetClose = () => {
    setSelectedRoutine(null);
    // Refresh server data in the background so next render has fresh activeSession
    router.refresh();
  };

  // Clear live progress once server data catches up
  useEffect(() => {
    if (activeSession) {
      setLiveProgressMap((prev) => {
        const { [activeSession.routineId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [activeSession]);

  // Sort: today first, then never-logged, then ascending by date (oldest first, recent at bottom)
  const sortedRoutines = [...routines].sort((a, b) => {
    const dateA = lastSessionDates[a.id];
    const dateB = lastSessionDates[b.id];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const aIsToday = dateA ? new Date(dateA) >= todayStart : false;
    const bIsToday = dateB ? new Date(dateB) >= todayStart : false;

    // Today first
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;

    // Never-logged next
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;

    // Both have dates (not today) — ascending (oldest first, recent at bottom)
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-white">My routines</h1>
        <ClipboardList className="h-5 w-5 text-brand-cyan-400" />
      </div>

      {/* Routine list */}
      {routines.length > 0 ? (
        <div className="space-y-3">
          {sortedRoutines.map((routine) => (
            <RoutineCardRedesigned
              key={routine.id}
              routine={routine}
              gymSlug={gymSlug}
              lastSessionDate={lastSessionDates[routine.id]}
              activeSessionId={
                (liveProgressMap[routine.id] && liveProgressMap[routine.id].completed > 0)
                  ? 'live'
                  : (activeSession && routine.id === activeSession.routineId ? activeSession.sessionId : undefined)
              }
              activeProgress={
                (liveProgressMap[routine.id] && liveProgressMap[routine.id].completed > 0)
                  ? liveProgressMap[routine.id]
                  : (activeSession && routine.id === activeSession.routineId ? { total: activeSession.totalExercises, completed: activeSession.completedExercises } : undefined)
              }
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
        onClose={handleSheetClose}
        onProgressChange={handleProgressChange}
      />
    </div>
  );
}
