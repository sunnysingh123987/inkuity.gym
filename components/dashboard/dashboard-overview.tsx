'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import QRCodeLib from 'qrcode'
import { Gym, QRCode as QRCodeType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  Users,
  Scan,
  TrendingUp,
  QrCode,
  Download,
  Copy,
  Check,
  ArrowRight,
  BarChart3,
  MapPin,
  Mail,
  Phone,
  Globe,
  UserPlus,
} from 'lucide-react'

interface DashboardOverviewProps {
  gym: Gym | null
  userName: string
  qrCodes: QRCodeType[]
  analytics: {
    totalScans: number
    uniqueVisitors: number
    todayScans: number
    weekScans: number
    topQRCode: { name: string; scans: number } | null
  }
  recentMembers: {
    id: string
    full_name: string | null
    email: string | null
    membership_status: string
    created_at: string
  }[]
  totalMembers: number
}

export function DashboardOverview({
  gym,
  userName,
  qrCodes,
  analytics,
  recentMembers,
  totalMembers,
}: DashboardOverviewProps) {
  const firstName = userName.split(' ')[0]
  const checkInQR = qrCodes.find((qr) => qr.type === 'check-in') || qrCodes[0]

  if (!gym) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {firstName ? `Welcome, ${firstName}!` : 'Welcome!'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Something went wrong loading your gym. Please try refreshing.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening at <span className="font-medium text-foreground">{gym.name}</span>
          </p>
        </div>
        <Link href="/analytics">
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={totalMembers.toLocaleString()}
          description="Registered members"
          icon={Users}
          color="text-brand-cyan-500"
        />
        <StatCard
          title="Total Check-ins"
          value={analytics.totalScans.toLocaleString()}
          description="All time"
          icon={Scan}
          color="text-brand-purple-500"
        />
        <StatCard
          title="Today"
          value={analytics.todayScans.toLocaleString()}
          description="Check-ins today"
          icon={TrendingUp}
          color="text-brand-pink-500"
        />
        <StatCard
          title="This Week"
          value={analytics.weekScans.toLocaleString()}
          description="Last 7 days"
          icon={BarChart3}
          color="text-brand-blue-600"
        />
      </div>

      {/* Two-column layout: QR Code + Gym Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Code Card */}
        {checkInQR && (
          <QRCodeCard qrCode={checkInQR} gymSlug={gym.slug} />
        )}

        {/* Gym Info Card */}
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
      </div>

      {/* Recent Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Members</CardTitle>
          <Link href="/members">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <UserPlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No members yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Members will appear here when they check in via your QR code.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentMembers.map((member) => (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="flex items-center justify-between py-3 hover:opacity-70 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-cyan-500/10 text-sm font-medium text-brand-cyan-400">
                      {(member.full_name || member.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.full_name || member.email || 'Unknown'}
                      </p>
                      {member.full_name && member.email && (
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={member.membership_status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  description: string
  icon: any
  color: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function QRCodeCard({ qrCode, gymSlug }: { qrCode: QRCodeType; gymSlug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const scanUrl = `${appUrl}/s/${qrCode.code}`

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, scanUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
    }
  }, [scanUrl])

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.href = canvasRef.current.toDataURL('image/png')
      link.download = `${gymSlug}-check-in-qr.png`
      link.click()
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(scanUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-brand-cyan-500" />
          <CardTitle className="text-base font-semibold">Check-In QR Code</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center rounded-lg bg-white p-4">
          <canvas ref={canvasRef} />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleDownload} size="sm" className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1 gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy URL
              </>
            )}
          </Button>
        </div>

        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Scan URL</p>
          <p className="text-xs font-mono text-foreground break-all">{scanUrl}</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total scans</span>
          <span className="font-semibold">{qrCode.total_scans.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400 ring-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
    expired: 'bg-red-500/10 text-red-400 ring-red-500/20',
    suspended: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
    cancelled: 'bg-muted text-muted-foreground ring-border',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        styles[status] || styles.pending
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
