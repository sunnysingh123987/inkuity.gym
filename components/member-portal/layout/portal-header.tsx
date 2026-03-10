'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bell, Flame } from 'lucide-react';

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
}

export function PortalHeader({ gym, member, streak = 0 }: PortalHeaderProps) {
  const initial = (member.full_name || 'M').charAt(0).toUpperCase();
  const slug = gym.slug || gym.name.toLowerCase().replace(/\s+/g, '-');

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

          {/* Streak pill — center */}
          <div className="flex-1 flex justify-center">
            <Link href={`/${slug}/portal/streak`}>
              <div className="inline-flex items-center gap-1.5 rounded-full glass-pill px-4 py-1.5">
                <Flame className={`h-4 w-4 ${streak > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-sm font-semibold text-white">{streak} day streak</span>
              </div>
            </Link>
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
