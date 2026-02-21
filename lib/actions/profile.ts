'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function updateProfile(data: {
  full_name?: string;
  phone?: string;
  company_name?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone,
        company_name: data.company_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
