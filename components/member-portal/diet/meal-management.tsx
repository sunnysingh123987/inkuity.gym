'use client';

import { useState, useEffect } from 'react';
import { MealCalendar } from './meal-calendar';
import { NutritionTracker } from './nutrition-tracker';
import { MealFormDialog } from './meal-form-dialog';
import { saveMeal, toggleMealCompletion, getMealsForDate } from '@/lib/actions/members-portal';
import { toast } from 'sonner';

interface MealManagementProps {
  planId: string;
  gymSlug: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  initialMeals: any[];
}

export function MealManagement({
  planId,
  gymSlug,
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFat,
  initialMeals,
}: MealManagementProps) {
  const [meals, setMeals] = useState(initialMeals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  // Load meals for today
  useEffect(() => {
    loadMealsForDate(currentDate);
  }, [currentDate]);

  const loadMealsForDate = async (date: string) => {
    const result = await getMealsForDate(planId, date);
    if (result.success && result.data) {
      setMeals(result.data);
    }
  };

  const handleAddMeal = (date: Date, mealType: string) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setIsDialogOpen(true);
  };

  const handleSaveMeal = async (mealData: any) => {
    if (!selectedDate) return;

    const result = await saveMeal({
      ...mealData,
      dietPlanId: planId,
      mealType: selectedMealType,
      scheduledFor: selectedDate.toISOString(),
    });

    if (result.success) {
      toast.success('Meal added successfully!');
      setIsDialogOpen(false);
      // Reload meals for the date
      await loadMealsForDate(selectedDate.toISOString().split('T')[0]);
    } else {
      toast.error(result.error || 'Failed to add meal');
    }
  };

  const handleToggleMeal = async (mealId: string) => {
    const meal = meals.find((m: any) => m.id === mealId);
    const result = await toggleMealCompletion(mealId, !meal?.completed);

    if (result.success) {
      // Update local state
      setMeals((prev) =>
        prev.map((meal: any) =>
          meal.id === mealId
            ? { ...meal, completed: !meal.completed }
            : meal
        )
      );
      toast.success(
        result.data?.completed ? 'Meal completed!' : 'Meal marked incomplete'
      );
    } else {
      toast.error(result.error || 'Failed to update meal');
    }
  };

  // Calculate today's totals
  const todayMeals = meals.filter((m: any) =>
    m.scheduled_for.startsWith(currentDate)
  );

  const consumedCalories = todayMeals
    .filter((m: any) => m.completed)
    .reduce((sum: number, m: any) => sum + (m.calories || 0), 0);

  const consumedProtein = todayMeals
    .filter((m: any) => m.completed)
    .reduce((sum: number, m: any) => sum + (m.protein || 0), 0);

  const consumedCarbs = todayMeals
    .filter((m: any) => m.completed)
    .reduce((sum: number, m: any) => sum + (m.carbs || 0), 0);

  const consumedFat = todayMeals
    .filter((m: any) => m.completed)
    .reduce((sum: number, m: any) => sum + (m.fat || 0), 0);

  return (
    <div className="space-y-6">
      {/* Nutrition Tracker */}
      <NutritionTracker
        targetCalories={targetCalories}
        targetProtein={targetProtein}
        targetCarbs={targetCarbs}
        targetFat={targetFat}
        consumedCalories={consumedCalories}
        consumedProtein={consumedProtein}
        consumedCarbs={consumedCarbs}
        consumedFat={consumedFat}
      />

      {/* Meal Calendar */}
      <MealCalendar
        meals={meals}
        onAddMeal={handleAddMeal}
        onToggleMeal={handleToggleMeal}
      />

      {/* Meal Form Dialog */}
      <MealFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveMeal}
        mealType={selectedMealType}
      />
    </div>
  );
}
