'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { saveWorkoutFocus } from '@/lib/actions/checkin-flow';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';

interface WorkoutFocusSelectorProps {
  checkInId: string;
  onComplete: () => void;
}

const WORKOUT_OPTIONS = [
  {
    id: 'chest',
    label: 'Chest',
    color: 'from-red-500 to-rose-600',
    bgHover: 'hover:border-slate-600',
    selectedBg: 'bg-brand-cyan-500/10 border-brand-cyan-500 shadow-glow-cyan',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 16C26 16 18 20 16 28C14 36 18 44 24 46C28 48 32 44 32 44C32 44 36 48 40 46C46 44 50 36 48 28C46 20 38 16 32 16Z" fill="currentColor" opacity="0.2" />
        <path d="M12 26C10 26 8 28 8 32C8 36 10 38 12 38C14 38 16 36 18 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M52 26C54 26 56 28 56 32C56 36 54 38 52 38C50 38 48 36 46 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M18 24C22 18 28 16 32 16C36 16 42 18 46 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M18 24C16 28 16 34 20 40C24 46 32 44 32 44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M46 24C48 28 48 34 44 40C40 46 32 44 32 44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="20" x2="32" y2="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    ),
  },
  {
    id: 'back',
    label: 'Back',
    color: 'from-blue-500 to-indigo-600',
    bgHover: 'hover:border-slate-600',
    selectedBg: 'bg-brand-cyan-500/10 border-brand-cyan-500 shadow-glow-cyan',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 14C24 14 28 12 32 12C36 12 40 14 40 14L44 20L46 32L42 44L36 50H28L22 44L18 32L20 20L24 14Z" fill="currentColor" opacity="0.2" />
        <path d="M24 14C28 12 36 12 40 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 14L20 20L18 32L22 44L28 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 14L44 20L46 32L42 44L36 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="14" x2="32" y2="50" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M26 22L32 20L38 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M24 32L32 30L40 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M26 40L32 38L38 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'shoulders',
    label: 'Shoulders',
    color: 'from-purple-500 to-violet-600',
    bgHover: 'hover:border-slate-600',
    selectedBg: 'bg-brand-purple-500/10 border-brand-purple-500 shadow-glow-cyan',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="24" r="10" fill="currentColor" opacity="0.2" />
        <circle cx="44" cy="24" r="10" fill="currentColor" opacity="0.2" />
        <circle cx="20" cy="24" r="10" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="44" cy="24" r="10" stroke="currentColor" strokeWidth="2.5" />
        <path d="M30 24H34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 34V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M44 34V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 28L10 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M50 28L54 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'arms',
    label: 'Arms',
    color: 'from-orange-500 to-amber-600',
    bgHover: 'hover:border-slate-600',
    selectedBg: 'bg-brand-pink-500/10 border-brand-pink-500 shadow-glow-cyan',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 12C18 12 14 20 14 28C14 32 16 36 20 36" fill="currentColor" opacity="0.2" />
        <path d="M46 12C46 12 50 20 50 28C50 32 48 36 44 36" fill="currentColor" opacity="0.2" />
        <path d="M18 12C18 12 14 20 14 28C14 32 16 36 20 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 36C20 36 22 38 22 42V50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M46 12C46 12 50 20 50 28C50 32 48 36 44 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M44 36C44 36 42 38 42 42V50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="17" cy="22" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="47" cy="22" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M28 16H36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 12V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'legs',
    label: 'Legs',
    color: 'from-green-500 to-emerald-600',
    bgHover: 'hover:border-slate-600',
    selectedBg: 'bg-emerald-500/10 border-emerald-500 shadow-glow-cyan',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 8H40L42 20L40 36L38 48L36 56H34L32 48L30 56H28L26 48L24 36L22 20L24 8Z" fill="currentColor" opacity="0.15" />
        <path d="M24 8L22 20L24 36L26 48L28 56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 8L42 20L40 36L38 48L36 56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 8H40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M23 20H41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
        <path d="M24 36H40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
        <ellipse cx="27" cy="24" rx="3" ry="6" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="37" cy="24" rx="3" ry="6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'core',
    label: 'Core',
    color: 'from-yellow-500 to-orange-500',
    bgHover: 'hover:border-slate-600',
    selectedBg: 'bg-amber-500/10 border-amber-500 shadow-glow-cyan',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="12" width="24" height="40" rx="4" fill="currentColor" opacity="0.15" />
        <rect x="20" y="12" width="24" height="40" rx="4" stroke="currentColor" strokeWidth="2.5" />
        <line x1="32" y1="16" x2="32" y2="48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="22" y1="22" x2="42" y2="22" stroke="currentColor" strokeWidth="1.5" />
        <line x1="22" y1="32" x2="42" y2="32" stroke="currentColor" strokeWidth="1.5" />
        <line x1="22" y1="42" x2="42" y2="42" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="27" cy="17" r="1.5" fill="currentColor" />
        <circle cx="37" cy="17" r="1.5" fill="currentColor" />
        <circle cx="27" cy="27" r="1.5" fill="currentColor" />
        <circle cx="37" cy="27" r="1.5" fill="currentColor" />
        <circle cx="27" cy="37" r="1.5" fill="currentColor" />
        <circle cx="37" cy="37" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'cardio',
    label: 'Cardio',
    color: 'from-pink-500 to-rose-500',
    bgHover: 'hover:border-slate-600',
    selectedBg: 'bg-brand-pink-500/10 border-brand-pink-500 shadow-glow-cyan',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 52C32 52 10 38 10 24C10 18 14 12 22 12C28 12 32 18 32 18C32 18 36 12 42 12C50 12 54 18 54 24C54 38 32 52 32 52Z" fill="currentColor" opacity="0.2" />
        <path d="M32 52C32 52 10 38 10 24C10 18 14 12 22 12C28 12 32 18 32 18C32 18 36 12 42 12C50 12 54 18 54 24C54 38 32 52 32 52Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14,30 22,30 26,22 30,38 34,26 38,34 42,30 50,30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'full-body',
    label: 'Full Body',
    color: 'from-teal-500 to-cyan-600',
    bgHover: 'hover:border-slate-600',
    selectedBg: 'bg-brand-cyan-500/10 border-brand-cyan-500 shadow-glow-cyan',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="10" r="6" fill="currentColor" opacity="0.2" />
        <circle cx="32" cy="10" r="6" stroke="currentColor" strokeWidth="2.5" />
        <path d="M32 16V36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 22L18 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 22L46 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 36L22 54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 36L42 54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="32" cy="28" r="2" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
];

export function WorkoutFocusSelector({ checkInId, onComplete }: WorkoutFocusSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleOption = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error('Please select at least one workout focus');
      return;
    }

    setIsSubmitting(true);
    const result = await saveWorkoutFocus(checkInId, selected);

    if (result.success) {
      setSubmitted(true);
      toast.success('Workout plan saved!');
      setTimeout(onComplete, 1500);
    } else {
      toast.error(result.error || 'Failed to save');
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-cyan-500/20 mb-4">
          <Check className="w-8 h-8 text-brand-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">You're all set!</h3>
        <p className="text-slate-400 mt-1">Have a great workout!</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">
          What are you working on today?
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          Tap to select one or more muscle groups
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {WORKOUT_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleOption(option.id)}
              className={`
                relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2
                transition-all duration-200 ease-out
                ${
                  isSelected
                    ? `${option.selectedBg} scale-[1.02] shadow-md`
                    : `bg-slate-800 border-slate-700 ${option.bgHover} hover:bg-slate-700 hover:shadow-sm hover:scale-[1.01]`
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full bg-brand-cyan-500 flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              <div className={`${isSelected ? 'text-brand-cyan-400' : 'text-slate-400'} transition-colors`}>
                {option.icon}
              </div>

              <span
                className={`text-sm font-medium ${
                  isSelected ? 'text-white' : 'text-slate-300'
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-2">
          <span className="text-sm text-slate-400">
            <strong className="text-white">{selected.length}</strong> selected:{' '}
            {selected
              .map((s) => WORKOUT_OPTIONS.find((o) => o.id === s)?.label)
              .join(', ')}
          </span>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Clear
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selected.length === 0}
          className="flex-1 gradient-brand text-white shadow-glow-cyan"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Let's Go!"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onComplete}
          disabled={isSubmitting}
          size="lg"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
