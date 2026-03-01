'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, UtensilsCrossed, Search, Minus, Pencil, Check, X } from 'lucide-react';

export interface FoodItem {
  id: string;
  name: string;
  servingSize: string;
  caloriesPerServing: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface LoggedFoodEntry {
  id: string;
  foodItemId: string;
  name: string;
  servingSize: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
}

interface FoodLogProps {
  entries: LoggedFoodEntry[];
  foodDatabase: FoodItem[];
  onAddEntry: (foodItem: FoodItem, quantity: number) => void;
  onDeleteEntry: (entryId: string) => void;
  onEditEntry: (entryId: string, updates: Partial<LoggedFoodEntry>) => void;
  onAddCustomFood: (entry: Omit<LoggedFoodEntry, 'id' | 'loggedAt'>) => void;
  onEditDatabaseFood?: (foodId: string, updates: Partial<FoodItem>) => void;
}

export function FoodLog({
  entries,
  foodDatabase,
  onAddEntry,
  onDeleteEntry,
  onEditEntry,
  onAddCustomFood,
  onEditDatabaseFood,
}: FoodLogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LoggedFoodEntry>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Database food editing state
  const [editingDbFood, setEditingDbFood] = useState<FoodItem | null>(null);
  const [dbEditForm, setDbEditForm] = useState<Partial<FoodItem>>({});

  // Custom food form state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customServing, setCustomServing] = useState('');
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);

  const filteredFoods = searchQuery.trim()
    ? foodDatabase.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : foodDatabase;

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(1);
  };

  const handleAdd = () => {
    if (!selectedFood || quantity < 1) return;
    onAddEntry(selectedFood, quantity);
    setSelectedFood(null);
    setSearchQuery('');
    setQuantity(1);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setSelectedFood(null);
    setSearchQuery('');
    setQuantity(1);
    setIsAddingCustom(false);
  };

  const startEditing = (entry: LoggedFoodEntry) => {
    setEditingId(entry.id);
    setEditForm({
      name: entry.name,
      servingSize: entry.servingSize,
      quantity: entry.quantity,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    onEditEntry(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const openDbEdit = (food: FoodItem) => {
    setEditingDbFood(food);
    setDbEditForm({ ...food });
  };

  const saveDbEdit = () => {
    if (!editingDbFood || !onEditDatabaseFood) return;
    onEditDatabaseFood(editingDbFood.id, dbEditForm);
    setEditingDbFood(null);
    setDbEditForm({});
  };

  const handleAddCustomFood = () => {
    if (!customName.trim() || !customServing.trim()) return;
    onAddCustomFood({
      foodItemId: `custom-${Date.now()}`,
      name: customName.trim(),
      servingSize: customServing.trim(),
      quantity: customQuantity,
      calories: (parseInt(customCalories) || 0) * customQuantity,
      protein: (parseInt(customProtein) || 0) * customQuantity,
      carbs: (parseInt(customCarbs) || 0) * customQuantity,
      fat: (parseInt(customFat) || 0) * customQuantity,
    });
    resetCustomForm();
  };

  const resetCustomForm = () => {
    setIsAddingCustom(false);
    setCustomName('');
    setCustomServing('');
    setCustomQuantity(1);
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
  };

  return (
    <>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <UtensilsCrossed className="h-5 w-5 text-brand-cyan-400" />
              Today&apos;s Food Log
            </CardTitle>
            <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">
              {totalCalories} cal
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Entry List */}
          {entries.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No foods logged yet. Add your first meal below.
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id}>
                  {editingId === entry.id ? (
                    /* Edit Mode */
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-brand-cyan-600/50 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-slate-400">Name</Label>
                          <Input
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Serving Size</Label>
                          <Input
                            value={editForm.servingSize || ''}
                            onChange={(e) => setEditForm({ ...editForm, servingSize: e.target.value })}
                            className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <Label className="text-xs text-slate-400">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={editForm.quantity || 1}
                            onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                            className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Calories</Label>
                          <Input
                            type="number"
                            value={editForm.calories || 0}
                            onChange={(e) => setEditForm({ ...editForm, calories: parseInt(e.target.value) || 0 })}
                            className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Protein</Label>
                          <Input
                            type="number"
                            value={editForm.protein || 0}
                            onChange={(e) => setEditForm({ ...editForm, protein: parseInt(e.target.value) || 0 })}
                            className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Carbs</Label>
                          <Input
                            type="number"
                            value={editForm.carbs || 0}
                            onChange={(e) => setEditForm({ ...editForm, carbs: parseInt(e.target.value) || 0 })}
                            className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Fat</Label>
                          <Input
                            type="number"
                            value={editForm.fat || 0}
                            onChange={(e) => setEditForm({ ...editForm, fat: parseInt(e.target.value) || 0 })}
                            className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} className="bg-brand-cyan-600 hover:bg-brand-cyan-700">
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Save
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelEdit} className="border-slate-700">
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onDeleteEntry(entry.id);
                            cancelEdit();
                          }}
                          className="border-red-700/50 text-red-400 hover:bg-red-400/10 hover:text-red-400 ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode — only pencil icon, no trash */
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {entry.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {entry.quantity} x {entry.servingSize} &middot; P:{entry.protein}g C:{entry.carbs}g F:{entry.fat}g
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <p className="text-sm font-semibold text-white whitespace-nowrap">
                          {entry.calories} cal
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(entry.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Meal — search view matching ref02 */}
          {isAdding ? (
            <div className="space-y-3">
              {/* Prominent search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-cyan-400" />
                <Input
                  ref={inputRef}
                  placeholder="Search foods..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedFood(null);
                  }}
                  className="pl-9 bg-slate-900 border-brand-cyan-600 text-white ring-brand-cyan-600/30 focus-visible:ring-brand-cyan-500"
                />
              </div>

              {/* Quantity picker when a food is selected */}
              {selectedFood && (
                <div className="p-3 rounded-lg border border-brand-cyan-600/50 bg-slate-800/50 space-y-3">
                  <p className="text-sm font-medium text-white">{selectedFood.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-8 w-8 p-0 border-slate-700"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-white font-semibold w-8 text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-8 w-8 p-0 border-slate-700"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-xs text-slate-500">
                      x {selectedFood.servingSize}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 bg-slate-900/50 rounded-md p-2">
                    <span className="text-white font-semibold">
                      {selectedFood.caloriesPerServing * quantity} cal
                    </span>
                    <span>P: {selectedFood.protein * quantity}g</span>
                    <span>C: {selectedFood.carbs * quantity}g</span>
                    <span>F: {selectedFood.fat * quantity}g</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAdd}
                      size="sm"
                      className="bg-brand-cyan-600 hover:bg-brand-cyan-700"
                    >
                      Add to Log
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFood(null)}
                      className="border-slate-700"
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}

              {/* Food database list (card style) */}
              {!selectedFood && (
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-0">
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-700/50">
                      {filteredFoods.map((food) => (
                        <div
                          key={food.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
                        >
                          <button
                            onClick={() => handleSelectFood(food)}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="text-sm font-medium text-white truncate">{food.name}</p>
                            <p className="text-xs text-slate-400">
                              {food.servingSize}. {food.caloriesPerServing} cal. P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                            </p>
                          </button>
                          {onEditDatabaseFood && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDbEdit(food);
                              }}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-brand-cyan-400 hover:bg-brand-cyan-400/10 ml-2 shrink-0"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {filteredFoods.length === 0 && searchQuery.trim() && (
                        <div className="px-4 py-6">
                          <p className="text-sm text-slate-400 text-center">No foods found</p>
                        </div>
                      )}
                    </div>

                    {/* Add Custom Item */}
                    {!isAddingCustom ? (
                      <button
                        onClick={() => setIsAddingCustom(true)}
                        className="w-full px-4 py-3 text-left border-t border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-sm">
                          <Plus className="h-4 w-4" />
                          Add Custom Item
                        </span>
                      </button>
                    ) : (
                      <div className="p-4 border-t border-dashed border-slate-600 space-y-3">
                        <p className="text-sm font-medium text-white">Add Custom Food</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-slate-400">Food Name</Label>
                            <Input
                              placeholder="e.g. Homemade Dal"
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Serving Size</Label>
                            <Input
                              placeholder="e.g. 1 bowl"
                              value={customServing}
                              onChange={(e) => setCustomServing(e.target.value)}
                              className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          <div>
                            <Label className="text-xs text-slate-400">Qty</Label>
                            <Input
                              type="number"
                              min="1"
                              value={customQuantity}
                              onChange={(e) => setCustomQuantity(parseInt(e.target.value) || 1)}
                              className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Calories</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={customCalories}
                              onChange={(e) => setCustomCalories(e.target.value)}
                              className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Protein</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={customProtein}
                              onChange={(e) => setCustomProtein(e.target.value)}
                              className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Carbs</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={customCarbs}
                              onChange={(e) => setCustomCarbs(e.target.value)}
                              className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Fat</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={customFat}
                              onChange={(e) => setCustomFat(e.target.value)}
                              className="mt-1 h-8 text-sm bg-slate-900 border-slate-700 text-white"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">
                          Enter values per serving. Total = values x quantity.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddCustomFood}
                            disabled={!customName.trim() || !customServing.trim()}
                            className="bg-brand-cyan-600 hover:bg-brand-cyan-700"
                          >
                            Add Custom Food
                          </Button>
                          <Button variant="outline" size="sm" onClick={resetCustomForm} className="border-slate-700">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Cancel button for entire add flow */}
              {!selectedFood && (
                <Button variant="outline" size="sm" onClick={handleCancel} className="border-slate-700">
                  Cancel
                </Button>
              )}
            </div>
          ) : (
            <Button
              onClick={() => {
                setIsAdding(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              variant="outline"
              className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-brand-cyan-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Meal
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Edit Database Food Dialog */}
      <Dialog open={!!editingDbFood} onOpenChange={(open) => { if (!open) setEditingDbFood(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Food Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Name</Label>
              <Input
                value={dbEditForm.name || ''}
                onChange={(e) => setDbEditForm({ ...dbEditForm, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Serving Size</Label>
              <Input
                value={dbEditForm.servingSize || ''}
                onChange={(e) => setDbEditForm({ ...dbEditForm, servingSize: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Calories</Label>
                <Input
                  type="number"
                  value={dbEditForm.caloriesPerServing || 0}
                  onChange={(e) => setDbEditForm({ ...dbEditForm, caloriesPerServing: parseInt(e.target.value) || 0 })}
                  className="h-8 text-sm bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Protein</Label>
                <Input
                  type="number"
                  value={dbEditForm.protein || 0}
                  onChange={(e) => setDbEditForm({ ...dbEditForm, protein: parseInt(e.target.value) || 0 })}
                  className="h-8 text-sm bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Carbs</Label>
                <Input
                  type="number"
                  value={dbEditForm.carbs || 0}
                  onChange={(e) => setDbEditForm({ ...dbEditForm, carbs: parseInt(e.target.value) || 0 })}
                  className="h-8 text-sm bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Fat</Label>
                <Input
                  type="number"
                  value={dbEditForm.fat || 0}
                  onChange={(e) => setDbEditForm({ ...dbEditForm, fat: parseInt(e.target.value) || 0 })}
                  className="h-8 text-sm bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDbFood(null)} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={saveDbEdit} className="bg-brand-cyan-600 hover:bg-brand-cyan-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Food Entry</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            Are you sure you want to remove this item from your food log? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteConfirmId) {
                  onDeleteEntry(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
