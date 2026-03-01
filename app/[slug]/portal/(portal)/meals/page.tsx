import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import {
  getActiveDietPlan,
  createDietPlan,
  getFoodItems,
  getFoodLogEntries,
  getCustomTrackers,
  seedDefaultFoodItems,
} from '@/lib/actions/members-portal';
import { NutritionTrackerPage } from '@/components/member-portal/diet/nutrition-tracker-page';

export default async function MealsPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }

  const { memberId, gymId } = authResult.data;
  const today = new Date().toISOString().split('T')[0];

  // Ensure member has an active diet plan (create default if none)
  let dietPlanResult = await getActiveDietPlan(memberId, gymId);
  if (!dietPlanResult.data) {
    await createDietPlan({
      memberId,
      gymId,
      name: 'My Nutrition Plan',
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 200,
      targetFat: 65,
      isActive: true,
    });
    dietPlanResult = await getActiveDietPlan(memberId, gymId);
  }

  const dietPlan = dietPlanResult.data;
  if (!dietPlan) {
    // Diet plan creation failed — show page with defaults
    return (
      <NutritionTrackerPage
        memberId={memberId}
        gymId={gymId}
        dietPlanId=""
        targets={{ calories: 2000, protein: 150, carbs: 200, fat: 65 }}
        initialFoodDatabase={[]}
        initialFoodLog={[]}
        initialTrackers={[]}
      />
    );
  }

  // Seed default food items if first time
  await seedDefaultFoodItems(memberId, gymId);

  // Fetch all data in parallel
  const [foodItemsResult, foodLogResult, trackersResult] = await Promise.all([
    getFoodItems(memberId, gymId),
    getFoodLogEntries(memberId, gymId, today),
    getCustomTrackers(memberId, gymId),
  ]);

  // Map DB food items to frontend shape
  const foodDatabase = (foodItemsResult.data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    servingSize: item.serving_size,
    caloriesPerServing: item.calories_per_serving,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  }));

  // Map DB food log entries to frontend shape
  const foodLog = (foodLogResult.data || []).map((entry: any) => ({
    id: entry.id,
    foodItemId: entry.food_item_id || '',
    name: entry.name,
    servingSize: entry.serving_size,
    quantity: entry.quantity,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    loggedAt: entry.logged_at,
  }));

  // Map DB trackers to frontend shape (with today's value)
  const trackers = (trackersResult.data || []).map((tracker: any) => {
    const todayLog = tracker.tracker_daily_log?.[0];
    return {
      id: tracker.id,
      name: tracker.name,
      unit: tracker.unit,
      dailyTarget: tracker.daily_target,
      current: todayLog?.current_value || 0,
      icon: tracker.icon,
      color: tracker.color,
    };
  });

  return (
    <NutritionTrackerPage
      memberId={memberId}
      gymId={gymId}
      dietPlanId={dietPlan.id}
      targets={{
        calories: dietPlan.target_calories || 2000,
        protein: dietPlan.target_protein || 150,
        carbs: dietPlan.target_carbs || 200,
        fat: dietPlan.target_fat || 65,
      }}
      initialFoodDatabase={foodDatabase}
      initialFoodLog={foodLog}
      initialTrackers={trackers}
    />
  );
}
