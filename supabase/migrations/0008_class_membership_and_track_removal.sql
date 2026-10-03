-- 0008: Class membership, function-only access, and the retirement of lesson tracks.
--
-- Apply after 0007, manually, in the Supabase SQL Editor (never via `supabase db push`).
-- Safe to re-run: the column drop is guarded by `if exists`, every function is CREATE OR
-- REPLACE, every policy is dropped before recreation, and every grant is restated
-- explicitly because CREATE OR REPLACE FUNCTION does not reset existing grants.
--
-- Before applying, run and record the census this migration invalidates:
--   select track, count(*) from lessons group by track;
-- A non-zero count means the Foundations/Going-Deeper split carries real data and the
-- drop below destroys it.
--
-- Apply this file in the same window as the matching app change. The app half removes
-- track from LessonInput/Lesson and from components/classes-view.tsx; deploying the
-- migration ahead of that code sends every lesson into neither tab and empties /classes.

-- 1) Retire track ---------------------------------------------------------------
-- 0001 defined track as `text not null check (track in ('foundations','deeper'))`.
-- Dropping the column drops lessons_track_check with it. No index and no policy
-- references track, so nothing else needs unwinding.
alter table public.lessons drop column if exists track;

-- 2) Class membership -----------------------------------------------------------
-- A joint table between profiles and classes. It carries organization_id so every
-- read path can scope by org without a join, and no default: the functions below
-- always set it from current_organization_id() explicitly.
create table if not exists public.class_memberships (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  class_id text not null references public.classes(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (profile_id, class_id)
);
alter table public.class_memberships enable row level security;

-- The primary key already serves profile_id lookups; class_id and organization_id
-- are the other two access paths (get_class_members, and the policy probe below).
create index if not exists class_memberships_class_id_idx        on public.class_memberships(class_id);
create index if not exists class_memberships_organization_id_idx on public.class_memberships(organization_id);

-- 3) Functions ------------------------------------------------------------------
-- is_member_of_class() is the reason lessons_member_read below takes a function call
-- rather than an inline `exists (select 1 from class_memberships ...)`.
--
-- A subquery written inside a policy expression runs with the INVOKING user's
-- privileges and RLS. class_memberships has RLS enabled with no policies and no grants,
-- so an inline subquery would either raise `permission denied for table
-- class_memberships` on every lesson read, or -- with Supabase's default grants left
-- in place -- be default-denied to zero rows and silently hide every lesson. This is
-- the same hazard 0006 documents for profiles, and the same reason is_class_leader_for()
-- exists as a SECURITY DEFINER twin rather than an inline join.

create or replace function public.is_member_of_class(target_class_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(exists (
    select 1
    from public.class_memberships cm
    where cm.profile_id = (select auth.uid())
      and cm.class_id = target_class_id
  ), false)
$$;

-- Write path: an admin, or the leader of that specific class. is_class_leader_for()
-- is itself admin-inclusive and already requires the class to exist in the caller's
-- org, so a foreign class id fails the guard outright. The target PROFILE's org is
-- checked separately below, copying assign_user_role (0006) verbatim.
create or replace function public.assign_class_membership(target_user_id uuid, target_class_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_org uuid;
  target_org uuid;
begin
  if not (public.is_admin() or public.is_class_leader_for(target_class_id)) then
    raise exception 'forbidden';
  end if;

  caller_org := public.current_organization_id();
  if caller_org is null then
    raise exception 'forbidden';
  end if;

  if not exists (
    select 1 from public.classes where id = target_class_id and organization_id = caller_org
  ) then
    raise exception 'class not found';
  end if;

  select organization_id into target_org from public.profiles where id = target_user_id;
  if target_org is null or target_org <> caller_org then
    raise exception 'forbidden';
  end if;

  insert into public.class_memberships (profile_id, class_id, organization_id, created_by)
  values (target_user_id, target_class_id, caller_org, (select auth.uid()))
  on conflict (profile_id, class_id) do nothing;
end;
$$;

create or replace function public.remove_class_membership(target_user_id uuid, target_class_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_org uuid;
  target_org uuid;
begin
  if not (public.is_admin() or public.is_class_leader_for(target_class_id)) then
    raise exception 'forbidden';
  end if;

  caller_org := public.current_organization_id();
  if caller_org is null then
    raise exception 'forbidden';
  end if;

  if not exists (
    select 1 from public.classes where id = target_class_id and organization_id = caller_org
  ) then
    raise exception 'class not found';
  end if;

  -- Reject a foreign target explicitly rather than silently deleting nothing.
  select organization_id into target_org from public.profiles where id = target_user_id;
  if target_org is null or target_org <> caller_org then
    raise exception 'forbidden';
  end if;

  delete from public.class_memberships
  where profile_id = target_user_id
    and class_id = target_class_id
    and organization_id = caller_org;
end;
$$;

-- Read: the caller's own memberships, joined to the class names.
create or replace function public.get_my_classes()
returns table (id text, name text)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name
  from public.class_memberships cm
  join public.classes c on c.id = cm.class_id
  where (select auth.uid()) is not null
    and cm.profile_id = (select auth.uid())
    and cm.organization_id = public.current_organization_id()
  order by c.name
$$;

-- Read: roster of one class, admin or that class's leader only. Mirrors
-- admin_list_members()'s plpgsql guard shape but returns a lean display row.
create or replace function public.get_class_members(target_class_id text)
returns table (id uuid, name text, initials text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or public.is_class_leader_for(target_class_id)) then
    raise exception 'forbidden';
  end if;

  return query
    select p.id, p.name, p.initials
    from public.class_memberships cm
    join public.profiles p on p.id = cm.profile_id
    where cm.class_id = target_class_id
      and cm.organization_id = public.current_organization_id()
    order by p.name;
end;
$$;

-- Read: who leads what, for the caller's org. Mirrors member_display()'s exact guard
-- shape -- profiles is self+admin-read by design, so this never reads it directly.
create or replace function public.get_class_leaders()
returns table (class_id text, leader_id uuid, leader_name text, leader_initials text)
language sql
stable
security definer
set search_path = public
as $$
  select p.assigned_class_id, p.id, p.name, p.initials
  from public.profiles p
  where (select auth.uid()) is not null
    and p.organization_id = public.current_organization_id()
    and p.role = 'class_leader'
    and p.assigned_class_id is not null
$$;

-- Name every role explicitly: `from public` alone does not strip a privilege already
-- granted to a named role, and CREATE OR REPLACE FUNCTION does not reset grants.
revoke all on function public.is_member_of_class(text) from public, anon, authenticated;
grant execute on function public.is_member_of_class(text) to authenticated;

revoke all on function public.assign_class_membership(uuid, text) from public, anon, authenticated;
grant execute on function public.assign_class_membership(uuid, text) to authenticated;

revoke all on function public.remove_class_membership(uuid, text) from public, anon, authenticated;
grant execute on function public.remove_class_membership(uuid, text) to authenticated;

revoke all on function public.get_my_classes() from public, anon, authenticated;
grant execute on function public.get_my_classes() to authenticated;

revoke all on function public.get_class_members(text) from public, anon, authenticated;
grant execute on function public.get_class_members(text) to authenticated;

revoke all on function public.get_class_leaders() from public, anon, authenticated;
grant execute on function public.get_class_leaders() to authenticated;

-- New tables never saw 0001's blanket revoke, and Supabase defaults grant ALL on newly
-- created tables to anon/authenticated. class_memberships is reachable ONLY through the
-- SECURITY DEFINER functions above -- exactly like org_invite_codes in 0006.
revoke all on public.class_memberships from public, anon, authenticated;

-- 4) Policies -------------------------------------------------------------------
-- classes_leader_read and lessons_leader_read are deliberately untouched: an admin or
-- the class's own leader must still reach a lesson without a membership row.

drop policy if exists lessons_member_read on public.lessons;
create policy lessons_member_read on public.lessons
  for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and status = 'published'
    and public.is_member_of_class(class_id)
  );
