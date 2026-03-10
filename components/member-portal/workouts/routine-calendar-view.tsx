'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Check,
  SkipForward,
  ChevronRight,
  Plus,
  Dumbbell,
  Play,
  Edit,
  Trash2,
  MoreVertical,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCategorySvg } from '@/lib/svg-icons';
import {
  skipRoutineForToday,
  deleteWorkoutRoutine,
  updateWorkoutRoutine,
} from '@/lib/actions/members-portal';
import { toast } from 'sonner';
import Link from 'next/link';

// ============================================================
// Types
// ============================================================

type DayStatus = 'completed' | 'skipped' | 'no-exercise' | 'today' | 'future';

interface RoutineForDay {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  schedule?: string[];
  routine_exercises?: any[];
}

interface CalendarDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, ...
  dayNum: number;
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
}

interface RoutineCalendarViewProps {
  routines: any[];
  completionDates: Record<string, string[]>;
  skippedDates: Record<string, string[]>;
  memberId: string;
  gymId: string;
  gymSlug: string;
}

// ============================================================
// Helpers
// ============================================================

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function getDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateCalendarDays(centerDate: Date, daysBefore = 7, daysAfter = 14): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: CalendarDay[] = [];

  for (let i = -daysBefore; i <= daysAfter; i++) {
    const date = new Date(centerDate);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const todayTime = today.getTime();
    const dateTime = date.getTime();

    days.push({
      date,
      dateStr: getDateStr(date),
      dayName: DAY_NAMES[date.getDay()],
      dayNum: date.getDate(),
      isToday: dateTime === todayTime,
      isFuture: dateTime > todayTime,
      isPast: dateTime < todayTime,
    });
  }

  return days;
}

function getScheduledRoutineForDay(
  routines: RoutineForDay[],
  day: CalendarDay
): RoutineForDay | null {
  const activeRoutines = routines.filter((r) => r.is_active);
  if (activeRoutines.length === 0) return null;

  // If routines have schedule arrays, match by day name
  const dayFullName = FULL_DAY_NAMES[day.date.getDay()];
  const dayShort = DAY_NAMES[day.date.getDay()];

  for (const routine of activeRoutines) {
    if (routine.schedule && routine.schedule.length > 0) {
      const matches = routine.schedule.some(
        (s: string) =>
          s.toLowerCase() === dayFullName.toLowerCase() ||
          s.toLowerCase() === dayShort.toLowerCase() ||
          s.substring(0, 3).toLowerCase() === dayShort.toLowerCase()
      );
      if (matches) return routine;
    }
  }

  // If no routine has a schedule, cycle active routines
  // This allows round-robin assignment to give variety
  const routinesWithoutSchedule = activeRoutines.filter(
    (r) => !r.schedule || r.schedule.length === 0
  );

  if (routinesWithoutSchedule.length > 0) {
    // Use the day's date to deterministically pick a routine
    const dayOfYear = Math.floor(
      (day.date.getTime() - new Date(day.date.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const index = dayOfYear % routinesWithoutSchedule.length;
    return routinesWithoutSchedule[index];
  }

  return null;
}

function getDayStatus(
  day: CalendarDay,
  routine: RoutineForDay | null,
  completionDates: Record<string, string[]>,
  skippedDates: Record<string, string[]>
): DayStatus {
  if (day.isFuture) return 'future';

  if (!routine) {
    if (day.isToday) return 'today';
    return 'no-exercise';
  }

  // Check completion first (works for both today and past)
  const completedDays = completionDates[routine.id] || [];
  if (completedDays.includes(day.dateStr)) return 'completed';

  // Check skipped (works for both today and past)
  const skippedDays = skippedDates[routine.id] || [];
  if (skippedDays.includes(day.dateStr)) return 'skipped';

  // Today with no action yet
  if (day.isToday) return 'today';

  // Past with no action
  return 'no-exercise';
}

function getPrimaryCategory(routine: any): string | null {
  const exercises = routine.routine_exercises || [];
  if (exercises.length === 0) return null;
  const first = exercises[0];
  const exercise = Array.isArray(first.exercise_library)
    ? first.exercise_library[0]
    : first.exercise_library;
  return exercise?.category?.toLowerCase() || null;
}

// ============================================================
// Swipeable Routine Card Sub-component
// ============================================================

interface SwipeableRoutineTabProps {
  routine: RoutineForDay;
  day: CalendarDay;
  status: DayStatus;
  gymSlug: string;
  memberId: string;
  gymId: string;
  onSkipComplete: () => void;
}

function SwipeableRoutineTab({
  routine,
  day,
  status,
  gymSlug,
  memberId,
  gymId,
  onSkipComplete,
}: SwipeableRoutineTabProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDragging = useRef(false);

  const isInteractive = day.isToday && status === 'today';
  const exerciseCount = routine.routine_exercises?.length || 0;
  const category = getPrimaryCategory(routine);
  const categorySvg = getCategorySvg(category || 'full-body');

  // Touch handlers for swipe
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isInteractive) return;
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      isDragging.current = false;
    },
    [isInteractive]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isInteractive || !touchStartRef.current) return;
      const touch = e.touches[0];
      const diffX = touch.clientX - touchStartRef.current.x;
      const diffY = Math.abs(touch.clientY - touchStartRef.current.y);

      // Only allow left swipe, check vertical vs horizontal
      if (!isDragging.current && diffY > Math.abs(diffX)) {
        touchStartRef.current = null;
        return;
      }

      if (diffX < -10) {
        isDragging.current = true;
        // Resist at boundaries, only allow negative (left) swipe
        const clamped = Math.max(diffX, -200);
        setTranslateX(clamped);
      }
    },
    [isInteractive]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isInteractive || !touchStartRef.current) return;

    const swipeDistance = Math.abs(translateX);
    const swipeTime = Date.now() - touchStartRef.current.time;
    const velocity = swipeDistance / swipeTime;

    // If swiped far enough or fast enough, trigger skip
    if (swipeDistance > 100 || (velocity > 0.5 && swipeDistance > 40)) {
      setShowSkipConfirm(true);
      setTranslateX(-100);
    } else {
      // Bounce back
      setTranslateX(0);
    }

    touchStartRef.current = null;
    isDragging.current = false;
  }, [isInteractive, translateX]);

  // Mouse drag handlers for desktop
  const mouseStartRef = useRef<{ x: number; time: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isInteractive) return;
      mouseStartRef.current = { x: e.clientX, time: Date.now() };
      isDragging.current = false;
    },
    [isInteractive]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isInteractive || !mouseStartRef.current) return;
      const diffX = e.clientX - mouseStartRef.current.x;

      if (diffX < -10) {
        isDragging.current = true;
        const clamped = Math.max(diffX, -200);
        setTranslateX(clamped);
      }
    },
    [isInteractive]
  );

  const handleMouseUp = useCallback(() => {
    if (!isInteractive || !mouseStartRef.current) return;

    const swipeDistance = Math.abs(translateX);
    const swipeTime = Date.now() - mouseStartRef.current.time;
    const velocity = swipeDistance / swipeTime;

    if (swipeDistance > 100 || (velocity > 0.5 && swipeDistance > 40)) {
      setShowSkipConfirm(true);
      setTranslateX(-100);
    } else {
      setTranslateX(0);
    }

    mouseStartRef.current = null;
    isDragging.current = false;
  }, [isInteractive, translateX]);

  const handleMouseLeave = useCallback(() => {
    if (mouseStartRef.current) {
      setTranslateX(0);
      mouseStartRef.current = null;
      isDragging.current = false;
    }
  }, []);

  const handleSkip = async () => {
    setIsSkipping(true);
    setIsAnimatingOut(true);

    // Animate fully off screen
    setTranslateX(-500);

    // Perform skip action
    const result = await skipRoutineForToday(memberId, gymId, routine.id);
    if (result.success) {
      toast.success(`${routine.name} skipped for today`);
      // Wait for animation to finish
      setTimeout(() => {
        onSkipComplete();
      }, 400);
    } else {
      toast.error('Failed to skip routine');
      setIsAnimatingOut(false);
      setTranslateX(0);
      setIsSkipping(false);
      setShowSkipConfirm(false);
    }
  };

  const handleCancelSkip = () => {
    setShowSkipConfirm(false);
    setTranslateX(0);
  };

  const handleStartWorkout = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault();
      return;
    }
    if (routine.is_active && exerciseCount > 0) {
      router.push(`/${gymSlug}/portal/workouts/${routine.id}/start`);
    }
  };

  // Status styles
  const getStatusClasses = () => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'skipped':
        return 'glass opacity-60';
      case 'no-exercise':
        return 'glass opacity-40';
      case 'today':
        return 'glass border-brand-cyan-500/40 shadow-lg shadow-brand-cyan-500/10';
      case 'future':
        return 'glass';
      default:
        return 'glass';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Skip confirmation background revealed on swipe */}
      {isInteractive && (
        <div className="absolute inset-0 bg-red-500/20 rounded-xl flex items-center justify-end pr-6 z-0">
          {showSkipConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkip}
                disabled={isSkipping}
                className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg
                           hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isSkipping ? 'Skipping...' : 'Skip'}
              </button>
              <button
                onClick={handleCancelSkip}
                className="px-4 py-2 glass text-slate-300 text-sm font-semibold rounded-lg
                           glass-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-400">
              <SkipForward className="h-5 w-5" />
              <span className="text-sm font-medium">Skip</span>
            </div>
          )}
        </div>
      )}

      {/* Main card (swipeable) */}
      <div
        ref={cardRef}
        className={`relative z-10 border rounded-xl p-3.5 ${getStatusClasses()}
          ${isInteractive ? 'cursor-grab active:cursor-grabbing' : ''}
          ${isAnimatingOut ? '' : 'select-none'}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition:
            isDragging.current || isAnimatingOut
              ? isAnimatingOut
                ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease'
                : 'none'
              : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isAnimatingOut ? 0 : 1,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-3">
          {/* Category icon */}
          <div
            className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center overflow-hidden
            ${status === 'completed' ? 'bg-emerald-500/20' : 'bg-brand-cyan-500/10'}`}
          >
            {status === 'completed' ? (
              <Check className="h-5 w-5 text-emerald-400" />
            ) : status === 'skipped' ? (
              <SkipForward className="h-4 w-4 text-slate-500" />
            ) : (
              <img
                src={categorySvg}
                alt=""
                className="h-5 w-5 invert opacity-70"
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4
              className={`text-sm font-semibold truncate ${
                status === 'completed'
                  ? 'text-emerald-300'
                  : status === 'skipped'
                  ? 'text-slate-500 line-through'
                  : status === 'no-exercise'
                  ? 'text-slate-600'
                  : status === 'today'
                  ? 'text-white'
                  : 'text-slate-400'
              }`}
            >
              {routine.name}
            </h4>
            <p
              className={`text-xs mt-0.5 ${
                status === 'completed'
                  ? 'text-emerald-500/70'
                  : status === 'skipped'
                  ? 'text-slate-600'
                  : status === 'today'
                  ? 'text-slate-400'
                  : 'text-slate-600'
              }`}
            >
              {status === 'completed'
                ? 'Completed'
                : status === 'skipped'
                ? 'Skipped'
                : `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Right side action / status */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {status === 'completed' && (
              <div className="h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="h-4 w-4 text-emerald-400" />
              </div>
            )}
            {status === 'today' && (
              <button
                onClick={handleStartWorkout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-cyan-500 text-white text-xs font-semibold
                           rounded-full hover:bg-brand-cyan-600 transition-colors"
              >
                <Play className="h-3 w-3" />
                Start
              </button>
            )}
            {status === 'future' && (
              <ChevronRight className="h-4 w-4 text-slate-600" />
            )}
          </div>
        </div>

        {/* Swipe hint for today */}
        {isInteractive && !showSkipConfirm && translateX === 0 && (
          <div className="mt-2 flex items-center justify-center">
            <p className="text-[10px] text-slate-600 tracking-wide">
              Swipe left to skip
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Empty Day Card Sub-component
// ============================================================

function EmptyDayCard({ day }: { day: CalendarDay }) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        day.isToday
          ? 'glass'
          : day.isPast
          ? 'glass opacity-40'
          : 'glass'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center
          ${day.isToday ? 'glass' : 'glass'}`}
        >
          <Dumbbell className={`h-5 w-5 ${day.isToday ? 'text-slate-500' : 'text-slate-700'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${day.isToday ? 'text-slate-500' : 'text-slate-700'}`}>
            {day.isToday ? 'Rest day' : day.isPast ? 'No exercise' : 'Rest day'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Calendar View
// ============================================================

export function RoutineCalendarView({
  routines,
  completionDates,
  skippedDates,
  memberId,
  gymId,
  gymSlug,
}: RoutineCalendarViewProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [localSkippedDates, setLocalSkippedDates] = useState(skippedDates);
  const [deletingRoutine, setDeletingRoutine] = useState<string | null>(null);
  const [togglingRoutine, setTogglingRoutine] = useState<string | null>(null);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete'; routineId: string; routineName: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarDays = generateCalendarDays(today, 7, 14);
  const activeRoutines = routines.filter((r: any) => r.is_active);

  // Scroll to today on mount
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
      // Offset a bit for the header
      if (scrollRef.current) {
        scrollRef.current.scrollTop -= 80;
      }
    }
  }, []);

  // Animate confirm sheet in/out
  useEffect(() => {
    if (showConfirmSheet) {
      requestAnimationFrame(() => setSheetVisible(true));
    } else {
      setSheetVisible(false);
    }
  }, [showConfirmSheet]);

  const handleSkipComplete = () => {
    // Refresh the page to get updated data
    router.refresh();
  };

  const handleDeleteRoutine = (routineId: string, routineName: string) => {
    setConfirmAction({ type: 'delete', routineId, routineName });
    setShowConfirmSheet(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirming(true);

    if (confirmAction.type === 'delete') {
      setDeletingRoutine(confirmAction.routineId);
      const result = await deleteWorkoutRoutine(confirmAction.routineId);
      if (result.success) {
        toast.success('Routine deleted');
        setSheetVisible(false);
        setTimeout(() => {
          setShowConfirmSheet(false);
          setConfirmAction(null);
          setConfirming(false);
          setDeletingRoutine(null);
          router.refresh();
        }, 300);
        return;
      } else {
        toast.error('Failed to delete routine');
      }
      setDeletingRoutine(null);
    }

    setConfirming(false);
  };

  const handleDismissConfirmSheet = () => {
    if (confirming) return;
    setSheetVisible(false);
    setTimeout(() => {
      setShowConfirmSheet(false);
      setConfirmAction(null);
    }, 300);
  };

  const handleToggleActive = async (routine: any) => {
    setTogglingRoutine(routine.id);
    const result = await updateWorkoutRoutine(routine.id, {
      is_active: !routine.is_active,
    });
    if (result.success) {
      toast.success(routine.is_active ? 'Routine deactivated' : 'Routine activated');
      router.refresh();
    } else {
      toast.error('Failed to update routine');
    }
    setTogglingRoutine(null);
  };

  // Get the current month/year label
  const monthLabel = today.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Routines</h1>
          <p className="text-sm text-slate-500 mt-0.5">{monthLabel}</p>
        </div>
        <Link href={`/${gymSlug}/portal/workouts/new`}>
          <button className="h-10 w-10 rounded-full bg-brand-cyan-500 flex items-center justify-center hover:bg-brand-cyan-600 transition-colors shadow-lg shadow-brand-cyan-500/25">
            <Plus className="h-5 w-5 text-white" />
          </button>
        </Link>
      </div>

      {/* Active routine pills */}
      {activeRoutines.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {routines.map((routine: any) => {
            const category = getPrimaryCategory(routine);
            const categorySvg = getCategorySvg(category || 'full-body');

            return (
              <div
                key={routine.id}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border
                  ${
                    routine.is_active
                      ? 'bg-brand-cyan-500/10 border-brand-cyan-500/30 text-brand-cyan-400'
                      : 'glass-pill text-slate-500'
                  }`}
              >
                <img src={categorySvg} alt="" className="h-3.5 w-3.5 invert opacity-60" />
                <span className="text-xs font-medium whitespace-nowrap">{routine.name}</span>
                {/* Three-dot menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => router.push(`/${gymSlug}/portal/workouts/${routine.id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleActive(routine)}
                      disabled={togglingRoutine === routine.id}
                    >
                      {routine.is_active ? (
                        <>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteRoutine(routine.id, routine.name)}
                      disabled={deletingRoutine === routine.id}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar list */}
      {routines.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-cyan-500/10 mb-4">
            <Dumbbell className="h-8 w-8 text-brand-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No routines yet</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Create your first workout routine to start tracking your progress
          </p>
          <Link href={`/${gymSlug}/portal/workouts/new`}>
            <button className="px-6 py-3 rounded-full bg-brand-cyan-500 text-white font-semibold hover:bg-brand-cyan-600 transition-colors">
              Create Your First Routine
            </button>
          </Link>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="space-y-0 -webkit-overflow-scrolling-touch"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {calendarDays.map((day, index) => {
            const routine = getScheduledRoutineForDay(activeRoutines, day);
            const status = routine
              ? getDayStatus(day, routine, completionDates, localSkippedDates)
              : day.isToday
              ? 'today'
              : day.isFuture
              ? 'future'
              : 'no-exercise';

            const isToday = day.isToday;

            // Month separator
            const showMonthSeparator =
              index > 0 &&
              day.date.getMonth() !== calendarDays[index - 1].date.getMonth();

            return (
              <div key={day.dateStr}>
                {showMonthSeparator && (
                  <div className="py-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-800" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {day.date.toLocaleDateString('en-US', { month: 'long' })}
                    </span>
                    <div className="h-px flex-1 bg-slate-800" />
                  </div>
                )}

                <div
                  ref={isToday ? todayRef : undefined}
                  className={`flex gap-3 py-2 transition-all duration-300 ${
                    isToday ? 'py-3' : ''
                  }`}
                >
                  {/* Left column: Day */}
                  <div
                    className={`flex-shrink-0 w-12 flex flex-col items-center pt-3 ${
                      isToday ? 'pt-3.5' : ''
                    }`}
                  >
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isToday
                          ? 'text-brand-cyan-400'
                          : day.isPast
                          ? 'text-slate-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={`text-lg font-bold leading-tight mt-0.5 ${
                        isToday
                          ? 'text-white bg-brand-cyan-500 rounded-full h-8 w-8 flex items-center justify-center text-sm'
                          : day.isPast
                          ? status === 'completed'
                            ? 'text-emerald-400'
                            : 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                  </div>

                  {/* Right column: Routine card */}
                  <div className="flex-1 min-w-0">
                    {routine ? (
                      <SwipeableRoutineTab
                        routine={routine}
                        day={day}
                        status={status}
                        gymSlug={gymSlug}
                        memberId={memberId}
                        gymId={gymId}
                        onSkipComplete={handleSkipComplete}
                      />
                    ) : (
                      <EmptyDayCard day={day} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Bottom Sheet — portaled to body */}
      {showConfirmSheet && confirmAction && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${sheetVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleDismissConfirmSheet}
          />
          {/* Sheet */}
          <div
            className={`relative w-full max-w-md mx-auto glass-sheet rounded-t-2xl p-6 pb-8 transition-transform duration-300 ease-out ${sheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {confirmAction.type === 'delete' ? 'Delete Routine' : 'Confirm'}
              </h3>
              <p className="text-sm text-slate-400">
                {confirmAction.type === 'delete'
                  ? <>Are you sure you want to delete <span className="text-white font-medium">{confirmAction.routineName}</span>? This action cannot be undone.</>
                  : 'Are you sure you want to proceed?'}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 px-4 py-3 rounded-xl glass text-slate-300 font-semibold text-sm glass-hover transition-colors"
                onClick={handleDismissConfirmSheet}
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                onClick={handleConfirmAction}
                disabled={confirming}
              >
                {confirming
                  ? confirmAction.type === 'delete' ? 'Deleting...' : 'Confirming...'
                  : confirmAction.type === 'delete' ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
