'use client';

import { useState, useCallback } from 'react';
import { Minus, Plus, Lock } from 'lucide-react';
import { logExerciseSet } from '@/lib/actions/members-portal';
import { toast } from 'sonner';

interface ExistingSet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  created_at: string;
}

interface ExerciseSetLoggerProps {
  sessionExerciseId: string;
  existingSets?: ExistingSet[];
  onSetsChange?: (count: number) => void;
}

interface SetRow {
  setNumber: number;
  weight: number;
  reps: number;
  createdAt: string | null;
}

const LOCK_MS = 1.5 * 60 * 60 * 1000; // 1.5 hours

function isSetLocked(createdAt: string | null): boolean {
  if (!createdAt) return false;
  const age = Date.now() - new Date(createdAt).getTime();
  return age > LOCK_MS;
}

export function ExerciseSetLogger({
  sessionExerciseId,
  existingSets = [],
  onSetsChange,
}: ExerciseSetLoggerProps) {
  const [sets, setSets] = useState<SetRow[]>(() => {
    // Load existing sets from database
    if (existingSets.length === 0) return [];
    return existingSets
      .sort((a, b) => a.set_number - b.set_number)
      .map((s) => ({
        setNumber: s.set_number,
        weight: s.weight ?? 0,
        reps: s.reps ?? 0,
        createdAt: s.created_at,
      }));
  });

  const saveSet = useCallback(
    async (set: SetRow) => {
      const result = await logExerciseSet(sessionExerciseId, {
        setNumber: set.setNumber,
        weight: set.weight || undefined,
        reps: set.reps || undefined,
        completed: true,
      });
      if (!result.success) {
        if (result.error?.includes('locked')) {
          toast.error('This set is locked (older than 1.5 hours)');
        } else {
          toast.error(result.error || 'Failed to save set');
        }
      }
    },
    [sessionExerciseId]
  );

  const updateSet = (index: number, field: 'weight' | 'reps', delta: number) => {
    const current = sets[index];
    if (isSetLocked(current.createdAt)) {
      toast.error('This set is locked (older than 1.5 hours)');
      return;
    }

    const newValue = Math.max(0, current[field] + delta);
    const updatedSet = { ...current, [field]: newValue };

    setSets((prev) => {
      const updated = [...prev];
      updated[index] = updatedSet;
      return updated;
    });

    saveSet(updatedSet);
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet: SetRow = {
      setNumber: sets.length + 1,
      weight: lastSet?.weight || 50,
      reps: lastSet?.reps || 12,
      createdAt: null, // new set, not yet persisted
    };
    const newSets = [...sets, newSet];
    setSets(newSets);
    saveSet(newSet);
    onSetsChange?.(newSets.length);
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Column headers */}
      <div className="grid grid-cols-[40px_1fr_1fr] gap-3 px-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Set
        </span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
          Weight (kg)
        </span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
          Reps
        </span>
      </div>

      {/* Set rows */}
      {sets.map((set, index) => {
        const locked = isSetLocked(set.createdAt);

        return (
          <div
            key={set.setNumber}
            className={`grid grid-cols-[40px_1fr_1fr] gap-3 items-center ${locked ? 'opacity-60' : ''}`}
          >
            {/* Set number */}
            <div className="flex items-center justify-center gap-1">
              <span className="text-brand-cyan-400 font-bold">{set.setNumber}</span>
              {locked && <Lock className="h-3 w-3 text-slate-500" />}
            </div>

            {/* Weight stepper */}
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
              <button
                type="button"
                onClick={() => updateSet(index, 'weight', -5)}
                disabled={locked}
                className="px-2.5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="flex-1 text-center text-white font-semibold text-lg tabular-nums">
                {set.weight}
              </span>
              <button
                type="button"
                onClick={() => updateSet(index, 'weight', 5)}
                disabled={locked}
                className="px-2.5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Reps stepper */}
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
              <button
                type="button"
                onClick={() => updateSet(index, 'reps', -1)}
                disabled={locked}
                className="px-2.5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="flex-1 text-center text-white font-semibold text-lg tabular-nums">
                {set.reps}
              </span>
              <button
                type="button"
                onClick={() => updateSet(index, 'reps', 1)}
                disabled={locked}
                className="px-2.5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Add Set button */}
      <button
        type="button"
        onClick={addSet}
        className="w-full py-3 rounded-lg border-2 border-dashed border-slate-700 text-slate-400 text-sm font-medium hover:border-slate-600 hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="h-4 w-4" />
        Add Set
      </button>
    </div>
  );
}
