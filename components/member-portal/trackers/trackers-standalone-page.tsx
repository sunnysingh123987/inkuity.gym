'use client';

import { useState, useTransition } from 'react';
import { Activity, Plus, Droplets, Pill, Zap } from 'lucide-react';
import { CustomTrackers, type CustomTracker } from '@/components/member-portal/diet/custom-trackers';
import {
  createCustomTracker,
  updateCustomTracker,
  deleteCustomTracker,
  deleteAllCustomTrackers,
  updateTrackerValue,
  resetAllTrackerValues,
} from '@/lib/actions/members-portal';

interface TrackersStandalonePageProps {
  memberId: string;
  gymId: string;
  initialTrackers: CustomTracker[];
}

export function TrackersStandalonePage({
  memberId,
  gymId,
  initialTrackers,
}: TrackersStandalonePageProps) {
  const [trackers, setTrackers] = useState<CustomTracker[]>(initialTrackers);
  const [, startTransition] = useTransition();

  const handleIncrementTracker = (trackerId: string) => {
    let newValue = 0;
    setTrackers((prev) =>
      prev.map((t) => {
        if (t.id === trackerId) {
          newValue = t.current + 1;
          return { ...t, current: newValue };
        }
        return t;
      })
    );
    startTransition(async () => {
      await updateTrackerValue(trackerId, memberId, newValue);
    });
  };

  const handleDecrementTracker = (trackerId: string) => {
    let newValue = 0;
    setTrackers((prev) =>
      prev.map((t) => {
        if (t.id === trackerId) {
          newValue = Math.max(0, t.current - 1);
          return { ...t, current: newValue };
        }
        return t;
      })
    );
    startTransition(async () => {
      await updateTrackerValue(trackerId, memberId, newValue);
    });
  };

  const handleAddTracker = (tracker: Omit<CustomTracker, 'id' | 'current'>) => {
    const tempTracker = { ...tracker, id: `temp-${Date.now()}`, current: 0 };
    setTrackers((prev) => [...prev, tempTracker]);
    startTransition(async () => {
      const result = await createCustomTracker({
        memberId,
        gymId,
        name: tracker.name,
        unit: tracker.unit,
        dailyTarget: tracker.dailyTarget,
        icon: tracker.icon,
        color: tracker.color,
      });
      if (result.success && result.data) {
        setTrackers((prev) =>
          prev.map((t) => (t.id === tempTracker.id ? { ...t, id: result.data.id } : t))
        );
      }
    });
  };

  const handleDeleteTracker = (trackerId: string) => {
    setTrackers((prev) => prev.filter((t) => t.id !== trackerId));
    startTransition(async () => {
      await deleteCustomTracker(trackerId);
    });
  };

  const handleEditTracker = (trackerId: string, updates: Partial<CustomTracker>) => {
    setTrackers((prev) =>
      prev.map((t) => (t.id === trackerId ? { ...t, ...updates } : t))
    );
    startTransition(async () => {
      await updateCustomTracker(trackerId, {
        name: updates.name,
        unit: updates.unit,
        dailyTarget: updates.dailyTarget,
        icon: updates.icon,
        color: updates.color,
      });
    });
  };

  const handleResetAll = () => {
    setTrackers((prev) => prev.map((t) => ({ ...t, current: 0 })));
    startTransition(async () => {
      await resetAllTrackerValues(memberId);
    });
  };

  const handleDeleteAll = () => {
    setTrackers([]);
    startTransition(async () => {
      await deleteAllCustomTrackers(memberId, gymId);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Trackers</h1>
          <p className="text-slate-400 mt-1">Track your daily habits and goals</p>
        </div>
      </div>

      {/* Custom Trackers */}
      <CustomTrackers
        trackers={trackers}
        onIncrement={handleIncrementTracker}
        onDecrement={handleDecrementTracker}
        onAddTracker={handleAddTracker}
        onDeleteTracker={handleDeleteTracker}
        onEditTracker={handleEditTracker}
        onResetAll={handleResetAll}
        onDeleteAll={handleDeleteAll}
      />

      {/* How it works */}
      <div className="mt-6 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">How it works</h4>
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <Plus className="h-4 w-4 text-brand-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">Create custom trackers for water, supplements, steps, or anything you want to track daily</p>
          </div>
          <div className="flex items-start gap-3">
            <Activity className="h-4 w-4 text-brand-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">Set daily targets and use the +/- buttons to log your progress throughout the day</p>
          </div>
          <div className="flex items-start gap-3">
            <Droplets className="h-4 w-4 text-brand-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">Choose from different icons and colors to personalize each tracker</p>
          </div>
          <div className="flex items-start gap-3">
            <Zap className="h-4 w-4 text-brand-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">Tracker values reset daily — use the menu to reset manually or manage all trackers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
