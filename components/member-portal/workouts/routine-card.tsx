'use client';

import { useState } from 'react';
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
import { Play, MoreVertical, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { getCategorySvg } from '@/lib/svg-icons';
import { deleteWorkoutRoutine, updateWorkoutRoutine } from '@/lib/actions/members-portal';
import { toast } from 'sonner';

interface RoutineCardProps {
  routine: any;
  gymSlug: string;
}

export function RoutineCard({ routine, gymSlug }: RoutineCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const exerciseCount = routine.routine_exercises?.length || 0;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this routine?')) {
      return;
    }

    setDeleting(true);
    const result = await deleteWorkoutRoutine(routine.id);

    if (result.success) {
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
      legs: 'bg-green-500/10 text-green-400',
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
    <Card className={`bg-slate-900 border-slate-800 ${!routine.is_active ? 'opacity-60' : ''}`}>
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
                onClick={handleDelete}
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
  );
}
