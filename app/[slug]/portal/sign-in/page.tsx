'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  requestPortalAccess,
  signInWithPIN,
  checkMemberPINStatus,
  getGymBySlug,
  getAuthenticatedMember,
  sendVerificationCode,
  verifyCode,
  registerNewMember,
} from '@/lib/actions/pin-auth';
import { recordQRCheckIn } from '@/lib/actions/checkin-flow';
import { toast } from 'sonner';
import { Building2, Loader2, Mail, Lock, UserPlus, ShieldCheck } from 'lucide-react';

interface SignInPageProps {
  params: { slug: string };
  searchParams: {
    gymId?: string;
    gymName?: string;
    gymLogo?: string;
    checkin?: string;
    scan_id?: string;
    qr_code?: string;
    ref?: string;
  };
}

type Step = 'email' | 'pin' | 'verify' | 'create-pin';

export default function SignInPage({ params, searchParams }: SignInPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGym, setIsLoadingGym] = useState(true);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [isNewMember, setIsNewMember] = useState(false);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [gym, setGym] = useState<{
    id: string;
    name: string;
    logo_url: string | null;
  } | null>(null);

  // Check if returning member with valid session (skip sign-in for QR check-in)
  useEffect(() => {
    if (searchParams.checkin !== 'true') return;

    async function checkExistingSession() {
      try {
        const authResult = await getAuthenticatedMember(params.slug);
        if (authResult.success && authResult.data) {
          const redirectParams = new URLSearchParams();
          if (searchParams.scan_id) redirectParams.set('scan_id', searchParams.scan_id);
          if (searchParams.qr_code) redirectParams.set('qr_code', searchParams.qr_code);
          router.replace(`/${params.slug}/portal/quick-check-in?${redirectParams.toString()}`);
        }
      } catch (error) {
        // Session check failed, continue with normal sign-in flow
      }
    }

    checkExistingSession();
  }, [params.slug, searchParams.checkin, searchParams.scan_id, searchParams.qr_code, router]);

  // Fetch gym data if not provided in URL params
  useEffect(() => {
    async function fetchGym() {
      if (searchParams.gymId) {
        setGym({
          id: searchParams.gymId,
          name: searchParams.gymName || 'Gym',
          logo_url: searchParams.gymLogo || null,
        });
        setIsLoadingGym(false);
        return;
      }

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

    // Check if member exists and has PIN
    const statusResult = await checkMemberPINStatus(email, gym.id);

    if (!statusResult.success) {
      toast.error(statusResult.error || 'Something went wrong');
      setIsLoading(false);
      return;
    }

    if (statusResult.data?.exists) {
      // Existing member
      setIsNewMember(false);
      if (statusResult.data.hasPin) {
        // Has existing PIN — go straight to PIN entry
        setHasExistingPin(true);
        setStep('pin');
        toast.info('Enter your PIN to check in');
      } else {
        // Exists but no PIN — send a new one
        const result = await requestPortalAccess(email, gym.id);
        if (result.success) {
          toast.success(result.message || 'PIN sent to your email!');
          setHasExistingPin(false);
          setStep('pin');
        } else {
          toast.error(result.error || 'Failed to send PIN');
        }
      }
    } else {
      // New member — send verification code for self-registration
      setIsNewMember(true);
      const result = await sendVerificationCode(email, gym.id);
      if (result.success) {
        toast.success(result.message || 'Verification code sent!');
        setPendingMemberId(result.memberId || null);
        setStep('verify');
      } else {
        toast.error(result.error || 'Failed to send verification code');
      }
    }

    setIsLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!gym?.id) {
      toast.error('Gym information not loaded');
      setIsLoading(false);
      return;
    }

    const result = await verifyCode(email, verificationCode, gym.id);
    if (result.success) {
      toast.success('Email verified! Create your 4-digit PIN.');
      setPendingMemberId(result.memberId || null);
      setStep('create-pin');
    } else {
      toast.error(result.error || 'Invalid verification code');
    }

    setIsLoading(false);
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPin.length !== 4) {
      toast.error('PIN must be 4 digits');
      setIsLoading(false);
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      setIsLoading(false);
      return;
    }

    if (!pendingMemberId) {
      toast.error('Registration error. Please start over.');
      setIsLoading(false);
      return;
    }

    const result = await registerNewMember(pendingMemberId, newPin, params.slug);

    if (result.success && result.data) {
      toast.success('Account created! Checking you in...');

      // Record check-in for the new member
      if (searchParams.checkin === 'true') {
        await recordQRCheckIn(
          result.data.memberId,
          result.data.gymId,
          searchParams.scan_id,
          searchParams.qr_code
        );
        const checkInParams = new URLSearchParams();
        if (searchParams.scan_id) checkInParams.set('scan_id', searchParams.scan_id);
        if (searchParams.qr_code) checkInParams.set('qr_code', searchParams.qr_code);
        router.push(`/${params.slug}/portal/check-in-success?${checkInParams.toString()}`);
      } else {
        router.push(`/${params.slug}/portal/dashboard`);
      }
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to create account');
      setIsLoading(false);
    }
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-cyan-500" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardContent className="text-center py-12">
            <p className="text-slate-400">Gym not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTitle = () => {
    switch (step) {
      case 'email':
        return searchParams.checkin === 'true' ? 'Gym Check-in' : `Welcome to ${gym.name}`;
      case 'pin':
        return 'Enter Your PIN';
      case 'verify':
        return 'Verify Your Email';
      case 'create-pin':
        return 'Create Your PIN';
    }
  };

  const getDescription = () => {
    switch (step) {
      case 'email':
        return searchParams.checkin === 'true'
          ? `Sign in or register to check in at ${gym.name}`
          : `Access your ${gym.name} member's page`;
      case 'pin':
        return hasExistingPin
          ? `Enter your PIN for ${email}`
          : `We've sent a 4-digit PIN to ${email}`;
      case 'verify':
        return `We've sent a 6-digit code to ${email}`;
      case 'create-pin':
        return 'Choose a 4-digit PIN for future sign-ins';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
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
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-brand-cyan-500 to-brand-purple-500 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
          )}

          <CardTitle className="text-2xl text-white">{getTitle()}</CardTitle>
          <CardDescription className="text-slate-400">{getDescription()}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <Button type="submit" className="w-full gradient-brand text-white shadow-glow-cyan hover:shadow-glow-pink" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    {searchParams.checkin === 'true' ? 'Check In' : 'Continue'}
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-slate-500 pt-2">
                <p>New here? Enter your email and we'll get you set up</p>
              </div>
            </form>
          )}

          {step === 'pin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-slate-300">4-Digit PIN</Label>
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
                  className="text-center text-2xl tracking-widest font-mono bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500 text-center">
                  {hasExistingPin ? 'Enter your existing PIN' : 'Check your email for the PIN'}
                </p>
              </div>

              <Button type="submit" className="w-full gradient-brand text-white shadow-glow-cyan hover:shadow-glow-pink" disabled={isLoading}>
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
                  className="text-brand-cyan-400 hover:text-brand-cyan-300"
                  disabled={isLoading}
                >
                  ← Change email
                </button>

                <button
                  type="button"
                  onClick={handleRequestNewPIN}
                  className="text-slate-400 hover:text-slate-300"
                  disabled={isLoading}
                >
                  {hasExistingPin ? 'Request new PIN' : 'Resend PIN'}
                </button>
              </div>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code" className="text-slate-300">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                  }}
                  disabled={isLoading}
                  required
                  autoFocus
                  className="text-center text-2xl tracking-widest font-mono bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500 text-center">
                  Check your email for the 6-digit code
                </p>
              </div>

              <Button type="submit" className="w-full gradient-brand text-white shadow-glow-cyan hover:shadow-glow-pink" disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Verify Email
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setVerificationCode('');
                    setIsNewMember(false);
                  }}
                  className="text-brand-cyan-400 hover:text-brand-cyan-300"
                  disabled={isLoading}
                >
                  ← Change email
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!gym?.id) return;
                    setIsLoading(true);
                    // Delete the pending member and resend
                    const result = await sendVerificationCode(email, gym.id);
                    if (result.success) {
                      toast.success('New code sent!');
                      setPendingMemberId(result.memberId || null);
                    } else {
                      toast.error(result.error || 'Failed to resend code');
                    }
                    setIsLoading(false);
                  }}
                  className="text-slate-400 hover:text-slate-300"
                  disabled={isLoading}
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {step === 'create-pin' && (
            <form onSubmit={handleCreatePin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-pin" className="text-slate-300">Create PIN</Label>
                <Input
                  id="new-pin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  placeholder="1234"
                  value={newPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setNewPin(value);
                  }}
                  disabled={isLoading}
                  required
                  autoFocus
                  className="text-center text-2xl tracking-widest font-mono bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pin" className="text-slate-300">Confirm PIN</Label>
                <Input
                  id="confirm-pin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  placeholder="1234"
                  value={confirmPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setConfirmPin(value);
                  }}
                  disabled={isLoading}
                  required
                  className="text-center text-2xl tracking-widest font-mono bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500 text-center">
                  You'll use this PIN to sign in next time
                </p>
              </div>

              <Button type="submit" className="w-full gradient-brand text-white shadow-glow-cyan hover:shadow-glow-pink" disabled={isLoading || newPin.length !== 4 || confirmPin.length !== 4}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account & Check In
                  </>
                )}
              </Button>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setNewPin('');
                    setConfirmPin('');
                    setVerificationCode('');
                    setIsNewMember(false);
                  }}
                  className="text-brand-cyan-400 hover:text-brand-cyan-300"
                  disabled={isLoading}
                >
                  ← Start over
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
