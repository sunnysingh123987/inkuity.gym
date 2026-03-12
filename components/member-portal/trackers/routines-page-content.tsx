'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoutineCardRedesigned } from '@/components/member-portal/workouts/routine-card-redesigned';
import { WorkoutLogSheet } from '@/components/member-portal/workouts/workout-log-sheet';
import { CreateRoutineSheet } from '@/components/member-portal/workouts/create-routine-sheet';
import { Dumbbell, ClipboardList, Plus, MousePointerClick, Pencil } from 'lucide-react';

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
  const [showCreateSheet, setShowCreateSheet] = useState(false);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">My routines</h1>
          <ClipboardList className="h-5 w-5 text-brand-cyan-400" />
        </div>
        <button
          onClick={() => setShowCreateSheet(true)}
          className="h-9 w-9 rounded-xl bg-brand-cyan-500/15 flex items-center justify-center text-brand-cyan-400 hover:bg-brand-cyan-500/25 transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
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

      {/* Instructions */}
      {routines.length > 0 && (
        <div className="mt-6 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">How it works</h4>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <MousePointerClick className="h-4 w-4 text-brand-cyan-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500">Tap a routine to start logging your workout</p>
            </div>
            <div className="flex items-start gap-3">
              <Plus className="h-4 w-4 text-brand-cyan-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500">Use the + button to create a new routine</p>
            </div>
            <div className="flex items-start gap-3">
              <Pencil className="h-4 w-4 text-brand-cyan-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500">Open the menu on any card to edit or delete it</p>
            </div>
            <div className="flex items-start gap-3">
              <Dumbbell className="h-4 w-4 text-brand-cyan-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500">Active routines glow until all exercises are completed</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Create routine bottom sheet */}
      <CreateRoutineSheet
        open={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        memberId={memberId}
        gymId={gymId}
        gymSlug={gymSlug}
      />
    </div>
  );
}
