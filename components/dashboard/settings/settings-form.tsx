'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile, Gym, QRCode as QRCodeType } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { updateProfile } from '@/lib/actions/profile'
import { updateGym } from '@/lib/actions/gyms'
import { QRCodeCard } from '@/components/dashboard/qr-code-card'

interface SettingsFormProps {
  profile: Profile
  gym?: Gym | null
  checkInQRCode?: QRCodeType | null
}

export function SettingsForm({ profile, gym, checkInQRCode }: SettingsFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    companyName: profile?.company_name || '',
  })
  const [gymData, setGymData] = useState({
    name: gym?.name || '',
    description: gym?.description || '',
    address: gym?.address || '',
    city: gym?.city || '',
    state: gym?.state || '',
    zip_code: gym?.zip_code || '',
    phone: gym?.phone || '',
    email: gym?.email || '',
    website: gym?.website || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      // Update profile
      const profileResult = await updateProfile({
        full_name: formData.fullName,
        phone: formData.phone,
        company_name: formData.companyName,
      })

      if (!profileResult.success) {
        setError(profileResult.error || 'Failed to update profile')
        setLoading(false)
        return
      }

      // Update gym if exists
      if (gym) {
        const gymResult = await updateGym(gym.id, {
          name: gymData.name,
          description: gymData.description || null,
          address: gymData.address || null,
          city: gymData.city || null,
          state: gymData.state || null,
          zip_code: gymData.zip_code || null,
          phone: gymData.phone || null,
          email: gymData.email || null,
          website: gymData.website || null,
        } as any)

        if (!gymResult.success) {
          setError(gymResult.error || 'Failed to update gym')
          setLoading(false)
          return
        }
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>Settings updated successfully!</AlertDescription>
          </Alert>
        )}

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Acme Fitness"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gym Profile */}
        {gym && (
          <Card>
            <CardHeader>
              <CardTitle>Gym Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gymName">Gym Name</Label>
                  <Input
                    id="gymName"
                    value={gymData.name}
                    onChange={(e) => setGymData({ ...gymData, name: e.target.value })}
                    placeholder="Iron Paradise Fitness"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gymEmail">Contact Email</Label>
                  <Input
                    id="gymEmail"
                    type="email"
                    value={gymData.email}
                    onChange={(e) => setGymData({ ...gymData, email: e.target.value })}
                    placeholder="hello@mygym.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gymPhone">Phone</Label>
                  <Input
                    id="gymPhone"
                    type="tel"
                    value={gymData.phone}
                    onChange={(e) => setGymData({ ...gymData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gymWebsite">Website</Label>
                  <Input
                    id="gymWebsite"
                    type="url"
                    value={gymData.website}
                    onChange={(e) => setGymData({ ...gymData, website: e.target.value })}
                    placeholder="https://mygym.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gymDescription">Description</Label>
                <Textarea
                  id="gymDescription"
                  value={gymData.description}
                  onChange={(e) => setGymData({ ...gymData, description: e.target.value })}
                  placeholder="Tell members about your gym..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gymAddress">Street Address</Label>
                <Input
                  id="gymAddress"
                  value={gymData.address}
                  onChange={(e) => setGymData({ ...gymData, address: e.target.value })}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="gymCity">City</Label>
                  <Input
                    id="gymCity"
                    value={gymData.city}
                    onChange={(e) => setGymData({ ...gymData, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gymState">State</Label>
                  <Input
                    id="gymState"
                    value={gymData.state}
                    onChange={(e) => setGymData({ ...gymData, state: e.target.value })}
                    placeholder="NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gymZip">ZIP Code</Label>
                  <Input
                    id="gymZip"
                    value={gymData.zip_code}
                    onChange={(e) => setGymData({ ...gymData, zip_code: e.target.value })}
                    placeholder="10001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row sm:justify-end">
          <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>

      {/* QR Code Card */}
      {checkInQRCode && gym && (
        <QRCodeCard qrCode={checkInQRCode} gymSlug={gym.slug} />
      )}

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground capitalize">
                {profile?.subscription_tier || 'Free'}
              </p>
            </div>
            <Button variant="outline">Upgrade</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
