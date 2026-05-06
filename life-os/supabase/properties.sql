-- ============================================================
-- Life OS — Properties Migration
-- Run this in Supabase > SQL Editor
-- ============================================================

-- 1. PROPERTIES TABLE
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  property_type text not null check (property_type in (
    'detached_house', 'semi_detached_house', 'terraced_house',
    'bungalow', 'flat', 'maisonette', 'cottage', 'farmhouse', 'other'
  )),
  year_built integer,
  is_primary_residence boolean not null default false,
  photo_url text,
  -- Address
  address_line1 text,
  address_line2 text,
  address_town text,
  address_city text,
  address_postcode text,
  address_country text default 'United Kingdom',
  -- Notes
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties enable row level security;

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.handle_updated_at();

create index if not exists properties_user on public.properties(user_id);

-- Enforce only one primary residence per user
-- When a property is set as primary, unset all others for that user
create or replace function public.enforce_single_primary_residence()
returns trigger language plpgsql as $$
begin
  if new.is_primary_residence = true then
    update public.properties
    set is_primary_residence = false
    where user_id = new.user_id
      and id != new.id
      and is_primary_residence = true;
  end if;
  return new;
end;
$$;

create trigger properties_single_primary
  after insert or update of is_primary_residence on public.properties
  for each row
  when (new.is_primary_residence = true)
  execute function public.enforce_single_primary_residence();


-- 2. PROPERTY SHARES
create table if not exists public.property_shares (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  shared_with_email text not null,
  shared_with_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(property_id, shared_with_email)
);

alter table public.property_shares enable row level security;

create policy "Owner can manage property shares"
  on public.property_shares
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Shared user can read their property shares"
  on public.property_shares for select
  using (
    shared_with_id = auth.uid()
    or shared_with_email = (select email from public.profiles where id = auth.uid())
  );

create index if not exists property_shares_property on public.property_shares(property_id);
create index if not exists property_shares_email on public.property_shares(shared_with_email);


-- 3. PROPERTY RLS POLICIES
create policy "Users can read own and shared properties"
  on public.properties for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.property_shares ps
      where ps.property_id = properties.id
      and (
        ps.shared_with_id = auth.uid()
        or ps.shared_with_email = (select email from public.profiles where id = auth.uid())
      )
    )
  );

create policy "Users can insert own properties"
  on public.properties for insert
  with check (auth.uid() = user_id);

create policy "Users can update own and shared properties"
  on public.properties for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.property_shares ps
      where ps.property_id = properties.id
      and (
        ps.shared_with_id = auth.uid()
        or ps.shared_with_email = (select email from public.profiles where id = auth.uid())
      )
    )
  );

create policy "Users can delete own properties"
  on public.properties for delete
  using (auth.uid() = user_id);


-- 4. STORAGE BUCKET FOR PROPERTY PHOTOS
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

create policy "Users can upload own property photos"
  on storage.objects for insert
  with check (
    bucket_id = 'property-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own property photos"
  on storage.objects for update
  using (
    bucket_id = 'property-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view property photos"
  on storage.objects for select
  using (bucket_id = 'property-photos');
