-- 0005: Organizations, org invite codes, and the dev data reset.
--
-- Apply ONCE, manually, in the Supabase SQL Editor (never via `supabase db push`).
-- This file is NOT idempotent by design: it truncates all content tables.
-- Apply 0006 immediately after — until 0006 replaces public.handle_new_user(),
-- signups fail because profiles.organization_id is NOT NULL but the old trigger
-- does not set it.
--
-- The whole script is a single implicit transaction, so the FK drop/re-add around
-- the TRUNCATE is never observable in a half-applied state.

-- 1) New tables ----------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);
alter table public.organizations enable row level security;

create table public.org_invite_codes (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.org_invite_codes enable row level security;

-- 2) Dev organization ----------------------------------------------------------
insert into public.organizations (name, slug)
values ('Berean Dev', 'berean-dev')
on conflict (slug) do nothing;

-- 3) Data reset (content only; profiles rows and auth.users are preserved) ------
-- Nulling the column is not enough: the constraint itself blocks TRUNCATE.
update public.profiles set assigned_class_id = null;
-- No class survives the reset, so no profile may remain a leader without a class.
update public.profiles set role = 'member' where role = 'class_leader';

-- profiles.assigned_class_id holds an FK into classes; Postgres refuses to
-- TRUNCATE classes while profiles references it, even though the column is all
-- NULL. TRUNCATE ... CASCADE would empty profiles, which is forbidden. Drop the
-- constraint for the duration of the truncate and re-add it exactly as 0001 had it.
alter table public.profiles drop constraint profiles_assigned_class_id_fkey;

truncate table
  public.classes,
  public.lessons,
  public.questions,
  public.insights,
  public.sermons,
  public.prayer_points,
  public.prayer_confirmations,
  public.discussion_topics,
  public.discussions,
  public.discussion_replies;

alter table public.profiles
  add constraint profiles_assigned_class_id_fkey
  foreign key (assigned_class_id) references public.classes(id) on delete set null;

-- 4) Organization columns ------------------------------------------------------
alter table public.profiles
  add column organization_id uuid references public.organizations(id);

update public.profiles
set organization_id = (select id from public.organizations where slug = 'berean-dev');

alter table public.profiles alter column organization_id set not null;

-- These tables are empty after the truncate, so NOT NULL needs no backfill.
alter table public.classes            add column organization_id uuid not null references public.organizations(id);
alter table public.lessons            add column organization_id uuid not null references public.organizations(id);
alter table public.sermons            add column organization_id uuid not null references public.organizations(id);
alter table public.prayer_points      add column organization_id uuid not null references public.organizations(id);
alter table public.discussion_topics  add column organization_id uuid not null references public.organizations(id);
alter table public.discussions        add column organization_id uuid not null references public.organizations(id);

-- 5) Indexes -------------------------------------------------------------------
create index profiles_organization_id_idx           on public.profiles(organization_id);
create index classes_organization_id_idx            on public.classes(organization_id);
create index lessons_organization_id_idx            on public.lessons(organization_id);
create index lessons_organization_status_idx        on public.lessons(organization_id, status);
create index sermons_organization_id_idx            on public.sermons(organization_id);
create index prayer_points_organization_id_idx      on public.prayer_points(organization_id);
create index discussion_topics_organization_id_idx  on public.discussion_topics(organization_id);
create index discussions_organization_id_idx        on public.discussions(organization_id);
