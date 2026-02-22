-- ============================================================
-- Migration: Add payment_method column to payments table
-- Created: 2026-02-22
-- Description: Adds payment_method column to track how payments
--              were collected (cash, UPI, Paytm, PhonePe, etc.)
-- ============================================================

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';
