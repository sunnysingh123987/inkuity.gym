'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, User, ArrowRight } from 'lucide-react'
import { updateMemberInfo } from '@/lib/actions/members-portal'

interface MemberInfoFormProps {
  memberId: string
  existingName?: string | null
  onComplete: () => void
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

const bloodGroupOptions = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
]

export function MemberInfoForm({ memberId, existingName, onComplete }: MemberInfoFormProps) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: existingName || '',
    phone: '',
    birthDate: '',
    gender: '',
    bloodGroup: '',
    heightFeet: '',
    heightInches: '',
    weightKg: '',
  })

  const steps = [
    {
      question: "What's your name?",
      subtitle: "So we can greet you properly",
      field: 'fullName' as const,
      type: 'text',
      placeholder: 'Your full name',
    },
    {
      question: "What's your phone number?",
      subtitle: "In case we need to reach you",
      field: 'phone' as const,
      type: 'tel',
      placeholder: '+91 98765 43210',
    },
    {
      question: "When were you born?",
      subtitle: "Helps us personalize your experience",
      field: 'birthDate' as const,
      type: 'date',
      placeholder: '',
    },
    {
      question: "How do you identify yourself?",
      subtitle: "This helps tailor your fitness recommendations",
      field: 'gender' as const,
      type: 'select',
      placeholder: '',
    },
    {
      question: "What's your blood group?",
      subtitle: "Important for your safety during workouts",
      field: 'bloodGroup' as const,
      type: 'blood-group',
      placeholder: '',
    },
    {
      question: "How tall are you?",
      subtitle: "We'll use this to track your fitness journey",
      field: 'heightFeet' as const,
      type: 'height',
      placeholder: '',
    },
    {
      question: "What's your weight? (kg)",
      subtitle: "This helps calculate your BMI and track progress",
      field: 'weightKg' as const,
      type: 'number',
      placeholder: '70',
    },
  ]

  const currentStep = steps[step]
  const isLastStep = step === steps.length - 1
  const canProceed = currentStep.field === 'fullName'
    ? formData.fullName.trim().length > 0
    : true // Other fields are optional

  const handleNext = async () => {
    if (isLastStep) {
      setLoading(true)
      try {
        const heightCm = formData.heightFeet
          ? parseInt(formData.heightFeet) * 30.48 + (parseInt(formData.heightInches) || 0) * 2.54
          : null
        const bmi = heightCm && formData.weightKg
          ? parseFloat((parseFloat(formData.weightKg) / Math.pow(heightCm / 100, 2)).toFixed(1))
          : null

        await updateMemberInfo(memberId, {
          full_name: formData.fullName || null,
          phone: formData.phone || null,
          birth_date: formData.birthDate || null,
          gender: formData.gender || null,
          metadata: {
            height_feet: formData.heightFeet ? parseInt(formData.heightFeet) : null,
            height_inches: formData.heightInches ? parseInt(formData.heightInches) : null,
            weight_kg: formData.weightKg ? parseFloat(formData.weightKg) : null,
            blood_group: formData.bloodGroup || null,
            bmi,
            info_collected_at: new Date().toISOString(),
          },
        })
        onComplete()
      } catch (err) {
        console.error('Error saving member info:', err)
        onComplete() // Don't block on error
      } finally {
        setLoading(false)
      }
    } else {
      setStep(step + 1)
    }
  }

  const handleSkip = async () => {
    if (isLastStep) {
      // Mark info as collected even when skipping, so the form never shows again
      try {
        await updateMemberInfo(memberId, {
          metadata: {
            info_collected_at: new Date().toISOString(),
          },
        })
      } catch (err) {
        console.error('Error marking info as collected:', err)
      }
      onComplete()
    } else {
      setStep(step + 1)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden">
      <CardContent className="py-6 px-5">
        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-brand-cyan-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-brand-cyan-500/10 flex items-center justify-center">
            <User className="w-6 h-6 text-brand-cyan-400" />
          </div>
        </div>

        {/* Question */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white">{currentStep.question}</h3>
          <p className="text-sm text-slate-400 mt-1">{currentStep.subtitle}</p>
        </div>

        {/* Input */}
        <div className="mb-6">
          {currentStep.type === 'select' ? (
            <div className="grid grid-cols-2 gap-2">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: option.value })}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    formData.gender === option.value
                      ? 'bg-brand-cyan-500/20 text-brand-cyan-400 ring-1 ring-brand-cyan-500/50'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : currentStep.type === 'blood-group' ? (
            <div className="grid grid-cols-4 gap-2">
              {bloodGroupOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, bloodGroup: option.value })}
                  className={`rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                    formData.bloodGroup === option.value
                      ? 'bg-brand-cyan-500/20 text-brand-cyan-400 ring-1 ring-brand-cyan-500/50'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : currentStep.type === 'height' ? (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  type="number"
                  min="3"
                  max="7"
                  value={formData.heightFeet}
                  onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
                  placeholder="5"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12 text-center text-lg"
                  autoFocus
                />
                <span className="text-xs text-slate-400 mt-1 block text-center">feet</span>
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="11"
                  value={formData.heightInches}
                  onChange={(e) => setFormData({ ...formData, heightInches: e.target.value })}
                  placeholder="8"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12 text-center text-lg"
                />
                <span className="text-xs text-slate-400 mt-1 block text-center">inches</span>
              </div>
            </div>
          ) : (
            <Input
              type={currentStep.type}
              value={formData[currentStep.field]}
              onChange={(e) => setFormData({ ...formData, [currentStep.field]: e.target.value })}
              placeholder={currentStep.placeholder}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12 text-center text-lg"
              autoFocus
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {step > 0 && currentStep.field !== 'fullName' && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1 text-slate-400"
            >
              Skip
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed || loading}
            className="flex-1 bg-gradient-to-r from-brand-cyan-600 to-brand-purple-600"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLastStep ? (
              "Let's Go!"
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
