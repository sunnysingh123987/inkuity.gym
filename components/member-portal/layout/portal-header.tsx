'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Bell, Flame } from 'lucide-react';
import { getUiSvg } from '@/lib/svg-icons';
import { signOut } from '@/lib/actions/pin-auth';
import { toast } from 'sonner';

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
  const router = useRouter();
  const initial = (member.full_name || 'M').charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      router.push(`/${gym.slug || gym.name.toLowerCase().replace(/\s+/g, '-')}`);
      router.refresh();
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="bg-transparent sticky top-0 z-50">
      <div className="px-4">
        <div className="flex items-center justify-between h-14">
          {/* Avatar initial circle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="shrink-0">
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
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {member.full_name || 'Member'}
                  </p>
                  {member.email && (
                    <p className="text-xs text-slate-400">{member.email}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/${gym.slug || gym.name.toLowerCase().replace(/\s+/g, '-')}/portal/profile`)}>
                <img src={getUiSvg('profile')} alt="" className="mr-2 h-4 w-4 opacity-70" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Streak pill — center */}
          <div className="flex-1 flex justify-center">
            <Link href={`/${gym.slug || gym.name.toLowerCase().replace(/\s+/g, '-')}/portal/streak`}>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 px-4 py-1.5">
                <Flame className={`h-4 w-4 ${streak > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-sm font-semibold text-white">{streak} day streak</span>
              </div>
            </Link>
          </div>

          {/* Bell icon — right */}
          <Link
            href={`/${gym.slug || gym.name.toLowerCase().replace(/\s+/g, '-')}/portal/settings?tab=notifications`}
            className="shrink-0 h-10 w-10 flex items-center justify-center"
          >
            <Bell className="h-5 w-5 text-slate-300" />
          </Link>
        </div>
      </div>
    </header>
  );
}
