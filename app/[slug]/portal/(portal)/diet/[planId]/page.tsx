import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DietPlanForm } from '@/components/member-portal/diet/diet-plan-form';

export default async function DietPlanDetailPage({
  params,
}: {
  params: { slug: string; planId: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  const isNew = params.planId === 'new';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'Create Diet Plan' : 'Edit Diet Plan'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isNew
            ? 'Set up your nutrition goals and macro targets'
            : 'Update your diet plan settings'}
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DietPlanForm
            gymSlug={params.slug}
            memberId={memberId}
            gymId={gymId}
            planId={isNew ? undefined : params.planId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
