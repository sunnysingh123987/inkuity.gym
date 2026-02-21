'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMember } from '@/lib/actions/gyms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface CreateMemberFormProps {
  gymId: string
}

export function CreateMemberForm({ gymId }: CreateMemberFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!gymId) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Create a gym first before adding members.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const fullName = (formData.get('full_name') as string)?.trim()
    if (!fullName) {
      setError('Full name is required')
      setLoading(false)
      return
    }

    const metadata: Record<string, any> = {}

    // Height in feet/inches
    const heightFt = formData.get('height_ft') as string
    const heightIn = formData.get('height_in') as string
    if (heightFt || heightIn) {
      metadata.height_ft = parseInt(heightFt) || 0
      metadata.height_in = parseInt(heightIn) || 0
    }

    const weight = formData.get('weight') as string
    if (weight) metadata.weight = weight

    const emergencyName = (formData.get('emergency_name') as string)?.trim()
    const emergencyPhone = (formData.get('emergency_phone') as string)?.trim()
    if (emergencyName) metadata.emergency_contact_name = emergencyName
    if (emergencyPhone) metadata.emergency_contact_phone = emergencyPhone

    const medicalConditions = (formData.get('medical_conditions') as string)?.trim()
    if (medicalConditions) metadata.medical_conditions = medicalConditions

    const result = await createMember({
      gym_id: gymId,
      full_name: fullName,
      email: (formData.get('email') as string)?.trim() || undefined,
      phone: (formData.get('phone') as string)?.trim() || undefined,
      birth_date: (formData.get('birth_date') as string) || undefined,
      gender: (formData.get('gender') as string) || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    })

    setLoading(false)

    if (result.success) {
      router.push('/members')
      router.refresh()
    } else {
      setError(result.error || 'Failed to add member')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" name="full_name" placeholder="John Doe" required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+1 234 567 8900" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Date of Birth</Label>
              <Input id="birth_date" name="birth_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                name="gender"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      {/* Body Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Body Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Height</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Input id="height_ft" name="height_ft" type="number" min="0" max="8" placeholder="5" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <Input id="height_in" name="height_in" type="number" min="0" max="11" placeholder="10" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">in</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" name="weight" type="number" placeholder="70" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency & Medical */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency & Medical</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency_name">Emergency Contact Name</Label>
              <Input id="emergency_name" name="emergency_name" placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
              <Input id="emergency_phone" name="emergency_phone" type="tel" placeholder="+1 234 567 8900" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_conditions">Medical Conditions / Injuries</Label>
            <Textarea
              id="medical_conditions"
              name="medical_conditions"
              placeholder="Any conditions, injuries, or allergies trainers should be aware of..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Member'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/members')}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
