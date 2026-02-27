'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, BarChart3, Users, Activity, Wallet, Dumbbell, Star, MessageSquare } from 'lucide-react'
import { updateDashboardSettings } from '@/lib/actions/gyms'
import { type DashboardWidgetSettings } from '@/lib/dashboard-settings'

interface DashboardCustomizerProps {
  gymId: string
  initialSettings: DashboardWidgetSettings
}

const WIDGET_CONFIG = [
  {
    key: 'statsCards' as const,
    label: 'Stats Cards',
    description: 'Member count, check-ins today, monthly revenue, and growth metrics',
    icon: BarChart3,
  },
  {
    key: 'liveCheckIns' as const,
    label: 'Live Check-ins',
    description: "Today's check-in feed showing who's at the gym right now",
    icon: Activity,
  },
  {
    key: 'recentMembers' as const,
    label: 'Recent Members',
    description: 'Latest members who joined your gym',
    icon: Users,
  },
  {
    key: 'paymentSummary' as const,
    label: 'Payment Summary',
    description: "Today's and monthly collection totals, payments due",
    icon: Wallet,
  },
  {
    key: 'workoutSessions' as const,
    label: 'Workout Sessions',
    description: "Today's workout focus breakdown (e.g., cardio, weights)",
    icon: Dumbbell,
  },
  {
    key: 'reviews' as const,
    label: 'Recent Reviews',
    description: 'Latest member reviews and ratings',
    icon: Star,
  },
  {
    key: 'feedback' as const,
    label: 'Feedback Requests',
    description: 'Pending feedback forms and responses',
    icon: MessageSquare,
  },
]

export function DashboardCustomizer({ gymId, initialSettings }: DashboardCustomizerProps) {
  const router = useRouter()
  const [settings, setSettings] = useState<DashboardWidgetSettings>(initialSettings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleToggle = (key: keyof DashboardWidgetSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    setSuccess(false)
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    const result = await updateDashboardSettings(gymId, settings)

    if (result.success) {
      setSuccess(true)
      router.refresh()
    } else {
      setError(result.error || 'Failed to save settings')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>Dashboard settings saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Widgets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {WIDGET_CONFIG.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </div>
              <Switch
                id={key}
                checked={settings[key]}
                onCheckedChange={() => handleToggle(key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/settings')}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
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
    </div>
  )
}
