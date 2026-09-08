"""Self-host the OFL fonts, including every character used in site copy.

Run after changing Chinese copy. Source TTFs and build dependencies live in work/.
"""
from pathlib import Path
import sys
sys.path.insert(0, str(Path('work/font-tools').resolve()))
from fontTools import subset
from fontTools.ttLib import TTFont

text = ''.join(p.read_text('utf-8') for p in Path('app').rglob('*') if p.suffix in ('.tsx', '.ts', '.css'))
text += ''.join(chr(c) for c in range(32, 127))
for source, target in [('KNMaiyuan.ttf', 'duo-mochi'), ('ChillRound.ttf', 'duo-round')]:
    font = TTFont('work/fonts/' + source)
    options = subset.Options()
    options.flavor = 'woff2'
    cutter = subset.Subsetter(options=options)
    cutter.populate(text=text)
    cutter.subset(font)
    font.flavor = 'woff2'
    path = Path('public/fonts/' + target + '.woff2')
    font.save(path)
    bundled = Path('app/fonts/' + target + '.woff2')
    bundled.parent.mkdir(exist_ok=True)
    bundled.write_bytes(path.read_bytes())
    print(path, path.stat().st_size)
