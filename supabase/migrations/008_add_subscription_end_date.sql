-- Add missing subscription_end_date column to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz DEFAULT NULL;
