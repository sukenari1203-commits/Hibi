-- VENTURE INFO anonymous analytics setup
-- Run this in Supabase Dashboard -> SQL Editor.
-- Browser visitors are allowed to INSERT only.
-- They are NOT granted SELECT / UPDATE / DELETE access.

create table if not exists public.survey_responses (
  id bigint generated always as identity primary key,
  session_id text not null,
  interested_industries text[] not null default '{}',
  no_preference boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  session_id text not null,
  event_type text not null,
  industry text,
  company text,
  x_position numeric(7,4),
  depth_m integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.survey_responses enable row level security;
alter table public.events enable row level security;

revoke all on table public.survey_responses from anon, authenticated;
revoke all on table public.events from anon, authenticated;

grant insert on table public.survey_responses to anon, authenticated;
grant insert on table public.events to anon, authenticated;

drop policy if exists "public insert survey only" on public.survey_responses;
create policy "public insert survey only"
on public.survey_responses
for insert
to anon, authenticated
with check (
  char_length(session_id) between 10 and 100
  and cardinality(interested_industries) <= 9
);

drop policy if exists "public insert events only" on public.events;
create policy "public insert events only"
on public.events
for insert
to anon, authenticated
with check (
  char_length(session_id) between 10 and 100
  and char_length(event_type) between 1 and 80
  and (depth_m is null or depth_m between 0 and 1300)
  and (x_position is null or x_position between 0 and 1)
);

create index if not exists events_session_id_idx on public.events(session_id);
create index if not exists events_event_type_idx on public.events(event_type);
create index if not exists events_industry_idx on public.events(industry);
create index if not exists events_created_at_idx on public.events(created_at);
create index if not exists survey_session_id_idx on public.survey_responses(session_id);
