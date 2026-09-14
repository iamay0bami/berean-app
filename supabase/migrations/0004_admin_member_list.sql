-- 0004: Admin-only member listing for the role-management screen.

create or replace function public.admin_list_members()
returns table (
  id uuid,
  email text,
  name text,
  username text,
  role public.app_role,
  assigned_class_id text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return query
    select p.id, u.email::text, p.name, p.username, p.role, p.assigned_class_id
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.name, u.email;
end;
$$;

revoke all on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;
