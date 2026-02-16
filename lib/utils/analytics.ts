import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';
import { Scan } from '@/types/database';

/**
 * Extract device info from user agent
 */
export function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    deviceType: result.device.type || 'desktop',
    browser: result.browser.name || 'Unknown',
    os: result.os.name || 'Unknown',
    deviceModel: result.device.model || 'Unknown',
  };
}

/**
 * Extract UTM parameters from URL
 */
export function extractUTMParams(url: string): {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
} {
  try {
    const params = new URL(url).searchParams;
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
    };
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }
}

/**
 * Get client IP from headers
 */
export function getClientIP(): string | null {
  const headersList = headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return realIP;
}

/**
 * Track a QR code scan
 */
export async function trackScan(params: {
  qrCodeId: string;
  gymId: string;
  memberId?: string;
  userAgent: string;
  referer?: string;
  url: string;
}): Promise<Scan | null> {
  const { qrCodeId, gymId, memberId, userAgent, referer, url } = params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase env for trackScan');
    return null;
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const deviceInfo = parseUserAgent(userAgent);
  const utmParams = extractUTMParams(url);
  const ipAddress = getClientIP();

  const { data: scan, error } = await supabase
    .from('scans')
    .insert({
      qr_code_id: qrCodeId,
      gym_id: gymId,
      member_id: memberId || null,
      scan_type: 'check-in',
      ip_address: ipAddress,
      user_agent: userAgent,
      device_type: deviceInfo.deviceType as 'mobile' | 'tablet' | 'desktop',
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      referrer: referer || null,
      ...utmParams,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to track scan:', error);
    return null;
  }

  return scan;
}

/**
 * Calculate analytics for a date range
 */
export function calculateAnalytics(scans: Scan[]) {
  const totalScans = scans.length;
  const uniqueDevices = new Set(scans.map((s) => s.ip_address)).size;
  const uniqueMembers = new Set(scans.filter((s) => s.member_id).map((s) => s.member_id)).size;

  // Device breakdown
  const devices = scans.reduce((acc, scan) => {
    const type = scan.device_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Hourly distribution
  const hourlyDistribution = scans.reduce((acc, scan) => {
    const hour = new Date(scan.scanned_at).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Peak hour
  const peakHour = Object.entries(hourlyDistribution).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    totalScans,
    uniqueDevices,
    uniqueMembers,
    devices,
    hourlyDistribution,
    peakHour: peakHour ? parseInt(peakHour) : null,
  };
}

/**
 * Format scan count for display
 */
export function formatScanCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
