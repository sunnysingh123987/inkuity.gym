-- ============================================================
-- Migration: Add Missing Indexes for Performance at Scale
-- Created: 2026-03-01
-- Description: Adds indexes on commonly queried columns that
--              were missing from previous migrations.
-- ============================================================

-- payments: filter by member at a gym, and date-range reports
CREATE INDEX IF NOT EXISTS idx_payments_gym_member
  ON public.payments(gym_id, member_id);

-- workout_sessions: member history sorted by date
CREATE INDEX IF NOT EXISTS idx_workout_sessions_member_started
  ON public.workout_sessions(member_id, started_at DESC);

-- exercise_sets: always fetched by session_exercise + set order
CREATE INDEX IF NOT EXISTS idx_exercise_sets_session_set
  ON public.exercise_sets(session_exercise_id, set_number);

-- check_ins: streak calculation and history queries
CREATE INDEX IF NOT EXISTS idx_check_ins_member_checkin_desc
  ON public.check_ins(member_id, check_in_at DESC);

-- notifications: unread count is a hot query
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, is_read);

-- personal_records: PR lookups per member per exercise
CREATE INDEX IF NOT EXISTS idx_personal_records_member_exercise
  ON public.personal_records(member_id, exercise_name);

-- expenses: financial reports filter by gym + date range
CREATE INDEX IF NOT EXISTS idx_expenses_gym_date
  ON public.expenses(gym_id, expense_date);

-- members: filtering active/expired members per gym
CREATE INDEX IF NOT EXISTS idx_members_gym_status
  ON public.members(gym_id, membership_status);

-- webhook_events: cleanup queries for processed events
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_created
  ON public.webhook_events(processed, created_at);

-- diet_plans: quickly find active plan for a member
CREATE INDEX IF NOT EXISTS idx_diet_plans_member_active
  ON public.diet_plans(member_id, is_active)
  WHERE is_active = true;

-- meal_plans: common query pattern for loading meals by date
CREATE INDEX IF NOT EXISTS idx_meal_plans_diet_plan_scheduled
  ON public.meal_plans(diet_plan_id, scheduled_for);
