// Types matching the Supabase database schema

export type PaymentMethod = 'cash' | 'paytm' | 'phonepe' | 'upi' | 'bank_transfer' | 'other';

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
  membership_status: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending' | 'trial';
  subscription_start_date: string | null;
  subscription_plan: '1_month' | '3_months' | '6_months' | '1_year' | 'custom' | null;
  subscription_end_date: string | null;
  birth_date: string | null;
  gender: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  is_verified: boolean;
  is_blacklisted?: boolean;
  blacklisted_at?: string | null;
  blacklist_reason?: string | null;
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

export interface Notification {
  id: string;
  gym_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  gym_id: string;
  member_id: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'one_time' | 'penalty' | 'refund';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string | null;
  payment_method: PaymentMethod;
  payment_date: string;
  period_start: string | null;
  period_end: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  duration: '1_month' | '3_months' | '6_months' | '1_year';
  price: number;
  description: string;
}

export interface PaymentWithMember extends Payment {
  member: Pick<Member, 'id' | 'full_name' | 'email' | 'phone'>;
}

export interface GymReview {
  id: string;
  gym_id: string;
  member_id: string;
  rating: number;
  review_text: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedbackRequest {
  id: string;
  gym_id: string;
  member_id: string;
  sent_at: string;
  responded_at: string | null;
  response_text: string | null;
  response_rating: number | null;
  status: 'sent' | 'responded' | 'expired';
  metadata: Record<string, any>;
  created_at: string;
}

export interface Referral {
  id: string;
  gym_id: string;
  referrer_member_id: string;
  referred_member_id: string;
  status: 'pending' | 'converted' | 'expired' | 'rewarded';
  bonus_type: string | null;
  bonus_value: number | null;
  bonus_applied_at: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  gym_id: string;
  full_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  salary: number;
  salary_frequency: 'monthly' | 'weekly' | 'daily';
  hire_date: string;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  gym_id: string;
  category: string;
  description: string | null;
  amount: number;
  currency: string;
  expense_date: string;
  is_recurring: boolean;
  recurrence_frequency: 'monthly' | 'quarterly' | 'yearly' | null;
  staff_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GymRole {
  id: string;
  gym_id: string;
  user_id: string;
  role: 'owner' | 'co_owner' | 'trainer' | 'receptionist' | 'viewer';
  permissions: Record<string, boolean>;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalRecord {
  id: string;
  gym_id: string;
  member_id: string;
  exercise_name: string;
  exercise_id: string | null;
  weight: number;
  reps: number;
  recorded_at: string;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Announcement {
  id: string;
  gym_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'emergency' | 'holiday' | 'closure';
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  notify_members: boolean;
  metadata: Record<string, any>;
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

export interface GymReviewWithMember extends GymReview {
  member: Pick<Member, 'id' | 'full_name' | 'avatar_url'>;
}

export interface FeedbackRequestWithMember extends FeedbackRequest {
  member: Pick<Member, 'id' | 'full_name' | 'email' | 'phone'>;
}

export interface ReferralWithMembers extends Referral {
  referrer: Pick<Member, 'id' | 'full_name' | 'email'>;
  referred: Pick<Member, 'id' | 'full_name' | 'email'>;
}

export interface ExpenseWithStaff extends Expense {
  staff: Pick<Staff, 'id' | 'full_name' | 'role'> | null;
}
