'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { GymRole } from '@/types/database';

// ============================================================
// GYM ROLES ACTIONS
// ============================================================

export async function getGymRoles(gymId: string): Promise<{
  success: boolean;
  data?: (GymRole & { profile?: { full_name: string | null; email: string } })[];
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('gym_roles')
      .select(`*, profile:profiles(full_name, email)`)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Get gym roles error:', error);
    return { success: false, error: error.message };
  }
}

export async function inviteUser(
  gymId: string,
  data: {
    email: string;
    role: string;
    permissions: Record<string, boolean>;
  }
): Promise<{ success: boolean; data?: GymRole; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Look up user by email in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'No user found with that email. They need to register on Inkuity first.',
      };
    }

    // Check if role already exists for this user + gym
    const { data: existingRole } = await supabase
      .from('gym_roles')
      .select('id')
      .eq('gym_id', gymId)
      .eq('user_id', profile.id)
      .single();

    if (existingRole) {
      return {
        success: false,
        error: 'This user already has a role at this gym.',
      };
    }

    const { data: role, error } = await supabase
      .from('gym_roles')
      .insert({
        gym_id: gymId,
        user_id: profile.id,
        role: data.role,
        permissions: data.permissions,
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, data: role };
  } catch (error: any) {
    console.error('Invite user error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateRole(
  roleId: string,
  updates: {
    role?: string;
    permissions?: Record<string, boolean>;
    is_active?: boolean;
  }
): Promise<{ success: boolean; data?: GymRole; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('gym_roles')
      .update(updates)
      .eq('id', roleId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, data };
  } catch (error: any) {
    console.error('Update role error:', error);
    return { success: false, error: error.message };
  }
}

export async function removeRole(roleId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('gym_roles')
      .delete()
      .eq('id', roleId);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Remove role error:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserPermissions(
  gymId: string,
  userId: string
): Promise<{
  success: boolean;
  data?: { role: string; permissions: Record<string, boolean> } | null;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('gym_roles')
      .select('role, permissions')
      .eq('gym_id', gymId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: data || null };
  } catch (error: any) {
    console.error('Get user permissions error:', error);
    return { success: false, error: error.message };
  }
}

export async function checkPermission(
  gymId: string,
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();

    // First check if user is the gym owner
    const { data: gym } = await supabase
      .from('gyms')
      .select('owner_id')
      .eq('id', gymId)
      .single();

    // Owner has all permissions
    if (gym?.owner_id === userId) return true;

    // Check gym_roles
    const { data: role } = await supabase
      .from('gym_roles')
      .select('role, permissions')
      .eq('gym_id', gymId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!role) return false;

    // co_owner has all permissions
    if (role.role === 'owner' || role.role === 'co_owner') return true;

    // Check specific permission in JSONB
    return role.permissions?.[permission] === true;
  } catch {
    return false;
  }
}
