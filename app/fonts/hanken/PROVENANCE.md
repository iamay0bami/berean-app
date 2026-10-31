# HankenGrotesk-Yoruba.woff2 — provenance

One combined, self-hosted Hanken Grotesk file for Berean. Replaces the three
Google unicode-range pieces so that base + combining-mark clusters
(m̀ ḿ ǹ ẹ́ ọ̀ ṣ …) stay in one font and are not dropped to a fallback face.

| Item | Value |
| --- | --- |
| Source | https://github.com/google/fonts/blob/6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec/ofl/hankengrotesk/HankenGrotesk%5Bwght%5D.ttf |
| Upstream commit (google/fonts HEAD when fetched, 2026-10-31) | `6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec` |
| Source SHA-256 | `813b3f8fa0965405669a89b38e51bbefd95eef6b8e20d1cb2d8c10cce062662f` |
| Output | `HankenGrotesk-Yoruba.woff2` — 48,268 bytes (47.1 KiB) |
| Output SHA-256 | `035c16d66e238e3b50747094e5a0040afb7d6e1e64db0fa86353d991df225c88` |
| Axes | wght 100–900 (variable, preserved) |
| Glyphs | 616 |
| Tooling | fontTools (pyftsubset API) + brotli; one-off build, not an app dependency |
| Build | `python build-hanken-yoruba.py "HankenGrotesk[wght].ttf" HankenGrotesk-Yoruba.woff2` |

## License
SIL Open Font License 1.1. The copyright line is "Copyright 2021 The Hanken
Grotesk Project Authors" with no Reserved Font Name, so subsetting and
self-hosting are permitted. `OFL.txt` ships beside the font and the copyright and
license notice are retained in the font's name table (IDs 0 and 13).

## Coverage (Unicode)
U+0020–007E, U+00A0–00FF, U+0100–017F, U+0181, U+018A, U+0198–0199,
U+01B3–01B4, U+01F8–01F9, U+0253, U+0257, U+02BB–02BC, U+0300–036F,
U+1E00–1EFF, U+2000–206F, U+20AC, U+2122, U+2190, U+2192, U+2212.
GSUB/GPOS layout features are kept in full (`--layout-features=*`).

## Verified here (HarfBuzz, not a browser)
25 sample strings shape with no .notdef glyph and with the combining marks
positioned: m̀ M̀ ḿ Ḿ ǹ Ǹ ń Ń ẹ́ ọ̀ Ẹ̀ Ọ̀ ẹ̄ ṣ Ṣ ị ụ ṅ ẹ̀ ọ́ and the words
Ọ̀rọ̀, Ẹ̀mí, ìgbàgbọ́. A production Rendered Fonts check is still required.

## Known gaps (not in upstream Hanken Grotesk; they fall back regardless)
₦ (U+20A6), ɓ (U+0253), ɗ (U+0257), ƙ (U+0199).