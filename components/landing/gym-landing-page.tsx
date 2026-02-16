'use client'

import { useState } from 'react'
import { Gym, Member } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { checkInMember } from '@/lib/actions/gyms'
import { MemberOnboardingForm } from './member-onboarding-form'
import { QRCodeScanner } from '@/components/qr-scanner/qr-code-scanner'
import { toast } from 'sonner'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  LogIn,
  BarChart3,
  CheckCircle,
  QrCode,
  AlertCircle,
  Loader2,
  UserCircle,
} from 'lucide-react'
import Link from 'next/link'

interface GymLandingPageProps {
  gym: Gym
  scanId?: string
  qrCode?: string
}

type CheckInState = 'form' | 'onboarding' | 'success'

export function GymLandingPage({ gym, scanId, qrCode }: GymLandingPageProps) {
  const [email, setEmail] = useState('')
  const [checkInState, setCheckInState] = useState<CheckInState>('form')
  const [loading, setLoading] = useState(false)
  const [member, setMember] = useState<Member | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [lastCheckInTime, setLastCheckInTime] = useState<string | null>(null)

  const handleCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await checkInMember({
        email,
        gymId: gym.id,
        scanId,
      })

      if (result.success && result.member) {
        setMember(result.member)
        if (result.isNewMember) {
          toast.success('Welcome! Please complete your profile')
          setCheckInState('onboarding')
        } else {
          toast.success('Check-in successful! 🎉')
          setCheckInState('success')
        }
      } else {
        // Handle specific errors
        if (result.error === 'DAILY_LIMIT_REACHED') {
          setError('You\'ve already checked in today. See you tomorrow!')
          setLastCheckInTime(result.lastCheckIn || null)
          toast.error('Already checked in today')
        } else {
          setError(result.error || 'Check-in failed. Please try again.')
          toast.error('Check-in failed')
        }
      }
    } catch (error) {
      setError('An error occurred during check-in. Please try again.')
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleScanSuccess = (code: string) => {
    setShowScanner(false)
    toast.success('QR code scanned successfully!')
    // You can use the code if needed, but for now just proceed to check-in
    // The scan was already recorded when they scanned via /s/[code] route
    // So just show the check-in form or auto-check-in if email is provided
  }

  const handleOnboardingComplete = () => {
    setCheckInState('success')
  }

  if (checkInState === 'onboarding' && member) {
    return <MemberOnboardingForm member={member} gym={gym} onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            {gym.logo_url ? (
              <img
                src={gym.logo_url}
                alt={gym.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-brand-cyan-500 to-brand-purple-500"
              >
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{gym.name}</h1>
              <p className="text-sm text-gray-500">Powered by Inkuity</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gym Info */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {gym.description && (
                <p className="text-gray-600">{gym.description}</p>
              )}

              <div className="space-y-3">
                {gym.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-900">{gym.address}</p>
                      <p className="text-sm text-gray-500">
                        {gym.city}, {gym.state} {gym.zip_code}
                      </p>
                    </div>
                  </div>
                )}

                {gym.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a
                      href={`tel:${gym.phone}`}
                      className="text-sm text-brand-cyan-500 hover:underline"
                    >
                      {gym.phone}
                    </a>
                  </div>
                )}

                {gym.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <a
                      href={`mailto:${gym.email}`}
                      className="text-sm text-brand-cyan-500 hover:underline"
                    >
                      {gym.email}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-600">Open 24/7</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check-in */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Check In
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkInState === 'success' ? (
                <div className="text-center py-6">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Check-in successful!
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Welcome back{ member?.full_name ? `, ${member.full_name}` : ''}!
                    You've been checked in to {gym.name}.
                  </p>

                  {/* Portal Access Button */}
                  <div className="space-y-3">
                    <Link
                      href={`/${gym.slug}/portal/sign-in?gymId=${gym.id}&gymName=${encodeURIComponent(gym.name)}${gym.logo_url ? `&gymLogo=${encodeURIComponent(gym.logo_url)}` : ''}`}
                    >
                      <Button className="w-full" variant="default">
                        <UserCircle className="h-4 w-4 mr-2" />
                        Access Member Portal
                      </Button>
                    </Link>
                    <p className="text-xs text-gray-500">
                      Track workouts, view progress, and manage your fitness journey
                    </p>
                  </div>
                </div>
              ) : checkInState === 'onboarding' && member ? (
                <MemberOnboardingForm
                  member={member}
                  gym={gym}
                  onComplete={handleOnboardingComplete}
                />
              ) : (
                <>
                  {/* Error Alert */}
                  {error && (
                    <Alert className="mb-4 border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {error}
                        {lastCheckInTime && (
                          <p className="mt-1 text-sm">
                            Last check-in: {new Date(lastCheckInTime).toLocaleString()}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* QR Scanner Button */}
                  <div className="mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-2 border-brand-cyan-200 hover:border-brand-cyan-300 hover:bg-brand-cyan-50"
                      onClick={() => setShowScanner(true)}
                    >
                      <QrCode className="mr-2 h-5 w-5 text-brand-cyan-500" />
                      Scan QR Code
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">or check in with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleCheckIn} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Enter your email to check in</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                      style={{
                        backgroundColor: '#06b6d4',
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking in...
                        </>
                      ) : (
                        'Check In'
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                      By checking in, you agree to our terms of service.
                    </p>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Member Portal Preview */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-brand-cyan-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-brand-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Member Portal</p>
                  <p className="text-sm text-gray-500">
                    Track workouts, manage diet plans, and view your fitness progress
                  </p>
                </div>
              </div>
              <Link
                href={`/${gym.slug}/portal/sign-in?gymId=${gym.id}&gymName=${encodeURIComponent(gym.name)}${gym.logo_url ? `&gymLogo=${encodeURIComponent(gym.logo_url)}` : ''}`}
              >
                <Button variant="outline">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Access Portal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {gym.name}. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Powered by{' '}
              <a
                href="https://inkuity.com"
                className="text-brand-cyan-500 hover:underline"
              >
                Inkuity
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRCodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
