-- 0009: Class-candidate reads and a class leader's own class.
--
-- Apply after 0008, manually, in the Supabase SQL Editor (never via `supabase db push`).
-- Safe to re-run: both functions are CREATE OR REPLACE and every grant is restated
-- explicitly because CREATE OR REPLACE FUNCTION does not reset existing grants.
--
-- Apply this file in the same window as the matching app change. The app half adds
-- /classes/manage, which calls get_my_led_class(); deploying that page ahead of this
-- migration leaves the route erroring for every class leader.

-- get_class_candidates() exists because admin_list_members() is is_admin()-gated and
-- would reject a class_leader caller outright, leaving the leader page with no way to
-- compute who is not yet in their class. Same guard shape as get_class_members() (0008),
-- and the same lean (id, name, initials) display row -- profiles itself is self+admin-read
-- by design, so this must never be a direct select against it.
create or replace function public.get_class_candidates(target_class_id text)
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
    from public.profiles p
    where p.organization_id = public.current_organization_id()
      and not exists (
        select 1 from public.class_memberships cm
        where cm.profile_id = p.id and cm.class_id = target_class_id
      )
    order by p.name;
end;
$$;

-- Read: the class the caller leads, including when it is inactive.
--
-- classes_member_read (0006) is `organization_id = current_organization_id() and
-- (active or is_admin())`. There is no leader-specific classes policy, so a leader
-- cannot select their own row through the table at all once it is deactivated -- and
-- "your class was deactivated" is exactly the state /classes/manage has to be able to
-- report, by name. SECURITY DEFINER is the only way to see it.
--
-- Deliberately NOT admin-inclusive: this answers "the class I lead", matching the
-- strict class_leader gate on the page that calls it. Every column is qualified
-- (c.active) to avoid the OUT-parameter/column shadowing hazard.
create or replace function public.get_my_led_class()
returns table (id text, name text, description text, active boolean)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.description, c.active
  from public.profiles p
  join public.classes c on c.id = p.assigned_class_id
  where (select auth.uid()) is not null
    and p.id = (select auth.uid())
    and p.role = 'class_leader'
    and c.organization_id = public.current_organization_id()
$$;

-- Name every role explicitly: `from public` alone does not strip a privilege already
-- granted to a named role, and CREATE OR REPLACE FUNCTION does not reset grants.
revoke all on function public.get_class_candidates(text) from public, anon, authenticated;
grant execute on function public.get_class_candidates(text) to authenticated;

revoke all on function public.get_my_led_class() from public, anon, authenticated;
grant execute on function public.get_my_led_class() to authenticated;
