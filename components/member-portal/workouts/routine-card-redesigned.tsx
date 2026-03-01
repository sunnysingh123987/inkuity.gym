'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
} from 'lucide-react';
import { getCategorySvg } from '@/lib/svg-icons';
import { deleteWorkoutRoutine, updateWorkoutRoutine } from '@/lib/actions/members-portal';
import { toast } from 'sonner';
import Link from 'next/link';

interface RoutineCardRedesignedProps {
  routine: any;
  gymSlug: string;
  lastSessionDate?: string;
}

const FALLBACK_CATEGORY = 'full-body';

function getDaysAgoText(dateString?: string, fallback?: string): string {
  const date = dateString || fallback;
  if (!date) return 'New';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

function getFrequencyDots(lastSessionDate?: string, fallback?: string) {
  // Show 3 dots representing workout frequency this week
  // For now, fill based on recency: today=3, 1-2 days=2, 3+ days=1, no session=0
  const date = lastSessionDate || fallback;
  if (!date) return 0;
  const now = new Date();
  const then = new Date(date);
  const diffDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 3;
  if (diffDays <= 2) return 2;
  if (diffDays <= 5) return 1;
  return 0;
}

export function RoutineCardRedesigned({
  routine,
  gymSlug,
  lastSessionDate,
}: RoutineCardRedesignedProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Get primary category from first exercise
  const primaryCategory = (() => {
    const exercises = routine.routine_exercises || [];
    if (exercises.length === 0) return null;
    const first = exercises[0];
    const exercise = Array.isArray(first.exercise_library)
      ? first.exercise_library[0]
      : first.exercise_library;
    return exercise?.category?.toLowerCase() || null;
  })();

  // Get category display label (uppercase)
  const categoryLabel = (() => {
    const exercises = routine.routine_exercises || [];
    const categories = new Set<string>();
    exercises.forEach((re: any) => {
      const ex = Array.isArray(re.exercise_library)
        ? re.exercise_library[0]
        : re.exercise_library;
      if (ex?.category) categories.add(ex.category.toUpperCase());
    });
    const arr = Array.from(categories);
    if (arr.length === 0) return 'GENERAL';
    if (arr.length <= 2) return arr.join(' & ');
    return `${arr[0]} & ${arr[1]}`;
  })();

  // Get exercise names preview
  const exercisePreview = (() => {
    const exercises = routine.routine_exercises || [];
    const names = exercises.map((re: any) => {
      const ex = Array.isArray(re.exercise_library)
        ? re.exercise_library[0]
        : re.exercise_library;
      return ex?.name || 'Exercise';
    });
    const text = names.join(', ');
    if (text.length > 50) return text.substring(0, 47) + ',...';
    return text;
  })();

  const categorySvgPath = getCategorySvg(primaryCategory || FALLBACK_CATEGORY);
  const filledDots = getFrequencyDots(lastSessionDate, routine.updated_at);
  const daysAgo = getDaysAgoText(lastSessionDate, routine.updated_at);
  const exerciseCount = routine.routine_exercises?.length || 0;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this routine?')) return;
    setDeleting(true);
    const result = await deleteWorkoutRoutine(routine.id);
    if (result.success) {
      toast.success('Routine deleted');
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
      toast.success(routine.is_active ? 'Routine deactivated' : 'Routine activated');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update routine');
    }
    setToggling(false);
  };

  const handleCardClick = () => {
    if (routine.is_active && exerciseCount > 0) {
      router.push(`/${gymSlug}/portal/workouts/${routine.id}/start`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3 cursor-pointer hover:border-slate-700 transition-colors ${
        !routine.is_active ? 'opacity-60' : ''
      }`}
    >
      {/* Top row: icon + category + name + frequency + menu */}
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-brand-cyan-500/10 flex items-center justify-center overflow-hidden">
          <img src={categorySvgPath} alt="" className="h-8 w-8 invert opacity-80" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              {/* Category label */}
              <p className="text-xs font-bold text-brand-cyan-400 tracking-wide uppercase">
                {categoryLabel}
              </p>
              {/* Routine name */}
              <h3 className="text-lg font-bold text-white mt-0.5 truncate">
                {routine.name}
              </h3>
            </div>

            {/* Right side: Frequency + Menu */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {/* Frequency dots */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  Frequency
                </span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-2.5 rounded-full ${
                        i < filledDots
                          ? 'bg-brand-cyan-400'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* 3-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                    onClick={() => router.push(`/${gymSlug}/portal/workouts/${routine.id}`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleActive} disabled={toggling}>
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
          </div>

          {/* Exercise preview */}
          {exercisePreview && (
            <p className="text-sm text-slate-400 mt-1.5 leading-snug">
              {exercisePreview}
            </p>
          )}
        </div>
      </div>

      {/* Last session date */}
      <div className="flex items-center gap-1.5 text-slate-500 text-sm pt-1">
        <Calendar className="h-3.5 w-3.5" />
        <span>Last: {daysAgo}</span>
      </div>
    </div>
  );
}
