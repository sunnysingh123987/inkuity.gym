'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface SessionTimerProps {
  startTime: string;
}

export function SessionTimer({ startTime }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = now - start;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setElapsed(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else {
        setElapsed(
          `${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg">
      <Clock className="h-4 w-4 text-indigo-600" />
      <span className="font-mono text-lg font-semibold text-indigo-600">
        {elapsed}
      </span>
    </div>
  );
}
