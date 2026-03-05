'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, ChevronDown } from 'lucide-react';
import { searchMuscles, MUSCLE_GROUPS, type MuscleGroup } from '@/lib/data/exercises';

interface SearchableMuscleSelectProps {
  selected: string[];          // array of muscle group ids
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

const MUSCLE_COLORS: Record<string, string> = {
  chest:       'bg-red-500/15 text-red-400 border-red-500/30',
  back:        'bg-blue-500/15 text-blue-400 border-blue-500/30',
  shoulders:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
  biceps:      'bg-orange-500/15 text-orange-400 border-orange-500/30',
  triceps:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
  forearms:    'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  quads:       'bg-green-500/15 text-green-400 border-green-500/30',
  hamstrings:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  glutes:      'bg-pink-500/15 text-pink-400 border-pink-500/30',
  calves:      'bg-teal-500/15 text-teal-400 border-teal-500/30',
  core:        'bg-orange-500/15 text-orange-400 border-orange-500/30',
  traps:       'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  lats:        'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
};

function getMuscleColor(muscleId: string): string {
  const muscle = MUSCLE_GROUPS.find((m) => m.id === muscleId);
  const parentId = muscle?.parentId || muscleId;
  return MUSCLE_COLORS[parentId] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
}

export function SearchableMuscleSelect({
  selected,
  onChange,
  placeholder = 'Search muscles...',
}: SearchableMuscleSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchMuscles(query);

  // Group results: major groups first, sub-groups after
  const majorResults = results.filter((m) => !m.parentId);
  const subResults = results.filter((m) => m.parentId);

  const handleToggle = useCallback((muscleId: string) => {
    if (selected.includes(muscleId)) {
      onChange(selected.filter((id) => id !== muscleId));
    } else {
      onChange([...selected, muscleId]);
    }
  }, [selected, onChange]);

  const handleRemove = useCallback((muscleId: string) => {
    onChange(selected.filter((id) => id !== muscleId));
  }, [selected, onChange]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedMuscles = selected
    .map((id) => MUSCLE_GROUPS.find((m) => m.id === id))
    .filter(Boolean) as MuscleGroup[];

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger / selected chips */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full min-h-[2.5rem] flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-md border border-slate-800 bg-slate-900 text-left text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors hover:border-slate-700"
      >
        {selectedMuscles.length > 0 ? (
          <>
            {selectedMuscles.map((m) => (
              <Badge
                key={m.id}
                variant="outline"
                className={`gap-1 text-xs font-medium border ${getMuscleColor(m.id)}`}
              >
                {m.name}
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(m.id);
                  }}
                  className="ml-0.5 hover:text-white cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </span>
              </Badge>
            ))}
          </>
        ) : (
          <span className="text-slate-500">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 text-slate-500 ml-auto flex-shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or alias..."
                className="pl-8 h-8 text-sm bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          {/* Results list */}
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {majorResults.length === 0 && subResults.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                No muscles found
              </div>
            ) : (
              <>
                {/* Major groups */}
                {majorResults.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50">
                      Major Groups
                    </div>
                    {majorResults.map((m) => {
                      const isSelected = selected.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleToggle(m.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                            isSelected
                              ? 'bg-brand-cyan-500/10 text-white'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-brand-cyan-500 border-brand-cyan-500'
                                : 'border-slate-600'
                            }`}
                          >
                            {isSelected && (
                              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium">{m.name}</span>
                          {m.aliases.length > 0 && (
                            <span className="text-xs text-slate-500 truncate">
                              {m.aliases.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Sub groups */}
                {subResults.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50">
                      Sub-Groups
                    </div>
                    {subResults.map((m) => {
                      const isSelected = selected.includes(m.id);
                      const parent = MUSCLE_GROUPS.find((p) => p.id === m.parentId);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleToggle(m.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                            isSelected
                              ? 'bg-brand-cyan-500/10 text-white'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-brand-cyan-500 border-brand-cyan-500'
                                : 'border-slate-600'
                            }`}
                          >
                            {isSelected && (
                              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div className="flex flex-col items-start min-w-0">
                            <span className="font-medium">{m.name}</span>
                            {parent && (
                              <span className="text-[10px] text-slate-500">{parent.name}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer with count */}
          {selected.length > 0 && (
            <div className="border-t border-slate-800 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {selected.length} selected
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
