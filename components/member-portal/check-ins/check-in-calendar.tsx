'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dumbbell,
  Footprints,
  Heart,
  Zap,
  Target,
  Bike,
  PersonStanding,
  Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  getCheckInCalendarDataEnhanced,
  type CalendarDayInfo,
} from '@/lib/actions/members-portal';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Icon mapping: category -> Lucide icon + colour classes
// ---------------------------------------------------------------------------
interface CategoryStyle {
  icon: LucideIcon;
  color: string; // text colour class
  bg: string; // subtle bg class
}

const CATEGORY_ICON_MAP: Record<string, CategoryStyle> = {
  chest: { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/15' },
  back: { icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  shoulders: { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  arms: { icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  biceps: { icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  triceps: { icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  legs: { icon: PersonStanding, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  glutes: { icon: PersonStanding, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  hamstrings: { icon: PersonStanding, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  quads: { icon: PersonStanding, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  calves: { icon: PersonStanding, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  core: { icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  abs: { icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  cardio: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  cycling: { icon: Bike, color: 'text-brand-cyan-400', bg: 'bg-brand-cyan-500/15' },
};

const DEFAULT_CHECKIN_STYLE: CategoryStyle = {
  icon: Footprints,
  color: 'text-emerald-400',
  bg: 'bg-emerald-500/15',
};

/** Given a day's data, pick the primary icon style to render. */
function getPrimaryStyle(info: CalendarDayInfo): CategoryStyle {
  // Priority: exercise categories from sessions > workout tags from check-ins > generic
  const allCategories = [
    ...info.exerciseCategories,
    ...info.workoutTags,
  ];
  if (allCategories.length > 0) {
    const primary = allCategories[0];
    return CATEGORY_ICON_MAP[primary] || { icon: Dumbbell, color: 'text-brand-cyan-400', bg: 'bg-brand-cyan-500/15' };
  }
  // Just a check-in with no specific workout
  return DEFAULT_CHECKIN_STYLE;
}

/** Build tooltip text for a day. */
function getTooltipText(info: CalendarDayInfo): string {
  const parts: string[] = [];
  if (info.routineNames.length > 0) {
    parts.push(info.routineNames.join(', '));
  }
  const cats = Array.from(new Set([...info.exerciseCategories, ...info.workoutTags]));
  if (cats.length > 0 && info.routineNames.length === 0) {
    parts.push(cats.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', '));
  }
  if (parts.length === 0) {
    parts.push('Checked in');
  }
  if (info.checkInCount > 1) {
    parts.push(`${info.checkInCount}x`);
  }
  return parts.join(' \u00b7 ');
}

// ---------------------------------------------------------------------------
// Month helpers
// ---------------------------------------------------------------------------
interface MonthDescriptor {
  month: number; // 1-based
  year: number;
  key: string; // e.g. "2026-03"
}

function getMonthDescriptor(date: Date): MonthDescriptor {
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return { month: m, year: y, key: `${y}-${String(m).padStart(2, '0')}` };
}

function addMonths(desc: MonthDescriptor, offset: number): MonthDescriptor {
  const d = new Date(desc.year, desc.month - 1 + offset, 1);
  return getMonthDescriptor(d);
}

/** Generate an array of month descriptors from start to end inclusive. */
function monthRange(start: MonthDescriptor, end: MonthDescriptor): MonthDescriptor[] {
  const result: MonthDescriptor[] = [];
  let current = { ...start };
  while (
    current.year < end.year ||
    (current.year === end.year && current.month <= end.month)
  ) {
    result.push({ ...current });
    current = addMonths(current, 1);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Compact day label headers
// ---------------------------------------------------------------------------
const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface CheckInCalendarProps {
  memberId: string;
  gymId: string;
}

/** How many months to load in each direction from the current month. */
const MONTHS_BUFFER = 3;

export function CheckInCalendar({ memberId, gymId }: CheckInCalendarProps) {
  const today = new Date();
  const todayDesc = getMonthDescriptor(today);

  // The loaded month range (initially current month +/- MONTHS_BUFFER)
  const [rangeStart, setRangeStart] = useState<MonthDescriptor>(
    addMonths(todayDesc, -MONTHS_BUFFER)
  );
  const [rangeEnd, setRangeEnd] = useState<MonthDescriptor>(
    addMonths(todayDesc, MONTHS_BUFFER)
  );
  const [calendarData, setCalendarData] = useState<Record<string, CalendarDayInfo>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Tooltip state (for mobile tap)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Ref for the scrollable container
  const scrollRef = useRef<HTMLDivElement>(null);
  // Ref to the "current month" header so we can scroll to it on load
  const currentMonthRef = useRef<HTMLDivElement>(null);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------
  const loadRange = useCallback(
    async (start: MonthDescriptor, count: number, merge = true) => {
      const result = await getCheckInCalendarDataEnhanced(
        memberId,
        gymId,
        start.month,
        start.year,
        count
      );
      if (result.success) {
        setCalendarData((prev) =>
          merge ? { ...prev, ...result.data } : result.data
        );
      }
    },
    [memberId, gymId]
  );

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const totalMonths =
        (rangeEnd.year - rangeStart.year) * 12 +
        (rangeEnd.month - rangeStart.month) +
        1;
      await loadRange(rangeStart, totalMonths, false);
      setLoading(false);
      // After data loads, scroll to current month
      requestAnimationFrame(() => {
        currentMonthRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Infinite scroll: load more when scrolling near top or bottom
  // -----------------------------------------------------------------------
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingMore) return;

    const threshold = 60;

    // Scrolled near top -> load older months
    if (el.scrollTop < threshold) {
      setLoadingMore(true);
      const newStart = addMonths(rangeStart, -MONTHS_BUFFER);
      const prevScrollHeight = el.scrollHeight;
      loadRange(newStart, MONTHS_BUFFER, true).then(() => {
        setRangeStart(newStart);
        setLoadingMore(false);
        // Restore scroll position so user doesn't jump
        requestAnimationFrame(() => {
          const delta = el.scrollHeight - prevScrollHeight;
          el.scrollTop += delta;
        });
      });
    }

    // Scrolled near bottom -> load newer months
    if (el.scrollTop + el.clientHeight > el.scrollHeight - threshold) {
      setLoadingMore(true);
      const newEnd = addMonths(rangeEnd, MONTHS_BUFFER);
      const loadStart = addMonths(rangeEnd, 1);
      loadRange(loadStart, MONTHS_BUFFER, true).then(() => {
        setRangeEnd(newEnd);
        setLoadingMore(false);
      });
    }
  }, [loadingMore, rangeStart, rangeEnd, loadRange]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Close tooltip on outside tap
  useEffect(() => {
    if (!activeTooltip) return;
    const handler = () => setActiveTooltip(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [activeTooltip]);

  // -----------------------------------------------------------------------
  // Build month blocks
  // -----------------------------------------------------------------------
  const months = monthRange(rangeStart, rangeEnd);

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden">
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-cyan-400" />
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="overflow-y-auto overscroll-contain px-3 pt-3 pb-3"
            style={{
              maxHeight: '370px',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Sticky weekday header */}
            <div className="sticky top-0 z-10 bg-slate-900 pb-1">
              <div className="grid grid-cols-7 gap-[3px]">
                {WEEKDAY_INITIALS.map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-[10px] font-medium text-slate-500 select-none leading-5"
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {months.map((md) => {
              const daysInMonth = new Date(md.year, md.month, 0).getDate();
              const firstDay = new Date(md.year, md.month - 1, 1).getDay();
              const totalSlots = Math.ceil((daysInMonth + firstDay) / 7) * 7;

              const isCurrentMonth =
                md.month === todayDesc.month && md.year === todayDesc.year;

              const monthLabel = new Date(md.year, md.month - 1, 1).toLocaleDateString(
                'en-US',
                { month: 'short', year: 'numeric' }
              );

              return (
                <div
                  key={md.key}
                  ref={isCurrentMonth ? currentMonthRef : undefined}
                  className="mb-4 last:mb-0"
                >
                  {/* Month label */}
                  <div
                    className={cn(
                      'text-[11px] font-semibold mb-1.5 select-none',
                      isCurrentMonth ? 'text-brand-cyan-400' : 'text-slate-500'
                    )}
                  >
                    {monthLabel}
                  </div>

                  {/* Day grid */}
                  <div className="grid grid-cols-7 gap-[3px]">
                    {Array.from({ length: totalSlots }, (_, i) => {
                      const dayNum = i - firstDay + 1;
                      const isValid = dayNum > 0 && dayNum <= daysInMonth;

                      if (!isValid) {
                        return <div key={i} className="aspect-square" />;
                      }

                      const dateKey = `${md.year}-${String(md.month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const info = calendarData[dateKey];
                      const isToday = dateKey === todayKey;
                      const hasActivity = !!info && info.checkInCount > 0;

                      // Get style for the icon
                      const style = hasActivity
                        ? getPrimaryStyle(info)
                        : null;

                      const IconComponent = style?.icon;
                      const tooltipText = hasActivity
                        ? getTooltipText(info)
                        : null;

                      const isTooltipActive = activeTooltip === dateKey;

                      return (
                        <div
                          key={i}
                          className="relative group"
                          onClick={(e) => {
                            if (!hasActivity) return;
                            e.stopPropagation();
                            setActiveTooltip(isTooltipActive ? null : dateKey);
                          }}
                        >
                          <div
                            className={cn(
                              'aspect-square rounded-md flex items-center justify-center transition-colors relative cursor-default',
                              hasActivity
                                ? `${style!.bg} hover:brightness-125`
                                : 'bg-slate-800/40',
                              isToday && 'ring-[1.5px] ring-brand-cyan-500 ring-offset-1 ring-offset-slate-900'
                            )}
                          >
                            {hasActivity && IconComponent ? (
                              <IconComponent
                                className={cn('w-3.5 h-3.5', style!.color)}
                                strokeWidth={2}
                              />
                            ) : (
                              <span
                                className={cn(
                                  'text-[10px] font-medium',
                                  isToday ? 'text-brand-cyan-400' : 'text-slate-600'
                                )}
                              >
                                {dayNum}
                              </span>
                            )}
                          </div>

                          {/* Tooltip: hover (desktop) / tap (mobile) */}
                          {hasActivity && tooltipText && (
                            <div
                              className={cn(
                                'absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 shadow-lg pointer-events-none whitespace-nowrap',
                                'text-[10px] leading-tight text-slate-200',
                                // Show on hover or active tap
                                isTooltipActive
                                  ? 'opacity-100 scale-100'
                                  : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100',
                                'transition-all duration-150 origin-bottom'
                              )}
                            >
                              <div className="font-medium">{tooltipText}</div>
                              <div className="text-slate-500 text-[9px] mt-0.5">
                                {new Date(md.year, md.month - 1, dayNum).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                <div className="w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45 -translate-y-1" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {loadingMore && (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-cyan-400" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
