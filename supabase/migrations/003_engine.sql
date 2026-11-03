alter table public.session_state add column if not exists current_index int not null default -1;

create table if not exists public.quiz_order (
  id int primary key check (id = 1),
  order_ids jsonb not null
);
alter table public.quiz_order enable row level security;
revoke all on public.quiz_order from anon, authenticated;