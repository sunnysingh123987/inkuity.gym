'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { getCategorySvg } from '@/lib/svg-icons';
import { deleteWorkoutRoutine } from '@/lib/actions/members-portal';
import { toast } from '@/components/ui/toaster';

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
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 14) return '1w ago';
  return `${Math.floor(diffDays / 7)}w ago`;
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
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const prevProgressRef = useRef<number | null>(null);

  const isActive = !!activeSessionId;
  const progressPercent = activeProgress && activeProgress.total > 0
    ? Math.round((activeProgress.completed / activeProgress.total) * 100)
    : 0;

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

  const exerciseCount = routine.routine_exercises?.length || 0;
  const categorySvgPath = getCategorySvg(primaryCategory || FALLBACK_CATEGORY);
  const daysAgo = getDaysAgoText(lastSessionDate, routine.updated_at);

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
      toast.success('Routine deleted');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete routine');
    }
    setDeleting(false);
  };

  const handleCardClick = () => {
    if (menuOpen || showDeleteSheet) return;
    if (exerciseCount > 0 && onSelect) {
      onSelect(routine);
    } else if (exerciseCount === 0) {
      router.push(`/${gymSlug}/portal/workouts/new?edit=${routine.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative rounded-2xl cursor-pointer active:scale-[0.98] transition-transform duration-200"
    >
      {/* Subtle pulsing glow behind active card */}
      {isActive && (
        <>
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'rgba(6, 182, 212, 0.15)',
              filter: 'blur(12px)',
              animation: 'subtle-pulse 3s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes subtle-pulse {
              0%, 100% { opacity: 0.9; transform: scale(1.2); }
              50% { opacity: 0.5; transform: scale(1); }
            }
          `}</style>
        </>
      )}

      {/* Card */}
      <div
        className={`relative z-10 rounded-2xl px-4 py-3.5 ${
          isActive
            ? 'glass border border-brand-cyan-500/20'
            : 'glass'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
            <img src={categorySvgPath} alt="" className="h-6 w-6 invert opacity-70" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{routine.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-slate-500">
                {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
              </span>
              {daysAgo && (
                <>
                  <span className="text-slate-700 text-[11px]">&middot;</span>
                  <span className="text-[11px] text-slate-500">{daysAgo}</span>
                </>
              )}
            </div>
          </div>

          {isActive && (
            <span className="text-[11px] font-bold text-brand-cyan-400 bg-brand-cyan-500/10 px-2 py-0.5 rounded-full shrink-0">
              {activeProgress?.completed}/{activeProgress?.total}
            </span>
          )}

          <div>
            <DropdownMenu onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 shrink-0 text-slate-500 hover:text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/${gymSlug}/portal/workouts/new?edit=${routine.id}`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteSheet(true)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Bottom Sheet — portaled to body */}
      {showDeleteSheet && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center overscroll-none touch-none"
        >
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
    </div>
  );
}
