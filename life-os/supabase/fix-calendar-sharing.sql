-- ============================================================
-- Life OS — Fix Calendar Event Sharing RLS
-- Run this in Supabase > SQL Editor
-- ============================================================

-- Fix the calendar_events select policy to correctly use shares
drop policy if exists "Users can read own and shared calendar events" on public.calendar_events;
drop policy if exists "Users can update own calendar events" on public.calendar_events;

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

-- Allow shared users to update (but not delete) events
create policy "Users can update own and shared calendar events"
  on public.calendar_events for update
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

-- Fix calendar_event_shares so recipient can always read their shares
drop policy if exists "Shared user can read their calendar event shares" on public.calendar_event_shares;

create policy "Shared user can read their calendar event shares"
  on public.calendar_event_shares for select
  using (
    auth.uid() = owner_id
    or shared_with_id = auth.uid()
    or shared_with_email = (select email from public.profiles where id = auth.uid())
  );
