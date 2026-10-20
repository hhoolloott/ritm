-- Run once in the SQL editor of the Supabase project you own.
create table if not exists public.journals (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) < 4000000),
 revision integer not null default 0 check (revision >= 0),
 updated_at timestamptz not null default now()
);
alter table public.journals enable row level security;
revoke all on public.journals from anon;
grant select, insert, update on public.journals to authenticated;
create policy "Read own journal" on public.journals for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own journal" on public.journals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own journal" on public.journals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create or replace function public.save_journal(p_payload jsonb,p_expected_revision integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare v_user uuid := auth.uid(); v_revision integer;
begin
 if v_user is null then raise exception 'Authentication required' using errcode = '42501'; end if;
 if p_expected_revision is null or p_expected_revision < 0 or p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) >= 4000000 then raise exception 'Invalid payload' using errcode = '22023'; end if;
 if p_expected_revision = 0 then
  insert into public.journals(user_id,payload,revision) values(v_user,p_payload,1)
  on conflict (user_id) do nothing returning revision into v_revision;
 end if;
 if v_revision is null then
  update public.journals set payload=p_payload,revision=revision+1,updated_at=now()
  where user_id=v_user and revision=p_expected_revision returning revision into v_revision;
 end if;
 if v_revision is null then raise exception 'Journal changed on another device' using errcode='40001'; end if;
 return v_revision;
end;
$$;
revoke all on function public.save_journal(jsonb,integer) from public,anon;
grant execute on function public.save_journal(jsonb,integer) to authenticated;
