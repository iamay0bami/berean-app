-- 0010_profile_account_boundary.sql
-- Apply manually in the Supabase SQL Editor. Never through the CLI.
-- Live state checked 2026-11-09: authenticated has table-level SELECT only on
-- public.profiles; no INSERT/UPDATE/DELETE; no triggers on profiles. This
-- migration changes NO table grants, policies or triggers.
begin;

-- 1. Initials: first two letters of the name; Yoruba letters kept (dot-below
--    letters such as Ẹ, Ọ, Ṣ); tone marks (grave, acute, macron) dropped;
--    spaces and punctuation ignored; uppercase.
create or replace function public.initials_from_name(full_name text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $fn$
  select upper(left(
    normalize(
      regexp_replace(
        regexp_replace(normalize(coalesce(full_name, ''), NFD), '[̀́̄]', '', 'g'),
        '[^A-Za-zÀ-ɏ̣Ḁ-ỿ]', '', 'g'
      ),
      NFC
    ),
    2
  ))
$fn$;

revoke all on function public.initials_from_name(text) from public, anon, authenticated;

-- 2. The only member-facing profile write: name and username, own row only.
create or replace function public.update_own_account(new_name text, new_username text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  caller_id uuid := (select auth.uid());
  normalized_name text;
  normalized_username text;
  affected integer;
begin
  if caller_id is null then
    raise exception 'forbidden';
  end if;

  normalized_name := normalize(btrim(coalesce(new_name, '')), NFC);
  if char_length(normalized_name) < 1 or char_length(normalized_name) > 80 then
    raise exception 'invalid name';
  end if;

  normalized_username := nullif(lower(btrim(coalesce(new_username, ''))), '');
  if normalized_username is not null
     and normalized_username !~ '^[a-z][a-z0-9_]{2,19}$' then
    raise exception 'invalid username';
  end if;

  begin
    update public.profiles
       set name = normalized_name,
           initials = public.initials_from_name(normalized_name),
           username = normalized_username,
           updated_at = now()
     where id = caller_id;
    get diagnostics affected = row_count;
  exception when unique_violation then
    raise exception 'username already taken' using errcode = '23505';
  end;

  if affected = 0 then
    raise exception 'profile missing';
  end if;
end;
$fn$;

revoke all on function public.update_own_account(text, text) from public, anon, authenticated;
grant execute on function public.update_own_account(text, text) to authenticated;

-- 3. Retire the legacy write path (it let members set initials and tagline).
do $migration$
begin
  if to_regprocedure('public.update_my_profile(text,text,text)') is not null then
    execute 'revoke all on function public.update_my_profile(text, text, text) from public, anon, authenticated';
    execute 'drop function public.update_my_profile(text, text, text)';
  end if;
end
$migration$;

commit;

-- OPTIONAL hardening, run SEPARATELY only after a test signup works:
-- revoke all on function public.handle_new_user() from public, anon, authenticated;
