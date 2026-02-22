'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { PaymentMethod, PaymentWithMember, MembershipPlan } from '@/types/database';

export async function createPayment(data: {
  gym_id: string;
  member_id: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'one_time' | 'penalty' | 'refund';
  payment_method: PaymentMethod;
  description?: string;
  payment_date?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        gym_id: data.gym_id,
        member_id: data.member_id,
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        status: 'completed',
        payment_method: data.payment_method,
        description: data.description || null,
        payment_date: data.payment_date || new Date().toISOString(),
      })
      .select(`*, member:members(id, full_name, email, phone)`)
      .single();

    if (error) throw error;

    revalidatePath('/payments');
    return { success: true, data: payment };
  } catch (error: any) {
    console.error('Create payment error:', error);
    return { success: false, error: error.message };
  }
}

export async function getPayments(gymId: string): Promise<{
  success: boolean;
  data?: PaymentWithMember[];
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`*, member:members(id, full_name, email, phone)`)
      .eq('gym_id', gymId)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    return { success: true, data: (payments || []) as PaymentWithMember[] };
  } catch (error: any) {
    console.error('Get payments error:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadPaymentQR(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No file provided' };

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload a JPG, PNG, or WebP.' };
    }

    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: 'File too large. Maximum size is 2MB.' };
    }

    // Ensure bucket exists
    const { data: buckets } = await adminSupabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === 'payment-qr-codes');

    if (!bucketExists) {
      const { error: createBucketError } = await adminSupabase.storage.createBucket('payment-qr-codes', {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      if (createBucketError) {
        console.error('Failed to create payment-qr-codes bucket:', createBucketError);
        return { success: false, error: 'Storage setup failed. Please try again.' };
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await adminSupabase.storage
      .from('payment-qr-codes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = adminSupabase.storage
      .from('payment-qr-codes')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Payment QR upload error:', error);
    return { success: false, error: error.message };
  }
}

export async function savePaymentQRUrl(gymId: string, url: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Get current settings
    const { data: gym } = await supabase
      .from('gyms')
      .select('settings')
      .eq('id', gymId)
      .single();

    const settings = { ...(gym?.settings || {}), payment_qr_url: url };

    const { error } = await supabase
      .from('gyms')
      .update({ settings })
      .eq('id', gymId);

    if (error) throw error;

    revalidatePath('/payments');
    return { success: true };
  } catch (error: any) {
    console.error('Save payment QR URL error:', error);
    return { success: false, error: error.message };
  }
}

export async function saveMembershipPlans(gymId: string, plans: MembershipPlan[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: gym } = await supabase
      .from('gyms')
      .select('settings')
      .eq('id', gymId)
      .single();

    const settings = { ...(gym?.settings || {}), membership_plans: plans };

    const { error } = await supabase
      .from('gyms')
      .update({ settings })
      .eq('id', gymId);

    if (error) throw error;

    revalidatePath('/payments');
    return { success: true };
  } catch (error: any) {
    console.error('Save membership plans error:', error);
    return { success: false, error: error.message };
  }
}
