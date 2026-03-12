'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

import readyToFire from '@/public/icons/animated/ready_to_fire.json';
import fireCold from '@/public/icons/animated/fire_cold.json';
import fireStart from '@/public/icons/animated/fire_start.json';
import fireLong from '@/public/icons/animated/fire_long.json';

interface AnimatedFireProps {
  streak: number;
  /** Whether the streak is at risk of breaking (skipped yesterday) */
  atRisk?: boolean;
  className?: string;
}

export function AnimatedFire({ streak, atRisk = false, className = 'h-6 w-6' }: AnimatedFireProps) {
  const animationData = useMemo(() => {
    if (atRisk) return fireCold;
    if (streak === 0) return readyToFire;
    if (streak <= 5) return fireStart;
    return fireLong;
  }, [streak, atRisk]);

  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      className={className}
    />
  );
}
