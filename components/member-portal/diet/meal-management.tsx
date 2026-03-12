'use client';

import { useState, useEffect, useCallback } from 'react';
import { MealCalendar } from './meal-calendar';
import { NutritionTracker } from './nutrition-tracker';
import { MealFormDialog } from './meal-form-dialog';
import { MealAddChoice } from './meal-add-choice';
import { MealPhotoCapture } from './meal-photo-capture';
import { saveMeal, toggleMealCompletion, getMealsForWeek, checkMealExists } from '@/lib/actions/members-portal';
import { toast } from '@/components/ui/toaster';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MealManagementProps {
  planId: string;
  gymSlug: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  initialMeals: any[];
  isAiGenerated: boolean;
}

export function MealManagement({
  planId,
  gymSlug,
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFat,
  initialMeals,
  isAiGenerated,
}: MealManagementProps) {
  const [meals, setMeals] = useState(initialMeals);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  // Week start date for fetching full week data
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    return start.toISOString().split('T')[0];
  });

  // Override confirmation dialog state
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [existingMealInfo, setExistingMealInfo] = useState<{ name: string; calories: number } | null>(null);
  const [pendingMealData, setPendingMealData] = useState<any>(null);
  const [pendingMealSource, setPendingMealSource] = useState<'manual' | 'photo'>('manual');

  // Edit meal state
  const [editingMealData, setEditingMealData] = useState<{
    name: string;
    description?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);

  const loadMealsForWeek = useCallback(async (startDate: string) => {
    const result = await getMealsForWeek(planId, startDate);
    if (result.success && result.data) {
      setMeals(result.data);
    }
  }, [planId]);

  // Load meals when week changes
  useEffect(() => {
    loadMealsForWeek(weekStartDate);
  }, [weekStartDate, loadMealsForWeek]);

  const handleWeekChange = (newWeekStartDate: Date) => {
    setWeekStartDate(newWeekStartDate.toISOString().split('T')[0]);
  };

  const handleAddMeal = (date: Date, mealType: string) => {
    setSelectedDate(date);
    setSelectedMealType(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack');
    setIsChoiceOpen(true);
  };

  const handleSelectPhoto = () => {
    setIsChoiceOpen(false);
    setIsPhotoOpen(true);
  };

  const handleSelectManual = () => {
    setIsChoiceOpen(false);
    setIsDialogOpen(true);
  };

  const executeSaveMeal = async (mealData: any, source: 'manual' | 'photo') => {
    const result = await saveMeal({
      ...mealData,
      dietPlanId: planId,
      mealType: selectedMealType,
      scheduledFor: selectedDate!.toISOString(),
    });

    if (result.success) {
      toast.success(source === 'photo' ? 'Meal added from photo!' : 'Meal added successfully!');
      if (source === 'photo') {
        setIsPhotoOpen(false);
      } else {
        setIsDialogOpen(false);
      }
      await loadMealsForWeek(weekStartDate);
    } else {
      toast.error(result.error || 'Failed to add meal');
    }
  };

  const handleSaveMealWithCheck = async (mealData: any, source: 'manual' | 'photo') => {
    if (!selectedDate) return;

    const scheduledDate = selectedDate.toISOString().split('T')[0];
    const existing = await checkMealExists(planId, scheduledDate, selectedMealType);

    if (existing.exists && existing.meal) {
      setPendingMealData(mealData);
      setPendingMealSource(source);
      setExistingMealInfo({ name: existing.meal.name, calories: existing.meal.calories });
      setIsOverrideDialogOpen(true);
    } else {
      await executeSaveMeal(mealData, source);
    }
  };

  const handleConfirmOverride = async () => {
    setIsOverrideDialogOpen(false);
    if (pendingMealData) {
      await executeSaveMeal(pendingMealData, pendingMealSource);
    }
    setPendingMealData(null);
    setExistingMealInfo(null);
  };

  const handleCancelOverride = () => {
    setIsOverrideDialogOpen(false);
    setPendingMealData(null);
    setExistingMealInfo(null);
  };

  const handleSaveMeal = async (mealData: any) => {
    await handleSaveMealWithCheck(mealData, 'manual');
  };

  const handlePhotoSave = async (mealData: {
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    await handleSaveMealWithCheck(mealData, 'photo');
  };

  const handleToggleMeal = async (mealId: string) => {
    const meal = meals.find((m: any) => m.id === mealId);
    if (!meal) return;

    // Only allow toggling completion for today's meals
    const todayStr = new Date().toISOString().split('T')[0];
    if (!meal.scheduled_for.startsWith(todayStr)) {
      toast.error('You can only mark meals as complete for today');
      return;
    }

    const result = await toggleMealCompletion(mealId, !meal.completed);

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

  const handleEditMeal = (meal: any) => {
    setSelectedDate(new Date(meal.scheduled_for));
    setSelectedMealType(meal.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack');
    setEditingMealData({
      name: meal.name,
      description: meal.description || '',
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    });
    setIsDialogOpen(true);
  };

  const handleEditSave = async (mealData: any) => {
    if (!selectedDate) return;

    const result = await saveMeal({
      ...mealData,
      dietPlanId: planId,
      mealType: selectedMealType,
      scheduledFor: selectedDate.toISOString(),
    });

    if (result.success) {
      toast.success('Meal updated successfully!');
      setIsDialogOpen(false);
      setEditingMealData(null);
      await loadMealsForWeek(weekStartDate);
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
        targets={{
          calories: targetCalories,
          protein: targetProtein,
          carbs: targetCarbs,
          fat: targetFat,
        }}
        consumed={{
          calories: consumedCalories,
          protein: consumedProtein,
          carbs: consumedCarbs,
          fat: consumedFat,
        }}
      />

      {/* Meal Calendar */}
      <MealCalendar
        meals={meals}
        onAddMeal={handleAddMeal}
        onToggleMeal={handleToggleMeal}
        onEditMeal={handleEditMeal}
        isAiGenerated={isAiGenerated}
        onWeekChange={handleWeekChange}
      />

      {/* Meal Add Choice Dialog */}
      <MealAddChoice
        isOpen={isChoiceOpen}
        onClose={() => setIsChoiceOpen(false)}
        onSelectPhoto={handleSelectPhoto}
        onSelectManual={handleSelectManual}
        mealType={selectedMealType}
      />

      {/* Manual Meal Form Dialog */}
      <MealFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingMealData(null);
        }}
        onSave={editingMealData ? handleEditSave : handleSaveMeal}
        mealType={selectedMealType}
        initialData={editingMealData}
      />

      {/* Photo Meal Capture Dialog */}
      <MealPhotoCapture
        isOpen={isPhotoOpen}
        onClose={() => setIsPhotoOpen(false)}
        onSave={handlePhotoSave}
        mealType={selectedMealType}
      />

      {/* Override Confirmation Dialog */}
      <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
        <DialogContent className="glass-modal">
          <DialogHeader>
            <DialogTitle className="text-white">Replace Existing Meal?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This slot already has a meal:{' '}
              <span className="font-semibold text-white">
                {existingMealInfo?.name}
              </span>{' '}
              ({existingMealInfo?.calories} cal). Do you want to replace it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelOverride}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmOverride}
            >
              Replace Meal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
