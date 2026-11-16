-- 0011_signup_initials.sql
-- Apply manually in the Supabase SQL Editor after 0010.
-- Only change vs 0006 is the two initials expressions.
begin;

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
        public.initials_from_name(new_name),
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
        public.initials_from_name(new_name),
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

commit;

-- OPTIONAL: execute separately only if explicitly choosing ACL hardening.
-- Trigger-function EXECUTE is checked at trigger creation, not on each firing;
-- this existing trigger should still work. Verify catalog ACL and both real
-- browser signup paths after revoking. Do not recreate the auth trigger.
-- revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- Re-grant only to restore the previous ACL if optional hardening was applied:
-- grant execute on function public.handle_new_user() to public, anon, authenticated;

/* ROLLBACK ONLY — never run with the forward migration.

begin;

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

commit;

END ROLLBACK ONLY */
