'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gym } from '@/types/database'
import { createMember } from '@/lib/actions/gyms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface CreateMemberFormProps {
  gyms: Gym[]
}

export function CreateMemberForm({ gyms }: CreateMemberFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const hasGyms = gyms.length > 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const result = await createMember({
      gym_id: formData.get('gym_id') as string,
      full_name: (formData.get('full_name') as string) || undefined,
      email: (formData.get('email') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
    })

    setLoading(false)

    if (result.success) {
      router.push('/members')
      router.refresh()
    } else {
      setError(result.error || 'Failed to add member')
    }
  }

  if (!hasGyms) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Create a gym first before adding members. <Link href="/gyms/new" className="font-medium text-indigo-600 hover:underline">Add a gym</Link>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" placeholder="John Doe" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="john@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+1 234 567 8900" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add member'
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
      </CardContent>
    </Card>
  )
}
