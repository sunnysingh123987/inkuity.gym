'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, Target } from 'lucide-react';

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
}

export function NutritionTracker({ targets, consumed }: NutritionTrackerProps) {
  const calculatePercentage = (consumed: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((consumed / target) * 100, 100);
  };

  const getRawPercentage = (consumed: number, target: number) => {
    if (target === 0) return 0;
    return (consumed / target) * 100;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return 'bg-emerald-600';
    if (percentage >= 80 && percentage < 90) return 'bg-yellow-600';
    if (percentage > 110) return 'bg-red-600';
    return 'bg-brand-cyan-600';
  };

  const caloriesPct = getRawPercentage(consumed.calories, targets.calories);
  const remainingCalories = targets.calories - consumed.calories;

  const macros = [
    {
      label: 'Protein',
      consumed: consumed.protein,
      target: targets.protein,
      color: 'text-blue-400',
      unit: 'g',
    },
    {
      label: 'Carbs',
      consumed: consumed.carbs,
      target: targets.carbs,
      color: 'text-yellow-400',
      unit: 'g',
    },
    {
      label: 'Fat',
      consumed: consumed.fat,
      target: targets.fat,
      color: 'text-emerald-400',
      unit: 'g',
    },
  ];

  const statusBadge = (() => {
    if (caloriesPct >= 90 && caloriesPct <= 110)
      return { label: 'On Track', className: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30' };
    if (caloriesPct > 110)
      return { label: 'Over Goal', className: 'bg-red-600/20 text-red-400 border-red-600/30' };
    return { label: 'Under Goal', className: 'bg-brand-cyan-600/20 text-brand-cyan-400 border-brand-cyan-600/30' };
  })();

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-brand-cyan-400" />
            Today&apos;s Nutrition
          </CardTitle>
          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prominent Calorie Counter */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Flame className="h-6 w-6 text-orange-400" />
            <span className="text-4xl font-bold text-white">{consumed.calories}</span>
            <span className="text-lg text-slate-400">/ {targets.calories} cal</span>
          </div>
          <Progress
            value={calculatePercentage(consumed.calories, targets.calories)}
            className="h-3"
            indicatorClassName={getProgressColor(caloriesPct)}
          />
          <p className="text-sm text-slate-400">
            {remainingCalories > 0 ? (
              <span>{remainingCalories} calories remaining</span>
            ) : (
              <span className="text-red-400">
                {Math.abs(remainingCalories)} calories over
              </span>
            )}
          </p>
        </div>

        {/* Macro Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {macros.map((macro) => {
            const pct = getRawPercentage(macro.consumed, macro.target);
            const remaining = macro.target - macro.consumed;
            return (
              <div key={macro.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${macro.color}`}>
                    {macro.label}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {macro.consumed}{macro.unit} / {macro.target}{macro.unit}
                  </span>
                </div>
                <Progress
                  value={calculatePercentage(macro.consumed, macro.target)}
                  className="h-2"
                  indicatorClassName={getProgressColor(pct)}
                />
                <p className="text-xs text-slate-400">
                  {remaining > 0 ? (
                    <span>{remaining}{macro.unit} left</span>
                  ) : (
                    <span className="text-red-400">
                      {Math.abs(remaining)}{macro.unit} over
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
