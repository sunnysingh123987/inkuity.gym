'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronUp, Zap, AlertTriangle } from 'lucide-react';
import { ExerciseSetLogger } from '@/components/member-portal/sessions/exercise-set-logger';
import {
  getActiveWorkoutSession,
  ensureWorkoutSession,
  deleteWorkoutSession,
} from '@/lib/actions/members-portal';
import { getActiveCheckIn, getTodayCheckInStatus } from '@/lib/actions/checkin-flow';
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
  const [conflict, setConflict] = useState<{
    routineName: string;
    sessionId: string;
  } | null>(null);
  const [resolvingConflict, setResolvingConflict] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'loading' | 'active' | 'checked-out' | 'none'>('loading');
  const [checkOutAt, setCheckOutAt] = useState<string | undefined>();
  const sessionCreatedRef = useRef(false);

  // Animate in/out
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  // Load existing session (if any) when sheet opens — NO eager creation
  useEffect(() => {
    if (!open || !routine) return;

    let cancelled = false;

    async function loadSession() {
      setLoading(true);
      sessionCreatedRef.current = false;

      // Check check-in status
      const ciStatus = await getTodayCheckInStatus(memberId, gymId);
      if (cancelled) return;
      setCheckInStatus(ciStatus.status);
      setCheckOutAt(ciStatus.checkOutAt);

      // Also allow logging if actively checked in (for ensureWorkoutSession server check)
      // getActiveCheckIn is still used server-side

      // Check if there's an existing session for this routine today
      const activeResult = await getActiveWorkoutSession(memberId, gymId, routine.id);
      if (cancelled) return;

      if (activeResult.success && activeResult.data) {
        // Reuse existing session — check if it has valid sets
        const hasValidSets = (activeResult.data.session_exercises || []).some((se: any) =>
          (se.exercise_sets || []).some((s: any) => (s.weight && s.weight > 0) || (s.reps && s.reps > 0))
        );
        setSession(activeResult.data);
        if (hasValidSets) sessionCreatedRef.current = true;
        initSetsCount(activeResult.data);
      }
      // If no session, exercises will be rendered from routine prop

      setLoading(false);
    }

    loadSession();
    return () => { cancelled = true; };
  }, [open, routine, memberId, gymId]);

  function initSetsCount(sessionData: any) {
    const counts: Record<string, number> = {};
    (sessionData.session_exercises || []).forEach((se: any) => {
      const todaySets = getTodaySets(se.exercise_sets || []);
      // Only count sets with non-zero values
      const validSets = todaySets.filter((s: any) => (s.weight && s.weight > 0) || (s.reps && s.reps > 0));
      if (validSets.length > 0) {
        counts[se.id] = validSets.length;
      }
    });
    setSetsCount(counts);
  }

  // Use a ref for session so the ensure callback always has the latest value
  const sessionRef = useRef<any>(null);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Called by ExerciseSetLogger before persisting the first valid set
  const handleEnsureSession = async (exerciseId: string): Promise<string | null> => {
    // If we've already confirmed this session is valid for today, just return the ID
    if (sessionCreatedRef.current && sessionRef.current) {
      const se = sessionRef.current.session_exercises?.find((s: any) =>
        s.exercise_id === exerciseId || s.exercise_library?.id === exerciseId
      );
      return se?.id || null;
    }

    // Always go through ensureWorkoutSession for conflict detection
    const result = await ensureWorkoutSession(memberId, gymId, routine.id);

    if (result.notCheckedIn) {
      toast.error('Check in to the gym first to log your workout');
      return null;
    }

    if (result.conflict) {
      setConflict({
        routineName: result.conflictRoutineName || 'another routine',
        sessionId: result.conflictSessionId!,
      });
      return null; // Abort — user needs to confirm
    }

    if (result.success && result.data) {
      setSession(result.data);
      sessionCreatedRef.current = true;
      initSetsCount(result.data);
      const se = result.data.session_exercises?.find((s: any) =>
        s.exercise_library?.id === exerciseId
      );
      return se?.id || null;
    }

    toast.error(result.error || 'Failed to start session');
    return null;
  };

  const handleConfirmConflict = async () => {
    if (!conflict) return;
    setResolvingConflict(true);

    // Delete the conflicting session
    await deleteWorkoutSession(conflict.sessionId);

    // Now create the new session
    const result = await ensureWorkoutSession(memberId, gymId, routine.id);

    if (result.success && result.data) {
      setSession(result.data);
      sessionCreatedRef.current = true;
      initSetsCount(result.data);
      toast.success('Switched to this routine');
    } else {
      toast.error(result.error || 'Failed to start session');
    }

    setConflict(null);
    setResolvingConflict(false);
  };

  // Report progress to parent whenever setsCount changes
  useEffect(() => {
    const exercisesWithSets = Object.values(setsCount).filter((c) => c > 0).length;
    const totalExercises = session?.session_exercises?.length || (routine?.routine_exercises?.length || 0);
    onProgressChange?.(exercisesWithSets, totalExercises);
  }, [setsCount, session, routine, onProgressChange]);

  const handleSetsChange = (exerciseId: string, count: number) => {
    setSetsCount((prev) => ({ ...prev, [exerciseId]: count }));
  };

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
        setConflict(null);
        setCheckInStatus('loading');
        setCheckOutAt(undefined);
        sessionCreatedRef.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open && !visible) return null;

  // Use session exercises if available, otherwise build from routine prop
  const exercises = session?.session_exercises
    ? [...session.session_exercises].sort((a: any, b: any) => a.order_index - b.order_index)
    : (routine?.routine_exercises || [])
        .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((re: any) => ({
          id: re.id, // routine_exercise id as fallback key
          order_index: re.order_index,
          exercise_library: re.exercise_library,
          exercise_id: re.exercise_id,
          exercise_sets: [],
        }));

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className={`absolute inset-0 glass-backdrop transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Conflict warning modal */}
      {conflict && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center glass-backdrop px-4">
          <div className="glass-modal rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Switch routine?</h3>
            </div>
            <p className="text-sm text-slate-400">
              Your today&apos;s active routine is <span className="font-semibold text-white">{conflict.routineName}</span>. Logging in this routine will delete your previous logged sets.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConflict(null)}
                className="flex-1 py-2.5 rounded-xl glass text-slate-300 text-sm font-medium glass-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConflict}
                disabled={resolvingConflict}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-60"
              >
                {resolvingConflict ? 'Switching...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 glass-sheet rounded-t-2xl transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '75vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
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
            className="p-2 rounded-lg glass-hover transition-colors flex-shrink-0"
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
                        ? 'glass border-white/[0.08]'
                        : 'glass border-white/[0.04] hover:border-white/[0.08]'
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
                          sessionExerciseId={session ? sessionExercise.id : null}
                          exerciseId={exercise?.id}
                          existingSets={getTodaySets(sessionExercise.exercise_sets || [])}
                          onSetsChange={(count) =>
                            handleSetsChange(sessionExercise.id, count)
                          }
                          onEnsureSession={handleEnsureSession}
                          checkInStatus={checkInStatus}
                          checkOutAt={checkOutAt}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Done button */}
        {!loading && (
          <div className="px-4 pb-6 pt-2 border-t border-white/[0.06]">
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
    </div>,
    document.body
  );
}
