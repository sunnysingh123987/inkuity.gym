'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gym } from '@/types/database'
import { createQRCode } from '@/lib/actions/gyms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Check } from 'lucide-react'

interface CreateQRCodeFormProps {
  gyms: Gym[]
}

const QR_TYPES = [
  { value: 'check-in', label: 'Check-in', description: 'Members check in to the gym' },
  { value: 'equipment', label: 'Equipment', description: 'Track equipment usage' },
  { value: 'class', label: 'Class', description: 'Class check-ins' },
  { value: 'promotion', label: 'Promotion', description: 'Special offers and promotions' },
  { value: 'custom', label: 'Custom', description: 'Custom redirect URL' },
]

export function CreateQRCodeForm({ gyms }: CreateQRCodeFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('check-in')
  const [color, setColor] = useState('#000000')

  const hasGyms = gyms.length > 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createQRCode({
        gym_id: formData.get('gym_id') as string,
        name: formData.get('name') as string,
        label: formData.get('label') as string,
        type: selectedType as any,
        redirect_url: formData.get('redirect_url') as string,
        primary_color: color,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create QR code')
        setLoading(false)
        return
      }

      const created = result.data
      router.push(`/qr-codes/${created?.id}`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!hasGyms) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              You need to create a gym first before you can create QR codes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="gym_id">Gym *</Label>
            <select
              id="gym_id"
              name="gym_id"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select a gym</option>
              {gyms.map((gym) => (
                <option key={gym.id} value={gym.id}>
                  {gym.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">QR Code Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Main Entrance Check-in"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Display Label</Label>
            <Input
              id="label"
              name="label"
              placeholder="Main Entrance"
            />
            <p className="text-xs text-muted-foreground">
              This will be shown on the public landing page
            </p>
          </div>

          <div className="space-y-2">
            <Label>QR Code Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QR_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                    selectedType === type.value
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-border hover:border-border'
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      selectedType === type.value
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-border'
                    }`}
                  >
                    {selectedType === type.value && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedType === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="redirect_url">Custom Redirect URL</Label>
              <Input
                id="redirect_url"
                name="redirect_url"
                type="url"
                placeholder="https://example.com/landing-page"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>QR Code Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 rounded-md border border-input"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#000000"
                className="w-32"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create QR Code'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
