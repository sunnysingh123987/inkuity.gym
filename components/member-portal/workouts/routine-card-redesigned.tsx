'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { getCategorySvg } from '@/lib/svg-icons';
import { deleteWorkoutRoutine } from '@/lib/actions/members-portal';
import { toast } from 'sonner';

interface RoutineCardRedesignedProps {
  routine: any;
  gymSlug: string;
  lastSessionDate?: string;
  activeSessionId?: string;
  activeProgress?: { total: number; completed: number };
  onSelect?: (routine: any) => void;
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

export function RoutineCardRedesigned({
  routine,
  gymSlug,
  lastSessionDate,
  activeSessionId,
  activeProgress,
  onSelect,
}: RoutineCardRedesignedProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const prevProgressRef = useRef<number | null>(null);

  const isActive = !!activeSessionId;
  const progressPercent = activeProgress && activeProgress.total > 0
    ? Math.round((activeProgress.completed / activeProgress.total) * 100)
    : 0;

  // Trigger glow animation when progress changes
  useEffect(() => {
    if (prevProgressRef.current !== null && progressPercent > prevProgressRef.current) {
      setGlowing(true);
      const timer = setTimeout(() => setGlowing(false), 600);
      return () => clearTimeout(timer);
    }
    prevProgressRef.current = progressPercent;
  }, [progressPercent]);

  const primaryCategory = (() => {
    const exercises = routine.routine_exercises || [];
    if (exercises.length === 0) return null;
    const first = exercises[0];
    const exercise = Array.isArray(first.exercise_library)
      ? first.exercise_library[0]
      : first.exercise_library;
    return exercise?.category?.toLowerCase() || null;
  })();

  const exercisePreview = (() => {
    const exercises = routine.routine_exercises || [];
    const names = exercises.map((re: any) => {
      const ex = Array.isArray(re.exercise_library)
        ? re.exercise_library[0]
        : re.exercise_library;
      return ex?.name || 'Exercise';
    });
    return names.join(', ');
  })();

  const categorySvgPath = getCategorySvg(primaryCategory || FALLBACK_CATEGORY);
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

  const handleCardClick = () => {
    if (exerciseCount > 0 && onSelect) {
      onSelect(routine);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative rounded-xl cursor-pointer transition-all duration-500 ${
        glowing ? 'scale-[1.02]' : ''
      }`}
      style={isActive ? {
        padding: '2px',
        background: `conic-gradient(from 0deg, #06b6d4 ${progressPercent}%, transparent ${progressPercent}%)`,
        borderRadius: '0.75rem',
        boxShadow: glowing ? '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.2)' : 'none',
        transition: 'box-shadow 0.5s ease, transform 0.5s ease',
      } : undefined}
    >
      <div
        className={`rounded-xl px-4 py-3 ${
          isActive
            ? 'bg-slate-950 border-0'
            : 'border border-slate-800 hover:border-slate-700'
        }`}
      >
      {/* Top row: name + icon, days ago, menu */}
      <div className="flex items-center gap-2">
        {/* Routine name */}
        <h3 className="text-lg font-bold text-white">{routine.name}</h3>

        {/* Category icon */}
        <img src={categorySvgPath} alt="" className="h-5 w-5 invert opacity-60" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Active progress or days ago */}
        {isActive ? (
          <span className="text-sm font-semibold text-brand-cyan-400 whitespace-nowrap">
            {activeProgress?.completed}/{activeProgress?.total}
          </span>
        ) : daysAgo !== 'Today' ? (
          <span className="text-sm font-medium text-brand-cyan-400 whitespace-nowrap">
            {daysAgo}
          </span>
        ) : null}

        {/* 3-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={() => router.push(`/${gymSlug}/portal/workouts/new?edit=${routine.id}`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
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

      {/* Exercise list */}
      {exercisePreview && (
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          {exercisePreview}
        </p>
      )}
      </div>
    </div>
  );
}
