-- ============================================================
-- Life OS — Calendar Event Shares Migration
-- Run this in Supabase > SQL Editor
-- ============================================================

create table if not exists public.calendar_event_shares (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  shared_with_email text not null,
  shared_with_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(event_id, shared_with_email)
);

alter table public.calendar_event_shares enable row level security;

create policy "Owner can manage calendar event shares"
  on public.calendar_event_shares
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Shared user can read their calendar event shares"
  on public.calendar_event_shares for select
  using (
    shared_with_id = auth.uid()
    or shared_with_email = (select email from public.profiles where id = auth.uid())
  );

create index if not exists calendar_event_shares_event on public.calendar_event_shares(event_id);
create index if not exists calendar_event_shares_email on public.calendar_event_shares(shared_with_email);

-- Allow shared users to read events shared with them
drop policy if exists "Users manage own calendar events" on public.calendar_events;

create policy "Users can read own and shared calendar events"
  on public.calendar_events for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.calendar_event_shares ces
      where ces.event_id = calendar_events.id
      and (
        ces.shared_with_id = auth.uid()
        or ces.shared_with_email = (select email from public.profiles where id = auth.uid())
      )
    )
  );

create policy "Users can insert own calendar events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own calendar events"
  on public.calendar_events for update
  using (auth.uid() = user_id);

create policy "Users can delete own calendar events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);
