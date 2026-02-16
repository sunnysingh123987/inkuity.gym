import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getDietPlans } from '@/lib/actions/members-portal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Apple, Plus } from 'lucide-react';
import Link from 'next/link';
import { DietPlanCard } from '@/components/member-portal/diet/diet-plan-card';

export default async function DietPlansPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  const { data: plans } = await getDietPlans(memberId, gymId);

  const activePlans = plans?.filter((p: any) => p.is_active) || [];
  const inactivePlans = plans?.filter((p: any) => !p.is_active) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diet Plans</h1>
          <p className="text-gray-600 mt-1">
            Manage your nutrition and meal plans
          </p>
        </div>
        <Button asChild>
          <Link href={`/${params.slug}/portal/diet/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Diet Plan
          </Link>
        </Button>
      </div>

      {/* Active Plans */}
      {activePlans.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Active Plans</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activePlans.map((plan: any) => (
              <DietPlanCard
                key={plan.id}
                plan={plan}
                gymSlug={params.slug}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Plans */}
      {inactivePlans.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Inactive Plans
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inactivePlans.map((plan: any) => (
              <DietPlanCard
                key={plan.id}
                plan={plan}
                gymSlug={params.slug}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {plans && plans.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Apple className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No diet plans yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first diet plan to start tracking your nutrition
            </p>
            <Button asChild>
              <Link href={`/${params.slug}/portal/diet/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Diet Plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
