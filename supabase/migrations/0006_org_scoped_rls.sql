-- 0006: Org-scoped RLS, org-aware helpers, and the invite-code RPCs.
--
-- Apply immediately after 0005, manually, in the Supabase SQL Editor.
-- Every policy is dropped before recreation and every function is CREATE OR
-- REPLACE, so the file can be re-applied safely. Grants are re-stated
-- explicitly because CREATE OR REPLACE FUNCTION does not reset them and 0001's
-- blanket table revoke predates the two new tables.

-- 1) The single source of the caller's organization ----------------------------
create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = (select auth.uid())
$$;

revoke all on function public.current_organization_id() from public, anon, authenticated;
grant execute on function public.current_organization_id() to authenticated, service_role;

-- Default the six content-table org columns from the helper, now that it exists.
-- Server Actions never pass organization_id; the default fills it per row as the
-- inserting user, and the RLS WITH CHECK below still agrees. profiles.organization_id
-- deliberately has no default -- it is owned by handle_new_user().
alter table public.classes            alter column organization_id set default public.current_organization_id();
alter table public.lessons            alter column organization_id set default public.current_organization_id();
alter table public.sermons            alter column organization_id set default public.current_organization_id();
alter table public.prayer_points      alter column organization_id set default public.current_organization_id();
alter table public.discussion_topics  alter column organization_id set default public.current_organization_id();
alter table public.discussions        alter column organization_id set default public.current_organization_id();

-- 2) Profile creation: founding org admin, or invite-code member ---------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  new_username text;
  new_name text;
  org_name text;
  invite text;
  new_org_id uuid;
  base_slug text;
  candidate text;
  attempts integer := 0;
begin
  new_username := nullif(trim(lower(coalesce(new.raw_user_meta_data ->> 'username', ''))), '');
  new_name := coalesce(new.raw_user_meta_data ->> 'name', '');
  org_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'founding_org_name', '')), '');
  invite := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));

  begin
    if org_name is not null then
      base_slug := trim(both '-' from regexp_replace(lower(org_name), '[^a-z0-9]+', '-', 'g'));
      if base_slug = '' then
        base_slug := 'church';
      end if;

      candidate := left(base_slug, 60);
      loop
        new_org_id := null;
        insert into public.organizations (name, slug)
        values (org_name, candidate)
        on conflict (slug) do nothing
        returning id into new_org_id;

        exit when new_org_id is not null;

        attempts := attempts + 1;
        if attempts > 5 then
          raise exception 'could not create organization';
        end if;
        candidate := left(base_slug, 53) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
      end loop;

      insert into public.profiles (id, name, initials, username, role, organization_id)
      values (
        new.id,
        new_name,
        upper(left(regexp_replace(new_name, '[^A-Za-z]', '', 'g'), 2)),
        new_username,
        'admin',
        new_org_id
      );
    elsif invite <> '' then
      select c.organization_id into new_org_id
      from public.org_invite_codes c
      where c.code = invite;

      if new_org_id is null then
        raise exception 'invalid invite code';
      end if;

      insert into public.profiles (id, name, initials, username, role, organization_id)
      values (
        new.id,
        new_name,
        upper(left(regexp_replace(new_name, '[^A-Za-z]', '', 'g'), 2)),
        new_username,
        'member',
        new_org_id
      );
    else
      raise exception 'organization required';
    end if;
  exception when unique_violation then
    -- Only the username insert can raise this: slug collisions are handled with
    -- ON CONFLICT above, so it cannot be mistaken for a username error.
    raise exception 'username already taken';
  end;

  return new;
end;
$function$;

-- 3) Org-aware security-definer helpers ----------------------------------------
create or replace function public.is_class_leader_for(target_class_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(exists (
    select 1
    from public.profiles p
    join public.classes c on c.id = target_class_id
    where p.id = (select auth.uid())
      and c.organization_id = p.organization_id
      and (p.role = 'admin' or (p.role = 'class_leader' and p.assigned_class_id = target_class_id))
  ), false)
$$;

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
    where p.organization_id = public.current_organization_id()
    order by p.name, u.email;
end;
$$;

create or replace function public.assign_user_role(target_user_id uuid, new_role public.app_role, new_class_id text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_org uuid;
  target_org uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if new_role = 'class_leader' and new_class_id is null then raise exception 'class leader requires a class'; end if;
  if new_role <> 'class_leader' and new_class_id is not null then raise exception 'only class leaders may have an assigned class'; end if;

  caller_org := public.current_organization_id();

  select organization_id into target_org from public.profiles where id = target_user_id;
  if target_org is null or target_org <> caller_org then
    raise exception 'forbidden';
  end if;

  if new_class_id is not null and not exists (
    select 1 from public.classes where id = new_class_id and organization_id = caller_org
  ) then
    raise exception 'class not found';
  end if;

  update public.profiles
  set role = new_role, assigned_class_id = new_class_id, updated_at = now()
  where id = target_user_id;
end;
$$;

create or replace function public.member_display(member_ids uuid[])
returns table (id uuid, name text, initials text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.initials
  from public.profiles p
  where (select auth.uid()) is not null
    and p.organization_id = public.current_organization_id()
    and p.id = any(member_ids)
$$;

-- 4) Invite-code RPCs ----------------------------------------------------------
create or replace function public.create_org_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_code text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  v_org := public.current_organization_id();
  if v_org is null then
    raise exception 'forbidden';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.org_invite_codes (organization_id, code, created_by)
  values (v_org, v_code, (select auth.uid()))
  on conflict (organization_id) do update
    set code = excluded.code,
        created_by = excluded.created_by,
        created_at = now();

  return v_code;
end;
$$;

revoke all on function public.create_org_invite_code() from public, anon, authenticated;
grant execute on function public.create_org_invite_code() to authenticated;

create or replace function public.org_invite_code_valid(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_invite_codes
    where code = upper(trim(coalesce(p_code, '')))
  )
$$;

revoke all on function public.org_invite_code_valid(text) from public, anon, authenticated;
grant execute on function public.org_invite_code_valid(text) to anon, authenticated, service_role;

-- 5) Policies ------------------------------------------------------------------
-- Every policy below is dropped first so this file is safe to re-run.

-- organizations: members may read only their own org.
drop policy if exists organizations_member_read on public.organizations;
create policy organizations_member_read on public.organizations
  for select to authenticated
  using (id = public.current_organization_id());

-- classes
drop policy if exists classes_public_read on public.classes;
drop policy if exists classes_admin_write on public.classes;
create policy classes_member_read on public.classes
  for select to authenticated
  using (organization_id = public.current_organization_id() and (active or public.is_admin()));
create policy classes_admin_write on public.classes
  for all to authenticated
  using (public.is_admin() and organization_id = public.current_organization_id())
  with check (public.is_admin() and organization_id = public.current_organization_id());

-- profiles: self, or an admin of the same org.
-- is_admin()/current_organization_id() are SECURITY DEFINER, so these never
-- recurse into the profiles policies they belong to.
drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (public.is_admin() and organization_id = public.current_organization_id()));
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (public.is_admin() and organization_id = public.current_organization_id())
  with check (public.is_admin() and organization_id = public.current_organization_id());

-- lessons
drop policy if exists lessons_public_read on public.lessons;
drop policy if exists lessons_leader_read on public.lessons;
drop policy if exists lessons_leader_insert on public.lessons;
drop policy if exists lessons_leader_update on public.lessons;
drop policy if exists lessons_leader_delete on public.lessons;
create policy lessons_member_read on public.lessons
  for select to authenticated
  using (organization_id = public.current_organization_id() and status = 'published');
create policy lessons_leader_read on public.lessons
  for select to authenticated
  using (organization_id = public.current_organization_id() and public.is_class_leader_for(class_id));
create policy lessons_leader_insert on public.lessons
  for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and public.is_class_leader_for(class_id)
    and created_by = (select auth.uid())
  );
create policy lessons_leader_update on public.lessons
  for update to authenticated
  using (organization_id = public.current_organization_id() and public.is_class_leader_for(class_id))
  with check (organization_id = public.current_organization_id() and public.is_class_leader_for(class_id));
create policy lessons_leader_delete on public.lessons
  for delete to authenticated
  using (organization_id = public.current_organization_id() and public.is_class_leader_for(class_id));

-- questions: org matches through the parent lesson.
drop policy if exists questions_public_read on public.questions;
drop policy if exists questions_leader_write on public.questions;
create policy questions_member_read on public.questions
  for select to authenticated
  using (exists (
    select 1 from public.lessons l
    where l.id = lesson_id
      and l.status = 'published'
      and l.organization_id = public.current_organization_id()
  ));
create policy questions_leader_write on public.questions
  for all to authenticated
  using (exists (
    select 1 from public.lessons l
    where l.id = lesson_id
      and l.organization_id = public.current_organization_id()
      and (public.is_admin() or public.is_class_leader_for(l.class_id))
  ))
  with check (exists (
    select 1 from public.lessons l
    where l.id = lesson_id
      and l.organization_id = public.current_organization_id()
      and (public.is_admin() or public.is_class_leader_for(l.class_id))
  ));

-- insights: org matches through the parent lesson.
drop policy if exists insights_member_read on public.insights;
drop policy if exists insights_own_insert on public.insights;
drop policy if exists insights_own_update on public.insights;
drop policy if exists insights_own_delete on public.insights;
create policy insights_member_read on public.insights
  for select to authenticated
  using (exists (
    select 1 from public.lessons l
    where l.id = lesson_id and l.organization_id = public.current_organization_id()
  ));
create policy insights_own_insert on public.insights
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.lessons l
      where l.id = lesson_id
        and l.status = 'published'
        and l.organization_id = public.current_organization_id()
    )
  );
create policy insights_own_update on public.insights
  for update to authenticated
  using (
    (author_id = (select auth.uid()) or public.is_admin())
    and exists (select 1 from public.lessons l where l.id = lesson_id and l.organization_id = public.current_organization_id())
  )
  with check (
    (author_id = (select auth.uid()) or public.is_admin())
    and exists (select 1 from public.lessons l where l.id = lesson_id and l.organization_id = public.current_organization_id())
  );
create policy insights_own_delete on public.insights
  for delete to authenticated
  using (
    (author_id = (select auth.uid()) or public.is_admin())
    and exists (select 1 from public.lessons l where l.id = lesson_id and l.organization_id = public.current_organization_id())
  );

-- sermons
drop policy if exists sermons_public_read on public.sermons;
drop policy if exists sermons_admin_write on public.sermons;
create policy sermons_member_read on public.sermons
  for select to authenticated
  using (organization_id = public.current_organization_id() and status = 'published');
create policy sermons_admin_write on public.sermons
  for all to authenticated
  using (public.is_admin() and organization_id = public.current_organization_id())
  with check (public.is_admin() and organization_id = public.current_organization_id());

-- prayer_points
drop policy if exists prayers_member_read on public.prayer_points;
drop policy if exists prayers_member_draft_insert on public.prayer_points;
drop policy if exists prayers_member_draft_update on public.prayer_points;
drop policy if exists prayers_member_draft_delete on public.prayer_points;
drop policy if exists prayers_admin_write on public.prayer_points;
create policy prayers_member_read on public.prayer_points
  for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and (status = 'published' or author_id = (select auth.uid()) or public.is_admin())
  );
create policy prayers_member_draft_insert on public.prayer_points
  for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and author_id = (select auth.uid())
    and status = 'draft'
  );
create policy prayers_member_draft_update on public.prayer_points
  for update to authenticated
  using (
    organization_id = public.current_organization_id()
    and author_id = (select auth.uid())
    and status = 'draft'
  )
  with check (
    organization_id = public.current_organization_id()
    and author_id = (select auth.uid())
    and status = 'draft'
  );
create policy prayers_member_draft_delete on public.prayer_points
  for delete to authenticated
  using (
    organization_id = public.current_organization_id()
    and author_id = (select auth.uid())
    and status = 'draft'
  );
create policy prayers_admin_write on public.prayer_points
  for all to authenticated
  using (public.is_admin() and organization_id = public.current_organization_id())
  with check (public.is_admin() and organization_id = public.current_organization_id());

-- prayer_confirmations: org matches through the parent prayer point.
drop policy if exists confirmations_member_read on public.prayer_confirmations;
drop policy if exists confirmations_own_insert on public.prayer_confirmations;
drop policy if exists confirmations_own_delete on public.prayer_confirmations;
create policy confirmations_member_read on public.prayer_confirmations
  for select to authenticated
  using (exists (
    select 1 from public.prayer_points p
    where p.id = prayer_point_id and p.organization_id = public.current_organization_id()
  ));
create policy confirmations_own_insert on public.prayer_confirmations
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.prayer_points p
      where p.id = prayer_point_id
        and p.status = 'published'
        and p.organization_id = public.current_organization_id()
    )
  );
create policy confirmations_own_delete on public.prayer_confirmations
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.prayer_points p
      where p.id = prayer_point_id and p.organization_id = public.current_organization_id()
    )
  );

-- discussion_topics
drop policy if exists topics_member_read on public.discussion_topics;
drop policy if exists topics_admin_write on public.discussion_topics;
create policy topics_member_read on public.discussion_topics
  for select to authenticated
  using (
    organization_id = public.current_organization_id()
    and (status = 'published' or public.is_admin())
  );
create policy topics_admin_write on public.discussion_topics
  for all to authenticated
  using (public.is_admin() and organization_id = public.current_organization_id())
  with check (
    public.is_admin()
    and organization_id = public.current_organization_id()
    and (lesson_id is null or exists (
      select 1 from public.lessons l
      where l.id = lesson_id and l.organization_id = public.current_organization_id()
    ))
    and (sermon_id is null or exists (
      select 1 from public.sermons s
      where s.id = sermon_id and s.organization_id = public.current_organization_id()
    ))
  );

-- discussions
drop policy if exists discussions_member_read on public.discussions;
drop policy if exists discussions_own_insert on public.discussions;
drop policy if exists discussions_own_update on public.discussions;
drop policy if exists discussions_own_delete on public.discussions;
create policy discussions_member_read on public.discussions
  for select to authenticated
  using (organization_id = public.current_organization_id());
create policy discussions_own_insert on public.discussions
  for insert to authenticated
  with check (
    organization_id = public.current_organization_id()
    and author_id = (select auth.uid())
    and (topic_id is null or exists (
      select 1 from public.discussion_topics t
      where t.id = topic_id and t.organization_id = public.current_organization_id()
    ))
  );
create policy discussions_own_update on public.discussions
  for update to authenticated
  using (
    (author_id = (select auth.uid()) or public.is_admin())
    and organization_id = public.current_organization_id()
  )
  with check (
    (author_id = (select auth.uid()) or public.is_admin())
    and organization_id = public.current_organization_id()
  );
create policy discussions_own_delete on public.discussions
  for delete to authenticated
  using (
    (author_id = (select auth.uid()) or public.is_admin())
    and organization_id = public.current_organization_id()
  );

-- discussion_replies: org matches through the parent discussion.
drop policy if exists replies_member_read on public.discussion_replies;
drop policy if exists replies_own_insert on public.discussion_replies;
drop policy if exists replies_own_update on public.discussion_replies;
drop policy if exists replies_own_delete on public.discussion_replies;
create policy replies_member_read on public.discussion_replies
  for select to authenticated
  using (exists (
    select 1 from public.discussions d
    where d.id = discussion_id and d.organization_id = public.current_organization_id()
  ));
create policy replies_own_insert on public.discussion_replies
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.discussions d
      where d.id = discussion_id and d.organization_id = public.current_organization_id()
    )
  );
create policy replies_own_update on public.discussion_replies
  for update to authenticated
  using (
    (author_id = (select auth.uid()) or public.is_admin())
    and exists (select 1 from public.discussions d where d.id = discussion_id and d.organization_id = public.current_organization_id())
  )
  with check (
    (author_id = (select auth.uid()) or public.is_admin())
    and exists (select 1 from public.discussions d where d.id = discussion_id and d.organization_id = public.current_organization_id())
  );
create policy replies_own_delete on public.discussion_replies
  for delete to authenticated
  using (
    (author_id = (select auth.uid()) or public.is_admin())
    and exists (select 1 from public.discussions d where d.id = discussion_id and d.organization_id = public.current_organization_id())
  );

-- 6) Grants --------------------------------------------------------------------
-- New tables never saw 0001's blanket revoke, and Supabase schema defaults grant
-- ALL on newly created tables to anon/authenticated. Name every role explicitly.
revoke all on public.organizations, public.org_invite_codes from public, anon, authenticated;
grant select on public.organizations to authenticated;
-- org_invite_codes gets no anon/authenticated access; it is reachable only through
-- create_org_invite_code() and org_invite_code_valid(), both SECURITY DEFINER.

-- Anonymous content access is removed entirely.
revoke all on public.classes, public.lessons, public.questions, public.insights,
  public.sermons, public.prayer_points, public.prayer_confirmations,
  public.discussion_topics, public.discussions, public.discussion_replies
  from public, anon;
grant select, insert, update, delete on public.classes, public.lessons, public.questions,
  public.insights, public.sermons, public.prayer_points, public.prayer_confirmations,
  public.discussion_topics, public.discussions, public.discussion_replies
  to authenticated;
