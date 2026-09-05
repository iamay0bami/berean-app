-- 0002: Username auth.
-- Idempotent by design: safe to apply to a fresh database (after 0001) and to a
-- database that already has this feature live (column, index, and functions
-- already applied). Guards are definition-based, not name-based, where a name
-- could differ from this migration's chosen name.

alter table public.profiles add column if not exists username text;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_username_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (username is null or username ~ '^[a-z][a-z0-9_]{2,19}$');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_index i
    join pg_class c on c.oid = i.indrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'profiles'
      and i.indisunique
      and pg_get_indexdef(i.indexrelid) ilike '%lower(username)%'
  ) then
    create unique index profiles_username_lower_unique
      on public.profiles (lower(username));
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public' as $function$
declare
  new_username text;
begin
  new_username := nullif(trim(lower(coalesce(new.raw_user_meta_data ->> 'username', ''))), '');
  begin
    insert into public.profiles (id, name, initials, username)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'name', ''),
      upper(left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'name', ''), '[^A-Za-z]', '', 'g'), 2)),
      new_username
    );
  exception when unique_violation then
    raise exception 'username already taken';
  end;
  return new;
end;
$function$;

create or replace function public.resolve_username_email(p_username text)
returns text
language sql
stable security definer
set search_path to 'public' as $function$
  select u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.username = lower(trim(coalesce(p_username, '')))
  limit 1
$function$;

create or replace function public.username_available(p_username text)
returns boolean
language sql
stable security definer
set search_path to 'public' as $function$
  select not exists (
    select 1 from public.profiles
    where username = lower(trim(coalesce(p_username, '')))
  )
$function$;

revoke all on function public.resolve_username_email(text) from public, anon, authenticated;
grant execute on function public.resolve_username_email(text) to service_role;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated, service_role;

revoke all on function public.member_display(uuid[]) from public, anon;
grant execute on function public.member_display(uuid[]) to authenticated;

revoke all on function public.update_my_profile(text, text, text) from public, anon;
grant execute on function public.update_my_profile(text, text, text) to authenticated;

revoke all on function public.assign_user_role(uuid, public.app_role, text) from public, anon;
grant execute on function public.assign_user_role(uuid, public.app_role, text) to authenticated;
