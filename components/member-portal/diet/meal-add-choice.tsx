'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Camera, PenLine } from 'lucide-react';

interface MealAddChoiceProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: () => void;
  onSelectManual: () => void;
  mealType: string;
}

export function MealAddChoice({
  isOpen,
  onClose,
  onSelectPhoto,
  onSelectManual,
  mealType,
}: MealAddChoiceProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Add {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          <button
            onClick={onSelectPhoto}
            className="flex flex-col items-center gap-3 p-4 rounded-lg border border-slate-700 hover:border-brand-cyan-500/50 hover:bg-slate-800/50 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-brand-cyan-500/10 flex items-center justify-center">
              <Camera className="h-6 w-6 text-brand-cyan-400" />
            </div>
            <span className="text-sm font-medium text-white">Snap a Photo</span>
            <span className="text-xs text-slate-400">AI analyzes nutrition</span>
          </button>

          <button
            onClick={onSelectManual}
            className="flex flex-col items-center gap-3 p-4 rounded-lg border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <PenLine className="h-6 w-6 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-white">Add Manually</span>
            <span className="text-xs text-slate-400">Enter details yourself</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
