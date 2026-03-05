'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createWorkoutRoutine } from '@/lib/actions/members-portal';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Minus, Search, X, Dumbbell } from 'lucide-react';
import { getCategorySvg } from '@/lib/svg-icons';
import { cn } from '@/lib/utils';
import {
  EXERCISES as LOCAL_EXERCISES,
  searchExercises,
} from '@/lib/data/exercises';

interface RoutineFormProps {
  exercises: any[];
  memberId: string;
  gymId: string;
  gymSlug: string;
  initialData?: any;
}

interface SelectedExercise {
  exerciseId: string;
  name: string;
  category: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes: string;
  source: 'library' | 'local';
}

interface ExerciseOption {
  id: string;
  name: string;
  category: string;
  source: 'library' | 'local';
}

export function RoutineForm({
  exercises,
  memberId,
  gymId,
  gymSlug,
  initialData,
}: RoutineFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [query, setQuery] = useState('');

  // Form fields
  const [name, setName] = useState(initialData?.name || '');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);

  // Animate sheet in/out
  useEffect(() => {
    if (sheetOpen) {
      requestAnimationFrame(() => setSheetVisible(true));
    } else {
      setSheetVisible(false);
    }
  }, [sheetOpen]);

  // Merge gym library + local exercises
  const allExercises = useMemo(() => {
    const libraryMap = new Map<string, ExerciseOption>();
    const libraryNames = new Set<string>();

    for (const ex of exercises) {
      libraryMap.set(ex.id, {
        id: ex.id,
        name: ex.name,
        category: ex.category || 'other',
        source: 'library',
      });
      libraryNames.add(ex.name.toLowerCase().trim());
    }

    const localExtras: ExerciseOption[] = [];
    for (const local of LOCAL_EXERCISES) {
      if (!libraryNames.has(local.name.toLowerCase().trim())) {
        localExtras.push({
          id: `local-${local.id}`,
          name: local.name,
          category: local.category,
          source: 'local',
        });
      }
    }

    return [...Array.from(libraryMap.values()), ...localExtras];
  }, [exercises]);

  // Filter by search query
  const filteredExercises = useMemo(() => {
    let results = allExercises;

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      const tokens = q.split(/\s+/);

      const localMatches = new Set(
        searchExercises(query).map((e) => e.name.toLowerCase().trim())
      );

      results = results.filter((ex) => {
        const n = ex.name.toLowerCase();
        if (n.includes(q)) return true;
        if (tokens.every((t) => n.includes(t))) return true;
        if (ex.category?.toLowerCase().includes(q)) return true;
        if (localMatches.has(n)) return true;
        return false;
      });

      results.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aScore = aName === q ? 3 : aName.startsWith(q) ? 2 : 1;
        const bScore = bName === q ? 3 : bName.startsWith(q) ? 2 : 1;
        if (aScore !== bScore) return bScore - aScore;
        if (a.source !== b.source) return a.source === 'library' ? -1 : 1;
        return aName.localeCompare(bName);
      });
    } else {
      results = [...results].sort((a, b) => {
        if (a.source !== b.source) return a.source === 'library' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }

    return results;
  }, [allExercises, query]);

  const selectedIds = new Set(selectedExercises.map((e) => e.exerciseId));

  const handleAddExercise = (exercise: ExerciseOption) => {
    if (selectedIds.has(exercise.id)) return;
    setSelectedExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: 3,
        reps: 10,
        rest_seconds: 60,
        notes: '',
        source: exercise.source,
      },
    ]);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  };

  const updateExercise = (exerciseId: string, updates: Partial<SelectedExercise>) => {
    setSelectedExercises((prev) =>
      prev.map((e) => (e.exerciseId === exerciseId ? { ...e, ...updates } : e))
    );
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedExercises.length) return;
    const updated = [...selectedExercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSelectedExercises(updated);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a routine name');
      return;
    }
    if (selectedExercises.length === 0) {
      toast.error('Please add at least one exercise');
      return;
    }

    setSaving(true);

    const result = await createWorkoutRoutine({
      memberId,
      gymId,
      name: name.trim(),
      exercises: selectedExercises
        .filter((ex) => !ex.exerciseId.startsWith('local-'))
        .map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes || undefined,
        })),
    });

    if (result.success) {
      toast.success('Routine created!');
      router.push(`/${gymSlug}/portal/trackers`);
    } else {
      toast.error(result.error || 'Failed to create routine');
      setSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 pb-8">
        {/* ---- Routine Name ---- */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-300 text-sm font-semibold">
            Routine Name <span className="text-brand-cyan-400">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g., Push Day, Upper Body, Leg Blast"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-900 border-slate-800 h-11"
            required
          />
        </div>

        {/* ---- Selected Exercises ---- */}
        {selectedExercises.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-sm font-semibold">
                Exercises ({selectedExercises.length})
              </Label>
              <span className="text-xs text-slate-500">
                Tap arrows to reorder
              </span>
            </div>

            <div className="space-y-2.5">
              {selectedExercises.map((exercise, index) => (
                <div
                  key={exercise.exerciseId}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3"
                >
                  {/* Exercise header */}
                  <div className="flex items-center gap-2">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveExercise(index, 'up')}
                        className={cn(
                          'h-5 w-5 flex items-center justify-center rounded text-slate-500 transition-colors',
                          index === 0 ? 'opacity-30' : 'hover:text-white hover:bg-slate-800'
                        )}
                      >
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                          <path d="M6 2L2 7H10L6 2Z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={index === selectedExercises.length - 1}
                        onClick={() => moveExercise(index, 'down')}
                        className={cn(
                          'h-5 w-5 flex items-center justify-center rounded text-slate-500 transition-colors',
                          index === selectedExercises.length - 1
                            ? 'opacity-30'
                            : 'hover:text-white hover:bg-slate-800'
                        )}
                      >
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                          <path d="M6 10L10 5H2L6 10Z" fill="currentColor" />
                        </svg>
                      </button>
                    </div>

                    <img
                      src={getCategorySvg(exercise.category)}
                      alt=""
                      className="h-5 w-5 invert opacity-60 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm truncate">
                        {index + 1}. {exercise.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 capitalize">{exercise.category}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exercise.exerciseId)}
                      className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-400/50 transition-colors flex-shrink-0"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Notes */}
                  <Input
                    placeholder="Notes (optional)"
                    value={exercise.notes}
                    onChange={(e) =>
                      updateExercise(exercise.exerciseId, { notes: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-xs placeholder:text-slate-600 h-8"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Add Exercise button (opens bottom sheet) ---- */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-brand-cyan-500/30 text-brand-cyan-400 font-semibold text-sm hover:bg-brand-cyan-500/5 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Exercise
        </button>

        {/* ---- Submit ---- */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 h-11 bg-brand-cyan-500 hover:bg-brand-cyan-600 text-white font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Routine
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* ---- Exercise picker bottom sheet ---- */}
      {(sheetOpen || sheetVisible) && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            onClick={closeSheet}
            className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
              sheetVisible ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Sheet */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 rounded-t-2xl transition-transform duration-300 ease-out ${
              sheetVisible ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{ maxHeight: '75vh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-lg font-bold text-white">Add Exercises</h2>
              <button
                type="button"
                onClick={closeSheet}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Exercise list */}
            <div
              className="overflow-y-auto px-4 pb-6 overscroll-contain"
              style={{ maxHeight: 'calc(75vh - 140px)' }}
            >
              {filteredExercises.length === 0 ? (
                <div className="text-center py-12">
                  <Dumbbell className="h-7 w-7 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm text-slate-500">No exercises found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredExercises.map((exercise) => {
                    const isAdded = selectedIds.has(exercise.id);
                    return (
                      <div
                        key={exercise.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-900/80 transition-colors"
                      >
                        {/* Category icon */}
                        <img
                          src={getCategorySvg(exercise.category)}
                          alt=""
                          className="h-5 w-5 invert opacity-60 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />

                        {/* Name + category */}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-white truncate block">
                            {exercise.name}
                          </span>
                          <span className="text-[11px] text-slate-500 capitalize">
                            {exercise.category}
                          </span>
                        </div>

                        {/* + or - button */}
                        {isAdded ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(exercise.id)}
                            className="h-8 w-8 flex items-center justify-center rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddExercise(exercise)}
                            className="h-8 w-8 flex items-center justify-center rounded-full border border-brand-cyan-500/40 text-brand-cyan-400 hover:bg-brand-cyan-500/10 transition-colors flex-shrink-0"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
