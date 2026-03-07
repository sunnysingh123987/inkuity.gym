'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { recordQRCheckIn, getLiveGymTraffic } from '@/lib/actions/checkin-flow';
import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { MemberInfoForm } from '@/components/member-portal/check-in/member-info-form';
import { checkMemberInfoCollected } from '@/lib/actions/members-portal';
import { toast } from 'sonner';
import {
  Loader2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface CheckInSuccessPageProps {
  params: { slug: string };
}

interface CheckInData {
  checkInId: string;
  checkInAt: string;
  memberName: string;
  membershipStatus: string;
  subscriptionEndDate?: string;
  subscriptionWarning: boolean;
}

export default function CheckInSuccessPage({ params }: CheckInSuccessPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showMemberInfoForm, setShowMemberInfoForm] = useState(false);
  const [liveTraffic, setLiveTraffic] = useState(0);

  // Animation phases
  const [phase, setPhase] = useState(0);
  // 0: nothing, 1: tick draws, 2: "Checked In!" appears, 3: shrink tick+text,
  // 4: welcome + date/time, 5: live traffic dot+count

  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function performCheckIn() {
      try {
        const authResult = await getAuthenticatedMember(params.slug);
        if (!authResult.success || !authResult.data) {
          router.push(`/${params.slug}/portal/sign-in`);
          return;
        }

        const { memberId: mId, gymId } = authResult.data;
        setMemberId(mId);
        const scanId = searchParams.get('scan_id') || undefined;
        const qrCode = searchParams.get('qr_code') || undefined;

        let result;
        try {
          result = await recordQRCheckIn(mId, gymId, scanId, qrCode);
        } catch (err) {
          console.error('recordQRCheckIn error:', err);
          setError('Failed to record check-in. Please try again.');
          return;
        }

        if (result.success && result.data) {
          setCheckInData(result.data);

          if (result.data.subscriptionWarning) {
            toast.warning('Your subscription is not active. Please contact the gym.');
          }

          getLiveGymTraffic(gymId).then((count) => setLiveTraffic(count)).catch(() => {});

          let infoCollected = true;
          try {
            infoCollected = await checkMemberInfoCollected(mId);
          } catch {
            // Default to true so we don't block on error
          }

          const memberIsTrial = result.data.membershipStatus === 'trial' || result.data.membershipStatus === 'pending';

          // Start animation sequence
          setTimeout(() => setPhase(1), 100);   // 0.1s: tick draws
          setTimeout(() => setPhase(2), 700);   // 0.7s: "Checked In!" text
          setTimeout(() => setPhase(3), 1800);  // 1.8s: shrink
          setTimeout(() => setPhase(4), 2400);  // 2.4s: welcome + date
          setTimeout(() => setPhase(5), 3500);  // 3.5s: live traffic

          if (!infoCollected) {
            setTimeout(() => setShowMemberInfoForm(true), 5000);
            if (memberIsTrial) setIsPending(true);
          } else if (memberIsTrial) {
            setIsPending(true);
          } else {
            // Auto-redirect after animation (5s) + 3s pause = 8s
            redirectTimer.current = setTimeout(() => {
              router.push(`/${params.slug}/portal/dashboard`);
            }, 8000);
          }
        } else {
          setError(result.error || 'Failed to record check-in');
        }
      } catch (err) {
        console.error('Check-in error:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    performCheckIn();

    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [params.slug, searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full border-4 border-brand-cyan-500/20 flex items-center justify-center mx-auto">
            <Loader2 className="w-10 h-10 text-brand-cyan-500 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Recording your check-in...</h2>
            <p className="text-sm text-slate-400 mt-1">Just a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardContent className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Check-in Failed</h2>
            <p className="text-slate-400">{error}</p>
            <Button onClick={() => router.push(`/${params.slug}/portal/dashboard`)}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!checkInData) return null;

  const firstName = checkInData.memberName.split(' ')[0];

  const formattedTime = new Date(checkInData.checkInAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedDate = new Date(checkInData.checkInAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Main Animation Area */}
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        {/* Tick + "Checked In!" group — shrinks together */}
        <div
          className="flex flex-col items-center transition-all duration-700 ease-out"
          style={{
            transform: phase >= 3 ? 'scale(0.55)' : 'scale(1)',
            marginBottom: phase >= 3 ? '-1rem' : '0',
          }}
        >
          {/* Animated Tick — no container, just the checkmark */}
          <svg
            className="transition-all duration-500 ease-out"
            style={{
              width: phase >= 1 ? '5rem' : '0',
              height: phase >= 1 ? '5rem' : '0',
              opacity: phase >= 1 ? 1 : 0,
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#tickGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="tickGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <path
              d="M5 13l4 4L19 7"
              style={{
                strokeDasharray: 24,
                strokeDashoffset: phase >= 1 ? 0 : 24,
                transition: 'stroke-dashoffset 0.6s ease-out',
              }}
            />
          </svg>

          {/* "Checked In!" text */}
          <h1
            className="text-3xl font-bold text-white transition-all duration-500 ease-out mt-3"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            Checked In!
          </h1>
        </div>

        {/* Welcome + Date/Time — fades in after shrink */}
        <div
          className="transition-all duration-600 ease-out mt-2"
          style={{
            opacity: phase >= 4 ? 1 : 0,
            transform: phase >= 4 ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          <p className="text-xl text-slate-200 font-medium">
            Welcome, {firstName}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {formattedDate}
          </p>
          <p className="text-lg font-mono font-semibold text-slate-300 mt-0.5">
            {formattedTime}
          </p>
        </div>

        {/* Live Traffic — green dot + count */}
        <div
          className="flex items-center gap-2.5 mt-8 transition-all duration-500 ease-out"
          style={{
            opacity: phase >= 5 ? 1 : 0,
            transform: phase >= 5 ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
          }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-2xl font-bold text-white">{liveTraffic}</span>
          <span className="text-sm text-slate-400">
            in the gym
          </span>
        </div>
      </div>

      {/* Subscription Warning */}
      {checkInData.subscriptionWarning && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-200 text-sm">
                  Subscription {checkInData.membershipStatus}
                </h3>
                <p className="text-amber-300 text-sm mt-0.5">
                  Your membership is currently <strong>{checkInData.membershipStatus}</strong>.
                  {checkInData.subscriptionEndDate && (
                    <>
                      {' '}
                      It ended on{' '}
                      {new Date(checkInData.subscriptionEndDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      .
                    </>
                  )}{' '}
                  Please contact the front desk to renew.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Info Collection (first check-in only) */}
      {showMemberInfoForm && memberId && (
        <MemberInfoForm
          memberId={memberId}
          existingName={checkInData.memberName}
          onComplete={() => {
            setShowMemberInfoForm(false);
            if (!isPending) {
              redirectTimer.current = setTimeout(() => {
                router.push(`/${params.slug}/portal/dashboard`);
              }, 3000);
            }
          }}
        />
      )}

      {/* Pending Approval Screen */}
      {isPending && !showMemberInfoForm && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Trial Member</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              You&apos;re checked in as a trial member. Contact the gym to activate your full membership.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
