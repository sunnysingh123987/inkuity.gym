'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { ExerciseSetLogger } from '@/components/member-portal/sessions/exercise-set-logger';
import {
  startWorkoutSession,
  getActiveWorkoutSession,
} from '@/lib/actions/members-portal';
import { toast } from 'sonner';

interface WorkoutLogSheetProps {
  routine: any;
  gymSlug: string;
  memberId: string;
  gymId: string;
  open: boolean;
  onClose: () => void;
  onProgressChange?: (completed: number, total: number) => void;
}

function getTodaySets(exerciseSets: any[]): any[] {
  if (!exerciseSets) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return exerciseSets.filter((s: any) => {
    const created = new Date(s.created_at);
    return created >= today;
  });
}

export function WorkoutLogSheet({
  routine,
  gymSlug,
  memberId,
  gymId,
  open,
  onClose,
  onProgressChange,
}: WorkoutLogSheetProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [setsCount, setSetsCount] = useState<Record<string, number>>({});
  const [visible, setVisible] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (open) {
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  // Load or create session when sheet opens
  useEffect(() => {
    if (!open || !routine) return;

    let cancelled = false;

    async function initSession() {
      setLoading(true);

      // Check for an existing active session first
      const activeResult = await getActiveWorkoutSession(memberId, gymId);
      if (cancelled) return;

      if (activeResult.success && activeResult.data && activeResult.data.routine_id === routine.id) {
        // Reuse existing session
        setSession(activeResult.data);
        initSetsCount(activeResult.data);
        setLoading(false);
        return;
      }

      // Start a new session
      const result = await startWorkoutSession(memberId, gymId, routine.id);
      if (cancelled) return;

      if (result.success && result.data) {
        // Re-fetch to get full session with exercises and sets
        const freshResult = await getActiveWorkoutSession(memberId, gymId);
        if (cancelled) return;

        if (freshResult.success && freshResult.data) {
          setSession(freshResult.data);
          initSetsCount(freshResult.data);
        } else {
          setSession(result.data);
        }
      } else {
        toast.error(result.error || 'Failed to start session');
      }

      setLoading(false);
    }

    initSession();
    return () => { cancelled = true; };
  }, [open, routine, memberId, gymId]);

  function initSetsCount(sessionData: any) {
    const counts: Record<string, number> = {};
    (sessionData.session_exercises || []).forEach((se: any) => {
      const todaySets = getTodaySets(se.exercise_sets || []);
      if (todaySets.length > 0) {
        counts[se.id] = todaySets.length;
      }
    });
    setSetsCount(counts);
  }

  const handleSetsChange = useCallback((exerciseId: string, count: number) => {
    setSetsCount((prev) => {
      const updated = { ...prev, [exerciseId]: count };
      // Report progress: count exercises with at least 1 set logged
      const exercisesWithSets = Object.values(updated).filter((c) => c > 0).length;
      const totalExercises = session?.session_exercises?.length || 0;
      onProgressChange?.(exercisesWithSets, totalExercises);
      return updated;
    });
  }, [session, onProgressChange]);

  const handleBackdropClick = () => {
    onClose();
  };

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setSession(null);
        setExpandedId(null);
        setSetsCount({});
      }, 300); // after transition
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open && !visible) return null;

  const exercises = session?.session_exercises
    ? [...session.session_exercises].sort((a: any, b: any) => a.order_index - b.order_index)
    : [];

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 rounded-t-2xl transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '75vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              {routine?.name || 'Workout'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(75vh - 120px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-brand-cyan-400 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((sessionExercise: any) => {
                const exercise = Array.isArray(sessionExercise.exercise_library)
                  ? sessionExercise.exercise_library[0]
                  : sessionExercise.exercise_library;

                const isExpanded = expandedId === sessionExercise.id;
                const loggedSets = setsCount[sessionExercise.id] || 0;

                return (
                  <div
                    key={sessionExercise.id}
                    className={`rounded-xl border transition-colors ${
                      isExpanded
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Exercise header */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === sessionExercise.id ? null : sessionExercise.id
                        )
                      }
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <h3 className="font-semibold text-white text-base">
                        {exercise?.name || 'Exercise'}
                      </h3>
                      <div className="flex items-center gap-2">
                        {loggedSets > 0 && (
                          <div className="flex gap-0.5">
                            {Array.from({ length: Math.min(loggedSets, 5) }).map((_, i) => (
                              <Zap
                                key={i}
                                className="h-4 w-4 text-brand-cyan-400 fill-brand-cyan-400"
                              />
                            ))}
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded set logger */}
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <ExerciseSetLogger
                          sessionExerciseId={sessionExercise.id}
                          existingSets={getTodaySets(sessionExercise.exercise_sets || [])}
                          onSetsChange={(count) =>
                            handleSetsChange(sessionExercise.id, count)
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Done button — just closes the sheet; session stays in_progress for the day */}
        {session && !loading && (
          <div className="px-4 pb-6 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-brand-cyan-500 text-white font-semibold text-base hover:bg-brand-cyan-600 transition-colors flex items-center justify-center"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
