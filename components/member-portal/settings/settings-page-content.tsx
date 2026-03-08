'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  KeyRound,
  Bell,
  IndianRupee,
  Star,
  MessageSquare,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsForm } from '@/components/member-portal/settings/settings-form';
import { ReviewForm } from '@/components/member-portal/reviews/review-form';
import { FeedbackChat } from '@/components/member-portal/feedback/feedback-chat';
import { signOut } from '@/lib/actions/pin-auth';
import { toast } from 'sonner';
import type { GymReview, FeedbackRequest, FeedbackMessage } from '@/types/database';

interface SettingsPageContentProps {
  memberId: string;
  gymId: string;
  gymSlug: string;
  memberName: string;
  memberEmail: string | null;
  memberAvatar: string | null;
  payments: any[];
  existingReview: GymReview | null;
  feedbackRequests: FeedbackRequest[];
  feedbackMessages: FeedbackMessage[];
  memberPreferences: any;
  initialTab?: string;
}

const VALID_TABS = ['payments', 'review', 'feedback', 'notifications'];

const TAB_TITLES: Record<string, string> = {
  payments: 'Payments',
  review: 'Rate Your Gym',
  feedback: 'Feedback',
  notifications: 'Notifications',
};

export function SettingsPageContent({
  memberId,
  gymId,
  gymSlug,
  memberName,
  memberEmail,
  memberAvatar,
  payments,
  existingReview,
  feedbackRequests,
  feedbackMessages,
  memberPreferences,
  initialTab,
}: SettingsPageContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string | null>(
    VALID_TABS.includes(initialTab || '') ? initialTab! : null
  );
  const [loggingOut, setLoggingOut] = useState(false);

  const initial = (memberName || 'M').charAt(0).toUpperCase();

  const openTab = (tab: string) => {
    setActiveTab(tab);
    router.replace(`/${gymSlug}/portal/settings?tab=${tab}`, { scroll: false });
  };

  const closeTab = () => {
    setActiveTab(null);
    router.replace(`/${gymSlug}/portal/settings`, { scroll: false });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success('Logged out successfully');
      router.push(`/${gymSlug}`);
      router.refresh();
    } catch {
      toast.error('Failed to log out');
      setLoggingOut(false);
    }
  };

  // Detail view when a tab is active
  if (activeTab) {
    return (
      <div className="space-y-4">
        <button
          onClick={closeTab}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-base font-semibold text-white">{TAB_TITLES[activeTab]}</span>
        </button>

        {activeTab === 'payments' && <PaymentsContent payments={payments} />}
        {activeTab === 'review' && (
          <div className="max-w-lg">
            <ReviewForm gymId={gymId} memberId={memberId} existingReview={existingReview} />
          </div>
        )}
        {activeTab === 'feedback' && (
          <FeedbackChat
            memberId={memberId}
            gymId={gymId}
            initialMessages={feedbackMessages}
          />
        )}
        {activeTab === 'notifications' && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsForm
                memberId={memberId}
                gymId={gymId}
                initialPreferences={memberPreferences}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Menu view
  return (
    <div className="-mt-[72px] -mx-4">
      {/* Hero section — gradient starts behind the top nav bar */}
      <div className="relative bg-gradient-to-b from-brand-cyan-500/25 via-brand-cyan-500/8 to-transparent pt-24 pb-14 px-4">
        <div className="flex flex-col items-center">
          {memberAvatar ? (
            <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-brand-cyan-400/40 ring-offset-2 ring-offset-slate-950">
              <Image src={memberAvatar} alt={memberName} fill className="object-cover" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-brand-cyan-500/15 ring-2 ring-brand-cyan-400/40 ring-offset-2 ring-offset-slate-950 flex items-center justify-center">
              <span className="text-2xl font-bold text-brand-cyan-400">{initial}</span>
            </div>
          )}
          <h2 className="mt-3 text-lg font-bold text-white">{memberName}</h2>
          {memberEmail && (
            <p className="text-sm text-slate-400 mt-0.5">{memberEmail}</p>
          )}
        </div>
      </div>

      {/* Menu sections */}
      <div className="px-4 -mt-4 space-y-6">
        {/* Account */}
        <MenuSection title="Account">
          <MenuItem
            icon={<User className="h-5 w-5" />}
            label="Edit Profile"
            onClick={() => router.push(`/${gymSlug}/portal/profile`)}
          />
          <MenuItem
            icon={<KeyRound className="h-5 w-5" />}
            label="Change PIN"
            onClick={() => router.push(`/${gymSlug}/portal/profile/change-pin`)}
          />
          <MenuItem
            icon={<Bell className="h-5 w-5" />}
            label="Notifications"
            onClick={() => openTab('notifications')}
          />
        </MenuSection>

        {/* Membership */}
        <MenuSection title="Membership">
          <MenuItem
            icon={<IndianRupee className="h-5 w-5" />}
            label="Payments"
            onClick={() => openTab('payments')}
          />
          <MenuItem
            icon={<Star className="h-5 w-5" />}
            label="Rate Your Gym"
            onClick={() => openTab('review')}
          />
          <MenuItem
            icon={<MessageSquare className="h-5 w-5" />}
            label="Feedback"
            onClick={() => openTab('feedback')}
          />
        </MenuSection>

        {/* Logout */}
        <div className="pt-2 pb-8">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">
              {loggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Menu Components ────────────────────────────────────────────── */

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
        {title}
      </h3>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 divide-y divide-slate-700/50 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-700/30 active:bg-slate-700/40 transition-colors"
    >
      <span className="text-slate-400">{icon}</span>
      <span className="flex-1 text-left text-sm font-medium text-slate-200">{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-600" />
    </button>
  );
}

/* ─── Tab Detail Components ──────────────────────────────────────── */

function PaymentsContent({ payments }: { payments: any[] }) {
  const allPayments = payments || [];
  const now = new Date();
  const pendingPayments = allPayments.filter(
    (p) => p.status === 'pending' && new Date(p.payment_date) >= now
  );
  const totalPaid = allPayments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = allPayments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <div className="flex justify-center mb-1.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-lg font-bold text-white">{formatCurrency(totalPaid)}</p>
          <p className="text-[11px] text-slate-500">Total Paid</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <div className="flex justify-center mb-1.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <p className="text-lg font-bold text-white">{formatCurrency(pendingAmount)}</p>
          <p className="text-[11px] text-slate-500">Pending</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <div className="flex justify-center mb-1.5">
            <div className="p-1.5 rounded-lg bg-brand-cyan-500/10">
              <IndianRupee className="h-4 w-4 text-brand-cyan-400" />
            </div>
          </div>
          <p className="text-lg font-bold text-white">{allPayments.length}</p>
          <p className="text-[11px] text-slate-500">Transactions</p>
        </div>
      </div>

      {/* Upcoming Dues */}
      {pendingPayments.length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-amber-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Dues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {payment.description || payment.type}
                    </p>
                    <p className="text-xs text-slate-400">
                      Due: {formatDate(payment.payment_date)}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-amber-400 flex-shrink-0">
                    {formatCurrency(payment.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">All Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {allPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <IndianRupee className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-sm font-medium text-white mb-1">No payments yet</h3>
              <p className="text-sm text-slate-400">
                Your payment records will appear here once available.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {payment.description || payment.type}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{payment.type}</p>
                    </div>
                    <p className="text-sm font-semibold text-white flex-shrink-0 ml-2">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{formatDate(payment.payment_date)}</span>
                    <div className="flex items-center gap-2">
                      {payment.payment_method && (
                        <span className="text-slate-500 capitalize">
                          {payment.payment_method.replace(/_/g, ' ')}
                        </span>
                      )}
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    completed: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    pending: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      icon: <Clock className="h-3 w-3" />,
    },
    failed: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      icon: <XCircle className="h-3 w-3" />,
    },
    refunded: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      icon: <RotateCcw className="h-3 w-3" />,
    },
  };

  const c = config[status] || config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.icon}
      <span className="capitalize">{status}</span>
    </span>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
