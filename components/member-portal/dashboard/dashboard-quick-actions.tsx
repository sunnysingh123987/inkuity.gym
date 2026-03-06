'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanLine, Dumbbell, ListChecks, Loader2 } from 'lucide-react';
import { recordQRCheckIn } from '@/lib/actions/checkin-flow';
import { getAuthenticatedMemberInfo } from '@/lib/actions/pin-auth';
import { toast } from 'sonner';

interface DashboardQuickActionsProps {
  gymSlug: string;
}

export function DashboardQuickActions({ gymSlug }: DashboardQuickActionsProps) {
  const router = useRouter();
  const [checkingIn, setCheckingIn] = useState(false);

  const handleCheckIn = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      const authResult = await getAuthenticatedMemberInfo(gymSlug);
      if (!authResult.success || !authResult.data) {
        toast.error('Session expired. Please sign in again.');
        router.replace(`/${gymSlug}/portal/sign-in`);
        return;
      }
      const { memberId, gymId } = authResult.data;
      const result = await recordQRCheckIn(memberId, gymId);
      if (result.success) {
        router.push(`/${gymSlug}/portal/check-in-success`);
      } else {
        toast.error(result.error || 'Check-in failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setCheckingIn(false);
    }
  };

  const actions = [
    {
      label: 'Check In',
      icon: checkingIn ? Loader2 : ScanLine,
      color: 'bg-cyan-500/15 text-cyan-400',
      iconClass: checkingIn ? 'h-6 w-6 animate-spin' : 'h-6 w-6',
      onClick: handleCheckIn,
    },
    {
      label: 'Workouts',
      icon: Dumbbell,
      color: 'bg-purple-500/15 text-purple-400',
      iconClass: 'h-6 w-6',
      onClick: () => router.push(`/${gymSlug}/portal/workouts`),
    },
    {
      label: 'Routines',
      icon: ListChecks,
      color: 'bg-emerald-500/15 text-emerald-400',
      iconClass: 'h-6 w-6',
      onClick: () => router.push(`/${gymSlug}/portal/trackers`),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          disabled={action.label === 'Check In' && checkingIn}
          className="flex flex-col items-center gap-2"
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.color}`}>
            <action.icon className={action.iconClass} />
          </div>
          <span className="text-xs text-slate-400 font-medium">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
