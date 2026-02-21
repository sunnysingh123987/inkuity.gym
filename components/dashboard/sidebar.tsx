// Dashboard Sidebar Component
'use client';

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
  Settings,
  LogOut,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  return (
    <div className={cn('flex h-full w-full flex-col border-r border-border bg-card', className)}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo href="/dashboard" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-cyan-500/10 text-brand-cyan-400 shadow-glow-cyan/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
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
  );
}
