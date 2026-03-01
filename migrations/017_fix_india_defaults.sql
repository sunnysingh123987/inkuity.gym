-- ============================================================
-- Migration: Fix defaults for Indian users
-- Created: 2026-03-01
-- Description: Updates default country, timezone, and currency
--              to Indian values.
-- ============================================================

-- Gyms: default country to India
ALTER TABLE public.gyms ALTER COLUMN country SET DEFAULT 'IN';

-- Gyms: default timezone to Asia/Kolkata
ALTER TABLE public.gyms ALTER COLUMN timezone SET DEFAULT 'Asia/Kolkata';

-- Gyms: default currency to INR
ALTER TABLE public.gyms ALTER COLUMN currency SET DEFAULT 'INR';

-- Payments: default currency to INR
ALTER TABLE public.payments ALTER COLUMN currency SET DEFAULT 'INR';
