import { getGyms } from '@/lib/actions/gyms';
import { getReferrals, getReferralStats } from '@/lib/actions/referrals';
import { ReferralsManager } from '@/components/dashboard/referrals/referrals-manager';

export const metadata = {
  title: 'Referrals - Inkuity',
  description: 'Manage member referrals and rewards',
};

export default async function ReferralsPage() {
  const { data: gyms } = await getGyms();
  const gym = gyms[0] || null;

  let referrals: any[] = [];
  let stats = { totalReferrals: 0, convertedCount: 0, pendingCount: 0 };

  if (gym) {
    const [referralsResult, statsResult] = await Promise.all([
      getReferrals(gym.id),
      getReferralStats(gym.id),
    ]);
    referrals = referralsResult.data || [];
    stats = statsResult.data || stats;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track member referrals, manage conversions, and apply rewards.
        </p>
      </div>

      <ReferralsManager referrals={referrals} stats={stats} />
    </div>
  );
}
