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
> Read §1–§8 as a description of the system as it is. The Classes index and
> class detail redesign are implemented in §6.9–§6.10; their validation boundary
> is recorded in §6.11. Home's Batch 3 composition is recorded in §10.1.
> The lesson composer (`createInsight`), Profile library rows (`Edit profile`,
> reflections, reading settings), and sermon sub-tabs remain unbuilt until their
> own change. The retained `CoverCloth` gate is not permission to expand scope.

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
`--focus-ring` · `--glass-solid` · `--glass-fill` · `--glass-border`

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
  --glass-solid: rgba(248, 247, 244, 1);
  --glass-fill: rgba(248, 247, 244, 0.92);
  --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.04);
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
--glass-solid: rgba(24, 32, 54, 1);
--glass-fill: rgba(24, 32, 54, 0.94);
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

Two production families, both self-hosted through `next/font/local`: one static serif and one variable sans.

| Role | Family | Content contract |
| --- | --- | --- |
| Display | **Berean Serif** | Headings, including live names and titles; complete Home greeting; folio numerals; scripture quotations |
| Interface and body | **Hanken Grotesk** | Controls, metadata, descriptions, prayers, thoughts, summaries and long-form reading prose |

Display role overrides content origin. Berean Serif is a static 600 normal, optical-size-20 instance; never request or synthesize another serif weight or style. Hanken remains the 100–900 variable interface face. Do not use `:lang()` for font routing. Class-detail names and lesson titles now follow the display rule; descriptions, leader lists and metadata remain Hanken.

### 2.1 Subsets and the Yoruba gate

Production loading is intentionally asymmetric:

```ts
localFont({
  src: './fonts/berean-serif/BereanSerif-SemiBold.woff2',
  variable: '--font-serif',
  weight: '600',
  style: 'normal',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Times New Roman',
})
localFont({
  src: './fonts/hanken/HankenGrotesk-Yoruba.woff2',
  variable: '--font-interface',
  weight: '100 900',
  display: 'swap',
  preload: true,
})
```

Berean Serif owns display headings, the complete greeting, folios and scripture quotations. The single combined local Hanken variable font owns body and interface text, so base letters and combining marks cannot be separated by Google unicode-range files. The production gate checks realistic Yoruba clusters
across precomposed acute/grave forms, decomposed mark sequences and plain letters
rather than treating an invalid consonant-plus-tone sample as orthography.

The admin-only `/dev/cloth` gate compares production Berean Serif and local Hanken with route-local Google-split Hanken and Source Serif 4 controls. Noto Serif and Fraunces are removed. No control font ships on production screens.

Render the exact NFC string and inspect each difficult cluster at 14px, 16px,
19px, 22px, 24px, 30px and 32px in both themes:

```
m̀ M̀ ḿ Ḿ ǹ Ǹ Ń ń Ẹ́ Ọ̀ ẹ̄ ṣ Ṣ ọ ẹ ị ụ ṅ Àmín Ọ̀rọ̀ Ẹ̀mí ìgbàgbọ́
```

Also render individually inspectable `m̀`, `M̀`, `ḿ`, `Ḿ`, `ǹ`, `Ǹ`, `Ń`, `ń`,
`Ẹ́`, `Ọ̀`, `ẹ̄`, `ṣ`, `Ṣ`, `ọ`, `ẹ`, `ị`, `ụ` and `ṅ`. Keep `ɓ`, `ɗ`, `ƙ`
and `₦` as separately labelled known production coverage gaps. Keep one separately
labelled `ṣ́` row as an invalid-orthography diagnostic; it is not valid Yoruba
orthography because tone marks sit on vowels and syllabic nasals. A labelled NFD
`n` + U+0301 diagnostic sits beside NFC `ń` to make the normalization requirement
observable. Use Chrome Rendered Fonts and cold-cache network requests from a
production build; record physical resources, mark placement, spacing, line metrics
and exact transfer weights. NFC consistency is a data-integrity rule, not a shaping
repair.

The gate also renders real profile/leader names in the complete Berean Serif Home greeting composition.

**Production result, 2026-10-31 — combined local Hanken.** Chrome Rendered
Fonts kept all 18 realistic clusters entirely in Hanken Grotesk: `m̀`, `M̀`, `ḿ`,
`Ḿ`, `ǹ`, `Ǹ`, `Ń`, `ń`, `Ẹ́`, `Ọ̀`, `ẹ̄`, `ṣ`, `Ṣ`, `ọ`, `ẹ`, `ị`, `ụ`
and `ṅ`. The Hanken interface/body contract therefore **passes**. The NFD `n` +
U+0301 diagnostic and the separately labelled, invalid-orthography `ṣ́` row also
stay in the combined Hanken file.

The known upstream gaps `ɓ`, `ɗ`, `ƙ` and `₦` fall back to Arial; they are labelled
as exceptions and are not part of the realistic Yoruba contract. In particular,
both `ɓ` and `₦` were confirmed as browser fallbacks. The route-local Google-split
control still falls back to Arial for `m̀`, `M̀`, `ḿ`, `Ḿ`, `ǹ`, `Ǹ`, `ṣ`, `Ṣ`,
the NFD diagnostic and invalid `ṣ́`; it keeps the other ten realistic clusters in
Hanken. This split-control failure and local-font pass isolate unicode-range
splitting as the cause rather than Hanken's available Yoruba glyphs.

Source Serif 4 remains only as the route-local upstream split control for Berean Serif. It is not a production candidate.

**Automated production-browser result, 2026-11-04 — Berean Serif and Hanken.** Chrome Rendered Fonts kept all 18 realistic clusters and the full NFC phrase at every tested 14–32px size entirely in the expected local production face in both theme scopes. Berean uses `BereanSerif-SemiBold`; Hanken uses `HankenGrotesk`. The NFD `n` + U+0301 diagnostic and invalid-orthography `ṣ́` row also remain in their respective local files. The labelled coverage gaps `ɓ`, `ɗ`, `ƙ` and `₦` fall back to Times New Roman for Berean and Arial for Hanken.

The 44px and 70px production samples have no visible mark clipping at line-height 1.05. A separate two-line capital stress fixture compares 1.05 and 0.98 at both sizes: the tighter setting crowds adjacent stacked marks, so production retains 1.05. Canvas ink bounds exceeding a line box do not, by themselves, establish clipping; the verdict uses the rendered samples. The 24px scripture sample remains selected over 22px for its more comfortable reading texture. Both quote sizes wrap to two lines in the 360px gate and one line at 768px.

The six-screen automated matrix passes 360px, 768px, 320px reflow and CSS 200% resize in both themes after the preview-width fix. The reader remains Hanken 18px/1.65 with a 530px measure, approximately 65 characters per line for the sampled prose. Delaying font responses by one second on four cold Home loads produced a maximum observed layout-shift sum of 0.000061. See `docs/typography-audit-2026-11-04.md` for scope and exceptions. These are automated observations, not the developer's signed-in browser/RLS sign-off required by `AGENTS.md`.

### 2.2 Roles and scale (rem, root 16px)

| Token | Size / line-height | Family | Weight | Used for |
| --- | --- | --- | --- | --- |
| `--text-display` | 2.75rem / 1.05 | Berean Serif | 600 | Complete Home greeting and Classes index title |
| `--text-title` | 1.875rem / 1.08 | Berean Serif | 600 | Class, lesson and sermon content titles |
| `--text-heading` | 1.375rem / 1.2 | Berean Serif | 600 | Section and compact display headings |
| `--text-reading` | 1.1875rem / 1.62 | Hanken | 400 | Long-form reading prose |
| `--text-body` | 1rem / 1.55 | Hanken | 400 | UI body and all live list/card text |
| `--text-ui` | 0.875rem / 1.45 | Hanken | 450 | Buttons, fields, list metadata |
| `--text-label` | 0.75rem / 1.3 | Hanken | 600 | Labels and badges |
| `--text-micro` | 0.6875rem / 1.2 | Hanken | 600 | Rail readout and nav labels |

Reading measure remains `--measure: 34rem`. Fixed headings use `text-wrap: balance`;
paragraphs use `text-wrap: pretty`. Heading and quote roles may render live values in Berean Serif; summaries, descriptions and prose remain Hanken. The single-line `--text-title` table entry uses 1.08, but the wrapped class-detail title overrides it to 1.2 leading (never below 1.15). From 768px its 224px cover uses `--text-heading` at the same 1.2 leading. Classes shelf titles use `--text-body` at 1.3. These are explicit family/weight/size/line-height declarations, not `--type-*` or `--tracking-*` aliases.

### 2.3 Resolved role map

- Berean Serif 600 normal: display headings and names, scripture quotations, folio numerals and brand marks.
- Hanken: controls, metadata, descriptions, summaries, prayers, thoughts, posts, margin notes, loading copy and long-form lesson/sermon prose.
- Classes index/detail titles and lesson titles use Berean; leader lists, metadata, descriptions and access/empty notes use Hanken.

### 2.4 NFC and identifiers

Human-readable content is trimmed and NFC-normalized at write boundaries, with a
defensive read normalization for legacy values. The normalization change lands in
its own commit. It never rewrites IDs, existing slugs, URLs, email addresses,
passwords, auth/session values, invite codes or usernames.

Usernames keep their separate canonical rule: trim, lowercase, null when empty,
validate `^[a-z][a-z0-9_]{2,19}$`, and enforce uniqueness on `lower(username)`.

### 2.5 Payload

Berean Serif and Hanken each preload one local WOFF2. Google-split Hanken and Source Serif 4 exist only on the admin preview route; Noto Serif and Fraunces are retired.

Berean Serif is a Modified Version of Source Serif 4 under SIL OFL 1.1, renamed because “Source” is a Reserved Font Name. The static file is `wght` 600, `opsz` 20, 41,776 bytes, SHA-256 `7dfcc4fe15ec96ace5baed7003cfc09089d90ba5f567b7d7c6c61c3c0082122c`. Never call the production family “Source Serif.”

The local asset is derived from the official Google Fonts OFL source at commit
`6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec`:

- source: `https://github.com/google/fonts/blob/6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec/ofl/hankengrotesk/HankenGrotesk%5Bwght%5D.ttf`;
- source SHA-256: `813b3f8fa0965405669a89b38e51bbefd95eef6b8e20d1cb2d8c10cce062662f`;
- output: `app/fonts/hanken/HankenGrotesk-Yoruba.woff2`, 48,268 bytes (47.1 KiB);
- output SHA-256: `035c16d66e238e3b50747094e5a0040afb7d6e1e64db0fa86353d991df225c88`;
- variable axis: `wght` 100–900; license: SIL OFL 1.1 in the adjacent `OFL.txt`.

The exact one-off build command recorded in `app/fonts/hanken/PROVENANCE.md` is:

```sh
python build-hanken-yoruba.py "HankenGrotesk[wght].ttf" HankenGrotesk-Yoruba.woff2
```

The supplied asset and provenance files are immutable inputs to the app; fontTools
and Brotli are not application dependencies.

| Route / family | Scope | Files requested | Encoded bytes | KiB |
| --- | --- | ---: | ---: | ---: |
| Berean Serif static 600 | production | 1 | 41,776 | 40.8 |
| Hanken combined variable | production | 1 | 48,268 | 47.1 |
| `/home` production total | production | 2 | 90,044 | 87.9 |
| Google control fonts beyond production | `/dev/cloth` only | 7 | 206,620 | 201.8 |
| `/dev/cloth` total | admin preview | 9 | 296,664 | 289.7 |

A cache-disabled production `/home` load requests exactly the two local app fonts once each, with no service worker: Berean Serif reports `content-length: 41776`, `encodedBodySize: 41776`, `decodedBodySize: 41776` and `transferSize: 42076`; Hanken reports `content-length: 48268`, `encodedBodySize: 48268`, `decodedBodySize: 48268` and `transferSize: 48568`. The encoded body total is 90,044 bytes and the browser-reported `transferSize` total is 90,644 bytes. No Fraunces, Google, Source Serif or control-font request appears on `/home`. The same cold-cache audit reports 296,664 encoded bytes and 299,364 transferred bytes for the nine `/dev/cloth` fonts; every response is HTTP 200. Home exposes exactly two unique font preloads. Re-enabling the cache and client-navigating Home → Classes → Home makes no font request and no full-document navigation. Route manifests may list fewer preload candidates than rendered control rows ultimately request.

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

Real `backdrop-filter` is permitted on exactly `.bottom-nav` and
`.reading-header`. Authoring headers are solid. Class detail has opaque faux-glass
chips over cloth, not a sticky header surface. The moving nav capsule and cloth
captions are also faux material with no filter.

```css
/* light */
--glass-solid: rgba(248, 247, 244, 1);
--glass-fill: rgba(248, 247, 244, 0.92);
--glass-sheen-top: rgba(255, 255, 255, 0.28);
--glass-sheen-bottom: rgba(255, 255, 255, 0);
--glass-border-color: rgba(22, 32, 58, 0.14);
--glass-inset-highlight: rgba(255, 255, 255, 0.72);
--glass-inset-shade: rgba(22, 32, 58, 0.08);
--glass-shadow: 0 8px 24px rgba(22, 32, 58, 0.10), 0 2px 6px rgba(22, 32, 58, 0.06);
/* dark */
--glass-solid: rgba(24, 32, 54, 1);
--glass-fill: rgba(24, 32, 54, 0.94);
--glass-sheen-top: rgba(240, 233, 220, 0.10);
--glass-sheen-bottom: rgba(240, 233, 220, 0);
--glass-border-color: rgba(255, 255, 255, 0.16);
--glass-inset-highlight: rgba(240, 233, 220, 0.14);
--glass-inset-shade: rgba(0, 0, 0, 0.28);
--glass-shadow: none;
/* shared */
--glass-blur: 12px;
--glass-saturate: 1.6;
--glass-border: 1px solid var(--glass-border-color);
```

Declare the solid color first. Apply the fill and capped blur only inside a
standard/WebKit support block nested under `prefers-reduced-transparency:
no-preference`. Under `reduce`, restore the solid color; the gated filter rule is
absent, so both filter spellings compute to `none`. Never place glass behind
reading text or a focused field, nest filtered surfaces, or animate blur.

The token name is `--glass-fill` everywhere; `--glass-bg` is retired.

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
property. `--glass-fill: rgb(…); --glass-fill: color-mix(…);` stores the `color-mix`
token unconditionally — custom properties are not validated at declaration time —
and an unsupported value then fails at **use** time, where the property becomes
`unset` rather than falling back to the earlier declaration.

> **Rule: token values use hex, `rgb()` or comma-form `rgba()`. No `color-mix()`,
> no `oklch()` inside any `--*` property.** Where a mix is genuinely wanted, gate the custom
> property's *declaration* with
> `@supports (background: color-mix(in srgb, red, blue)) { :root { … } }`.

Glass uses concrete comma-form `rgba()` values, so it needs no `@supports` for its colour at
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
| Nav capsule, on tab change | `280ms` transform-only translation | Answers a tap and shows the active destination |
| Shelf | User-driven native scroll/snap | Answers direct manipulation; no timer or carousel controls |
| Button/card press | Short scale/color response | Answers the press |
| Lesson reading rail | Length tracks real scroll position | Answers the reader's own movement |
| Theme switch | All transitions suppressed for one frame | Prevents a full-page colour smear |

No greeting entrance, staggered cards, looping loader, decorative motion or blur
animation is added. Blur belongs on surfaces and is never animated.

### 4.2 Reduced motion

Reduced motion makes the capsule position change immediately, removes press
scaling, and changes the shelf to ordinary horizontal overflow without snap. The
reading rail remains direct scroll feedback and the theme switch still suppresses
transitions for one frame. Every motion leaves a static position, colour or length
cue.

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
| `.page-wrap` | `max-width: 720px`, centred, including its gutters. Legacy screens use 20px below 760px; Classes index/detail scope their gutters to `var(--space-5)` (24px) at every width. |
| Content bottom padding | `calc(var(--nav-h) + var(--space-5))` — from a token, not the current hard-coded `88px` |
| `--nav-h` | `calc(64px + env(safe-area-inset-bottom))` |
| `scroll-padding-block-start` | the sticky header's height, so an anchored target or a focused field never lands under it |
| Touch targets | `--touch-target: 44px`; targets never render smaller |
| Horizontal scroll | Never |

`100vh` is always written as the fallback pair with `100dvh` (§3.5).

### 5.2 Bottom navigation

Five destinations, labels unchanged — the routes exist and the words are the
users' words. Mobile is edge-to-edge at 64px plus the bottom safe area, with only
a block-start edge border and no outer shadow. From 768px the nav becomes a
centred floating pill, no wider than 560px and 16px above the safe area, with a
full border and the theme's glass shadow.

- **One size, one stroke.** 22px at `strokeWidth={1.7}` inactive → `{2}` plus
  `fill="currentColor"` active. Mixing `size={19}` with `2.3`/`1.7` reads as two
  icon sets.
- **Three redundant state signals**: primary text, heavier/filled icon, and the
  capsule. Colour is never the only carrier.
- **Labels always visible.** Icon-only nav fails the everyday member.
- `.nav-capsule` is one aria-hidden, pointer-transparent faux-glass element
  behind the active link. `--active-index` moves it between equal columns using
  transform only; the capsule never receives `backdrop-filter`.
- `-webkit-tap-highlight-color: transparent`, since each item draws its own
  pressed state. Hover styling only inside `@media (hover: hover)`.
- Reduced motion makes the capsule jump immediately and removes link/capsule
  press scaling. Focus rings remain above the capsule.

### 5.3 Headers — four shared variants and class detail

| Variant | Contents | Used on |
| --- | --- | --- |
| `Header` | Brand mark + theme toggle | Home, Classes, Sermons, Discuss |
| `ReadingHeader` | Back + the lesson's week; sticky, glass | Lesson and sermon reading |
| `FormHeader` | Back + the screen's own title; sticky, **no glass**, nav not rendered | The authoring routes |
| `AuthHeader` | Brand mark only | Auth screens |
| `.class-detail-header` | Back chip + theme chip over cloth, not sticky; no compact title echo | Class detail |

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
| Class detail | None — the chips and full title scroll with the content-sized hero |

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
A numbered lesson uses `.row` with a `.folio` child; there is no `.row--folio`
CSS definition. `.row--plate` supplies the cloth-leading Classes index row;
`.row--plain` is the plain variant.

States: rest · hover · `:active` background step · current · deactivated (renders
`.row--plain` with no chevron, rather than an unreachable link).

`.folio` is the lesson numeral: `--radius-xs`, `--text-heading`, Berean Serif 600. It is
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

### 6.9 `.class-detail`

The singular class route has one full identity, not a compact header echo.
`.class-detail-main` contains the existing 720px `.page-wrap` as
`.class-detail__wrap`, with 24px gutters. Below 768px the `.class-detail__hero`
bleeds to the column edges. Its grid holds `.class-detail-header`, a minimum
48px cloth gap, and the caption. Mobile top padding adds
`env(safe-area-inset-top, 0px)` to `--space-5`; the 768px cover resets to its
normal `--space-3` inset. Only the absolutely positioned
`.class-detail__art` clips; the hero and its meaningful children are not hidden
from assistive technology.

From 768px the hero is a 224px cover beside a 424px grouped content column, with
24px between them. The cover has a **3:4 minimum height, not a fixed aspect-ratio
constraint**: a long caption grows the cloth with it. The outer flex layout can
wrap when text enlargement makes the two columns too narrow. Neither column is
stretched to match the other's content height.

The only new tokens are:

| Token | Value | Contract |
| --- | --- | --- |
| `--class-hero-min` | `17.5rem` | Mobile minimum, never a text-height cap |
| `--class-detail-cover-inline` | `14rem` | Desktop cover width and the basis of its 3:4 minimum height |
| `--cloth-control-edge` | light: `var(--glass-solid)`; explicit/system dark: `var(--text)` | Contrasting outer chip edge against cloth |

The retired `--class-detail-header-h` and compact header/overview layout rules
are removed. No `--page-max`, `--page-gutter-narrow`, `--type-*` or `--tracking-*`
token is added.

**Header and chips.** `.class-detail-header` is a normal-flow, non-sticky row
containing only back and theme chips. `.class-detail-header__back` is a real
`/classes` link named `Back to Classes`. Both controls use
`.class-detail-header__chip` on the existing `.icon-button`: 44px, round, opaque
fill, 1px `--line-strong` inner border and a 2px contrasting outer edge. A 2px
opaque inset guard separates the border from the faux sheen/highlight. Hover and
press use existing raised/sunken fills; no filter or blur is applied.

Keyboard focus uses a 2px ring at 4px offset, with opaque material on both sides
of the ring and a contrasting outer edge beyond it. The focus moat extends 8px,
with the edge at 10px; all dimensions derive from the existing focus tokens.
Reduced motion removes the chip transition and disables detail tool-button press
scaling. `ThemeToggle` accepts only an
optional appended `className`; its cookie, Light → Dark → System cycle, labels
and ordinary callers are unchanged. Neither this screen nor the index adds a
skip link.

**Caption.** `.class-detail__overview` reuses `.cloth-caption` and
`.cloth-caption--class`, but is a relative grid child, not an absolute text box.
`.class-detail__name` is the sole h1, Berean Serif 600 normal at `--text-title`
with 1.2 leading, no synthesis and no clamp. From 768px, the narrow 224px cover
uses `--text-heading` for this title and `--text-ui` for each
`.class-detail__leader`. `.class-detail__leaders`,
`.class-detail__leaders-title`, `.class-detail__leader-list` and
`.class-detail__leader` expose a complete semantic list in Hanken. With no
leaders the list says `Leader not assigned`. Full names wrap, the plate grows,
and there is no internal scrolling pane. Reduced transparency makes the plate
opaque through the shared production-caption modifier.

**Grouped content.** `.class-detail__summary` is one `.card.card--borderless`
containing the actual `.class-detail__description` (omitted when absent), tools
when authorized, and lessons. The scoped borderless modifier retains a physical
transparent border, rounded shape and existing light/dark elevation tokens.
The description is Hanken, selectable and unclamped.

`.class-detail__tools`, `.class-detail__tools-label` and
`.class-detail__tool-links` render from an exhaustive switch on `viewerRole`:

| Role | Tools |
| --- | --- |
| `admin` | Visible `Church-wide tools` label; `Manage classes` → `/admin/classes`; `Manage lessons` → `/author/lessons` |
| `leader` | `Manage this class` → `/classes/manage`; `Manage lessons` → `/author/lessons` |
| `member` / `none` | No tool slot or artificial gap |

`.class-detail__lessons`, `.class-detail__section-title`,
`.class-detail__lesson-list`, `.class-detail__lesson-row` and
`.class-detail__lesson-title` reuse real folios and Berean `.row__title` headings.
Week/duration metadata omits absent parts. Authorized empty lessons use the quiet
`.class-detail__note`: `Lessons are on the way. Published lessons will appear
here.` There is no repeated EmptyState heading.

The `none` branch never renders lesson rows, even if a malformed presentation
prop contains them. Its `.class-detail__access-note` uses primary text on
`--community-soft`: `Lessons are for class members. Ask A or B to add you.`
Names preserve reader order through
`Intl.ListFormat('en', { style: 'long', type: 'disjunction' })`. With no leaders
it asks `your church admin to add you`. There is no join/contact button.
`getClassDetail()` and its route, reader errors, not-found handling, RLS and
management destinations remain unchanged; profile role is not a permission test.

**Loading.** The route-local `.class-detail-skeleton` mirrors the two chips,
content-sized hero/caption, grouped card and folio rows. Its
`__header-block`, `__block`, `__line` variants, `__row`, `__row-copy` and `__folio`
are static, inert geometry hidden from assistive technology. One
`Loading class…` status sits outside the busy main region. No fake controls,
shimmer or rotating phrases are rendered.

### 6.10 Classes index

`ClassesView` is a server component. `.classes-page`, `.classes-page__title` and
`.classes-section` scope the existing page, section and title primitives; they
leave other screens' layout untouched. The reading order is **Your classes →
Other classes → Lessons from your classes**. The title uses `--text-display`,
Berean Serif 600 normal with 1.05 leading. No intro filler or dead section action
is rendered.

`ClassShelf` is the shared server-rendered shelf contract. The Classes index passes
its personal catalog rows, heading id and an id prefix; future screen groups reuse
that component rather than copying its DOM. It preserves the semantic `ul`/`li`,
whole-cover links, full accessible leader descriptions and the existing
`.class-shelf`, `.class-shelf__item`, `.class-shelf__link` and
`.class-shelf__art` classes. Those classes provide native horizontal scrolling and
whole-cover links to `/class/[id]`. Only the art layer clips. The shelf bleeds to
the column edges, with 24px starting/ending padding, 12px gaps and page-aligned
scroll padding. Covers are 126×168 at 320px, 144×192 from 360px and 168×224 from
768px. The measured third-cover peek is **20px at 320px and 24px at 360px**. The
shelf never becomes a grid or an unbounded desktop viewport region. The ul has no
separate tab stop; Tab reaches each cover and native focus scrolling reveals
off-screen links. Reduced motion disables snap. The borderless-card treatment is
one specificity-preserving
`:is(.class-detail, .classes-page) .card--borderless` rule, so Classes index,
class detail and both route loaders retain identical border, radius and shadow
values without duplicate declarations.

`.cloth-caption--class` supplies the production roles without changing preview
captions: `.cloth-caption__title` is Berean 600 normal, `--text-body` / 1.3;
`.cloth-caption__leaders` is Hanken 500, `--text-ui` / 1.45. Both use primary text
and clamp to two lines on the shelf. Full titles remain the links' accessible
names; descriptions expose every sorted leader rather than just `+N`. Full
content is on detail. Caption material is faux, with an opaque fallback and a
reduced-transparency override.

`.class-row-list`, `.class-row__thumb` and the scoped `.row--plate` make Other
classes a single column of whole-row links with a 44px cloth thumb, class title,
leader summary and chevron. No description teaser, join control or count is
invented. `.card--borderless` supplies the same quiet rounded surface as detail.

`.class-row-list--lessons` uses `.row` with a `.folio` child, not an undefined
`.row--folio` modifier. The Berean title stays primary. One `.row__meta` paragraph
joins the actual class name, week and duration with ` · `, omitting absent parts;
`.classes-page__excerpt` clamps an existing excerpt to two lines. Lesson links
remain `/classes/[lessonId]`.

Only a completely empty catalog uses `.empty`. Admins get a real
`/admin/classes` action; others are told that classes appear after their church
admin creates them. Personal and Other-class emptiness use `.classes-page__note`.
An admin without eligible classes gets neutral copy, not a request to ask another
admin. Empty lessons say `Published lessons from your classes will appear here.`

The page fetches `getClassCatalog()`, `getReadableLessonSummaries()` and existing
`getCurrentRole()` concurrently. Role changes empty copy only. `isMine` and the
shared active membership/led-class context own eligibility, including for admins.
Class leaders come from the existing narrow `getClassLeaders()` /
`get_class_leaders` path, not direct cross-member profile reads or
`member_display()`. No reader, migration or RLS surface is introduced.

`.classes-skeleton` uses the same shelf and row geometry. `.skeleton-block` is
scoped to it; the `classes-skeleton__title`, `__heading`, `__cover`, `__row`,
`__copy`, `__line`, `__line--short`, `__thumb` and `__folio` classes are static
shapes. One `Loading classes…` status remains outside the inert, hidden geometry
and busy main region. The shared branded loader is unchanged.

### 6.11 Classes validation boundary — 2026-11-05

Automated **synthetic** detail fixtures used the production component and built
CSS at 320, 360, 768 and 1024px, in both themes, for leader/member/non-member
roles. Document widths matched viewport widths throughout normal, 200% text
resize and WCAG text-spacing checks. Keyboard order was back → theme → authorized
tools → available lessons. The accessibility tree retained the sole h1 and full
leader list. Chips measured 44×44. System-dark tokens, reduced motion, opaque
reduced-transparency captions and forced-colors focus were also checked.

The long Yoruba title plus four leaders grows the hero rather than spilling
outside the cloth. After the wrapped-title correction, its caption occupied
74.4% of a 547.05px mobile hero at 320px and 75.1% of a 466.13px hero in the
224px desktop cover. At 200% text the mobile plate occupied 91.8% of the grown
hero. **The plate can dominate the cloth**;
full readable content takes priority, with a 48px cloth gap retained above it.
This is not a promise that arbitrary text preserves a nominal 3:4 silhouette.
The worst-case title used only the local Berean Serif physical font.

Raster checks sampled actual PNG glyph cores and adjacent painted surfaces at
DPR 2. All six grounds and six inks were checked in both themes at rest, hover,
press, focus, focus-hover and focus-press: 144 cases. Minima across those cases:

| Pair | Light | Dark |
| --- | ---: | ---: |
| Caption text | 13.655:1 | 12.492:1 |
| Chip icon | 13.183:1 | 11.295:1 |
| Inner border / opaque inset guard | 3.560:1 | 3.873:1 |
| Outer chip edge / cloth | 3.561:1 | 3.160:1 |
| Focus ring / opaque moat, both adjacent sides | 3.666:1 | 8.585:1 |

Pass A's real signed-in captures showed an admin without personal eligibility;
its populated shelf, lesson fixtures and Yoruba clamp checks were synthetic.
Pass B's requested live admin captures of Test A, Test B and Kíláàsì Yorùbá were
blocked by the tool environment's PII safeguard. **They are not verified by the
synthetic matrix.** Live role/RLS behavior, theme-cycle integration on detail,
Safari/older WebViews and developer signed-in sign-off remain outstanding.
Build/typecheck and these fixtures do not close that gate. No additional font,
image file or dependency ships in either pass; inline SVG/HTML is not zero-byte
payload.

---

## 7. Imagery — generated cloth, not photographs

### 7.1 The component

**`CoverCloth`**: one server component, pure inline SVG, no network, no
dependency. It hashes the seed (a class, lesson or sermon id) into four
deterministic choices and draws a woven-textile plate — the visual vocabulary of
indigo adire and aso-oke:

```
seed ─┬─ ground     : one of 6, from the cloth arc only (§7.2)
      ├─ motif      : one of 8 (arcs, comb, chevron, dot grid, diamond, wave, scallop, cross-band)
      ├─ rhythm     : stripe count 3–9, from a second hash of the seed
      └─ rotation   : 0° / 90° / 180°, so two same-motif plates never mirror exactly
```

One seed, four production variants, so a class's cover and its small marks agree:

| Variant | ViewBox | Used for |
| --- | --- | --- |
| `cover` | `0 0 100 100`, `xMidYMid slice` | 3:4 shelf covers (126×168, 144×192, 168×224) and the content-sized detail hero/cover |
| `plate` | `0 0 100 100`, `xMidYMid slice` | Other square-source plates and the retained 3:1 preview crops |
| `strip` | `0 0 100 8`, `preserveAspectRatio="none"` | 6px lesson band |
| `spine` | `0 0 8 100` | 6px vertical spine |
| `thumb` | `0 0 100 100` | 44px row thumb, rhythm capped at four |

The 3px edge is retired. Strips and spines carry their own filled geometry; a
square plate squeezed into a hairline is noise.

Constraints for low-end Android: **≤30 total SVG elements**, counting the SVG
root, ground rectangle, group and generated marks; no filters, gradients-with-
blur, animation or network request; integer emitted geometry. Motifs have explicit
allowed rotations. Comb excludes its cross-like 90° crop, dot grid remains identifiable
in the middle third, and cross-band excludes its crop-destroying 90° rotation. The
cross-band side bars stay inside `x=18–30` and `x=70–82`; the production geometry
audit keeps both bars visible in every retained 3:4 cover and 3:1 hero sample.

### 7.2 Canonical grounds and motif inks

Brass means *your place*, sage means *the room*, and clay means *destructive*.
No cloth ground or motif may use those semantic hues. New cloth tokens use
comma-form `rgba(r, g, b, a)`.

| Ground | Ground | Motif ink | Ground vs dark page / raised | Ink vs ground |
| --- | ---: | ---: | ---: | ---: |
| 1 slate blue | `#304B64` | `#607A92` | `1.915 / 1.701` | `2.028` |
| 2 indigo | `#304879` | `#637CAB` | `1.925 / 1.710` | `2.148` |
| 3 blue-violet | `#3C3C7B` | `#66639F` | `1.756 / 1.560` | `1.812` |
| 4 violet | `#5B4691` | `#8A74BE` | `2.257 / 2.005` | `1.950` |
| 5 plum | `#6B3C5E` | `#96617F` | `2.012 / 1.787` | `1.773` |
| 6 teal | `#225E5E` | `#588B8F` | `2.340 / 2.079` | `1.945` |

Ground 6 has OKLCH hue 195.18°: 42.16° from dark sage, 47.61° from
light sage, at least 114.71° from brass and 164.12° from clay. Future cloth hues
remain at least 40° from all semantic primitives. Ratios use WCAG sRGB relative
luminance; inter-ground checks use CIE76 and hue checks use OKLCH.

### 7.3 Where each surface gets cover art

| Surface | Treatment | Reasoning |
| --- | --- | --- |
| Class | 3:4 shelf covers; full-bleed mobile detail hero / desktop cover, growing with the caption | Cloth identifies the class; Berean names and Hanken leader lists share a faux caption plate |
| Lesson | **A 6px cloth band, plus the rail** — not a big image | Reading content stays above decoration |
| Sermon | 16:9 letterbox plate | A sermon is a dated object — a bulletin |
| Profile | The avatar becomes a **bookplate**: initials stamped in a cloth ring | A library card rather than a social avatar |
| Compact class row | 44px cloth thumb | The smallest retained identifying plate |

**Real photos later:** nothing structural. Only a church's own material — a
building, a logo, series art — on a nullable `cover_url`, with cloth as the
fallback so nothing renders empty. `next.config.mjs` sets
`images.unoptimized: true`, which must be revisited then.

### 7.4 The preview sheet is a retained gate

Before a production screen renders cloth, the admin-only `/dev/cloth` route shows
both themes side by side with:

1. every ground × motif at 126×168, 144×192 and 168×224;
2. captioned and uncaptioned covers;
3. every motif in the real 280×93.33 and 320×106.67 3:1 crops, at every allowed
   rotation and minimum/maximum rhythm;
4. every motif as a 44×44 thumb, 200×6 band and 6×96 spine;
5. default hashes from narrow real class, lesson and sermon ID readers;
6. visible total-element counts for the heaviest samples;
7. production Berean Serif and Hanken, Google-split Hanken and upstream Source Serif 4 controls;
8. real-name greeting samples rendered wholly in Berean Serif, plus 22px/24px scripture and 44px/70px clipping checks.

The `.cloth-scope` grid items allow shrinking with `min-inline-size: 0`. Fixed-size art in `.cloth-grid` keeps its explicit audit dimensions inside a bounded horizontal scroller when wider than the available space; it never expands the page. At 320px and 360px, Chrome's native focusable scrollers show a focus ring and respond to arrow keys. Keyboard verification waits for native smooth scrolling to settle before measuring visibility.

Caption plates are unblurred faux material. Both caption lines use primary text.
The production browser rasterized all six grounds and six motif inks in both
themes with Dark Reader disabled for the audit. All 24 cells pass: the minimum
light ratio is 13.65:1 and the minimum dark ratio is 12.49:1 (dark over motif ink
4). The 0.94 plate alpha therefore remains approved.

The final DOM audit rendered 522 cloth SVGs: maximum declared and actual count 30,
zero count mismatches, zero over-limit samples and zero decimal geometry values.
All eight motifs remain identifiable across their allowed rotations and minimum/
maximum rhythms. The audit raised the minimum-rhythm wave into the middle third
and removed comb's cross-like 90° rotation before passing.

`proxy.ts` and the page both enforce the admin gate. Keep the route until explicit
approval; do not delete it automatically when production plates land.

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
2. **Token values use hex, `rgb()` or comma-form `rgba()`** — no `color-mix()`,
   no `oklch()` in a
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

### 10.1 Batch 3 progress — Classes and Home composition implemented

The Classes index and class detail contracts are implemented in §6.9–§6.10,
with the unclosed validation gates in §6.11. Their approved amendments supersede
the earlier two-column Other-class tiles, Hanken display titles, sticky detail
header, compact name echo and repeated lesson empty headings.

- Classes uses a column-edge shelf with 24px gutters and 20px/24px third-cover
  peeks at 320px/360px. Other classes are whole-row links. Lessons remain last
  and eligibility-scoped, with the actual class name in their metadata.
- Detail uses a full, unclamped identity caption over a growing cloth hero/cover.
  Its two chips are faux and opaque, never filtered. Tools switch on detail
  `viewerRole`; a named-leader non-member note is not a join control.
- Personal class/lesson data is active explicit memberships plus the separately
  modelled active led class. Existing `getClassLeaders()` supplies every leader;
  do not replace it with direct profile lookups or `member_display()`.

Home is one server-rendered editorial flow: visitor-zone date and one complete
`Welcome back` greeting; Latest lesson; the lesson's scripture; the shared class
shelf; Sermons and Community destinations; one review question; one thought on
the latest lesson; and Prayer corner. Latest lesson alone keeps a quiet note when
no eligible lesson exists. The verse, question and thought modules are omitted
when their required lesson data is absent; Prayer is omitted when no published
prayer exists. Sermons and Community retain truthful empty inset panels, and an
empty `.home-reflections` wrapper is never rendered.

`app/home/page.tsx` starts the existing independent readers together. The eligible
`getLatestLesson()` summary feeds `getHomeLessonHighlights(id)`, a bounded,
user-scoped reader which intentionally mirrors `getLesson()`'s RLS behavior while
selecting at most one lesson row, the first question by `sort_order`, and the
newest insight by `created_at`. Its one optional `member_display()` call receives
exactly that insight's author id. Home never calls `getLesson()`. “Latest lesson”
means the existing creation-ordered eligible published result; the UI never says
“just published”.

The Home class section filters `getClassCatalog()` by `isMine`; with no personal
rows it relabels and renders the complete active catalog as `Classes at your
church`. The shared `ClassShelf` retains its semantic list, focus order, native
snap and visible continuation. Sermons uses `getSermons(1)`, Community uses the
real `getLatestDiscussionPrompt()`, and Prayer uses `getPrayerPoints(1)`. Prayer
is static selectable text with no chevron, count or link until Sermons exposes a
real `#prayer-points` destination.

`.home-page` gives the existing 720px `.page-wrap` 24px gutters so only the shelf
bleeds to the column edges. `.home-welcome`, `.home-section`, `.home-latest`,
`.home-verse`, `.home-destinations`, `.home-destination`, `.home-reflections`,
`.home-reflection-link`, `.home-thought` and `.home-prayer` families scope the
composition. They reuse `.card`, `.card--borderless`, `.row`, `.folio`,
`.reading-deck--scripture`, the shelf/caption classes and existing tokens. The
verse is a borderless card with existing spacing tokens and the same tokenized
3px inline-start accent rule as `.margin-note`; `--accent-rule` exists so the
shared thickness is not duplicated as a component literal. The single borderless
rule is `:is(.class-detail, .classes-page, .home-page) .card--borderless`; no
treatment is duplicated. Destination tiles stack at 320px and use two
`minmax(0, 1fr)` columns from 360px. Their `--bg-raised` outer surface
stays raised at rest, hover and press while the inset remains `--bg-sunken`, so
the two surfaces never merge; hover exposes the existing `--line` hairline and
press uses `--line-strong`. From 768px question and thought share two columns,
Prayer remains last and spans the row, and any lone reflection module spans both
columns; DOM and keyboard order never change, and no text surface has a fixed
height.

Home's only signature motion reveals the fixed `--cloth-band` strip with
`clip-path: inset(0 100% 0 0)` to `inset(0)`, mirrored under `[dir='rtl']`, over
`calc(var(--dur-slow) + var(--dur-fast))` with `var(--ease-out)`. It runs once only
inside `prefers-reduced-motion: no-preference`; the base strip is fully visible,
so reduced motion and unsupported clipping lose no content or geometry. No other
Home entrance animates. The strip uses `CoverCloth`'s production `strip` variant,
with no new asset or dependency.

The existing bottom nav, Sermons, Profile and shared branded loader are unchanged.
Real `backdrop-filter` remains limited to `.bottom-nav` and `.reading-header`.
Authoring lesson forms continue to hide nav through the shared route matcher.
Classes index and detail retain their static, shape-matched skeletons; Home's
corresponding route loader remains deferred to its separate pass. The admin-only
`/dev/cloth` route remains the retained cloth/font gate, and removing it still
requires explicit approval. This Home pass adds one bounded reader and its
presentation type, but no migration, new RPC, RLS surface, service-key path,
action, font or image file.

---

## 11. Changing this document

- Update **here first**, then the code, in one change — never the reverse.
- Every token, class and rule documented must exist in `globals.css` when the
  change lands. Nothing aspirational in §1–§8; aspirational work goes in §10.
- A new component class is documented in §6 and in `AGENTS.md` if it carries a
  rule rather than just a style.
- Anything in §9 needs a bug behind it. Don't add speculation.
