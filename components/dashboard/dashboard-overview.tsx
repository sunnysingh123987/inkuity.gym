'use client'

import Link from 'next/link'
import { Gym } from '@/types/database'
import { StatsCards } from './stats-cards'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Plus, QrCode, Users } from 'lucide-react'

interface DashboardOverviewProps {
  gyms: Gym[]
}

export function DashboardOverview({ gyms }: DashboardOverviewProps) {
  const hasGyms = gyms.length > 0

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      {!hasGyms && (
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Welcome to Inkuity! 🎉</h2>
                <p className="mt-2 text-indigo-100">
                  Get started by creating your first gym. Once set up, you can generate
                  QR codes and start tracking member analytics.
                </p>
              </div>
              <Link href="/gyms/new">
                <Button variant="secondary" className="bg-white text-indigo-600 hover:bg-indigo-50">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Gym
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {hasGyms && (
        <StatsCards
          totalScans={0}
          uniqueVisitors={0}
          todayScans={0}
          weekScans={0}
          topQRCode={null}
        />
      )}

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gyms</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gyms.length}</div>
            <p className="text-xs text-muted-foreground">
              Total gym locations
            </p>
            <div className="mt-4">
              <Link href="/gyms">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Gyms
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Active QR codes
            </p>
            <div className="mt-4">
              <Link href="/qr-codes">
                <Button variant="outline" size="sm" className="w-full">
                  Manage QR Codes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Total members
            </p>
            <div className="mt-4">
              <Link href="/members">
                <Button variant="outline" size="sm" className="w-full">
                  View Members
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Gyms */}
      {hasGyms && (
        <Card>
          <CardHeader>
            <CardTitle>Your Gyms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {gyms.slice(0, 5).map((gym) => (
                <Link
                  key={gym.id}
                  href={`/gyms/${gym.id}`}
                  className="flex items-center justify-between py-4 hover:opacity-70"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">{gym.name}</p>
                      <p className="text-sm text-gray-500">
                        {gym.city}, {gym.state}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {gym.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                        Inactive
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {gyms.length > 5 && (
              <div className="mt-4 pt-4 border-t">
                <Link href="/gyms">
                  <Button variant="ghost" className="w-full">
                    View all gyms
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
