# Berean

**A little room to listen, learn, and live the Word.**

Berean is a mobile-first discipleship companion for a church community. It gives members one calm place to read the week's lesson, sit with reflection questions, share what they're learning, keep sermon notes close, hold prayer points together, and talk things through as a class — while giving leaders and admins the tools to publish content and manage access.

Built with [Next.js](https://nextjs.org) (App Router + Server Actions) and [Supabase](https://supabase.com) (Postgres, Auth, Row Level Security).

> **Note:** `package.json` still carries the scaffold name `my-project`. The product name is **Berean**.

---

## Table of contents

- [What is Berean?](#what-is-berean)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Roles & permissions](#roles--permissions)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Security notes](#security-notes)
- [Known gaps & roadmap](#known-gaps--roadmap)
- [License](#license)
- [Contributing](#contributing)

---

## What is Berean?

Berean is the digital companion for a local church's discipleship rhythm. Members read a weekly lesson, reflect on guided questions, and leave insights for the class; they follow along with sermon notes, keep a shared prayer list, and join a discussion table. Class leaders prepare and publish lessons and sermon notes, and admins manage who can see and shape what.

It is designed to feel less like a social feed and more like a quiet reading room: a warm, paper-inspired interface with a bottom navigation bar on small screens.

**Who it's for**

| Audience | What they use it for |
| --- | --- |
| Members | Read lessons, reflect, share insights, follow sermons, keep prayer points, discuss |
| Class leaders | Author and publish lessons and their reflection questions |
| Admins | Publish sermon notes, manage member roles and class assignments |

---

## Features

- **Home dashboard** — a personalized landing page with a "continue reading" card, the week's sermon tile, a community discussion tile, and a prayer-corner preview. Empty states adapt to whether the viewer is a leader (who may still have drafts) or a visitor. See `components/home-view.tsx`.
- **Classes & tracks** — the lesson library is split into **Foundations** and **Going Deeper** tracks, with per-lesson progress indicators and clear empty states. See `components/classes-view.tsx`.
- **Lesson reading** — a focused reading view with a scroll-driven progress ribbon, a "thought to carry" margin note, tappable reflection questions, and "From the room" insights from classmates. See `components/lesson-reading.tsx`.
- **Sermons & prayer** — published sermon notes with a detail reading view, plus a prayer-point list with "N people are praying" confirmations. See `components/sermons-view.tsx` and `components/sermon-reading.tsx`.
- **Discussions** — a weekly prompt and a feed of shared thoughts. The schema also supports threaded replies. See `components/discussion-view.tsx`.
- **Authentication** — email/password sign-up with an optional username, and sign-in with **either** an email or a username. Email confirmation is handled through a callback route.
- **Profile** — member identity, a walk-since date, stats (thoughts and prayers), quick links, admin entry point for admins, and sign-out. See `components/profile-view.tsx`.
- **Admin member management** — an admin-only list of members with inline role changes (`member`, `class_leader`, `admin`) and class assignment, with per-row save errors. See `components/admin-members-view.tsx`.
- **Branded experience throughout** — branded loading states with rotating phrases, custom error and not-found pages, and a consistent type/color system.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js `16.3.0` (App Router, React Server Components, Server Actions) |
| Language | TypeScript `5.7.3` (`strict`) |
| UI runtime | React `19` |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss`, `tw-animate-css` |
| Components | `shadcn` (base-nova style) and `@base-ui/react` primitives |
| Icons | `lucide-react` |
| Utilities | `class-variance-authority`, `clsx`, `tailwind-merge` |
| Backend | Supabase — Postgres, Auth, Row Level Security |
| Supabase clients | `@supabase/ssr`, `@supabase/supabase-js` |
| Fonts | Fraunces (serif), Inter (sans), JetBrains Mono (mono) |

---

## Architecture

Berean is a server-rendered Next.js app. Pages are async Server Components that read data directly through a Supabase client bound to the request's cookies; mutations go through Server Actions. There is no separate API layer to maintain.

```
Request
  │
  ├─ proxy.ts                 # Next 16 proxy (middleware): guards /profile and /discuss
  │
  ├─ app/**/page.tsx          # async Server Components (data fetch)
  │     └─ lib/mock-data.ts   # the real data layer (Supabase queries + mapping)
  │
  └─ components/**            # Client/Server views; mutations call Server Actions
        └─ app/actions.ts     # 'use server' actions → Supabase → revalidatePath()
```

**Data flow**

1. A Server Component page (e.g. `app/classes/page.tsx`) calls a loader in `lib/mock-data.ts`.
2. The loader uses a Supabase client (`lib/supabase/server.ts`) to query RLS-protected tables and maps rows into the app's TypeScript types (`lib/types.ts`).
3. Client components call Server Actions in `app/actions.ts` to write data.
4. Actions write through the same cookie-bound Supabase client and call `revalidatePath()` so affected pages refresh.

**Three Supabase clients, three jobs**

| File | Client | Used for |
| --- | --- | --- |
| `lib/supabase/server.ts` | `createServerClient` (cookie-bound) | Server Components and Server Actions. **This is the only client whose cookie store persists a session**, so all auth calls go through it. |
| `lib/supabase/client.ts` | `createBrowserClient` | Browser-side calls, e.g. sign-up and the username-availability check. |
| `lib/supabase/service.ts` | service-role client | **Server-only.** Used solely to look up an email for a username during sign-in (`resolve_username_email`). It never signs a user in. |

**Why `lib/mock-data.ts`?** The file kept its scaffold name, but it is the real Supabase data layer — every loader (`getLessons`, `getSermons`, `getProfile`, `getDiscussionData`, and so on) lives there.

---

## Roles & permissions

Roles are stored on `profiles.role` and defined by the `app_role` enum.

| Role | Can |
| --- | --- |
| `member` | Read published lessons, questions, and sermons; post, edit, and delete their own insights, discussions, replies, and draft prayer points; confirm prayer points. |
| `class_leader` | Everything a member can, plus author/publish lessons and manage questions for their **assigned class** only. |
| `admin` | Everything, plus publish sermons, manage all lessons, manage discussion topics, and change member roles and class assignments. |

Two important rules:

- A `class_leader` must have an `assigned_class_id`; non-leaders may not have one. This is enforced by `assign_user_role`.
- Authorization is enforced in the database with Row Level Security policies and `security definer` functions — not only in the UI. Even a crafted request cannot bypass these, because the anon/authenticated roles are revoked from the tables and re-granted selectively (see the end of `supabase/migrations/0001_initial_schema.sql`).

---

## Data model

Content, membership, and community tables live in the `public` schema. Enums: `app_role` (`member`, `class_leader`, `admin`) and `content_status` (`draft`, `published`).

**Content**

| Table | Purpose |
| --- | --- |
| `classes` | A discipleship class; lessons belong to a class. |
| `lessons` | A lesson, its reading copy, quote/reference, track (`foundations`/`deeper`), and status. |
| `questions` | Reflection questions attached to a lesson, ordered by `sort_order`. |
| `sermons` | Sermon notes with date, speaker, paragraphs, margin note, and status. |
| `discussion_topics` | A weekly discussion prompt, optionally linked to a lesson or sermon (not both). |

**Members**

| Table | Purpose |
| --- | --- |
| `profiles` | One row per auth user: display name, initials, tagline, `member_since`, `role`, `username`, and `assigned_class_id`. |

**Community**

| Table | Purpose |
| --- | --- |
| `insights` | A member's short reflection on a lesson (optionally tied to a question). |
| `prayer_points` | A member-authored prayer request, `draft` until published. |
| `prayer_confirmations` | Join table recording who has "agreed in prayer" on a prayer point. |
| `discussions` | A top-level thought in the discussion feed, optionally tied to a topic. |
| `discussion_replies` | Replies to a discussion. |

**Notable functions and triggers** (`supabase/migrations/`)

- `handle_new_user()` — trigger on `auth.users` insert that provisions a matching `public.profiles` row.
- `current_role()`, `is_admin()`, `is_class_leader_for(class_id)` — the role checks used throughout the RLS policies.
- `member_display(ids)` — safely returns display names/initials for a set of member IDs.
- `update_my_profile(...)` — the only path by which a user may edit their own profile.
- `assign_user_role(...)` — admin-only role/class assignment.
- `resolve_username_email(text)` — service-role-only username → email lookup for sign-in.
- `username_available(text)` — availability check for sign-up.
- `admin_list_members()` — admin-only member listing for the role-management screen.
- `protect_author` / `protect_creator` — triggers that keep authorship and creator columns immutable.

---

## Getting started

### Prerequisites

- **Node.js 20.9 or newer** (the minimum for Next.js 16) and npm.
- A **Supabase** project (hosted or local). The [Supabase CLI](https://supabase.com/docs/guides/cli) is optional but recommended.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Supabase project's values:

```bash
cp .env.example .env.local
```

See [Environment variables](#environment-variables) for what each value is and where to find it.

### 3. Set up the database

Apply the migrations in `supabase/migrations/` in order (`0001` → `0004`).

**Option A — hosted Supabase project**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

You can also paste each migration into the Supabase SQL editor, in order.

**Option B — local Supabase**

```bash
supabase start
supabase db reset   # applies all migrations in supabase/migrations/
```

Migrations are idempotent and safe to re-run.

### 4. Bootstrap the first admin

New accounts are created with the `member` role. Promote the first admin manually, since the guarded role RPC requires an existing admin:

1. Sign up in the app (step 5).
2. In the Supabase SQL editor, run the statement in `supabase/manual-promotion.sql`, replacing `AUTH-USER-UUID-HERE` with that user's ID from `auth.users`.

After the first admin exists, use the app's admin screen (or `assign_user_role`) for all further changes.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/home`.

### 6. Build for production

```bash
npm run build
npm start
```

---

## Environment variables

Create `.env.local` from `.env.example`. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser; the rest are server-only.

| Variable | Required | Scope | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public | Your Supabase project URL (`https://<ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Public | Supabase publishable/anon key, used by the browser and SSR clients. Safe to expose; RLS enforces access. |
| `SUPABASE_SECRET_KEY` | Yes | **Server-only** | Supabase service-role key. Grants full database access and **must never reach the client**. |
| `ANTHROPIC_API_KEY` | No | Server-only | Reserved for planned AI features. **Not read anywhere in the codebase yet.** |

Never commit `.env.local`; it is already covered by `.gitignore`.

---

## Available scripts

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `next dev` | Start the development server with hot reload. |
| `build` | `next build` | Create a production build. |
| `start` | `next start` | Serve the production build. |

There is currently **no `lint`, `test`, or `typecheck` script**. If you add one, document it here.

---

## Project structure

```
berean-app/
├─ app/                        # App Router routes, Server Actions, global styles
│  ├─ layout.tsx               # Root layout, fonts, metadata, viewport
│  ├─ globals.css              # Tailwind v4 imports + design tokens
│  ├─ actions.ts               # All Server Actions (auth, content, profile, admin)
│  ├─ home/                    # Dashboard
│  ├─ classes/                 # Lesson library + [lessonId] reading view
│  ├─ sermons/                 # Sermon notes + [sermonId] reading view
│  ├─ discuss/                 # Discussion feed ( /discussions redirects here )
│  ├─ profile/                 # Member profile + loading/pending states
│  ├─ admin/members/           # Admin role management
│  ├─ auth/                    # sign-in, sign-up, and OAuth/email callback route
│  ├─ error.tsx                # Route error boundary
│  ├─ loading.tsx              # Branded loading state
│  └─ not-found.tsx            # Custom 404
├─ components/                 # Views and shared UI (app-shell, bottom-nav, cards, …)
│  └─ ui/                      # shadcn-generated primitives
├─ lib/
│  ├─ mock-data.ts             # Supabase data layer (loaders + row mapping)
│  ├─ types.ts                 # Shared TypeScript types
│  ├─ utils.ts                 # clsx/tailwind-merge helper
│  └─ supabase/                # server.ts, client.ts, service.ts clients
├─ supabase/
│  ├─ migrations/              # 0001–0004 SQL migrations
│  └─ manual-promotion.sql     # One-time first-admin bootstrap
├─ public/                     # Icons, logos, placeholders
├─ proxy.ts                    # Next 16 proxy: guards /profile and /discuss
├─ next.config.mjs             # Next config
├─ components.json             # shadcn configuration
└─ tsconfig.json               # TypeScript config (path alias @/* → ./*)
```

---

## Security notes

- **Row Level Security is the trust boundary.** Table access is revoked from `anon`/`authenticated` and re-granted selectively; policies and `security definer` functions decide who can read or write each row.
- **`SUPABASE_SECRET_KEY` is server-only.** It bypasses RLS. It is imported only in `lib/supabase/service.ts`, which is used solely for the username → email lookup during sign-in.
- **Route protection** happens in `proxy.ts`, which redirects unauthenticated users away from `/profile` and `/discuss` to sign-in with a `next` parameter. Server pages re-check auth as defense in depth.
- **Sign-in** accepts an email or username. When a username cannot be resolved, the action performs a throwaway sign-in attempt to normalize request timing and always returns a generic error, avoiding account enumeration.
- **Session persistence** relies on the cookie-bound SSR client in `lib/supabase/server.ts`; do not substitute the browser or service client for auth calls.
- **Author/creator columns are immutable** thanks to database triggers, so edits cannot reassign ownership.

---

## Known gaps & roadmap

This is an evolving app. Known limitations, in the interest of honesty:

- **No automated tests**, and no `lint` or `typecheck` scripts. `next.config.mjs` currently sets `typescript.ignoreBuildErrors: true`, so build success does not guarantee type correctness.
- **`ANTHROPIC_API_KEY` is unused** — reserved for future AI-assisted features.
- **UI stubs**: "Edit profile", "Bookmarked notes", "My reflections", and "Reading settings" are not wired up; prayer points can be created but there is no publish flow in the UI; discussion replies are supported by the schema but not rendered in the feed; the profile "Lessons" stat is hardcoded to `0`; some reading headings are hardcoded per item.
- **Naming**: `package.json` still says `my-project`, and `lib/mock-data.ts` is the real data layer despite its name.
- **No license file** (see below).

---

## License

No `LICENSE` file is present in this repository, and `package.json` is marked `"private": true`. Unless a license is added, treat this as **all rights reserved**. If you intend to open-source it, add a `LICENSE` file and reference it here.

---

## Contributing

1. Create a branch from `main`.
2. Make your change and run `npm run build` before opening a pull request.
3. Keep database changes in a new numbered migration under `supabase/migrations/`; never edit an applied migration.
4. Match the existing code style and the design tokens in `app/globals.css`.

For questions about the project, contact the repository maintainer.
