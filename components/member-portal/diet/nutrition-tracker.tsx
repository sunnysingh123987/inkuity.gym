'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Target } from 'lucide-react';

interface NutritionTrackerProps {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
}

export function NutritionTracker({
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFat,
  consumedCalories,
  consumedProtein,
  consumedCarbs,
  consumedFat,
}: NutritionTrackerProps) {
  const calculatePercentage = (consumed: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((consumed / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return 'bg-green-600';
    if (percentage >= 80 && percentage < 90) return 'bg-yellow-600';
    if (percentage > 110) return 'bg-red-600';
    return 'bg-indigo-600';
  };

  const caloriesPercentage = calculatePercentage(
    consumedCalories,
    targetCalories
  );
  const proteinPercentage = calculatePercentage(consumedProtein, targetProtein);
  const carbsPercentage = calculatePercentage(consumedCarbs, targetCarbs);
  const fatPercentage = calculatePercentage(consumedFat, targetFat);

  const remainingCalories = targetCalories - consumedCalories;
  const remainingProtein = targetProtein - consumedProtein;
  const remainingCarbs = targetCarbs - consumedCarbs;
  const remainingFat = targetFat - consumedFat;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600" />
          Today's Nutrition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calories */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-600" />
              <span className="font-semibold">Calories</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-lg">{consumedCalories}</span>
              <span className="text-gray-600"> / {targetCalories}</span>
            </div>
          </div>
          <Progress
            value={caloriesPercentage}
            className="h-3"
            indicatorClassName={getProgressColor(caloriesPercentage)}
          />
          <p className="text-sm text-gray-600">
            {remainingCalories > 0 ? (
              <span>
                {remainingCalories} calories remaining
              </span>
            ) : (
              <span className="text-red-600">
                {Math.abs(remainingCalories)} calories over
              </span>
            )}
          </p>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Protein */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-600">Protein</span>
              <span className="text-sm font-semibold">
                {consumedProtein}g / {targetProtein}g
              </span>
            </div>
            <Progress
              value={proteinPercentage}
              className="h-2"
              indicatorClassName={getProgressColor(proteinPercentage)}
            />
            <p className="text-xs text-gray-600">
              {remainingProtein > 0 ? (
                <span>{remainingProtein}g left</span>
              ) : (
                <span className="text-red-600">
                  {Math.abs(remainingProtein)}g over
                </span>
              )}
            </p>
          </div>

          {/* Carbs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-600">Carbs</span>
              <span className="text-sm font-semibold">
                {consumedCarbs}g / {targetCarbs}g
              </span>
            </div>
            <Progress
              value={carbsPercentage}
              className="h-2"
              indicatorClassName={getProgressColor(carbsPercentage)}
            />
            <p className="text-xs text-gray-600">
              {remainingCarbs > 0 ? (
                <span>{remainingCarbs}g left</span>
              ) : (
                <span className="text-red-600">
                  {Math.abs(remainingCarbs)}g over
                </span>
              )}
            </p>
          </div>

          {/* Fat */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-600">Fat</span>
              <span className="text-sm font-semibold">
                {consumedFat}g / {targetFat}g
              </span>
            </div>
            <Progress
              value={fatPercentage}
              className="h-2"
              indicatorClassName={getProgressColor(fatPercentage)}
            />
            <p className="text-xs text-gray-600">
              {remainingFat > 0 ? (
                <span>{remainingFat}g left</span>
              ) : (
                <span className="text-red-600">
                  {Math.abs(remainingFat)}g over
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Summary Message */}
        <div className="pt-4 border-t">
          {caloriesPercentage >= 90 && caloriesPercentage <= 110 ? (
            <p className="text-sm text-green-600 font-medium text-center">
              ✓ You're right on track with your nutrition goals!
            </p>
          ) : caloriesPercentage < 90 ? (
            <p className="text-sm text-gray-600 text-center">
              Keep going! You have room for more nutritious meals.
            </p>
          ) : (
            <p className="text-sm text-orange-600 text-center">
              You've exceeded your calorie target for today.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
