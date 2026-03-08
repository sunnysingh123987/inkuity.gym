'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle, MoreVertical, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Meal {
  id: string;
  name: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  completed: boolean;
  scheduled_for: string;
}

interface MealCalendarProps {
  meals: Meal[];
  onAddMeal: (date: Date, mealType: string) => void;
  onToggleMeal: (mealId: string) => void;
  onEditMeal?: (meal: Meal) => void;
  isAiGenerated?: boolean;
  onWeekChange?: (weekStartDate: Date) => void;
}

export function MealCalendar({
  meals,
  onAddMeal,
  onToggleMeal,
  onEditMeal,
  isAiGenerated = false,
  onWeekChange,
}: MealCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    return new Date(today.setDate(diff));
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const updateWeek = (newDate: Date) => {
    setCurrentWeekStart(newDate);
    onWeekChange?.(newDate);
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() - 7);
    updateWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);
    updateWeek(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    const newDate = new Date(today.setDate(diff));
    updateWeek(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getMealsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return meals.filter((meal) =>
      meal.scheduled_for.startsWith(dateString)
    );
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  const getMealTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      breakfast: 'bg-orange-500/10 text-orange-400',
      lunch: 'bg-blue-500/10 text-blue-400',
      dinner: 'bg-purple-500/10 text-purple-400',
      snack: 'bg-emerald-500/10 text-emerald-400',
    };
    return colors[type] || 'bg-slate-700 text-slate-300';
  };

  const shouldShowAddButton = (date: Date) => {
    if (!isAiGenerated) return true; // Manual plans: always show +
    return isToday(date); // AI plans: only show + for today
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Meal Plan</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((date, index) => {
            const dayMeals = getMealsForDate(date);
            const today = isToday(date);
            const showAdd = shouldShowAddButton(date);

            return (
              <div
                key={index}
                className={`border rounded-lg p-3 ${
                  today ? 'bg-brand-cyan-500/10 border-brand-cyan-500/30' : 'bg-slate-900 border-slate-700'
                }`}
              >
                <div className="text-center mb-3">
                  <p className="text-xs text-slate-400 uppercase font-medium">
                    {formatDayName(date)}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      today ? 'text-brand-cyan-400' : 'text-white'
                    }`}
                  >
                    {formatDate(date)}
                  </p>
                </div>

                <div className="space-y-2">
                  {mealTypes.map((mealType) => {
                    const meal = dayMeals.find(
                      (m) => m.meal_type === mealType
                    );

                    return (
                      <div key={mealType}>
                        {meal ? (
                          <div className="relative">
                            <div
                              onClick={today ? () => onToggleMeal(meal.id) : undefined}
                              className={today ? 'cursor-pointer group' : ''}
                            >
                              <div
                                className={`p-2 rounded-md text-xs ${
                                  meal.completed
                                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                                    : 'bg-slate-800 border border-slate-700'
                                } ${today ? 'hover:shadow-sm transition-shadow' : 'opacity-80'}`}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  {meal.completed ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Circle className="h-3 w-3 text-slate-500" />
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getMealTypeColor(
                                      meal.meal_type
                                    )}`}
                                  >
                                    {meal.meal_type}
                                  </Badge>
                                </div>
                                <p className="font-medium text-white mb-1">
                                  {meal.name}
                                </p>
                                <p className="text-slate-400">
                                  {meal.calories} cal
                                </p>
                                <p className="text-slate-500">
                                  P: {meal.protein}g · C: {meal.carbs}g · F:{' '}
                                  {meal.fat}g
                                </p>
                              </div>
                            </div>
                            {today && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="absolute top-1 right-1 p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                  <DropdownMenuItem
                                    className="text-xs cursor-pointer"
                                    onClick={() => onEditMeal?.(meal)}
                                  >
                                    <Pencil className="h-3 w-3 mr-2" />
                                    Edit meal
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        ) : showAdd ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-auto p-2 text-xs"
                            onClick={() => onAddMeal(date, mealType)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {mealType}
                          </Button>
                        ) : (
                          <div className="p-2 text-xs text-slate-600 text-center capitalize">
                            {mealType}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Daily Summary */}
                {dayMeals.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-400">
                      Total:{' '}
                      <span className="font-semibold">
                        {dayMeals.reduce((sum, m) => sum + m.calories, 0)} cal
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {dayMeals.filter((m) => m.completed).length} /{' '}
                      {dayMeals.length} completed
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
