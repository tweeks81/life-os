-- ============================================================
-- Life OS — Linked Contacts Migration
-- Run this in Supabase > SQL Editor
-- ============================================================

-- 1. CONTACT REQUESTS
-- A request from one user to another to link profiles
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(from_user_id, to_user_id)
);

alter table public.contact_requests enable row level security;

create trigger contact_requests_updated_at
  before update on public.contact_requests
  for each row execute function public.handle_updated_at();

-- Sender can create and read their own requests
create policy "Users can send requests"
  on public.contact_requests for insert
  with check (auth.uid() = from_user_id);

create policy "Users can read their own requests"
  on public.contact_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Recipient can update request status"
  on public.contact_requests for update
  using (auth.uid() = to_user_id or auth.uid() = from_user_id);

create policy "Users can delete their own requests"
  on public.contact_requests for delete
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create index if not exists contact_requests_from on public.contact_requests(from_user_id);
create index if not exists contact_requests_to on public.contact_requests(to_user_id);


-- 2. LINKED CONTACTS
-- When a request is accepted, a two-way link is created
-- Each row represents one direction of the link
create table if not exists public.linked_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  linked_user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references public.contact_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id, linked_user_id)
);

alter table public.linked_contacts enable row level security;

create policy "Users can manage own linked contacts"
  on public.linked_contacts
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read links where they are the linked user"
  on public.linked_contacts for select
  using (auth.uid() = linked_user_id);

create index if not exists linked_contacts_user on public.linked_contacts(user_id);
create index if not exists linked_contacts_linked on public.linked_contacts(linked_user_id);
