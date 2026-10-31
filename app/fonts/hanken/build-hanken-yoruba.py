#!/usr/bin/env python3
"""Build the combined Hanken Grotesk WOFF2 for Berean (one physical file).

Why: Google serves Hanken in unicode-range pieces. Yoruba clusters such as m̀,
ḿ, ǹ are base + combining mark; Hanken has no precomposed glyph, so the base
and the mark sit in different pieces and the browser drops the whole cluster to
a fallback face. One file keeps the cluster together.

Usage:  pip install fonttools brotli
        python build-hanken-yoruba.py "HankenGrotesk[wght].ttf" HankenGrotesk-Yoruba.woff2
"""
import sys
from fontTools import subset
from fontTools.ttLib import TTFont

src, out = sys.argv[1], sys.argv[2]
R = lambda a, b: list(range(a, b + 1))
unicodes = (
    R(0x20, 0x7E) + R(0xA0, 0xFF) + R(0x100, 0x17F)
    + [0x181, 0x18A, 0x198, 0x199, 0x1B3, 0x1B4, 0x1F8, 0x1F9, 0x253, 0x257, 0x2BB, 0x2BC]
    + R(0x300, 0x36F) + R(0x1E00, 0x1EFF) + R(0x2000, 0x206F)
    + [0x20AC, 0x2122, 0x2190, 0x2192, 0x2212]
)
opts = subset.Options()
opts.layout_features = ['*']      # keep mark/mkmk/ccmp positioning
opts.name_IDs = ['*']             # keep copyright + OFL notice in the font
opts.name_languages = ['*']
opts.hinting = False
opts.notdef_outline = True
opts.flavor = 'woff2'
font = TTFont(src)
sub = subset.Subsetter(opts)
sub.populate(unicodes=unicodes)
sub.subset(font)
font.flavor = 'woff2'
font.save(out)