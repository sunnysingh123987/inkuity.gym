'use client'

import Link from 'next/link'
import { Gym } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, MapPin, Mail, Phone, Globe } from 'lucide-react'

export function GymInfoCard({ gym }: { gym: Gym }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Your Gym</CardTitle>
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="text-xs">
            Edit
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {gym.logo_url ? (
            <img
              src={gym.logo_url}
              alt={gym.name}
              className="h-12 w-12 rounded-lg object-cover border border-border"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-cyan-500/10">
              <Building2 className="h-6 w-6 text-brand-cyan-500" />
            </div>
          )}
          <div>
            <p className="font-semibold">{gym.name}</p>
            {gym.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{gym.description}</p>
            )}
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          {(gym.address || gym.city) && (
            <div className="flex items-start gap-2.5 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {[gym.address, gym.city, gym.state, gym.zip_code].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          {gym.phone && (
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{gym.phone}</span>
            </div>
          )}
          {gym.email && (
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{gym.email}</span>
            </div>
          )}
          {gym.website && (
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Globe className="h-4 w-4 shrink-0" />
              <span className="truncate">{gym.website}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            {gym.is_active ? (
              <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Portal URL</span>
            <span className="font-mono text-xs text-brand-cyan-400">/{gym.slug}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
