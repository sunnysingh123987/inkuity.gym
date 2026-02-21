'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { generateQRCodeIdentifier, generateGymSlug } from '@/lib/utils/qr';
import type { Gym, QRCode } from '@/types/database';

interface OnboardingGymData {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
}

export async function completeOnboarding(gymData: OnboardingGymData): Promise<{
  success: boolean;
  gym?: Gym;
  qrCode?: QRCode;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // 1. Generate unique slug
    let slug = generateGymSlug(gymData.name);
    let counter = 1;

    while (true) {
      const { data: existing } = await supabase
        .from('gyms')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existing) break;
      slug = `${generateGymSlug(gymData.name)}-${counter}`;
      counter++;
    }

    // 2. Create the gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .insert({
        owner_id: user.id,
        name: gymData.name,
        slug,
        description: gymData.description || null,
        address: gymData.address || null,
        city: gymData.city || null,
        state: gymData.state || null,
        zip_code: gymData.zip_code || null,
        phone: gymData.phone || null,
        email: gymData.email || null,
        website: gymData.website || null,
        logo_url: gymData.logo_url || null,
      })
      .select()
      .single();

    if (gymError) throw gymError;

    // 3. Auto-create a default "Check-In" QR code
    const code = generateQRCodeIdentifier();

    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .insert({
        gym_id: gym.id,
        code,
        name: 'Check-In',
        label: 'Scan to check in',
        type: 'check-in',
        design_settings: {
          primaryColor: '#00b8d4',
          backgroundColor: '#FFFFFF',
          frameStyle: 'square',
        },
      })
      .select()
      .single();

    if (qrError) {
      console.error('Failed to create default QR code:', qrError);
      // Don't fail the whole onboarding if QR creation fails
    }

    // 4. Mark onboarding as completed
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to update onboarding status:', profileError);
    }

    revalidatePath('/dashboard');
    revalidatePath('/gyms');
    revalidatePath('/qr-codes');

    return { success: true, gym, qrCode: qrCode || undefined };
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return { success: false, error: error.message };
  }
}

const TEST_PHONE = '9999999999';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function isValidPhone(phone: string): { valid: boolean; error?: string } {
  const digits = normalizePhone(phone);
  if (digits.length === 0) return { valid: true }; // empty is fine (optional)
  if (digits.length < 10) return { valid: false, error: 'Phone number must be at least 10 digits' };
  if (digits.length > 15) return { valid: false, error: 'Phone number is too long' };
  return { valid: true };
}

export async function checkPhoneAvailability(phone: string): Promise<{
  valid: boolean;
  available: boolean;
  error?: string;
}> {
  const digits = normalizePhone(phone);

  // Empty phone is valid and available (field is optional)
  if (digits.length === 0) return { valid: true, available: true };

  // Validate format
  const validation = isValidPhone(phone);
  if (!validation.valid) {
    return { valid: false, available: false, error: validation.error };
  }

  // Test number bypasses uniqueness check
  if (digits === TEST_PHONE) {
    return { valid: true, available: true };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { valid: true, available: false, error: 'Not authenticated' };

    // Check gyms table for this phone (exclude current user's gyms)
    const { data: existingGyms } = await supabase
      .from('gyms')
      .select('id, owner_id')
      .eq('phone', digits)
      .neq('owner_id', user.id)
      .limit(1);

    if (existingGyms && existingGyms.length > 0) {
      return { valid: true, available: false, error: 'This phone number is already linked to another account' };
    }

    // Also check with formatted variations (digits stored with/without formatting)
    const { data: existingGymsFormatted } = await supabase
      .from('gyms')
      .select('id, owner_id')
      .neq('owner_id', user.id)
      .or(`phone.eq.${phone},phone.eq.${digits}`)
      .limit(1);

    if (existingGymsFormatted && existingGymsFormatted.length > 0) {
      return { valid: true, available: false, error: 'This phone number is already linked to another account' };
    }

    return { valid: true, available: true };
  } catch (error: any) {
    console.error('Phone check error:', error);
    return { valid: true, available: true }; // Fail open to not block onboarding
  }
}

export async function uploadGymLogo(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload a JPG, PNG, WebP, or SVG.' };
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: 'File too large. Maximum size is 2MB.' };
    }

    // Ensure the gym-logos bucket exists (uses admin client)
    const { data: buckets } = await adminSupabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === 'gym-logos');

    if (!bucketExists) {
      const { error: createBucketError } = await adminSupabase.storage.createBucket('gym-logos', {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      });

      if (createBucketError) {
        console.error('Failed to create gym-logos bucket:', createBucketError);
        return { success: false, error: 'Storage setup failed. Please try again.' };
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload using admin client to bypass RLS
    const { error: uploadError } = await adminSupabase.storage
      .from('gym-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = adminSupabase.storage
      .from('gym-logos')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return { success: false, error: error.message };
  }
}
