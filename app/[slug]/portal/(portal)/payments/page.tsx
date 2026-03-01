import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getMemberPaymentHistory } from '@/lib/actions/members-portal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { PageEntrance } from '@/components/animations/page-entrance';

export default async function PaymentsPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  const { data: payments } = await getMemberPaymentHistory(memberId, gymId);

  // Separate upcoming/pending from completed
  const now = new Date();
  const pendingPayments = (payments || []).filter(
    (p) => p.status === 'pending' && new Date(p.payment_date) >= now
  );
  const allPayments = payments || [];

  // Calculate totals
  const totalPaid = allPayments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingAmount = allPayments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageEntrance />

      <div data-animate>
        <h1 className="text-2xl font-bold text-white">Payment History</h1>
        <p className="text-slate-400 mt-1">
          View your payment records and upcoming dues
        </p>
      </div>

      {/* Summary Cards */}
      <div data-animate className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              Total Transactions
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
        <div data-animate>
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
                    className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {payment.description || payment.type}
                      </p>
                      <p className="text-xs text-slate-400">
                        Due: {formatDate(payment.payment_date)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-amber-400">
                      {formatCurrency(payment.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment History Table */}
      <div data-animate>
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
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-6 font-medium text-slate-400">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-400">
                        Description
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-400">
                        Period
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-400">
                        Method
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-400">
                        Status
                      </th>
                      <th className="text-right py-3 px-6 font-medium text-slate-400">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {allPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-800/50">
                        <td className="py-3 px-6 text-white whitespace-nowrap">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <div>
                            {payment.description || payment.type}
                          </div>
                          <div className="text-xs text-slate-500 capitalize">
                            {payment.type}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                          {payment.period_start && payment.period_end ? (
                            <>
                              {formatDate(payment.period_start)} &ndash;{' '}
                              {formatDate(payment.period_end)}
                            </>
                          ) : (
                            <span className="text-slate-600">&mdash;</span>
                          )}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---- Helper Components & Functions ----

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
