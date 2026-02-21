'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { completeOnboarding, uploadGymLogo, checkPhoneAvailability } from '@/lib/actions/onboarding'
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Building2,
  Phone,
  ImagePlus,
  CheckCircle2,
  Sparkles,
  X,
  AlertCircle,
  ShieldCheck,
  ShieldX,
} from 'lucide-react'

interface OnboardingWizardProps {
  userName: string
  userEmail: string
}

interface GymFormData {
  name: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  phone: string
  email: string
  website: string
  logo_url: string
}

const STEPS = ['Welcome', 'Gym Details', 'Contact Info', 'Logo', 'Review']

export function OnboardingWizard({ userName, userEmail }: OnboardingWizardProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState<GymFormData>({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: userEmail,
    website: '',
    logo_url: '',
  })

  // Phone validation state
  const [phoneStatus, setPhoneStatus] = useState<{
    checking: boolean
    valid: boolean
    available: boolean
    error?: string
  }>({ checking: false, valid: true, available: true })

  const progress = ((currentStep + 1) / STEPS.length) * 100

  function updateField(field: keyof GymFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case 0:
        return true
      case 1:
        return formData.name.trim().length > 0
      case 2:
        // If phone is entered, it must be valid and available
        if (formData.phone.replace(/\D/g, '').length > 0) {
          return phoneStatus.valid && phoneStatus.available && !phoneStatus.checking
        }
        return true // Contact info is optional if no phone entered
      case 3:
        return true // Logo is optional
      case 4:
        return true
      default:
        return false
    }
  }

  function handleNext() {
    setError('')
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  function handleBack() {
    setError('')
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingLogo(true)
    setError('')

    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = await uploadGymLogo(fd)

      if (!result.success) {
        setError(result.error || 'Failed to upload logo')
        setLogoPreview(null)
        return
      }

      updateField('logo_url', result.url!)
    } catch {
      setError('Failed to upload logo. Please try again.')
      setLogoPreview(null)
    } finally {
      setUploadingLogo(false)
    }
  }

  function removeLogo() {
    setLogoPreview(null)
    updateField('logo_url', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)

    try {
      const result = await completeOnboarding({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        zip_code: formData.zip_code.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        logo_url: formData.logo_url || undefined,
      })

      if (!result.success) {
        setError(result.error || 'Something went wrong. Please try again.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          <span>{STEPS[currentStep]}</span>
        </div>
        <Progress value={progress} className="h-2" indicatorClassName="gradient-brand" />
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card className="hover:shadow-sm">
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <StepWelcome userName={userName} />
          )}
          {currentStep === 1 && (
            <StepGymDetails formData={formData} updateField={updateField} />
          )}
          {currentStep === 2 && (
            <StepContactInfo
              formData={formData}
              updateField={updateField}
              phoneStatus={phoneStatus}
              setPhoneStatus={setPhoneStatus}
            />
          )}
          {currentStep === 3 && (
            <StepLogoUpload
              logoPreview={logoPreview}
              uploadingLogo={uploadingLogo}
              fileInputRef={fileInputRef}
              onUpload={handleLogoUpload}
              onRemove={removeLogo}
            />
          )}
          {currentStep === 4 && (
            <StepReview formData={formData} logoPreview={logoPreview} />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || loading}
          className={currentStep === 0 ? 'invisible' : ''}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="gradient-brand text-white border-0"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating your gym...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create My Gym
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function StepWelcome({ userName }: { userName: string }) {
  const firstName = userName.split(' ')[0]
  return (
    <div className="text-center space-y-4 py-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full gradient-brand">
        <Building2 className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold">
        {firstName ? `Welcome, ${firstName}!` : 'Welcome!'}
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        Let's get your gym set up on Inkuity. This only takes a minute.
        We'll create your gym profile and a QR code for member check-ins.
      </p>
    </div>
  )
}

function StepGymDetails({
  formData,
  updateField,
}: {
  formData: GymFormData
  updateField: (field: keyof GymFormData, value: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="h-5 w-5 text-brand-cyan-500" />
        <h2 className="text-lg font-semibold">Gym Details</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Gym Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g. Iron Paradise Fitness"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Tell members about your gym..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Street Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="123 Main Street"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="New York"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => updateField('state', e.target.value)}
            placeholder="NY"
          />
        </div>
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input
            id="zip_code"
            value={formData.zip_code}
            onChange={(e) => updateField('zip_code', e.target.value)}
            placeholder="10001"
          />
        </div>
      </div>
    </div>
  )
}

function StepContactInfo({
  formData,
  updateField,
  phoneStatus,
  setPhoneStatus,
}: {
  formData: GymFormData
  updateField: (field: keyof GymFormData, value: string) => void
  phoneStatus: { checking: boolean; valid: boolean; available: boolean; error?: string }
  setPhoneStatus: (status: { checking: boolean; valid: boolean; available: boolean; error?: string }) => void
}) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkPhone = useCallback(
    (phone: string) => {
      // Clear any pending check
      if (debounceRef.current) clearTimeout(debounceRef.current)

      const digits = phone.replace(/\D/g, '')

      // If empty, reset to valid
      if (digits.length === 0) {
        setPhoneStatus({ checking: false, valid: true, available: true })
        return
      }

      // Quick client-side validation
      if (digits.length < 10) {
        setPhoneStatus({ checking: false, valid: false, available: false, error: 'Phone number must be at least 10 digits' })
        return
      }
      if (digits.length > 15) {
        setPhoneStatus({ checking: false, valid: false, available: false, error: 'Phone number is too long' })
        return
      }

      // Debounced server check for uniqueness
      setPhoneStatus({ checking: true, valid: true, available: true })
      debounceRef.current = setTimeout(async () => {
        try {
          const result = await checkPhoneAvailability(phone)
          setPhoneStatus({
            checking: false,
            valid: result.valid,
            available: result.available,
            error: result.error,
          })
        } catch {
          setPhoneStatus({ checking: false, valid: true, available: true })
        }
      }, 600)
    },
    [setPhoneStatus],
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handlePhoneChange(value: string) {
    updateField('phone', value)
    checkPhone(value)
  }

  const phoneDigits = formData.phone.replace(/\D/g, '')
  const hasPhone = phoneDigits.length > 0
  const showError = hasPhone && !phoneStatus.checking && (!phoneStatus.valid || !phoneStatus.available)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Phone className="h-5 w-5 text-brand-cyan-500" />
        <h2 className="text-lg font-semibold">Contact Information</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Optional — this info will appear on your gym's public page.
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="phone">Phone Number</Label>
          {hasPhone && !phoneStatus.checking && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <ShieldX className="h-3 w-3" />
              Not Verified
            </span>
          )}
        </div>
        <div className="relative">
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="(555) 123-4567"
            className={showError ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {phoneStatus.checking && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {hasPhone && !phoneStatus.checking && phoneStatus.valid && phoneStatus.available && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          )}
          {showError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          )}
        </div>
        {showError && phoneStatus.error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {phoneStatus.error}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Contact Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="hello@mygym.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => updateField('website', e.target.value)}
          placeholder="https://mygym.com"
        />
      </div>
    </div>
  )
}

function StepLogoUpload({
  logoPreview,
  uploadingLogo,
  fileInputRef,
  onUpload,
  onRemove,
}: {
  logoPreview: string | null
  uploadingLogo: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <ImagePlus className="h-5 w-5 text-brand-cyan-500" />
        <h2 className="text-lg font-semibold">Gym Logo</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Optional — upload your gym's logo. You can always add or change this later.
      </p>

      {logoPreview ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="h-32 w-32 rounded-xl object-cover border border-border"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {uploadingLogo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingLogo}
          className="w-full rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-brand-cyan-500/50 hover:bg-brand-cyan-500/5"
        >
          {uploadingLogo ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Click to upload a logo</span>
              <span className="text-xs text-muted-foreground">JPG, PNG, WebP, or SVG up to 2MB</span>
            </div>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={onUpload}
        className="hidden"
      />
    </div>
  )
}

function StepReview({
  formData,
  logoPreview,
}: {
  formData: GymFormData
  logoPreview: string | null
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="h-5 w-5 text-brand-cyan-500" />
        <h2 className="text-lg font-semibold">Review & Create</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Here's a summary of your gym. A check-in QR code will be automatically created for you.
      </p>

      <div className="space-y-4 rounded-lg bg-secondary/50 p-4">
        {/* Logo + Name */}
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Logo"
              className="h-14 w-14 rounded-lg object-cover border border-border"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-cyan-500/10">
              <Building2 className="h-7 w-7 text-brand-cyan-500" />
            </div>
          )}
          <div>
            <p className="font-semibold text-lg">{formData.name}</p>
            {formData.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{formData.description}</p>
            )}
          </div>
        </div>

        {/* Location */}
        {(formData.address || formData.city || formData.state) && (
          <ReviewRow
            label="Location"
            value={[formData.address, formData.city, formData.state, formData.zip_code]
              .filter(Boolean)
              .join(', ')}
          />
        )}

        {/* Contact */}
        {formData.phone && <ReviewRow label="Phone" value={formData.phone} />}
        {formData.email && <ReviewRow label="Email" value={formData.email} />}
        {formData.website && <ReviewRow label="Website" value={formData.website} />}
      </div>

      <div className="rounded-lg border border-brand-cyan-500/20 bg-brand-cyan-500/5 p-3 text-sm text-muted-foreground">
        A <span className="font-medium text-foreground">Check-In QR Code</span> will be automatically
        created for your gym. You can customize it later from the dashboard.
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground min-w-[70px]">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
