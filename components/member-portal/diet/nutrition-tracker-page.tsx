'use client';

import { useState, useMemo, useTransition, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Check, X, Info } from 'lucide-react';
import { NutritionTracker, type NutritionTargets } from './nutrition-tracker';
import { FoodLog, type FoodItem, type LoggedFoodEntry } from './food-log';
import { CustomTrackers, type CustomTracker } from './custom-trackers';
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

// ─── Scroll Picker ───────────────────────────────────────────────────────────

const ITEM_HEIGHT = 28;
const VISIBLE_ITEMS = 3;

function ScrollPicker<T extends string | number>({
  values,
  value,
  onChange,
  label,
  suffix,
  displayValues,
}: {
  values: T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  suffix?: string;
  displayValues?: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const scrollToValue = useCallback(
    (v: T, smooth = false) => {
      const idx = values.indexOf(v);
      if (idx === -1 || !containerRef.current) return;
      containerRef.current.scrollTo({
        top: idx * ITEM_HEIGHT,
        behavior: smooth ? 'smooth' : 'auto',
      });
    },
    [values]
  );

  // Initial scroll on mount
  useEffect(() => {
    scrollToValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    isScrollingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const idx = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIdx = Math.max(0, Math.min(values.length - 1, idx));
      // Snap
      containerRef.current.scrollTo({
        top: clampedIdx * ITEM_HEIGHT,
        behavior: 'smooth',
      });
      onChange(values[clampedIdx]);
      isScrollingRef.current = false;
    }, 80);
  };

  return (
    <div className="flex-1 flex flex-col items-center">
      <span className="text-[11px] text-slate-500 mb-1.5">{label}</span>
      <div className="relative w-full" style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
        {/* Selection highlight */}
        <div
          className="absolute left-0 right-0 border-y border-brand-cyan-500/30 bg-brand-cyan-500/5 rounded pointer-events-none z-10"
          style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
        />
        {/* Fade masks */}
        <div className="absolute inset-x-0 top-0 h-7 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none z-20" />
        <div className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-20" />
        {/* Scroll container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto no-scrollbar"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {/* Top padding */}
          <div style={{ height: ITEM_HEIGHT }} />
          {values.map((v, i) => {
            const isSelected = v === value;
            const display = displayValues ? displayValues[i] : String(v);
            return (
              <div
                key={String(v)}
                className={`flex items-center justify-center transition-colors ${
                  isSelected ? 'text-white font-bold text-sm' : 'text-slate-600 text-xs'
                }`}
                style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'center' }}
              >
                {display}{suffix ? <span className="text-slate-600 text-xs ml-1">{suffix}</span> : null}
              </div>
            );
          })}
          {/* Bottom padding */}
          <div style={{ height: ITEM_HEIGHT }} />
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface NutritionTrackerPageProps {
  memberId: string;
  gymId: string;
  dietPlanId: string;
  targets: NutritionTargets;
  initialFoodDatabase: FoodItem[];
  initialFoodLog: LoggedFoodEntry[];
  initialTrackers: CustomTracker[];
  memberWeightKg?: number | null;
  memberHeightFeet?: number | null;
  memberHeightInches?: number | null;
  memberGender?: string | null;
}

export function NutritionTrackerPage({
  memberId,
  gymId,
  dietPlanId,
  targets,
  initialFoodDatabase,
  initialFoodLog,
  initialTrackers,
  memberWeightKg,
  memberHeightFeet,
  memberHeightInches,
  memberGender,
}: NutritionTrackerPageProps) {
  const [foodLog, setFoodLog] = useState<LoggedFoodEntry[]>(initialFoodLog);
  const [trackers, setTrackers] = useState<CustomTracker[]>(initialTrackers);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>(initialFoodDatabase);
  const [isPending, startTransition] = useTransition();

  // Editable nutrition targets
  const [activeTargets, setActiveTargets] = useState<NutritionTargets>(targets);
  const [targetsSheetOpen, setTargetsSheetOpen] = useState(false);
  const [targetsSheetVisible, setTargetsSheetVisible] = useState(false);
  const [targetForm, setTargetForm] = useState<NutritionTargets>({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  // BMR calculator fields
  const [bmrWeight, setBmrWeight] = useState<number>(memberWeightKg || 70);
  const [bmrAge, setBmrAge] = useState<number>(25);
  const [bmrGender, setBmrGender] = useState<string>(memberGender || 'male');

  // Combined height value as index into height options (e.g. "5'7\"")
  const heightOptions = useMemo(() => {
    const opts: { value: number; ft: number; inches: number; label: string }[] = [];
    for (let ft = 4; ft <= 7; ft++) {
      const maxIn = ft === 7 ? 0 : 11;
      for (let inc = 0; inc <= maxIn; inc++) {
        opts.push({ value: opts.length, ft, inches: inc, label: `${ft}'${inc}"` });
      }
    }
    return opts;
  }, []);

  const initialHeightIdx = heightOptions.findIndex(
    (h) => h.ft === (memberHeightFeet || 5) && h.inches === (memberHeightInches || 7)
  );
  const [bmrHeightIdx, setBmrHeightIdx] = useState<number>(initialHeightIdx >= 0 ? initialHeightIdx : 19);
  const bmrHeightFt = heightOptions[bmrHeightIdx]?.ft ?? 5;
  const bmrHeightIn = heightOptions[bmrHeightIdx]?.inches ?? 7;

  useEffect(() => {
    if (targetsSheetOpen) {
      requestAnimationFrame(() => setTargetsSheetVisible(true));
    } else {
      setTargetsSheetVisible(false);
    }
  }, [targetsSheetOpen]);

  const openTargetsSheet = () => {
    setTargetForm({ ...activeTargets });
    setTargetsSheetOpen(true);
  };

  const closeTargetsSheet = () => {
    setTargetsSheetOpen(false);
  };

  const computedCalories = targetForm.protein * 4 + targetForm.carbs * 4 + targetForm.fat * 9;

  // Mifflin-St Jeor BMR: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - (male: -5, female: +161 subtracted)
  const bmrHeightCm = bmrHeightFt * 30.48 + bmrHeightIn * 2.54;
  const bmr = Math.round(
    10 * bmrWeight + 6.25 * bmrHeightCm - 5 * bmrAge + (bmrGender === 'male' ? 5 : -161)
  );
  // Maintenance = BMR * 1.55 (moderate activity)
  const maintenanceCalories = Math.round(bmr * 1.55);

  const saveTargets = () => {
    const newTargets = { ...targetForm, calories: computedCalories };
    setActiveTargets(newTargets);
    closeTargetsSheet();
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

  const handleAddCustomFood = (food: Omit<FoodItem, 'id'>) => {
    // Optimistically add to local food database list
    const tempId = `temp-${Date.now()}`;
    setFoodDatabase((prev) => [...prev, { ...food, id: tempId }]);
    startTransition(async () => {
      const foodResult = await createFoodItem({
        memberId,
        gymId,
        name: food.name,
        servingSize: food.servingSize,
        caloriesPerServing: food.caloriesPerServing,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      });
      if (foodResult.success && foodResult.data) {
        const dbFood = foodResult.data;
        setFoodDatabase((prev) =>
          prev.map((f) =>
            f.id === tempId
              ? {
                  id: dbFood.id,
                  name: dbFood.name,
                  servingSize: dbFood.serving_size,
                  caloriesPerServing: dbFood.calories_per_serving,
                  protein: dbFood.protein,
                  carbs: dbFood.carbs,
                  fat: dbFood.fat,
                }
              : f
          )
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
          <Button
            variant="outline"
            size="sm"
            onClick={openTargetsSheet}
            className="border-slate-700 text-slate-400 hover:text-white"
          >
            <Pencil className="h-4 w-4" />
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

      {/* Section 6: How Does This Work */}
      <div className="rounded-xl glass p-5 space-y-4">
        <h3 className="text-base font-semibold text-white">How does this work?</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-cyan-600/15 text-brand-cyan-400 text-xs font-bold shrink-0 mt-0.5">1</div>
            <div>
              <p className="text-sm font-medium text-white">Set your nutrition targets</p>
              <p className="text-xs text-slate-400 mt-0.5">Tap the edit icon on the nutrition rings to set your daily calorie, protein, carbs, and fat goals.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-cyan-600/15 text-brand-cyan-400 text-xs font-bold shrink-0 mt-0.5">2</div>
            <div>
              <p className="text-sm font-medium text-white">Log your meals</p>
              <p className="text-xs text-slate-400 mt-0.5">Tap &quot;Add Meal&quot; to search from the food database or add a custom food item with its nutritional values.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-cyan-600/15 text-brand-cyan-400 text-xs font-bold shrink-0 mt-0.5">3</div>
            <div>
              <p className="text-sm font-medium text-white">Track your progress</p>
              <p className="text-xs text-slate-400 mt-0.5">The nutrition rings update in real-time as you log food. Tap any logged entry to edit or delete it.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-cyan-600/15 text-brand-cyan-400 text-xs font-bold shrink-0 mt-0.5">4</div>
            <div>
              <p className="text-sm font-medium text-white">Use custom trackers</p>
              <p className="text-xs text-slate-400 mt-0.5">Add custom trackers for water intake, supplements, or anything else you want to monitor daily.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Nutrition Targets Bottom Sheet */}
      {(targetsSheetOpen || targetsSheetVisible) && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            onClick={closeTargetsSheet}
            className={`absolute inset-0 glass-backdrop transition-opacity duration-300 ${
              targetsSheetVisible ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Sheet */}
          <div
            className={`absolute bottom-0 left-0 right-0 glass-sheet rounded-t-2xl transition-transform duration-300 ease-out ${
              targetsSheetVisible ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{ maxHeight: '85vh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header with close (X) and save (tick) */}
            <div className="flex items-center justify-between px-4 pb-3">
              <button
                type="button"
                onClick={closeTargetsSheet}
                className="p-2 rounded-lg glass-hover transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
              <h2 className="text-lg font-bold text-white">Nutrition Targets</h2>
              <button
                type="button"
                onClick={saveTargets}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors"
              >
                <Check className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Scrollable content */}
            <div
              className="overflow-y-auto px-4 pb-8 overscroll-contain space-y-5"
              style={{ maxHeight: 'calc(85vh - 80px)' }}
            >
              {/* BMR Calculator */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label className="text-slate-300 text-sm font-semibold">Calculate your BMR</Label>
                  <div className="group relative">
                    <Info className="h-3.5 w-3.5 text-slate-500" />
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-56 p-2 glass rounded-lg text-xs text-slate-300 z-10">
                      BMR (Basal Metabolic Rate) is the calories your body burns at rest. Calculated using the Mifflin-St Jeor equation.
                    </div>
                  </div>
                </div>

                {/* Scroll pickers row — 4 equal columns */}
                <div className="flex glass rounded-xl px-1 py-2">
                  <ScrollPicker label="Weight" suffix="kg" values={Array.from({ length: 171 }, (_, i) => 30 + i)} value={bmrWeight} onChange={setBmrWeight} />
                  <div className="w-px bg-white/[0.06] self-stretch" />
                  <ScrollPicker label="Age" suffix="yr" values={Array.from({ length: 66 }, (_, i) => 15 + i)} value={bmrAge} onChange={setBmrAge} />
                  <div className="w-px bg-white/[0.06] self-stretch" />
                  <ScrollPicker
                    label="Height"
                    values={heightOptions.map((h) => h.value)}
                    value={bmrHeightIdx}
                    onChange={setBmrHeightIdx}
                    displayValues={heightOptions.map((h) => h.label)}
                  />
                  <div className="w-px bg-white/[0.06] self-stretch" />
                  <ScrollPicker
                    label="Gender"
                    values={['male', 'female'] as string[]}
                    value={bmrGender}
                    onChange={setBmrGender}
                    displayValues={['Male', 'Female']}
                  />
                </div>

                {/* BMR & Maintenance results */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <span className="text-[11px] text-slate-500">BMR</span>
                      <div className="group relative">
                        <Info className="h-3 w-3 text-slate-600" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-44 p-2 glass rounded-lg text-xs text-slate-300 z-10">
                          Calories burned at complete rest
                        </div>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-white">{bmr}</span>
                    <span className="text-xs text-slate-500 ml-0.5">cal</span>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <span className="text-[11px] text-amber-400/80">Maintenance</span>
                      <div className="group relative">
                        <Info className="h-3 w-3 text-amber-500/50" />
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 glass rounded-lg text-xs text-slate-300 z-10">
                          BMR x 1.55 (moderate activity). Eat below to cut, above to bulk.
                        </div>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-amber-400">{maintenanceCalories}</span>
                    <span className="text-xs text-amber-500/60 ml-0.5">cal</span>
                  </div>
                </div>
              </div>

              {/* Macro targets */}
              <div className="space-y-3">
                <Label className="text-slate-300 text-sm font-semibold">Daily Macro Targets</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full bg-blue-400 flex-shrink-0" />
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 mb-1 block">Protein (g)</label>
                      <Input
                        type="number"
                        min="0"
                        value={targetForm.protein}
                        onChange={(e) => setTargetForm({ ...targetForm, protein: parseInt(e.target.value) || 0 })}
                        className="glass-input text-white h-10"
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-14 text-right flex-shrink-0">{targetForm.protein * 4} cal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full bg-yellow-400 flex-shrink-0" />
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 mb-1 block">Carbs (g)</label>
                      <Input
                        type="number"
                        min="0"
                        value={targetForm.carbs}
                        onChange={(e) => setTargetForm({ ...targetForm, carbs: parseInt(e.target.value) || 0 })}
                        className="glass-input text-white h-10"
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-14 text-right flex-shrink-0">{targetForm.carbs * 4} cal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 mb-1 block">Fat (g)</label>
                      <Input
                        type="number"
                        min="0"
                        value={targetForm.fat}
                        onChange={(e) => setTargetForm({ ...targetForm, fat: parseInt(e.target.value) || 0 })}
                        className="glass-input text-white h-10"
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-14 text-right flex-shrink-0">{targetForm.fat * 9} cal</span>
                  </div>
                </div>
              </div>

              {/* Total Daily Calories metric */}
              <div className="glass rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="text-sm text-slate-400 font-medium">Total Daily Calories</span>
                  <span className="text-[10px] text-slate-600">(P x 4 + C x 4 + F x 9)</span>
                </div>
                <span className="text-3xl font-bold text-white">{computedCalories}</span>
                <span className="text-lg text-slate-500 ml-1">cal</span>
              </div>

              {/* Instructions */}
              <div className="glass rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400">How to set your targets</p>
                <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                  <li><span className="text-blue-400">Protein:</span> 1.6 - 2.2g per kg of body weight for muscle building</li>
                  <li><span className="text-yellow-400">Carbs:</span> 3 - 5g per kg for moderate activity, more if training hard</li>
                  <li><span className="text-emerald-400">Fat:</span> 0.8 - 1.2g per kg to support hormones and health</li>
                  <li>To <span className="text-brand-cyan-400">lose weight</span>, set total calories 300-500 below maintenance</li>
                  <li>To <span className="text-brand-cyan-400">gain weight</span>, set total calories 200-400 above maintenance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
