'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { getCheckInCalendarData } from '@/lib/actions/members-portal';

interface StreakPageContentProps {
  streak: number;
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
  initialCheckInDays,
  memberId,
  gymId,
}: StreakPageContentProps) {
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
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center h-12 relative">
        <button
          onClick={() => router.back()}
          className="absolute left-0 h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800/50 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white w-full text-center">My Streak</h1>
      </div>

      {/* Motivational banner */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 px-5 py-4 text-center">
        <p className="text-sm text-slate-300">
          {streak === 0
            ? "Lost the streak? Don't lose the drive. Let's start fresh!"
            : "You're on fire! Keep the momentum going!"}
        </p>
      </div>

      {/* Streak hero */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full border-2 border-slate-600 flex items-center justify-center">
            <span className="text-4xl font-black text-white">{streak}</span>
          </div>
          <Flame className="h-8 w-8 text-amber-400" />
        </div>
        <span className="text-base font-semibold text-white">days streak</span>
      </div>

      {/* Calendar */}
      <div className={`bg-slate-800/30 rounded-2xl border border-slate-700/50 p-5 ${isPending ? 'opacity-60' : ''} transition-opacity`}>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-700/50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </button>
          <span className="text-xl font-bold text-white">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            disabled={!canGoForward}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-700/50 transition-colors disabled:opacity-30"
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
      <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 space-y-4">
        <p className="text-base font-bold text-white">How to increase your streak</p>
        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex gap-2">
            <span className="text-brand-cyan-400 font-bold shrink-0">1.</span>
            <span>Check in at the gym every day by scanning the QR code at the front desk.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-cyan-400 font-bold shrink-0">2.</span>
            <span>Each consecutive day you check in adds one to your streak.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-cyan-400 font-bold shrink-0">3.</span>
            <span>Missing a single day resets your streak back to zero.</span>
          </li>
        </ul>
        <div className="border-t border-slate-700/50 pt-4 mt-4">
          <p className="text-xs text-slate-500">
            Note: You must check in before you can log a workout. Workouts can only be recorded after a successful check-in for the day.
          </p>
        </div>
      </div>
    </div>
  );
}
