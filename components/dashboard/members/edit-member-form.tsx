'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Member } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updateMember } from '@/lib/actions/gyms'
import { User, Phone, Mail, Calendar, Target, UserCheck, CreditCard, Save, ArrowLeft } from 'lucide-react'

interface EditMemberFormProps {
  member: Member
}

export function EditMemberForm({ member }: EditMemberFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: member.full_name || '',
    email: member.email || '',
    phone: member.phone || '',
    birth_date: member.birth_date || '',
    membership_status: member.membership_status,
    subscription_start_date: member.subscription_start_date || '',
    subscription_plan: member.subscription_plan || '',
    notes: member.notes || '',
    // Metadata fields
    emergency_contact: member.metadata?.emergency_contact || '',
    member_id: member.metadata?.member_id || '',
    fitness_goal: member.metadata?.fitness_goal || '',
    trainer: member.metadata?.trainer || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateMember(member.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        birth_date: formData.birth_date || null,
        membership_status: formData.membership_status as any,
        subscription_start_date: formData.subscription_start_date || null,
        subscription_plan: formData.subscription_plan as any,
        notes: formData.notes,
        metadata: {
          ...member.metadata,
          emergency_contact: formData.emergency_contact,
          member_id: formData.member_id,
          fitness_goal: formData.fitness_goal,
          trainer: formData.trainer,
        },
      })

      if (result.success) {
        router.push('/members')
      } else {
        alert('Failed to update member: ' + result.error)
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Members
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription & Membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="membership_status" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Membership Status
                </Label>
                <Select value={formData.membership_status} onValueChange={(value) => handleChange('membership_status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_plan" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscription Plan
                </Label>
                <Select value={formData.subscription_plan} onValueChange={(value) => handleChange('subscription_plan', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_month">1 Month</SelectItem>
                    <SelectItem value="3_months">3 Months</SelectItem>
                    <SelectItem value="6_months">6 Months</SelectItem>
                    <SelectItem value="1_year">1 Year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_start_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Subscription Start Date
              </Label>
              <Input
                id="subscription_start_date"
                type="date"
                value={formData.subscription_start_date}
                onChange={(e) => handleChange('subscription_start_date', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  placeholder="Gym member ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fitness_goal" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Fitness Goal
                </Label>
                <Select value={formData.fitness_goal} onValueChange={(value) => handleChange('fitness_goal', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal" />
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
                  placeholder="Trainer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Emergency Contact
                </Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => handleChange('emergency_contact', e.target.value)}
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about the member"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}