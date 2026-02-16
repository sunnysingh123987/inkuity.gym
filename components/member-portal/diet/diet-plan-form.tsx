'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createDietPlan } from '@/lib/actions/members-portal';
import { toast } from 'sonner';

interface DietPlanFormProps {
  gymSlug: string;
  memberId: string;
  gymId: string;
  planId?: string;
}

export function DietPlanForm({
  gymSlug,
  memberId,
  gymId,
  planId,
}: DietPlanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetCalories: '',
    targetProtein: '',
    targetCarbs: '',
    targetFat: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a plan name');
      return;
    }

    if (
      !formData.targetCalories ||
      !formData.targetProtein ||
      !formData.targetCarbs ||
      !formData.targetFat
    ) {
      toast.error('Please fill in all macro targets');
      return;
    }

    setLoading(true);

    const result = await createDietPlan({
      memberId,
      gymId,
      name: formData.name,
      description: formData.description || null,
      targetCalories: parseInt(formData.targetCalories),
      targetProtein: parseInt(formData.targetProtein),
      targetCarbs: parseInt(formData.targetCarbs),
      targetFat: parseInt(formData.targetFat),
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      isActive: formData.isActive,
    });

    if (result.success) {
      toast.success('Diet plan created successfully!');
      router.push(`/${gymSlug}/portal/diet`);
    } else {
      toast.error(result.error || 'Failed to create diet plan');
      setLoading(false);
    }
  };

  // Calculate macro percentages
  const totalCalories = parseInt(formData.targetCalories) || 0;
  const proteinCals = (parseInt(formData.targetProtein) || 0) * 4;
  const carbsCals = (parseInt(formData.targetCarbs) || 0) * 4;
  const fatCals = (parseInt(formData.targetFat) || 0) * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals;

  const proteinPercentage =
    totalCalories > 0 ? Math.round((proteinCals / totalCalories) * 100) : 0;
  const carbsPercentage =
    totalCalories > 0 ? Math.round((carbsCals / totalCalories) * 100) : 0;
  const fatPercentage =
    totalCalories > 0 ? Math.round((fatCals / totalCalories) * 100) : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Plan Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Cutting Phase, Lean Bulk"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your diet plan goals..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      {/* Macro Targets */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Macro Targets</h3>

        <div>
          <Label htmlFor="calories">Daily Calories *</Label>
          <Input
            id="calories"
            type="number"
            placeholder="2000"
            value={formData.targetCalories}
            onChange={(e) =>
              setFormData({ ...formData, targetCalories: e.target.value })
            }
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="protein">Protein (g) *</Label>
            <Input
              id="protein"
              type="number"
              placeholder="150"
              value={formData.targetProtein}
              onChange={(e) =>
                setFormData({ ...formData, targetProtein: e.target.value })
              }
              className="mt-1"
            />
            {proteinPercentage > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {proteinPercentage}% of calories
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="carbs">Carbs (g) *</Label>
            <Input
              id="carbs"
              type="number"
              placeholder="200"
              value={formData.targetCarbs}
              onChange={(e) =>
                setFormData({ ...formData, targetCarbs: e.target.value })
              }
              className="mt-1"
            />
            {carbsPercentage > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {carbsPercentage}% of calories
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="fat">Fat (g) *</Label>
            <Input
              id="fat"
              type="number"
              placeholder="60"
              value={formData.targetFat}
              onChange={(e) =>
                setFormData({ ...formData, targetFat: e.target.value })
              }
              className="mt-1"
            />
            {fatPercentage > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {fatPercentage}% of calories
              </p>
            )}
          </div>
        </div>

        {/* Macro Summary */}
        {totalMacroCals > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-700">
              Total from macros:{' '}
              <span className="font-semibold">{totalMacroCals} calories</span>
            </p>
            {Math.abs(totalCalories - totalMacroCals) > 50 && (
              <p className="text-orange-600 text-xs mt-1">
                ⚠ Macro calories don't match your target calories
              </p>
            )}
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Duration</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="active" className="font-semibold">
            Set as Active Plan
          </Label>
          <p className="text-sm text-gray-600 mt-1">
            Your active plan will be used for daily nutrition tracking
          </p>
        </div>
        <Switch
          id="active"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : planId ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
}
