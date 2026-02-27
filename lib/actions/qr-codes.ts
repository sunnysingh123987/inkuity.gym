'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import {
  generateQRCodeDataURL,
  generateQRCodeBuffer,
  generateQRCodeSVG,
} from '@/lib/utils/qr';
import type { QRCode, QRCodeWithGym } from '@/types/database';

interface UpdateQRCodeInput {
  name?: string;
  label?: string;
  redirectUrl?: string;
  designSettings?: {
    primaryColor?: string;
    backgroundColor?: string;
    logoEnabled?: boolean;
    frameStyle?: string;
  };
  isActive?: boolean;
}

/**
 * Get QR codes for a gym
 */
export async function getGymQRCodes(
  gymId: string
): Promise<{ success: boolean; data?: QRCode[]; error?: string }> {
  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Failed to get QR codes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a single QR code with details
 */
export async function getQRCode(
  id: string
): Promise<{ success: boolean; data?: QRCodeWithGym; error?: string }> {
  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*, gym:gyms(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to get QR code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a QR code
 */
export async function updateQRCode(
  id: string,
  input: UpdateQRCodeInput
): Promise<{ success: boolean; data?: QRCode; error?: string }> {
  const supabase = createServerSupabaseClient();

  try {
    const { data: qrCode } = await supabase
      .from('qr_codes')
      .select('gym_id')
      .eq('id', id)
      .single();

    if (!qrCode) {
      return { success: false, error: 'QR code not found' };
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .update({
        name: input.name,
        label: input.label,
        redirect_url: input.redirectUrl,
        design_settings: input.designSettings,
        is_active: input.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/dashboard/qr-codes/${id}`);
    revalidatePath('/dashboard/qr-codes');

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to update QR code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate QR code image
 */
export async function generateQRImage(
  code: string,
  format: 'png' | 'svg' | 'dataurl' = 'dataurl'
): Promise<{ success: boolean; data?: string | Buffer; error?: string }> {
  try {
    let result: string | Buffer;

    switch (format) {
      case 'png':
        result = await generateQRCodeBuffer({ code });
        break;
      case 'svg':
        result = await generateQRCodeSVG({ code });
        break;
      case 'dataurl':
      default:
        result = await generateQRCodeDataURL({ code });
        break;
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Failed to generate QR image:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get QR code scan analytics
 */
export async function getQRCodeAnalytics(
  qrCodeId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  success: boolean;
  data?: {
    totalScans: number;
    uniqueVisitors: number;
    scansByDay: { date: string; count: number }[];
    devices: { device: string; count: number }[];
  };
  error?: string;
}> {
  const supabase = createAdminSupabaseClient();

  try {
    // Build date filter
    let query = supabase
      .from('scans')
      .select('*')
      .eq('qr_code_id', qrCodeId);

    if (startDate) {
      query = query.gte('scanned_at', startDate);
    }
    if (endDate) {
      query = query.lte('scanned_at', endDate);
    }

    const { data: scans, error } = await query;

    if (error) throw error;

    // Calculate analytics
    const totalScans = scans?.length || 0;
    const uniqueIPs = new Set(scans?.map((s) => s.ip_address)).size;

    // Scans by day
    const scansByDayMap = (scans || []).reduce((acc, scan) => {
      const date = new Date(scan.scanned_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const scansByDay = Object.entries(scansByDayMap)
      .map(([date, count]) => ({ date, count: count as number }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Devices breakdown
    const devicesMap = (scans || []).reduce((acc, scan) => {
      const device = scan.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const devices = Object.entries(devicesMap)
      .map(([device, count]) => ({ device, count: count as number }))
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: {
        totalScans,
        uniqueVisitors: uniqueIPs,
        scansByDay,
        devices,
      },
    };
  } catch (error: any) {
    console.error('Failed to get QR analytics:', error);
    return { success: false, error: error.message };
  }
}
