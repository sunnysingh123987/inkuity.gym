// Dashboard Sidebar Component
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Megaphone,
  Wallet,
  Settings,
  LogOut,
  MoreHorizontal,
  X,
  Loader2,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
  { name: 'Staff & Finances', href: '/staff-expenses', icon: Wallet },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Bottom nav shows these 5 items + a More menu for the rest
const bottomNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const moreMenuItems = [
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
  { name: 'Staff & Finances', href: '/staff-expenses', icon: Wallet },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [moreOpen, setMoreOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Clear navigating state when route settles
  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn('hidden lg:flex h-full w-full flex-col border-r border-border bg-card', className)}>
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <Logo href="/dashboard" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const isNavigating = navigatingTo === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => { if (!isActive) setNavigatingTo(item.href); }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-cyan-500/10 text-brand-cyan-400 shadow-glow-cyan/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {isNavigating ? <Loader2 className="h-5 w-5 animate-spin" /> : <item.icon className="h-5 w-5" />}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border p-4">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={async () => {
              try {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  console.error('Logout error:', error.message);
                  return;
                }
                router.push('/');
                router.refresh();
              } catch (err) {
                console.error('Unexpected logout error', err);
              }
            }}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        {/* More menu overlay */}
        {moreOpen && (
          <div className="absolute bottom-full left-0 right-0 bg-card border-t border-border shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-sm font-medium text-foreground">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-2 py-2 space-y-1">
              {moreMenuItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const isNavigating = navigatingTo === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => { setMoreOpen(false); if (!isActive) setNavigatingTo(item.href); }}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-cyan-500/10 text-brand-cyan-400'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {isNavigating ? <Loader2 className="h-5 w-5 animate-spin" /> : <item.icon className="h-5 w-5" />}
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-around px-1 py-1.5 safe-area-pb">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const isNavigating = navigatingTo === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => { setMoreOpen(false); if (!isActive) setNavigatingTo(item.href); }}
                className={cn(
                  'flex flex-col items-center justify-center min-w-0 flex-1 px-1 py-1.5 rounded-md transition-colors',
                  isActive
                    ? 'text-brand-cyan-400'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isNavigating
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <item.icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]')} />
                }
                <span className="text-[10px] font-medium mt-0.5 truncate w-full text-center">
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center justify-center min-w-0 flex-1 px-1 py-1.5 rounded-md transition-colors',
              moreOpen
                ? 'text-brand-cyan-400'
                : moreMenuItems.some((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`))
                  ? 'text-brand-cyan-400'
                  : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium mt-0.5">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
