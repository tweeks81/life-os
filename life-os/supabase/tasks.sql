-- ============================================================
-- Life OS — Personal Tasks SQL Migration
-- Run this in Supabase > SQL Editor
-- ============================================================

-- 1. PROJECTS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','completed','on_hold','archived')),
  colour text,
  target_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users manage own projects" on public.projects
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists projects_user_status on public.projects(user_id, status);


-- 2. TASKS
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  category text not null check (category in ('home','vehicle','finance','health','garden','admin','family','technology','other')),
  context text not null check (context in ('home','calls','shop','online','errand','anywhere')),
  urgency integer not null check (urgency between 1 and 4),
  effort integer not null check (effort between 1 and 3),
  priority integer not null default 3,
  status text not null default 'open' check (status in ('open','in_progress','blocked','done')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users manage own tasks" on public.tasks
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists tasks_user_status on public.tasks(user_id, status);
create index if not exists tasks_project on public.tasks(project_id);
create index if not exists tasks_priority_status on public.tasks(priority, status);


-- 3. TASK ACTIONS
create table if not exists public.task_actions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in (
    'call_outbound','call_inbound','email_sent','email_received',
    'online_action','visit','purchase','note','document_uploaded',
    'resolved','escalated','blocked','unblocked'
  )),
  summary text not null,
  notes text,
  contact_name text,
  contact_organisation text,
  outcome text,
  actioned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.task_actions enable row level security;

create policy "Users manage own task actions" on public.task_actions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists task_actions_task_actioned on public.task_actions(task_id, actioned_at desc);


-- 4. UPDATED_AT TRIGGERS

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();


-- 5. PRIORITY TRIGGER

create or replace function public.calculate_task_priority()
returns trigger language plpgsql as $$
declare
  score integer;
begin
  score := (new.urgency * 3) + new.effort;
  if score <= 6 then
    new.priority := 1;
  elsif score <= 9 then
    new.priority := 2;
  elsif score <= 12 then
    new.priority := 3;
  else
    new.priority := 4;
  end if;
  return new;
end;
$$;

create trigger tasks_priority
  before insert or update of urgency, effort on public.tasks
  for each row execute function public.calculate_task_priority();
