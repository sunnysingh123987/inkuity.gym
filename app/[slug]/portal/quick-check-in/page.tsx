'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAuthenticatedMemberInfo, signOut } from '@/lib/actions/pin-auth';
import { recordQRCheckIn, validateCheckInLocation } from '@/lib/actions/checkin-flow';
import { toast } from 'sonner';
import { Building2, Loader2, MapPinOff } from 'lucide-react';

interface QuickCheckInPageProps {
  params: { slug: string };
}

export default function QuickCheckInPage({ params }: QuickCheckInPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [memberInfo, setMemberInfo] = useState<{
    memberId: string;
    gymId: string;
    memberName: string;
    gymName: string;
    gymLogoUrl: string | null;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMemberInfo() {
      try {
        const result = await getAuthenticatedMemberInfo(params.slug);
        if (result.success && result.data) {
          setMemberInfo(result.data);
        } else {
          // Session invalid, redirect to sign-in
          const signInParams = new URLSearchParams();
          signInParams.set('checkin', 'true');
          const scanId = searchParams.get('scan_id');
          const qrCode = searchParams.get('qr_code');
          if (scanId) signInParams.set('scan_id', scanId);
          if (qrCode) signInParams.set('qr_code', qrCode);
          router.replace(`/${params.slug}/portal/sign-in?${signInParams.toString()}`);
        }
      } catch {
        router.replace(`/${params.slug}/portal/sign-in`);
      } finally {
        setIsLoading(false);
      }
    }

    loadMemberInfo();
  }, [params.slug, searchParams, router]);

  const handleCheckIn = async () => {
    if (!memberInfo) return;
    setIsCheckingIn(true);
    setLocationError(null);

    try {
      const scanId = searchParams.get('scan_id') || undefined;
      const qrCode = searchParams.get('qr_code') || undefined;

      // Attempt geolocation validation
      let locationAllowed = true;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            });
          });

          const locResult = await validateCheckInLocation(
            memberInfo.gymId,
            position.coords.latitude,
            position.coords.longitude
          );

          if (locResult.success && !locResult.allowed) {
            locationAllowed = false;
            setLocationError(
              `You're ${locResult.distance?.toLocaleString()}m away from the gym. Check-in is only allowed within ${locResult.maxDistance}m of the gym location.`
            );
            setIsCheckingIn(false);
            return;
          }
        } catch (geoErr: any) {
          // Geolocation denied or failed - allow check-in (graceful degradation)
          console.warn('Geolocation unavailable:', geoErr?.message);
        }
      }

      const result = await recordQRCheckIn(
        memberInfo.memberId,
        memberInfo.gymId,
        scanId,
        qrCode
      );

      if (result.success) {
        const successParams = new URLSearchParams();
        if (scanId) successParams.set('scan_id', scanId);
        if (qrCode) successParams.set('qr_code', qrCode);
        router.push(`/${params.slug}/portal/check-in-success?${successParams.toString()}`);
      } else {
        toast.error(result.error || 'Check-in failed');
        setIsCheckingIn(false);
      }
    } catch {
      toast.error('An unexpected error occurred');
      setIsCheckingIn(false);
    }
  };

  const handleNotMe = async () => {
    await signOut();
    const signInParams = new URLSearchParams();
    signInParams.set('checkin', 'true');
    const scanId = searchParams.get('scan_id');
    const qrCode = searchParams.get('qr_code');
    if (scanId) signInParams.set('scan_id', scanId);
    if (qrCode) signInParams.set('qr_code', qrCode);
    router.replace(`/${params.slug}/portal/sign-in?${signInParams.toString()}`);
  };

  if (isLoading) {
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

  if (!memberInfo) return null;

  const firstName = memberInfo.memberName.split(' ')[0];
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
            {/* Gym branding */}
            {memberInfo.gymLogoUrl ? (
              <div className="flex justify-center">
                <img
                  src={memberInfo.gymLogoUrl}
                  alt={memberInfo.gymName}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-brand-cyan-500 to-brand-purple-500 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm text-slate-400">{memberInfo.gymName}</p>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {firstName}!
              </h1>
            </div>

            {/* Date/time */}
            <div className="text-slate-400 text-sm space-y-0.5">
              <p>{dateString}</p>
              <p className="font-mono text-lg text-slate-300">{timeString}</p>
            </div>

            {/* Check-in button */}
            <button
              onClick={handleCheckIn}
              disabled={isCheckingIn}
              className="relative mx-auto flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-br from-brand-cyan-500 via-brand-purple-500 to-brand-pink-500 text-white font-bold text-xl shadow-lg shadow-brand-cyan-500/20 hover:shadow-brand-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100"
            >
              {isCheckingIn ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : (
                'Check In'
              )}
              {/* Pulse ring animation */}
              {!isCheckingIn && (
                <span className="absolute inset-0 rounded-full animate-ping bg-brand-cyan-500/20 pointer-events-none" />
              )}
            </button>

            {/* Location error */}
            {locationError && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-left">
                <MapPinOff className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Too far from the gym</p>
                  <p className="text-xs text-red-300/80 mt-1">{locationError}</p>
                </div>
              </div>
            )}

            {/* Not me link */}
            <button
              onClick={handleNotMe}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              disabled={isCheckingIn}
            >
              Not {firstName}? Sign in with a different account
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
