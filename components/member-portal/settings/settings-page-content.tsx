'use client';

import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SettingsForm } from '@/components/member-portal/settings/settings-form';
import { ReviewForm } from '@/components/member-portal/reviews/review-form';
import { FeedbackForm } from '@/components/member-portal/feedback/feedback-form';
import {
  IndianRupee,
  Star,
  MessageSquare,
  Bell,
  LogOut,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { signOut } from '@/lib/actions/pin-auth';
import { toast } from 'sonner';
import type { GymReview, FeedbackRequest } from '@/types/database';

interface SettingsPageContentProps {
  memberId: string;
  gymId: string;
  gymSlug: string;
  payments: any[];
  existingReview: GymReview | null;
  feedbackRequests: FeedbackRequest[];
  memberPreferences: any;
  initialTab?: string;
}

const VALID_TABS = ['payments', 'review', 'feedback', 'notifications'];

export function SettingsPageContent({
  memberId,
  gymId,
  gymSlug,
  payments,
  existingReview,
  feedbackRequests,
  memberPreferences,
  initialTab,
}: SettingsPageContentProps) {
  const router = useRouter();
  const defaultTab = VALID_TABS.includes(initialTab || '') ? initialTab! : 'payments';

  const handleTabChange = (value: string) => {
    router.replace(`/${gymSlug}/portal/settings?tab=${value}`, { scroll: false });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      router.push(`/${gymSlug}`);
      router.refresh();
    } catch {
      toast.error('Failed to log out');
    }
  };

  // Payment calculations
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">
          Payments, reviews, feedback, and notification preferences
        </p>
      </div>

      <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Review</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Total Paid
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(totalPaid)}
                </div>
                <p className="text-xs text-slate-500 mt-1">All time</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Pending
                </CardTitle>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(pendingAmount)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {pendingPayments.length} upcoming
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Transactions
                </CardTitle>
                <div className="p-2 rounded-lg bg-brand-cyan-500/10">
                  <IndianRupee className="h-4 w-4 text-brand-cyan-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {allPayments.length}
                </div>
                <p className="text-xs text-slate-500 mt-1">All records</p>
              </CardContent>
            </Card>
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

          {/* Payment History Table */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">
                All Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allPayments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <IndianRupee className="h-8 w-8 text-slate-500" />
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    No payments yet
                  </h3>
                  <p className="text-sm text-slate-400">
                    Your payment records will appear here once available.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile: Card layout */}
                  <div className="space-y-3 sm:hidden">
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
                          <span className="text-slate-400">
                            {formatDate(payment.payment_date)}
                          </span>
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

                  {/* Desktop: Table layout */}
                  <div className="hidden sm:block overflow-x-auto -mx-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-6 font-medium text-slate-400">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-400">Description</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-400">Method</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-400">Status</th>
                          <th className="text-right py-3 px-6 font-medium text-slate-400">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {allPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-slate-800/50">
                            <td className="py-3 px-6 text-white whitespace-nowrap">
                              {formatDate(payment.payment_date)}
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              <div>{payment.description || payment.type}</div>
                              <div className="text-xs text-slate-500 capitalize">{payment.type}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-400 capitalize whitespace-nowrap">
                              {payment.payment_method
                                ? payment.payment_method.replace(/_/g, ' ')
                                : '\u2014'}
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={payment.status} />
                            </td>
                            <td className="py-3 px-6 text-right font-medium text-white whitespace-nowrap">
                              {formatCurrency(payment.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="sm:max-w-lg">
          <ReviewForm
            gymId={gymId}
            memberId={memberId}
            existingReview={existingReview}
          />
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          {feedbackRequests.length === 0 ? (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 mb-3">
                  <MessageSquare className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-white">No feedback requests</p>
                <p className="text-xs text-slate-400 mt-1">
                  You don&apos;t have any pending feedback requests at the moment.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:max-w-lg">
              {feedbackRequests.map((request) => (
                <FeedbackForm key={request.id} feedbackRequest={request} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsForm
                memberId={memberId}
                initialPreferences={memberPreferences}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Logout Button */}
      <div className="pt-4 border-t border-slate-800">
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full sm:w-auto"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

// Helper components
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    completed: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
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
