'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Calculator, ChefHat, Check } from 'lucide-react';

const MESSAGES = [
  { text: 'Analyzing your goals...', icon: Sparkles },
  { text: 'Calculating your macros...', icon: Calculator },
  { text: 'Creating your meal plan...', icon: ChefHat },
  { text: 'Almost done...', icon: Check },
];

export function AiDietGenerating() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = MESSAGES[messageIndex].icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-8">
      {/* Animated spinner */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-brand-cyan-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <CurrentIcon className="h-10 w-10 text-brand-cyan-400 animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-white">
          {MESSAGES[messageIndex].text}
        </p>
        <p className="text-sm text-slate-400">
          This may take a moment while AI crafts your plan
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i <= messageIndex ? 'bg-brand-cyan-500' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
