'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle } from 'lucide-react';

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
}

export function MealCalendar({
  meals,
  onAddMeal,
  onToggleMeal,
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

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    setCurrentWeekStart(new Date(today.setDate(diff)));
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
      breakfast: 'bg-orange-100 text-orange-700',
      lunch: 'bg-blue-100 text-blue-700',
      dinner: 'bg-purple-100 text-purple-700',
      snack: 'bg-green-100 text-green-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Card>
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

            return (
              <div
                key={index}
                className={`border rounded-lg p-3 ${
                  today ? 'bg-indigo-50 border-indigo-300' : 'bg-white'
                }`}
              >
                <div className="text-center mb-3">
                  <p className="text-xs text-gray-600 uppercase font-medium">
                    {formatDayName(date)}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      today ? 'text-indigo-600' : 'text-gray-900'
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
                          <div
                            onClick={() => onToggleMeal(meal.id)}
                            className="cursor-pointer group"
                          >
                            <div
                              className={`p-2 rounded-md text-xs ${
                                meal.completed
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-gray-50 border border-gray-200'
                              } hover:shadow-sm transition-shadow`}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                {meal.completed ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Circle className="h-3 w-3 text-gray-400" />
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
                              <p className="font-medium text-gray-900 mb-1">
                                {meal.name}
                              </p>
                              <p className="text-gray-600">
                                {meal.calories} cal
                              </p>
                              <p className="text-gray-500">
                                P: {meal.protein}g · C: {meal.carbs}g · F:{' '}
                                {meal.fat}g
                              </p>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-auto p-2 text-xs"
                            onClick={() => onAddMeal(date, mealType)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {mealType}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Daily Summary */}
                {dayMeals.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600">
                      Total:{' '}
                      <span className="font-semibold">
                        {dayMeals.reduce((sum, m) => sum + m.calories, 0)} cal
                      </span>
                    </p>
                    <p className="text-xs text-gray-600">
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
