'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface WorkoutSuggestion {
  group: string;
  daysSince: number;
  message: string;
}

interface WorkoutSuggestionsProps {
  suggestions: WorkoutSuggestion[];
  lastWorkouts: Record<string, string>;
}

export function WorkoutSuggestions({
  suggestions,
  lastWorkouts,
}: WorkoutSuggestionsProps) {
  const getGroupIcon = (daysSince: number) => {
    if (daysSince >= 6) {
      return <AlertOctagon className="h-5 w-5 text-red-400" />;
    }
    if (daysSince >= 3) {
      return <AlertTriangle className="h-5 w-5 text-amber-400" />;
    }
    return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
  };

  const getSeverityStyles = (daysSince: number) => {
    if (daysSince >= 6) {
      return {
        border: 'border-red-500/20',
        bg: 'bg-red-500/5',
        badge: 'bg-red-500/10 text-red-400',
      };
    }
    return {
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/5',
      badge: 'bg-amber-500/10 text-amber-400',
    };
  };

  const formatGroupName = (group: string) => {
    return group.charAt(0).toUpperCase() + group.slice(1);
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          Workout Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-emerald-400">
              You&apos;re on track!
            </p>
            <p className="text-xs text-slate-400 mt-1">
              All muscle groups have been trained recently. Keep it up!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => {
              const styles = getSeverityStyles(suggestion.daysSince);

              return (
                <div
                  key={suggestion.group}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${styles.border} ${styles.bg}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getGroupIcon(suggestion.daysSince)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">
                        {formatGroupName(suggestion.group)}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}
                      >
                        {suggestion.daysSince >= 30
                          ? '30+ days'
                          : `${suggestion.daysSince}d ago`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {suggestion.message}
                    </p>
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
