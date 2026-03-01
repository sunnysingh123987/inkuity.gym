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

        if (diff === 0) {
          // Same day duplicate, skip
          continue;
        } else if (diff === 1) {
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

    revalidatePath('/portal/trackers');

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

    revalidatePath('/portal/trackers');

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

    revalidatePath('/portal/trackers');

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

    revalidatePath('/portal/trackers');

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

    revalidatePath('/portal/trackers');

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
          ),
          exercise_sets (
            id,
            set_number,
            weight,
            reps,
            duration_seconds,
            completed,
            created_at
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
 * Add an exercise to an active session
 */
export async function addSessionExercise(
  sessionId: string,
  exerciseId: string
) {
  try {
    const supabase = createAdminSupabaseClient();

    // Get current max order_index for this session
    const { data: existing } = await supabase
      .from('session_exercises')
      .select('order_index')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

    const { data, error } = await supabase
      .from('session_exercises')
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        order_index: nextOrder,
        completed: false,
      })
      .select(`
        id,
        order_index,
        completed,
        exercise_library (
          id,
          name,
          category,
          description
        )
      `)
      .single();

    if (error) throw error;

    revalidatePath('/portal/sessions');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error adding session exercise:', error);
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

    // Check if this set already exists
    const { data: existing } = await supabase
      .from('exercise_sets')
      .select('id, created_at')
      .eq('session_exercise_id', sessionExerciseId)
      .eq('set_number', setData.setNumber)
      .maybeSingle();

    if (existing) {
      // Check if set is older than 1.5 hours — if so, it's locked
      const createdAt = new Date(existing.created_at);
      const now = new Date();
      const ageMs = now.getTime() - createdAt.getTime();
      const LOCK_MS = 1.5 * 60 * 60 * 1000; // 1.5 hours
      if (ageMs > LOCK_MS) {
        return { success: false, error: 'Set is locked after 1.5 hours', data: null };
      }

      // Update existing set
      const { data, error } = await supabase
        .from('exercise_sets')
        .update({
          weight: setData.weight,
          reps: setData.reps,
          duration_seconds: setData.duration,
          completed: setData.completed,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }

    // Insert new set
    const { data, error } = await supabase
      .from('exercise_sets')
      .insert({
        session_exercise_id: sessionExerciseId,
        set_number: setData.setNumber,
        weight: setData.weight,
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
 * Get meals for a full week (7 days starting from weekStartDate)
 */
export async function getMealsForWeek(
  dietPlanId: string,
  weekStartDate: string
) {
  try {
    const supabase = createAdminSupabaseClient();

    const startDate = new Date(weekStartDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(weekStartDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('diet_plan_id', dietPlanId)
      .gte('scheduled_for', startDate.toISOString())
      .lte('scheduled_for', endDate.toISOString())
      .order('scheduled_for')
      .order('meal_type');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching meals for week:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Check if a meal already exists for a given slot
 */
export async function checkMealExists(
  dietPlanId: string,
  scheduledDate: string,
  mealType: string
) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('meal_plans')
      .select('id, name, calories')
      .eq('diet_plan_id', dietPlanId)
      .eq('scheduled_date', scheduledDate)
      .eq('meal_type', mealType)
      .maybeSingle();

    if (error) throw error;

    return { exists: !!data, meal: data || undefined };
  } catch (error: any) {
    console.error('Error checking meal existence:', error);
    return { exists: false, meal: undefined };
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
      .upsert(
        {
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
        },
        { onConflict: 'diet_plan_id,scheduled_date,meal_type' }
      )
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
// AI DIET PLAN HELPERS
// ============================================================

/**
 * Check if a member has already used their AI plan generation
 */
export async function checkAiPlanUsed(memberId: string): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('members')
      .select('ai_plan_used')
      .eq('id', memberId)
      .single();

    if (error) throw error;
    return !!data?.ai_plan_used;
  } catch {
    return false;
  }
}

/**
 * Mark a member's AI plan as used
 */
export async function markAiPlanUsed(memberId: string) {
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from('members')
      .update({ ai_plan_used: true })
      .eq('id', memberId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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

// ============================================================
// MEMBER INFO UPDATE (First check-in info collection)
// ============================================================

export async function updateMemberInfo(
  memberId: string,
  info: {
    full_name?: string | null
    phone?: string | null
    birth_date?: string | null
    gender?: string | null
    metadata?: Record<string, any>
  }
) {
  try {
    const supabase = createAdminSupabaseClient()

    // Get current metadata to merge
    const { data: member, error: fetchError } = await supabase
      .from('members')
      .select('metadata')
      .eq('id', memberId)
      .single()

    if (fetchError) throw fetchError

    const updateData: Record<string, any> = {}
    if (info.full_name !== undefined) updateData.full_name = info.full_name
    if (info.phone !== undefined) updateData.phone = info.phone
    if (info.birth_date !== undefined) updateData.birth_date = info.birth_date
    if (info.gender !== undefined) updateData.gender = info.gender
    if (info.metadata) {
      updateData.metadata = {
        ...(member?.metadata || {}),
        ...info.metadata,
      }
    }

    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', memberId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/portal')
    return { success: true, data }
  } catch (error: any) {
    console.error('Error updating member info:', error)
    return { success: false, error: error.message }
  }
}

export async function checkMemberInfoCollected(memberId: string): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('members')
      .select('metadata')
      .eq('id', memberId)
      .single()

    if (error) throw error
    return !!data?.metadata?.info_collected_at
  } catch {
    return false
  }
}

// ============================================================
// WORKOUT SUGGESTIONS
// ============================================================

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio'] as const;

// Map sub-categories to standard groups
const CATEGORY_MAP: Record<string, string> = {
  chest: 'chest',
  back: 'back',
  shoulders: 'shoulders',
  arms: 'arms',
  biceps: 'arms',
  triceps: 'arms',
  legs: 'legs',
  glutes: 'legs',
  hamstrings: 'legs',
  quads: 'legs',
  calves: 'legs',
  core: 'core',
  abs: 'core',
  cardio: 'cardio',
};

export async function getWorkoutSuggestions(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Query check-ins with tags for the last 30 days
    const { data: checkIns, error: checkInError } = await supabase
      .from('check_ins')
      .select('check_in_at, tags')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .gte('check_in_at', thirtyDaysAgo.toISOString())
      .order('check_in_at', { ascending: false });

    if (checkInError) throw checkInError;

    // 2. Query workout sessions with exercise categories for the last 30 days
    const { data: sessions, error: sessionError } = await supabase
      .from('workout_sessions')
      .select(`
        started_at,
        status,
        session_exercises (
          exercise_library (
            category
          )
        )
      `)
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .gte('started_at', thirtyDaysAgo.toISOString())
      .in('status', ['completed', 'in_progress'])
      .order('started_at', { ascending: false });

    if (sessionError) throw sessionError;

    // Track the last date each muscle group was trained
    const lastTrained: Record<string, Date> = {};

    // Parse check-in tags (format: ["qr-scan", "workout:chest", "workout:arms"])
    if (checkIns) {
      for (const checkIn of checkIns) {
        if (!checkIn.tags || !Array.isArray(checkIn.tags)) continue;

        const checkInDate = new Date(checkIn.check_in_at);

        for (const tag of checkIn.tags) {
          if (typeof tag === 'string' && tag.startsWith('workout:')) {
            const rawGroup = tag.replace('workout:', '').toLowerCase();
            const group = CATEGORY_MAP[rawGroup] || rawGroup;

            if (MUSCLE_GROUPS.includes(group as any)) {
              if (!lastTrained[group] || checkInDate > lastTrained[group]) {
                lastTrained[group] = checkInDate;
              }
            }
          }
        }
      }
    }

    // Parse workout session exercise categories
    if (sessions) {
      for (const session of sessions) {
        const sessionDate = new Date(session.started_at);
        const exercises = session.session_exercises as any[];

        if (!exercises) continue;

        for (const se of exercises) {
          const exerciseLib = Array.isArray(se.exercise_library)
            ? se.exercise_library[0]
            : se.exercise_library;

          if (!exerciseLib?.category) continue;

          const rawCategory = exerciseLib.category.toLowerCase();
          const group = CATEGORY_MAP[rawCategory] || rawCategory;

          if (MUSCLE_GROUPS.includes(group as any)) {
            if (!lastTrained[group] || sessionDate > lastTrained[group]) {
              lastTrained[group] = sessionDate;
            }
          }
        }
      }
    }

    // Calculate days since last workout for each group and generate suggestions
    const now = new Date();
    const suggestions: Array<{ group: string; daysSince: number; message: string }> = [];
    const lastWorkouts: Record<string, string> = {};

    for (const group of MUSCLE_GROUPS) {
      if (lastTrained[group]) {
        const daysSince = Math.floor(
          (now.getTime() - lastTrained[group].getTime()) / (1000 * 60 * 60 * 24)
        );
        lastWorkouts[group] = lastTrained[group].toISOString();

        if (daysSince >= 3) {
          const capitalizedGroup = group.charAt(0).toUpperCase() + group.slice(1);
          let message: string;

          if (daysSince >= 7) {
            message = `You haven't trained ${capitalizedGroup} in ${daysSince} days. Time to get back to it!`;
          } else if (daysSince >= 5) {
            message = `${capitalizedGroup} is overdue! It's been ${daysSince} days since your last session.`;
          } else {
            message = `You haven't trained ${capitalizedGroup} in ${daysSince} days. Consider adding it to your next workout.`;
          }

          suggestions.push({ group, daysSince, message });
        }
      } else {
        // If we have any workout data at all but this group was never trained
        const hasAnyData =
          (checkIns && checkIns.length > 0) || (sessions && sessions.length > 0);

        if (hasAnyData) {
          const capitalizedGroup = group.charAt(0).toUpperCase() + group.slice(1);
          suggestions.push({
            group,
            daysSince: 30,
            message: `No ${capitalizedGroup} workouts found in the last 30 days. Don't neglect this muscle group!`,
          });
        }
      }
    }

    // Sort by daysSince descending (most overdue first)
    suggestions.sort((a, b) => b.daysSince - a.daysSince);

    return { success: true, data: { suggestions, lastWorkouts } };
  } catch (error: any) {
    console.error('Error fetching workout suggestions:', error);
    return {
      success: false,
      error: error.message,
      data: { suggestions: [], lastWorkouts: {} },
    };
  }
}

// ============================================================
// MEMBER PAYMENT HISTORY
// ============================================================

export async function getMemberPaymentHistory(
  memberId: string,
  gymId: string
): Promise<{
  success: boolean;
  data?: {
    id: string;
    payment_date: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    payment_method: string;
    description: string | null;
    period_start: string | null;
    period_end: string | null;
  }[];
  error?: string;
}> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('payments')
      .select(
        'id, payment_date, amount, currency, type, status, payment_method, description, period_start, period_end'
      )
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Get member payment history error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get the last completed session date for each routine
 */
export async function getLastSessionDates(
  memberId: string,
  gymId: string
): Promise<Record<string, string>> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('routine_id, completed_at')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .eq('status', 'completed')
      .not('routine_id', 'is', null)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    const map: Record<string, string> = {};
    for (const row of data || []) {
      if (row.routine_id && !map[row.routine_id]) {
        map[row.routine_id] = row.completed_at;
      }
    }
    return map;
  } catch (error: any) {
    console.error('Get last session dates error:', error);
    return {};
  }
}

/**
 * Get previous exercise sets from the most recent completed session
 */
export async function getPreviousExerciseSets(
  memberId: string,
  exerciseId: string
): Promise<{ set_number: number; weight: number; reps: number }[]> {
  try {
    const supabase = createAdminSupabaseClient();

    // Find the most recent completed session_exercise for this exercise
    const { data: sessionExercise, error: seError } = await supabase
      .from('session_exercises')
      .select(
        `id, workout_sessions!inner(member_id, status, completed_at)`
      )
      .eq('exercise_id', exerciseId)
      .eq('workout_sessions.member_id', memberId)
      .eq('workout_sessions.status', 'completed')
      .order('workout_sessions(completed_at)', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (seError) throw seError;
    if (!sessionExercise) return [];

    // Fetch the sets for that session exercise
    const { data: sets, error: setsError } = await supabase
      .from('exercise_sets')
      .select('set_number, weight_lbs, reps')
      .eq('session_exercise_id', sessionExercise.id)
      .order('set_number', { ascending: true });

    if (setsError) throw setsError;

    return (sets || []).map((s) => ({
      set_number: s.set_number,
      weight: s.weight_lbs || 0,
      reps: s.reps || 0,
    }));
  } catch (error: any) {
    console.error('Get previous exercise sets error:', error);
    return [];
  }
}

// ============================================================
// NUTRITION TRACKER - FOOD ITEMS (PERSONAL DATABASE)
// ============================================================

export async function getFoodItems(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('name');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching food items:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createFoodItem(input: {
  memberId: string;
  gymId: string;
  name: string;
  servingSize: string;
  caloriesPerServing: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('food_items')
      .insert({
        member_id: input.memberId,
        gym_id: input.gymId,
        name: input.name,
        serving_size: input.servingSize,
        calories_per_serving: input.caloriesPerServing,
        protein: input.protein,
        carbs: input.carbs,
        fat: input.fat,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating food item:', error);
    return { success: false, error: error.message, data: null };
  }
}

export async function updateFoodItem(
  foodItemId: string,
  updates: {
    name?: string;
    servingSize?: string;
    caloriesPerServing?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }
) {
  try {
    const supabase = createAdminSupabaseClient();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.servingSize !== undefined) dbUpdates.serving_size = updates.servingSize;
    if (updates.caloriesPerServing !== undefined) dbUpdates.calories_per_serving = updates.caloriesPerServing;
    if (updates.protein !== undefined) dbUpdates.protein = updates.protein;
    if (updates.carbs !== undefined) dbUpdates.carbs = updates.carbs;
    if (updates.fat !== undefined) dbUpdates.fat = updates.fat;

    const { data, error } = await supabase
      .from('food_items')
      .update(dbUpdates)
      .eq('id', foodItemId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating food item:', error);
    return { success: false, error: error.message, data: null };
  }
}

export async function deleteFoodItem(foodItemId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', foodItemId);

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting food item:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// NUTRITION TRACKER - FOOD LOG ENTRIES
// ============================================================

export async function getFoodLogEntries(memberId: string, gymId: string, date: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('food_log_entries')
      .select('*')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .eq('logged_date', date)
      .order('logged_at', { ascending: true });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching food log entries:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function addFoodLogEntry(input: {
  memberId: string;
  gymId: string;
  foodItemId?: string;
  name: string;
  servingSize: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedDate: string;
}) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('food_log_entries')
      .insert({
        member_id: input.memberId,
        gym_id: input.gymId,
        food_item_id: input.foodItemId || null,
        name: input.name,
        serving_size: input.servingSize,
        quantity: input.quantity,
        calories: input.calories,
        protein: input.protein,
        carbs: input.carbs,
        fat: input.fat,
        logged_date: input.loggedDate,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error adding food log entry:', error);
    return { success: false, error: error.message, data: null };
  }
}

export async function updateFoodLogEntry(
  entryId: string,
  updates: {
    name?: string;
    servingSize?: string;
    quantity?: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }
) {
  try {
    const supabase = createAdminSupabaseClient();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.servingSize !== undefined) dbUpdates.serving_size = updates.servingSize;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.calories !== undefined) dbUpdates.calories = updates.calories;
    if (updates.protein !== undefined) dbUpdates.protein = updates.protein;
    if (updates.carbs !== undefined) dbUpdates.carbs = updates.carbs;
    if (updates.fat !== undefined) dbUpdates.fat = updates.fat;

    const { data, error } = await supabase
      .from('food_log_entries')
      .update(dbUpdates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating food log entry:', error);
    return { success: false, error: error.message, data: null };
  }
}

export async function deleteFoodLogEntry(entryId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('food_log_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting food log entry:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// NUTRITION TRACKER - UPDATE DIET PLAN TARGETS
// ============================================================

export async function updateDietPlanTargets(
  dietPlanId: string,
  targets: {
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
  }
) {
  try {
    const supabase = createAdminSupabaseClient();

    const dbUpdates: Record<string, unknown> = {};
    if (targets.targetCalories !== undefined) dbUpdates.target_calories = targets.targetCalories;
    if (targets.targetProtein !== undefined) dbUpdates.target_protein = targets.targetProtein;
    if (targets.targetCarbs !== undefined) dbUpdates.target_carbs = targets.targetCarbs;
    if (targets.targetFat !== undefined) dbUpdates.target_fat = targets.targetFat;

    const { data, error } = await supabase
      .from('diet_plans')
      .update(dbUpdates)
      .eq('id', dietPlanId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating diet plan targets:', error);
    return { success: false, error: error.message, data: null };
  }
}

// ============================================================
// NUTRITION TRACKER - CUSTOM TRACKERS
// ============================================================

export async function getCustomTrackers(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('custom_trackers')
      .select(`
        *,
        tracker_daily_log (
          current_value,
          log_date
        )
      `)
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .eq('tracker_daily_log.log_date', today)
      .order('created_at');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching custom trackers:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createCustomTracker(input: {
  memberId: string;
  gymId: string;
  name: string;
  unit: string;
  dailyTarget: number;
  icon: string;
  color: string;
}) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('custom_trackers')
      .insert({
        member_id: input.memberId,
        gym_id: input.gymId,
        name: input.name,
        unit: input.unit,
        daily_target: input.dailyTarget,
        icon: input.icon,
        color: input.color,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating custom tracker:', error);
    return { success: false, error: error.message, data: null };
  }
}

export async function updateCustomTracker(
  trackerId: string,
  updates: {
    name?: string;
    unit?: string;
    dailyTarget?: number;
    icon?: string;
    color?: string;
  }
) {
  try {
    const supabase = createAdminSupabaseClient();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.dailyTarget !== undefined) dbUpdates.daily_target = updates.dailyTarget;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.color !== undefined) dbUpdates.color = updates.color;

    const { data, error } = await supabase
      .from('custom_trackers')
      .update(dbUpdates)
      .eq('id', trackerId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating custom tracker:', error);
    return { success: false, error: error.message, data: null };
  }
}

export async function deleteCustomTracker(trackerId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('custom_trackers')
      .delete()
      .eq('id', trackerId);

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting custom tracker:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAllCustomTrackers(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('custom_trackers')
      .delete()
      .eq('member_id', memberId)
      .eq('gym_id', gymId);

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting all custom trackers:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// NUTRITION TRACKER - TRACKER DAILY LOG (INCREMENT/DECREMENT)
// ============================================================

export async function updateTrackerValue(
  trackerId: string,
  memberId: string,
  value: number
) {
  try {
    const supabase = createAdminSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('tracker_daily_log')
      .upsert(
        {
          tracker_id: trackerId,
          member_id: memberId,
          log_date: today,
          current_value: Math.max(0, value),
        },
        { onConflict: 'tracker_id,log_date' }
      )
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating tracker value:', error);
    return { success: false, error: error.message, data: null };
  }
}

export async function resetAllTrackerValues(memberId: string) {
  try {
    const supabase = createAdminSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('tracker_daily_log')
      .update({ current_value: 0 })
      .eq('member_id', memberId)
      .eq('log_date', today);

    if (error) throw error;

    revalidatePath('/portal/meals');

    return { success: true };
  } catch (error: any) {
    console.error('Error resetting tracker values:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// NUTRITION TRACKER - SEED DEFAULT FOOD ITEMS
// ============================================================

export async function seedDefaultFoodItems(memberId: string, gymId: string) {
  try {
    const supabase = createAdminSupabaseClient();

    // Check if member already has food items
    const { count } = await supabase
      .from('food_items')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('gym_id', gymId);

    if (count && count > 0) {
      return { success: true, seeded: false };
    }

    const defaults = [
      { name: 'Chicken Breast', serving_size: '100g', calories_per_serving: 165, protein: 31, carbs: 0, fat: 4 },
      { name: 'Brown Rice', serving_size: '1 cup cooked', calories_per_serving: 216, protein: 5, carbs: 45, fat: 2 },
      { name: 'Broccoli', serving_size: '1 cup', calories_per_serving: 55, protein: 4, carbs: 11, fat: 1 },
      { name: 'Salmon Fillet', serving_size: '100g', calories_per_serving: 208, protein: 20, carbs: 0, fat: 13 },
      { name: 'Eggs', serving_size: '1 large', calories_per_serving: 72, protein: 6, carbs: 0, fat: 5 },
      { name: 'Greek Yogurt', serving_size: '1 cup', calories_per_serving: 130, protein: 22, carbs: 8, fat: 1 },
      { name: 'Banana', serving_size: '1 medium', calories_per_serving: 105, protein: 1, carbs: 27, fat: 0 },
      { name: 'Oatmeal', serving_size: '1 cup cooked', calories_per_serving: 154, protein: 5, carbs: 27, fat: 3 },
      { name: 'Sweet Potato', serving_size: '1 medium', calories_per_serving: 103, protein: 2, carbs: 24, fat: 0 },
      { name: 'Almonds', serving_size: '1 oz (23 nuts)', calories_per_serving: 164, protein: 6, carbs: 6, fat: 14 },
      { name: 'Avocado', serving_size: '1/2 medium', calories_per_serving: 120, protein: 2, carbs: 6, fat: 11 },
      { name: 'Whole Wheat Bread', serving_size: '1 slice', calories_per_serving: 81, protein: 4, carbs: 14, fat: 1 },
      { name: 'Protein Shake', serving_size: '1 scoop', calories_per_serving: 120, protein: 24, carbs: 3, fat: 1 },
      { name: 'Apple', serving_size: '1 medium', calories_per_serving: 95, protein: 0, carbs: 25, fat: 0 },
      { name: 'Cottage Cheese', serving_size: '1 cup', calories_per_serving: 206, protein: 28, carbs: 6, fat: 9 },
      { name: 'Turkey Breast', serving_size: '100g', calories_per_serving: 135, protein: 30, carbs: 0, fat: 1 },
      { name: 'Quinoa', serving_size: '1 cup cooked', calories_per_serving: 222, protein: 8, carbs: 39, fat: 4 },
      { name: 'Spinach', serving_size: '2 cups raw', calories_per_serving: 14, protein: 2, carbs: 2, fat: 0 },
      { name: 'Peanut Butter', serving_size: '2 tbsp', calories_per_serving: 190, protein: 7, carbs: 7, fat: 16 },
      { name: 'Tuna (canned)', serving_size: '1 can (85g)', calories_per_serving: 100, protein: 22, carbs: 0, fat: 1 },
    ];

    const rows = defaults.map((d) => ({
      member_id: memberId,
      gym_id: gymId,
      ...d,
    }));

    const { error } = await supabase
      .from('food_items')
      .insert(rows);

    if (error) throw error;

    return { success: true, seeded: true };
  } catch (error: any) {
    console.error('Error seeding default food items:', error);
    return { success: false, error: error.message };
  }
}
