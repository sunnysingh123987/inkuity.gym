'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ExerciseSelector } from './exercise-selector';
import { createWorkoutRoutine } from '@/lib/actions/members-portal';
import { toast } from 'sonner';
import { Loader2, Save, X, GripVertical } from 'lucide-react';

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
  reps?: number;
  duration_seconds?: number;
  rest_seconds: number;
  notes?: string;
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

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);

  const handleAddExercise = (exercise: any) => {
    // Check if already added
    if (selectedExercises.some((e) => e.exerciseId === exercise.id)) {
      toast.error('Exercise already added to routine');
      return;
    }

    const newExercise: SelectedExercise = {
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      sets: 3,
      reps: 10,
      rest_seconds: 60,
    };

    setSelectedExercises([...selectedExercises, newExercise]);
    toast.success(`${exercise.name} added to routine`);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter((e) => e.exerciseId !== exerciseId));
  };

  const handleUpdateExercise = (exerciseId: string, field: string, value: any) => {
    setSelectedExercises(
      selectedExercises.map((e) =>
        e.exerciseId === exerciseId ? { ...e, [field]: value } : e
      )
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
      exercises: selectedExercises,
    });

    if (result.success) {
      toast.success('Routine created successfully!');
      router.push(`/${gymSlug}/portal/workouts`);
    } else {
      toast.error(result.error || 'Failed to create routine');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Routine Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Routine Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Chest Day, Full Body Workout"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe this routine..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Exercise Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Add Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <ExerciseSelector
            exercises={exercises}
            onSelectExercise={handleAddExercise}
          />
        </CardContent>
      </Card>

      {/* Selected Exercises */}
      {selectedExercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Selected Exercises ({selectedExercises.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedExercises.map((exercise, index) => (
                <div
                  key={exercise.exerciseId}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex-shrink-0 mt-2">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {index + 1}. {exercise.name}
                        </h4>
                        <p className="text-sm text-gray-500 capitalize">
                          {exercise.category}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveExercise(exercise.exerciseId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Sets</Label>
                        <Input
                          type="number"
                          min="1"
                          value={exercise.sets}
                          onChange={(e) =>
                            handleUpdateExercise(
                              exercise.exerciseId,
                              'sets',
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Reps</Label>
                        <Input
                          type="number"
                          min="0"
                          value={exercise.reps || ''}
                          onChange={(e) =>
                            handleUpdateExercise(
                              exercise.exerciseId,
                              'reps',
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          placeholder="10"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Rest (sec)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={exercise.rest_seconds}
                          onChange={(e) =>
                            handleUpdateExercise(
                              exercise.exerciseId,
                              'rest_seconds',
                              parseInt(e.target.value) || 60
                            )
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Duration (sec)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={exercise.duration_seconds || ''}
                          onChange={(e) =>
                            handleUpdateExercise(
                              exercise.exerciseId,
                              'duration_seconds',
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          placeholder="Optional"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Notes (Optional)</Label>
                      <Input
                        placeholder="e.g., Use lighter weight, focus on form"
                        value={exercise.notes || ''}
                        onChange={(e) =>
                          handleUpdateExercise(
                            exercise.exerciseId,
                            'notes',
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
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
