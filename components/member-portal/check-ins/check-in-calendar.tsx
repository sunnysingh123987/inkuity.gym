'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { getCheckInCalendarData } from '@/lib/actions/members-portal';
import { cn } from '@/lib/utils';

interface CheckInCalendarProps {
  memberId: string;
  gymId: string;
}

export function CheckInCalendar({ memberId, gymId }: CheckInCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    loadCalendarData();
  }, [currentMonth, currentYear]);

  const loadCalendarData = async () => {
    setLoading(true);
    const result = await getCheckInCalendarData(
      memberId,
      gymId,
      currentMonth,
      currentYear
    );

    if (result.success) {
      setCalendarData(result.data);
    }
    setLoading(false);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();

  // Generate calendar grid
  const calendarDays = [];
  const totalSlots = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;

  for (let i = 0; i < totalSlots; i++) {
    const dayNumber = i - firstDayOfMonth + 1;
    const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;

    if (isValidDay) {
      const dateKey = `${currentYear}-${String(currentMonth).padStart(
        2,
        '0'
      )}-${String(dayNumber).padStart(2, '0')}`;
      const checkInCount = calendarData[dateKey] || 0;
      const hasCheckIn = checkInCount > 0;

      const today = new Date();
      const isToday =
        dayNumber === today.getDate() &&
        currentMonth === today.getMonth() + 1 &&
        currentYear === today.getFullYear();

      calendarDays.push({
        day: dayNumber,
        hasCheckIn,
        checkInCount,
        isToday,
        dateKey,
      });
    } else {
      calendarDays.push({ day: null, hasCheckIn: false, checkInCount: 0 });
    }
  }

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate stats for current month
  const totalCheckInsThisMonth = Object.values(calendarData).reduce(
    (sum, count) => sum + count,
    0
  );
  const daysWithCheckIns = Object.keys(calendarData).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Check-in Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              disabled={loading}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
          <div className="text-sm text-gray-600">
            {daysWithCheckIns} {daysWithCheckIns === 1 ? 'day' : 'days'} (
            {totalCheckInsThisMonth} total)
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Week day headers */}
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-gray-600 py-2"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((dayData, index) => {
                if (dayData.day === null) {
                  return <div key={index} className="aspect-square" />;
                }

                return (
                  <div
                    key={index}
                    className={cn(
                      'aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all relative',
                      dayData.hasCheckIn
                        ? 'bg-green-50 border-green-300 hover:bg-green-100'
                        : 'bg-white border-gray-200 hover:bg-gray-50',
                      dayData.isToday && 'ring-2 ring-indigo-500'
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium',
                        dayData.hasCheckIn
                          ? 'text-green-900'
                          : 'text-gray-700',
                        dayData.isToday && 'font-bold'
                      )}
                    >
                      {dayData.day}
                    </span>
                    {dayData.hasCheckIn && (
                      <div className="absolute top-1 right-1">
                        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                    {dayData.checkInCount > 1 && (
                      <span className="text-xs text-green-700 font-semibold mt-0.5">
                        {dayData.checkInCount}x
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-white border-2 border-gray-200" />
                <span className="text-gray-600">No check-in</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-green-50 border-2 border-green-300 flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-gray-600">Check-in</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-white border-2 border-indigo-500" />
                <span className="text-gray-600">Today</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
