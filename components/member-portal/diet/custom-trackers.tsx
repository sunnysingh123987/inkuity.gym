'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import {
  Plus,
  Minus,
  MoreVertical,
  Pencil,
  Trash2,
  Droplets,
  FlaskConical,
  Pill,
  Activity,
  Apple,
  Coffee,
  Heart,
  Zap,
  Dumbbell,
  Salad,
  RotateCcw,
} from 'lucide-react';

export interface CustomTracker {
  id: string;
  name: string;
  unit: string;
  dailyTarget: number;
  current: number;
  icon: string;
  color: string;
}

interface CustomTrackersProps {
  trackers: CustomTracker[];
  onIncrement: (trackerId: string) => void;
  onDecrement: (trackerId: string) => void;
  onAddTracker: (tracker: Omit<CustomTracker, 'id' | 'current'>) => void;
  onDeleteTracker: (trackerId: string) => void;
  onEditTracker: (trackerId: string, updates: Partial<CustomTracker>) => void;
  onResetAll?: () => void;
  onDeleteAll?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Droplets,
  FlaskConical,
  Pill,
  Activity,
  Apple,
  Coffee,
  Heart,
  Zap,
  Dumbbell,
  Salad,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const COLOR_OPTIONS = [
  { name: 'Cyan', value: 'cyan' },
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
  { name: 'Purple', value: 'purple' },
  { name: 'Orange', value: 'orange' },
];

const COLOR_CLASSES: Record<string, { bg: string; text: string; progress: string; ring: string }> = {
  cyan: { bg: 'bg-brand-cyan-600/20', text: 'text-brand-cyan-400', progress: 'bg-brand-cyan-600', ring: 'ring-brand-cyan-500' },
  blue: { bg: 'bg-blue-600/20', text: 'text-blue-400', progress: 'bg-blue-600', ring: 'ring-blue-500' },
  green: { bg: 'bg-emerald-600/20', text: 'text-emerald-400', progress: 'bg-emerald-600', ring: 'ring-emerald-500' },
  purple: { bg: 'bg-purple-600/20', text: 'text-purple-400', progress: 'bg-purple-600', ring: 'ring-purple-500' },
  orange: { bg: 'bg-orange-600/20', text: 'text-orange-400', progress: 'bg-orange-600', ring: 'ring-orange-500' },
};

export function CustomTrackers({
  trackers,
  onIncrement,
  onDecrement,
  onAddTracker,
  onDeleteTracker,
  onEditTracker,
  onResetAll,
  onDeleteAll,
}: CustomTrackersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState<CustomTracker | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formIcon, setFormIcon] = useState('Droplets');
  const [formColor, setFormColor] = useState('cyan');

  const openAddDialog = () => {
    setEditingTracker(null);
    setFormName('');
    setFormUnit('');
    setFormTarget('');
    setFormIcon('Droplets');
    setFormColor('cyan');
    setIsDialogOpen(true);
  };

  const openEditDialog = (tracker: CustomTracker) => {
    setEditingTracker(tracker);
    setFormName(tracker.name);
    setFormUnit(tracker.unit);
    setFormTarget(String(tracker.dailyTarget));
    setFormIcon(tracker.icon);
    setFormColor(tracker.color);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formUnit.trim() || !formTarget.trim()) return;

    if (editingTracker) {
      onEditTracker(editingTracker.id, {
        name: formName.trim(),
        unit: formUnit.trim(),
        dailyTarget: parseInt(formTarget, 10) || 1,
        icon: formIcon,
        color: formColor,
      });
    } else {
      onAddTracker({
        name: formName.trim(),
        unit: formUnit.trim(),
        dailyTarget: parseInt(formTarget, 10) || 1,
        icon: formIcon,
        color: formColor,
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-brand-cyan-400" />
              My Trackers
            </CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-400 hover:text-white h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                  <DropdownMenuItem
                    onClick={() => setIsManageDialogOpen(true)}
                    className="text-slate-300 focus:bg-slate-800 focus:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Edit Trackers
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onResetAll}
                    className="text-slate-300 focus:bg-slate-800 focus:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-2" />
                    Reset All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDeleteAll}
                    className="text-red-400 focus:bg-red-400/10 focus:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {trackers.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No trackers yet. Add one to start tracking.
            </p>
          ) : (
            trackers.map((tracker) => {
              const colors = COLOR_CLASSES[tracker.color] || COLOR_CLASSES.cyan;
              const IconComponent = ICON_MAP[tracker.icon] || Activity;
              const pct = tracker.dailyTarget > 0
                ? Math.min((tracker.current / tracker.dailyTarget) * 100, 100)
                : 0;

              return (
                <div
                  key={tracker.id}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${colors.bg}`}>
                        <IconComponent className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <span className="text-sm font-medium text-white">
                        {tracker.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDecrement(tracker.id)}
                        disabled={tracker.current <= 0}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-sm font-semibold text-white min-w-[3rem] text-center">
                        {tracker.current} / {tracker.dailyTarget}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onIncrement(tracker.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    className="h-1.5"
                    indicatorClassName={colors.progress}
                  />
                  <p className="text-xs text-slate-500">
                    {tracker.current} of {tracker.dailyTarget} {tracker.unit}
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Tracker Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTracker ? 'Edit Tracker' : 'Add New Tracker'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Name</Label>
              <Input
                placeholder="e.g. Water"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Unit</Label>
                <Input
                  placeholder="e.g. glasses"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Daily Target</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 8"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <Label className="text-slate-300">Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((iconName) => {
                  const Icon = ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
                      onClick={() => setFormIcon(iconName)}
                      className={`p-2 rounded-md border transition-colors ${
                        formIcon === iconName
                          ? 'border-brand-cyan-500 bg-brand-cyan-600/20'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${formIcon === iconName ? 'text-brand-cyan-400' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label className="text-slate-300">Color</Label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((color) => {
                  const colors = COLOR_CLASSES[color.value];
                  return (
                    <button
                      key={color.value}
                      onClick={() => setFormColor(color.value)}
                      className={`w-8 h-8 rounded-full ${colors.progress} transition-all ${
                        formColor === color.value ? `ring-2 ${colors.ring} ring-offset-2 ring-offset-slate-900` : ''
                      }`}
                      title={color.name}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formName.trim() || !formUnit.trim() || !formTarget.trim()}
              className="bg-brand-cyan-600 hover:bg-brand-cyan-700"
            >
              {editingTracker ? 'Save Changes' : 'Add Tracker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Trackers Dialog (Edit Trackers) */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Trackers</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {trackers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No trackers to manage.</p>
            ) : (
              trackers.map((tracker) => {
                const colors = COLOR_CLASSES[tracker.color] || COLOR_CLASSES.cyan;
                const IconComponent = ICON_MAP[tracker.icon] || Activity;
                return (
                  <div
                    key={tracker.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${colors.bg}`}>
                        <IconComponent className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{tracker.name}</p>
                        <p className="text-xs text-slate-400">
                          {tracker.dailyTarget} {tracker.unit}/day
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsManageDialogOpen(false);
                          openEditDialog(tracker);
                        }}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-brand-cyan-400"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTracker(tracker.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => {
                setIsManageDialogOpen(false);
                openAddDialog();
              }}
              className="bg-brand-cyan-600 hover:bg-brand-cyan-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add New Tracker
            </Button>
            <Button variant="outline" onClick={() => setIsManageDialogOpen(false)} className="border-slate-700">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
