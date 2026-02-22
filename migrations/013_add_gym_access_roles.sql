-- ============================================================
-- Migration: Gym Access Roles
-- Created: 2026-02-22
-- Description: Adds gym_roles table for multi-level access
--              control (co-owner, trainer, receptionist, etc.)
-- ============================================================

-- NOTE: This migration is safe to run multiple times (idempotent)

-- ============================================================
-- 1. GYM ROLES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gym_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'co_owner', 'trainer', 'receptionist', 'viewer')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT gym_roles_unique_user UNIQUE (gym_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gym_roles_gym
ON public.gym_roles(gym_id);

CREATE INDEX IF NOT EXISTS idx_gym_roles_user
ON public.gym_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_gym_roles_role
ON public.gym_roles(gym_id, role);

CREATE INDEX IF NOT EXISTS idx_gym_roles_active
ON public.gym_roles(gym_id, is_active);

-- ============================================================
-- 2. RLS POLICIES
-- ============================================================

ALTER TABLE public.gym_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym owners can view roles" ON public.gym_roles;
DROP POLICY IF EXISTS "Gym owners can insert roles" ON public.gym_roles;
DROP POLICY IF EXISTS "Gym owners can update roles" ON public.gym_roles;
DROP POLICY IF EXISTS "Gym owners can delete roles" ON public.gym_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.gym_roles;
DROP POLICY IF EXISTS "Users can accept own role" ON public.gym_roles;
DROP POLICY IF EXISTS "Service role full access to gym_roles" ON public.gym_roles;

CREATE POLICY "Gym owners can view roles"
  ON public.gym_roles FOR SELECT
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can insert roles"
  ON public.gym_roles FOR INSERT
  WITH CHECK (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can update roles"
  ON public.gym_roles FOR UPDATE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Gym owners can delete roles"
  ON public.gym_roles FOR DELETE
  USING (
    gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can view own roles"
  ON public.gym_roles FOR SELECT
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can accept own role"
  ON public.gym_roles FOR UPDATE
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Service role full access to gym_roles"
  ON public.gym_roles FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 3. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_gym_roles_updated_at ON public.gym_roles;
CREATE TRIGGER update_gym_roles_updated_at
  BEFORE UPDATE ON public.gym_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
