'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, Dumbbell, UtensilsCrossed, Settings } from 'lucide-react';

interface PortalNavProps {
  gymSlug: string;
}

export function PortalNav({ gymSlug }: PortalNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Home',
      href: `/${gymSlug}/portal/dashboard`,
      icon: Home,
      matchPaths: [`/${gymSlug}/portal/dashboard`],
    },
    {
      name: 'Routines',
      href: `/${gymSlug}/portal/trackers`,
      icon: Dumbbell,
      matchPaths: [
        `/${gymSlug}/portal/trackers`,
        `/${gymSlug}/portal/workouts`,
        `/${gymSlug}/portal/sessions`,
        `/${gymSlug}/portal/personal-records`,
      ],
    },
    {
      name: 'Diet',
      href: `/${gymSlug}/portal/meals`,
      icon: UtensilsCrossed,
      matchPaths: [`/${gymSlug}/portal/meals`],
    },
    {
      name: 'Settings',
      href: `/${gymSlug}/portal/settings`,
      icon: Settings,
      matchPaths: [
        `/${gymSlug}/portal/settings`,
        `/${gymSlug}/portal/payments`,
        `/${gymSlug}/portal/review`,
        `/${gymSlug}/portal/feedback`,
      ],
    },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    return item.matchPaths.some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    );
  };

  return (
    <>
      {/* Bottom Navigation — always shown (mobile-app style) */}
      <nav className="fixed bottom-0 left-0 right-0 glass-nav z-50" style={{ borderTop: '1px solid var(--glass-border)', borderBottom: 'none' }}>
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-md transition-colors',
                  active
                    ? 'text-brand-cyan-400 bg-brand-cyan-500/10'
                    : 'text-slate-500 glass-hover'
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate w-full text-center">
                  {item.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
