'use client';

import { useState, useMemo, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Camera, MoreVertical } from 'lucide-react';
import { NutritionTracker, type NutritionTargets } from './nutrition-tracker';
import { FoodLog, type FoodItem, type LoggedFoodEntry } from './food-log';
import { CustomTrackers, type CustomTracker } from './custom-trackers';
import { MealPhotoCapture } from './meal-photo-capture';
import {
  updateDietPlanTargets,
  addFoodLogEntry,
  updateFoodLogEntry,
  deleteFoodLogEntry,
  updateFoodItem,
  createFoodItem,
  createCustomTracker,
  updateCustomTracker,
  deleteCustomTracker,
  deleteAllCustomTrackers,
  updateTrackerValue,
  resetAllTrackerValues,
} from '@/lib/actions/members-portal';

// ─── Component ───────────────────────────────────────────────────────────────

interface NutritionTrackerPageProps {
  memberId: string;
  gymId: string;
  dietPlanId: string;
  targets: NutritionTargets;
  initialFoodDatabase: FoodItem[];
  initialFoodLog: LoggedFoodEntry[];
  initialTrackers: CustomTracker[];
}

export function NutritionTrackerPage({
  memberId,
  gymId,
  dietPlanId,
  targets,
  initialFoodDatabase,
  initialFoodLog,
  initialTrackers,
}: NutritionTrackerPageProps) {
  const [foodLog, setFoodLog] = useState<LoggedFoodEntry[]>(initialFoodLog);
  const [trackers, setTrackers] = useState<CustomTracker[]>(initialTrackers);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>(initialFoodDatabase);
  const [isPending, startTransition] = useTransition();

  // Editable nutrition targets
  const [activeTargets, setActiveTargets] = useState<NutritionTargets>(targets);
  const [isTargetsDialogOpen, setIsTargetsDialogOpen] = useState(false);
  const [targetForm, setTargetForm] = useState<NutritionTargets>({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  const openTargetsDialog = () => {
    setTargetForm({ ...activeTargets });
    setIsTargetsDialogOpen(true);
  };

  const saveTargets = () => {
    const newTargets = { ...targetForm };
    setActiveTargets(newTargets);
    setIsTargetsDialogOpen(false);
    startTransition(async () => {
      await updateDietPlanTargets(dietPlanId, {
        targetCalories: newTargets.calories,
        targetProtein: newTargets.protein,
        targetCarbs: newTargets.carbs,
        targetFat: newTargets.fat,
      });
    });
  };

  const handleEditDatabaseFood = (foodId: string, updates: Partial<FoodItem>) => {
    setFoodDatabase((prev) =>
      prev.map((f) => (f.id === foodId ? { ...f, ...updates } : f))
    );
    startTransition(async () => {
      await updateFoodItem(foodId, {
        name: updates.name,
        servingSize: updates.servingSize,
        caloriesPerServing: updates.caloriesPerServing,
        protein: updates.protein,
        carbs: updates.carbs,
        fat: updates.fat,
      });
    });
  };

  // Derived: today's consumed nutrition from food log
  const todayNutrition = useMemo(
    () => ({
      calories: foodLog.reduce((s, e) => s + e.calories, 0),
      protein: foodLog.reduce((s, e) => s + e.protein, 0),
      carbs: foodLog.reduce((s, e) => s + e.carbs, 0),
      fat: foodLog.reduce((s, e) => s + e.fat, 0),
    }),
    [foodLog]
  );

  const today = new Date().toISOString().split('T')[0];

  // ─── Callbacks ─────────────────────────────────────────────────────────────

  const handleAddFoodEntry = (foodItem: FoodItem, quantity: number) => {
    const entry: LoggedFoodEntry = {
      id: `temp-${Date.now()}`,
      foodItemId: foodItem.id,
      name: foodItem.name,
      servingSize: foodItem.servingSize,
      quantity,
      calories: foodItem.caloriesPerServing * quantity,
      protein: foodItem.protein * quantity,
      carbs: foodItem.carbs * quantity,
      fat: foodItem.fat * quantity,
      loggedAt: new Date().toISOString(),
    };
    setFoodLog((prev) => [...prev, entry]);
    startTransition(async () => {
      const result = await addFoodLogEntry({
        memberId,
        gymId,
        foodItemId: foodItem.id,
        name: foodItem.name,
        servingSize: foodItem.servingSize,
        quantity,
        calories: foodItem.caloriesPerServing * quantity,
        protein: foodItem.protein * quantity,
        carbs: foodItem.carbs * quantity,
        fat: foodItem.fat * quantity,
        loggedDate: today,
      });
      if (result.success && result.data) {
        setFoodLog((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, id: result.data.id } : e))
        );
      }
    });
  };

  const handleDeleteFoodEntry = (entryId: string) => {
    setFoodLog((prev) => prev.filter((e) => e.id !== entryId));
    startTransition(async () => {
      await deleteFoodLogEntry(entryId);
    });
  };

  const handleEditFoodEntry = (entryId: string, updates: Partial<LoggedFoodEntry>) => {
    setFoodLog((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, ...updates } : e))
    );
    startTransition(async () => {
      await updateFoodLogEntry(entryId, {
        name: updates.name,
        servingSize: updates.servingSize,
        quantity: updates.quantity,
        calories: updates.calories,
        protein: updates.protein,
        carbs: updates.carbs,
        fat: updates.fat,
      });
    });
  };

  const handleAddCustomFood = (entry: Omit<LoggedFoodEntry, 'id' | 'loggedAt'>) => {
    const newEntry = { ...entry, id: `temp-${Date.now()}`, loggedAt: new Date().toISOString() };
    setFoodLog((prev) => [...prev, newEntry]);
    startTransition(async () => {
      // Create a food item in the database for reuse
      const foodResult = await createFoodItem({
        memberId,
        gymId,
        name: entry.name,
        servingSize: entry.servingSize,
        caloriesPerServing: entry.quantity > 0 ? Math.round(entry.calories / entry.quantity) : entry.calories,
        protein: entry.quantity > 0 ? Math.round(entry.protein / entry.quantity) : entry.protein,
        carbs: entry.quantity > 0 ? Math.round(entry.carbs / entry.quantity) : entry.carbs,
        fat: entry.quantity > 0 ? Math.round(entry.fat / entry.quantity) : entry.fat,
      });
      if (foodResult.success && foodResult.data) {
        const dbFood = foodResult.data;
        setFoodDatabase((prev) => [
          ...prev,
          {
            id: dbFood.id,
            name: dbFood.name,
            servingSize: dbFood.serving_size,
            caloriesPerServing: dbFood.calories_per_serving,
            protein: dbFood.protein,
            carbs: dbFood.carbs,
            fat: dbFood.fat,
          },
        ]);
      }
      // Log the entry
      const logResult = await addFoodLogEntry({
        memberId,
        gymId,
        foodItemId: foodResult.data?.id,
        name: entry.name,
        servingSize: entry.servingSize,
        quantity: entry.quantity,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        loggedDate: today,
      });
      if (logResult.success && logResult.data) {
        setFoodLog((prev) =>
          prev.map((e) => (e.id === newEntry.id ? { ...e, id: logResult.data.id } : e))
        );
      }
    });
  };

  const handleIncrementTracker = (trackerId: string) => {
    let newValue = 0;
    setTrackers((prev) =>
      prev.map((t) => {
        if (t.id === trackerId) {
          newValue = t.current + 1;
          return { ...t, current: newValue };
        }
        return t;
      })
    );
    startTransition(async () => {
      await updateTrackerValue(trackerId, memberId, newValue);
    });
  };

  const handleDecrementTracker = (trackerId: string) => {
    let newValue = 0;
    setTrackers((prev) =>
      prev.map((t) => {
        if (t.id === trackerId) {
          newValue = Math.max(0, t.current - 1);
          return { ...t, current: newValue };
        }
        return t;
      })
    );
    startTransition(async () => {
      await updateTrackerValue(trackerId, memberId, newValue);
    });
  };

  const handleAddTracker = (tracker: Omit<CustomTracker, 'id' | 'current'>) => {
    const tempTracker = { ...tracker, id: `temp-${Date.now()}`, current: 0 };
    setTrackers((prev) => [...prev, tempTracker]);
    startTransition(async () => {
      const result = await createCustomTracker({
        memberId,
        gymId,
        name: tracker.name,
        unit: tracker.unit,
        dailyTarget: tracker.dailyTarget,
        icon: tracker.icon,
        color: tracker.color,
      });
      if (result.success && result.data) {
        setTrackers((prev) =>
          prev.map((t) => (t.id === tempTracker.id ? { ...t, id: result.data.id } : t))
        );
      }
    });
  };

  const handleDeleteTracker = (trackerId: string) => {
    setTrackers((prev) => prev.filter((t) => t.id !== trackerId));
    startTransition(async () => {
      await deleteCustomTracker(trackerId);
    });
  };

  const handleEditTracker = (trackerId: string, updates: Partial<CustomTracker>) => {
    setTrackers((prev) =>
      prev.map((t) => (t.id === trackerId ? { ...t, ...updates } : t))
    );
    startTransition(async () => {
      await updateCustomTracker(trackerId, {
        name: updates.name,
        unit: updates.unit,
        dailyTarget: updates.dailyTarget,
        icon: updates.icon,
        color: updates.color,
      });
    });
  };

  const handleResetAll = () => {
    setTrackers((prev) => prev.map((t) => ({ ...t, current: 0 })));
    startTransition(async () => {
      await resetAllTrackerValues(memberId);
    });
  };

  const handleDeleteAll = () => {
    setTrackers([]);
    startTransition(async () => {
      await deleteAllCustomTrackers(memberId, gymId);
    });
  };

  const handlePhotoSave = (mealData: {
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    const entry: LoggedFoodEntry = {
      id: `temp-${Date.now()}`,
      foodItemId: 'photo',
      name: mealData.name,
      servingSize: '1 serving',
      quantity: 1,
      calories: mealData.calories,
      protein: mealData.protein,
      carbs: mealData.carbs,
      fat: mealData.fat,
      loggedAt: new Date().toISOString(),
    };
    setFoodLog((prev) => [...prev, entry]);
    setIsPhotoOpen(false);
    startTransition(async () => {
      const result = await addFoodLogEntry({
        memberId,
        gymId,
        name: mealData.name,
        servingSize: '1 serving',
        quantity: 1,
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        loggedDate: today,
      });
      if (result.success && result.data) {
        setFoodLog((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, id: result.data.id } : e))
        );
      }
    });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Section 1: Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Nutrition Tracker</h1>
          <p className="text-slate-400 mt-1">Track your daily meals and macros</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-400 hover:text-white"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
              <DropdownMenuItem
                onClick={openTargetsDialog}
                className="text-slate-300 focus:bg-slate-800 focus:text-white"
              >
                Edit Nutrition Targets
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPhotoOpen(true)}
            className="border-slate-700 text-slate-400 hover:text-white"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Section 2: Today's Nutrition Counters */}
      <NutritionTracker targets={activeTargets} consumed={todayNutrition} />

      {/* Section 4: Food Log */}
      <FoodLog
        entries={foodLog}
        foodDatabase={foodDatabase}
        onAddEntry={handleAddFoodEntry}
        onDeleteEntry={handleDeleteFoodEntry}
        onEditEntry={handleEditFoodEntry}
        onAddCustomFood={handleAddCustomFood}
        onEditDatabaseFood={handleEditDatabaseFood}
      />

      {/* Section 5: Custom Trackers */}
      <CustomTrackers
        trackers={trackers}
        onIncrement={handleIncrementTracker}
        onDecrement={handleDecrementTracker}
        onAddTracker={handleAddTracker}
        onDeleteTracker={handleDeleteTracker}
        onEditTracker={handleEditTracker}
        onResetAll={handleResetAll}
        onDeleteAll={handleDeleteAll}
      />

      {/* Photo Capture Dialog */}
      <MealPhotoCapture
        isOpen={isPhotoOpen}
        onClose={() => setIsPhotoOpen(false)}
        onSave={handlePhotoSave}
        mealType="snack"
        availableFoods={foodDatabase.map((f) => f.name)}
      />

      {/* Edit Nutrition Targets Dialog */}
      <Dialog open={isTargetsDialogOpen} onOpenChange={setIsTargetsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Nutrition Targets</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Calories</Label>
              <Input
                type="number"
                min="0"
                value={targetForm.calories}
                onChange={(e) => setTargetForm({ ...targetForm, calories: parseInt(e.target.value) || 0 })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Protein (g)</Label>
              <Input
                type="number"
                min="0"
                value={targetForm.protein}
                onChange={(e) => setTargetForm({ ...targetForm, protein: parseInt(e.target.value) || 0 })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Carbs (g)</Label>
              <Input
                type="number"
                min="0"
                value={targetForm.carbs}
                onChange={(e) => setTargetForm({ ...targetForm, carbs: parseInt(e.target.value) || 0 })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Fat (g)</Label>
              <Input
                type="number"
                min="0"
                value={targetForm.fat}
                onChange={(e) => setTargetForm({ ...targetForm, fat: parseInt(e.target.value) || 0 })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTargetsDialogOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={saveTargets} className="bg-brand-cyan-600 hover:bg-brand-cyan-700">
              Save Targets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
