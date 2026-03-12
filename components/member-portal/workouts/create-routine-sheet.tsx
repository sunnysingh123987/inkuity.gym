'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Loader2, Plus, Minus, Search, X, Dumbbell, ChevronDown, Check,
} from 'lucide-react';
import { getCategorySvg } from '@/lib/svg-icons';
import {
  getExerciseLibrary,
  createWorkoutRoutine,
} from '@/lib/actions/members-portal';
import {
  EXERCISES as LOCAL_EXERCISES,
  searchExercises,
  type Exercise,
} from '@/lib/data/exercises';
import { toast } from '@/components/ui/toaster';

interface CreateRoutineSheetProps {
  open: boolean;
  onClose: () => void;
  memberId: string;
  gymId: string;
  gymSlug: string;
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
  equipment?: string[];
}

type Step = 'name' | 'exercises';

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'full-body', 'cardio', 'forearms'];

export function CreateRoutineSheet({
  open,
  onClose,
  memberId,
  gymId,
  gymSlug,
}: CreateRoutineSheetProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('name');

  // Form state
  const [name, setName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [saving, setSaving] = useState(false);

  // Exercise picker state
  const [libraryExercises, setLibraryExercises] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [expandedEquipmentId, setExpandedEquipmentId] = useState<string | null>(null);

  // Animate in/out + scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Fetch exercise library when entering exercise step
  useEffect(() => {
    if (step === 'exercises' && !libraryLoaded && !loadingLibrary) {
      setLoadingLibrary(true);
      getExerciseLibrary(gymId).then((result) => {
        setLibraryExercises(result.data || []);
        setLibraryLoaded(true);
      }).catch(() => {
        // Fall back to local exercises only
      }).finally(() => setLoadingLibrary(false));
    }
  }, [step, libraryLoaded, loadingLibrary, gymId]);

  // Merge gym library + local exercises
  const allExercises = useMemo(() => {
    const normalizeName = (n: string) => {
      const key = n.toLowerCase().trim();
      return key.endsWith('s') ? key.slice(0, -1) : key;
    };

    const localByName = new Map<string, Exercise>();
    for (const local of LOCAL_EXERCISES) {
      localByName.set(normalizeName(local.name), local);
    }

    const libraryMap = new Map<string, ExerciseOption>();
    const libraryNorms = new Set<string>();

    for (const ex of libraryExercises) {
      const norm = normalizeName(ex.name);
      const localMatch = localByName.get(norm);
      libraryMap.set(ex.id, {
        id: ex.id,
        name: ex.name,
        category: ex.category || 'other',
        source: 'library',
        equipment: localMatch?.equipment,
      });
      libraryNorms.add(norm);
    }

    const localExtras: ExerciseOption[] = [];
    for (const local of LOCAL_EXERCISES) {
      if (!libraryNorms.has(normalizeName(local.name))) {
        localExtras.push({
          id: `local-${local.id}`,
          name: local.name,
          category: local.category,
          source: 'local',
          equipment: local.equipment,
        });
      }
    }

    return [...Array.from(libraryMap.values()), ...localExtras];
  }, [libraryExercises]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    let results = allExercises;

    if (muscleFilter) {
      results = results.filter((ex) => ex.category?.toLowerCase() === muscleFilter);
    }

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
  }, [allExercises, query, muscleFilter]);

  const selectedIds = new Set(selectedExercises.map((e) => e.exerciseId));

  const handleAddExercise = (exercise: ExerciseOption) => {
    const equipmentList = exercise.equipment || [];
    if (equipmentList.length >= 2) {
      setExpandedEquipmentId((prev) => (prev === exercise.id ? null : exercise.id));
      return;
    }
    if (selectedIds.has(exercise.id)) return;
    const finalName = equipmentList.length === 1
      ? `${exercise.name} - ${equipmentList[0]}`
      : exercise.name;
    const finalId = equipmentList.length === 1
      ? `${exercise.id}-${equipmentList[0].toLowerCase().replace(/\s+/g, '-')}`
      : exercise.id;

    if (selectedIds.has(finalId)) return;
    setSelectedExercises((prev) => [
      ...prev,
      {
        exerciseId: finalId,
        name: finalName,
        category: exercise.category,
        sets: 3,
        reps: 10,
        rest_seconds: 60,
        notes: '',
        source: exercise.source,
      },
    ]);
  };

  const handleSelectEquipment = (exercise: ExerciseOption, equipment: string) => {
    const equipSlug = equipment.toLowerCase().replace(/\s+/g, '-');
    const finalId = `${exercise.id}-${equipSlug}`;
    if (selectedIds.has(finalId)) {
      setExpandedEquipmentId(null);
      return;
    }
    setSelectedExercises((prev) => [
      ...prev,
      {
        exerciseId: finalId,
        name: `${exercise.name} - ${equipment}`,
        category: exercise.category,
        sets: 3,
        reps: 10,
        rest_seconds: 60,
        notes: '',
        source: exercise.source,
      },
    ]);
    setExpandedEquipmentId(null);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  };

  const handleClose = () => {
    if (saving) return;
    setVisible(false);
    setTimeout(() => {
      onClose();
      // Reset state after close animation
      setStep('name');
      setName('');
      setSelectedExercises([]);
      setQuery('');
      setMuscleFilter(null);
      setExpandedEquipmentId(null);
    }, 300);
  };

  const handleNextStep = () => {
    if (!name.trim()) {
      toast.error('Please enter a routine name');
      return;
    }
    setStep('exercises');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter a routine name');
      return;
    }
    if (selectedExercises.length === 0) {
      toast.error('Please add at least one exercise');
      return;
    }

    setSaving(true);
    const exercisesPayload = selectedExercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      category: ex.category,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes || undefined,
    }));

    const result = await createWorkoutRoutine({
      memberId,
      gymId,
      name: name.trim(),
      exercises: exercisesPayload,
    });

    if (result.success) {
      toast.success('Routine created!');
      setVisible(false);
      setTimeout(() => {
        onClose();
        setStep('name');
        setName('');
        setSelectedExercises([]);
        setQuery('');
        setMuscleFilter(null);
        setExpandedEquipmentId(null);
        router.refresh();
      }, 300);
    } else {
      toast.error(result.error || 'Failed to create routine');
    }
    setSaving(false);
  };

  if (!open && !visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overscroll-none touch-none">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        onTouchMove={(e) => e.preventDefault()}
        className={`absolute inset-0 glass-backdrop transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 glass-sheet rounded-t-2xl transition-transform duration-300 ease-out touch-auto overscroll-contain ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            {step === 'exercises' && (
              <button
                type="button"
                onClick={() => setStep('name')}
                className="p-1.5 rounded-lg glass-hover transition-colors mr-1"
              >
                <ChevronDown className="h-4 w-4 text-slate-400 rotate-90" />
              </button>
            )}
            <h2 className="text-lg font-bold text-white">
              {step === 'name' ? 'New Routine' : 'Add Exercises'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="p-2 rounded-lg glass-hover transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Step 1: Name + selected exercises */}
        {step === 'name' && (
          <div className="px-4 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
            {/* Name input */}
            <div className="space-y-2 mb-5">
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Routine Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Push Day, Upper Body, Leg Blast"
                className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-cyan-500/50 transition-colors"
                autoFocus
              />
            </div>

            {/* Selected exercises */}
            {selectedExercises.length > 0 && (
              <div className="space-y-2 mb-5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Exercises ({selectedExercises.length})
                </label>
                <div className="space-y-1.5">
                  {selectedExercises.map((exercise, index) => (
                    <div
                      key={exercise.exerciseId}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl glass"
                    >
                      <img
                        src={getCategorySvg(exercise.category)}
                        alt=""
                        className="h-4 w-4 invert opacity-50 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white truncate block">
                          {index + 1}. {exercise.name}
                        </span>
                        <span className="text-[10px] text-slate-500 capitalize">{exercise.category}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exercise.exerciseId)}
                        className="h-6 w-6 flex items-center justify-center rounded-full text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add exercises button */}
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full py-3 rounded-xl border-2 border-dashed border-brand-cyan-500/30 text-brand-cyan-400 font-semibold text-sm hover:bg-brand-cyan-500/5 transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <Plus className="h-4 w-4" />
              {selectedExercises.length > 0 ? 'Add More Exercises' : 'Add Exercises'}
            </button>

            {/* Create button */}
            {selectedExercises.length > 0 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-brand-cyan-500 hover:bg-brand-cyan-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Routine
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Step 2: Exercise picker */}
        {step === 'exercises' && (
          <>
            {/* Search */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg glass-input text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan-500 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Muscle group filter */}
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setMuscleFilter(muscleFilter === group ? null : group)}
                  className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                    muscleFilter === group
                      ? 'bg-brand-cyan-500/20 border-brand-cyan-500/50 text-brand-cyan-300'
                      : 'glass-pill text-slate-400 hover:text-white'
                  }`}
                >
                  {group.charAt(0).toUpperCase() + group.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Exercise list */}
            <div
              className="overflow-y-auto px-4 pb-20 overscroll-contain"
              style={{ maxHeight: 'calc(85vh - 190px)' }}
            >
              {loadingLibrary ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-cyan-400" />
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="text-center py-12">
                  <Dumbbell className="h-7 w-7 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm text-slate-500">No exercises found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredExercises.map((exercise) => {
                    const hasMultiEquipment = (exercise.equipment?.length || 0) >= 2;
                    const isExpanded = expandedEquipmentId === exercise.id;
                    const isAdded = hasMultiEquipment
                      ? false
                      : selectedIds.has(exercise.id) ||
                        (exercise.equipment?.length === 1 &&
                          selectedIds.has(`${exercise.id}-${exercise.equipment[0].toLowerCase().replace(/\s+/g, '-')}`));
                    return (
                      <div key={exercise.id}>
                        <div
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg glass-hover transition-colors ${
                            isExpanded ? 'glass' : ''
                          }`}
                        >
                          <img
                            src={getCategorySvg(exercise.category)}
                            alt=""
                            className="h-5 w-5 invert opacity-60 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-white truncate block">
                              {exercise.name}
                            </span>
                            <span className="text-[11px] text-slate-500 capitalize">
                              {exercise.category}
                            </span>
                          </div>
                          {isAdded ? (
                            <button
                              type="button"
                              onClick={() => {
                                const equipList = exercise.equipment || [];
                                const removeId = equipList.length === 1
                                  ? `${exercise.id}-${equipList[0].toLowerCase().replace(/\s+/g, '-')}`
                                  : exercise.id;
                                handleRemoveExercise(removeId);
                              }}
                              className="h-8 w-8 flex items-center justify-center rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          ) : hasMultiEquipment ? (
                            <button
                              type="button"
                              onClick={() => handleAddExercise(exercise)}
                              className={`h-8 w-8 flex items-center justify-center rounded-full border transition-colors flex-shrink-0 ${
                                isExpanded
                                  ? 'border-brand-cyan-500/60 text-brand-cyan-300 bg-brand-cyan-500/10'
                                  : 'border-slate-600 text-slate-400 glass-hover hover:text-white'
                              }`}
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                        {isExpanded && exercise.equipment && (
                          <div className="flex flex-wrap gap-2 px-3 py-2 ml-8">
                            {exercise.equipment.map((equip) => {
                              const equipSlug = equip.toLowerCase().replace(/\s+/g, '-');
                              const variantId = `${exercise.id}-${equipSlug}`;
                              const variantAdded = selectedIds.has(variantId);
                              return (
                                <button
                                  key={equip}
                                  type="button"
                                  onClick={() => handleSelectEquipment(exercise, equip)}
                                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                    variantAdded
                                      ? 'bg-brand-cyan-500/20 border-brand-cyan-500/50 text-brand-cyan-300'
                                      : 'glass border-white/[0.06] text-slate-300 glass-hover hover:text-white'
                                  }`}
                                >
                                  {equip}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Floating done button */}
            {selectedExercises.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4">
                <button
                  type="button"
                  onClick={() => setStep('name')}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  <Check className="h-4 w-4" />
                  Done ({selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
