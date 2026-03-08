'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ScanLine, Dumbbell, ListChecks, Loader2, Check, LogOut, X, Calendar, ChevronDown } from 'lucide-react';
import { recordQRCheckIn, checkOutMember } from '@/lib/actions/checkin-flow';
import { getAuthenticatedMemberInfo } from '@/lib/actions/pin-auth';
import { getWorkoutSessionHistory } from '@/lib/actions/members-portal';
import { toast } from 'sonner';

interface DashboardQuickActionsProps {
  gymSlug: string;
  alreadyCheckedIn?: boolean;
  activeCheckIn?: { id: string; check_in_at: string } | null;
  memberId?: string;
  gymId?: string;
  liveTraffic?: number;
}

export function DashboardQuickActions({
  gymSlug,
  alreadyCheckedIn = false,
  activeCheckIn = null,
  memberId,
  gymId,
  liveTraffic,
}: DashboardQuickActionsProps) {
  const router = useRouter();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(alreadyCheckedIn);
  const [checkingOut, setCheckingOut] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showWorkouts, setShowWorkouts] = useState(false);
  const [workoutsVisible, setWorkoutsVisible] = useState(false);
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const hasActiveCheckIn = activeCheckIn && !isCheckedOut;

  // Animate sheet in/out
  useEffect(() => {
    if (showWorkouts) {
      requestAnimationFrame(() => setWorkoutsVisible(true));
    } else {
      setWorkoutsVisible(false);
    }
  }, [showWorkouts]);

  const openWorkoutsSheet = async () => {
    setShowWorkouts(true);
    if (workoutSessions.length > 0) return; // Already loaded
    if (!memberId || !gymId) return;
    setLoadingWorkouts(true);
    try {
      const result = await getWorkoutSessionHistory(memberId, gymId, 10);
      if (result.success) {
        setWorkoutSessions(result.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const closeWorkoutsSheet = () => {
    setShowWorkouts(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };


  const handleCheckIn = async () => {
    if (checkingIn || checkedIn) return;
    setCheckingIn(true);
    try {
      const authResult = await getAuthenticatedMemberInfo(gymSlug);
      if (!authResult.success || !authResult.data) {
        toast.error('Session expired. Please sign in again.');
        router.replace(`/${gymSlug}/portal/sign-in`);
        return;
      }
      const { memberId: mId, gymId: gId } = authResult.data;
      const result = await recordQRCheckIn(mId, gId);
      if (result.success) {
        setCheckedIn(true);
        if (result.alreadyCheckedIn) {
          toast.info('Already checked in today');
        } else {
          router.push(`/${gymSlug}/portal/check-in-success`);
        }
      } else {
        toast.error(result.error || 'Check-in failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!memberId || !gymId || checkingOut) return;
    setCheckingOut(true);
    try {
      const result = await checkOutMember(memberId, gymId);
      if (result.success) {
        setIsCheckedOut(true);
        setShowCheckoutConfirm(false);
        toast.success('Checked out successfully!');
        router.refresh();
      } else {
        toast.error(result.error || 'Check-out failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setCheckingOut(false);
    }
  };

  // Determine check-in/check-out button state
  let primaryAction: {
    label: string;
    icon: typeof ScanLine;
    color: string;
    iconClass: string;
    onClick: () => void;
    disabled: boolean;
  };

  if (hasActiveCheckIn) {
    primaryAction = {
      label: 'Check Out',
      icon: checkingOut ? Loader2 : LogOut,
      color: 'bg-orange-500/15 text-orange-400',
      iconClass: checkingOut ? 'h-6 w-6 animate-spin' : 'h-6 w-6',
      onClick: () => setShowCheckoutConfirm(true),
      disabled: checkingOut,
    };
  } else {
    primaryAction = {
      label: checkedIn ? 'Done' : 'Check In',
      icon: checkedIn ? Check : checkingIn ? Loader2 : ScanLine,
      color: checkedIn ? 'bg-emerald-500/15 text-emerald-400' : 'bg-brand-cyan-500/15 text-brand-cyan-400',
      iconClass: checkingIn ? 'h-6 w-6 animate-spin' : 'h-6 w-6',
      onClick: handleCheckIn,
      disabled: checkingIn || checkedIn,
    };
  }

  const actions = [
    primaryAction,
    {
      label: 'Workouts',
      icon: Dumbbell,
      color: 'bg-purple-500/15 text-purple-400',
      iconClass: 'h-6 w-6',
      onClick: openWorkoutsSheet,
      disabled: false,
    },
    {
      label: 'Routines',
      icon: ListChecks,
      color: 'bg-blue-500/15 text-blue-400',
      iconClass: 'h-6 w-6',
      onClick: () => router.push(`/${gymSlug}/portal/trackers`),
      disabled: false,
    },
  ];

  return (
    <>
      {liveTraffic != null && liveTraffic > 0 && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs text-slate-400">
            <span className="font-semibold text-white">{liveTraffic}</span> {liveTraffic === 1 ? 'person' : 'people'} in gym now
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`flex flex-col items-center gap-2 active:scale-[0.95] transition-transform ${action.disabled ? 'opacity-60' : ''}`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.color}`}>
              <action.icon className={action.iconClass} />
            </div>
            <span className="text-xs text-slate-400 font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Workouts history bottom sheet (portal to body) */}
      {(showWorkouts || workoutsVisible) && createPortal(
        <div className="fixed inset-0 z-50">
          <div
            onClick={closeWorkoutsSheet}
            className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
              workoutsVisible ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`absolute bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 rounded-t-2xl transition-transform duration-300 ease-out ${
              workoutsVisible ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{ maxHeight: '75vh' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-lg font-bold text-white">Recent Workouts</h2>
              <button
                type="button"
                onClick={closeWorkoutsSheet}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div
              className="overflow-y-auto px-4 pb-6 overscroll-contain"
              style={{ maxHeight: 'calc(75vh - 80px)' }}
            >
              {loadingWorkouts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                </div>
              ) : (() => {
                // Filter to only sessions with at least 1 exercise with valid sets
                const recordedSessions = workoutSessions.filter((session: any) =>
                  (session.session_exercises || []).some((ex: any) =>
                    (ex.exercise_sets || []).some((s: any) => (s.weight && s.weight > 0) || (s.reps && s.reps > 0))
                  )
                );
                return recordedSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Dumbbell className="h-7 w-7 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm text-slate-500">No workouts yet</p>
                  <p className="text-xs text-slate-600 mt-1">Start a workout from your routines</p>
                  <button
                    onClick={() => {
                      closeWorkoutsSheet();
                      router.push(`/${gymSlug}/portal/trackers`);
                    }}
                    className="mt-3 px-4 py-2 rounded-lg bg-brand-cyan-500/15 text-brand-cyan-400 text-sm font-medium hover:bg-brand-cyan-500/25 transition-colors"
                  >
                    Browse routines
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recordedSessions.map((session: any) => {
                    const routineName = Array.isArray(session.workout_routines)
                      ? session.workout_routines[0]?.name
                      : session.workout_routines?.name;
                    const isExpanded = expandedSession === session.id;
                    // Only include exercises that have at least 1 valid set
                    const exercises = (session.session_exercises || []).filter((ex: any) =>
                      (ex.exercise_sets || []).some((s: any) => (s.weight && s.weight > 0) || (s.reps && s.reps > 0))
                    );
                    return (
                      <div key={session.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                          className="w-full p-4 flex items-center gap-4 hover:bg-slate-800/80 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                            <Dumbbell className="h-5 w-5 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {routineName || 'Workout Session'}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(session.started_at)}
                              </span>
                              {exercises.length > 0 && (
                                <span>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && exercises.length > 0 && (
                          <div className="border-t border-slate-700/50 px-4 py-3 space-y-2">
                            {exercises
                              .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
                              .map((ex: any) => {
                                const exName = Array.isArray(ex.exercise_library)
                                  ? ex.exercise_library[0]?.name
                                  : ex.exercise_library?.name;
                                const sets = ex.exercise_sets || [];
                                const completedSets = sets.filter((s: any) => s.completed);
                                return (
                                  <div key={ex.id} className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ex.completed ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-slate-300 truncate">{exName || 'Exercise'}</p>
                                    </div>
                                    <span className="text-[11px] text-slate-500 shrink-0">
                                      {completedSets.length}/{sets.length} sets
                                    </span>
                                  </div>
                                );
                              })}
                            <button
                              onClick={() => {
                                closeWorkoutsSheet();
                                router.push(`/${gymSlug}/portal/sessions/${session.id}`);
                              }}
                              className="text-xs text-brand-cyan-400 font-medium mt-1 hover:text-brand-cyan-300 transition-colors"
                            >
                              View full session
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => {
                      closeWorkoutsSheet();
                      router.push(`/${gymSlug}/portal/workouts`);
                    }}
                    className="w-full py-3 text-sm text-brand-cyan-400 font-medium hover:text-brand-cyan-300 transition-colors"
                  >
                    View all workouts
                  </button>
                </div>
              );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Check-out confirmation modal */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold text-white text-center">Check Out?</h3>
            <p className="text-sm text-slate-400 text-center">
              Are you sure you want to check out of the gym?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
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
        </div>
      )}
    </>
  );
}
