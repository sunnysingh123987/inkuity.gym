'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanLine, Dumbbell, ListChecks, Loader2, Check } from 'lucide-react';
import { recordQRCheckIn } from '@/lib/actions/checkin-flow';
import { getAuthenticatedMemberInfo } from '@/lib/actions/pin-auth';
import { toast } from 'sonner';

interface DashboardQuickActionsProps {
  gymSlug: string;
  alreadyCheckedIn?: boolean;
}

export function DashboardQuickActions({ gymSlug, alreadyCheckedIn = false }: DashboardQuickActionsProps) {
  const router = useRouter();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(alreadyCheckedIn);

  const handleCheckIn = async () => {
    if (checkingIn || checkedIn) return;
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
        setCheckedIn(true);
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

  const checkInIcon = checkedIn ? Check : checkingIn ? Loader2 : ScanLine;
  const checkInLabel = checkedIn ? 'Checked In' : 'Check In';
  const checkInColor = checkedIn ? 'bg-emerald-500/15 text-emerald-400' : 'bg-cyan-500/15 text-cyan-400';
  const checkInIconClass = checkingIn ? 'h-6 w-6 animate-spin' : 'h-6 w-6';

  const actions = [
    {
      label: checkInLabel,
      icon: checkInIcon,
      color: checkInColor,
      iconClass: checkInIconClass,
      onClick: handleCheckIn,
      disabled: checkingIn || checkedIn,
    },
    {
      label: 'Workouts',
      icon: Dumbbell,
      color: 'bg-purple-500/15 text-purple-400',
      iconClass: 'h-6 w-6',
      onClick: () => router.push(`/${gymSlug}/portal/workouts`),
      disabled: false,
    },
    {
      label: 'Routines',
      icon: ListChecks,
      color: 'bg-emerald-500/15 text-emerald-400',
      iconClass: 'h-6 w-6',
      onClick: () => router.push(`/${gymSlug}/portal/trackers`),
      disabled: false,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`flex flex-col items-center gap-2 ${action.disabled ? 'opacity-60' : ''}`}
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
