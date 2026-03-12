'use client';

import { useEffect, useState, useCallback } from 'react';
import { checkOutMember } from '@/lib/actions/checkin-flow';
import { toast } from '@/components/ui/toaster';

interface AutoCheckoutWarningProps {
  checkInTime: string;
  memberId: string;
  gymId: string;
}

const WARNING_MS = 75 * 60 * 1000; // 1 hour 15 minutes
const AUTO_CHECKOUT_MS = 90 * 60 * 1000; // 1 hour 30 minutes

export function AutoCheckoutWarning({ checkInTime, memberId, gymId }: AutoCheckoutWarningProps) {
  const [warned, setWarned] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);

  const doAutoCheckout = useCallback(async () => {
    if (checkedOut) return;
    setCheckedOut(true);
    const result = await checkOutMember(memberId, gymId);
    if (result.success) {
      toast.info('You have been automatically checked out after 1.5 hours.');
    }
  }, [memberId, gymId, checkedOut]);

  useEffect(() => {
    const checkInMs = new Date(checkInTime).getTime();
    const now = Date.now();
    const elapsed = now - checkInMs;

    // Already past auto-checkout time
    if (elapsed >= AUTO_CHECKOUT_MS) {
      doAutoCheckout();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Warning at 1h15m
    if (elapsed < WARNING_MS) {
      timers.push(
        setTimeout(() => {
          if (!warned) {
            setWarned(true);
            toast.warning('You will be automatically checked out in 15 minutes.', {
              duration: 10000,
            });
          }
        }, WARNING_MS - elapsed)
      );
    } else if (!warned) {
      setWarned(true);
      toast.warning('You will be automatically checked out soon.', {
        duration: 10000,
      });
    }

    // Auto checkout at 1h30m
    timers.push(
      setTimeout(() => {
        doAutoCheckout();
      }, AUTO_CHECKOUT_MS - elapsed)
    );

    return () => timers.forEach(clearTimeout);
  }, [checkInTime, warned, doAutoCheckout]);

  return null;
}
