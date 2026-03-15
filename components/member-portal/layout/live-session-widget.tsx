'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  ChevronUp,
  ChevronDown,
  Dumbbell,
  Loader2,
  Zap,
  X,
  ChevronRight,
} from 'lucide-react';
import { LiveSessionTimer } from './live-session-timer';
import { checkOutMember } from '@/lib/actions/checkin-flow';
import {
  getWorkoutRoutines,
  getWorkoutRoutine,
  startWorkoutSession,
  ensureWorkoutSession,
} from '@/lib/actions/members-portal';
import { WorkoutLogSheet } from '@/components/member-portal/workouts/workout-log-sheet';
import { toast } from '@/components/ui/toaster';

const WARNING_MS = 75 * 60 * 1000; // 75 min
const AUTO_CHECKOUT_MS = 90 * 60 * 1000; // 90 min

interface ExerciseSet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  created_at: string;
}

interface SessionExercise {
  id: string;
  order_index?: number;
  completed: boolean;
  exercise_library?: { id: string; name: string } | { id: string; name: string }[];
  exercise_sets?: ExerciseSet[];
}

interface ActiveWorkout {
  id: string;
  routine_id?: string;
  workout_routines?: { name: string } | { name: string }[];
  session_exercises?: SessionExercise[];
}

interface LiveSessionWidgetProps {
  checkInTime: string;
  memberId: string;
  gymId: string;
  gymSlug: string;
  activeWorkout: ActiveWorkout | null;
}

/** Only sets created today */
function getTodaySets(sets: ExerciseSet[]): ExerciseSet[] {
  if (!sets) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return sets.filter((s) => new Date(s.created_at) >= today);
}

/** Does this exercise have at least 1 valid set? */
function hasLoggedSets(exercise: SessionExercise): boolean {
  return getTodaySets(exercise.exercise_sets || []).some(
    (s) => (s.weight != null && s.weight > 0) || (s.reps != null && s.reps > 0)
  );
}

/** Gradient color for set pill: yellow(1) → orange(3-4) → red(6+) */
function pillColor(index: number, total: number): string {
  // Map position to 0–1 based on a scale where 4 sets ≈ midpoint
  const t = Math.min(index / 5, 1);
  // Yellow #EAB308 → Orange #F97316 → Red #EF4444
  if (t <= 0.5) {
    const p = t / 0.5;
    const r = Math.round(234 + (249 - 234) * p);
    const g = Math.round(179 + (115 - 179) * p);
    const b = Math.round(8 + (22 - 8) * p);
    return `rgb(${r},${g},${b})`;
  }
  const p = (t - 0.5) / 0.5;
  const r = Math.round(249 + (239 - 249) * p);
  const g = Math.round(115 + (68 - 115) * p);
  const b = Math.round(22 + (68 - 22) * p);
  return `rgb(${r},${g},${b})`;
}

/** Most recent set timestamp for an exercise (for sorting) */
function latestSetTime(exercise: SessionExercise): number {
  const todaySets = getTodaySets(exercise.exercise_sets || []).filter(
    (s) => (s.weight != null && s.weight > 0) || (s.reps != null && s.reps > 0)
  );
  if (todaySets.length === 0) return 0;
  return Math.max(...todaySets.map((s) => new Date(s.created_at).getTime()));
}

export function LiveSessionWidget({
  checkInTime,
  memberId,
  gymId,
  gymSlug,
  activeWorkout,
}: LiveSessionWidgetProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [warning, setWarning] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Routine picker sheet
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [routineSheetVisible, setRoutineSheetVisible] = useState(false);
  const [routines, setRoutines] = useState<any[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [startingRoutine, setStartingRoutine] = useState<string | null>(null);

  // Quick start sheet
  const [showQuickStartSheet, setShowQuickStartSheet] = useState(false);
  const [quickStartSheetVisible, setQuickStartSheetVisible] = useState(false);
  const [startingQuick, setStartingQuick] = useState(false);

  // WorkoutLogSheet
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [routineForSheet, setRoutineForSheet] = useState<any>(null);
  const [loadingRoutineForSheet, setLoadingRoutineForSheet] = useState(false);
  const routineCacheRef = useRef<any>(null);

  // Slide-up entry animation
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Sheet animation helpers
  useEffect(() => {
    if (showRoutineSheet) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setRoutineSheetVisible(true));
    } else {
      setRoutineSheetVisible(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showRoutineSheet]);

  useEffect(() => {
    if (showQuickStartSheet) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setQuickStartSheetVisible(true));
    } else {
      setQuickStartSheetVisible(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showQuickStartSheet]);

  // Collapse when clicking outside the widget
  useEffect(() => {
    if (collapsed) return;
    const handleClick = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setCollapsed(true);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [collapsed]);

  // Handle elapsed time for auto-checkout thresholds
  const handleElapsedChange = useCallback(
    (ms: number) => {
      if (ms >= AUTO_CHECKOUT_MS && !checkedOut) {
        setCheckedOut(true);
        checkOutMember(memberId, gymId).then((result) => {
          if (result.success) {
            toast.info('You have been automatically checked out after 1.5 hours.');
            router.refresh();
          }
        });
      } else if (ms >= WARNING_MS && !warning) {
        setWarning(true);
      }
    },
    [checkedOut, warning, memberId, gymId, router]
  );

  const handleCheckOut = async () => {
    if (checkingOut) return;
    setCheckingOut(true);
    try {
      const result = await checkOutMember(memberId, gymId);
      if (result.success) {
        setShowCheckoutConfirm(false);
        toast.success('Checked out successfully!');
        setExiting(true);
        setTimeout(() => {
          setCheckedOut(true);
          router.refresh();
        }, 300);
      } else {
        toast.error(result.error || 'Check-out failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setCheckingOut(false);
    }
  };

  // ── Routine picker ──
  const openRoutineSheet = async () => {
    setShowRoutineSheet(true);
    if (routines.length > 0) return;
    setLoadingRoutines(true);
    try {
      const result = await getWorkoutRoutines(memberId, gymId);
      if (result.success) setRoutines(result.data);
    } catch { /* silent */ } finally {
      setLoadingRoutines(false);
    }
  };

  const handleStartRoutine = async (routineId: string) => {
    setStartingRoutine(routineId);
    try {
      const result = await ensureWorkoutSession(memberId, gymId, routineId);
      if (result.success) {
        setShowRoutineSheet(false);
        toast.success('Workout started!');
        router.refresh();
      } else if ((result as any).conflict) {
        toast.warning(`You already have a "${(result as any).conflictRoutineName}" session today.`);
      } else if ((result as any).notCheckedIn) {
        toast.error('You must be checked in to start a workout.');
      } else {
        toast.error(result.error || 'Failed to start workout');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setStartingRoutine(null);
    }
  };

  // ── Quick start ──
  const handleQuickStart = async () => {
    setStartingQuick(true);
    try {
      const result = await startWorkoutSession(memberId, gymId);
      if (result.success) {
        setShowQuickStartSheet(false);
        toast.success('Freestyle workout started!');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to start workout');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setStartingQuick(false);
    }
  };

  // ── Open WorkoutLogSheet (fetch routine on first click, then cache) ──
  const openWorkoutLogSheet = async () => {
    if (routineCacheRef.current) {
      setRoutineForSheet(routineCacheRef.current);
      setShowLogSheet(true);
      return;
    }
    if (!activeWorkout?.routine_id) return;
    setLoadingRoutineForSheet(true);
    try {
      const result = await getWorkoutRoutine(activeWorkout.routine_id);
      if (result.success && result.data) {
        routineCacheRef.current = result.data;
        setRoutineForSheet(result.data);
        setShowLogSheet(true);
      } else {
        toast.error('Failed to load routine');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoadingRoutineForSheet(false);
    }
  };

  if (checkedOut) return null;

  // ── Compute workout display data ──
  const routineName = activeWorkout
    ? Array.isArray(activeWorkout.workout_routines)
      ? activeWorkout.workout_routines[0]?.name
      : activeWorkout.workout_routines?.name
    : null;

  const allExercises = activeWorkout?.session_exercises || [];
  // Exercises with at least 1 logged set, sorted most-recently-logged first
  const loggedExercises = allExercises
    .filter(hasLoggedSets)
    .sort((a, b) => latestSetTime(b) - latestSetTime(a));

  const totalSets = allExercises.reduce(
    (sum, e) => sum + (getTodaySets(e.exercise_sets || []).filter(
      (s) => (s.weight != null && s.weight > 0) || (s.reps != null && s.reps > 0)
    ).length),
    0
  );

  const warningBorder = warning ? 'border-amber-500/60' : 'border-white/[0.08]';

  return (
    <>
      {/* ── Fixed Widget Bar ── */}
      <div
        className={`fixed bottom-[68px] left-0 right-0 z-40 flex justify-center transition-transform duration-300 ease-out ${
          mounted && !exiting ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          ref={widgetRef}
          className={`w-full max-w-md mx-4 glass-nav rounded-t-xl border ${warningBorder} overflow-hidden`}
          style={{ borderBottom: 'none' }}
        >
          {collapsed ? (
            /* ── Collapsed: thin bar with latest exercise ── */
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex items-center justify-between px-4 py-2 gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <LiveSessionTimer
                  startTime={checkInTime}
                  onElapsedChange={handleElapsedChange}
                />
                {loggedExercises.length > 0 ? (() => {
                  const latest = loggedExercises[0];
                  const name = latest.exercise_library
                    ? Array.isArray(latest.exercise_library)
                      ? latest.exercise_library[0]?.name
                      : latest.exercise_library.name
                    : null;
                  const setCount = getTodaySets(latest.exercise_sets || []).filter(
                    (s) => (s.weight != null && s.weight > 0) || (s.reps != null && s.reps > 0)
                  ).length;
                  return name ? (
                    <>
                      <span className="text-[11px] text-slate-400 truncate">{name}</span>
                      {setCount > 0 && (
                        <div className="flex gap-0.5 shrink-0">
                          {Array.from({ length: setCount }).map((_, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-1.5 rounded-sm"
                              style={{ backgroundColor: pillColor(i, setCount) }}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : null;
                })() : warning ? (
                  <span className="text-[10px] text-amber-400 font-medium">
                    Auto-checkout soon
                  </span>
                ) : null}
              </div>
              <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
            </button>
          ) : (
            /* ── Expanded ── */
            <div className="px-4 py-3 space-y-2">
              {/* Timer row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs text-slate-400">Live Session</span>
                  <LiveSessionTimer
                    startTime={checkInTime}
                    onElapsedChange={handleElapsedChange}
                  />
                </div>
                <button
                  onClick={() => setCollapsed(true)}
                  className="p-1 rounded-md glass-hover transition-colors"
                >
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              {warning && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[11px] text-amber-400">
                    Auto-checkout in ~15 min
                  </span>
                </div>
              )}

              {activeWorkout ? (
                /* ── Active workout: routine heading + logged exercises ── */
                <div className="space-y-1.5">
                  {/* Routine heading */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white truncate">
                      {routineName || 'Workout'}
                    </p>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {loggedExercises.length}/{allExercises.length} exercises · {totalSets} sets
                    </span>
                  </div>

                  {/* Stacked exercises with logged sets */}
                  {loggedExercises.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto overscroll-contain">
                      {loggedExercises.map((ex) => {
                        const exName = ex.exercise_library
                          ? Array.isArray(ex.exercise_library)
                            ? ex.exercise_library[0]?.name
                            : ex.exercise_library.name
                          : 'Exercise';
                        const validSets = getTodaySets(ex.exercise_sets || []).filter(
                          (s) => (s.weight != null && s.weight > 0) || (s.reps != null && s.reps > 0)
                        );
                        return (
                          <button
                            key={ex.id}
                            onClick={openWorkoutLogSheet}
                            disabled={loadingRoutineForSheet}
                            className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg glass-hover transition-colors text-left disabled:opacity-60"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan-400 shrink-0" />
                            <span className="flex-1 text-xs text-slate-300 truncate">
                              {exName}
                            </span>
                            <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                              {validSets.length} {validSets.length === 1 ? 'set' : 'sets'}
                            </span>
                            <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Loading indicator when fetching routine */}
                  {loadingRoutineForSheet && (
                    <div className="flex items-center justify-center py-1">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-cyan-400" />
                    </div>
                  )}

                  {/* If no logged exercises yet, show prompt */}
                  {loggedExercises.length === 0 && (
                    <button
                      onClick={openWorkoutLogSheet}
                      disabled={loadingRoutineForSheet}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-cyan-500/10 text-brand-cyan-400 text-xs font-medium hover:bg-brand-cyan-500/20 transition-colors disabled:opacity-60"
                    >
                      <Dumbbell className="h-3.5 w-3.5" />
                      Log Sets
                    </button>
                  )}
                </div>
              ) : (
                /* ── No workout: action buttons ── */
                <div className="flex items-center gap-2">
                  <button
                    onClick={openRoutineSheet}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-cyan-500/10 text-brand-cyan-400 text-xs font-medium hover:bg-brand-cyan-500/20 transition-colors"
                  >
                    <Dumbbell className="h-3.5 w-3.5" />
                    Start Routine
                  </button>
                  <button
                    onClick={() => setShowQuickStartSheet(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Quick
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Routine Picker Sheet ── */}
      {(showRoutineSheet || routineSheetVisible) &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overscroll-none touch-none">
            <div
              onClick={() => setShowRoutineSheet(false)}
              onTouchMove={(e) => e.preventDefault()}
              className={`absolute inset-0 glass-backdrop transition-opacity duration-300 ${
                routineSheetVisible ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              className={`absolute bottom-0 left-0 right-0 glass-sheet rounded-t-2xl transition-transform duration-300 ease-out touch-auto overscroll-contain ${
                routineSheetVisible ? 'translate-y-0' : 'translate-y-full'
              }`}
              style={{ maxHeight: '65vh' }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between px-4 pb-3">
                <h2 className="text-lg font-bold text-white">Pick a Routine</h2>
                <button
                  onClick={() => setShowRoutineSheet(false)}
                  className="p-2 rounded-lg glass-hover transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <div
                className="overflow-y-auto px-4 pb-6 overscroll-contain"
                style={{ maxHeight: 'calc(65vh - 80px)' }}
              >
                {loadingRoutines ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-cyan-400" />
                  </div>
                ) : routines.length === 0 ? (
                  <div className="text-center py-12">
                    <Dumbbell className="h-7 w-7 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-500">No routines yet</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Create one from the Routines tab
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {routines.map((routine: any) => {
                      const exerciseCount = routine.routine_exercises?.length || 0;
                      const isStarting = startingRoutine === routine.id;
                      return (
                        <button
                          key={routine.id}
                          onClick={() => handleStartRoutine(routine.id)}
                          disabled={!!startingRoutine}
                          className="w-full flex items-center gap-3 p-3 rounded-xl glass glass-hover transition-colors text-left disabled:opacity-60"
                        >
                          <div className="w-10 h-10 rounded-xl bg-brand-cyan-500/15 flex items-center justify-center shrink-0">
                            {isStarting ? (
                              <Loader2 className="h-5 w-5 animate-spin text-brand-cyan-400" />
                            ) : (
                              <Dumbbell className="h-5 w-5 text-brand-cyan-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {routine.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Quick Start Sheet ── */}
      {(showQuickStartSheet || quickStartSheetVisible) &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overscroll-none touch-none">
            <div
              onClick={() => setShowQuickStartSheet(false)}
              onTouchMove={(e) => e.preventDefault()}
              className={`absolute inset-0 glass-backdrop transition-opacity duration-300 ${
                quickStartSheetVisible ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              className={`absolute bottom-0 left-0 right-0 glass-sheet rounded-t-2xl transition-transform duration-300 ease-out touch-auto overscroll-contain ${
                quickStartSheetVisible ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="px-4 pb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Quick Start</h2>
                  <button
                    onClick={() => setShowQuickStartSheet(false)}
                    className="p-2 rounded-lg glass-hover transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl glass">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                    <Zap className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Freestyle Workout</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Start an empty session and add exercises as you go
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleQuickStart}
                  disabled={startingQuick}
                  className="w-full py-3 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {startingQuick ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Start Workout
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── WorkoutLogSheet (reused from routines page) ── */}
      {routineForSheet && (
        <WorkoutLogSheet
          routine={routineForSheet}
          gymSlug={gymSlug}
          memberId={memberId}
          gymId={gymId}
          open={showLogSheet}
          onClose={() => {
            setShowLogSheet(false);
            router.refresh();
          }}
        />
      )}

      {/* ── Checkout Confirmation Modal ── */}
      {showCheckoutConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center glass-backdrop px-4 overscroll-none touch-none">
            <div className="glass-modal rounded-2xl p-6 max-w-sm w-full space-y-4">
              <h3 className="text-lg font-semibold text-white text-center">
                Check Out?
              </h3>
              <p className="text-sm text-slate-400 text-center">
                Are you sure you want to check out of the gym?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCheckoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl glass text-slate-300 text-sm font-medium glass-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={checkingOut}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-60"
                >
                  {checkingOut ? 'Checking out...' : 'Check Out'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
