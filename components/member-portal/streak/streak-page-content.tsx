'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AnimatedFire } from '@/components/member-portal/streak/animated-fire';
import { getCheckInCalendarData } from '@/lib/actions/members-portal';

interface StreakPageContentProps {
  streak: number;
  checkedInToday?: boolean;
  initialCheckInDays: Record<string, number>;
  memberId: string;
  gymId: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StreakPageContent({
  streak,
  checkedInToday = false,
  initialCheckInDays,
  memberId,
  gymId,
}: StreakPageContentProps) {
  const atRisk = streak > 0 && !checkedInToday;
  const router = useRouter();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [checkInDays, setCheckInDays] = useState<Record<string, number>>(initialCheckInDays);
  const [isPending, startTransition] = useTransition();

  const today = now.getDate();
  const todayMonth = now.getMonth() + 1;
  const todayYear = now.getFullYear();
  const isCurrentMonth = currentMonth === todayMonth && currentYear === todayYear;

  function navigateMonth(direction: -1 | 1) {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    startTransition(async () => {
      const result = await getCheckInCalendarData(memberId, gymId, newMonth, newYear);
      setCheckInDays(result.data || {});
    });
  }

  // Build calendar grid
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  // getDay() returns 0=Sun, we want 0=Mon
  const firstDayOfWeek = (new Date(currentYear, currentMonth - 1, 1).getDay() + 6) % 7;

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  function getDayKey(day: number) {
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Don't allow navigating to future months
  const canGoForward = !(currentMonth === todayMonth && currentYear === todayYear);

  return (
    <div className="space-y-3 pb-8">
      {/* Header */}
      <div className="flex items-center h-12 relative">
        <button
          onClick={() => router.back()}
          className="absolute left-0 h-10 w-10 flex items-center justify-center rounded-full glass-hover transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white w-full text-center">My Streak</h1>
      </div>

      {/* Motivational text */}
      <p className="text-sm text-slate-400 text-center">
        {streak === 0
          ? "Lost the streak? Don't lose the drive. Let's start fresh!"
          : "You're on fire! Keep the momentum going!"}
      </p>

      {/* Streak hero */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <span className="text-5xl font-black text-white">{streak}</span>
          <AnimatedFire streak={streak} atRisk={atRisk} className="h-12 w-12" />
        </div>
        <span className="text-base font-semibold text-slate-400">{streak === 1 ? 'day' : 'days'} streak</span>
      </div>

      {/* Calendar */}
      <div className={`glass rounded-2xl p-5 ${isPending ? 'opacity-60' : ''} transition-opacity`}>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="h-8 w-8 flex items-center justify-center rounded-full glass-hover transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </button>
          <span className="text-xl font-bold text-white">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            disabled={!canGoForward}
            className="h-8 w-8 flex items-center justify-center rounded-full glass-hover transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAY_HEADERS.map((day, i) => (
            <div key={i} className="text-center text-xs text-slate-500 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-2">
          {calendarCells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />;
            }

            const key = getDayKey(day);
            const hasCheckIn = (checkInDays[key] || 0) > 0;
            const isToday = isCurrentMonth && day === today;
            const isFuture = isCurrentMonth
              ? day > today
              : currentYear > todayYear || (currentYear === todayYear && currentMonth > todayMonth);

            let cellClasses = 'w-9 h-9 rounded-full flex items-center justify-center mx-auto text-sm font-medium';

            if (hasCheckIn) {
              cellClasses += ' bg-brand-cyan-500/20 text-brand-cyan-400';
            } else if (isFuture) {
              cellClasses += ' text-slate-600';
            } else {
              cellClasses += ' text-slate-400 bg-slate-700/30';
            }

            if (isToday) {
              cellClasses += ' ring-2 ring-brand-cyan-400';
            }

            return (
              <div key={`day-${day}`} className={cellClasses}>
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* How streaks work */}
      <div className="mt-6 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">How streaks work</h4>
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <ChevronRight className="h-4 w-4 text-brand-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">Check in at the gym every day by scanning the QR code at the front desk</p>
          </div>
          <div className="flex items-start gap-3">
            <ChevronRight className="h-4 w-4 text-brand-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">Each consecutive day you check in adds one to your streak</p>
          </div>
          <div className="flex items-start gap-3">
            <ChevronRight className="h-4 w-4 text-brand-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">Missing a single day resets your streak back to zero</p>
          </div>
        </div>
      </div>
    </div>
  );
}
