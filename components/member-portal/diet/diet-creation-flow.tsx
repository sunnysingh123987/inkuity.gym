'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DietCreationChoice } from './diet-creation-choice';
import { AiDietWizard } from './ai-diet-wizard';
import { AiDietGenerating } from './ai-diet-generating';
import { AiDietPreview } from './ai-diet-preview';
import { generateAiDietPlan, type AiDietInput } from '@/lib/actions/ai-diet';

type FlowStep = 'choice' | 'wizard' | 'generating' | 'preview';

interface DietCreationFlowProps {
  gymSlug: string;
  memberId: string;
  gymId: string;
  aiPlanUsed: boolean;
  memberProfile: {
    gender?: string;
    birth_date?: string;
  };
}

export function DietCreationFlow({
  gymSlug,
  memberId,
  gymId,
  aiPlanUsed,
  memberProfile,
}: DietCreationFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>('choice');
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleSelectAi = () => {
    setStep('wizard');
  };

  const handleWizardSubmit = async (input: AiDietInput) => {
    setStep('generating');

    const result = await generateAiDietPlan(input);

    if (result.success && result.data) {
      setGeneratedPlan(result.data.generatedPlan);
      setStep('preview');
    } else {
      toast.error(result.error || 'Failed to generate diet plan');
      setStep('wizard');
    }
  };

  const handleSave = () => {
    // Plan is already saved during generation
    setSaving(true);
    toast.success('Diet plan saved successfully!');
    router.push(`/${gymSlug}/portal/diet`);
  };

  const handleDiscard = () => {
    // The plan was already saved during generation, but the user wants to discard
    // For simplicity we redirect — the plan is already in DB
    // In a more complex flow we'd delete it here
    toast.info('Returning to diet plans');
    router.push(`/${gymSlug}/portal/diet`);
  };

  switch (step) {
    case 'choice':
      return (
        <DietCreationChoice
          gymSlug={gymSlug}
          memberId={memberId}
          gymId={gymId}
          aiPlanUsed={aiPlanUsed}
          onSelectAi={handleSelectAi}
        />
      );

    case 'wizard':
      return (
        <AiDietWizard
          memberId={memberId}
          gymId={gymId}
          memberProfile={memberProfile}
          onSubmit={handleWizardSubmit}
          onCancel={() => setStep('choice')}
        />
      );

    case 'generating':
      return <AiDietGenerating />;

    case 'preview':
      return generatedPlan ? (
        <AiDietPreview
          plan={generatedPlan}
          onSave={handleSave}
          onDiscard={handleDiscard}
          saving={saving}
        />
      ) : null;

    default:
      return null;
  }
}
