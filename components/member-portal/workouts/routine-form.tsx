'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ExerciseSelector } from './exercise-selector';
import { createWorkoutRoutine } from '@/lib/actions/members-portal';
import { toast } from 'sonner';
import { Loader2, Save, Plus, X } from 'lucide-react';
import { getCategorySvg } from '@/lib/svg-icons';

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
  const [showSelector, setShowSelector] = useState(false);

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);

  const handleAddExercise = (exercise: any) => {
    if (selectedExercises.some((e) => e.exerciseId === exercise.id)) {
      toast.error('Exercise already added');
      return;
    }

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
      },
    ]);
    setShowSelector(false);
    toast.success(`${exercise.name} added`);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  };

  const updateExercise = (exerciseId: string, updates: Partial<SelectedExercise>) => {
    setSelectedExercises((prev) =>
      prev.map((e) => (e.exerciseId === exerciseId ? { ...e, ...updates } : e))
    );
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
      description: description.trim() || undefined,
      exercises: selectedExercises.map((ex) => ({
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-300">
          Routine Name *
        </Label>
        <Input
          id="name"
          placeholder="e.g., Chest Day, Full Body Workout"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-slate-900 border-slate-800"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-slate-300">
          Description (Optional)
        </Label>
        <Textarea
          id="description"
          placeholder="Describe this routine..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="bg-slate-900 border-slate-800"
        />
      </div>

      {/* Selected exercises — simple card per exercise */}
      {selectedExercises.length > 0 && (
        <div className="space-y-3">
          {selectedExercises.map((exercise, index) => (
            <div
              key={exercise.exerciseId}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"
            >
              {/* Exercise header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getCategorySvg(exercise.category)}
                    alt=""
                    className="h-6 w-6 opacity-70 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white truncate">
                      {index + 1}. {exercise.name}
                    </h4>
                    <p className="text-xs text-slate-500 capitalize">{exercise.category}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExercise(exercise.exerciseId)}
                  className="h-8 w-8 flex items-center justify-center rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Sets / Reps / Rest — inline row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-slate-400">Sets</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={exercise.sets}
                    onChange={(e) =>
                      updateExercise(exercise.exerciseId, {
                        sets: parseInt(e.target.value) || 1,
                      })
                    }
                    className="mt-1 bg-slate-800 border-slate-700 text-center"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Reps</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    value={exercise.reps}
                    onChange={(e) =>
                      updateExercise(exercise.exerciseId, {
                        reps: parseInt(e.target.value) || 1,
                      })
                    }
                    className="mt-1 bg-slate-800 border-slate-700 text-center"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Rest (sec)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={600}
                    value={exercise.rest_seconds}
                    onChange={(e) =>
                      updateExercise(exercise.exerciseId, {
                        rest_seconds: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 bg-slate-800 border-slate-700 text-center"
                  />
                </div>
              </div>

              {/* Notes */}
              <Input
                placeholder="Notes (optional)"
                value={exercise.notes}
                onChange={(e) =>
                  updateExercise(exercise.exerciseId, { notes: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-sm placeholder:text-slate-600"
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Exercise toggle */}
      {showSelector ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Select Exercise</h3>
            <button
              type="button"
              onClick={() => setShowSelector(false)}
              className="text-sm text-slate-400 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
          <ExerciseSelector exercises={exercises} onSelectExercise={handleAddExercise} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSelector(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-brand-cyan-500/30 text-brand-cyan-400 font-semibold hover:bg-brand-cyan-500/5 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Exercise
        </button>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
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
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
