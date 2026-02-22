'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  CheckCircle2,
  Clock,
  Gift,
  Award,
  Loader2,
} from 'lucide-react';
import { updateReferralStatus } from '@/lib/actions/referrals';
import type { ReferralWithMembers } from '@/types/database';
import { toast } from 'sonner';

interface ReferralsManagerProps {
  referrals: ReferralWithMembers[];
  stats: {
    totalReferrals: number;
    convertedCount: number;
    pendingCount: number;
  };
}

export function ReferralsManager({ referrals: initialReferrals, stats }: ReferralsManagerProps) {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [loading, setLoading] = useState<string | null>(null);
  const [bonusDialog, setBonusDialog] = useState<{
    open: boolean;
    referralId: string;
    referrerName: string;
  }>({ open: false, referralId: '', referrerName: '' });
  const [bonusType, setBonusType] = useState<string>('free_days');
  const [bonusValue, setBonusValue] = useState<string>('');

  const handleMarkConverted = async (referralId: string) => {
    setLoading(referralId);
    const result = await updateReferralStatus(referralId, 'converted');
    if (result.success) {
      setReferrals((prev) =>
        prev.map((r) => (r.id === referralId ? { ...r, status: 'converted' as const } : r))
      );
      toast.success('Referral marked as converted');
    } else {
      toast.error(result.error || 'Failed to update referral');
    }
    setLoading(null);
  };

  const handleApplyBonus = async () => {
    if (!bonusValue) {
      toast.error('Please enter a bonus value');
      return;
    }

    setLoading(bonusDialog.referralId);
    const result = await updateReferralStatus(
      bonusDialog.referralId,
      'rewarded',
      bonusType,
      parseFloat(bonusValue)
    );

    if (result.success) {
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === bonusDialog.referralId
            ? {
                ...r,
                status: 'rewarded' as const,
                bonus_type: bonusType,
                bonus_value: parseFloat(bonusValue),
              }
            : r
        )
      );
      toast.success('Bonus applied successfully');
      setBonusDialog({ open: false, referralId: '', referrerName: '' });
      setBonusType('free_days');
      setBonusValue('');
    } else {
      toast.error(result.error || 'Failed to apply bonus');
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Referrals
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Converted
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.convertedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            All Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium mb-1">No referrals yet</h3>
              <p className="text-sm text-muted-foreground">
                Referrals will appear here when members share their codes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">
                      Referrer
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Referred
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Bonus
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-right py-3 px-6 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-muted/50">
                      <td className="py-3 px-6">
                        <div>
                          <p className="font-medium">
                            {referral.referrer?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {referral.referrer?.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {referral.referred?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {referral.referred?.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <ReferralStatusBadge status={referral.status} />
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {referral.bonus_type ? (
                          <span className="text-blue-600">
                            {referral.bonus_type.replace(/_/g, ' ')}: {referral.bonus_value}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(referral.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {referral.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkConverted(referral.id)}
                              disabled={loading === referral.id}
                            >
                              {loading === referral.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Convert
                                </>
                              )}
                            </Button>
                          )}
                          {(referral.status === 'converted' || referral.status === 'pending') &&
                            !referral.bonus_type && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setBonusDialog({
                                    open: true,
                                    referralId: referral.id,
                                    referrerName: referral.referrer?.full_name || 'Unknown',
                                  })
                                }
                                disabled={loading === referral.id}
                              >
                                <Award className="h-3 w-3 mr-1" />
                                Bonus
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bonus Dialog */}
      <Dialog
        open={bonusDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setBonusDialog({ open: false, referralId: '', referrerName: '' });
            setBonusType('free_days');
            setBonusValue('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Referral Bonus</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apply a bonus reward for <strong>{bonusDialog.referrerName}</strong> for their referral.
          </p>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bonus Type</Label>
              <Select value={bonusType} onValueChange={setBonusType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free_days">Free Days</SelectItem>
                  <SelectItem value="discount">Discount (%)</SelectItem>
                  <SelectItem value="cash">Cash Reward</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {bonusType === 'free_days'
                  ? 'Number of Days'
                  : bonusType === 'discount'
                  ? 'Discount Percentage'
                  : 'Cash Amount'}
              </Label>
              <Input
                type="number"
                value={bonusValue}
                onChange={(e) => setBonusValue(e.target.value)}
                placeholder={
                  bonusType === 'free_days'
                    ? 'e.g. 7'
                    : bonusType === 'discount'
                    ? 'e.g. 10'
                    : 'e.g. 500'
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBonusDialog({ open: false, referralId: '', referrerName: '' })}
            >
              Cancel
            </Button>
            <Button onClick={handleApplyBonus} disabled={!!loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Award className="h-4 w-4 mr-2" />
              )}
              Apply Bonus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReferralStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
    converted: { bg: 'bg-green-100', text: 'text-green-700' },
    rewarded: { bg: 'bg-blue-100', text: 'text-blue-700' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const c = config[status] || config.pending;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className="capitalize">{status}</span>
    </span>
  );
}
