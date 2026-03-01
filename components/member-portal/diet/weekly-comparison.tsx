'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface WeeklyMetric {
  label: string;
  unit: string;
  todayValue: number;
  weeklyAvg: number;
  trend: 'up' | 'down' | 'same';
  color: string;
}

interface WeeklyComparisonProps {
  metrics: WeeklyMetric[];
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  same: Minus,
};

const trendColors = {
  up: 'text-green-400',
  down: 'text-red-400',
  same: 'text-slate-400',
};

export function WeeklyComparison({ metrics }: WeeklyComparisonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((metric) => {
        const TrendIcon = trendIcons[metric.trend];
        return (
          <Card key={metric.label} className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                {metric.label}
              </p>
              <div className="flex items-end gap-2 mt-1">
                <span className={`text-2xl font-bold ${metric.color}`}>
                  {metric.todayValue}
                </span>
                <span className="text-sm text-slate-500 mb-0.5">
                  {metric.unit}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendIcon className={`h-3.5 w-3.5 ${trendColors[metric.trend]}`} />
                <span className="text-xs text-slate-400">
                  7d avg: {metric.weeklyAvg}{metric.unit}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
