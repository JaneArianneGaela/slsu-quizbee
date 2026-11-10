alter table public.session_state
  add column if not exists clincher_winner_group_id smallint references public.groups(id);

create or replace function public.submit_clincher_answer(
  p_group_id smallint,
  p_question_id text,
  p_participant_id uuid,
  p_answer text,
  p_is_correct boolean,
  p_elapsed_ms integer
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_state public.session_state%rowtype;
begin
  select *
    into current_state
    from public.session_state
   where id = 1
   for update;

  if not found then
    return 'stale_question';
  end if;

  if current_state.clincher_winner_group_id is not null then
    return 'clincher_decided';
  end if;

  if current_state.phase <> 'QUESTION_LIVE'
     or current_state.current_round <> 'CL'
     or current_state.current_question_id <> p_question_id then
    return 'stale_question';
  end if;

  if current_state.deadline is null
     or current_state.paused_remaining_ms is not null
     or clock_timestamp() > current_state.deadline then
    return 'too_late';
  end if;

  if current_state.clincher_groups is null
     or not (current_state.clincher_groups @> jsonb_build_array(p_group_id)) then
    return 'not_eligible';
  end if;

  if not exists (
    select 1
      from public.participants
     where id = p_participant_id
       and group_id = p_group_id
       and role = 'ANSWERER'
  ) then
    return 'not_eligible';
  end if;

  if exists (
    select 1
      from public.submissions
     where group_id = p_group_id
       and question_id = p_question_id
  ) then
    return 'already_answered';
  end if;

  insert into public.submissions (
    group_id,
    question_id,
    participant_id,
    answer,
    is_correct,
    points_awarded,
    elapsed_ms
  ) values (
    p_group_id,
    p_question_id,
    p_participant_id,
    p_answer,
    p_is_correct,
    case when p_is_correct then 1 else 0 end,
    greatest(0, p_elapsed_ms)
  );

  if p_is_correct then
    update public.session_state
       set clincher_winner_group_id = p_group_id,
           phase = 'REVEALED',
           revealed = true,
           paused_remaining_ms = null,
           updated_at = clock_timestamp()
     where id = 1;
  end if;

  return 'accepted';
exception
  when unique_violation then
    return 'already_answered';
end;
$$;

revoke all on function public.submit_clincher_answer(smallint, text, uuid, text, boolean, integer)
  from public, anon, authenticated;
grant execute on function public.submit_clincher_answer(smallint, text, uuid, text, boolean, integer)
  to service_role;
