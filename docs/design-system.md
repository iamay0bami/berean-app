# Berean — Design System

**Source of truth for every UI task. Read this before touching a screen.**
`AGENTS.md` carries the short form of these rules; this document carries the
values, the reasons and the traps.

Do not re-open the direction in an implementation task. If something here is
wrong, change it here first, then in the code — one edit, in that order.

> **Batches 1a, 0a, 0b and 1b have landed.** The tokens (§1–§5) and primitives
> (§6) in this document exist in `globals.css`, and the chrome in §8 —
> `Header`, `ReadingHeader`, `FormHeader`, `AuthHeader`, the theme toggle and
> the sliding nav indicator — exists in `components/`. The honesty pass is
> closed: the bell, the dead heart/share/bookmark affordances, the invented
> figures and the decorative eyebrows are gone, and every figure left on screen
> traces to a query or a prop.
>
> Read §1–§8 as a description of the system as it is. §9/§11 remain the screen
> plan, and these surfaces are deliberately **not yet built** until their own
> change: the lesson composer (`createInsight`), the Profile library rows
> (`Edit profile`, reflections, reading settings), the sermon sub-tabs, the
> class detail route, and the cloth (`CoverCloth`). Nothing in §6 is
> aspirational.

---

## 0. The direction, in one paragraph

> Berean is a lamplit reading room for your church: the app is the lamp, the
> week's Word is open on the table, and the rail down the reading edge shows how
> far in you are.

**The one memorable element is the ribbon**, in the two forms that measure
something real:

| Where | What it is | Why it is true |
| --- | --- | --- |
| Lesson reading | A brass rail down the reading edge, length set by real scroll position | Scroll position is measured |
| Bottom nav | The 3px brass bar that slides between tabs | The current route is known |

Both are one object seen twice: a brass marker showing where you are — a position
in a page, and a position in the app. Its companion is the **margin note**:
marginalia is the authentic personal-library gesture, and `lesson.margin_note` is
already real.

**The pillars of distinctiveness** are the dark indigo atmosphere, the generated
cover cloth, the glass navigation and the brass rail. Cream-and-brass ornament
carries none of it.

**Dark is the hero theme**, designed first, lamplit and warm — never pure black.
Light is a warm *neutral*, deliberately not parchment.

---

## 1. Colour

Two tiers. **Primitives** name a hue and are never referenced by a component.
**Semantic tokens** name a job and are the only tier a component rule may use.

### 1.1 Primitives

```css
:root {
  /* Dark — "Lamplit Room" */
  --indigo-950: #141A29;  /* page ground */
  --indigo-900: #1D2438;  /* raised: cards, sheets, opaque nav */
  --indigo-800: #252D45;  /* sunken: inputs, pressed rows */
  --indigo-700: #2C3550;  /* hairline dividers */
  --indigo-500: #707BA0;  /* control borders */
  --lamp-100:   #F0E9DC;  /* primary text — warm lamplight, never white */
  --slate-400:  #9BA3B7;  /* secondary text, metadata */
  --brass-400:  #E3B666;  /* accent on dark */
  --sage-400:   #8FB89A;  /* community marker on dark */
  --clay-400:   #E08B7D;  /* destructive on dark */

  /* Light — "Day Room" */
  --paper-100:  #F5F4F2;  /* page ground — warm neutral, NOT parchment */
  --paper-200:  #EAE8E4;  /* sunken: inputs */
  --paper-300:  #DFDCD6;  /* dividers */
  --white:      #FFFFFF;  /* raised surfaces */
  --ink-900:    #16203A;  /* primary text — the brand indigo, deepened */
  --ink-500:    #5D6474;  /* secondary text */
  --ink-400:    #7C8390;  /* control borders */
  --brass-600:  #B8863B;  /* accent FILL only */
  --brass-700:  #A87730;  /* rail + nav indicator only */
  --brass-800:  #8A5F14;  /* accent AS TEXT only */
  --sage-600:   #4F6B52;  /* community marker on light */
  --clay-600:   #A6493A;  /* destructive on light */
}
```

**Three brass steps, one job each.** 600 fills, 700 marks a position, 800 is
text. Merging any two of them breaks a measured contrast requirement (§1.4).
If you need a fourth brass, you have misdiagnosed the problem.

### 1.2 Semantic tokens

`--bg` · `--bg-raised` · `--bg-sunken` · `--text` · `--text-muted` ·
`--text-on-accent` · `--line` · `--line-strong` · `--accent` · `--accent-text` ·
`--accent-soft` · `--rail` · `--community` · `--danger` · `--danger-soft` ·
`--focus-ring` · `--glass-bg` · `--glass-border`

Components reference **only these**. A component rule containing a raw hex is a
bug, and `.review-question.answered`'s paper-on-brass was exactly that bug.

### 1.3 Theme blocks

```css
/* Light is the default. Everything else lives here. */
:root,
:root[data-theme='light'] {
  color-scheme: light;
  --bg: var(--paper-100);
  --bg-raised: var(--white);
  --bg-sunken: var(--paper-200);
  --text: var(--ink-900);
  --text-muted: var(--ink-500);
  --line: var(--paper-300);
  --line-strong: var(--ink-400);
  --accent: var(--brass-600);
  --accent-text: var(--brass-800);
  --rail: var(--brass-700);
  --community: var(--sage-600);
  --danger: var(--clay-600);
  --glass-bg: rgb(245 244 242 / 0.72);
  --shadow-1: 0 1px 2px rgb(0 0 0 / 0.06), 0 4px 12px rgb(0 0 0 / 0.04);
}

/* One mechanism, two selectors. Both copies must be edited together. */
:root[data-theme='dark'] { /* …see below… */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) { /* …identical block… */ }
}
```

The dark block:

```css
color-scheme: dark;
--bg: var(--indigo-950);
--bg-raised: var(--indigo-900);
--bg-sunken: var(--indigo-800);
--text: var(--lamp-100);
--text-muted: var(--slate-400);
--line: var(--indigo-700);
--line-strong: var(--indigo-500);
--accent: var(--brass-400);
--accent-text: var(--brass-400);
--rail: var(--brass-400);
--community: var(--sage-400);
--danger: var(--clay-400);
--glass-bg: rgb(20 26 41 / 0.72);
--shadow-1: none;   /* elevation is lightness on dark, not shadow */
```

**Three states must be correct**: `system` sets no `data-theme` attribute so the
media query decides; explicit `light` is protected from a dark OS by the
`:not([data-theme='light'])` guard; explicit `dark` wins outright. The
duplication between the attribute block and the media block is unavoidable
without a preprocessor — it is one logical block written twice, and both copies
change together.

> `light-dark()` would remove the duplication. It is too new for this audience's
> WebViews; revisit only alongside a real fallback story.

### 1.4 Contrast — measured values

Re-measure with a real tool in both themes from the *rendered* background before
reporting any of these as passing. Arithmetic is not a measurement.

| Pair | Theme | Ratio | Requirement |
| --- | --- | --- | --- |
| `--text` on `--bg` | dark | 14.4:1 | 4.5 ✓ |
| `--text-muted` on `--bg` | dark | 6.87:1 | 4.5 ✓ |
| `--accent` on `--bg` | dark | 9.22:1 | 4.5 ✓ |
| `--text` on `--bg` | light | 14.7:1 | 4.5 ✓ |
| `--text-muted` on `--bg` | light | 5.40:1 | 4.5 ✓ |
| `--accent-text` on `--paper-100` | light | 5.13:1 | 4.5 ✓ |
| `--accent` on `--paper-100` | light | **2.94:1** | fills only — never text, never a marker |
| `--rail` on `--paper-100` | light | 3.57:1 | 3.0 ✓ |
| `--rail` on `--white` | light | 3.93:1 | 3.0 ✓ |
| `--line-strong` on `--bg-sunken` | dark | 3.27:1 | 3.0 ✓ |
| `--line-strong` on `--bg` | dark | 4.16:1 | 3.0 ✓ |
| `--line-strong` on `--white` | light | 3.81:1 | 3.0 ✓ |
| `--line-strong` on `--paper-100` | light | 3.47:1 | 3.0 ✓ |

**Hard rules that follow from the table:**

- **Text on a brass fill is always ink.** `--text-on-accent: var(--ink-900)` in
  **both** themes — the one token that does not change between them. Ink on
  `#E3B666` is 8.57:1 and on `#B8863B` is 5.00:1; warm off-white on the dark
  brass is **1.56:1**, which is why this is a rule and not a taste.
- **`--accent` is fills. `--accent-text` is the only token allowed in a `color:`
  declaration.** `--gold` as body text in `.auth-card a`, `.small-link` and
  `.profile-links` fails on cream today.
- **A control's border is the one place 3:1 non-text contrast is required.**
  `--line-strong` is for control boundaries; `--line` is the much quieter
  hairline for dividers, which carry no such requirement.
- **`--rail` and the nav indicator read the same token**, so the two instances of
  the ribbon can never drift apart. On dark it equals `--accent`; on light it must
  not.

### 1.5 One hue, one meaning

| Hue | Meaning | Where it may appear |
| --- | --- | --- |
| Brass | **your place** | rail, nav indicator, folio numeral, focus ring |
| Sage | **the room** | community marker, prayer confirm, thought count |
| Clay | **destructive** | danger fills, error text |

They never swap, and **no cloth ground or motif may use brass, sage or clay**
(§7.2). Brass never becomes a button fill: a primary button is ink, or brass
stops meaning *your place* the moment it also means *submit*.

---

## 2. Type

Two families, both variable, both through `next/font`.

| Role | Family | Why |
| --- | --- | --- |
| Display **and** reading | **Fraunces** | Already the app's voice; `opsz` is genuinely useful at reading sizes |
| Interface | **Hanken Grotesk** | A humanist grotesque with visible warmth in `a`, `g`, `y` — literary rather than neutral-tech |

**Inter is the documented fallback**, not the default. It is proven here and
Hanken Grotesk is not; if the Yoruba gate below fails, ship Inter and record it.

### 2.1 Subsets — Yoruba is the reason

```ts
subsets: ['latin', 'latin-ext', 'vietnamese']
```

`AGENTS.md` says latin + latin-ext. That is **incomplete for Yoruba**: `ṣ` is
U+1E63 (latin-ext ✓), but **`ẹ` U+1EB9 and `ọ` U+1ECD live in Google's
*vietnamese* block** (U+1EA0–1EF9), as do the combining tone marks U+0300/U+0301.
Requesting only two subsets leaves Yoruba text in a fallback face with the wrong
weight and shape. Verify in a **production** build.

**The gate.** Render this at 14px, 16px and 19px, in both families, in both
themes, and inspect — a fallback face shows as a weight and shape mismatch:

```
Ẹ ọ ṣ ẹ́ ọ̀ ṣ́ Àmín Ọ̀rọ̀ Ẹ̀mí ìgbàgbọ́
```

### 2.2 Roles and scale (rem, root 16px)

| Token | Size / line-height | Family | Weight | Used for |
| --- | --- | --- | --- | --- |
| `--text-display` | 2.75rem / 1.02 | Fraunces | 500 | Home greeting only |
| `--text-title` | 1.875rem / 1.08 | Fraunces | 500 | Page titles |
| `--text-heading` | 1.375rem / 1.2 | Fraunces | 500 | Section headings, card titles |
| `--text-reading` | 1.1875rem / 1.62 | Fraunces | 400 | Lesson and sermon body |
| `--text-body` | 1rem / 1.55 | Hanken | 400 | UI body, list excerpts |
| `--text-ui` | 0.875rem / 1.45 | Hanken | 450 | Buttons, fields, list metadata |
| `--text-label` | 0.75rem / 1.3 | Hanken | 600 | Labels, badges — sentence case |
| `--text-micro` | 0.6875rem / 1.2 | Hanken | 600 | Rail readout, nav labels |

Reading measure `--measure: 34rem` (≈544px at 19px Fraunces ≈ 62–68 characters).
Headings `text-wrap: balance`; paragraphs `text-wrap: pretty`.

### 2.3 Two removals that were the biggest tells

1. **JetBrains Mono is gone.** It existed almost only to set tracked-out uppercase
   eyebrows — a named AI-default cluster tell. `--font-mono` and its
   `@theme inline` mapping go with it. The invite code keeps `tabular-nums` and
   `0.12em` tracking in Hanken.
2. **Decorative eyebrows are gone.** `<Meta>` above `YOUR FORMATION`,
   `GATHERED WORDS`, `AROUND THE TABLE`, `ADMINISTRATION` is decoration. What
   survives is metadata annotating a specific object: a lesson's week, a sermon's
   date and speaker, a relative timestamp.

The gold italic `em` survives in exactly **two** places: your name in the
greeting, and a sermon's second title line. Not in auth headings — "accenting one
word in a headline" is the first tell.

### 2.4 Payload

| Asset | Estimate |
| --- | --- |
| Fraunces variable × 3 subsets | ~110–150 KB woff2 |
| Hanken Grotesk variable × 3 subsets | ~35–55 KB woff2 |
| JetBrains Mono, removed | −30–40 KB |

`unicode-range` means an English-only reader fetches latin alone and pays about a
third; a Yoruba reader pays the extra ~40–60 KB, which is the correct trade.
`font-display: swap` on both. **Measure the real woff2 transfer** and record the
number here.

---

## 3. Space, radius, elevation

### 3.1 Space — 4px base

`--space-1: 4px` · `-2: 8` · `-3: 12` · `-4: 16` · `-5: 24` · `-6: 32` ·
`-7: 48` · `-8: 64`

Group with space before lines: the gap between groups is ≥2× the gap within one.

### 3.2 Radius

`--radius-xs: 2px` (badges, folio square) · `--radius-sm: 6px` (buttons, inputs) ·
`--radius-md: 10px` (cards, cloth plates) · `--radius-lg: 16px` (sheets) ·
`--radius-nav: 20px` (floating nav ≥760px) · `--radius-pill`.

Nested surfaces add the padding to the outer radius.

### 3.3 Elevation

**Per-theme, and that is the point.** On dark indigo a drop shadow reads as
nothing, so dark carries elevation by lightness (`--bg` → `--bg-raised` →
`--bg-sunken`) plus a 1px border, with `--shadow-1: none`.

One shadow survives both themes because it is a **print** gesture, not a light
one: `--shadow-plate: 0 2px 0 var(--line)` — the letterpress edge `paper-card`
already has. Tokenised, used only on cloth plates.

### 3.4 Glass

```css
--glass-bg: rgb(20 26 41 / 0.72);   /* dark  */
--glass-bg: rgb(245 244 242 / 0.72); /* light */
--glass-blur: 12px;
--glass-border: 1px solid var(--line);
```

**Permitted on exactly two surfaces: `.bottom-nav` and `.reading-header`.**
Nowhere else. Never over reading text, and never behind a focused input — which
is why `FormHeader` is the one sticky header without glass.

```css
@supports not (backdrop-filter: blur(1px)) {
  .bottom-nav, .reading-header { background: var(--bg); border-color: var(--line); }
}
@media (prefers-reduced-transparency: reduce) {
  .bottom-nav, .reading-header { background: var(--bg); backdrop-filter: none; }
}
```

### 3.5 Fallbacks for modern syntax — and the trap

`color-mix()`, `oklch()` and `dvh` are newer than the oldest WebView this
audience runs. The mechanism differs by case and **getting it wrong fails
silently**:

| Feature | Pattern | Why it works |
| --- | --- | --- |
| `dvh` | `min-height: 100vh;` then `min-height: 100dvh;` | An unknown unit is **invalid at parse time**, so the declaration is dropped and the earlier one stands |
| `oklch()` in a real property | plain value first, then the `oklch` version | Same — parse-time invalid, dropped |
| `color-mix()` in a real property | `background: var(--glass-opaque);` then the mix | Same rule |

**The trap.** The two-declaration pattern does **not** work for a custom
property. `--glass-bg: rgb(…); --glass-bg: color-mix(…);` stores the `color-mix`
token unconditionally — custom properties are not validated at declaration time —
and an unsupported value then fails at **use** time, where the property becomes
`unset` rather than falling back to the earlier declaration.

> **Rule: token values use hex and `rgb()` only. No `color-mix()`, no `oklch()`
> inside any `--*` property.** Where a mix is genuinely wanted, gate the custom
> property's *declaration* with
> `@supports (background: color-mix(in srgb, red, blue)) { :root { … } }`.

Glass uses concrete `rgb()` values, so it needs no `@supports` for its colour at
all. Also in play, each needing a fallback or graceful degradation: `text-wrap:
pretty`, `:has()`, `text-box: trim-both`, individual `translate`/`scale`
properties.

---

## 4. Motion

`--dur-fast: 120ms` · `--dur-base: 200ms` · `--dur-slow: 320ms` ·
`--ease-out: cubic-bezier(0.2, 0, 0, 1)`.

Every transition **names its properties**. `transition: all` appears nowhere.

### 4.1 The closed list of what animates

| Moment | Motion | Why it earns it |
| --- | --- | --- |
| Home greeting, on load | The name settles: 300ms opacity + 12px `translateY`; the rest follows 100ms later, once | The app's one staged entrance |
| Lesson reading rail | Length tracks real scroll position | Answers the reader's own movement |
| Nav indicator, on tab change | 240ms `translateX` of one bar | Answers a tap and shows where you moved to |
| Theme switch | All transitions suppressed for one frame | Otherwise every colour transition fires at once and smears |
| New margin note (once the composer exists) | 8px rise over 200ms | Answers a submit |

**No blurred text anywhere**, including the greeting. A `filter: blur()` in a
transition is re-rasterised every frame on the compositor's least reliable path,
and the greeting is the first thing painted on the slowest connection this
audience has. Blur belongs on surfaces, never on type.

### 4.2 What deliberately does not animate

**The nav icon swap.** Tab switches are a high-frequency interaction and get no
animation; icons swap instantly and the moving bar carries the transition.

Reduced motion turns the remaining three into an opacity cross-fade or nothing,
and each leaves a static cue — a colour, a length, a position.

### 4.3 The reading rail — ref + rAF, `transform` not `height`

Three faults to avoid, all present in the current implementation:

1. It opens at a **hard-coded `18`**, so the app claims you are 18% through on
   arrival. **The rail starts at 0.**
2. A non-passive, unthrottled scroll listener calls `setProgress`, re-rendering
   the whole component **on every scroll event**.
3. It animates `height`, forcing layout every frame. On the budget Android phones
   this audience uses, that is the most expensive thing on the page.

The correct shape — no state, no re-render, no layout:

```tsx
const railRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  const el = railRef.current
  if (!el) return
  let frame = 0
  const measure = () => {
    frame = 0
    const max = document.documentElement.scrollHeight - window.innerHeight
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    el.style.setProperty('--progress', String(p))
    el.dataset.percent = String(Math.round(p * 100))
  }
  const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure) }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  measure()
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  }
}, [])
```

```css
.reading-rail {
  position: fixed; inset-block-start: 0; inset-inline-end: var(--space-3);
  inline-size: 4px; block-size: var(--rail-h);
  background: var(--rail); transform-origin: top;
  transform: scaleY(var(--progress, 0));
}
```

Only `transform` and `--progress` change, so the work is compositor-only. The `%`
readout is written through the same ref (`data-percent`, rendered via
`content: attr(data-percent)` or a sibling ref) so it never enters React state,
and it gets `tabular-nums` so it does not jitter. Add `will-change: transform`
**only** after first-frame stutter is actually observed, and name `transform`,
never `all`.

---

## 5. Layout

Mobile first. Verify at **360px, 768px and desktop**.

### 5.1 Chrome

| Element | Spec |
| --- | --- |
| `.page-wrap` | `max-width: 720px`, centred, `padding-inline: var(--space-5)` (20px at 360px) |
| Content bottom padding | `calc(var(--nav-h) + var(--space-5))` — from a token, not the current hard-coded `88px` |
| `--nav-h` | `calc(56px + env(safe-area-inset-bottom))` |
| `scroll-padding-block-start` | the sticky header's height, so an anchored target or a focused field never lands under it |
| Touch targets | ≥44px, always |
| Horizontal scroll | Never |

`100vh` is always written as the fallback pair with `100dvh` (§3.5).

### 5.2 Bottom navigation

```
┌──────────────────────────────────────────────┐
│   ▁▁▁                                        │  ← brass slide bar, 3px,
│  ⌂    ▭    ▤    ◌    ☺                       │    translateX, 240ms
│ Home Classes Sermons Discuss Profile          │
└──────────────────────────────────────────────┘
```

Five destinations, labels unchanged — the routes exist and the words are the
users' words.

- **One size, one stroke.** 22px at `strokeWidth={1.7}` inactive → `{2}` plus
  `fill="currentColor"` active. Mixing `size={19}` with `2.3`/`1.7` reads as two
  icon sets.
- **Three redundant state signals**: colour, weight/fill, and the bar. Colour is
  never the only carrier.
- **Labels always visible.** Icon-only nav fails the everyday member.
- The indicator is **one absolutely-positioned element driven by `transform`**,
  not a `::before` on the current item. The `::before` renders correctly today,
  but it cannot animate between items, which is what the brief asks for.
- `-webkit-tap-highlight-color: transparent`, since each item draws its own
  pressed state. Hover styling only inside `@media (hover: hover)`.

### 5.3 Headers — four variants

| Variant | Contents | Used on |
| --- | --- | --- |
| `Header` | Brand mark + theme toggle | Home, Classes, Sermons, Discuss |
| `ReadingHeader` | Back + the lesson's week; sticky, glass | Lesson and sermon reading |
| `FormHeader` | Back + the screen's own title; sticky, **no glass**, nav not rendered | The authoring routes |
| `AuthHeader` | Brand mark only | Auth screens |

The header bell is removed: no table, no concept, no route. The reading header
loses its `⋯` button, which has no menu behind it.

### 5.4 One sticky element per screen

| Screen | Sticky element |
| --- | --- |
| Lesson / sermon reading | `ReadingHeader` (glass, solid fallback) |
| Authoring routes | `FormHeader` up top, action bar at the foot, in place of the hidden nav |
| Other forms (admin, class manage) | Nothing — they scroll, and keep the nav |
| Lists | None — the title scrolls away |
| Home | None |

### 5.5 The authoring routes

**"Form screen" means an authoring route**, not "a page with a form on it". The
set is `/author/lessons/new` and `/author/lessons/[id]` — a single long form with
one primary action and a sticky bar. They are matched through **one exported
constant** in `lib/nav.ts` (a prefix test on `/author/lessons/`), so the rule
cannot drift and `/author/lessons` itself — the list — keeps its nav.

Admin pages (`/admin/classes`, `/admin/members`, `/admin/invite`) and
`/classes/manage` are **not** in the set: they are lists of objects with inline
forms, several primary actions on one screen, and the member moves between them.

On the two authoring routes the bar occupies the bottom edge with the same
safe-area padding, so a 360px phone never gets a two-row footer or two competing
primaries. `FormHeader`'s back control is the only way out, so it is always
present.

---

## 6. Components

One name per concept. **Reuse an existing class before adding a new one**, and
document anything new here in the same change.

### 6.1 `.btn`

| Variant | Fill | Use |
| --- | --- | --- |
| `.btn--primary` | `--text` on `--bg` (ink on paper, paper on ink) | Exactly one per view |
| `.btn--secondary` | transparent, 1px `--line-strong` | Peer actions |
| `.btn--quiet` | borderless, `--accent-text` | Inline text actions |
| `.btn--danger` | transparent, 1px `--danger` | Destructive, never beside Save |
| `.btn--icon` | transparent, 44×44 | Icon-only; always has an accessible name |

**The primary is ink, not brass** — brass stays reserved for *your place*.

States: rest · hover (hover-capable only) · pressed `scale(0.96)` over 150ms
`--ease-out`, excluded on `:disabled` · `:focus-visible` 2px `--focus-ring` at 2px
offset · disabled (0.55 opacity, no scale) · **pending with the label changing**
(`Save draft` → `Saving…`), `aria-busy`, and a `min-width` so the button does not
resize.

> `.primary-button` is currently declared **three times** in `globals.css` with
> different backgrounds and paddings. Whichever wins is an accident of source
> order. Collapse to one definition.

### 6.2 `.card`

`.card` (plain) and `.card--plate` (carries cloth; `--shadow-plate`,
`--radius-lg` outer with `--radius-md` inner). Border for structure, shadow for
the plate edge only.

### 6.3 `.field`

Label above in sentence case, control at `--radius-sm` with a `--line-strong`
border, **16px text on mobile** (below that iOS Safari zooms on focus), min-height
44px. Hints sit under the label, not in the placeholder — a placeholder vanishes
the moment someone types.

**Errors say what to do**: "Lesson numbers run from 1 to 99", never "Invalid
input". Validating fields **reserve their status line** at a fixed height, so a
message appearing does not shift every field below it and cause a mis-tap.

### 6.4 `.badge`

Sentence case, `--text-label`, `--radius-xs`, tinted background + border + **a 5px
dot**, so state is never colour-only. Replaces mono-uppercase `ACTIVE` /
`INACTIVE` / `DRAFT` / `PUBLISHED`.

### 6.5 `.row`

One component for lesson, class, sermon, roster and library rows.
`.row--folio` (leads with the numbered folio square) · `.row--plate` (cloth
thumb) · `.row--plain`.

States: rest · hover · `:active` background step · current · deactivated (renders
`.row--plain` with no chevron, rather than an unreachable link).

`.folio` is the lesson numeral: `--radius-xs`, `--text-heading`, Fraunces. It is
the lesson's identity and leads — `week` and `number` never compete for the same
weight.

### 6.6 `.empty`

Gains an **action slot** and loses its `eyebrow` prop. The eyebrow was decoration
and produced the duplicated-heading defect on Sermons.

```
before                                     after
─────────────────────────────────────      ─────────────────────────────────────
GATHERED WORDS          ← repeated         No sermon notes yet
No sermon notes yet                        Notes appear here after each
Sermon notes will appear here…             gathering.
                                           [ Write up this week's notes ]  ← admin
```

An empty state invites action. If there is nothing the reader can do, it says
what will happen and when — it never invents continuity ("pick up right where you
left off") the app cannot know.

### 6.7 `.sheet`

On native `<dialog>` + `showModal()`, which gives the focus trap, `::backdrop` and
Esc-to-close with no dependency. `--radius-lg`, `overscroll-behavior: contain`.

Replaces every `window.confirm` — five in `lesson-form.tsx` (lines 121, 136, 147,
166, 207) and those in `admin-classes-view` and `class-manage-view` — which drop
an OS dialog into an otherwise-designed app.

`window.location.reload()` after a successful save is the deliberate,
documented pattern; keep it.

### 6.8 `CoverCloth`

See §7.

---

## 7. Imagery — generated cloth, not photographs

### 7.1 The component

**`CoverCloth`**: one server component, pure inline SVG, no network, no
dependency. It hashes the seed (a class, lesson or sermon id) into four
deterministic choices and draws a woven-textile plate — the visual vocabulary of
indigo adire and aso-oke:

```
seed ─┬─ ground     : one of 6, from the cloth arc only (§7.2)
      ├─ motif      : one of 8 (arcs, comb, chevron, dot grid, diamond, wave, star, cross-band)
      ├─ rhythm     : stripe count 3–9, from a second hash of the seed
      └─ rotation   : 0° / 90° / 180°, so two same-motif plates never mirror exactly
```

Constraints for low-end Android: **≤30 SVG nodes per plate**, no filters, no
gradients-with-blur, no animation, integer coordinates. Deterministic, so a class
keeps its cloth forever and people learn to recognise it.

### 7.2 Grounds are restricted to hues nothing else owns

Brass means *your place*, sage means *the room*, clay means *destructive*. If any
of them also appeared as a cloth colour, the meanings would dissolve.

- Grounds live **only on the indigo → blue-violet → violet → plum → aubergine arc,
  plus one undyed neutral**: `#283A63`, `#39386B`, `#4A3568`, `#573453`,
  `#45273E`, and stone `#4A4741`.
- **No cloth plate may contain brass, sage or clay at all**, in ground or motif.
  The motif ink is a lighter step of its own ground, paired in the generator's map
  so no CSS colour mixing is involved.
- The rule generalises: a future cloth colour must sit **at least 40° away** from
  brass (~40°), sage (~130°) and destructive clay (~20°) in hue.

### 7.3 Where each surface gets cover art

| Surface | Treatment | Reasoning |
| --- | --- | --- |
| Class | Full plate, 16:9 on cards, 4:5 on the class header | A class is a shelf; it deserves a spine |
| Lesson | **A 6px cloth band, plus the rail** — not a big image | A lesson is a reading surface. A hero image above body text is a blog tell, and on a 360px phone it pushes the first line of the Word below the fold |
| Sermon | 16:9 letterbox plate | A sermon is a dated object — a bulletin |
| Profile | The avatar becomes a **bookplate**: initials stamped in a cloth ring | A library card rather than a social avatar |
| Library rows | A 3px cloth edge, not a plate | 20 inline SVGs in a list would bloat the DOM for no gain |

**Real photos later:** nothing structural. Only a church's own material — a
building, a logo, series art — on a nullable `cover_url`, with cloth as the
fallback so nothing renders empty. `next.config.mjs` sets
`images.unoptimized: true`, which must be revisited then.

### 7.4 The preview sheet is a gate

Before any screen renders a plate, `/dev/cloth` renders **every ground × every
motif** at the real sizes (16:9 card, 4:5 header, 16:9 letterbox, 6px band, 3px
row edge, bookplate ring), seeded with **real ids from the database**, in **both
themes** side by side.

`proxy.ts` gates a fixed list, so `/dev/cloth` is public unless added to that
list. **Put it in the gate behind an admin check, and delete the route at the end
of Batch 3.** It is scaffolding, not a surface.

Reviewing it decides three things that should not be guessed: whether six grounds
are visually distinct at 3px; whether the deep plates are too heavy on light (if
so, light gets a lighter plate set); and whether any motif reads as a logo or a
flag.

---

## 8. Voice and honesty

These are product rules, not style preferences, and they are the reason a Batch 1
exists at all.

- **Never ship a control that does nothing.** Wire it or remove it. A dead
  `.icon-button`, a heart that can never increment, a tab that never switches —
  all are defects, not placeholders.
- **Never show a hard-coded figure as data.** `3 THOUGHTS`, `18%`, `LESSONS 0`
  are lies the UI tells. Every number traces to a query.
- **A label must match its data.** If a query orders ascending and returns the
  first row, the label is not `CONTINUE READING`.
- **A disabled control states its reason in visible text beside it.** A disabled
  button is not focusable, so a tooltip would never be announced.
- **A skeleton, not a spinner**, for content of known shape.
- **One job and one primary action per screen.** A button that adds a repeater row
  belongs with the repeater, not in the footer beside Save; a destructive action
  belongs at the end, not one slip from the primary.
- **Reading text is the most comfortable text in the app.** Nothing decorative
  goes above it, and nothing blurs behind it.

---

## 9. Rules that each caught a real bug

Keep these; they are cheap and they were expensive to learn.

1. **No CSS rule may target a bare element tag inside a component block.**
   `.lesson-index > span` (0-1-1) silently outranked `.meta` (0-1-0) and rendered
   the `Week 1` label as 27px gold serif. Style by class. This trap is one
   keystroke away on every new component.
2. **Token values use hex and `rgb()` only** — no `color-mix()`, no `oklch()` in a
   `--*` property (§3.5).
3. **Text on a brass fill is always ink** (§1.4).
4. **A control's border reaches 3:1 against the surface it sits on**, and the
   surface it *actually* sits on is the one to measure (§1.4).
5. **Server Actions return `{ error: string | null }`, never throw.** Next.js
   redacts a thrown Server Action message in production: it looks fine in
   `npm run dev` and becomes a useless generic error once deployed. A converted
   action also needs its **call site** to handle the returned error, or a throw
   just becomes a silently-dropped result.
6. **Time-of-day logic names its timezone** through `Intl.DateTimeFormat`, and any
   zone from a request header goes through `safeTimeZone()` first — an unknown
   zone throws a `RangeError` that takes down the whole page render.
7. **`Intl.DateTimeFormat` is not the only thrower.** Anything derived from a
   request header is untrusted input.

---

## 10. Not yet built

Designed here so the feature work slots in without another redesign. **None of
this exists yet, and none of it may be rendered as a control until its backend
does.**

1. **Bookmarks, and the ribbon as a real save.** A `bookmarks` table (`user_id`,
   nullable `lesson_id`, nullable `sermon_id`, `created_at`, a constraint that
   exactly one target is set) with own-row read/insert/delete RLS. Returns three
   things: the reading-header save toggle, the sermon bookmark button, and
   `Bookmarked notes` in the library. **This is what makes the ribbon mean
   *kept*, not only *where I am*.**
2. **Per-user lesson progress.** `lesson_progress` (`user_id`, `lesson_id`,
   `percent`, `last_read_at`, PK on user+lesson), own-row RLS. Returns the rail
   stub on the `/home` card, the current-lesson marker in rows, a truthful
   `CONTINUE READING`, the `LESSONS` stat, and an honest `% READ`. Together with
   item 1 this is the **full four-instance ribbon system**.
3. **Reflections as a real surface.** No library rows render yet: the list
   (`insights` where `author_id = you`, joined to lesson titles) and editing
   (`updateInsight` / `deleteInsight` exist, unused) both wait for their batch.
4. **Reading settings that sync across devices.** Cookies cover one device; a
   `reading_settings` table carries them across.
5. **Hearting.** `insights.hearts` and `discussions.hearts` are real columns with
   nothing that increments them, which is why the affordances are removed now.
   Needs a conflict-safe increment, an own-heart row, and an un-heart.
6. **Replies.** `createDiscussionReply` / `updateDiscussionReply` /
   `deleteDiscussionReply` all exist with no UI.
7. **Notifications.** The bell, as a feature.
8. **Authoring surfaces that are missing.** `createSermon` / `publishSermon`,
   `createPrayerPoint` / `publishPrayerPoint` (members can write draft prayers and
   have no screen to do it on), and `createDiscussionTopic` are wired server-side
   and unreachable from the UI.
9. **Author-supplied cover photography.** A nullable `cover_url` on `classes`,
   `sermons` and `lessons`, cloth as the fallback, `next/image` with explicit
   dimensions, and a decision about `images.unoptimized: true`.
10. **A Library tab or route.** Revisit once 1–3 exist. The Profile sections
    built then are the content that would move.

**Scaffolding currently in the tree:** `components/cover-cloth.tsx` and the
admin-only `/dev/cloth` preview route exist as the cloth gate. No production
screen renders a plate yet, and both the route and its scaffolding CSS are
deleted when the plates land.

---

## 11. Changing this document

- Update **here first**, then the code, in one change — never the reverse.
- Every token, class and rule documented must exist in `globals.css` when the
  change lands. Nothing aspirational in §1–§8; aspirational work goes in §10.
- A new component class is documented in §6 and in `AGENTS.md` if it carries a
  rule rather than just a style.
- Anything in §9 needs a bug behind it. Don't add speculation.
