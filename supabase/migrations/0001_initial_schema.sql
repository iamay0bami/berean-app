create extension if not exists pgcrypto;

create type public.app_role as enum ('member', 'class_leader', 'admin');
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
  status public.content_status not null default 'draft',
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
  hearts integer not null default 0,
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
  hearts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.discussions enable row level security;

create table public.discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(trim(text)) > 0),
  hearts integer not null default 0,
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
  select coalesce(exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and (role = 'admin' or (role = 'class_leader' and assigned_class_id = target_class_id))
  ), false)
$$;

create or replace function public.member_display(member_ids uuid[])
returns table (id uuid, name text, initials text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.initials
  from public.profiles p
  where (select auth.uid()) is not null and p.id = any(member_ids)
$$;
revoke all on function public.member_display(uuid[]) from public;
grant execute on function public.member_display(uuid[]) to authenticated;

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
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.protect_author()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.author_id <> old.author_id then raise exception 'author_id is immutable'; end if;
  return new;
end;
$$;
create trigger insights_protect_author before update on public.insights for each row execute procedure public.protect_author();
create trigger prayer_points_protect_author before update on public.prayer_points for each row execute procedure public.protect_author();
create trigger discussions_protect_author before update on public.discussions for each row execute procedure public.protect_author();
create trigger discussion_replies_protect_author before update on public.discussion_replies for each row execute procedure public.protect_author();

create or replace function public.protect_creator()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.created_by <> old.created_by then raise exception 'created_by is immutable'; end if;
  return new;
end;
$$;
create trigger lessons_protect_creator before update on public.lessons for each row execute procedure public.protect_creator();
create trigger sermons_protect_creator before update on public.sermons for each row execute procedure public.protect_creator();
create trigger topics_protect_creator before update on public.discussion_topics for each row execute procedure public.protect_creator();

create policy classes_public_read on public.classes for select using (active or public.is_admin());
create policy classes_admin_write on public.classes for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy profiles_self_read on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

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
end;
$$;
revoke all on function public.assign_user_role(uuid, public.app_role, text) from public;
grant execute on function public.assign_user_role(uuid, public.app_role, text) to authenticated;

create policy lessons_public_read on public.lessons for select using (status = 'published');
create policy lessons_leader_read on public.lessons for select to authenticated using (public.is_class_leader_for(class_id));
create policy lessons_leader_insert on public.lessons for insert to authenticated with check (public.is_class_leader_for(class_id) and created_by = (select auth.uid()));
create policy lessons_leader_update on public.lessons for update to authenticated using (public.is_class_leader_for(class_id)) with check (public.is_class_leader_for(class_id));
create policy lessons_leader_delete on public.lessons for delete to authenticated using (public.is_class_leader_for(class_id));

create policy questions_public_read on public.questions for select using (exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published'));
create policy questions_leader_write on public.questions for all to authenticated using (public.is_admin() or exists (select 1 from public.lessons l where l.id = lesson_id and public.is_class_leader_for(l.class_id))) with check (public.is_admin() or exists (select 1 from public.lessons l where l.id = lesson_id and public.is_class_leader_for(l.class_id)));

create policy insights_member_read on public.insights for select to authenticated using (true);
create policy insights_own_insert on public.insights for insert to authenticated with check (
  author_id = (select auth.uid())
  and exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
);
create policy insights_own_update on public.insights for update to authenticated using (author_id = (select auth.uid()) or public.is_admin()) with check (author_id = (select auth.uid()) or public.is_admin());
create policy insights_own_delete on public.insights for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());

create policy sermons_public_read on public.sermons for select using (status = 'published');
create policy sermons_admin_write on public.sermons for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy prayers_member_read on public.prayer_points for select to authenticated using (status = 'published' or author_id = (select auth.uid()) or public.is_admin());
create policy prayers_member_draft_insert on public.prayer_points for insert to authenticated with check (author_id = (select auth.uid()) and status = 'draft');
create policy prayers_member_draft_update on public.prayer_points for update to authenticated using (author_id = (select auth.uid()) and status = 'draft') with check (author_id = (select auth.uid()) and status = 'draft');
create policy prayers_member_draft_delete on public.prayer_points for delete to authenticated using (author_id = (select auth.uid()) and status = 'draft');
create policy prayers_admin_write on public.prayer_points for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy confirmations_member_read on public.prayer_confirmations for select to authenticated using (true);
create policy confirmations_own_insert on public.prayer_confirmations for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.prayer_points p where p.id = prayer_point_id and p.status = 'published'));
create policy confirmations_own_delete on public.prayer_confirmations for delete to authenticated using (user_id = (select auth.uid()));

create policy topics_member_read on public.discussion_topics for select to authenticated using (status = 'published' or public.is_admin());
create policy topics_admin_write on public.discussion_topics for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy discussions_member_read on public.discussions for select to authenticated using (true);
create policy discussions_own_insert on public.discussions for insert to authenticated with check (author_id = (select auth.uid()));
create policy discussions_own_update on public.discussions for update to authenticated using (author_id = (select auth.uid()) or public.is_admin()) with check (author_id = (select auth.uid()) or public.is_admin());
create policy discussions_own_delete on public.discussions for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());
create policy replies_member_read on public.discussion_replies for select to authenticated using (true);
create policy replies_own_insert on public.discussion_replies for insert to authenticated with check (
  author_id = (select auth.uid())
  and exists (select 1 from public.discussions d where d.id = discussion_id)
);
create policy replies_own_update on public.discussion_replies for update to authenticated using (author_id = (select auth.uid()) or public.is_admin()) with check (author_id = (select auth.uid()) or public.is_admin());
create policy replies_own_delete on public.discussion_replies for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());

revoke all on all tables in schema public from anon, authenticated;
grant select on public.classes, public.lessons, public.questions, public.sermons to anon, authenticated;
grant select, insert, update, delete on public.classes, public.lessons, public.questions, public.insights, public.sermons, public.prayer_points, public.prayer_confirmations, public.discussion_topics, public.discussions, public.discussion_replies to authenticated;
