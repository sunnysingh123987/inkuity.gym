-- ============================================================
-- Migration: Add PIN lockout columns to members
-- Description: Adds failed_pin_attempts and pin_locked_until
--              columns required by portal PIN authentication.
--              These were missing, causing signInWithPIN queries
--              to fail with a PostgREST 400 error.
-- ============================================================

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER DEFAULT 0;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;
