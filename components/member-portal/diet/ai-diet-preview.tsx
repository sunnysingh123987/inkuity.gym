'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Target, Save, Trash2 } from 'lucide-react';

interface DayPlan {
  day: number;
  meals: {
    meal_type: string;
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
}

interface AiDietPreviewProps {
  plan: {
    name: string;
    description: string;
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
    days: DayPlan[];
  };
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
}

const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: 'text-orange-400',
  lunch: 'text-blue-400',
  dinner: 'text-purple-400',
  snack: 'text-emerald-400',
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AiDietPreview({
  plan,
  onSave,
  onDiscard,
  saving,
}: AiDietPreviewProps) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white">{plan.name}</h2>
        <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
      </div>

      {/* Daily Targets Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Flame className="h-5 w-5 text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{plan.dailyCalories}</p>
            <p className="text-xs text-slate-400">Calories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Target className="h-5 w-5 text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{plan.dailyProtein}g</p>
            <p className="text-xs text-slate-400">Protein</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Target className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{plan.dailyCarbs}g</p>
            <p className="text-xs text-slate-400">Carbs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Target className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{plan.dailyFat}g</p>
            <p className="text-xs text-slate-400">Fat</p>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Overview */}
      <div>
        <h3 className="font-semibold text-white mb-3">7-Day Meal Plan</h3>
        <div className="space-y-3">
          {plan.days.map((day) => (
            <Card key={day.day}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-brand-cyan-400">
                    Day {day.day}
                    {day.day <= 7 && ` (${DAY_LABELS[day.day - 1]})`}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {day.meals.map((meal, i) => (
                    <div
                      key={i}
                      className="glass rounded p-2 text-sm"
                    >
                      <p className={`text-xs font-semibold uppercase ${MEAL_TYPE_COLORS[meal.meal_type] || 'text-slate-400'}`}>
                        {meal.meal_type}
                      </p>
                      <p className="text-white font-medium mt-0.5">
                        {meal.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {meal.calories} cal | P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
        <Button variant="outline" onClick={onDiscard} className="flex-1">
          <Trash2 className="h-4 w-4 mr-2" />
          Discard
        </Button>
        <Button onClick={onSave} disabled={saving} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Plan'}
        </Button>
      </div>
    </div>
  );
}
