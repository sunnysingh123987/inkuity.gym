'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Play, MoreVertical, Edit, Trash2, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { getCategorySvg } from '@/lib/svg-icons';
import { deleteWorkoutRoutine, updateWorkoutRoutine } from '@/lib/actions/members-portal';
import { toast } from '@/components/ui/toaster';

interface RoutineCardProps {
  routine: any;
  gymSlug: string;
}

export function RoutineCard({ routine, gymSlug }: RoutineCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const exerciseCount = routine.routine_exercises?.length || 0;

  useEffect(() => {
    if (showDeleteSheet) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setSheetVisible(true));
    } else {
      setSheetVisible(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showDeleteSheet]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteWorkoutRoutine(routine.id);

    if (result.success) {
      setShowDeleteSheet(false);
      toast.success('Routine deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete routine');
      setDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    setToggling(true);
    const result = await updateWorkoutRoutine(routine.id, {
      is_active: !routine.is_active,
    });

    if (result.success) {
      toast.success(
        routine.is_active
          ? 'Routine deactivated'
          : 'Routine activated'
      );
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update routine');
    }
    setToggling(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      chest: 'bg-red-500/10 text-red-400',
      back: 'bg-blue-500/10 text-blue-400',
      legs: 'bg-emerald-500/10 text-emerald-400',
      shoulders: 'bg-yellow-500/10 text-yellow-400',
      arms: 'bg-purple-500/10 text-purple-400',
      biceps: 'bg-purple-500/10 text-purple-400',
      triceps: 'bg-purple-500/10 text-purple-400',
      core: 'bg-orange-500/10 text-orange-400',
      cardio: 'bg-pink-500/10 text-pink-400',
    };
    return colors[category] || 'bg-slate-700 text-slate-300';
  };

  // Get unique categories from exercises
  const categories = Array.from(
    new Set(
      routine.routine_exercises?.map((re: any) => {
        const exercise = Array.isArray(re.exercise_library)
          ? re.exercise_library[0]
          : re.exercise_library;
        return exercise?.category;
      }).filter(Boolean) || []
    )
  );

  return (
    <>
    <Card className={`${!routine.is_active ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg text-white">{routine.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/${gymSlug}/portal/workouts/${routine.id}`)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleToggleActive}
                disabled={toggling}
              >
                {routine.is_active ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteSheet(true)}
                disabled={deleting}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {routine.description && (
          <p className="text-sm text-slate-400 mt-2">{routine.description}</p>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Exercise Count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Exercises:</span>
            <span className="font-semibold text-white">{exerciseCount}</span>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {categories.map((category) => (
                <Badge
                  key={category as string}
                  variant="secondary"
                  className={`gap-1 ${getCategoryColor(category as string)}`}
                >
                  <img
                    src={getCategorySvg(category as string)}
                    alt=""
                    className="h-3 w-3 opacity-70"
                  />
                  {category as string}
                </Badge>
              ))}
            </div>
          )}

          {/* Schedule */}
          {routine.schedule && routine.schedule.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {routine.schedule.map((day: string) => (
                <Badge key={day} variant="outline" className="text-xs">
                  {day}
                </Badge>
              ))}
            </div>
          )}

          {/* Status Badge */}
          <div>
            <Badge variant={routine.is_active ? 'default' : 'secondary'}>
              {routine.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() =>
            router.push(`/${gymSlug}/portal/workouts/${routine.id}/start`)
          }
          disabled={!routine.is_active || exerciseCount === 0}
        >
          <Play className="h-4 w-4 mr-2" />
          Start Workout
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/${gymSlug}/portal/workouts/${routine.id}`)
          }
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </CardFooter>
    </Card>

    {/* Delete Confirmation Bottom Sheet — portaled to body */}
    {showDeleteSheet && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-end justify-center overscroll-none touch-none">
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${sheetVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => {
            if (!deleting) {
              setSheetVisible(false);
              setTimeout(() => setShowDeleteSheet(false), 300);
            }
          }}
          onTouchMove={(e) => e.preventDefault()}
        />
        {/* Sheet */}
        <div
          className={`relative w-full max-w-md mx-auto glass-sheet rounded-t-2xl p-6 pb-8 transition-transform duration-300 ease-out touch-auto overscroll-contain ${sheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
        >
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Delete Routine</h3>
            <p className="text-sm text-slate-400">
              Are you sure you want to delete <span className="text-white font-medium">{routine.name}</span>? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSheetVisible(false);
                setTimeout(() => setShowDeleteSheet(false), 300);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleDelete()}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
