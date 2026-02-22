-- ============================================================
-- Migration: Payments Table
-- Created: 2026-02-22
-- Description: Adds a payments table to track member payments
--              for subscription fees, one-time charges, etc.
-- ============================================================

-- NOTE: This migration is safe to run multiple times (idempotent)

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  type TEXT NOT NULL DEFAULT 'subscription',  -- subscription, one_time, penalty, refund
  status TEXT NOT NULL DEFAULT 'completed',    -- completed, pending, failed, refunded
  description TEXT,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_start DATE,
  period_end DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_gym ON public.payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_payments_member ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_gym_date ON public.payments(gym_id, payment_date);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (safe re-run)
DROP POLICY IF EXISTS "Gym owners can view payments" ON public.payments;
DROP POLICY IF EXISTS "Gym owners can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Gym owners can update payments" ON public.payments;
DROP POLICY IF EXISTS "Service role full access to payments" ON public.payments;

-- Gym owners can see payments for their gym
CREATE POLICY "Gym owners can view payments"
  ON public.payments FOR SELECT
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

-- Gym owners can insert payments
CREATE POLICY "Gym owners can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

-- Gym owners can update payments
CREATE POLICY "Gym owners can update payments"
  ON public.payments FOR UPDATE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

-- Service role bypass (for admin/seed operations)
CREATE POLICY "Service role full access to payments"
  ON public.payments FOR ALL
  USING (auth.role() = 'service_role');
