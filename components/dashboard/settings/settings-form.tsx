'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Profile, Gym, QRCode as QRCodeType } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Loader2,
  MapPin,
  LocateFixed,
  LayoutDashboard,
  User,
  Building2,
  Phone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Share2,
  QrCode,
  Download,
  Bell,
  Pencil,
  Image as ImageIcon,
  Upload,
} from 'lucide-react'
import Link from 'next/link'
import { updateProfile } from '@/lib/actions/profile'
import { updateGym } from '@/lib/actions/gyms'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { QRCodeCard } from '@/components/dashboard/qr-code-card'
import { toast } from '@/components/ui/toaster'

interface SettingsFormProps {
  profile: Profile
  gym?: Gym | null
  checkInQRCode?: QRCodeType | null
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function SettingsForm({ profile, gym, checkInQRCode }: SettingsFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Profile edit dialog
  const [profileOpen, setProfileOpen] = useState(false)
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    companyName: profile?.company_name || '',
  })

  // Gym edit dialog
  const [gymOpen, setGymOpen] = useState(false)
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

  // Geofence edit dialog
  const [geoOpen, setGeoOpen] = useState(false)
  const [geoData, setGeoData] = useState({
    latitude: (gym?.settings as any)?.latitude?.toString() || '',
    longitude: (gym?.settings as any)?.longitude?.toString() || '',
    geofence_radius: (gym?.settings as any)?.geofence_radius?.toString() || '6',
    require_location_checkin: (gym?.settings as any)?.require_location_checkin !== false,
  })
  const [geoLoading, setGeoLoading] = useState(false)

  // Notification preferences
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState({
    checkin_confirmation: (gym?.settings as any)?.notification_preferences?.checkin_confirmation !== false,
    payment_reminder: (gym?.settings as any)?.notification_preferences?.payment_reminder !== false,
    announcement_email: (gym?.settings as any)?.notification_preferences?.announcement_email !== false,
    expiry_reminder: (gym?.settings as any)?.notification_preferences?.expiry_reminder !== false,
  })

  // Referral code
  const existingReferralCode = (gym?.settings as any)?.referral_code || ''
  const [referralCode, setReferralCode] = useState(existingReferralCode)
  const [codeCopied, setCodeCopied] = useState(false)

  // Logo upload
  const [logoUrl, setLogoUrl] = useState(gym?.logo_url || '')
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Phone verification
  const [phoneVerified] = useState(false) // Placeholder for now

  // Save profile
  const handleSaveProfile = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await updateProfile({
        full_name: formData.fullName,
        phone: formData.phone,
        company_name: formData.companyName,
      })
      if (!result.success) {
        setError(result.error || 'Failed to update profile')
      } else {
        toast.success('Profile updated')
        setProfileOpen(false)
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Save gym
  const handleSaveGym = async () => {
    if (!gym) return
    setError('')
    setLoading(true)
    try {
      const result = await updateGym(gym.id, {
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
      if (!result.success) {
        setError(result.error || 'Failed to update gym')
      } else {
        toast.success('Gym profile updated')
        setGymOpen(false)
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Save geofence
  const handleSaveGeo = async () => {
    if (!gym) return
    setError('')
    setLoading(true)
    try {
      const existingSettings = (gym.settings || {}) as Record<string, any>
      const lat = geoData.latitude ? parseFloat(geoData.latitude) : undefined
      const lng = geoData.longitude ? parseFloat(geoData.longitude) : undefined
      const radius = geoData.geofence_radius ? parseInt(geoData.geofence_radius, 10) : 6

      const updatedSettings = {
        ...existingSettings,
        ...(lat != null && !isNaN(lat) ? { latitude: lat } : {}),
        ...(lng != null && !isNaN(lng) ? { longitude: lng } : {}),
        geofence_radius: radius,
        require_location_checkin: geoData.require_location_checkin,
      }
      if (!geoData.latitude) delete updatedSettings.latitude
      if (!geoData.longitude) delete updatedSettings.longitude

      const result = await updateGym(gym.id, { settings: updatedSettings } as any)
      if (!result.success) {
        setError(result.error || 'Failed to update geofence')
      } else {
        toast.success('Geofence settings updated')
        setGeoOpen(false)
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Save notification preferences
  const handleSaveNotifPrefs = async () => {
    if (!gym) return
    setLoading(true)
    try {
      const existingSettings = (gym.settings || {}) as Record<string, any>
      const result = await updateGym(gym.id, {
        settings: { ...existingSettings, notification_preferences: notifPrefs },
      } as any)
      if (result.success) {
        toast.success('Notification preferences saved')
        setNotifOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to save')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Generate & save referral code
  const handleGenerateReferral = async () => {
    if (!gym) return
    const code = generateReferralCode()
    setReferralCode(code)
    const existingSettings = (gym.settings || {}) as Record<string, any>
    const result = await updateGym(gym.id, {
      settings: { ...existingSettings, referral_code: code },
    } as any)
    if (result.success) {
      toast.success('Referral code generated')
      router.refresh()
    } else {
      toast.error('Failed to save referral code')
    }
  }

  const handleCopyReferral = () => {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    if (!referralCode) return
    const text = `Join ${gym?.name || 'our gym'}! Use my referral code: ${referralCode}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Logo upload placeholder
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !gym) return
    setLogoUploading(true)
    // For now, show a placeholder since we'd need Supabase storage upload
    toast.info('Logo upload will be available soon')
    setLogoUploading(false)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ─── CARD GRID ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setProfileOpen(true)}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Profile</p>
                  <p className="text-sm text-muted-foreground">{formData.fullName || 'Not set'}</p>
                </div>
              </div>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-muted-foreground">{formData.email}</p>
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground">{formData.phone || 'No phone'}</p>
                {formData.phone && (
                  phoneVerified
                    ? <CheckCircle2 className="h-3 w-3 text-green-400" />
                    : <AlertCircle className="h-3 w-3 text-yellow-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gym Profile Card */}
        {gym && (
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setGymOpen(true)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Gym logo" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-cyan-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">Gym Profile</p>
                    <p className="text-sm text-muted-foreground">{gymData.name || 'Not set'}</p>
                  </div>
                </div>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-muted-foreground">{gymData.address || 'No address'}{gymData.city ? `, ${gymData.city}` : ''}</p>
                <p className="text-xs text-muted-foreground">{gymData.phone || 'No phone'} {gymData.email ? `• ${gymData.email}` : ''}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Geofence Card */}
        {gym && (
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setGeoOpen(true)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Check-in Location</p>
                    <p className="text-sm text-muted-foreground">
                      {!geoData.require_location_checkin
                        ? 'Disabled'
                        : geoData.latitude && geoData.longitude
                          ? `${geoData.geofence_radius || 6}m radius`
                          : 'Not configured'}
                    </p>
                  </div>
                </div>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </div>
              {geoData.latitude && geoData.longitude && (
                <p className="mt-3 text-xs text-muted-foreground">
                  ({parseFloat(geoData.latitude).toFixed(4)}, {parseFloat(geoData.longitude).toFixed(4)})
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notification Preferences Card */}
        {gym && (
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setNotifOpen(true)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      {Object.values(notifPrefs).filter(Boolean).length}/{Object.values(notifPrefs).length} enabled
                    </p>
                  </div>
                </div>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {notifPrefs.checkin_confirmation && <Badge variant="secondary" className="text-[10px]">Check-in</Badge>}
                {notifPrefs.payment_reminder && <Badge variant="secondary" className="text-[10px]">Payments</Badge>}
                {notifPrefs.announcement_email && <Badge variant="secondary" className="text-[10px]">Announcements</Badge>}
                {notifPrefs.expiry_reminder && <Badge variant="secondary" className="text-[10px]">Expiry</Badge>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── REFERRAL CODE SECTION ─── */}
      {gym && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {referralCode ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
                  <span className="text-2xl font-bold tracking-widest text-foreground">{referralCode}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyReferral} className="gap-1.5">
                    {codeCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {codeCopied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="gap-1.5 text-green-500 border-green-500/30 hover:bg-green-500/10">
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-sm text-muted-foreground">Generate a referral code to share with potential members.</p>
                <Button onClick={handleGenerateReferral}>Generate Code</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── GYM LOGO ─── */}
      {gym && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Gym Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Gym logo" className="h-16 w-16 rounded-lg object-cover border border-border" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center border border-border">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={logoUploading} className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  {logoUploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP. Max 2MB.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── QR CODE (compact) ─── */}
      {checkInQRCode && gym && (
        <QRCodeCard qrCode={checkInQRCode} gymSlug={gym.slug} />
      )}

      {/* ─── DASHBOARD CUSTOMIZATION ─── */}
      {gym && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <LayoutDashboard className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Dashboard</p>
                  <p className="text-xs text-muted-foreground">Customize widgets and sections</p>
                </div>
              </div>
              <Link href="/settings/dashboard">
                <Button variant="outline" size="sm">Customize</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── SUBSCRIPTION ─── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Subscription</p>
              <p className="text-xs text-muted-foreground capitalize">
                Current plan: <strong>{profile?.subscription_tier || 'Free'}</strong>
              </p>
            </div>
            <Button variant="outline" size="sm">Upgrade</Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── DIALOGS ─── */}

      {/* Profile Edit Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="flex-1"
                />
                <Button variant="outline" size="sm" disabled className="gap-1 shrink-0" title="Phone verification coming soon">
                  {phoneVerified ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Phone className="h-4 w-4" />}
                  {phoneVerified ? 'Verified' : 'Verify'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="Acme Fitness" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gym Edit Dialog */}
      {gym && (
        <Dialog open={gymOpen} onOpenChange={setGymOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Gym Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gym Name</Label>
                  <Input value={gymData.name} onChange={(e) => setGymData({ ...gymData, name: e.target.value })} placeholder="Iron Paradise Fitness" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input type="email" value={gymData.email} onChange={(e) => setGymData({ ...gymData, email: e.target.value })} placeholder="hello@mygym.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" value={gymData.phone} onChange={(e) => setGymData({ ...gymData, phone: e.target.value })} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input type="url" value={gymData.website} onChange={(e) => setGymData({ ...gymData, website: e.target.value })} placeholder="https://mygym.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={gymData.description} onChange={(e) => setGymData({ ...gymData, description: e.target.value })} placeholder="Tell members about your gym..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input value={gymData.address} onChange={(e) => setGymData({ ...gymData, address: e.target.value })} placeholder="123 Main Street" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={gymData.city} onChange={(e) => setGymData({ ...gymData, city: e.target.value })} placeholder="New York" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={gymData.state} onChange={(e) => setGymData({ ...gymData, state: e.target.value })} placeholder="NY" />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input value={gymData.zip_code} onChange={(e) => setGymData({ ...gymData, zip_code: e.target.value })} placeholder="10001" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGymOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveGym} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Geofence Edit Dialog */}
      {gym && (
        <Dialog open={geoOpen} onOpenChange={setGeoOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Check-in Location Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set your gym&apos;s coordinates to restrict QR check-ins to members physically at the gym.
              </p>
              <label className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">Require Location for Check-in</p>
                  <p className="text-xs text-muted-foreground">Members must be near the gym to check in</p>
                </div>
                <input
                  type="checkbox"
                  checked={geoData.require_location_checkin}
                  onChange={(e) => setGeoData({ ...geoData, require_location_checkin: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">Latitude <InfoTooltip text="Your gym's latitude coordinate." /></Label>
                  <Input type="number" step="any" value={geoData.latitude} onChange={(e) => setGeoData({ ...geoData, latitude: e.target.value })} placeholder="e.g. 40.7128" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">Longitude <InfoTooltip text="Your gym's longitude coordinate." /></Label>
                  <Input type="number" step="any" value={geoData.longitude} onChange={(e) => setGeoData({ ...geoData, longitude: e.target.value })} placeholder="e.g. -74.0060" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">Geofence Radius (meters) <InfoTooltip text="Max distance a member can be from your gym to check in. Default: 6m." /></Label>
                <Input type="number" min="5" max="5000" value={geoData.geofence_radius} onChange={(e) => setGeoData({ ...geoData, geofence_radius: e.target.value })} placeholder="6" />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={geoLoading}
                onClick={() => {
                  if (!navigator.geolocation) {
                    setError('Geolocation is not supported by your browser')
                    return
                  }
                  setGeoLoading(true)
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setGeoData({
                        ...geoData,
                        latitude: position.coords.latitude.toFixed(8),
                        longitude: position.coords.longitude.toFixed(8),
                      })
                      setGeoLoading(false)
                    },
                    (err) => {
                      setError(`Failed to get location: ${err.message}`)
                      setGeoLoading(false)
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                  )
                }}
              >
                {geoLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Getting location...</>
                ) : (
                  <><LocateFixed className="mr-2 h-4 w-4" />Get Current Location</>
                )}
              </Button>
              {geoData.latitude && geoData.longitude && (
                <p className="text-xs text-muted-foreground">
                  Members must be within <strong>{geoData.geofence_radius || 6}m</strong> of ({geoData.latitude}, {geoData.longitude}) to check in.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGeoOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveGeo} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Notification Preferences Dialog */}
      {gym && (
        <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Notification Preferences</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure which notifications are sent to your members.
              </p>
              {[
                { key: 'checkin_confirmation' as const, label: 'Check-in Confirmation', desc: 'Send email when a member checks in' },
                { key: 'payment_reminder' as const, label: 'Payment Reminders', desc: 'Remind members about upcoming payments' },
                { key: 'announcement_email' as const, label: 'Announcement Emails', desc: 'Send announcements via email to members' },
                { key: 'expiry_reminder' as const, label: 'Expiry Reminders', desc: 'Notify members when subscription is about to expire' },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs[item.key]}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotifOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveNotifPrefs} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
