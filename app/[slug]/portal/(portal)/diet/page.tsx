import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import {
  getActiveDietPlan,
  createDietPlan,
  getFoodItems,
  getFoodLogEntries,
  seedDefaultFoodItems,
} from '@/lib/actions/members-portal';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { NutritionTrackerPage } from '@/components/member-portal/diet/nutrition-tracker-page';

export const dynamic = 'force-dynamic';

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

  // Get member weight
  const supabase = createAdminSupabaseClient();
  const { data: member } = await supabase
    .from('members')
    .select('weight_kg, height_feet, height_inches, gender')
    .eq('id', memberId)
    .single();
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
        memberWeightKg={member?.weight_kg || null}
        memberHeightFeet={member?.height_feet || null}
        memberHeightInches={member?.height_inches || null}
        memberGender={member?.gender || null}
      />
    );
  }

  // Seed default food items if first time
  await seedDefaultFoodItems(memberId, gymId);

  // Fetch all data in parallel
  const [foodItemsResult, foodLogResult] = await Promise.all([
    getFoodItems(memberId, gymId),
    getFoodLogEntries(memberId, gymId, today),
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
      memberWeightKg={member?.weight_kg || null}
      memberHeightFeet={member?.height_feet || null}
      memberHeightInches={member?.height_inches || null}
      memberGender={member?.gender || null}
    />
  );
}
