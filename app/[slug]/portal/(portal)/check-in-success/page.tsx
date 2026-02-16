'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { recordQRCheckIn } from '@/lib/actions/checkin-flow';
import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { WorkoutFocusSelector } from '@/components/member-portal/check-in/workout-focus-selector';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
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
  const [showWorkoutSelector, setShowWorkoutSelector] = useState(false);

  useEffect(() => {
    async function performCheckIn() {
      try {
        // Get authenticated member
        const authResult = await getAuthenticatedMember(params.slug);
        if (!authResult.success || !authResult.data) {
          router.push(`/${params.slug}/portal/sign-in`);
          return;
        }

        const { memberId, gymId } = authResult.data;
        const scanId = searchParams.get('scan_id') || undefined;
        const qrCode = searchParams.get('qr_code') || undefined;

        // Record the check-in
        const result = await recordQRCheckIn(memberId, gymId, scanId, qrCode);

        if (result.success && result.data) {
          setCheckInData(result.data);

          if (result.data.subscriptionWarning) {
            toast.warning('Your subscription is not active. Please contact the gym.');
          }

          // Show workout selector after a brief delay
          setTimeout(() => setShowWorkoutSelector(true), 800);
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
  }, [params.slug, searchParams, router]);

  const handleWorkoutComplete = () => {
    router.push(`/${params.slug}/portal/dashboard`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-brand-cyan-500/20 flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-brand-cyan-500 animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Recording your check-in...</h2>
            <p className="text-sm text-slate-400 mt-1">Just a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
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
      {/* Check-in Confirmation */}
      <Card className="overflow-hidden bg-slate-900 border-slate-800">
        <div className="bg-gradient-to-r from-brand-cyan-500 via-brand-purple-500 to-brand-pink-500 px-6 py-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Checked In!</h1>
          <p className="text-white/80 mt-1">
            Welcome, {checkInData.memberName}
          </p>
        </div>

        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{formattedDate}</span>
            <span className="font-mono font-semibold text-white">{formattedTime}</span>
          </div>
        </CardContent>
      </Card>

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

      {/* Workout Focus Selector */}
      {showWorkoutSelector && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-6">
            <WorkoutFocusSelector
              checkInId={checkInData.checkInId}
              onComplete={handleWorkoutComplete}
            />
          </CardContent>
        </Card>
      )}

      {/* Skip to Dashboard */}
      {!showWorkoutSelector && (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${params.slug}/portal/dashboard`)}
            className="text-slate-400"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
