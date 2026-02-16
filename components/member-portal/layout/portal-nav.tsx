'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Dumbbell,
  Activity,
  Apple,
  Settings,
} from 'lucide-react';

interface PortalNavProps {
  gymSlug: string;
}

export function PortalNav({ gymSlug }: PortalNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: `/${gymSlug}/portal/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: 'Check-in History',
      href: `/${gymSlug}/portal/check-ins`,
      icon: Calendar,
    },
    {
      name: 'Workout Routines',
      href: `/${gymSlug}/portal/workouts`,
      icon: Dumbbell,
    },
    {
      name: 'Workout Sessions',
      href: `/${gymSlug}/portal/sessions`,
      icon: Activity,
    },
    {
      name: 'Diet Plans',
      href: `/${gymSlug}/portal/diet`,
      icon: Apple,
    },
    {
      name: 'Settings',
      href: `/${gymSlug}/portal/settings`,
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:pt-16 w-64 bg-slate-900 border-r border-slate-800">
        <div className="flex-1 flex flex-col min-h-0">
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-brand-cyan-500/10 text-brand-cyan-400 border-l-2 border-brand-cyan-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-brand-cyan-400' : 'text-slate-400'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-md transition-colors',
                  isActive
                    ? 'text-brand-cyan-400 bg-brand-cyan-500/10'
                    : 'text-slate-500 hover:bg-slate-800'
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
