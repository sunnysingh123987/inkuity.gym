'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Check } from 'lucide-react';
import { logExerciseSet } from '@/lib/actions/members-portal';
import { toast } from 'sonner';

interface ExerciseSetLoggerProps {
  sessionExerciseId: string;
  onComplete: () => void;
  isCompleted: boolean;
}

interface LoggedSet {
  setNumber: number;
  weight?: number;
  reps?: number;
  completed: boolean;
}

export function ExerciseSetLogger({
  sessionExerciseId,
  onComplete,
  isCompleted,
}: ExerciseSetLoggerProps) {
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [currentSet, setCurrentSet] = useState({
    weight: '',
    reps: '',
  });
  const [logging, setLogging] = useState(false);

  const handleLogSet = async () => {
    const weight = parseFloat(currentSet.weight);
    const reps = parseInt(currentSet.reps);

    if (!weight && !reps) {
      toast.error('Please enter weight or reps');
      return;
    }

    setLogging(true);

    const result = await logExerciseSet(sessionExerciseId, {
      setNumber: sets.length + 1,
      weight: weight || undefined,
      reps: reps || undefined,
      completed: true,
    });

    if (result.success) {
      const newSet: LoggedSet = {
        setNumber: sets.length + 1,
        weight: weight || undefined,
        reps: reps || undefined,
        completed: true,
      };
      setSets([...sets, newSet]);
      setCurrentSet({ weight: currentSet.weight, reps: currentSet.reps }); // Keep values for next set
      toast.success(`Set ${sets.length + 1} logged`);
    } else {
      toast.error(result.error || 'Failed to log set');
    }

    setLogging(false);
  };

  const handleMarkComplete = () => {
    if (sets.length === 0) {
      toast.error('Please log at least one set');
      return;
    }
    onComplete();
    toast.success('Exercise completed!');
  };

  return (
    <div className="space-y-4">
      {/* Logged Sets */}
      {sets.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Logged Sets</h4>
          <div className="space-y-2">
            {sets.map((set) => (
              <div
                key={set.setNumber}
                className="flex items-center justify-between p-3 bg-white border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Set {set.setNumber}</Badge>
                  <div className="flex gap-4 text-sm">
                    {set.weight && (
                      <span>
                        <span className="text-gray-600">Weight:</span>{' '}
                        <span className="font-semibold">{set.weight} lbs</span>
                      </span>
                    )}
                    {set.reps && (
                      <span>
                        <span className="text-gray-600">Reps:</span>{' '}
                        <span className="font-semibold">{set.reps}</span>
                      </span>
                    )}
                  </div>
                </div>
                <Check className="h-4 w-4 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log New Set */}
      {!isCompleted && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Log Set {sets.length + 1}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="weight" className="text-xs">
                Weight (lbs)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="135"
                value={currentSet.weight}
                onChange={(e) =>
                  setCurrentSet({ ...currentSet, weight: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reps" className="text-xs">
                Reps
              </Label>
              <Input
                id="reps"
                type="number"
                placeholder="10"
                value={currentSet.reps}
                onChange={(e) =>
                  setCurrentSet({ ...currentSet, reps: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleLogSet}
              disabled={logging}
              className="flex-1"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Set
            </Button>
            {sets.length > 0 && (
              <Button onClick={handleMarkComplete} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Complete Exercise
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Completed State */}
      {isCompleted && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-green-600 font-semibold">
            <Check className="h-5 w-5" />
            Exercise Completed
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {sets.length} {sets.length === 1 ? 'set' : 'sets'} logged
          </p>
        </div>
      )}
    </div>
  );
}
