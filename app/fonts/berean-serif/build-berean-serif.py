#!/usr/bin/env python3
"""Build BereanSerif-SemiBold.woff2 from Source Serif 4 (SIL OFL 1.1).

One physical file keeps base + combining-mark clusters together (m̀ ḿ ǹ ẹ́ ọ̀ …).
Static instance wght=600, opsz=20, subset to Latin + Latin Extended + dot-below
letters + combining marks. The family is RENAMED "Berean Serif" because the
upstream font declares Reserved Font Name 'Source' and this is a Modified Version.

Usage:  pip install fonttools brotli
        python build-berean-serif.py "SourceSerif4[opsz,wght].ttf" BereanSerif-SemiBold.woff2
"""
import io, sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

src, out = sys.argv[1], sys.argv[2]
R = lambda a, b: list(range(a, b + 1))
unicodes = (R(0x20, 0x7E) + R(0xA0, 0xFF) + R(0x100, 0x17F) + [0x1F8, 0x1F9, 0x2BB, 0x2BC]
            + R(0x300, 0x36F) + R(0x1E00, 0x1EFF) + R(0x2000, 0x206F)
            + [0x20AC, 0x2122, 0x2190, 0x2192, 0x2212])
font = TTFont(src)
opts = subset.Options()
opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.name_languages = ['*']
opts.hinting = False; opts.notdef_outline = True
sub = subset.Subsetter(opts); sub.populate(unicodes=unicodes); sub.subset(font)
buf = io.BytesIO(); font.save(buf); buf.seek(0); font = TTFont(buf)
font = instancer.instantiateVariableFont(font, {'wght': 600, 'opsz': 20})
FAMILY, STYLE = 'Berean Serif', 'SemiBold'
for rec in list(font['name'].names):
    if rec.nameID in (1, 16): rec.string = FAMILY
    elif rec.nameID in (2, 17): rec.string = STYLE if rec.nameID == 17 else 'Regular'
    elif rec.nameID == 4: rec.string = f'{FAMILY} {STYLE}'
    elif rec.nameID == 6: rec.string = 'BereanSerif-SemiBold'
    elif rec.nameID == 3: rec.string = 'BereanSerif-SemiBold;modified-from-SourceSerif4'
font.flavor = 'woff2'
font.save(out)
