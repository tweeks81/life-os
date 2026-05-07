-- ============================================================
-- Life OS — Vehicle Tax Migration
-- Run this in Supabase > SQL Editor
-- ============================================================

create table if not exists public.vehicle_tax (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  duration text not null check (duration in ('6_months', '12_months')),
  start_date date not null,
  expiry_date date not null,
  cost numeric(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vehicle_tax enable row level security;

create trigger vehicle_tax_updated_at
  before update on public.vehicle_tax
  for each row execute function public.handle_updated_at();

create policy "Users can manage tax for accessible vehicles"
  on public.vehicle_tax
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.vehicle_shares vs
      where vs.vehicle_id = vehicle_tax.vehicle_id
      and (
        vs.shared_with_id = auth.uid()
        or vs.shared_with_email = (select email from public.profiles where id = auth.uid())
      )
    )
  )
  with check (auth.uid() = user_id);

create index if not exists vehicle_tax_vehicle on public.vehicle_tax(vehicle_id);
