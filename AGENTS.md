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
  Class-leader identity on Classes/detail uses the existing narrow
  `getClassLeaders()` / `get_class_leaders` path, not `member_display()`.
- Profile creation is owned exclusively by the `handle_new_user()` trigger
  on `auth.users`. Never self-heal a missing profile row from application
  code — that duplicates trigger logic in a second place and can mask a
  real trigger regression. If a profile is missing, surface a pending
  state and investigate the trigger, don't insert around it.
- Member-facing profile writes go only through
  `public.update_own_account(name, username)`. Never grant table `UPDATE` on
  `profiles`; the app never writes `role`, `organization_id` or
  `assigned_class_id`. Username format is enforced in signup and the RPC, not
  by a database constraint. Account password changes verify the current
  password with `signInWithPassword` before `updateUser`, and every Account
  action returns `{ error: string | null }` rather than throwing.
- Server-side Postgres functions returning `text` from a `plpgsql`
  `RETURN QUERY` need explicit `::text` casts when selecting from
  `auth.users.email` (it's `varchar(255)`, not `text`) — `language sql`
  functions coerce automatically, `plpgsql` does not.

## Data access conventions
- Read access is not write access. A class_leader can also be a plain
  member of another class, so a row RLS lets you read may be one you cannot
  write. Scope authoring queries and pages explicitly; never infer
  permission from a successful read.
- An UPDATE or DELETE filtered out by RLS returns no error and zero rows.
  Chain `.select('id')` and treat zero rows as a denial. Only INSERT raises.
- Ids that are slugs of user-typed text (lessons, classes) must never equal
  a static route sitting beside a dynamic segment. Reserved slugs live in
  `app/actions.ts`; extend them whenever such a route is added.
- Leadership (`profiles.assigned_class_id`) and membership
  (`class_memberships`) are separate concepts. Do not merge them.

## Code conventions
- Server Actions must return `{ error: string | null }`, never throw.
  Next.js redacts thrown Server Action error messages in production
  builds — a thrown error looks fine in `npm run dev` and becomes a
  useless generic message the moment it's deployed.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SECRET_KEY` — this project uses Supabase's newer
  publishable/secret key pair, not the legacy anon/service_role names.
- Time-of-day logic must name its timezone explicitly via `Intl.DateTimeFormat`
  — never raw server-local time, which is ambient and host-dependent. The
  greeting and date on `/home` follow the *visitor's* zone, read from the
  `x-vercel-ip-timezone` request header and passed through `safeTimeZone()`
  (`lib/greeting.ts`), which falls back to UTC when the header is absent or
  malformed. Use that helper for any new date/time display.
- `Intl.DateTimeFormat` throws a `RangeError` on an unknown timezone. Any zone
  derived from a request header must go through `safeTimeZone()` first —
  uncaught, it takes down the whole page render.
- `lucide-react` is pinned to an exact version (no caret) after a fresh
  npm release once shipped broken. Don't loosen this without checking the
  target version's package contents first.
- Any new dependency (icon set, font, animation library) is pinned to an
  exact version and justified in the plan, including its weight.

## Design system
- Once the design plan is approved it is saved to `docs/design-system.md`,
  which is the source of truth for every UI task. Read it first. Do not
  re-open the direction in an implementation task.
- Styling is hand-written CSS in `app/globals.css`. No Tailwind utility
  classes and no shadcn components. Inline styles only for dynamic values
  (e.g. a progress width or a CSS variable).
- Tokens: every colour, font, size, space, radius, shadow, blur, duration
  and easing is a CSS variable defined once at the top of `globals.css`,
  for both themes. No hard-coded hex or px values in component rules.
- Themes: light and dark are both first-class. Token values switch via
  `[data-theme]`, defaulting to `prefers-color-scheme`. The choice is stored
  in a cookie and applied on the server so there is no flash of the wrong
  theme. Check contrast in both (4.5:1 body text, 3:1 UI elements).
- Typography: production uses two self-hosted local fonts through `next/font/local`. Berean Serif is the static 600 normal display face from `app/fonts/berean-serif/BereanSerif-SemiBold.woff2`; it renders headings, including live names and titles, the complete Home greeting, folio numerals and scripture quotations. Never request or synthesize another Berean Serif weight or style. Hanken Grotesk renders controls, metadata, descriptions, prayers, thoughts, summaries, long-form lesson and sermon prose, and all remaining body/interface copy through `app/fonts/hanken/HankenGrotesk-Yoruba.woff2`; keep `--font-interface`, weight 100–900, normal style, `display: 'swap'` and preload enabled. Display role overrides content origin: there is no fixed-copy/live-data family split. Do not route fonts with `:lang()`. The admin-only `/dev/cloth` gate retains local production Berean and Hanken, Google-split Hanken as a negative control, and Google Source Serif 4 only as the upstream split control. The 18 realistic Yoruba clusters must remain in each applicable local production file; `ṣ́` is labelled invalid orthography, NFD `n` + U+0301 remains diagnostic, and `ɓ`, `ɗ`, `ƙ`, and `₦` remain labelled known production coverage gaps.
- Icons: Lucide at the pinned exact version, one size scale, one stroke
  width. Every icon-only button has an accessible name. No second icon
  library without approval.
- Glass: real `backdrop-filter` is permitted only on `.bottom-nav` and
  `.reading-header`; every other Batch 3 glass treatment—including the moving
  nav capsule and cloth-caption plate—is faux and uses no filter. Class-detail
  chips have opaque fills, an inner border, a contrasting outer edge and an
  opaque focus moat; authoring headers remain solid. On the two filtered
  surfaces, declare an opaque background first, enable
  the light `rgba(248, 247, 244, 0.92)` or dark `rgba(24, 32, 54, 0.94)` fill
  with a capped 12px blur only inside standard/WebKit `@supports`, and restore
  the opaque background under `prefers-reduced-transparency`. Unsupported and
  old WebViews must retain the solid surface. Never place glass behind reading
  text or a focused field, nest filtered surfaces, or animate blur.
- Motion: CSS only unless approved. Transitions name their properties
  (never `transition: all`). `prefers-reduced-motion` is respected. At most
  one signature moment per screen; motion that answers a user action is
  welcome, decorative looping motion is not.
- Imagery: prefer generated art (CSS/SVG, deterministic from an id) to
  photographs. Raster images go through `next/image` with explicit
  dimensions. State the weight of every new font, image and dependency.
- Layout: mobile first. Verify at 360px, 768px and desktop. Primary actions
  sit within thumb reach, touch targets are at least 44px, no horizontal
  scroll.
- Classes index/detail retain the 720px `.page-wrap` and scope their gutters
  to 24px at every width. The index shelf bleeds only to the column edges:
  20px third-cover peek at 320px, 24px at 360px. Covers and Other-class rows
  link to `/class/[id]`; only cover links are explicit shelf tab stops.
- Classes index uses `getClassCatalog()` + `getReadableLessonSummaries()` in
  parallel, with existing `getCurrentRole()` for empty copy only. Membership
  and active leadership remain separate eligibility inputs. Detail tools and
  lesson visibility switch exhaustively on `viewerRole`, never profile role.
  Admin tools are labelled `Church-wide tools`; non-member guidance names all
  leaders with `Intl.ListFormat` disjunction, or asks the church admin when
  leaderless. There is no join button and no new RLS surface.
- Class detail has only back/theme chips in its non-sticky header. Its full
  class name appears once as the caption h1; no compact echo or skip link.
  Clip only the art. The full leader list and title wrap without a clamp or
  internal scroll, and the hero grows with them. Mobile hero top padding adds
  `env(safe-area-inset-top, 0px)`; the 224px desktop cover resets to its normal
  inset and has a 3:4 minimum height, not a fixed ratio that can strand a long
  caption.
  Reduced motion disables chip transitions and detail tool-button press scaling.
- Classes display text is Berean 600 normal, with no synthesis; the wrapped
  detail title uses existing `--text-title` at 1.2 leading (never below 1.15).
  From 768px, its 224px cover uses `--text-heading` for the title and
  `--text-ui` for leaders. Hanken carries leader lists, descriptions, metadata
  and notes. No
  `--type-*`/`--tracking-*` aliases: use explicit existing size declarations.
  Detail adds only `--class-hero-min`, `--class-detail-cover-inline` and
  `--cloth-control-edge`; do not invent another page-width/gutter system.
- Classes lesson emptiness is a quiet paragraph, not another heading. Only
  the index's whole-catalog-empty state uses `EmptyState`, with role-aware
  copy/action. Index lesson metadata joins actual class/week/duration with
  ` · ` and omits absent parts; excerpts clamp to two lines. Numbered rows
  use `.row` plus a `.folio` child, not an undefined `.row--folio` modifier.
  Both route loaders are static, with one status outside inert geometry.
- Home says `Latest lesson`, never `just published`; it never calls
  `getLesson()`. `getHomeLessonHighlights()` bounds one question and thought.
  Home shows no counts, omits empty lesson-dependent modules, and keeps Prayer
  unlinked until Sermons has `#prayer-points`.
- Honest UI: never ship a control that does nothing, and never show a
  hard-coded figure as if it were data. Wire it or remove it.
- Reuse existing component classes before adding new ones. One name per
  concept. Document new component classes in `docs/design-system.md`.
- Token values (custom properties) use hex, `rgb()` and comma-form `rgba()` only.
  Never `color-mix()` or `oklch()` inside a `--*` property: an unsupported value fails at use time with
  no fallback. Gate any mix with `@supports`.
- No CSS rule may target a bare element tag inside a component block
  (e.g. `.lesson-index > span`). Style by class.
- Text on a brass fill is always ink. Control borders reach 3:1 against the
  surface they sit on. Measure with a tool, not by eye.

## Skills
- Installed in `.claude/skills/`: `frontend-design` (direction and critique)
  and from jakubkrehel/skills: better-ui, better-typography, better-colors,
  better-layout, better-accessibility, better-writing, interface-review.
- Where a skill suggests Tailwind classes or shadcn components, this file
  wins: express the result in `globals.css`.
- UI tasks change one screen group at a time.

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
- UI changes are checked at 360px and 768px, in light and dark, with
  keyboard focus visible.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
