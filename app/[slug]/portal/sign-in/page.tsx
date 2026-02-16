'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPortalAccess, signInWithPIN, checkMemberPINStatus, getGymBySlug } from '@/lib/actions/pin-auth';
import { toast } from 'sonner';
import { Building2, Loader2, Mail, Lock } from 'lucide-react';

interface SignInPageProps {
  params: { slug: string };
  searchParams: {
    gymId?: string;
    gymName?: string;
    gymLogo?: string;
    checkin?: string;
    scan_id?: string;
    qr_code?: string;
  };
}

export default function SignInPage({ params, searchParams }: SignInPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGym, setIsLoadingGym] = useState(true);
  const [step, setStep] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [gym, setGym] = useState<{
    id: string;
    name: string;
    logo_url: string | null;
  } | null>(null);

  // Fetch gym data if not provided in URL params
  useEffect(() => {
    async function fetchGym() {
      if (searchParams.gymId) {
        // Use data from URL params
        setGym({
          id: searchParams.gymId,
          name: searchParams.gymName || 'Gym',
          logo_url: searchParams.gymLogo || null,
        });
        setIsLoadingGym(false);
        return;
      }

      // Fetch from database using slug (server action bypasses RLS)
      try {
        const result = await getGymBySlug(params.slug);

        if (!result.success || !result.data) {
          toast.error(result.error || 'Gym not found');
          setIsLoadingGym(false);
          return;
        }

        setGym(result.data);
      } catch (error) {
        console.error('Error fetching gym:', error);
        toast.error('Failed to load gym information');
      } finally {
        setIsLoadingGym(false);
      }
    }

    fetchGym();
  }, [params.slug, searchParams.gymId, searchParams.gymName, searchParams.gymLogo]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast.error('Please enter your email');
      setIsLoading(false);
      return;
    }

    if (!gym?.id) {
      toast.error('Gym information not loaded');
      setIsLoading(false);
      return;
    }

    // Check if member has existing PIN
    const statusResult = await checkMemberPINStatus(email, gym.id);

    if (!statusResult.success) {
      toast.error(statusResult.error || 'Member not found');
      setIsLoading(false);
      return;
    }

    if (statusResult.data?.hasPin) {
      // Member has existing PIN - go straight to PIN entry
      setHasExistingPin(true);
      setStep('pin');
      toast.info('Enter your existing PIN');
    } else {
      // Member doesn't have PIN - send new one
      const result = await requestPortalAccess(email, gym.id);
      if (result.success) {
        toast.success(result.message || 'PIN sent to your email!');
        setHasExistingPin(false);
        setStep('pin');
      } else {
        toast.error(result.error || 'Failed to send PIN');
      }
    }

    setIsLoading(false);
  };

  const handleRequestNewPIN = async () => {
    if (!gym?.id) return;
    setIsLoading(true);

    const result = await requestPortalAccess(email, gym.id);
    if (result.success) {
      toast.success('New PIN sent to your email!');
      setHasExistingPin(false);
    } else {
      toast.error(result.error || 'Failed to send PIN');
    }

    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !pin) {
      toast.error('Please enter email and PIN');
      setIsLoading(false);
      return;
    }

    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      setIsLoading(false);
      return;
    }

    const result = await signInWithPIN(email, pin, params.slug);

    if (result.success) {
      toast.success('Signed in successfully!');

      // If this is a QR check-in flow, redirect to check-in success page
      if (searchParams.checkin === 'true') {
        const checkInParams = new URLSearchParams();
        if (searchParams.scan_id) checkInParams.set('scan_id', searchParams.scan_id);
        if (searchParams.qr_code) checkInParams.set('qr_code', searchParams.qr_code);
        router.push(`/${params.slug}/portal/check-in-success?${checkInParams.toString()}`);
      } else {
        router.push(`/${params.slug}/portal/dashboard`);
      }
      router.refresh();
    } else {
      toast.error(result.error || 'Invalid email or PIN');
      setIsLoading(false);
    }
  };

  if (isLoadingGym) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Gym not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {gym.logo_url ? (
            <div className="flex justify-center mb-4">
              <img
                src={gym.logo_url}
                alt={gym.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
          )}

          <CardTitle className="text-2xl">
            {step === 'email'
              ? searchParams.checkin === 'true'
                ? 'Gym Check-in'
                : 'Member Portal'
              : 'Enter Your PIN'}
          </CardTitle>
          <CardDescription>
            {step === 'email'
              ? searchParams.checkin === 'true'
                ? `Sign in to check in at ${gym.name}`
                : `Access your ${gym.name} member portal`
              : hasExistingPin
              ? `Enter your PIN for ${email}`
              : `We've sent a 4-digit PIN to ${email}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'email' ? (
            // Step 1: Enter Email
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Continue
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-gray-500 pt-2">
                <p>First time? Check in at the gym to get started</p>
              </div>
            </form>
          ) : (
            // Step 2: Enter PIN
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">4-Digit PIN</Label>
                <Input
                  id="pin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  placeholder="1234"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(value);
                  }}
                  disabled={isLoading}
                  required
                  autoFocus
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-gray-500 text-center">
                  {hasExistingPin ? 'Enter your existing PIN' : 'Check your email for the PIN'}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setPin('');
                    setHasExistingPin(false);
                  }}
                  className="text-indigo-600 hover:underline"
                  disabled={isLoading}
                >
                  ← Change email
                </button>

                <button
                  type="button"
                  onClick={handleRequestNewPIN}
                  className="text-gray-600 hover:underline"
                  disabled={isLoading}
                >
                  {hasExistingPin ? 'Request new PIN' : 'Resend PIN'}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
