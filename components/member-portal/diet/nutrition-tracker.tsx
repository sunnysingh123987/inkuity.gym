'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import caloriesAnimation from '@/public/icons/animated/calories.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionTrackerProps {
  targets: NutritionTargets;
  consumed: DayNutrition;
  /** Maintenance (TDEE) calories — used to decide if over-target is bulking (green) or cutting (red) */
  maintenanceCalories?: number;
}

const MACROS = [
  { key: 'protein' as const, label: 'Protein', color: 'rgb(96, 165, 250)', bgColor: 'rgba(96, 165, 250, 0.15)' },
  { key: 'carbs' as const, label: 'Carbs', color: 'rgb(250, 204, 21)', bgColor: 'rgba(250, 204, 21, 0.15)' },
  { key: 'fat' as const, label: 'Fat', color: 'rgb(52, 211, 153)', bgColor: 'rgba(52, 211, 153, 0.15)' },
];

const ROTATE_INTERVAL = 6000;

type Phase = 'visible' | 'exit' | 'enter';

export function NutritionTracker({ targets, consumed, maintenanceCalories }: NutritionTrackerProps) {
  // Bulking = calorie target above maintenance → over-target is positive (green)
  // Cutting = calorie target at or below maintenance → over-target is negative (red)
  const isBulking = maintenanceCalories != null && targets.calories > maintenanceCalories;
  const isMaintaining = maintenanceCalories != null && Math.abs(targets.calories - maintenanceCalories) <= 100;
  const overColor = isBulking ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)';
  const overColorBg = isBulking ? 'rgba(52, 211, 153, 0.25)' : 'rgba(248, 113, 113, 0.25)';
  const overColorBorder = isBulking ? 'rgba(52, 211, 153, 0.6)' : 'rgba(248, 113, 113, 0.6)';
  const overTextClass = isBulking ? 'text-emerald-400' : 'text-red-400';

  const modeTag = (() => {
    if (maintenanceCalories == null) return null;
    if (isMaintaining) return { text: 'Holding the line', color: 'text-brand-cyan-400/60' };
    if (isBulking) return { text: 'Beast mode', color: 'text-emerald-400/60' };
    return { text: 'Shredding', color: 'text-red-400/60' };
  })();
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('visible');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (phase === 'visible') {
      timerRef.current = setTimeout(() => setPhase('exit'), ROTATE_INTERVAL);
      return () => clearTimeout(timerRef.current);
    }
    if (phase === 'exit') {
      const t = setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % MACROS.length);
        setPhase('enter');
      }, 300);
      return () => clearTimeout(t);
    }
    if (phase === 'enter') {
      // Let one frame render the off-screen position, then animate in
      const raf = requestAnimationFrame(() => setPhase('visible'));
      return () => cancelAnimationFrame(raf);
    }
  }, [phase]);

  const calPct = targets.calories > 0 ? Math.min((consumed.calories / targets.calories) * 100, 100) : 0;
  const remaining = targets.calories - consumed.calories;

  const calFillColor = (() => {
    const raw = targets.calories > 0 ? (consumed.calories / targets.calories) * 100 : 0;
    if (raw >= 90 && raw <= 110) return 'rgb(52, 211, 153)';
    if (raw > 110) return overColor;
    return 'rgb(6, 182, 212)';
  })();

  const macro = MACROS[activeIndex];
  const macroConsumed = consumed[macro.key];
  const macroTarget = targets[macro.key];
  const macroRawPct = macroTarget > 0 ? (macroConsumed / macroTarget) * 100 : 0;
  const macroPct = Math.min(macroRawPct, 100);
  const macroOver = macroRawPct > 100;

  // Text transform based on phase
  const textStyle = (): React.CSSProperties => {
    if (phase === 'exit') {
      return {
        transition: 'transform 0.3s cubic-bezier(0.55, 0, 1, 0.45), opacity 0.3s ease',
        transform: 'translateY(-100%)',
        opacity: 0,
      };
    }
    if (phase === 'enter') {
      return {
        transition: 'none',
        transform: 'translateY(100%)',
        opacity: 0,
      };
    }
    // visible
    return {
      transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease',
      transform: 'translateY(0)',
      opacity: 1,
    };
  };

  return (
    <div className="space-y-2">
      {/* Mode tag */}
      {modeTag && (
        <div className="flex justify-end px-1">
          <span className={`text-xs font-bold italic ${modeTag.color}`}>{modeTag.text}</span>
        </div>
      )}

      {/* Calorie pill */}
      <div className="relative glass rounded-2xl px-4 py-3 overflow-hidden">
        <div
          className="absolute inset-0 rounded-2xl transition-all duration-700 ease-out"
          style={{
            width: `${calPct}%`,
            background: `linear-gradient(90deg, ${calFillColor}15, ${calFillColor}25)`,
            borderRight: calPct > 2 && calPct < 100 ? `2px solid ${calFillColor}60` : 'none',
          }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lottie animationData={caloriesAnimation} loop autoplay className="h-10 w-10" />
            <span className="text-lg font-bold text-white tabular-nums">{consumed.calories}</span>
            <span className="text-xs text-slate-500">/ {targets.calories} cal</span>
          </div>
          <span className="text-xs font-medium tabular-nums" style={{ color: remaining >= 0 ? 'rgb(148, 163, 184)' : overColor }}>
            {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
          </span>
        </div>
      </div>

      {/* Macro carousel row */}
      <div className="relative overflow-hidden rounded-xl" style={{ height: 36 }}>
        {/* Horizontal fill bar — grows left to right, red gradient when over target */}
        <div
          className="absolute inset-y-0 left-0 rounded-xl"
          style={{
            width: `${macroPct}%`,
            background: macroOver
              ? `linear-gradient(90deg, ${macro.bgColor}, ${overColorBg})`
              : `linear-gradient(90deg, ${macro.bgColor}, ${macro.color}25)`,
            borderRight: macroPct > 2 && macroPct < 100
              ? `2px solid ${macroOver ? overColorBorder : `${macro.color}60`}`
              : 'none',
            transition: 'width 0.7s ease-out, background 0.35s ease, border-color 0.35s ease',
          }}
        />

        {/* Text slot */}
        <div className="absolute inset-0 flex items-center px-3" style={textStyle()}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: macro.color }} />
              <span className="text-xs font-semibold" style={{ color: macro.color }}>{macro.label}</span>
            </div>
            <span className="text-xs text-slate-400 tabular-nums">
              <span className={`font-bold ${macroOver ? overTextClass : 'text-white'}`}>{macroConsumed}gm</span>
              <span className="text-slate-600 mx-0.5">/</span>
              {macroTarget}gm
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
