'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { PersonalRecord } from '@/types/database';

// ============================================================
// PERSONAL RECORDS ACTIONS
// All use admin client since members access via portal (PIN auth)
// ============================================================

export async function getPersonalRecords(
  memberId: string,
  gymId: string
): Promise<{
  success: boolean;
  data?: PersonalRecord[];
  error?: string;
}> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Get personal records error:', error);
    return { success: false, error: error.message };
  }
}

export async function getPersonalRecordsByExercise(
  memberId: string,
  gymId: string,
  exerciseName: string
): Promise<{
  success: boolean;
  data?: PersonalRecord[];
  error?: string;
}> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .eq('exercise_name', exerciseName)
      .order('recorded_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Get personal records by exercise error:', error);
    return { success: false, error: error.message };
  }
}

export async function addPersonalRecord(data: {
  gym_id: string;
  member_id: string;
  exercise_name: string;
  exercise_id?: string;
  weight: number;
  reps?: number;
  notes?: string;
}): Promise<{ success: boolean; data?: PersonalRecord; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: record, error } = await supabase
      .from('personal_records')
      .insert({
        gym_id: data.gym_id,
        member_id: data.member_id,
        exercise_name: data.exercise_name,
        exercise_id: data.exercise_id || null,
        weight: data.weight,
        reps: data.reps || 1,
        recorded_at: new Date().toISOString(),
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/portal/personal-records');
    return { success: true, data: record };
  } catch (error: any) {
    console.error('Add personal record error:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePersonalRecord(recordId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('personal_records')
      .delete()
      .eq('id', recordId);

    if (error) throw error;

    revalidatePath('/portal/personal-records');
    return { success: true };
  } catch (error: any) {
    console.error('Delete personal record error:', error);
    return { success: false, error: error.message };
  }
}

export async function getPRSummary(
  memberId: string,
  gymId: string
): Promise<{
  success: boolean;
  data?: { exercise_name: string; max_weight: number; reps: number; recorded_at: string }[];
  error?: string;
}> {
  try {
    const supabase = createAdminSupabaseClient();

    // Get all PRs and then group by exercise to find max weight per exercise
    const { data: records, error } = await supabase
      .from('personal_records')
      .select('exercise_name, weight, reps, recorded_at')
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .order('weight', { ascending: false });

    if (error) throw error;

    // Group by exercise_name and get the max weight row for each
    const bestByExercise = new Map<string, { exercise_name: string; max_weight: number; reps: number; recorded_at: string }>();

    (records || []).forEach((record) => {
      const existing = bestByExercise.get(record.exercise_name);
      if (!existing || record.weight > existing.max_weight) {
        bestByExercise.set(record.exercise_name, {
          exercise_name: record.exercise_name,
          max_weight: record.weight,
          reps: record.reps,
          recorded_at: record.recorded_at,
        });
      }
    });

    return { success: true, data: Array.from(bestByExercise.values()) };
  } catch (error: any) {
    console.error('Get PR summary error:', error);
    return { success: false, error: error.message };
  }
}
