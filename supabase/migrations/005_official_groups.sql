alter table public.groups drop constraint if exists groups_id_check;
alter table public.groups
  add constraint groups_id_check check (id between 1 and 7);

insert into public.groups (id, label, color) values
  (7, 'Group 7', '#06b6d4')
on conflict (id) do update
set label = excluded.label, color = excluded.color;

update public.session_state
set max_participants = 28
where id = 1;
