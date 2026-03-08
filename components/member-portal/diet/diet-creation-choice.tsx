'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, PenLine } from 'lucide-react';
import Link from 'next/link';

interface DietCreationChoiceProps {
  gymSlug: string;
  memberId: string;
  gymId: string;
  aiPlanUsed: boolean;
  onSelectAi: () => void;
}

export function DietCreationChoice({
  gymSlug,
  memberId,
  gymId,
  aiPlanUsed,
  onSelectAi,
}: DietCreationChoiceProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Diet Plan</h1>
        <p className="text-slate-400 mt-1">
          Choose how you'd like to create your diet plan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option A: AI-Generated */}
        <Card
          className={`relative cursor-pointer transition-all border-2 ${
            aiPlanUsed
              ? 'opacity-60 cursor-not-allowed border-slate-700'
              : 'border-slate-700 hover:border-brand-cyan-500/50 hover:shadow-lg hover:shadow-brand-cyan-500/10'
          }`}
          onClick={() => !aiPlanUsed && onSelectAi()}
        >
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-cyan-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-brand-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                AI-Generated Plan
              </h3>
              <p className="text-slate-400 text-sm mt-2">
                Let AI create a personalized 7-day diet plan based on your
                goals, preferences, and body profile
              </p>
            </div>
            {aiPlanUsed ? (
              <span className="inline-block text-xs bg-slate-700 text-slate-400 px-3 py-1 rounded-full">
                Already used your AI plan
              </span>
            ) : (
              <Button
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAi();
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Option B: Manual */}
        <Card className="relative cursor-pointer transition-all border-2 border-slate-700 hover:border-brand-cyan-500/50 hover:shadow-lg hover:shadow-brand-cyan-500/10">
          <Link href={`/${gymSlug}/portal/diet/new?mode=manual`}>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/20 flex items-center justify-center mx-auto">
                <PenLine className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Create Manually
                </h3>
                <p className="text-slate-400 text-sm mt-2">
                  Set your own calorie and macro targets, then plan your meals
                  yourself
                </p>
              </div>
              <Button variant="outline" className="w-full">
                <PenLine className="h-4 w-4 mr-2" />
                Create Manually
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
