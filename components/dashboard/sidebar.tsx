// Dashboard Sidebar Component
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  QrCode,
  Users,
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
  { name: 'Gyms', href: '/gyms', icon: Building2 },
  { name: 'QR Codes', href: '/qr-codes', icon: QrCode },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  return (
    <div className={cn('flex h-full w-full flex-col border-r border-gray-200 bg-white', className)}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="Inkuity" className="h-8 w-auto" />
          <span className="text-lg font-bold">Inkuity</span>
        </Link>
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
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-cyan-50 text-brand-cyan-700'
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
      <div className="border-t border-gray-200 p-4">
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
