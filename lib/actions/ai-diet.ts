'use server';

import Anthropic from '@anthropic-ai/sdk';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================
// AI DIET PLAN GENERATION
// ============================================================

export interface AiDietInput {
  memberId: string;
  gymId: string;
  goal: 'lose_weight' | 'gain_muscle' | 'maintain';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietaryPreference: 'veg' | 'non_veg' | 'vegan' | 'eggetarian';
  cuisinePreferences: string[];
  allergies: string;
  mealsPerDay: 3 | 4;
  weight: number; // in kg
  heightFeet: number;
  heightInches: number;
  age: number;
  gender: string;
  targetWeight?: number;
}

interface MealPlanItem {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DayPlan {
  day: number;
  meals: MealPlanItem[];
}

interface GeneratedPlan {
  name: string;
  description: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  days: DayPlan[];
}

export async function generateAiDietPlan(input: AiDietInput) {
  try {
    // Check eligibility first
    const eligibility = await checkAiPlanEligibility(input.memberId);
    if (!eligibility.eligible) {
      return { success: false, error: 'You have already used your AI diet plan generation.' };
    }

    const goalLabel = {
      lose_weight: 'lose weight (calorie deficit)',
      gain_muscle: 'gain muscle (calorie surplus)',
      maintain: 'maintain current weight',
    }[input.goal];

    const activityLabel = {
      sedentary: 'Sedentary (little to no exercise)',
      light: 'Lightly Active (light exercise 1-3 days/week)',
      moderate: 'Moderately Active (moderate exercise 3-5 days/week)',
      active: 'Very Active (hard exercise 6-7 days/week)',
      very_active: 'Extremely Active (very hard exercise, physical job)',
    }[input.activityLevel];

    const dietLabel = {
      veg: 'Vegetarian',
      non_veg: 'Non-Vegetarian',
      vegan: 'Vegan',
      eggetarian: 'Eggetarian (vegetarian + eggs)',
    }[input.dietaryPreference];

    const mealTypes = input.mealsPerDay === 4
      ? 'breakfast, lunch, dinner, snack'
      : 'breakfast, lunch, dinner';

    // Convert feet/inches to cm for BMR calculation context
    const heightCm = Math.round(input.heightFeet * 30.48 + input.heightInches * 2.54);

    const prompt = `You are a certified Indian nutritionist creating a personalized 7-day meal plan for a gym member in India.

Member Profile:
- Gender: ${input.gender}
- Age: ${input.age} years
- Weight: ${input.weight} kg
- Height: ${input.heightFeet}'${input.heightInches}" (${heightCm} cm)
${input.targetWeight ? `- Target Weight: ${input.targetWeight} kg` : ''}

Goals & Lifestyle:
- Goal: ${goalLabel}
- Activity Level: ${activityLabel}
- Diet Type: ${dietLabel}
- Cuisine Preferences: ${input.cuisinePreferences.join(', ') || 'Indian'}
- Allergies/Restrictions: ${input.allergies || 'None'}
- Meals per day: ${input.mealsPerDay} (${mealTypes})

Create a detailed 7-day meal plan. Each day should have exactly ${input.mealsPerDay} meals.
Calculate appropriate daily calorie and macro targets based on the member's profile and goals using the Mifflin-St Jeor equation.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "name": "Plan name based on goal",
  "description": "Brief description of the plan approach",
  "dailyCalories": <number>,
  "dailyProtein": <number in grams>,
  "dailyCarbs": <number in grams>,
  "dailyFat": <number in grams>,
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "meal_type": "breakfast",
          "name": "Meal name",
          "description": "Brief description with key ingredients and approximate quantity",
          "calories": <number>,
          "protein": <number>,
          "carbs": <number>,
          "fat": <number>
        }
      ]
    }
  ]
}

Important:
- Primarily use Indian foods and ingredients (dal, roti, rice, paneer, chicken tikka, poha, idli, dosa, upma, curd, buttermilk, sabzi, etc.) unless the cuisine preference specifies otherwise
- Use Indian portion sizes and cooking styles
- Each meal's macros should be realistic and add up correctly
- Daily totals across meals should approximately match the daily targets
- Ensure variety across the 7 days — don't repeat the same meal
- All nutrition values must be integers`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { success: false, error: 'Failed to generate diet plan - no response from AI.' };
    }

    let plan: GeneratedPlan;
    try {
      plan = JSON.parse(textBlock.text);
    } catch {
      // Try extracting JSON from potential markdown code blocks
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { success: false, error: 'Failed to parse AI response.' };
      }
      plan = JSON.parse(jsonMatch[0]);
    }

    // Save to database
    const supabase = createAdminSupabaseClient();

    // Create the diet plan
    const { data: dietPlan, error: planError } = await supabase
      .from('diet_plans')
      .insert({
        member_id: input.memberId,
        gym_id: input.gymId,
        name: plan.name,
        description: plan.description,
        target_calories: plan.dailyCalories,
        target_protein: plan.dailyProtein,
        target_carbs: plan.dailyCarbs,
        target_fat: plan.dailyFat,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true,
        is_ai_generated: true,
      })
      .select()
      .single();

    if (planError) throw planError;

    // Create meal plans for all 7 days
    const today = new Date();
    const mealRecords = [];

    for (const dayPlan of plan.days) {
      const date = new Date(today);
      date.setDate(today.getDate() + (dayPlan.day - 1));
      const dateStr = date.toISOString().split('T')[0];

      for (const meal of dayPlan.meals) {
        mealRecords.push({
          diet_plan_id: dietPlan.id,
          scheduled_for: date.toISOString(),
          scheduled_date: dateStr,
          meal_type: meal.meal_type,
          name: meal.name,
          description: meal.description,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
        });
      }
    }

    const { error: mealsError } = await supabase
      .from('meal_plans')
      .insert(mealRecords);

    if (mealsError) throw mealsError;

    // Mark AI plan as used for this member
    await supabase
      .from('members')
      .update({ ai_plan_used: true })
      .eq('id', input.memberId);

    revalidatePath('/portal/diet');

    return { success: true, data: { plan: dietPlan, generatedPlan: plan } };
  } catch (error: any) {
    console.error('Error generating AI diet plan:', error);
    return { success: false, error: error.message || 'Failed to generate diet plan.' };
  }
}

// ============================================================
// MEAL PHOTO ANALYSIS
// ============================================================

export interface AnalyzedMeal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: {
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
}

export interface SnapInfo {
  url: string;
  status: 'temp' | 'permanent';
  path: string; // storage path for deletion
}

export async function getSnapUsage(memberId: string): Promise<{ used: number; limit: number; snaps: SnapInfo[] }> {
  const supabase = createAdminSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  const { data: member } = await supabase
    .from('members')
    .select('metadata')
    .eq('id', memberId)
    .single();

  const metadata = member?.metadata || {};
  const snapUsage = metadata.snap_usage || {};

  // If it's a new day, cleanup old temp images
  if (snapUsage.date && snapUsage.date !== today && snapUsage.snaps?.length) {
    const tempSnaps = (snapUsage.snaps as SnapInfo[]).filter((s) => s.status === 'temp');
    if (tempSnaps.length > 0) {
      await supabase.storage
        .from('meal-snaps')
        .remove(tempSnaps.map((s) => s.path));
    }
    // Reset for new day
    await supabase
      .from('members')
      .update({
        metadata: {
          ...metadata,
          snap_usage: { date: today, count: 0, snaps: [] },
        },
      })
      .eq('id', memberId);
    return { used: 0, limit: 5, snaps: [] };
  }

  const used = snapUsage.date === today ? (snapUsage.count || 0) : 0;
  const snaps: SnapInfo[] = snapUsage.date === today ? (snapUsage.snaps || []) : [];
  return { used, limit: 5, snaps };
}

async function uploadSnapImage(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  memberId: string,
  imageBase64: string,
): Promise<{ url: string; path: string } | null> {
  try {
    // Ensure bucket exists
    await supabase.storage.createBucket('meal-snaps', { public: true });
  } catch {
    // bucket already exists
  }

  const today = new Date().toISOString().split('T')[0];
  const fileName = `${memberId}/${today}/${Date.now()}.jpg`;

  // Convert base64 to buffer
  let base64Data = imageBase64;
  if (base64Data.startsWith('data:')) {
    base64Data = base64Data.replace(/^data:image\/\w+;base64,/, '');
  }
  const buffer = Buffer.from(base64Data, 'base64');

  const { error } = await supabase.storage
    .from('meal-snaps')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    console.error('Failed to upload snap image:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('meal-snaps')
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl, path: fileName };
}

/** Mark a snap image as permanent (called when meal is added to food log) */
export async function markSnapPermanent(memberId: string, imageUrl: string) {
  const supabase = createAdminSupabaseClient();
  const { data: member } = await supabase
    .from('members')
    .select('metadata')
    .eq('id', memberId)
    .single();

  const metadata = member?.metadata || {};
  const snapUsage = metadata.snap_usage || {};
  const snaps: SnapInfo[] = snapUsage.snaps || [];

  const updated = snaps.map((s) =>
    s.url === imageUrl ? { ...s, status: 'permanent' as const } : s
  );

  await supabase
    .from('members')
    .update({
      metadata: {
        ...metadata,
        snap_usage: { ...snapUsage, snaps: updated },
      },
    })
    .eq('id', memberId);
}

export async function analyzeMealPhoto(
  imageBase64: string,
  mealType: string,
  memberId?: string
): Promise<{ success: boolean; data?: AnalyzedMeal; error?: string; remaining?: number; imageUrl?: string }> {
  const supabase = createAdminSupabaseClient();
  let snapsRemaining = 5;
  let snapImageUrl = '';

  try {
    // Rate limit: 5 API calls per day per member (counts every attempt)
    if (memberId) {
      const today = new Date().toISOString().split('T')[0];
      const { data: member } = await supabase
        .from('members')
        .select('metadata')
        .eq('id', memberId)
        .single();

      const metadata = member?.metadata || {};
      const snapUsage = metadata.snap_usage || {};
      const todayCount = snapUsage.date === today ? (snapUsage.count || 0) : 0;
      const existingSnaps: SnapInfo[] = snapUsage.date === today ? (snapUsage.snaps || []) : [];

      if (todayCount >= 5) {
        return { success: false, error: `Daily limit reached (5/5). Try again tomorrow.`, remaining: 0 };
      }

      // Upload image to storage
      const uploaded = await uploadSnapImage(supabase, memberId, imageBase64);
      const newSnap: SnapInfo | null = uploaded
        ? { url: uploaded.url, status: 'temp', path: uploaded.path }
        : null;
      if (uploaded) snapImageUrl = uploaded.url;

      const newCount = todayCount + 1;
      snapsRemaining = 5 - newCount;
      const updatedSnaps = newSnap ? [...existingSnaps, newSnap] : existingSnaps;

      // Increment count and save snap info BEFORE calling the API
      await supabase
        .from('members')
        .update({
          metadata: {
            ...metadata,
            snap_usage: { date: today, count: newCount, snaps: updatedSnaps },
          },
        })
        .eq('id', memberId);
    }

    // Determine the media type from the base64 string
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mediaType = match[1] as typeof mediaType;
        imageBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analyze this ${mealType} photo and identify all food items. This is likely Indian food — recognize common Indian dishes (dal, roti, rice, sabzi, curry, dosa, idli, paratha, biryani, etc.) and use standard Indian serving sizes. Estimate the nutritional content for each item and provide totals.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "name": "Overall meal name",
  "description": "Brief description of the meal",
  "calories": <total calories>,
  "protein": <total protein in grams>,
  "carbs": <total carbs in grams>,
  "fat": <total fat in grams>,
  "items": [
    {
      "name": "Food item name",
      "quantity": "Estimated quantity (e.g., '2 rotis', '1 katori', '1 bowl', '200g')",
      "calories": <number>,
      "protein": <number>,
      "carbs": <number>,
      "fat": <number>
    }
  ]
}

All nutrition values must be integers. Be as accurate as possible with estimations based on visual portion sizes.

CRITICAL: You MUST ALWAYS respond with ONLY valid JSON in the exact format above. NEVER write explanations or prose.
If the image does not contain food, respond with: {"name":"Not food","description":"No food detected","calories":0,"protein":0,"carbs":0,"fat":0,"items":[]}`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { success: false, error: 'Failed to analyze meal photo.' };
    }

    let analyzed: AnalyzedMeal;
    let rawText = textBlock.text.trim();

    // Strip markdown code fences if present
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    try {
      analyzed = JSON.parse(rawText);
    } catch {
      // Try to extract JSON object from surrounding text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('AI response not parseable:', textBlock.text);
        return { success: false, error: "Couldn't identify food in this photo. Try again with a clearer shot of your meal.", remaining: snapsRemaining, imageUrl: snapImageUrl };
      }
      try {
        analyzed = JSON.parse(jsonMatch[0]);
      } catch {
        console.error('AI response not parseable:', textBlock.text);
        return { success: false, error: "Couldn't identify food in this photo. Try again with a clearer shot of your meal.", remaining: snapsRemaining, imageUrl: snapImageUrl };
      }
    }

    // Detect when AI couldn't identify food
    const nameLower = analyzed.name.toLowerCase();
    if (
      analyzed.calories === 0 && analyzed.protein === 0 && analyzed.carbs === 0 && analyzed.fat === 0 ||
      nameLower.includes('unable to determine') ||
      nameLower.includes('not food') ||
      nameLower.includes('cannot determine') ||
      nameLower.includes('insufficient')
    ) {
      return { success: false, error: "Couldn't identify food in this photo. Try again with a clearer shot of your meal.", remaining: snapsRemaining, imageUrl: snapImageUrl };
    }

    return { success: true, data: analyzed, remaining: snapsRemaining, imageUrl: snapImageUrl };
  } catch (error: any) {
    console.error('Error analyzing meal photo:', error);
    return { success: false, error: error.message || 'Failed to analyze meal photo.' };
  }
}

// ============================================================
// AI PLAN ELIGIBILITY CHECK
// ============================================================

export async function checkAiPlanEligibility(
  memberId: string
): Promise<{ eligible: boolean; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('members')
      .select('ai_plan_used')
      .eq('id', memberId)
      .single();

    if (error) throw error;

    return { eligible: !data?.ai_plan_used };
  } catch (error: any) {
    console.error('Error checking AI plan eligibility:', error);
    return { eligible: false, error: error.message };
  }
}
