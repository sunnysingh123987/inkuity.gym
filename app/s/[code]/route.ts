import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { UAParser } from 'ua-parser-js';

/**
 * QR Code Scan Handler
 * Route: /s/{code}
 * This endpoint handles QR code scans, tracks analytics, and redirects to the gym landing page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;
  const supabase = createAdminSupabaseClient();

  try {
    // 1. Find QR code and gym info
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('*, gym:gyms(*)')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (qrError || !qrCode) {
      // QR code not found or inactive
      return NextResponse.redirect(new URL('/qr-not-found', request.url));
    }

    // 2. Check if QR code has expired
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/qr-expired', request.url));
    }

    // 3. Check if scan limit reached
    if (qrCode.scan_limit && qrCode.total_scans >= qrCode.scan_limit) {
      return NextResponse.redirect(new URL('/qr-limit-reached', request.url));
    }

    // 4. Collect scan data
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const ipAddress = getClientIPFromRequest(request);

    // Parse user agent for device info
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    // Extract UTM params from URL
    const url = new URL(request.url);
    const utmSource = url.searchParams.get('utm_source');
    const utmMedium = url.searchParams.get('utm_medium');
    const utmCampaign = url.searchParams.get('utm_campaign');

    // 5. Record the scan
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        qr_code_id: qrCode.id,
        gym_id: qrCode.gym_id,
        scan_type: qrCode.type,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: (uaResult.device.type || 'desktop') as 'mobile' | 'tablet' | 'desktop',
        browser: uaResult.browser.name || 'Unknown',
        os: uaResult.os.name || 'Unknown',
        referrer: referer,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      })
      .select()
      .single();

    if (scanError) {
      console.error('Failed to record scan:', scanError);
    }

    // 6. Create check-in record if it's a check-in type
    // Note: We'll create the check-in after member identification on the landing page
    // if (qrCode.type === 'check-in') {
    //   await supabase.from('check_ins').insert({
    //     gym_id: qrCode.gym_id,
    //     qr_code_id: qrCode.id,
    //     scan_id: scan?.id || null,
    //     tags: ['qr-scan'],
    //   });
    // }

    // 7. Determine redirect URL
    let redirectUrl: string;

    if (qrCode.redirect_url) {
      // Use custom redirect URL
      redirectUrl = qrCode.redirect_url;
    } else if (qrCode.type === 'check-in') {
      // Check-in QR codes redirect to member portal sign-in
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inkuity.com';
      const gymSlug = qrCode.gym.slug;

      const targetUrl = new URL(`/${gymSlug}/portal/sign-in`, baseUrl);
      targetUrl.searchParams.set('scan_id', scan?.id || '');
      targetUrl.searchParams.set('qr_code', code);
      targetUrl.searchParams.set('checkin', 'true');

      redirectUrl = targetUrl.toString();
    } else {
      // Redirect to gym landing page
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inkuity.com';
      const gymSlug = qrCode.gym.slug;

      // Build URL with tracking params
      const targetUrl = new URL(`/${gymSlug}`, baseUrl);
      targetUrl.searchParams.set('scan_id', scan?.id || '');
      targetUrl.searchParams.set('qr_code', code);

      if (utmSource) targetUrl.searchParams.set('utm_source', utmSource);
      if (utmMedium) targetUrl.searchParams.set('utm_medium', utmMedium);
      if (utmCampaign) targetUrl.searchParams.set('utm_campaign', utmCampaign);

      redirectUrl = targetUrl.toString();
    }

    // 8. Return redirect response
    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: {
        'X-Scan-ID': scan?.id || '',
        'X-QR-Code': code,
      },
    });

  } catch (error) {
    console.error('QR scan handler error:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

/**
 * Extract client IP from request headers
 */
function getClientIPFromRequest(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return request.ip || null;
}
