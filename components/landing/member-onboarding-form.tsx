'use client'

import { useState } from 'react'
import { Member, Gym } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateMember } from '@/lib/actions/gyms'
import { User, Phone, Mail, Calendar, Target, UserCheck, CreditCard } from 'lucide-react'

interface MemberOnboardingFormProps {
  member: Member
  gym: Gym
  onComplete: () => void
}

export function MemberOnboardingForm({ member, gym, onComplete }: MemberOnboardingFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: member.full_name || '',
    phone: member.phone || '',
    emergency_contact: '',
    member_id: '',
    fitness_goal: '',
    trainer: '',
    birth_date: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateMember(member.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        birth_date: formData.birth_date || null,
        metadata: {
          ...member.metadata,
          emergency_contact: formData.emergency_contact,
          member_id: formData.member_id,
          fitness_goal: formData.fitness_goal,
          trainer: formData.trainer,
        },
        is_verified: true,
      })

      if (result.success) {
        onComplete()
      } else {
        alert('Failed to update profile: ' + result.error)
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Complete Your Profile
            </CardTitle>
            <p className="text-sm text-gray-600">
              Welcome to {gym.name}! Please fill in your details to complete your check-in.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mandatory Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Required Information</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Emergency Contact *
                  </Label>
                  <Input
                    id="emergency_contact"
                    type="tel"
                    required
                    value={formData.emergency_contact}
                    onChange={(e) => handleChange('emergency_contact', e.target.value)}
                    placeholder="Emergency contact phone number"
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="member_id" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Member ID
                    </Label>
                    <Input
                      id="member_id"
                      value={formData.member_id}
                      onChange={(e) => handleChange('member_id', e.target.value)}
                      placeholder="Gym member ID (if provided by gym)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fitness_goal" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Fitness Goal
                    </Label>
                    <Select value={formData.fitness_goal} onValueChange={(value) => handleChange('fitness_goal', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight_loss">Weight Loss</SelectItem>
                        <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                        <SelectItem value="strength">Strength Training</SelectItem>
                        <SelectItem value="endurance">Endurance</SelectItem>
                        <SelectItem value="flexibility">Flexibility</SelectItem>
                        <SelectItem value="general_fitness">General Fitness</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="trainer" className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Trainer
                    </Label>
                    <Input
                      id="trainer"
                      value={formData.trainer}
                      onChange={(e) => handleChange('trainer', e.target.value)}
                      placeholder="Trainer name (if any)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birth_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date of Birth
                    </Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => handleChange('birth_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onComplete}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                  style={{
                    backgroundColor: '#4f46e5',
                  }}
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}