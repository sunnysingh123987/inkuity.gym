import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { getMealsForDate, getActiveDietPlan } from '@/lib/actions/members-portal';
import { MealManagement } from '@/components/member-portal/diet/meal-management';

export default async function MealCalendarPage({
  params,
}: {
  params: { slug: string; planId: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  // Get the diet plan
  const { data: activePlan } = await getActiveDietPlan(
    memberId,
    gymId
  );

  if (!activePlan) {
    redirect(`/${params.slug}/portal/diet`);
  }

  // Get meals for current week (we'll load more client-side)
  const today = new Date();
  const { data: todayMeals } = await getMealsForDate(
    activePlan.id,
    today.toISOString().split('T')[0]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{activePlan.name}</h1>
        <p className="text-gray-600 mt-1">Plan and track your daily meals</p>
      </div>

      {/* Meal Management */}
      <MealManagement
        planId={activePlan.id}
        gymSlug={params.slug}
        targetCalories={activePlan.target_calories || 0}
        targetProtein={activePlan.target_protein || 0}
        targetCarbs={activePlan.target_carbs || 0}
        targetFat={activePlan.target_fat || 0}
        initialMeals={todayMeals || []}
      />
    </div>
  );
}
