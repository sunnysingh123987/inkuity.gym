'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, User, LogOut, Settings } from 'lucide-react';
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
}

export function PortalHeader({ gym, member }: PortalHeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Gym Name */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden mr-3 p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-3">
              {gym.logo_url && (
                <div className="relative h-10 w-10 rounded-lg overflow-hidden">
                  <Image
                    src={gym.logo_url}
                    alt={gym.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {gym.name}
                </h1>
                <p className="text-xs text-gray-500">Member Portal</p>
              </div>
            </div>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  {member.avatar_url ? (
                    <div className="relative h-8 w-8 rounded-full overflow-hidden">
                      <Image
                        src={member.avatar_url}
                        alt={member.full_name || 'Member'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                  )}
                  <span className="hidden sm:inline-block text-sm font-medium">
                    {member.full_name || 'Member'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {member.full_name || 'Member'}
                  </p>
                  {member.email && (
                    <p className="text-xs text-gray-500">{member.email}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
