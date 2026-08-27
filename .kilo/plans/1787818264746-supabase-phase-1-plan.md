# Phase 1 Supabase Backend Plan

## Decisions and Scope

1. Rename the environment contract first:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   Update `.env.example`, `.env.local`, `lib/supabase/client.ts`, and `lib/supabase/server.ts`. Read the existing `.env.local` values only for key renaming; never print, log, commit, or import the secret key into client code.
2. Use email/password authentication. It is the smallest App Router flow: sign-up and sign-in are direct Supabase calls, while a callback route handles email confirmation if the project has confirmations enabled. No phone/SMS provider or configuration.
3. Published lessons and sermons are publicly readable. Prayer points, profiles, featured discussion topics, discussions, replies, and insights require an authenticated user. Every write requires authentication and is also enforced by RLS.
4. Add `discussion_topics` because the requested model needs an admin-curated featured prompt separately from member-owned `discussions` and `discussion_replies`.
5. Use text IDs for content entities so existing route IDs remain valid (`a-faith-that-listens`, etc.). Use UUIDs for auth-owned records and foreign keys.
6. Keep the existing exported read signatures exactly: `getLessons()`, `getLesson(id)`, `getSermons()`, `getSermon(id)`, `getPrayerPoints()`, `getDiscussionData()`, `getProfile()`, and `getHomeData()`. Add new create/edit/publish/delete/tap functions without changing those signatures.
7. Do not store image bytes or other large binary content in any Postgres table. Phase 1 adds no image columns. If a content type gains image support later, store the object in Supabase Storage (or use an approved external URL) and persist only its bucket/object path or URL reference in Postgres.

## SQL Migration

Create `supabase/migrations/0001_initial_schema.sql`. Run this as one migration after enabling the standard `pgcrypto` extension. Every created table must have its own explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statement.

```sql
create extension if not exists pgcrypto;

create type public.app_role as enum ('member', 'class_leader', 'admin');
create type public.lesson_status as enum ('draft', 'published');
create type public.content_status as enum ('draft', 'published');

create table public.classes (
  id text primary key,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.classes enable row level security;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  initials text not null default '',
  tagline text not null default '',
  member_since date not null default current_date,
  role public.app_role not null default 'member',
  assigned_class_id text references public.classes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.lessons (
  id text primary key,
  class_id text not null references public.classes(id) on delete restrict,
  week text not null,
  number text not null,
  title text not null,
  excerpt text not null default '',
  duration text not null default '',
  progress integer not null default 0 check (progress between 0 and 100),
  track text not null check (track in ('foundations', 'deeper')),
  section_label text not null default '',
  quote text not null default '',
  reference text not null default '',
  paragraphs text[] not null default '{}',
  margin_note text not null default '',
  status public.lesson_status not null default 'draft',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lessons enable row level security;

create table public.questions (
  id text primary key,
  lesson_id text not null references public.lessons(id) on delete cascade,
  text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.questions enable row level security;

create table public.insights (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null references public.lessons(id) on delete cascade,
  question_id text references public.questions(id) on delete set null,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(trim(text)) > 0),
  hearts integer not null default 0 check (hearts >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.insights enable row level security;

create table public.sermons (
  id text primary key,
  date date not null,
  detail_date text not null default '',
  title text not null,
  speaker text not null,
  text text not null,
  tag text not null default '',
  paragraphs text[] not null default '{}',
  margin_note text not null default '',
  closing text not null default '',
  status public.content_status not null default 'draft',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sermons enable row level security;

create table public.prayer_points (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(trim(text)) > 0),
  status public.content_status not null default 'draft',
  hearts integer not null default 0 check (hearts >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.prayer_points enable row level security;

create table public.prayer_confirmations (
  prayer_point_id uuid not null references public.prayer_points(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prayer_point_id, user_id)
);
alter table public.prayer_confirmations enable row level security;

create table public.discussion_topics (
  id uuid primary key default gen_random_uuid(),
  prompt text not null check (char_length(trim(prompt)) > 0),
  lesson_id text references public.lessons(id) on delete set null,
  sermon_id text references public.sermons(id) on delete set null,
  status public.content_status not null default 'draft',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not (lesson_id is not null and sermon_id is not null))
);
alter table public.discussion_topics enable row level security;

create table public.discussions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.discussion_topics(id) on delete set null,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(trim(text)) > 0),
  hearts integer not null default 0 check (hearts >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.discussions enable row level security;

create table public.discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(trim(text)) > 0),
  hearts integer not null default 0 check (hearts >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.discussion_replies enable row level security;

create index lessons_class_status_idx on public.lessons(class_id, status);
create index questions_lesson_sort_idx on public.questions(lesson_id, sort_order);
create index insights_lesson_created_idx on public.insights(lesson_id, created_at desc);
create index prayer_points_status_created_idx on public.prayer_points(status, created_at desc);
create index discussions_created_idx on public.discussions(created_at desc);
create index discussion_replies_discussion_created_idx on public.discussion_replies(discussion_id, created_at);

create or replace function public.is_authenticated()
returns boolean language sql stable as $$
  select (select auth.uid()) is not null
$$;

create or replace function public.current_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'admin', false)
$$;

create or replace function public.is_class_leader_for(target_class_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    public.current_role() in ('class_leader', 'admin')
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and (role = 'admin' or assigned_class_id = target_class_id)
    ), false
  )
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    upper(left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'name', ''), '[^A-Za-z]', '', 'g'), 2))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.protect_owned_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.author_id <> old.author_id then
    raise exception 'author_id is immutable';
  end if;
  return new;
end;
$$;

create trigger insights_protect_owner before update on public.insights for each row execute procedure public.protect_owned_columns();
create trigger prayer_points_protect_owner before update on public.prayer_points for each row execute procedure public.protect_owned_columns();
create trigger discussions_protect_owner before update on public.discussions for each row execute procedure public.protect_owned_columns();
create trigger discussion_replies_protect_owner before update on public.discussion_replies for each row execute procedure public.protect_owned_columns();

create or replace function public.protect_created_by()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.created_by <> old.created_by then raise exception 'created_by is immutable'; end if;
  return new;
end;
$$;
create trigger lessons_protect_creator before update on public.lessons for each row execute procedure public.protect_created_by();
create trigger sermons_protect_creator before update on public.sermons for each row execute procedure public.protect_created_by();
create trigger discussion_topics_protect_creator before update on public.discussion_topics for each row execute procedure public.protect_created_by();

create or replace function public.member_display(member_ids uuid[])
returns table (id uuid, name text, initials text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.initials
  from public.profiles p
  where (select auth.uid()) is not null and p.id = any(member_ids)
$$;
revoke all on function public.member_display(uuid[]) from public;
grant execute on function public.member_display(uuid[]) to authenticated;

create or replace function public.update_my_profile(new_name text, new_initials text, new_tagline text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set name = new_name, initials = new_initials, tagline = new_tagline, updated_at = now()
  where id = (select auth.uid());
end;
$$;
revoke all on function public.update_my_profile(text, text, text) from public;
grant execute on function public.update_my_profile(text, text, text) to authenticated;

create or replace function public.assign_user_role(target_user_id uuid, new_role public.app_role, new_class_id text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if new_role = 'class_leader' and new_class_id is null then raise exception 'class leader requires a class'; end if;
  if new_role <> 'class_leader' and new_class_id is not null then raise exception 'only class leaders may have an assigned class'; end if;
  update public.profiles set role = new_role, assigned_class_id = new_class_id, updated_at = now() where id = target_user_id;
  if not found then raise exception 'profile not found'; end if;
end;
$$;
revoke all on function public.assign_user_role(uuid, public.app_role, text) from public;
grant execute on function public.assign_user_role(uuid, public.app_role, text) to authenticated;

-- Public published content.
create policy classes_public_read on public.classes for select using (active = true);
create policy classes_admin_read_all on public.classes for select to authenticated using (public.is_admin());
create policy classes_admin_insert on public.classes for insert to authenticated with check (public.is_admin());
create policy classes_admin_update on public.classes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy classes_admin_delete on public.classes for delete to authenticated using (public.is_admin());
create policy lessons_public_read on public.lessons for select using (status = 'published');
create policy lessons_member_read_own_class on public.lessons for select to authenticated using (
  public.is_admin() or (status = 'draft' and public.is_class_leader_for(class_id))
);
create policy questions_public_read on public.questions for select using (
  exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
);
create policy questions_member_read_draft on public.questions for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.lessons l where l.id = lesson_id and public.is_class_leader_for(l.class_id)
  )
);
create policy sermons_public_read on public.sermons for select using (status = 'published');
create policy sermons_admin_read_all on public.sermons for select to authenticated using (public.is_admin());

-- Profiles and private member content.
create policy profiles_self_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_admin_read on public.profiles for select to authenticated using (public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy lessons_class_leader_insert on public.lessons for insert to authenticated
  with check (public.is_class_leader_for(class_id) and created_by = (select auth.uid()));
create policy lessons_class_leader_update on public.lessons for update to authenticated
  using (public.is_class_leader_for(class_id) or public.is_admin())
  with check (public.is_class_leader_for(class_id) or public.is_admin());
create policy lessons_class_leader_delete on public.lessons for delete to authenticated
  using (public.is_admin() or public.is_class_leader_for(class_id));

create policy questions_class_leader_insert on public.questions for insert to authenticated with check (
  exists (select 1 from public.lessons l where l.id = lesson_id and public.is_class_leader_for(l.class_id))
);
create policy questions_class_leader_update on public.questions for update to authenticated using (
  exists (select 1 from public.lessons l where l.id = lesson_id and public.is_class_leader_for(l.class_id))
) with check (
  exists (select 1 from public.lessons l where l.id = lesson_id and public.is_class_leader_for(l.class_id))
);
create policy questions_class_leader_delete on public.questions for delete to authenticated using (
  public.is_admin() or exists (select 1 from public.lessons l where l.id = lesson_id and public.is_class_leader_for(l.class_id))
);

create policy insights_member_read on public.insights for select to authenticated using (public.is_authenticated());
create policy insights_own_insert on public.insights for insert to authenticated with check (
  author_id = (select auth.uid()) and exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
);
create policy insights_own_update on public.insights for update to authenticated using (author_id = (select auth.uid()) or public.is_admin()) with check (author_id = (select auth.uid()) or public.is_admin());
create policy insights_own_delete on public.insights for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());

create policy sermons_admin_insert on public.sermons for insert to authenticated with check (public.is_admin() and created_by = (select auth.uid()));
create policy sermons_admin_update on public.sermons for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy sermons_admin_delete on public.sermons for delete to authenticated using (public.is_admin());

create policy prayer_points_member_read on public.prayer_points for select to authenticated using (status = 'published' or author_id = (select auth.uid()) or public.is_admin());
create policy prayer_points_member_draft_insert on public.prayer_points for insert to authenticated with check (author_id = (select auth.uid()) and status = 'draft');
create policy prayer_points_member_update on public.prayer_points for update to authenticated using (author_id = (select auth.uid()) and status = 'draft') with check (author_id = (select auth.uid()) and status = 'draft');
create policy prayer_points_member_delete on public.prayer_points for delete to authenticated using (author_id = (select auth.uid()) and status = 'draft');
create policy prayer_points_admin_insert on public.prayer_points for insert to authenticated with check (public.is_admin() and author_id = (select auth.uid()));
create policy prayer_points_admin_update on public.prayer_points for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy prayer_points_admin_delete on public.prayer_points for delete to authenticated using (public.is_admin());

create policy prayer_confirmations_member_read on public.prayer_confirmations for select to authenticated using (public.is_authenticated());
create policy prayer_confirmations_own_insert on public.prayer_confirmations for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.prayer_points p where p.id = prayer_point_id and p.status = 'published')
);
create policy prayer_confirmations_own_delete on public.prayer_confirmations for delete to authenticated using (user_id = (select auth.uid()));

create policy discussion_topics_member_read on public.discussion_topics for select to authenticated using (status = 'published' or public.is_admin());
create policy discussion_topics_admin_insert on public.discussion_topics for insert to authenticated with check (public.is_admin() and created_by = (select auth.uid()));
create policy discussion_topics_admin_update on public.discussion_topics for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy discussion_topics_admin_delete on public.discussion_topics for delete to authenticated using (public.is_admin());

create policy discussions_member_read on public.discussions for select to authenticated using (public.is_authenticated());
create policy discussions_own_insert on public.discussions for insert to authenticated with check (author_id = (select auth.uid()));
create policy discussions_own_update on public.discussions for update to authenticated using (author_id = (select auth.uid()) or public.is_admin()) with check (author_id = (select auth.uid()) or public.is_admin());
create policy discussions_own_delete on public.discussions for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());

create policy discussion_replies_member_read on public.discussion_replies for select to authenticated using (public.is_authenticated());
create policy discussion_replies_own_insert on public.discussion_replies for insert to authenticated with check (
  author_id = (select auth.uid()) and exists (select 1 from public.discussions d where d.id = discussion_id)
);
create policy discussion_replies_own_update on public.discussion_replies for update to authenticated using (author_id = (select auth.uid()) or public.is_admin()) with check (author_id = (select auth.uid()) or public.is_admin());
create policy discussion_replies_own_delete on public.discussion_replies for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());

revoke all on public.classes, public.profiles, public.lessons, public.questions, public.insights,
  public.sermons, public.prayer_points, public.prayer_confirmations, public.discussion_topics,
  public.discussions, public.discussion_replies from anon, authenticated;
grant select on public.classes, public.lessons, public.questions, public.sermons to anon, authenticated;
grant select on public.profiles, public.insights, public.prayer_points, public.prayer_confirmations,
  public.discussion_topics, public.discussions, public.discussion_replies to authenticated;
grant insert, update, delete on public.classes, public.lessons, public.questions, public.insights,
  public.sermons, public.prayer_points, public.prayer_confirmations, public.discussion_topics,
  public.discussions, public.discussion_replies to authenticated;
```

Do not grant authenticated users direct `insert`, `update`, or `delete` on `profiles`; profile creation stays trigger-owned, display edits use `update_my_profile`, and role/class changes use `assign_user_role`. RLS remains the row-level boundary; grants are only the prerequisite API privileges.

## Promotion Seed and Initial Data

Create `supabase/seed.sql` only for non-sensitive public fixture content if needed. Do not put real user IDs, passwords, keys, or secret values in source control. After the trusted user signs up, the project owner runs the bootstrap statement in the Supabase SQL editor with its privileged database connection, substituting the user ID obtained from Authentication > Users. This intentionally bypasses the admin-only RPC because no admin exists yet. Subsequent promotions use the RPC:

```sql
update public.profiles
set role = 'admin', assigned_class_id = null, updated_at = now()
where id = 'AUTH-USER-UUID-HERE';

-- Or assign a class leader to one class:
select public.assign_user_role('AUTH-USER-UUID-HERE', 'class_leader', 'foundations');
```

The first admin promotion must be performed through the SQL editor/service-role administration channel because no admin exists initially. The browser client and regular server SSR client must never use `SUPABASE_SECRET_KEY`.

## Auth and Request Boundaries

1. Replace the existing `NEXT_PUBLIC_SUPABASE_ANON_KEY` references in both Supabase clients with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Add a separate server-only admin client only where a trusted administrative operation truly requires it, with `import 'server-only'` and `SUPABASE_SECRET_KEY`; ordinary reads/writes use the cookie-bound publishable-key client so RLS applies.
2. Add `proxy.ts` (the Next.js 16 replacement for the older `middleware.ts` convention) using `createServerClient` and `getClaims()`/the current `@supabase/ssr` recommended session refresh pattern. Copy refreshed cookies to the response. Treat this as the requested middleware layer, but do not use it as the authorization boundary; RLS and server actions remain authoritative.
3. Add `/auth/sign-in`, `/auth/sign-up`, and `/auth/callback`. Use client components for email/password forms, `signInWithPassword`, and `signUp` with a `redirectTo` callback URL. Add sign-out and redirect authenticated users away from auth pages. Redirect unauthenticated users from member-only reads (`/discuss`, private prayer UI, profile) to sign-in. Public lessons and sermons remain accessible.
4. Add server actions or route handlers for member writes: create/update/delete insight, create/update/delete discussion, create/update/delete reply, create draft prayer point, and insert/delete the current user's prayer confirmation. Add class-leader lesson/question CRUD and publish operations, plus admin sermon/topic/prayer CRUD and role promotion support only through trusted server-side operations. Every action obtains the current user from the server client, checks role/class where appropriate, validates input, and relies on RLS for the final decision.
5. Never import a module containing `SUPABASE_SECRET_KEY` into a client component, and never pass the secret key or the full `process.env` object to props. A repository search after implementation must show the secret variable only in server-only code/config documentation.

## Data Layer and Type Mapping

1. Replace the implementation of `lib/mock-data.ts` with Supabase queries, or rename it to a data module and update only imports if the project convention permits. Preserve all current exported function names and argument lists.
2. Query published lessons with `questions` and member-visible `insights`; map snake_case database fields to the current `Lesson` shape: `section_label` to `sectionLabel`, `margin_note` to `marginNote`, and `created_at` to display timestamps. Collect the distinct `author_id` values from insights and resolve their `name`/`initials` in one `member_display(author_ids)` RPC call before mapping to `LessonThought`; do not directly join or select `profiles` for another user's display fields.
3. Query published sermons and map `detail_date`, `paragraphs`, and `margin_note` to the existing `Sermon` shape. Do not expose drafts to anonymous callers.
4. Query published prayer points only after confirming an authenticated session, count `prayer_confirmations` for `hearts`, and expose a separate current-user confirmation state for the new tap action without changing the existing `PrayerPoint` signature unless types are extended compatibly. Collect prayer-point `author_id` values and resolve all author names/initials through `member_display(author_ids)`; never use a direct `profiles` join/select for those authors.
5. Build `getDiscussionData()` from the current published `discussion_topics` row, member-visible top-level `discussions`, and their replies. Collect distinct author IDs across both discussions and `discussion_replies`, resolve all non-current-user display names/initials through one batched `member_display(author_ids)` RPC call, calculate `peopleCount` from distinct authors, and preserve `DiscussionData` for existing components. Add a compatible `replies` extension to types only if the UI begins rendering replies. Do not directly join/select `profiles` for discussion or reply author display data.
6. Build `getProfile()` from the authenticated user's profile and aggregate counts. For anonymous access return an auth-required result or redirect at the page boundary; do not use mock identity data.
7. `getHomeData()` should call the real lesson, sermon, and authenticated prayer queries. Because the home page currently assumes prayer data exists, update its auth boundary/loading state so an anonymous visitor does not accidentally trigger a private prayer query.
8. Convert current client-side placeholder interactions into server actions/forms where they are writes. Local-only reading progress and question-answer UI can remain local until persistence is explicitly added; do not falsely present those as saved backend data.
9. Treat `member_display()` as the only cross-user identity lookup for author labels in insights, discussions, discussion replies, and prayer points. Direct `profiles` access is valid only for the current user's own profile or an admin management workflow. Handle an RPC result missing an expected author defensively with a neutral fallback rather than exposing identifiers, but treat missing names as an error to investigate rather than normal behavior.
10. Keep media outside relational rows: do not add `bytea`, base64/data-URL text, or comparable binary payload fields. Future media mapping must consume a Storage path or external URL reference only.

## Validation

1. Run a repository search for `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `sb_anon`, and `service_role`; expected result is none in active config/code. Search for `SUPABASE_SECRET_KEY` and verify every use is server-only. Confirm `.env.local` remains ignored and its values are never output.
2. Apply the migration in a disposable Supabase project and verify every listed table reports RLS enabled. Exercise anonymous, member, class-leader, and admin JWTs against each policy using the SQL editor or integration tests.
3. Verify anonymous reads: published lesson/sermon succeed; drafts, prayer points, profiles, topics, insights, discussions, and replies fail or are redirected. Verify anonymous inserts/updates/deletes fail for every table.
4. Verify member behavior: read published content and private member content; create/edit/delete only own insights, discussions, and replies; create/edit/delete only own draft prayer points; insert/delete only own prayer confirmations; cannot publish prayer points, manage sermons/topics, edit lessons, change roles, or assign classes.
5. Verify class-leader behavior with two classes: can create/edit/publish lessons and questions only for the assigned class, cannot touch another class, cannot manage sermons/prayer publication/roles, and retains all member permissions.
6. Verify admin behavior: manage all lessons, sermons, prayer points, discussion topics, and roles; can create and immediately publish own prayer point; cannot bypass the intended profile linkage or create content with another user's author ID through public actions.
7. Run `npm run build`, then `npm run dev`. Manually complete sign-up, email confirmation callback if enabled, sign-in, sign-out, public lesson/sermon navigation, and private-route redirect. In a signed-out browser, attempt every write control and confirm no row is inserted or changed.
8. Add focused tests or scripted checks for the mapping functions and authorization action failures, especially the class boundary, draft-only member prayer policy, and anonymous private-content reads.
9. Create content owned by at least two different test members. While signed in as a non-admin member, manually confirm that the other member's name and initials render correctly on insights, top-level discussions, discussion replies, and published prayer points, not only on the signed-in member's own content. Verify these mappings call `member_display()` and do not depend on direct `profiles` joins/selects, which RLS intentionally limits to self and admin.
10. Inspect the migration and generated database types for binary/image payload columns. Confirm there is no `bytea`, base64 image field, or large binary content in Postgres; any future image test must use a Supabase Storage object path or an external URL reference.

## Implementation Order

1. Rename environment variables and update both existing Supabase clients.
2. Add and apply the schema/RLS migration; validate helper functions and the non-recursive profile update policy before moving on.
3. Add auth routes, session-aware layout/middleware, and protected-route behavior.
4. Replace mock reads with typed Supabase queries and row mappers.
5. Add server actions for the required writes and connect existing UI controls/forms.
6. Add manual promotion instructions/seed SQL and any safe fixture data.
7. Run security checks, build/dev validation, and manual auth/write tests.
