'use client';

import { useState, useRef, useCallback } from 'react';
import { Minus, Plus, Lock, Loader2, Check } from 'lucide-react';
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
  sessionExerciseId: string | null;
  exerciseId?: string;
  existingSets?: ExistingSet[];
  onSetsChange?: (count: number) => void;
  onEnsureSession?: (exerciseId: string) => Promise<string | null>;
  checkInStatus?: 'loading' | 'active' | 'checked-out' | 'none';
  checkOutAt?: string;
}

interface SetRow {
  setNumber: number;
  weight: number;
  reps: number;
  createdAt: string | null;
}

const LOCK_MS = 1.5 * 60 * 60 * 1000;

function isSetLocked(createdAt: string | null): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() > LOCK_MS;
}

function countValidSets(sets: SetRow[]): number {
  return sets.filter((s) => s.weight > 0 || s.reps > 0).length;
}

export function ExerciseSetLogger({
  sessionExerciseId,
  exerciseId,
  existingSets = [],
  onSetsChange,
  onEnsureSession,
  checkInStatus = 'active',
  checkOutAt,
}: ExerciseSetLoggerProps) {
  const [sets, setSets] = useState<SetRow[]>(() => {
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

  const resolvedSeIdRef = useRef<string | null>(null);
  const savingRef = useRef(false);
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [savingSets, setSavingSets] = useState<Record<number, 'saving' | 'saved'>>({});

  const saveSet = useCallback(async (set: SetRow) => {
    // Only persist sets with non-zero values
    if (set.weight <= 0 && set.reps <= 0) return;

    setSavingSets((prev) => ({ ...prev, [set.setNumber]: 'saving' }));

    // Resolve session exercise ID (lazy creation if needed)
    let seId = resolvedSeIdRef.current;

    if (!seId) {
      // Try onEnsureSession for conflict detection + lazy creation
      if (onEnsureSession && exerciseId && !savingRef.current) {
        savingRef.current = true;
        seId = await onEnsureSession(exerciseId);
        savingRef.current = false;
        if (seId) {
          resolvedSeIdRef.current = seId;
        }
      } else if (sessionExerciseId) {
        // Fallback: use prop directly
        seId = sessionExerciseId;
        resolvedSeIdRef.current = seId;
      }
    }

    if (!seId) {
      setSavingSets((prev) => {
        const next = { ...prev };
        delete next[set.setNumber];
        return next;
      });
      return;
    }

    const result = await logExerciseSet(seId, {
      setNumber: set.setNumber,
      weight: set.weight || undefined,
      reps: set.reps || undefined,
      completed: true,
    });

    setSavingSets((prev) => ({ ...prev, [set.setNumber]: 'saved' }));
    setTimeout(() => {
      setSavingSets((prev) => {
        const next = { ...prev };
        if (next[set.setNumber] === 'saved') delete next[set.setNumber];
        return next;
      });
    }, 1000);

    if (!result.success) {
      if (result.error?.includes('locked')) {
        toast.error('This set is locked (older than 1.5 hours)');
      } else if (!result.error?.includes('weight > 0 or reps > 0')) {
        toast.error(result.error || 'Failed to save set');
      }
    }
  }, [onEnsureSession, exerciseId, sessionExerciseId]);

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
      onSetsChange?.(countValidSets(updated));
      return updated;
    });

    // Debounce the save — 500ms per set row
    const setNum = updatedSet.setNumber;
    if (debounceTimers.current[setNum]) {
      clearTimeout(debounceTimers.current[setNum]);
    }
    debounceTimers.current[setNum] = setTimeout(() => {
      saveSet(updatedSet);
    }, 500);
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet: SetRow = {
      setNumber: sets.length + 1,
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      createdAt: null,
    };
    const newSets = [...sets, newSet];
    setSets(newSets);
    onSetsChange?.(countValidSets(newSets));
  };

  if (checkInStatus === 'none') {
    return (
      <div className="py-4 text-center space-y-1">
        <p className="text-sm text-slate-400">
          Check in to your gym first to start logging your sets.
        </p>
      </div>
    );
  }

  if (checkInStatus === 'checked-out') {
    // Allow logging for 1 hour after checkout
    const cutoff = checkOutAt ? Date.now() - new Date(checkOutAt).getTime() > 60 * 60 * 1000 : true;
    if (cutoff) {
      return (
        <div className="py-4 text-center space-y-1">
          <p className="text-sm text-slate-400">
            You&apos;re done for the day, take rest and let&apos;s log more tomorrow.
          </p>
        </div>
      );
    }
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-[40px_1fr_1fr] gap-3 px-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Set</span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Weight (kg)</span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Reps</span>
      </div>

      {sets.map((set, index) => {
        const locked = isSetLocked(set.createdAt);
        return (
          <div
            key={set.setNumber}
            className={`grid grid-cols-[40px_1fr_1fr] gap-3 items-center ${locked ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-center gap-1">
              <span className="text-brand-cyan-400 font-bold">{set.setNumber}</span>
              {locked && <Lock className="h-3 w-3 text-slate-500" />}
              {savingSets[set.setNumber] === 'saving' && <Loader2 className="h-3 w-3 text-brand-cyan-400 animate-spin" />}
              {savingSets[set.setNumber] === 'saved' && <Check className="h-3 w-3 text-emerald-400" />}
            </div>

            <div className="flex items-center rounded-lg glass-input overflow-hidden">
              <button
                type="button"
                onClick={() => updateSet(index, 'weight', -2.5)}
                disabled={locked}
                className="px-3 py-3 text-slate-400 hover:text-white hover:bg-white/[0.06] active:scale-[0.95] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="flex-1 text-center text-white font-semibold text-lg tabular-nums">
                {set.weight}
              </span>
              <button
                type="button"
                onClick={() => updateSet(index, 'weight', 2.5)}
                disabled={locked}
                className="px-3 py-3 text-slate-400 hover:text-white hover:bg-white/[0.06] active:scale-[0.95] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center rounded-lg glass-input overflow-hidden">
              <button
                type="button"
                onClick={() => updateSet(index, 'reps', -1)}
                disabled={locked}
                className="px-3 py-3 text-slate-400 hover:text-white hover:bg-white/[0.06] active:scale-[0.95] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="px-3 py-3 text-slate-400 hover:text-white hover:bg-white/[0.06] active:scale-[0.95] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addSet}
        className="w-full py-3 rounded-lg border-2 border-dashed border-slate-700 text-slate-400 text-sm font-medium hover:border-slate-600 hover:text-slate-300 active:scale-[0.95] transition-all flex items-center justify-center gap-1.5"
      >
        <Plus className="h-4 w-4" />
        Add Set
      </button>

    </div>
  );
}
