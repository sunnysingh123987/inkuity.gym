'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Droplets,
  FlaskConical,
  Pill,
  Apple,
  Coffee,
  Heart,
  Zap,
  Dumbbell,
  Salad,
} from 'lucide-react';

// ─── Mock Data ─────────────────────────────────────────────────────────────

const MOCK_WEEKLY_METRICS = [
  { label: 'Calories', unit: 'cal', todayValue: 700, weeklyAvg: 1850, trend: 'down' as const, color: 'text-orange-400' },
  { label: 'Protein', unit: 'g', todayValue: 85, weeklyAvg: 120, trend: 'down' as const, color: 'text-blue-400' },
  { label: 'Carbs', unit: 'g', todayValue: 27, weeklyAvg: 200, trend: 'down' as const, color: 'text-yellow-400' },
  { label: 'Fat', unit: 'g', todayValue: 26, weeklyAvg: 65, trend: 'down' as const, color: 'text-emerald-400' },
];

const MOCK_TRACKER_SUMMARY = [
  { name: 'Water', current: 3, dailyTarget: 8, unit: 'glasses', icon: 'Droplets', color: 'cyan' },
  { name: 'Protein Shake', current: 1, dailyTarget: 2, unit: 'scoops', icon: 'FlaskConical', color: 'purple' },
  { name: 'Vitamins', current: 0, dailyTarget: 1, unit: 'tablets', icon: 'Pill', color: 'green' },
];

// ─── Icon & Color Maps ──────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Droplets, FlaskConical, Pill, Activity, Apple, Coffee, Heart, Zap, Dumbbell, Salad,
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; progress: string }> = {
  cyan: { bg: 'bg-brand-cyan-600/20', text: 'text-brand-cyan-400', progress: 'bg-brand-cyan-600' },
  blue: { bg: 'bg-blue-600/20', text: 'text-blue-400', progress: 'bg-blue-600' },
  green: { bg: 'bg-emerald-600/20', text: 'text-emerald-400', progress: 'bg-emerald-600' },
  purple: { bg: 'bg-purple-600/20', text: 'text-purple-400', progress: 'bg-purple-600' },
  orange: { bg: 'bg-orange-600/20', text: 'text-orange-400', progress: 'bg-orange-600' },
};

const trendIcons = { up: TrendingUp, down: TrendingDown, same: Minus };
const trendColors = { up: 'text-emerald-400', down: 'text-red-400', same: 'text-slate-400' };

// ─── Component ──────────────────────────────────────────────────────────────

export function NutritionOverview() {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Activity className="h-5 w-5 text-brand-cyan-400" />
          Today&apos;s Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Weekly Nutrition Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {MOCK_WEEKLY_METRICS.map((metric) => {
            const TrendIcon = trendIcons[metric.trend];
            return (
              <div key={metric.label} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  {metric.label}
                </p>
                <div className="flex items-end gap-1.5 mt-1">
                  <span className={`text-xl font-bold ${metric.color}`}>
                    {metric.todayValue}
                  </span>
                  <span className="text-xs text-slate-500 mb-0.5">
                    {metric.unit}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendIcon className={`h-3 w-3 ${trendColors[metric.trend]}`} />
                  <span className="text-xs text-slate-500">
                    avg {metric.weeklyAvg}{metric.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tracker Summary */}
        {MOCK_TRACKER_SUMMARY.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Trackers</p>
            {MOCK_TRACKER_SUMMARY.map((tracker) => {
              const colors = COLOR_CLASSES[tracker.color] || COLOR_CLASSES.cyan;
              const IconComponent = ICON_MAP[tracker.icon] || Activity;
              const pct = tracker.dailyTarget > 0
                ? Math.min((tracker.current / tracker.dailyTarget) * 100, 100)
                : 0;

              return (
                <div key={tracker.name} className="flex items-center gap-3">
                  <div className={`p-1 rounded ${colors.bg}`}>
                    <IconComponent className={`h-3.5 w-3.5 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300 truncate">{tracker.name}</span>
                      <span className="text-xs text-slate-500">
                        {tracker.current}/{tracker.dailyTarget}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className="h-1"
                      indicatorClassName={colors.progress}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
