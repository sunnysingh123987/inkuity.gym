'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, History, MoreVertical, Zap, Plus, Search, X, Loader2 } from 'lucide-react';
import { ExerciseSetLogger, type ExerciseSetLoggerHandle } from './exercise-set-logger';
import {
  getExerciseLibrary,
  addSessionExercise,
} from '@/lib/actions/members-portal';
import { toast } from '@/components/ui/toaster';

interface ActiveSessionTrackerProps {
  session: any;
  gymSlug: string;
}

function getTodaySets(exerciseSets: any[]): any[] {
  if (!exerciseSets) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return exerciseSets.filter((s: any) => {
    const created = new Date(s.created_at);
    return created >= today;
  });
}

export function ActiveSessionTracker({
  session,
  gymSlug,
}: ActiveSessionTrackerProps) {
  const router = useRouter();
  const [exerciseList, setExerciseList] = useState<any[]>(
    (session.session_exercises || []).sort(
      (a: any, b: any) => a.order_index - b.order_index
    )
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loggerRefs = useRef<Map<string, ExerciseSetLoggerHandle>>(new Map());

  // Initialize sets count from existing data (today only)
  const [setsCount, setSetsCount] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    (session.session_exercises || []).forEach((se: any) => {
      const todaySets = getTodaySets(se.exercise_sets);
      if (todaySets.length > 0) {
        counts[se.id] = todaySets.length;
      }
    });
    return counts;
  });

  // Add exercise picker state
  const [showPicker, setShowPicker] = useState(false);
  const [libraryExercises, setLibraryExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [addingExerciseId, setAddingExerciseId] = useState<string | null>(null);

  const routineName = Array.isArray(session.workout_routines)
    ? session.workout_routines[0]?.name
    : session.workout_routines?.name;

  const toggleExercise = async (id: string) => {
    if (expandedId === id) {
      // Collapsing — flush dirty sets
      const loggerRef = loggerRefs.current.get(id);
      if (loggerRef) {
        setSaving(true);
        await loggerRef.flush();
        setSaving(false);
      }
      setExpandedId(null);
    } else {
      // Flush previously expanded logger before switching
      if (expandedId) {
        const prevRef = loggerRefs.current.get(expandedId);
        if (prevRef) {
          setSaving(true);
          await prevRef.flush();
          setSaving(false);
        }
      }
      setExpandedId(id);
    }
  };

  const handleSetsChange = (exerciseId: string, count: number) => {
    setSetsCount((prev) => ({ ...prev, [exerciseId]: count }));
  };

  const handleOpenPicker = async () => {
    setShowPicker(true);
    if (libraryExercises.length === 0) {
      setLoadingLibrary(true);
      const result = await getExerciseLibrary(session.gym_id);
      if (result.data) {
        setLibraryExercises(result.data);
      }
      setLoadingLibrary(false);
    }
  };

  const handleAddExercise = async (exerciseId: string) => {
    setAddingExerciseId(exerciseId);
    const result = await addSessionExercise(session.id, exerciseId);
    if (result.success && result.data) {
      setExerciseList((prev) => [...prev, result.data]);
      setExpandedId(result.data.id);
      setShowPicker(false);
      setSearchQuery('');
      toast.success('Exercise added');
    } else {
      toast.error(result.error || 'Failed to add exercise');
    }
    setAddingExerciseId(null);
  };

  // Filter exercises already in the session
  const existingExerciseIds = new Set(
    exerciseList.map((se: any) => {
      const ex = Array.isArray(se.exercise_library)
        ? se.exercise_library[0]
        : se.exercise_library;
      return ex?.id;
    })
  );

  const filteredLibrary = libraryExercises.filter((ex) => {
    if (existingExerciseIds.has(ex.id)) return false;
    if (!searchQuery) return true;
    return ex.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Header with back arrow */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/${gymSlug}/portal/routines`)}
          className="p-1.5 rounded-lg glass-hover transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </button>
        <h1 className="text-2xl font-bold text-white">
          {routineName || 'Workout Session'}
        </h1>
        <History className="h-5 w-5 text-brand-cyan-400" />
      </div>

      {/* Collapsible exercise accordion */}
      <div className="space-y-3">
        {exerciseList.map((sessionExercise: any) => {
          const exercise = Array.isArray(sessionExercise.exercise_library)
            ? sessionExercise.exercise_library[0]
            : sessionExercise.exercise_library;

          const isExpanded = expandedId === sessionExercise.id;
          const loggedSets = setsCount[sessionExercise.id] || 0;

          return (
            <div
              key={sessionExercise.id}
              className={`rounded-xl border transition-colors ${
                isExpanded
                  ? 'glass border-white/[0.08]'
                  : 'glass border-white/[0.04] hover:border-white/[0.08]'
              }`}
            >
              {/* Exercise header (always visible) */}
              <button
                type="button"
                onClick={() => toggleExercise(sessionExercise.id)}
                disabled={saving}
                className="w-full flex items-center justify-between p-4 text-left disabled:opacity-60"
              >
                <h3 className="font-semibold text-white text-lg">
                  {exercise?.name || 'Exercise'}
                </h3>
                <div className="flex items-center gap-2">
                  {/* Zap icons for logged sets */}
                  {loggedSets > 0 && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(loggedSets, 5) }).map((_, i) => (
                        <Zap
                          key={i}
                          className="h-4 w-4 text-brand-cyan-400 fill-brand-cyan-400"
                        />
                      ))}
                    </div>
                  )}
                  {/* 3-dot menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div
                        role="button"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded glass-hover transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem disabled>Reorder</DropdownMenuItem>
                      <DropdownMenuItem disabled>Skip</DropdownMenuItem>
                      <DropdownMenuItem disabled>Notes</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <ExerciseSetLogger
                    ref={(handle) => {
                      if (handle) {
                        loggerRefs.current.set(sessionExercise.id, handle);
                      } else {
                        loggerRefs.current.delete(sessionExercise.id);
                      }
                    }}
                    sessionExerciseId={sessionExercise.id}
                    existingSets={getTodaySets(sessionExercise.exercise_sets || [])}
                    onSetsChange={(count) =>
                      handleSetsChange(sessionExercise.id, count)
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Exercise picker */}
      {showPicker && (
        <div className="rounded-xl glass p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Add Exercise</h3>
            <button
              type="button"
              onClick={() => { setShowPicker(false); setSearchQuery(''); }}
              className="p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan-500"
            />
          </div>

          {/* Exercise list */}
          <div className="max-h-60 overflow-y-auto space-y-1">
            {loadingLibrary ? (
              <p className="text-sm text-slate-500 text-center py-4">Loading...</p>
            ) : filteredLibrary.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No exercises found</p>
            ) : (
              filteredLibrary.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  disabled={addingExerciseId === ex.id}
                  onClick={() => handleAddExercise(ex.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 transition-colors text-left disabled:opacity-50"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{ex.name}</p>
                    {ex.category && (
                      <p className="text-xs text-slate-500">{ex.category}</p>
                    )}
                  </div>
                  <Plus className="h-4 w-4 text-brand-cyan-400 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Exercise button */}
      {!showPicker && (
        <button
          type="button"
          onClick={handleOpenPicker}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 text-sm font-medium flex items-center justify-center gap-1.5 hover:border-slate-600 hover:text-slate-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Exercise
        </button>
      )}
    </div>
  );
}
