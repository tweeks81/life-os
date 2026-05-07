-- ============================================================
-- Life OS — Vehicle Insurance Update
-- Run this in Supabase > SQL Editor
-- ============================================================

-- Add new insurance-specific columns to vehicle_policies
alter table public.vehicle_policies
  add column if not exists excess numeric(10,2),
  add column if not exists policy_holder text,
  add column if not exists named_drivers text[],
  add column if not exists includes_courtesy_car boolean default false,
  add column if not exists includes_breakdown boolean default false,
  add column if not exists includes_legal_cover boolean default false,
  add column if not exists includes_personal_accident boolean default false,
  add column if not exists includes_windscreen boolean default false,
  add column if not exists includes_european_cover boolean default false,
  add column if not exists includes_no_claims_protection boolean default false;
