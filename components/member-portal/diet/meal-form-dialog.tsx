'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MealFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mealData: any) => void;
  mealType: string;
  initialData?: {
    name: string;
    description?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
}

export function MealFormDialog({
  isOpen,
  onClose,
  onSave,
  mealType,
  initialData,
}: MealFormDialogProps) {
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [isCalorieOverridden, setIsCalorieOverridden] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill form when initialData changes (edit mode)
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        calories: String(initialData.calories || ''),
        protein: String(initialData.protein || ''),
        carbs: String(initialData.carbs || ''),
        fat: String(initialData.fat || ''),
      });
      setIsCalorieOverridden(true);
    }
  }, [initialData, isOpen]);

  // Auto-calculate calories from macros
  useEffect(() => {
    if (!isCalorieOverridden) {
      const protein = parseInt(formData.protein) || 0;
      const carbs = parseInt(formData.carbs) || 0;
      const fat = parseInt(formData.fat) || 0;
      const calculated = protein * 4 + carbs * 4 + fat * 9;
      if (protein || carbs || fat) {
        setFormData((prev) => ({ ...prev, calories: String(calculated) }));
      }
    }
  }, [formData.protein, formData.carbs, formData.fat, isCalorieOverridden]);

  const handleCalorieChange = (value: string) => {
    if (value === '') {
      setIsCalorieOverridden(false);
      setFormData((prev) => ({ ...prev, calories: '' }));
    } else {
      setIsCalorieOverridden(true);
      setFormData((prev) => ({ ...prev, calories: value }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Required';
    if (!formData.calories || parseInt(formData.calories) <= 0)
      newErrors.calories = 'Required';
    if (!formData.protein || parseInt(formData.protein) < 0)
      newErrors.protein = 'Required';
    if (!formData.carbs || parseInt(formData.carbs) < 0)
      newErrors.carbs = 'Required';
    if (!formData.fat || parseInt(formData.fat) < 0)
      newErrors.fat = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSave({
      name: formData.name,
      description: formData.description || null,
      calories: parseInt(formData.calories) || 0,
      protein: parseInt(formData.protein) || 0,
      carbs: parseInt(formData.carbs) || 0,
      fat: parseInt(formData.fat) || 0,
    });

    // Reset form
    setFormData({
      name: '',
      description: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
    });
    setIsCalorieOverridden(false);
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
    });
    setIsCalorieOverridden(false);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit' : 'Add'} {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="mealName">Meal Name *</Label>
            <Input
              id="mealName"
              placeholder="e.g., Grilled Chicken Salad"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
              autoFocus
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Meal ingredients or notes..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Nutritional Information *</Label>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="calories" className="text-sm text-slate-400">
                  Calories *
                </Label>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    isCalorieOverridden
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-brand-cyan-500/20 text-brand-cyan-400'
                  }`}
                >
                  {isCalorieOverridden ? 'custom' : 'auto-calculated'}
                </span>
              </div>
              <Input
                id="calories"
                type="number"
                placeholder="500"
                value={formData.calories}
                onChange={(e) => handleCalorieChange(e.target.value)}
                className={`mt-1 ${errors.calories ? 'border-red-500' : ''}`}
              />
              {errors.calories && (
                <p className="text-red-400 text-xs mt-1">{errors.calories}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="protein" className="text-sm text-slate-400">
                  Protein (g) *
                </Label>
                <Input
                  id="protein"
                  type="number"
                  placeholder="30"
                  value={formData.protein}
                  onChange={(e) =>
                    setFormData({ ...formData, protein: e.target.value })
                  }
                  className={`mt-1 ${errors.protein ? 'border-red-500' : ''}`}
                />
                {errors.protein && (
                  <p className="text-red-400 text-xs mt-1">{errors.protein}</p>
                )}
              </div>

              <div>
                <Label htmlFor="carbs" className="text-sm text-slate-400">
                  Carbs (g) *
                </Label>
                <Input
                  id="carbs"
                  type="number"
                  placeholder="40"
                  value={formData.carbs}
                  onChange={(e) =>
                    setFormData({ ...formData, carbs: e.target.value })
                  }
                  className={`mt-1 ${errors.carbs ? 'border-red-500' : ''}`}
                />
                {errors.carbs && (
                  <p className="text-red-400 text-xs mt-1">{errors.carbs}</p>
                )}
              </div>

              <div>
                <Label htmlFor="fat" className="text-sm text-slate-400">
                  Fat (g) *
                </Label>
                <Input
                  id="fat"
                  type="number"
                  placeholder="15"
                  value={formData.fat}
                  onChange={(e) =>
                    setFormData({ ...formData, fat: e.target.value })
                  }
                  className={`mt-1 ${errors.fat ? 'border-red-500' : ''}`}
                />
                {errors.fat && (
                  <p className="text-red-400 text-xs mt-1">{errors.fat}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {isEditMode ? 'Update Meal' : 'Add Meal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
