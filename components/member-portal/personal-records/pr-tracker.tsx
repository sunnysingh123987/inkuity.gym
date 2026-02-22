'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Trophy,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Weight,
} from 'lucide-react';
import { toast } from 'sonner';
import { addPersonalRecord, deletePersonalRecord } from '@/lib/actions/personal-records';
import { useRouter } from 'next/navigation';
import type { PersonalRecord } from '@/types/database';

interface PRSummaryItem {
  exercise_name: string;
  max_weight: number;
  reps: number;
  recorded_at: string;
}

interface PRTrackerProps {
  records: PersonalRecord[];
  summary: PRSummaryItem[];
  memberId: string;
  gymId: string;
  gymSlug: string;
}

const COMMON_EXERCISES = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
  'Pull-up',
];

export function PRTracker({
  records,
  summary,
  memberId,
  gymId,
  gymSlug,
}: PRTrackerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [exerciseName, setExerciseName] = useState('');
  const [customExercise, setCustomExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('1');
  const [notes, setNotes] = useState('');
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  const resolvedExerciseName =
    exerciseName === '__custom__' ? customExercise.trim() : exerciseName;

  const handleAddPR = () => {
    if (!resolvedExerciseName) {
      toast.error('Please select or enter an exercise name');
      return;
    }
    if (!weight || parseFloat(weight) <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    startTransition(async () => {
      const result = await addPersonalRecord({
        gym_id: gymId,
        member_id: memberId,
        exercise_name: resolvedExerciseName,
        weight: parseFloat(weight),
        reps: parseInt(reps) || 1,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        toast.success(`PR recorded for ${resolvedExerciseName}!`);
        setExerciseName('');
        setCustomExercise('');
        setWeight('');
        setReps('1');
        setNotes('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to add PR');
      }
    });
  };

  const handleDeletePR = (recordId: string) => {
    startTransition(async () => {
      const result = await deletePersonalRecord(recordId);
      if (result.success) {
        toast.success('PR deleted');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete PR');
      }
    });
  };

  const toggleExercise = (name: string) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // Group records by exercise
  const groupedRecords = records.reduce<Record<string, PersonalRecord[]>>(
    (acc, record) => {
      if (!acc[record.exercise_name]) {
        acc[record.exercise_name] = [];
      }
      acc[record.exercise_name].push(record);
      return acc;
    },
    {}
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Personal Records</h1>
        <p className="text-slate-400 mt-1">
          Track your personal bests and monitor your progress
        </p>
      </div>

      {/* PR Summary Cards */}
      {summary.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-300 mb-3">
            Your Best Lifts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.map((item) => (
              <Card
                key={item.exercise_name}
                className="bg-slate-900 border-slate-800"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {item.exercise_name}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Trophy className="h-4 w-4 text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {item.max_weight} kg
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {item.reps} {item.reps === 1 ? 'rep' : 'reps'} &middot;{' '}
                    {formatDate(item.recorded_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add PR Form */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-brand-cyan-400" />
            Log New PR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Exercise Name */}
            <div className="space-y-2">
              <Label className="text-slate-300">Exercise</Label>
              <select
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan-500 focus-visible:ring-offset-2"
              >
                <option value="">Select exercise...</option>
                {COMMON_EXERCISES.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
                <option value="__custom__">Custom exercise...</option>
              </select>
              {exerciseName === '__custom__' && (
                <Input
                  placeholder="Enter exercise name"
                  value={customExercise}
                  onChange={(e) => setCustomExercise(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              )}
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label className="text-slate-300">Weight (kg)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Reps */}
            <div className="space-y-2">
              <Label className="text-slate-300">Reps</Label>
              <Input
                type="number"
                min="1"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-slate-300">Notes (optional)</Label>
              <Textarea
                placeholder="Any notes about this lift..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[40px]"
              />
            </div>
          </div>

          <Button
            onClick={handleAddPR}
            disabled={isPending}
            className="w-full sm:w-auto bg-brand-cyan-500 hover:bg-brand-cyan-600 text-white"
          >
            {isPending ? 'Saving...' : 'Add PR'}
          </Button>
        </CardContent>
      </Card>

      {/* PR History */}
      <div>
        <h2 className="text-lg font-semibold text-slate-300 mb-3">
          PR History
        </h2>

        {Object.keys(groupedRecords).length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-800 mb-4">
                <Dumbbell className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No records yet
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Start logging your personal records to track your strength
                progress over time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedRecords).map(([exerciseName, exerciseRecords]) => {
              const isExpanded = expandedExercises.has(exerciseName);
              const bestWeight = Math.max(...exerciseRecords.map((r) => r.weight));

              return (
                <Card
                  key={exerciseName}
                  className="bg-slate-900 border-slate-800"
                >
                  {/* Exercise header - clickable to expand/collapse */}
                  <button
                    onClick={() => toggleExercise(exerciseName)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors rounded-t-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-brand-purple-500/10">
                        <Weight className="h-4 w-4 text-brand-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {exerciseName}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Best: {bestWeight} kg &middot;{' '}
                          {exerciseRecords.length}{' '}
                          {exerciseRecords.length === 1 ? 'entry' : 'entries'}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </button>

                  {/* Expanded entries */}
                  {isExpanded && (
                    <div className="border-t border-slate-800">
                      {exerciseRecords.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 last:border-b-0"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="text-white font-medium">
                                {record.weight} kg
                              </span>
                              <span className="text-slate-400 text-sm">
                                {record.reps}{' '}
                                {record.reps === 1 ? 'rep' : 'reps'}
                              </span>
                              <span className="text-slate-500 text-sm">
                                {formatDate(record.recorded_at)}
                              </span>
                              {record.weight === bestWeight && (
                                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                                  Best
                                </span>
                              )}
                            </div>
                            {record.notes && (
                              <p className="text-sm text-slate-500 mt-1 truncate">
                                {record.notes}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePR(record.id)}
                            disabled={isPending}
                            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 ml-2 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
