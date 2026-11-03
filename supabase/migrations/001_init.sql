-- ============ TABLES ============
create table public.groups (
  id smallint primary key check (id between 1 and 6),
  label text not null,
  color text not null
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  college text not null check (college in ('CEN','CAS','CAG','CIT','CTE')),
  pin_hash text not null,
  device_token_hash text,
  group_id smallint references public.groups(id),
  role text check (role in ('VIEWER','ANSWERER')),
  active_session text,
  created_at timestamptz not null default now()
);
create unique index participants_name_college_uq
  on public.participants (lower(full_name), college);
-- exactly one Answerer per group, enforced atomically by the database
create unique index one_answerer_per_group
  on public.participants (group_id) where role = 'ANSWERER';

create table public.questions (
  id text primary key,
  round text not null check (round in ('R1','R2','R3','CL')),
  order_no int not null,
  source_college text,
  input_mode text not null check (input_mode in
    ('NUMBER','FRACTION','IPV4','CHOICE','TEXT','LIST')),
  prompt text not null,
  options jsonb,
  correct text not null,
  accepted text[] not null default '{}',
  tolerance numeric not null default 0,
  points int not null,
  time_limit_s int not null
);

create table public.session_state (
  id int primary key check (id = 1),
  phase text not null default 'REGISTRATION',
  registration_open boolean not null default true,
  max_participants int not null default 30,
  grace_ms int not null default 250,
  current_question_id text,
  current_round text,
  started_at timestamptz,
  deadline timestamptz,
  paused_remaining_ms int,
  revealed boolean not null default false,
  question_order jsonb,          -- shuffled order saved once per session
  clincher_groups jsonb,         -- group ids in the tiebreaker
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  group_id smallint not null references public.groups(id),
  question_id text not null references public.questions(id),
  participant_id uuid not null references public.participants(id),
  answer text not null,
  is_correct boolean,
  points_awarded int not null default 0,
  elapsed_ms int,
  overridden boolean not null default false,
  submitted_at timestamptz not null default now(),
  unique (group_id, question_id)
);

create table public.integrity_events (
  id bigserial primary key,
  participant_id uuid references public.participants(id) on delete set null,
  event_type text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ============ SECURITY ============
alter table public.groups           enable row level security;
alter table public.participants     enable row level security;
alter table public.questions        enable row level security;
alter table public.session_state    enable row level security;
alter table public.submissions      enable row level security;
alter table public.integrity_events enable row level security;

-- browser clients get nothing by default
revoke all on public.groups, public.participants, public.questions,
  public.session_state, public.submissions, public.integrity_events
  from anon, authenticated;

-- session_state holds no secrets, so it is readable (needed for Realtime)
grant select on public.session_state to anon;
create policy "anon read session_state" on public.session_state
  for select to anon using (true);

-- non-sensitive views (owner rights, so they bypass table RLS safely)
create view public.public_roster as
  select id, full_name, college, group_id, role from public.participants;
create view public.public_groups as
  select id, label, color from public.groups;
grant select on public.public_roster, public.public_groups to anon;

-- ============ REALTIME ============
alter publication supabase_realtime add table public.session_state;

-- ============ SEED BASICS ============
insert into public.groups (id, label, color) values
  (1,'Group 1','#ef4444'),(2,'Group 2','#f59e0b'),(3,'Group 3','#10b981'),
  (4,'Group 4','#3b82f6'),(5,'Group 5','#8b5cf6'),(6,'Group 6','#ec4899');
insert into public.session_state (id) values (1);