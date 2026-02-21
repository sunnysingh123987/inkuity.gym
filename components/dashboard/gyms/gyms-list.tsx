'use client'

import Link from 'next/link'
import { Gym } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Building2, MapPin, Users } from 'lucide-react'

interface GymsListProps {
  gyms: Gym[]
}

export function GymsList({ gyms }: GymsListProps) {
  const hasGyms = gyms.length > 0

  if (!hasGyms) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No gyms yet</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            Create your first gym to start generating QR codes and tracking member analytics.
          </p>
          <Link href="/gyms/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Gym
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-end">
        <Link href="/gyms/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Gym
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {gyms.map((gym) => (
          <Link key={gym.id} href={`/gyms/${gym.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      gym.is_active
                        ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                        : 'bg-muted text-muted-foreground ring-border'
                    }`}
                  >
                    {gym.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold text-foreground">{gym.name}</h3>
                  {gym.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {gym.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span className="truncate">
                      {gym.city}, {gym.state}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span>0 members</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
