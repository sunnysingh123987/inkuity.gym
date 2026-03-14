'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { AnimatedFire } from '@/components/member-portal/streak/animated-fire';

interface PortalHeaderProps {
  gym: {
    id: string;
    name: string;
    slug?: string;
    logo_url?: string | null;
  };
  member: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
  streak?: number;
  checkedInToday?: boolean;
  streakAtRisk?: boolean;
}

export function PortalHeader({ gym, member, streak = 0, checkedInToday = false, streakAtRisk = false }: PortalHeaderProps) {
  const pathname = usePathname();
  const initial = (member.full_name || 'M').charAt(0).toUpperCase();
  const slug = gym.slug || gym.name.toLowerCase().replace(/\s+/g, '-');
  const atRisk = streakAtRisk;
  const isStreakPage = pathname?.endsWith('/streak');
  const sweepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sweepRef.current;
    if (!el) return;
    let timeout: ReturnType<typeof setTimeout>;

    function triggerSweep() {
      el!.style.transition = 'none';
      el!.style.opacity = '0';
      el!.style.transform = 'translateX(-100%) skewX(-20deg)';

      requestAnimationFrame(() => {
        el!.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease';
        el!.style.opacity = '1';
        el!.style.transform = 'translateX(200%) skewX(-20deg)';
      });

      // Random interval between 4s and 12s
      const next = 4000 + Math.random() * 8000;
      timeout = setTimeout(triggerSweep, next);
    }

    // First sweep after a random 2-6s delay
    timeout = setTimeout(triggerSweep, 2000 + Math.random() * 4000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Avatar — links to settings/profile page */}
          <Link href={`/${slug}/portal/settings`} className="shrink-0">
            {member.avatar_url ? (
              <div className="relative h-10 w-10 rounded-full overflow-hidden">
                <Image
                  src={member.avatar_url}
                  alt={member.full_name || 'Member'}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-black border border-slate-700 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{initial}</span>
              </div>
            )}
          </Link>

          {/* Streak pill — center (hidden on streak page) */}
          <div className="flex-1 flex justify-center">
            {!isStreakPage && (
              <Link href={`/${slug}/portal/streak`}>
                <div className="relative inline-flex items-center gap-1 rounded-full glass-pill px-4 py-1.5 overflow-hidden">
                  {/* Light sweep */}
                  <div
                    ref={sweepRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      opacity: 0,
                      transform: 'translateX(-100%) skewX(-20deg)',
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 60%, transparent 100%)',
                      width: '45%',
                    }}
                  />
                  <AnimatedFire streak={streak} atRisk={atRisk} className="h-5 w-5 relative z-[1]" />
                  <span className={`text-sm font-semibold relative z-[1] ${atRisk ? 'text-amber-400' : 'text-white'}`}>
                    {streak} {streak === 1 ? 'day' : 'days'} streak{atRisk ? ' at risk' : ''}
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Bell icon — right */}
          <Link
            href={`/${slug}/portal/settings?tab=notifications`}
            className="shrink-0 h-10 w-10 flex items-center justify-center"
          >
            <Bell className="h-5 w-5 text-slate-300" />
          </Link>
        </div>
      </div>
    </header>
  );
}
