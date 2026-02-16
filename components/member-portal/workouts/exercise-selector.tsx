'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      chest: 'bg-red-100 text-red-700 hover:bg-red-200',
      back: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      legs: 'bg-green-100 text-green-700 hover:bg-green-200',
      shoulders: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      arms: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      biceps: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      triceps: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      core: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
      cardio: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              selectedCategory === category
                ? ''
                : getCategoryColor(category as string)
            )}
          >
            {category as string}
          </Button>
        ))}
      </div>

      {/* Exercise List */}
      <div className="max-h-96 overflow-y-auto border rounded-lg">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Dumbbell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">
              {searchTerm || selectedCategory
                ? 'No exercises found'
                : 'No exercises available'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
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
                      <p className="text-sm text-gray-600 mt-1">
                        {exercise.description}
                      </p>
                    )}
                    {exercise.equipment && exercise.equipment.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.equipment.map((eq: string) => (
                          <Badge
                            key={eq}
                            variant="outline"
                            className="text-xs"
                          >
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    )}
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

      <p className="text-sm text-gray-500">
        Showing {filteredExercises.length} of {exercises.length} exercises
      </p>
    </div>
  );
}
