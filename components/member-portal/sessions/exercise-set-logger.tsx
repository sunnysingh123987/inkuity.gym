'use client';

import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Minus, Plus, Lock, Trash2 } from 'lucide-react';
import { logExerciseSet, deleteExerciseSet } from '@/lib/actions/members-portal';
import { toast } from '@/components/ui/toaster';

interface ExistingSet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  created_at: string;
}

export interface ExerciseSetLoggerHandle {
  /** Flush all dirty sets to the DB. Returns true if all saves succeeded. */
  flush: () => Promise<boolean>;
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

export const ExerciseSetLogger = forwardRef<ExerciseSetLoggerHandle, ExerciseSetLoggerProps>(function ExerciseSetLogger({
  sessionExerciseId,
  exerciseId,
  existingSets = [],
  onSetsChange,
  onEnsureSession,
  checkInStatus = 'active',
  checkOutAt,
}, ref) {
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
  // Track which set numbers have been modified since last flush
  const dirtySetNumbers = useRef<Set<number>>(new Set());
  // Track set numbers that need to be deleted from DB on flush
  const deletedSetNumbers = useRef<Set<number>>(new Set());

  const resolveSessionExerciseId = useCallback(async (): Promise<string | null> => {
    let seId = resolvedSeIdRef.current;
    if (seId) return seId;

    if (onEnsureSession && exerciseId && !savingRef.current) {
      savingRef.current = true;
      seId = await onEnsureSession(exerciseId);
      savingRef.current = false;
      if (seId) resolvedSeIdRef.current = seId;
    } else if (sessionExerciseId) {
      seId = sessionExerciseId;
      resolvedSeIdRef.current = seId;
    }

    return seId;
  }, [onEnsureSession, exerciseId, sessionExerciseId]);

  // Expose flush method to parent via ref
  useImperativeHandle(ref, () => ({
    flush: async () => {
      const hasDirty = dirtySetNumbers.current.size > 0;
      const hasDeletes = deletedSetNumbers.current.size > 0;
      if (!hasDirty && !hasDeletes) return true;

      const seId = await resolveSessionExerciseId();
      if (!seId) return false;

      // Get current sets state snapshot
      const currentSets = setsRef.current;
      const dirtyNums = Array.from(dirtySetNumbers.current);
      const deleteNums = Array.from(deletedSetNumbers.current);
      dirtySetNumbers.current.clear();
      deletedSetNumbers.current.clear();

      // Run deletes and upserts in parallel
      const deletePromises = deleteNums.map((setNum) =>
        deleteExerciseSet(seId, setNum)
      );

      const upsertPromises = dirtyNums.map((setNum) => {
        const set = currentSets.find((s) => s.setNumber === setNum);
        if (!set || (set.weight <= 0 && set.reps <= 0)) return Promise.resolve({ success: true, error: null, data: null });
        return logExerciseSet(seId, {
          setNumber: set.setNumber,
          weight: set.weight || undefined,
          reps: set.reps || undefined,
          completed: true,
        });
      });

      const results = await Promise.all([...deletePromises, ...upsertPromises]);

      let allOk = true;
      for (const result of results) {
        if (!result.success) {
          allOk = false;
          if (result.error?.includes('locked')) {
            toast.error('Some sets are locked (older than 1.5 hours)');
          } else if (!result.error?.includes('weight > 0 or reps > 0')) {
            toast.error(result.error || 'Failed to save set');
          }
        }
      }
      return allOk;
    },
  }), [resolveSessionExerciseId]);

  // Keep a ref to latest sets so flush always reads current values
  const setsRef = useRef(sets);
  setsRef.current = sets;

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

    // Mark this set as dirty — it will be flushed when the sheet closes
    dirtySetNumbers.current.add(updatedSet.setNumber);
  };

  const removeSet = (index: number) => {
    const removed = sets[index];
    if (isSetLocked(removed.createdAt)) {
      toast.error('This set is locked (older than 1.5 hours)');
      return;
    }

    // If this set exists in the DB (has createdAt), schedule it for deletion
    if (removed.createdAt) {
      deletedSetNumbers.current.add(removed.setNumber);
    }
    // Remove from dirty tracking
    dirtySetNumbers.current.delete(removed.setNumber);

    // Remove the set and renumber remaining sets
    const remaining = sets.filter((_, i) => i !== index);
    const renumbered = remaining.map((s, i) => {
      const newNumber = i + 1;
      if (newNumber !== s.setNumber) {
        // If this set existed in DB under its old number, schedule old number for delete
        // and mark new number as dirty so it gets upserted
        if (s.createdAt) {
          deletedSetNumbers.current.add(s.setNumber);
        }
        dirtySetNumbers.current.delete(s.setNumber);
        dirtySetNumbers.current.add(newNumber);
        return { ...s, setNumber: newNumber, createdAt: null };
      }
      return s;
    });

    setSets(renumbered);
    onSetsChange?.(countValidSets(renumbered));
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    const prevWeight = lastSet?.weight || 0;
    const prevReps = lastSet?.reps || 0;
    const newSet: SetRow = {
      setNumber: sets.length + 1,
      weight: prevWeight > 0 ? prevWeight + 2.5 : 0,
      reps: prevReps > 0 ? Math.max(0, prevReps - 2) : 0,
      createdAt: null,
    };
    const newSets = [...sets, newSet];
    setSets(newSets);
    onSetsChange?.(countValidSets(newSets));
    if (newSet.weight > 0 || newSet.reps > 0) {
      dirtySetNumbers.current.add(newSet.setNumber);
    }
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
    <div className="space-y-2.5 pt-2">
      {/* Column labels */}
      {sets.length > 0 && (
        <div className="flex items-center gap-2.5 px-0.5">
          <div className="w-9 flex-shrink-0" />
          <span className="flex-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">kg</span>
          <span className="flex-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">reps</span>
          <div className="w-7 flex-shrink-0" />
        </div>
      )}

      {sets.map((set, index) => {
        const locked = isSetLocked(set.createdAt);
        const isLastSet = index === sets.length - 1;
        const isCompleted = !isLastSet && (set.weight > 0 || set.reps > 0);

        // Completed (older) sets — compact read-only row
        if (isCompleted && !locked) {
          return (
            <div
              key={set.setNumber}
              className="flex items-center gap-2.5"
            >
              {/* Set number */}
              <div className="w-7 flex items-center justify-center flex-shrink-0">
                <span className="text-slate-500 font-semibold text-xs tabular-nums">{set.setNumber}</span>
              </div>

              {/* Weight — compact display */}
              <div className="flex-1 flex items-center justify-center bg-slate-800/40 rounded-lg h-8 border border-slate-700/30">
                <span className="text-slate-300 font-semibold text-sm tabular-nums">{set.weight}<span className="text-slate-500 text-xs ml-0.5">kg</span></span>
              </div>

              {/* Reps — compact display */}
              <div className="flex-1 flex items-center justify-center bg-slate-800/40 rounded-lg h-8 border border-slate-700/30">
                <span className="text-slate-300 font-semibold text-sm tabular-nums">{set.reps}<span className="text-slate-500 text-xs ml-0.5">reps</span></span>
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeSet(index)}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-slate-700 hover:text-red-400 hover:bg-red-400/10 active:scale-[0.9] transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        }

        // Active (latest) set or locked set — full interactive row
        return (
          <div
            key={set.setNumber}
            className={`flex items-center gap-2.5 ${locked ? 'opacity-50' : ''}`}
          >
            {/* Set number badge */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-slate-700/80 flex items-center justify-center">
                <span className="text-white font-bold text-sm tabular-nums">{set.setNumber}</span>
              </div>
              {locked && (
                <Lock className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-slate-400" />
              )}
            </div>

            {/* Weight pill */}
            <div className="flex-1 flex items-center bg-slate-800/80 rounded-xl h-11 border border-slate-700/50">
              <button
                type="button"
                onClick={() => updateSet(index, 'weight', -2.5)}
                disabled={locked}
                className="flex-shrink-0 w-7 h-7 ml-1.5 rounded-full bg-slate-600/80 border border-slate-500/40 flex items-center justify-center active:scale-[0.9] transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="h-3 w-3 text-slate-300" />
              </button>
              <span className="flex-1 text-center text-white font-bold text-lg tabular-nums">
                {set.weight}
              </span>
              <button
                type="button"
                onClick={() => updateSet(index, 'weight', 2.5)}
                disabled={locked}
                className="flex-shrink-0 w-7 h-7 mr-1.5 rounded-full bg-brand-cyan-500 flex items-center justify-center active:scale-[0.9] transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3 text-white" />
              </button>
            </div>

            {/* Reps pill */}
            <div className="flex-1 flex items-center bg-slate-800/80 rounded-xl h-11 border border-slate-700/50">
              <button
                type="button"
                onClick={() => updateSet(index, 'reps', -1)}
                disabled={locked}
                className="flex-shrink-0 w-7 h-7 ml-1.5 rounded-full bg-slate-600/80 border border-slate-500/40 flex items-center justify-center active:scale-[0.9] transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="h-3 w-3 text-slate-300" />
              </button>
              <span className="flex-1 text-center text-white font-bold text-lg tabular-nums">
                {set.reps}
              </span>
              <button
                type="button"
                onClick={() => updateSet(index, 'reps', 1)}
                disabled={locked}
                className="flex-shrink-0 w-7 h-7 mr-1.5 rounded-full bg-brand-cyan-500 flex items-center justify-center active:scale-[0.9] transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3 text-white" />
              </button>
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeSet(index)}
              disabled={locked}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 active:scale-[0.9] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
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
});
