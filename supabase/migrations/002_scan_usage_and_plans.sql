-- Migration 002: scan_usage table and plan column on profiles
-- Run this in your Supabase SQL editor

-- Add plan column to profiles (free | pro)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro'));

-- Scan usage tracking table (one row per user per day)
CREATE TABLE IF NOT EXISTS public.scan_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date    DATE NOT NULL DEFAULT CURRENT_DATE,
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_scan_usage_user_date ON public.scan_usage(user_id, date);

-- Enable Row Level Security
ALTER TABLE public.scan_usage ENABLE ROW LEVEL SECURITY;

-- Users can only read their own usage (write is done via service role on the API)
CREATE POLICY "Users can view own scan usage"
  ON public.scan_usage FOR SELECT
  USING (auth.uid() = user_id);
