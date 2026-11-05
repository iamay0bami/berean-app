# Production typography audit — 2026-11-04

## Verdict

**Approve the Berean Serif and combined-local-Hanken typography change.** The automated production-browser audit found no font fallback in the realistic Yoruba contract, no clipped display marks, and no page-level horizontal overflow in the tested layout, reflow, or resize matrix.

This is an automated rendering result, not the developer’s signed-in browser and RLS sign-off required by `AGENTS.md`.

## Environment and scope

- Production build served locally on port 3003.
- Google Chrome 156.0.8078.80, driven through Playwright and Chrome DevTools Protocol.
- A clean headless browser copied the retained authorized session state and disabled extensions.
- Themes: light and dark.
- Primary widths: 360px and 768px.
- Additional checks: 320px reflow and a 720px viewport rendered at CSS zoom 2 (the 200% resize proxy used by this audit).
- Routes: `/home`, `/classes/happiness` (the available dynamic lesson reader), `/sermons`, `/profile`, `/auth/sign-in`, and the admin-only `/dev/cloth` gate.
- Evidence: 24 primary matrix screenshots plus targeted font, focus, delayed-loading, display-stress, and enlarged end-of-page captures.

## Results

### Yoruba shaping and rendered fonts

Chrome Rendered Fonts kept all 18 realistic clusters and the complete NFC phrase in the intended local face at 14px, 16px, 19px, 22px, 24px, 30px, and 32px in both theme scopes:

- Berean samples used only `Berean Serif` / `BereanSerif-SemiBold`.
- Hanken samples used only `Hanken Grotesk` / `HankenGrotesk`.
- Neither production family fell back for a realistic cluster.
- The NFD `n` + U+0301 diagnostic and invalid-orthography `ṣ́` diagnostic remained in each intended local file.
- The labelled coverage gaps `ɓ`, `ɗ`, `ƙ`, and `₦` fell back as expected: Times New Roman for Berean and Arial for Hanken.

The route-local negative controls behaved differently, as intended. Google-split Hanken fell back to Arial for eight realistic clusters, while the split Source Serif 4 control fell back to Times New Roman for `m̀` and `M̀`. This isolates split font coverage from the production local files.

### Display and reading decisions

- The 44px and 70px Berean production samples showed no visible mark clipping at line-height 1.05 in either theme.
- A two-line capital stress fixture showed that line-height 0.98 crowds adjacent stacked marks at both sizes. Production keeps 1.05.
- Canvas ink bounds exceeded the nominal line box for both candidate line-heights; that metric was treated as diagnostic rather than as proof of clipping. The verdict used rendered captures and clipping-ancestor checks.
- The 24px scripture sample retains the more comfortable semibold texture over 22px. Both sizes wrapped to two lines in the 360px gate and one line at 768px.
- The lesson reading copy measured 530px wide at Hanken 18px/1.65, approximately 65 characters per line for the sampled prose.

### Layout, reflow, and enlarged content

The six-route matrix passed in both themes:

| Check | Cases | Page-level overflow |
| --- | ---: | ---: |
| 360px and 768px primary layout | 24 | 0 |
| 320px reflow | 12 | 0 |
| CSS 200% resize proxy | 12 | 0 |
| Supplemental 320px and 1440px checks | 24 | 0 |

The `/dev/cloth` gate initially expanded the page at narrow widths. The targeted fix allows `.cloth-scope` grid items to shrink and contains fixed-size preview art in bounded `.cloth-grid` horizontal scrollers. At 320px and 360px those native scrollers receive a visible focus indicator and respond to arrow keys; at 768px no preview scroller is needed.

At the enlarged setting, the last audited content on Home, the lesson reader, Sermons, Profile, and sign-in remained scrollable into the unobscured area above the bottom navigation and below the reading header where present.

### Keyboard and accessible controls

- No unnamed buttons, links, textboxes, or comboboxes were reported by the accessibility-tree checks on the six routes.
- Audited focus stops were visible and unobscured after native smooth scrolling settled.
- The sign-in password visibility control worked with Enter in both themes and restored the field to `type="password"` on the second activation.
- The narrow `/dev/cloth` preview scrollers exposed native focus rings and keyboard horizontal scrolling.

### Font loading and payload

A cache-disabled Home load requested exactly two font files, both HTTP 200 and neither from a service worker:

| File | Encoded body | Transfer size |
| --- | ---: | ---: |
| Berean Serif static 600 | 41,776 bytes | 42,076 bytes |
| Hanken combined variable | 48,268 bytes | 48,568 bytes |
| **Home total** | **90,044 bytes** | **90,644 bytes** |

Home exposed exactly two unique font preloads. It requested no Fraunces, Google, Source Serif, or control font. With cache re-enabled, client navigation Home → Classes → Home made no additional font request and no full-document request.

The admin-only `/dev/cloth` gate loaded nine files: 296,664 encoded bytes and 299,364 transferred bytes. Seven files and 206,620 encoded bytes belong to its route-local Google controls; none ships on production screens.

Four Home loads delayed font responses by one second. The maximum observed layout-shift sum was 0.00006078398276748971 (rounded to 0.000061), with no overflow.

## Non-blocking observations and limits

- Chrome requested `/favicon.ico`, which returned 404. App pages and font responses succeeded; this is unrelated to typography rendering.
- Canceled `_rsc` prefetches produced `net::ERR_ABORTED` entries while the audit moved rapidly between routes. No non-prefetch request failed.
- Sign-in inputs compute to 14px and have placeholder-derived accessible names rather than associated visible labels. The keyboard interaction passed, but mobile Safari’s automatic input zoom and explicit form labelling were not validated in this Chrome audit.
- Visual review found no font-rendering defect in the inspected captures. It noted existing polish issues outside this change: weak hierarchy in plain-text lesson-body subheadings and joined-looking Profile action borders.
- Real authorization behavior, role gating, and RLS-dependent rendering still require the developer’s own signed-in browser verification.
- The CSS zoom check is a repeatable resize proxy; it is not a substitute for testing every browser’s native page-zoom implementation.

## Change made from the audit

The only audit-driven production-code adjustment was narrow-width containment for the admin preview gate:

- `.cloth-scope { min-inline-size: 0; }`
- `.cloth-grid` is bounded to its available inline size and scrolls locally when fixed-size audit art is wider.

No production typography token or selected line-height changed after the browser review.
