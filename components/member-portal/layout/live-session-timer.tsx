'use client';

import { useState, useEffect, useRef } from 'react';

interface LiveSessionTimerProps {
  startTime: string;
  onElapsedChange?: (ms: number) => void;
}

export function LiveSessionTimer({ startTime, onElapsedChange }: LiveSessionTimerProps) {
  const [elapsed, setElapsed] = useState('00:00');
  const onElapsedChangeRef = useRef(onElapsedChange);
  onElapsedChangeRef.current = onElapsedChange;

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = Date.now();
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

      onElapsedChangeRef.current?.(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className="font-mono text-sm font-semibold tabular-nums">
      {elapsed}
    </span>
  );
}
