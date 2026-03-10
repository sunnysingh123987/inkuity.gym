'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  Target,
  Dumbbell,
  Scale,
  Activity,
  Salad,
  Sparkles,
} from 'lucide-react';
import { type AiDietInput } from '@/lib/actions/ai-diet';

interface AiDietWizardProps {
  memberId: string;
  gymId: string;
  memberProfile: {
    gender?: string;
    birth_date?: string;
  };
  onSubmit: (input: AiDietInput) => void;
  onCancel: () => void;
}

type Goal = 'lose_weight' | 'gain_muscle' | 'maintain';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type DietaryPreference = 'veg' | 'non_veg' | 'vegan' | 'eggetarian';

const GOALS: { value: Goal; label: string; desc: string; icon: typeof Target }[] = [
  { value: 'lose_weight', label: 'Lose Weight', desc: 'Calorie deficit plan', icon: Scale },
  { value: 'gain_muscle', label: 'Gain Muscle', desc: 'Calorie surplus plan', icon: Dumbbell },
  { value: 'maintain', label: 'Maintain Weight', desc: 'Balanced nutrition', icon: Target },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 'light', label: 'Lightly Active', desc: 'Exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
  { value: 'active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
  { value: 'very_active', label: 'Extremely Active', desc: 'Physical job + exercise' },
];

const DIET_TYPES: { value: DietaryPreference; label: string }[] = [
  { value: 'non_veg', label: 'Non-Vegetarian' },
  { value: 'veg', label: 'Vegetarian' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'vegan', label: 'Vegan' },
];

const CUISINES = ['Indian', 'Continental', 'Mediterranean', 'Asian', 'Mixed'];

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function AiDietWizard({
  memberId,
  gymId,
  memberProfile,
  onSubmit,
  onCancel,
}: AiDietWizardProps) {
  const [step, setStep] = useState(1);

  // Step 1
  const [goal, setGoal] = useState<Goal | ''>('');
  const [targetWeight, setTargetWeight] = useState('');

  // Step 2
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('');
  const [mealsPerDay, setMealsPerDay] = useState<3 | 4>(3);

  // Step 3
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference | ''>('');
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState('');

  // Body profile (user enters manually in wizard)
  const [weight, setWeight] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [age, setAge] = useState(
    memberProfile.birth_date ? String(calculateAge(memberProfile.birth_date)) : ''
  );
  const [gender, setGender] = useState(memberProfile.gender || '');

  const toggleCuisine = (c: string) => {
    setCuisinePreferences((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const canProceedStep1 = goal !== '' && weight && heightFeet && age && gender;
  const canProceedStep2 = activityLevel !== '';
  const canProceedStep3 = dietaryPreference !== '';

  const handleSubmit = () => {
    if (!goal || !activityLevel || !dietaryPreference) return;

    onSubmit({
      memberId,
      gymId,
      goal,
      activityLevel,
      dietaryPreference,
      cuisinePreferences,
      allergies,
      mealsPerDay,
      weight: parseFloat(weight),
      heightFeet: parseInt(heightFeet),
      heightInches: parseInt(heightInches) || 0,
      age: parseInt(age),
      gender,
      targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                s <= step
                  ? 'bg-brand-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  s < step ? 'bg-brand-cyan-500' : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Goal + Body Profile */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Your Goal</h2>
            <p className="text-slate-400 text-sm mt-1">
              What would you like to achieve?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {GOALS.map((g) => {
              const Icon = g.icon;
              return (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    goal === g.value
                      ? 'border-brand-cyan-500 bg-brand-cyan-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-2 ${goal === g.value ? 'text-brand-cyan-400' : 'text-slate-400'}`} />
                  <p className="font-semibold text-white text-sm">{g.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{g.desc}</p>
                </button>
              );
            })}
          </div>

          {goal === 'lose_weight' && (
            <div>
              <Label>Target Weight (kg, optional)</Label>
              <Input
                type="number"
                placeholder="e.g., 65"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className="mt-1 max-w-xs"
              />
            </div>
          )}

          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-white text-sm">
                Your Body Profile
              </h3>
              {memberProfile.birth_date && (
                <p className="text-xs text-slate-400">
                  Based on your profile: Age {age}, {gender || 'Gender not set'}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Weight (kg) *</Label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Height *</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="5"
                        min="3"
                        max="7"
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(e.target.value)}
                      />
                      <span className="text-xs text-slate-400 mt-0.5 block">feet</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="8"
                        min="0"
                        max="11"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                      />
                      <span className="text-xs text-slate-400 mt-0.5 block">inches</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Age *</Label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Gender *</Label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="mt-1 w-full rounded-md glass-input px-3 py-2 text-sm text-white"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Lifestyle */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Your Lifestyle</h2>
            <p className="text-slate-400 text-sm mt-1">
              How active are you on a typical week?
            </p>
          </div>

          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((a) => (
              <button
                key={a.value}
                onClick={() => setActivityLevel(a.value)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                  activityLevel === a.value
                    ? 'border-brand-cyan-500 bg-brand-cyan-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <Activity className={`h-5 w-5 ${activityLevel === a.value ? 'text-brand-cyan-400' : 'text-slate-400'}`} />
                <div>
                  <p className="font-semibold text-white text-sm">{a.label}</p>
                  <p className="text-xs text-slate-400">{a.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div>
            <Label className="text-sm font-semibold text-white">
              Meals per Day
            </Label>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setMealsPerDay(3)}
                className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                  mealsPerDay === 3
                    ? 'border-brand-cyan-500 bg-brand-cyan-500/10'
                    : 'border-slate-700'
                }`}
              >
                <p className="font-semibold text-white">3 Meals</p>
                <p className="text-xs text-slate-400">
                  Breakfast, Lunch, Dinner
                </p>
              </button>
              <button
                onClick={() => setMealsPerDay(4)}
                className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                  mealsPerDay === 4
                    ? 'border-brand-cyan-500 bg-brand-cyan-500/10'
                    : 'border-slate-700'
                }`}
              >
                <p className="font-semibold text-white">4 Meals</p>
                <p className="text-xs text-slate-400">+ Evening Snack</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Dietary Preferences */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              Dietary Preferences
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Help us pick the right foods for you
            </p>
          </div>

          <div>
            <Label className="text-sm font-semibold text-white">
              Diet Type *
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {DIET_TYPES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDietaryPreference(d.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    dietaryPreference === d.value
                      ? 'border-brand-cyan-500 bg-brand-cyan-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Salad className={`h-5 w-5 mb-1 ${dietaryPreference === d.value ? 'text-brand-cyan-400' : 'text-slate-400'}`} />
                  <p className="font-semibold text-white text-sm">{d.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-white">
              Cuisine Preferences
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    cuisinePreferences.includes(c)
                      ? 'bg-brand-cyan-500 text-white'
                      : 'bg-white/20 text-slate-300 glass-hover'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Allergies / Restrictions (optional)</Label>
            <Input
              placeholder="e.g., Peanuts, Lactose intolerant"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
        <Button
          type="button"
          variant="outline"
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 1 ? 'Back' : 'Previous'}
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 && !canProceedStep1) ||
              (step === 2 && !canProceedStep2)
            }
            className="flex-1"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceedStep3}
            className="flex-1"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Plan
          </Button>
        )}
      </div>
    </div>
  );
}
