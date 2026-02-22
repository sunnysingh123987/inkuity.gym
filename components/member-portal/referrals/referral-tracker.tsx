'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Copy, Check, Share2, Users, Clock, CheckCircle2, Award } from 'lucide-react';
import type { ReferralWithMembers } from '@/types/database';
import { toast } from 'sonner';

interface ReferralTrackerProps {
  memberId: string;
  gymSlug: string;
  referrals: ReferralWithMembers[];
}

export function ReferralTracker({ memberId, gymSlug, referrals }: ReferralTrackerProps) {
  const [copied, setCopied] = useState(false);

  const referralCode = memberId.slice(0, 8);
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/${gymSlug}?ref=${referralCode}`;

  const convertedCount = referrals.filter((r) => r.status === 'converted' || r.status === 'rewarded').length;
  const pendingCount = referrals.filter((r) => r.status === 'pending').length;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Join me at the gym! Use my referral link to sign up: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-5 w-5 text-brand-cyan-500" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-mono text-lg font-bold text-gray-900 tracking-wider text-center">
              {referralCode}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Share this link with friends:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white rounded border border-gray-200 px-3 py-2 text-gray-700 truncate">
                {referralLink}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button
              onClick={handleShareWhatsApp}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share on WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-5 w-5 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{referrals.length}</p>
            <p className="text-xs text-gray-500">Total Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{convertedCount}</p>
            <p className="text-xs text-gray-500">Converted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-5 w-5 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No referrals yet
              </h3>
              <p className="text-sm text-gray-500">
                Share your referral code with friends and track them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {referral.referred?.full_name || 'Pending Member'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(referral.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <ReferralStatusBadge status={referral.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReferralStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pending: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      icon: <Clock className="h-3 w-3" />,
    },
    converted: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    rewarded: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: <Award className="h-3 w-3" />,
    },
    expired: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: <Clock className="h-3 w-3" />,
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
