import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGymById } from '@/lib/actions/gyms'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, MapPin, Phone, Mail, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Gym Details - Inkuity',
  description: 'View and manage gym details',
}

interface GymDetailPageProps {
  params: { id: string }
}

export default async function GymDetailPage({ params }: GymDetailPageProps) {
  const { data: gym, error } = await getGymById(params.id)

  if (error || !gym) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/gyms"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Gyms
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{gym.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage this gym location
          </p>
        </div>
        <Link href="/qr-codes/new">
          <Button>Create QR Code</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gym.description && (
              <p className="text-sm text-muted-foreground">{gym.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  gym.is_active ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground'
                }`}
              >
                {gym.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-muted-foreground">Slug: {gym.slug}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gym.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{gym.address}</span>
              </div>
            )}
            {(gym.city || gym.state || gym.zip_code) && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>
                  {[gym.city, gym.state, gym.zip_code].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {gym.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${gym.phone}`} className="text-indigo-600 hover:underline">
                  {gym.phone}
                </a>
              </div>
            )}
            {gym.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${gym.email}`} className="text-indigo-600 hover:underline">
                  {gym.email}
                </a>
              </div>
            )}
            {!gym.address && !gym.phone && !gym.email && (
              <p className="text-sm text-muted-foreground">No contact or location details added yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href={`/qr-codes?gymId=${gym.id}`}>
            <Button variant="outline">View QR codes</Button>
          </Link>
          <Link href={`/members`}>
            <Button variant="outline">View members</Button>
          </Link>
          <Link href={`/analytics`}>
            <Button variant="outline">View analytics</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
