-- 0003: Ensure the auth.users -> public.profiles trigger exists/enabled and
-- backfill profile rows for auth.users that predate the trigger.
-- Idempotent: safe on a fresh DB (after 0001, 0002) and on the live DB.
-- The backfill is safe by construction: every candidate username is
-- pre-validated in a CTE (format check + existing-collision + intra-batch
-- duplicate via row_number), so the final insert cannot raise a constraint.

-- 1) Ensure the trigger exists and is enabled on auth.users.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created after insert on auth.users
    for each row execute procedure public.handle_new_user();
  else
    alter table auth.users enable trigger on_auth_user_created;
  end if;
end
$$;

-- 2) Backfill orphaned auth.users rows.
-- Derivation mirrors handle_new_user() in 0002_username_auth.sql for
-- name/initials/username. Username is kept only when it passes the
-- profiles_username_format_check regex, is not already taken in profiles,
-- and is the first occurrence of a duplicate within this same batch;
-- otherwise it is inserted as NULL so the batch never hard-fails.
with orphaned as (
  select u.id, u.raw_user_meta_data
  from auth.users u
  left join public.profiles p on p.id = u.id
  where p.id is null
),
derived as (
  select
    o.id,
    coalesce(o.raw_user_meta_data ->> 'name', '') as name,
    nullif(trim(lower(coalesce(o.raw_user_meta_data ->> 'username', ''))), '') as username
  from orphaned o
),
usable as (
  select
    d.id,
    d.name,
    d.username,
    case
      when d.username is null then null
      when d.username !~ '^[a-z][a-z0-9_]{2,19}$' then null
      when exists (
        select 1 from public.profiles p where p.username = d.username
      ) then null
      else d.username
    end as kept_username
  from derived d
),
first_occurrence as (
  select
    u.id,
    u.name,
    u.kept_username,
    row_number() over (partition by u.kept_username order by u.id) as rn
  from usable u
  where u.kept_username is not null
)
insert into public.profiles (id, name, initials, username)
select
  d.id,
  d.name,
  upper(left(regexp_replace(d.name, '[^A-Za-z]', '', 'g'), 2)),
  f.kept_username
from derived d
left join first_occurrence f on f.id = d.id and f.rn = 1
order by d.id
on conflict (id) do nothing;
