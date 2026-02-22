-- ============================================================
-- Migration: Staff & Expenses
-- Created: 2026-02-22
-- Description: Adds staff and expenses tables for gym
--              operational management and financial tracking
-- ============================================================

-- NOTE: This migration is safe to run multiple times (idempotent)

-- ============================================================
-- 1. STAFF TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  salary NUMERIC(10,2) DEFAULT 0,
  salary_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (salary_frequency IN ('monthly', 'weekly', 'daily')),
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_gym
ON public.staff(gym_id);

CREATE INDEX IF NOT EXISTS idx_staff_active
ON public.staff(gym_id, is_active);

CREATE INDEX IF NOT EXISTS idx_staff_role
ON public.staff(gym_id, role);

-- ============================================================
-- 2. EXPENSES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  expense_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency VARCHAR(20) CHECK (recurrence_frequency IN ('monthly', 'quarterly', 'yearly')),
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_gym
ON public.expenses(gym_id);

CREATE INDEX IF NOT EXISTS idx_expenses_category
ON public.expenses(gym_id, category);

CREATE INDEX IF NOT EXISTS idx_expenses_date
ON public.expenses(gym_id, expense_date);

CREATE INDEX IF NOT EXISTS idx_expenses_staff
ON public.expenses(staff_id);

CREATE INDEX IF NOT EXISTS idx_expenses_recurring
ON public.expenses(gym_id, is_recurring);

-- ============================================================
-- 3. RLS POLICIES - STAFF
-- ============================================================

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym owners can view staff" ON public.staff;
DROP POLICY IF EXISTS "Gym owners can insert staff" ON public.staff;
DROP POLICY IF EXISTS "Gym owners can update staff" ON public.staff;
DROP POLICY IF EXISTS "Gym owners can delete staff" ON public.staff;
DROP POLICY IF EXISTS "Service role full access to staff" ON public.staff;

CREATE POLICY "Gym owners can view staff"
  ON public.staff FOR SELECT
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can insert staff"
  ON public.staff FOR INSERT
  WITH CHECK (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can update staff"
  ON public.staff FOR UPDATE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can delete staff"
  ON public.staff FOR DELETE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Service role full access to staff"
  ON public.staff FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 4. RLS POLICIES - EXPENSES
-- ============================================================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym owners can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Gym owners can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Gym owners can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Gym owners can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Service role full access to expenses" ON public.expenses;

CREATE POLICY "Gym owners can view expenses"
  ON public.expenses FOR SELECT
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can update expenses"
  ON public.expenses FOR UPDATE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can delete expenses"
  ON public.expenses FOR DELETE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Service role full access to expenses"
  ON public.expenses FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_staff_updated_at ON public.staff;
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
