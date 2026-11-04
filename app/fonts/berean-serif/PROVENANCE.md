# BereanSerif-SemiBold.woff2 — provenance

Static SemiBold (wght 600) serif for Berean display headings and scripture quotes.
Derived from Source Serif 4 so that Yoruba tone-mark clusters (m̀ ḿ ǹ ẹ́ ọ̀ ṣ …)
render in one physical file, unlike Google's unicode-range pieces.

| Item | Value |
| --- | --- |
| Source | https://github.com/google/fonts/blob/2fe1e8c6b137fb13041a7cfca6fdcd8a910ea4dc/ofl/sourceserif4/SourceSerif4%5Bopsz%2Cwght%5D.ttf |
| Upstream commit (google/fonts HEAD when fetched, 2026-11-03) | `2fe1e8c6b137fb13041a7cfca6fdcd8a910ea4dc` |
| Source SHA-256 | `97b2d4da6e3cb494b5a1e66ae176914d852ccabef49e0c02c0df25f3e39aca0b` |
| Output | `BereanSerif-SemiBold.woff2` — 41,776 bytes (40.8 KiB) |
| Output SHA-256 | `7dfcc4fe15ec96ace5baed7003cfc09089d90ba5f567b7d7c6c61c3c0082122c` |
| Instance | wght 600, opsz 20 (static, no variation tables) |
| Tooling | fontTools + brotli; one-off build, not an app dependency |
| Build | `python build-berean-serif.py "SourceSerif4[opsz,wght].ttf" BereanSerif-SemiBold.woff2` |

## License — Modified Version
SIL Open Font License 1.1. The upstream font declares Reserved Font Name 'Source',
so this subset/instance is a Modified Version and is **renamed "Berean Serif"**
(name IDs 1, 3, 4, 6, 16, 17). Copyright and license notices are retained in the font
(name IDs 0 and 13) and `OFL.txt` ships beside it. Do not call it "Source Serif".

## Coverage
U+0020–007E, U+00A0–00FF, U+0100–017F, U+01F8–01F9, U+02BB–02BC, U+0300–036F,
U+1E00–1EFF, U+2000–206F, U+20AC, U+2122, U+2190, U+2192, U+2212.
GSUB/GPOS kept in full.

## Verified here (HarfBuzz, not a browser)
24 test strings, no .notdef: m̀ M̀ ḿ Ḿ ǹ Ǹ ń Ń ẹ́ ọ̀ Ẹ̀ Ọ̀ ẹ̄ ṣ Ṣ ị ụ ṅ ẹ̀ ọ́ and
"Home", "Classes", "Àmín". Combining marks are positioned (m̀ x-offset −446).
A production Rendered Fonts check and a visual check are still required.
