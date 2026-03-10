'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategorySvg, getExerciseSvg, getEquipmentSvg } from '@/lib/svg-icons';

interface ExerciseSelectorProps {
  exercises: any[];
  onSelectExercise: (exercise: any) => void;
}

export function ExerciseSelector({
  exercises,
  onSelectExercise,
}: ExerciseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(
    new Set(exercises.map((e) => e.category).filter(Boolean))
  ).sort();

  // Filter exercises
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || exercise.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      chest: 'bg-red-500/10 text-red-400 hover:bg-red-500/20',
      back: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
      legs: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
      shoulders: 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20',
      arms: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20',
      biceps: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20',
      triceps: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20',
      core: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20',
      cardio: 'bg-pink-500/10 text-pink-400 hover:bg-pink-500/20',
    };
    return colors[category] || 'bg-slate-700 text-slate-300 hover:bg-slate-600';
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category as string)}
            className={cn(
              'gap-1.5',
              selectedCategory === category
                ? ''
                : getCategoryColor(category as string)
            )}
          >
            <img
              src={getCategorySvg(category as string)}
              alt=""
              className="h-3.5 w-3.5 opacity-80"
            />
            {category as string}
          </Button>
        ))}
      </div>

      {/* Exercise List */}
      <div className="max-h-96 overflow-y-auto border border-white/[0.06] rounded-lg">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Dumbbell className="h-8 w-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm">
              {searchTerm || selectedCategory
                ? 'No exercises found'
                : 'No exercises available'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="p-3 glass-hover transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={getExerciseSvg(exercise.name)}
                      alt=""
                      className="h-8 w-8 opacity-70 flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">
                        {exercise.name}
                      </h4>
                      {exercise.category && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs',
                            getCategoryColor(exercise.category)
                          )}
                        >
                          {exercise.category}
                        </Badge>
                      )}
                    </div>
                    {exercise.description && (
                      <p className="text-sm text-slate-400 mt-1">
                        {exercise.description}
                      </p>
                    )}
                    {exercise.equipment && exercise.equipment.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.equipment.map((eq: string) => (
                          <Badge
                            key={eq}
                            variant="outline"
                            className="text-xs gap-1"
                          >
                            <img
                              src={getEquipmentSvg(eq)}
                              alt=""
                              className="h-3 w-3 opacity-60"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onSelectExercise(exercise)}
                    className="ml-3"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500">
        Showing {filteredExercises.length} of {exercises.length} exercises
      </p>
    </div>
  );
}
