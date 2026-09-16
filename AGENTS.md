# AGENTS.md

## Setup
- Package manager: **npm only**. Do not use pnpm or yarn — this project
  migrated off pnpm; a stray pnpm-lock.yaml or pnpm-workspace.yaml should
  never reappear.
- `npm install && npm run dev` — starts on localhost:3000.
- Typecheck: `npx tsc --noEmit` — this is the REAL type check.
  `next.config.mjs` has `typescript.ignoreBuildErrors: true`, so a passing
  `npm run build` does NOT guarantee type safety on its own.

## Database — hard boundaries, not suggestions
- Migrations live in `supabase/migrations/` as sequentially numbered
  files. Writing a migration file is fine. **Applying it is not** — every
  migration is applied manually by the developer in the Supabase SQL
  Editor, never via `supabase db push` or any other CLI write path.
- The Supabase CLI is linked and may be used for READ-ONLY investigation
  only (SELECT queries, information_schema, pg_trigger, grants). Never
  use it to run DDL/DML against the live database.
- Direct `ALTER` statements on the `auth` schema (e.g. `auth.users`) will
  fail even for the project owner — Supabase reserves that schema for its
  own internal role. Don't propose these; check current state with a
  read-only query first and flag it if a change genuinely seems needed.
- RLS: every table has RLS enabled. When revoking a privilege, always
  name every specific role explicitly (`from public, anon, authenticated`)
  — `from public` alone does NOT strip a privilege already granted to a
  named role, and `CREATE OR REPLACE FUNCTION` does not reset existing
  grants. This exact gap caused a real email-leak vulnerability once;
  don't reintroduce the pattern.
- Cross-member identity lookups (showing another user's name/initials on
  their insight, discussion post, etc.) must go through `member_display()`
  — never a direct join/select against `profiles` for anyone other than
  the current user. `profiles` RLS is self+admin-read only by design.
- Profile creation is owned exclusively by the `handle_new_user()` trigger
  on `auth.users`. Never self-heal a missing profile row from application
  code — that duplicates trigger logic in a second place and can mask a
  real trigger regression. If a profile is missing, surface a pending
  state and investigate the trigger, don't insert around it.
- Server-side Postgres functions returning `text` from a `plpgsql`
  `RETURN QUERY` need explicit `::text` casts when selecting from
  `auth.users.email` (it's `varchar(255)`, not `text`) — `language sql`
  functions coerce automatically, `plpgsql` does not.

## Code conventions
- Server Actions must return `{ error: string | null }`, never throw.
  Next.js redacts thrown Server Action error messages in production
  builds — a thrown error looks fine in `npm run dev` and becomes a
  useless generic message the moment it's deployed.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SECRET_KEY` — this project uses Supabase's newer
  publishable/secret key pair, not the legacy anon/service_role names.
- Time-of-day logic must use an explicit `Africa/Lagos` offset (e.g. via
  `Intl.DateTimeFormat`), never raw server-local time — hosting
  environments typically run UTC, and Nigeria has no DST.
- `lucide-react` is pinned to an exact version (no caret) after a fresh
  npm release once shipped broken. Don't loosen this without checking the
  target version's package contents first.

## Design system
- Styling is hand-written CSS classes in `app/globals.css`, not Tailwind
  utility classes — this is intentional (v0.dev's original structure),
  keep new components consistent with existing class patterns rather than
  introducing a parallel styling approach.
- Layouts must be genuinely responsive down to mobile width — this will
  become a real app, not just a desktop web tool. Avoid fixed-width
  containers or patterns (tables, wide grids) that only work on desktop.

## Git
- Never push without being told to. Commit locally, then wait for
  explicit confirmation before `git push origin main`.
- Before any push, run `git log origin/main..HEAD --oneline` and report
  the full list of commits about to be pushed — not just the newest one.

## Validation discipline
- A passing build is not validation. Browser-based behavior (auth flows,
  role gating, RLS-dependent rendering) must be confirmed by the
  developer in an actual signed-in browser session before being
  considered done — this project has repeatedly caught real bugs that a
  clean build/typecheck missed entirely.