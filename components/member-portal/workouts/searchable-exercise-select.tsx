'use client';

import { useState, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EXERCISES as LOCAL_EXERCISES,
  MUSCLE_GROUPS,
  searchExercises,
} from '@/lib/data/exercises';
import { getCategorySvg } from '@/lib/svg-icons';

// An exercise from the gym's library (DB) or our local database
export interface ExerciseOption {
  id: string;
  name: string;
  category: string;
  equipment?: string[];
  description?: string;
  source: 'library' | 'local';
}

interface SearchableExerciseSelectProps {
  /** Exercises already loaded from the gym's exercise_library table */
  libraryExercises: any[];
  /** Already-selected exercise IDs to mark/exclude */
  selectedIds: string[];
  /** Callback when an exercise is picked */
  onSelect: (exercise: ExerciseOption) => void;
  /** Optional muscle filter to narrow results */
  muscleFilter?: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  chest:     'bg-red-500/10 text-red-400',
  back:      'bg-blue-500/10 text-blue-400',
  legs:      'bg-green-500/10 text-green-400',
  shoulders: 'bg-purple-500/10 text-purple-400',
  arms:      'bg-orange-500/10 text-orange-400',
  core:      'bg-yellow-500/10 text-yellow-400',
  cardio:    'bg-pink-500/10 text-pink-400',
};

export function SearchableExerciseSelect({
  libraryExercises,
  selectedIds,
  onSelect,
  muscleFilter,
}: SearchableExerciseSelectProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Merge gym library exercises with our local database, preferring gym library ones.
  // This gives gym-specific exercises priority, but fills in gaps from our 200+ list.
  const allExercises = useMemo(() => {
    // First, map library exercises to our unified format
    const libraryMap = new Map<string, ExerciseOption>();
    const libraryNames = new Set<string>();

    for (const ex of libraryExercises) {
      const option: ExerciseOption = {
        id: ex.id,
        name: ex.name,
        category: ex.category || 'other',
        equipment: ex.equipment || [],
        description: ex.description,
        source: 'library',
      };
      libraryMap.set(ex.id, option);
      libraryNames.add(ex.name.toLowerCase().trim());
    }

    // Add local exercises that are NOT already in the gym library (by name match)
    const localExtras: ExerciseOption[] = [];
    for (const local of LOCAL_EXERCISES) {
      if (!libraryNames.has(local.name.toLowerCase().trim())) {
        localExtras.push({
          id: `local-${local.id}`,
          name: local.name,
          category: local.category,
          equipment: local.equipment,
          source: 'local',
        });
      }
    }

    return [...Array.from(libraryMap.values()), ...localExtras];
  }, [libraryExercises]);

  // Get unique categories from merged list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allExercises.forEach((ex) => {
      if (ex.category) cats.add(ex.category);
    });
    return Array.from(cats).sort();
  }, [allExercises]);

  // Filter exercises based on search, category, and muscle filter
  const filteredExercises = useMemo(() => {
    let results = allExercises;

    // Category filter
    if (selectedCategory) {
      results = results.filter((ex) => ex.category === selectedCategory);
    }

    // Muscle filter: use our local database mapping to find relevant exercises
    if (muscleFilter && muscleFilter.length > 0) {
      const localMatchingNames = new Set(
        searchExercises('', muscleFilter).map((e) => e.name.toLowerCase().trim())
      );
      results = results.filter(
        (ex) =>
          localMatchingNames.has(ex.name.toLowerCase().trim()) ||
          // Also keep gym library exercises that match by category heuristic
          (ex.source === 'library' &&
            muscleFilter.some((mId) => {
              const muscle = MUSCLE_GROUPS.find((m) => m.id === mId);
              return muscle && ex.category?.toLowerCase().includes(muscle.name.toLowerCase());
            }))
      );
    }

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      const tokens = q.split(/\s+/);

      // If we have a query, use our smart search for local exercises
      const localMatches = new Set(
        searchExercises(query, muscleFilter && muscleFilter.length > 0 ? muscleFilter : undefined)
          .map((e) => e.name.toLowerCase().trim())
      );

      results = results.filter((ex) => {
        const name = ex.name.toLowerCase();
        // Direct name match
        if (name.includes(q)) return true;
        // Token match
        if (tokens.every((t) => name.includes(t))) return true;
        // Equipment match
        if (ex.equipment?.some((eq) => eq.toLowerCase().includes(q))) return true;
        // Category match
        if (ex.category?.toLowerCase().includes(q)) return true;
        // Smart local search match
        if (localMatches.has(name)) return true;
        return false;
      });

      // Sort: exact name matches first, then starts-with, then contains
      results.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aExact = aName === q ? 3 : aName.startsWith(q) ? 2 : 1;
        const bExact = bName === q ? 3 : bName.startsWith(q) ? 2 : 1;
        if (aExact !== bExact) return bExact - aExact;
        // Prefer library exercises
        if (a.source !== b.source) return a.source === 'library' ? -1 : 1;
        return aName.localeCompare(bName);
      });
    } else {
      // Default sort: library first, then alphabetical
      results.sort((a, b) => {
        if (a.source !== b.source) return a.source === 'library' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }

    return results;
  }, [allExercises, query, selectedCategory, muscleFilter]);

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises, muscles, equipment..."
          className="pl-10 bg-slate-800 border-slate-700"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
            selectedCategory === null
              ? 'bg-brand-cyan-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors',
              selectedCategory === cat
                ? 'bg-brand-cyan-500 text-white'
                : `${CATEGORY_COLORS[cat] || 'bg-slate-800 text-slate-400'} hover:opacity-80`
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="max-h-72 overflow-y-auto border border-slate-700 rounded-lg overscroll-contain">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-8">
            <Dumbbell className="h-7 w-7 mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-500">
              {query || selectedCategory ? 'No exercises found' : 'No exercises available'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredExercises.map((exercise) => {
              const isAlreadyAdded = selectedIds.includes(exercise.id);
              return (
                <div
                  key={exercise.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 transition-colors',
                    isAlreadyAdded ? 'opacity-40' : 'hover:bg-slate-800/50'
                  )}
                >
                  {/* Category icon */}
                  <img
                    src={getCategorySvg(exercise.category)}
                    alt=""
                    className="h-6 w-6 opacity-60 flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {exercise.name}
                      </span>
                      {exercise.source === 'local' && (
                        <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                          DB
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] capitalize py-0 px-1.5',
                          CATEGORY_COLORS[exercise.category] || 'bg-slate-700 text-slate-300'
                        )}
                      >
                        {exercise.category}
                      </Badge>
                      {exercise.equipment && exercise.equipment.length > 0 && (
                        <span className="text-[10px] text-slate-500 truncate">
                          {exercise.equipment.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add button */}
                  <Button
                    type="button"
                    size="sm"
                    disabled={isAlreadyAdded}
                    onClick={() => onSelect(exercise)}
                    className="h-7 px-2.5 text-xs flex-shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 mr-0.5" />
                    {isAlreadyAdded ? 'Added' : 'Add'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-slate-500">
        {filteredExercises.length} of {allExercises.length} exercises
        {muscleFilter && muscleFilter.length > 0 && ' (filtered by muscle)'}
      </p>
    </div>
  );
}
