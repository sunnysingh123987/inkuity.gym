// Types matching the Supabase database schema

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  company_name: string | null;
  business_address: string | null;
  subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'past_due';
  subscription_expires_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Gym {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  timezone: string;
  currency: string;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QRCode {
  id: string;
  gym_id: string;
  code: string;
  name: string;
  label: string | null;
  type: 'check-in' | 'equipment' | 'class' | 'promotion' | 'custom';
  redirect_url: string | null;
  design_settings: {
    primaryColor?: string;
    backgroundColor?: string;
    logoEnabled?: boolean;
    frameStyle?: string;
  };
  scan_limit: number | null;
  expires_at: string | null;
  is_active: boolean;
  total_scans: number;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  gym_id: string;
  gym?: {
    name: string;
  };
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  member_since: string;
  membership_tier: string;
  membership_status: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending';
  subscription_start_date: string | null;
  subscription_plan: '1_month' | '3_months' | '6_months' | '1_year' | 'custom' | null;
  subscription_end_date: string | null;
  birth_date: string | null;
  gender: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: string;
  qr_code_id: string | null;
  gym_id: string;
  member_id: string | null;
  scanned_at: string;
  scan_type: 'check-in' | 'equipment' | 'class' | 'promotion';
  ip_address: string | null;
  user_agent: string | null;
  device_type: 'mobile' | 'tablet' | 'desktop' | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  session_duration_seconds: number | null;
  converted: boolean;
  conversion_type: string | null;
  metadata: Record<string, any>;
}

export interface CheckIn {
  id: string;
  gym_id: string;
  member_id: string | null;
  qr_code_id: string | null;
  scan_id: string | null;
  check_in_at: string;
  check_out_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  tags: string[] | null;
  metadata: Record<string, any>;
}

export interface DailyAnalytics {
  id: string;
  gym_id: string;
  date: string;
  total_scans: number;
  unique_visitors: number;
  new_members: number;
  returning_members: number;
  peak_hour: number | null;
  scans_by_hour: Record<string, number>;
  top_device: string | null;
  devices_breakdown: Record<string, number>;
  top_city: string | null;
  cities_breakdown: Record<string, number>;
  conversions: number;
  conversion_rate: number | null;
  created_at: string;
  updated_at: string;
}

// Join types for queries
export interface QRCodeWithGym extends QRCode {
  gym: Gym;
}

export interface ScanWithDetails extends Scan {
  qr_code?: QRCode;
  member?: Member;
  gym?: Gym;
}

export interface GymWithQRCount extends Gym {
  qr_count: number;
  total_scans: number;
}
