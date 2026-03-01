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

export async function analyzeMealPhoto(
  imageBase64: string,
  mealType: string,
  availableFoods?: string[]
): Promise<{ success: boolean; data?: AnalyzedMeal; error?: string }> {
  try {
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
      model: 'claude-sonnet-4-6',
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
              text: `Analyze this ${mealType} photo and identify all food items. This is likely Indian food — recognize common Indian dishes (dal, roti, rice, sabzi, curry, dosa, idli, paratha, biryani, etc.) and use standard Indian serving sizes. Estimate the nutritional content for each item and provide totals.${availableFoods && availableFoods.length > 0 ? `\n\nThe user already has these foods in their database: ${availableFoods.join(', ')}. If any detected food matches one of these, use the same name. If the food is different or not in the list, use an appropriate descriptive name — it will be added as a new food option.` : ''}

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

All nutrition values must be integers. Be as accurate as possible with estimations based on visual portion sizes.`,
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
    try {
      analyzed = JSON.parse(textBlock.text);
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { success: false, error: 'Failed to parse AI analysis.' };
      }
      analyzed = JSON.parse(jsonMatch[0]);
    }

    return { success: true, data: analyzed };
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
