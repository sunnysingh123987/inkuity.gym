'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  onAddCustomFood: (food: Omit<FoodItem, 'id'>) => void;
  onEditDatabaseFood?: (foodId: string, updates: Partial<FoodItem>) => void;
}

// ─── Reusable Bottom Sheet ────────────────────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  title,
  onSave,
  saveDisabled,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  onSave?: () => void;
  saveDisabled?: boolean;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // Trigger slide-up animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-slate-950 rounded-t-2xl transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>
        {/* Header: [X] title [check] */}
        <div className="flex items-center justify-between px-4 pb-3">
          <button onClick={handleClose} className="p-1.5 -ml-1.5 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {onSave ? (
            <button
              onClick={() => { onSave(); handleClose(); }}
              disabled={saveDisabled}
              className={`p-1.5 -mr-1.5 ${saveDisabled ? 'text-slate-600' : 'text-brand-cyan-400 hover:text-brand-cyan-300'}`}
            >
              <Check className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-8" />
          )}
        </div>
        {/* Scrollable content */}
        <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Food Log Component ───────────────────────────────────────────────────────

export function FoodLog({
  entries,
  foodDatabase,
  onAddEntry,
  onDeleteEntry,
  onEditEntry,
  onAddCustomFood,
  onEditDatabaseFood,
}: FoodLogProps) {
  // Add sheet state
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom food form state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customServing, setCustomServing] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');

  // Edit entry sheet state
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LoggedFoodEntry | null>(null);
  const [editForm, setEditForm] = useState<Partial<LoggedFoodEntry>>({});
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  // Edit DB food sheet state
  const [editDbSheetOpen, setEditDbSheetOpen] = useState(false);
  const [editingDbFood, setEditingDbFood] = useState<FoodItem | null>(null);
  const [dbEditForm, setDbEditForm] = useState<Partial<FoodItem>>({});

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);

  const filteredFoods = searchQuery.trim()
    ? foodDatabase.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : foodDatabase;

  // ── Add sheet helpers ───────────────────────────────────────────────────────

  const openAddSheet = () => {
    setSearchQuery('');
    setSelectedFood(null);
    setQuantity(1);
    setIsAddingCustom(false);
    resetCustomForm();
    setAddSheetOpen(true);
    setTimeout(() => inputRef.current?.focus(), 350);
  };

  const closeAddSheet = () => {
    setAddSheetOpen(false);
    setSelectedFood(null);
    setSearchQuery('');
    setQuantity(1);
    setIsAddingCustom(false);
    resetCustomForm();
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(1);
  };

  const handleAddSave = () => {
    if (selectedFood && quantity >= 1) {
      onAddEntry(selectedFood, quantity);
    }
  };

  const handleAddCustomFood = () => {
    if (!customName.trim() || !customServing.trim()) return;
    const p = parseFloat(customProtein) || 0;
    const c = parseFloat(customCarbs) || 0;
    const f = parseFloat(customFat) || 0;
    onAddCustomFood({
      name: customName.trim(),
      servingSize: customServing.trim(),
      caloriesPerServing: Math.round(p * 4 + c * 4 + f * 9),
      protein: Math.round(p * 10) / 10,
      carbs: Math.round(c * 10) / 10,
      fat: Math.round(f * 10) / 10,
    });
    resetCustomForm();
    setIsAddingCustom(false);
  };

  const resetCustomForm = () => {
    setCustomName('');
    setCustomServing('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
  };

  // ── Edit entry helpers ──────────────────────────────────────────────────────

  const openEditSheet = (entry: LoggedFoodEntry) => {
    setEditingEntry(entry);
    setEditForm({
      name: entry.name,
      servingSize: entry.servingSize,
      quantity: entry.quantity,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    });
    setDeleteConfirming(false);
    setEditSheetOpen(true);
  };

  const handleEditSave = () => {
    if (!editingEntry) return;
    onEditEntry(editingEntry.id, editForm);
  };

  const handleDeleteEntry = () => {
    if (!editingEntry) return;
    onDeleteEntry(editingEntry.id);
    setEditSheetOpen(false);
    setEditingEntry(null);
    setDeleteConfirming(false);
  };

  // ── Edit DB food helpers ────────────────────────────────────────────────────

  const openDbEditSheet = (food: FoodItem) => {
    setEditingDbFood(food);
    setDbEditForm({ ...food });
    setEditDbSheetOpen(true);
  };

  const handleDbEditSave = () => {
    if (!editingDbFood || !onEditDatabaseFood) return;
    onEditDatabaseFood(editingDbFood.id, dbEditForm);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

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
                <button
                  key={entry.id}
                  onClick={() => openEditSheet(entry)}
                  className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-left transition-colors active:bg-slate-700/40"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {entry.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {entry.quantity} x {entry.servingSize}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-orange-400 whitespace-nowrap">
                    {entry.calories} cal
                  </span>
                  <Pencil className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Add Meal Button */}
          <Button
            onClick={openAddSheet}
            variant="outline"
            className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-brand-cyan-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Meal
          </Button>
        </CardContent>
      </Card>

      {/* ─── Add Food Bottom Sheet ─────────────────────────────────────────── */}
      <BottomSheet
        open={addSheetOpen}
        onClose={closeAddSheet}
        title="Add Meal"
        onSave={selectedFood ? handleAddSave : undefined}
        saveDisabled={selectedFood ? quantity < 1 : true}
      >
        <div className="space-y-4">
          {/* Instructions */}
          {!selectedFood && !isAddingCustom && (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-slate-500">To log your meal</p>
              <p className="text-sm font-medium text-white">
                Do any of the following
              </p>
              <div className="flex justify-center gap-8 pt-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-11 h-11 rounded-full bg-brand-cyan-600/15 flex items-center justify-center">
                    <Search className="h-4.5 w-4.5 text-brand-cyan-400" />
                  </div>
                  <span className="text-[11px] text-slate-500">Search food</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-11 h-11 rounded-full bg-orange-600/15 flex items-center justify-center">
                    <UtensilsCrossed className="h-4.5 w-4.5 text-orange-400" />
                  </div>
                  <span className="text-[11px] text-slate-500">Pick from list</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-11 h-11 rounded-full bg-purple-600/15 flex items-center justify-center">
                    <Plus className="h-4.5 w-4.5 text-purple-400" />
                  </div>
                  <span className="text-[11px] text-slate-500">Add custom</span>
                </div>
              </div>
            </div>
          )}

          {/* Search bar */}
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
              className="pl-9 h-11 bg-slate-900 border-brand-cyan-600 text-white ring-brand-cyan-600/30 focus-visible:ring-brand-cyan-500"
            />
          </div>

          {/* Quantity picker when food selected */}
          {selectedFood && (
            <div className="p-4 rounded-xl border-2 border-brand-cyan-500/60 bg-slate-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-white">{selectedFood.name}</p>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-xs text-brand-cyan-400 hover:text-brand-cyan-300 font-medium px-2 py-1 rounded-md hover:bg-brand-cyan-400/10 transition-colors"
                >
                  Change
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">Quantity:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10 rounded-xl border border-slate-600 bg-slate-900 flex items-center justify-center text-slate-300 hover:border-brand-cyan-500 hover:text-white active:bg-slate-800 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-white font-bold text-xl w-10 text-center tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-10 w-10 rounded-xl border border-slate-600 bg-slate-900 flex items-center justify-center text-slate-300 hover:border-brand-cyan-500 hover:text-white active:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-500">
                  x {selectedFood.servingSize}
                </span>
              </div>
              {/* Nutrition preview pills */}
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center gap-1 rounded-lg bg-orange-500/10 border border-orange-500/20 py-2 px-1">
                  <span className="text-[10px] font-medium text-orange-400 uppercase tracking-wider">Cal</span>
                  <span className="text-sm font-bold text-orange-300">{selectedFood.caloriesPerServing * quantity}</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-2 px-1">
                  <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Protein</span>
                  <span className="text-sm font-bold text-emerald-300">{selectedFood.protein * quantity}g</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-blue-500/10 border border-blue-500/20 py-2 px-1">
                  <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider">Carbs</span>
                  <span className="text-sm font-bold text-blue-300">{selectedFood.carbs * quantity}g</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 py-2 px-1">
                  <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">Fat</span>
                  <span className="text-sm font-bold text-amber-300">{selectedFood.fat * quantity}g</span>
                </div>
              </div>
            </div>
          )}

          {/* Food database list */}
          {!selectedFood && (
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-700/40">
                {filteredFoods.map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-700/30 active:bg-slate-700/40 transition-colors"
                  >
                    <button
                      onClick={() => handleSelectFood(food)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-sm font-semibold text-white truncate">{food.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{food.servingSize}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-medium text-emerald-400">P:{food.protein}g</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[11px] font-medium text-blue-400">C:{food.carbs}g</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[11px] font-medium text-amber-400">F:{food.fat}g</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-2.5 py-1">
                        {food.caloriesPerServing} cal
                      </span>
                      {onEditDatabaseFood && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDbEditSheet(food);
                          }}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-brand-cyan-400 hover:bg-brand-cyan-400/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredFoods.length === 0 && searchQuery.trim() && (
                  <div className="px-4 py-8">
                    <p className="text-sm text-slate-400 text-center">No foods found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Custom Item — separate section below the food list */}
          {!selectedFood && (
            <>
              {!isAddingCustom ? (
                <button
                  onClick={() => setIsAddingCustom(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-purple-500/40 bg-purple-500/5 text-purple-400 hover:text-purple-300 hover:border-purple-400/60 hover:bg-purple-500/10 transition-all text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Custom Item
                </button>
              ) : (
                <div className="rounded-xl border border-purple-500/30 bg-slate-800/60 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-purple-500/8 border-b border-purple-500/20">
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <Plus className="h-4 w-4 text-purple-400" />
                      Add Custom Food
                    </p>
                    <button
                      onClick={() => { setIsAddingCustom(false); resetCustomForm(); }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Name and Serving */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-slate-400">Food Name</Label>
                        <Input
                          placeholder="e.g. Homemade Dal"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="mt-1.5 h-10 text-sm bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Serving Size</Label>
                        <Input
                          placeholder="e.g. 1 bowl"
                          value={customServing}
                          onChange={(e) => setCustomServing(e.target.value)}
                          className="mt-1.5 h-10 text-sm bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Macros — 2-column layout */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                        <Label className="text-xs font-medium text-emerald-400">Protein (g)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          value={customProtein}
                          onChange={(e) => setCustomProtein(e.target.value)}
                          className="mt-1.5 h-10 text-sm bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
                        <Label className="text-xs font-medium text-blue-400">Carbs (g)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          value={customCarbs}
                          onChange={(e) => setCustomCarbs(e.target.value)}
                          className="mt-1.5 h-10 text-sm bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
                        <Label className="text-xs font-medium text-amber-400">Fat (g)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          value={customFat}
                          onChange={(e) => setCustomFat(e.target.value)}
                          className="mt-1.5 h-10 text-sm bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Info box */}
                    <div className="flex items-start gap-2 rounded-lg bg-slate-900/60 border border-slate-700/50 px-3 py-2.5">
                      <span className="text-brand-cyan-400 text-xs mt-0.5 shrink-0">i</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Enter values per serving. Calories auto-calculated <span className="text-slate-300">(P*4 + C*4 + F*9)</span>. Item will be added to your food list.
                      </p>
                    </div>

                    {/* Save button */}
                    <Button
                      onClick={handleAddCustomFood}
                      disabled={!customName.trim() || !customServing.trim()}
                      className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Save to Food List
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </BottomSheet>

      {/* ─── Edit Entry Bottom Sheet ───────────────────────────────────────── */}
      <BottomSheet
        open={editSheetOpen}
        onClose={() => { setEditSheetOpen(false); setEditingEntry(null); setDeleteConfirming(false); }}
        title="Edit Entry"
        onSave={handleEditSave}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-400">Name</Label>
              <Input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-1 h-9 text-sm bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Serving Size</Label>
              <Input
                value={editForm.servingSize || ''}
                onChange={(e) => setEditForm({ ...editForm, servingSize: e.target.value })}
                className="mt-1 h-9 text-sm bg-slate-900 border-slate-700 text-white"
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
                className="mt-1 h-9 text-sm bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Calories</Label>
              <Input
                type="number"
                value={editForm.calories || 0}
                onChange={(e) => setEditForm({ ...editForm, calories: parseInt(e.target.value) || 0 })}
                className="mt-1 h-9 text-sm bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Protein</Label>
              <Input
                type="number"
                step="0.1"
                value={editForm.protein || 0}
                onChange={(e) => setEditForm({ ...editForm, protein: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-9 text-sm bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Carbs</Label>
              <Input
                type="number"
                step="0.1"
                value={editForm.carbs || 0}
                onChange={(e) => setEditForm({ ...editForm, carbs: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-9 text-sm bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Fat</Label>
              <Input
                type="number"
                step="0.1"
                value={editForm.fat || 0}
                onChange={(e) => setEditForm({ ...editForm, fat: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-9 text-sm bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Delete section */}
          <div className="pt-4 border-t border-slate-800">
            {!deleteConfirming ? (
              <button
                onClick={() => setDeleteConfirming(true)}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Entry
              </button>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-950/30 border border-red-800/40">
                <p className="text-sm text-red-400">Are you sure?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirming(false)}
                    className="h-7 text-xs border-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDeleteEntry}
                    className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* ─── Edit Database Food Bottom Sheet ───────────────────────────────── */}
      <BottomSheet
        open={editDbSheetOpen}
        onClose={() => { setEditDbSheetOpen(false); setEditingDbFood(null); }}
        title="Edit Food Item"
        onSave={handleDbEditSave}
      >
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-slate-400">Name</Label>
            <Input
              value={dbEditForm.name || ''}
              onChange={(e) => setDbEditForm({ ...dbEditForm, name: e.target.value })}
              className="mt-1 h-9 bg-slate-900 border-slate-700 text-white"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400">Serving Size</Label>
            <Input
              value={dbEditForm.servingSize || ''}
              onChange={(e) => setDbEditForm({ ...dbEditForm, servingSize: e.target.value })}
              className="mt-1 h-9 bg-slate-900 border-slate-700 text-white"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label className="text-xs text-slate-400">Calories</Label>
              <Input
                type="number"
                value={dbEditForm.caloriesPerServing || 0}
                onChange={(e) => setDbEditForm({ ...dbEditForm, caloriesPerServing: parseInt(e.target.value) || 0 })}
                className="mt-1 h-9 text-sm bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Protein</Label>
              <Input
                type="number"
                step="0.1"
                value={dbEditForm.protein || 0}
                onChange={(e) => setDbEditForm({ ...dbEditForm, protein: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-9 text-sm bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Carbs</Label>
              <Input
                type="number"
                step="0.1"
                value={dbEditForm.carbs || 0}
                onChange={(e) => setDbEditForm({ ...dbEditForm, carbs: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-9 text-sm bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Fat</Label>
              <Input
                type="number"
                step="0.1"
                value={dbEditForm.fat || 0}
                onChange={(e) => setDbEditForm({ ...dbEditForm, fat: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-9 text-sm bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
