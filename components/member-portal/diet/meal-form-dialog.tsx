'use client';

import { useState } from 'react';
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
}

export function MealFormDialog({
  isOpen,
  onClose,
  onSave,
  mealType,
}: MealFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

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
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
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
              className="mt-1"
              autoFocus
            />
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
            <Label>Nutritional Information</Label>

            <div>
              <Label htmlFor="calories" className="text-sm text-gray-600">
                Calories
              </Label>
              <Input
                id="calories"
                type="number"
                placeholder="500"
                value={formData.calories}
                onChange={(e) =>
                  setFormData({ ...formData, calories: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="protein" className="text-sm text-gray-600">
                  Protein (g)
                </Label>
                <Input
                  id="protein"
                  type="number"
                  placeholder="30"
                  value={formData.protein}
                  onChange={(e) =>
                    setFormData({ ...formData, protein: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="carbs" className="text-sm text-gray-600">
                  Carbs (g)
                </Label>
                <Input
                  id="carbs"
                  type="number"
                  placeholder="40"
                  value={formData.carbs}
                  onChange={(e) =>
                    setFormData({ ...formData, carbs: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="fat" className="text-sm text-gray-600">
                  Fat (g)
                </Label>
                <Input
                  id="fat"
                  type="number"
                  placeholder="15"
                  value={formData.fat}
                  onChange={(e) =>
                    setFormData({ ...formData, fat: e.target.value })
                  }
                  className="mt-1"
                />
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
              Add Meal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
