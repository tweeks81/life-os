-- ============================================================
-- Life OS — Supabase Setup SQL
-- Run this in Supabase > SQL Editor
-- ============================================================

-- 1. ALLOWED EMAILS (whitelist)
-- Add email addresses here to grant access.
create table if not exists public.allowed_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  label text,                          -- e.g. "Dad", "Sister"
  invited_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Only the service role / admins can read/write allowed_emails
alter table public.allowed_emails enable row level security;

-- Admins manage via Supabase dashboard; no client-side access needed.
-- (If you want to build an admin UI later, add policies here.)


-- ============================================================
-- 2. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  date_of_birth date,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can only read and write their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);


-- ============================================================
-- 3. AVATARS STORAGE BUCKET
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');


-- ============================================================
-- 4. ADD YOUR EMAIL TO THE WHITELIST
-- Replace with your actual Gmail address:
-- ============================================================
-- insert into public.allowed_emails (email, label)
-- values ('you@gmail.com', 'Admin');

-- To add a family member:
-- insert into public.allowed_emails (email, label)
-- values ('family@gmail.com', 'Partner');
