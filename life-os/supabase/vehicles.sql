-- ============================================================
-- Life OS — Vehicles Migration
-- Run this in Supabase > SQL Editor
-- ============================================================

-- 1. VEHICLES
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  vehicle_type text not null check (vehicle_type in (
    'car', 'van', 'motorbike', 'scooter', 'truck', 'motorhome', 'caravan', 'other'
  )),
  make text,
  model text,
  reg_number text,
  year integer,
  colour text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vehicles enable row level security;

create trigger vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.handle_updated_at();

create index if not exists vehicles_user on public.vehicles(user_id);


-- 2. VEHICLE SHARES
create table if not exists public.vehicle_shares (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  shared_with_email text not null,
  shared_with_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(vehicle_id, shared_with_email)
);

alter table public.vehicle_shares enable row level security;

create policy "Owner can manage vehicle shares"
  on public.vehicle_shares
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Shared user can read their vehicle shares"
  on public.vehicle_shares for select
  using (
    shared_with_id = auth.uid()
    or shared_with_email = (select email from public.profiles where id = auth.uid())
  );

create index if not exists vehicle_shares_vehicle on public.vehicle_shares(vehicle_id);


-- 3. VEHICLE RLS
create policy "Users can read own and shared vehicles"
  on public.vehicles for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.vehicle_shares vs
      where vs.vehicle_id = vehicles.id
      and (vs.shared_with_id = auth.uid()
        or vs.shared_with_email = (select email from public.profiles where id = auth.uid()))
    )
  );

create policy "Users can insert own vehicles"
  on public.vehicles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own and shared vehicles"
  on public.vehicles for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.vehicle_shares vs
      where vs.vehicle_id = vehicles.id
      and (vs.shared_with_id = auth.uid()
        or vs.shared_with_email = (select email from public.profiles where id = auth.uid()))
    )
  );

create policy "Users can delete own vehicles"
  on public.vehicles for delete
  using (auth.uid() = user_id);


-- 4. MOTS
create table if not exists public.vehicle_mots (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  test_date date not null,
  expiry_date date not null,
  passed boolean not null default true,
  garage_name text,
  cost numeric(10,2),
  mileage integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vehicle_mots enable row level security;

create trigger vehicle_mots_updated_at
  before update on public.vehicle_mots
  for each row execute function public.handle_updated_at();

create policy "Users can manage mots for accessible vehicles"
  on public.vehicle_mots
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.vehicle_shares vs
      where vs.vehicle_id = vehicle_mots.vehicle_id
      and (vs.shared_with_id = auth.uid()
        or vs.shared_with_email = (select email from public.profiles where id = auth.uid()))
    )
  )
  with check (auth.uid() = user_id);

create index if not exists vehicle_mots_vehicle on public.vehicle_mots(vehicle_id);


-- 5. SERVICES
create table if not exists public.vehicle_services (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  service_date date not null,
  garage_name text,
  cost numeric(10,2),
  mileage integer,
  service_type text check (service_type in ('full', 'interim', 'major', 'other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vehicle_services enable row level security;

create trigger vehicle_services_updated_at
  before update on public.vehicle_services
  for each row execute function public.handle_updated_at();

create policy "Users can manage services for accessible vehicles"
  on public.vehicle_services
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.vehicle_shares vs
      where vs.vehicle_id = vehicle_services.vehicle_id
      and (vs.shared_with_id = auth.uid()
        or vs.shared_with_email = (select email from public.profiles where id = auth.uid()))
    )
  )
  with check (auth.uid() = user_id);

create index if not exists vehicle_services_vehicle on public.vehicle_services(vehicle_id);


-- 6. MAINTENANCE
create table if not exists public.vehicle_maintenance (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null,
  description text not null,
  garage_name text,
  cost numeric(10,2),
  mileage integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vehicle_maintenance enable row level security;

create trigger vehicle_maintenance_updated_at
  before update on public.vehicle_maintenance
  for each row execute function public.handle_updated_at();

create policy "Users can manage maintenance for accessible vehicles"
  on public.vehicle_maintenance
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.vehicle_shares vs
      where vs.vehicle_id = vehicle_maintenance.vehicle_id
      and (vs.shared_with_id = auth.uid()
        or vs.shared_with_email = (select email from public.profiles where id = auth.uid()))
    )
  )
  with check (auth.uid() = user_id);

create index if not exists vehicle_maintenance_vehicle on public.vehicle_maintenance(vehicle_id);


-- 7. POLICIES
create table if not exists public.vehicle_policies (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_type text not null default 'insurance' check (policy_type in ('insurance', 'breakdown', 'warranty', 'other')),
  insurer text,
  policy_number text,
  coverage_type text check (coverage_type in ('third_party', 'third_party_fire_theft', 'comprehensive', 'other')),
  start_date date not null,
  end_date date not null,
  cost numeric(10,2),
  auto_renews boolean default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vehicle_policies enable row level security;

create trigger vehicle_policies_updated_at
  before update on public.vehicle_policies
  for each row execute function public.handle_updated_at();

create policy "Users can manage policies for accessible vehicles"
  on public.vehicle_policies
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.vehicle_shares vs
      where vs.vehicle_id = vehicle_policies.vehicle_id
      and (vs.shared_with_id = auth.uid()
        or vs.shared_with_email = (select email from public.profiles where id = auth.uid()))
    )
  )
  with check (auth.uid() = user_id);

create index if not exists vehicle_policies_vehicle on public.vehicle_policies(vehicle_id);
