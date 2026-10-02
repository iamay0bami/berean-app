-- 0007: Admin read path for the caller's organization invite code.
--
-- Apply after 0006, manually, in the Supabase SQL Editor.
-- org_invite_codes is deliberately unreadable by anon/authenticated (0006 section 6),
-- so this SECURITY DEFINER function is the only way to read a code back. CREATE OR
-- REPLACE plus an explicit restated grant keeps the file safe to re-run.

create or replace function public.get_org_invite_code()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select c.code into v_code
  from public.org_invite_codes c
  where c.organization_id = public.current_organization_id();

  return v_code;
end;
$$;

-- Name every role explicitly: `from public` alone does not strip a privilege already
-- granted to a named role, and CREATE OR REPLACE FUNCTION does not reset grants.
revoke all on function public.get_org_invite_code() from public, anon, authenticated;
grant execute on function public.get_org_invite_code() to authenticated;
