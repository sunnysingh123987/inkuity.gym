'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// ============================================================
// MEMBER CHECK-IN HISTORY ACTIONS
// ============================================================

interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export async function getMemberCheckInHistory(
  memberId: string,
  gymId: string,
  filters?: DateRangeFilter
) {
  try {
    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from('check_ins')
      .select(`
        id,
        check_in_at,
        check_out_at,
        duration_minutes,
        notes,
        tags,
        scans (
          device_type,
          browser,
          os
        )
      `)
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('check_in_at', { ascending: false });

    // Apply date filters
    if (filters?.startDate) {
      query = query.gte('check_in_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('check_in_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching check-in history:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get check-in stats for a member
 */
export async function getMemberCheckInStats(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    // Total check-ins
    const { count: totalCheckIns } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('gym_id', gymId);

    // Check-ins this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: monthlyCheckIns } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .gte('check_in_at', startOfMonth.toISOString());

    // Check-ins this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { count: weeklyCheckIns } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .gte('check_in_at', startOfWeek.toISOString());

    // Last check-in
    const { data: lastCheckIn } = await supabase
      .from('check_ins')
      .select('check_in_at')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('check_in_at', { ascending: false })
      .limit(1)
      .single();

    return {
      success: true,
      stats: {
        total: totalCheckIns || 0,
        thisMonth: monthlyCheckIns || 0,
        thisWeek: weeklyCheckIns || 0,
        lastCheckIn: lastCheckIn?.check_in_at || null,
      },
    };
  } catch (error: any) {
    console.error('Error fetching check-in stats:', error);
    return {
      success: false,
      error: error.message,
      stats: { total: 0, thisMonth: 0, thisWeek: 0, lastCheckIn: null },
    };
  }
}

/**
 * Calculate current streak
 */
export async function getMemberStreak(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: recentCheckIns } = await supabase
      .from('check_ins')
      .select('check_in_at')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('check_in_at', { ascending: false })
      .limit(60); // Get last 60 check-ins

    if (!recentCheckIns || recentCheckIns.length === 0) {
      return { success: true, streak: 0 };
    }

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCheckInDate = new Date(recentCheckIns[0].check_in_at);
    lastCheckInDate.setHours(0, 0, 0, 0);

    // Check if last check-in was today or yesterday
    const daysDiff = Math.floor(
      (today.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 1) {
      currentStreak = 1;
      let prevDate = lastCheckInDate;

      for (let i = 1; i < recentCheckIns.length; i++) {
        const checkInDate = new Date(recentCheckIns[i].check_in_at);
        checkInDate.setHours(0, 0, 0, 0);

        const diff = Math.floor(
          (prevDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diff === 1) {
          currentStreak++;
          prevDate = checkInDate;
        } else {
          break;
        }
      }
    }

    return { success: true, streak: currentStreak };
  } catch (error: any) {
    console.error('Error calculating streak:', error);
    return { success: false, error: error.message, streak: 0 };
  }
}

/**
 * Get check-in calendar data (for calendar view)
 */
export async function getCheckInCalendarData(
  memberId: string,
  gymId: string,
  month: number,
  year: number
) {
  try {
    const supabase = createAdminSupabaseClient();

    // Get first and last day of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const { data, error } = await supabase
      .from('check_ins')
      .select('check_in_at')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .gte('check_in_at', startDate.toISOString())
      .lte('check_in_at', endDate.toISOString())
      .order('check_in_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const calendarData: Record<string, number> = {};

    data?.forEach((checkIn) => {
      const date = new Date(checkIn.check_in_at);
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;

      calendarData[dateKey] = (calendarData[dateKey] || 0) + 1;
    });

    return { success: true, data: calendarData };
  } catch (error: any) {
    console.error('Error fetching calendar data:', error);
    return { success: false, error: error.message, data: {} };
  }
}

/**
 * Export check-ins to CSV format
 */
export async function exportCheckInsToCSV(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        check_in_at,
        check_out_at,
        duration_minutes,
        notes
      `)
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('check_in_at', { ascending: false });

    if (error) throw error;

    // Create CSV content
    const headers = ['Date', 'Time', 'Check Out', 'Duration (min)', 'Notes'];
    const rows = data?.map((checkIn) => {
      const checkInDate = new Date(checkIn.check_in_at);
      const date = checkInDate.toLocaleDateString();
      const time = checkInDate.toLocaleTimeString();
      const checkOut = checkIn.check_out_at
        ? new Date(checkIn.check_out_at).toLocaleTimeString()
        : 'N/A';
      const duration = checkIn.duration_minutes || 'N/A';
      const notes = checkIn.notes || '';

      return [date, time, checkOut, duration, notes];
    });

    return {
      success: true,
      csv: {
        headers,
        rows: rows || [],
      },
    };
  } catch (error: any) {
    console.error('Error exporting check-ins:', error);
    return {
      success: false,
      error: error.message,
      csv: { headers: [], rows: [] },
    };
  }
}

// ============================================================
// WORKOUT ROUTINES ACTIONS
// ============================================================

/**
 * Get exercise library for a gym
 */
export async function getExerciseLibrary(
  gymId: string,
  category?: string
) {
  try {
    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from('exercise_library')
      .select('*')
      .eq('gym_id', gymId)
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching exercise library:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get all workout routines for a member
 */
export async function getWorkoutRoutines(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('workout_routines')
      .select(`
        id,
        name,
        description,
        schedule,
        is_active,
        created_at,
        updated_at,
        routine_exercises (
          id,
          order_index,
          sets,
          reps,
          duration_seconds,
          rest_seconds,
          exercise_library (
            id,
            name,
            category
          )
        )
      `)
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching workout routines:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get a single workout routine with exercises
 */
export async function getWorkoutRoutine(routineId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('workout_routines')
      .select(`
        *,
        routine_exercises (
          id,
          order_index,
          sets,
          reps,
          duration_seconds,
          rest_seconds,
          notes,
          exercise_library (
            id,
            name,
            description,
            category,
            equipment,
            instructions
          )
        )
      `)
      .eq('id', routineId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching workout routine:', error);
    return { success: false, error: error.message, data: null };
  }
}

interface CreateRoutineInput {
  memberId: string;
  gymId: string;
  name: string;
  description?: string;
  schedule?: string[];
  exercises: {
    exerciseId: string;
    sets: number;
    reps?: number;
    duration_seconds?: number;
    rest_seconds?: number;
    notes?: string;
  }[];
}

/**
 * Create a new workout routine
 */
export async function createWorkoutRoutine(input: CreateRoutineInput) {
  try {
    const supabase = createAdminSupabaseClient();

    // Create the routine
    const { data: routine, error: routineError } = await supabase
      .from('workout_routines')
      .insert({
        member_id: input.memberId,
        gym_id: input.gymId,
        name: input.name,
        description: input.description,
        schedule: input.schedule,
        is_active: true,
      })
      .select()
      .single();

    if (routineError) throw routineError;

    // Add exercises to the routine
    if (input.exercises.length > 0) {
      const routineExercises = input.exercises.map((exercise, index) => ({
        routine_id: routine.id,
        exercise_id: exercise.exerciseId,
        order_index: index,
        sets: exercise.sets,
        reps: exercise.reps,
        duration_seconds: exercise.duration_seconds,
        rest_seconds: exercise.rest_seconds || 60,
        notes: exercise.notes,
      }));

      const { error: exercisesError } = await supabase
        .from('routine_exercises')
        .insert(routineExercises);

      if (exercisesError) throw exercisesError;
    }

    revalidatePath('/portal/workouts');

    return { success: true, data: routine };
  } catch (error: any) {
    console.error('Error creating workout routine:', error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Update a workout routine
 */
export async function updateWorkoutRoutine(
  routineId: string,
  updates: {
    name?: string;
    description?: string;
    schedule?: string[];
    is_active?: boolean;
  }
) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('workout_routines')
      .update(updates)
      .eq('id', routineId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/workouts');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating workout routine:', error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Delete a workout routine
 */
export async function deleteWorkoutRoutine(routineId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('workout_routines')
      .delete()
      .eq('id', routineId);

    if (error) throw error;

    revalidatePath('/portal/workouts');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting workout routine:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add exercise to routine
 */
export async function addExerciseToRoutine(
  routineId: string,
  exerciseId: string,
  details: {
    sets: number;
    reps?: number;
    duration_seconds?: number;
    rest_seconds?: number;
    notes?: string;
  }
) {
  try {
    const supabase = createAdminSupabaseClient();

    // Get current max order_index
    const { data: existingExercises } = await supabase
      .from('routine_exercises')
      .select('order_index')
      .eq('routine_id', routineId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex =
      existingExercises && existingExercises.length > 0
        ? existingExercises[0].order_index + 1
        : 0;

    const { data, error } = await supabase
      .from('routine_exercises')
      .insert({
        routine_id: routineId,
        exercise_id: exerciseId,
        order_index: nextOrderIndex,
        sets: details.sets,
        reps: details.reps,
        duration_seconds: details.duration_seconds,
        rest_seconds: details.rest_seconds || 60,
        notes: details.notes,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/workouts');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error adding exercise to routine:', error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Remove exercise from routine
 */
export async function removeExerciseFromRoutine(
  routineExerciseId: string
) {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('routine_exercises')
      .delete()
      .eq('id', routineExerciseId);

    if (error) throw error;

    revalidatePath('/portal/workouts');

    return { success: true };
  } catch (error: any) {
    console.error('Error removing exercise from routine:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// WORKOUT SESSIONS ACTIONS
// ============================================================

/**
 * Start a new workout session
 */
export async function startWorkoutSession(
  memberId: string,
  gymId: string,
  routineId?: string
) {
  try {
    const supabase = createAdminSupabaseClient();

    // Check for recent check-in (within last 4 hours)
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

    const { data: recentCheckIn } = await supabase
      .from('check_ins')
      .select('id')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .gte('check_in_at', fourHoursAgo.toISOString())
      .order('check_in_at', { ascending: false })
      .limit(1)
      .single();

    // Create workout session
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        member_id: memberId,
        gym_id: gymId,
        routine_id: routineId,
        check_in_id: recentCheckIn?.id,
        started_at: new Date().toISOString(),
        status: 'in_progress',
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // If routine provided, copy exercises to session
    if (routineId) {
      const { data: routineExercises } = await supabase
        .from('routine_exercises')
        .select(`
          *,
          exercise_library (*)
        `)
        .eq('routine_id', routineId)
        .order('order_index');

      if (routineExercises && routineExercises.length > 0) {
        const sessionExercises = routineExercises.map((re, index) => ({
          session_id: session.id,
          exercise_id: re.exercise_id,
          order_index: index,
          completed: false,
        }));

        await supabase.from('session_exercises').insert(sessionExercises);
      }
    }

    revalidatePath('/portal/sessions');

    return { success: true, data: session };
  } catch (error: any) {
    console.error('Error starting workout session:', error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Get active workout session for a member
 */
export async function getActiveWorkoutSession(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_routines (name),
        session_exercises (
          id,
          order_index,
          completed,
          exercise_library (
            id,
            name,
            category,
            description
          )
        )
      `)
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: data || null };
  } catch (error: any) {
    console.error('Error fetching active session:', error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Complete a workout session
 */
export async function completeWorkoutSession(sessionId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const completedAt = new Date();

    // Get session start time
    const { data: session } = await supabase
      .from('workout_sessions')
      .select('started_at')
      .eq('id', sessionId)
      .single();

    let durationMinutes = null;
    if (session) {
      const startTime = new Date(session.started_at);
      durationMinutes = Math.round(
        (completedAt.getTime() - startTime.getTime()) / (1000 * 60)
      );
    }

    const { data, error } = await supabase
      .from('workout_sessions')
      .update({
        completed_at: completedAt.toISOString(),
        duration_minutes: durationMinutes,
        status: 'completed',
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/sessions');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error completing session:', error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Log an exercise set
 */
export async function logExerciseSet(
  sessionExerciseId: string,
  setData: {
    setNumber: number;
    weight?: number;
    reps?: number;
    duration?: number;
    completed: boolean;
  }
) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('exercise_sets')
      .insert({
        session_exercise_id: sessionExerciseId,
        set_number: setData.setNumber,
        weight_lbs: setData.weight,
        reps: setData.reps,
        duration_seconds: setData.duration,
        completed: setData.completed,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error logging exercise set:', error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Get workout session history
 */
export async function getWorkoutSessionHistory(
  memberId: string,
  gymId: string,
  limit = 20
) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        id,
        started_at,
        completed_at,
        duration_minutes,
        status,
        workout_routines (name)
      `)
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching session history:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get detailed session with all sets
 */
export async function getWorkoutSession(sessionId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_routines (name, description),
        session_exercises (
          id,
          order_index,
          completed,
          exercise_library (
            id,
            name,
            category,
            description
          ),
          exercise_sets (
            id,
            set_number,
            weight_lbs,
            reps,
            duration_seconds,
            completed,
            created_at
          )
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching session:', error);
    return { success: false, error: error.message, data: null };
  }
}

// ============================================================
// DIET PLANS ACTIONS
// ============================================================

/**
 * Get all diet plans for a member
 */
export async function getDietPlans(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching diet plans:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get active diet plan
 */
export async function getActiveDietPlan(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: data || null };
  } catch (error: any) {
    console.error('Error fetching active diet plan:', error);
    return { success: false, error: error.message, data: null };
  }
}

interface CreateDietPlanInput {
  memberId: string;
  gymId: string;
  name: string;
  description?: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

/**
 * Create a new diet plan
 */
export async function createDietPlan(input: CreateDietPlanInput) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('diet_plans')
      .insert({
        member_id: input.memberId,
        gym_id: input.gymId,
        name: input.name,
        description: input.description,
        target_calories: input.targetCalories,
        target_protein: input.targetProtein,
        target_carbs: input.targetCarbs,
        target_fat: input.targetFat,
        start_date: input.startDate,
        end_date: input.endDate,
        is_active: input.isActive !== undefined ? input.isActive : true,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/diet');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating diet plan:', error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Get meals for a specific date
 */
export async function getMealsForDate(
  dietPlanId: string,
  date: string
) {
  try {
    const supabase = createAdminSupabaseClient();

    // Get start and end of day for the given date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('diet_plan_id', dietPlanId)
      .gte('scheduled_for', startOfDay.toISOString())
      .lte('scheduled_for', endOfDay.toISOString())
      .order('meal_type');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching meals:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Create or update a meal
 */
export async function saveMeal(mealData: {
  dietPlanId: string;
  scheduledFor: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}) {
  try {
    const supabase = createAdminSupabaseClient();

    // Extract date from scheduledFor timestamp
    const scheduledDate = new Date(mealData.scheduledFor).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        diet_plan_id: mealData.dietPlanId,
        scheduled_for: mealData.scheduledFor,
        scheduled_date: scheduledDate,
        meal_type: mealData.mealType,
        name: mealData.name,
        description: mealData.description,
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/diet');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error saving meal:', error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Toggle meal completion
 */
export async function toggleMealCompletion(mealId: string, completed: boolean) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('meal_plans')
      .update({ completed })
      .eq('id', mealId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/diet');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error toggling meal completion:', error);
    return { success: false, error: error.message, data: null };
  }
}

// ============================================================
// MEMBER SETTINGS ACTIONS
// ============================================================

/**
 * Update member preferences (notification settings, etc.)
 */
export async function updateMemberPreferences(
  memberId: string,
  preferences: any
) {
  try {
    const supabase = createAdminSupabaseClient();

    // Get current metadata
    const { data: member, error: fetchError } = await supabase
      .from('members')
      .select('metadata')
      .eq('id', memberId)
      .single();

    if (fetchError) throw fetchError;

    // Merge new preferences with existing metadata
    const updatedMetadata = {
      ...(member?.metadata || {}),
      ...preferences,
    };

    // Update member metadata
    const { data, error } = await supabase
      .from('members')
      .update({ metadata: updatedMetadata })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/settings');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating member preferences:', error);
    return { success: false, error: error.message, data: null };
  }
}
