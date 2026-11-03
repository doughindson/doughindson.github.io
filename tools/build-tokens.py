"""Aggregate capture-raw.json + site.css theme variables into reference/design-tokens.json"""
import json, re, colorsys
from collections import Counter, defaultdict

raw = json.load(open('reference/capture-raw.json'))
css = open('reference/css/site.css').read()

# ---- theme variables from :root blocks
theme = {}
for block in re.findall(r':root\s*\{([^}]*)\}', css):
    for k, v in re.findall(r'(--[\w-]+)\s*:\s*([^;]+);', block):
        theme[k] = v.strip()

core_keys = [k for k in theme if re.fullmatch(
    r'--(white|black|accent|lightAccent|darkAccent|safeLightAccent|safeDarkAccent|siteBackgroundColor)-hsl|--base-font-size|'
    r'--(heading-\d|body|meta|button)-font-[\w-]+|--(small|normal|large|extra-large)-(text|meta)-size(-value)?|--(heading-[1-6]|paragraph-[1-3]|body|meta)-[\w-]+|'
    r'--sqs-(site-max-width|site-gutter|mobile-site-gutter|mobile-site-gutter-value)|--site-max-width|--site-gutter|--mobile-site-gutter|--sqs-\w*|--mobile-[\w-]*gutter[\w-]*|--site-[\w-]+', k)]
core = {k: theme[k] for k in sorted(core_keys)}

def resolve(v, depth=0):
    m = re.fullmatch(r'var\((--[\w-]+)\)', v.strip())
    return resolve(theme[m.group(1)], depth + 1) if m and m.group(1) in theme and depth < 10 else v

def hsl_to_hex(s):
    m = re.match(r'\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%', s)
    if not m: return None
    h, sat, l = float(m.group(1)) / 360, float(m.group(2)) / 100, float(m.group(3)) / 100
    r, g, b = colorsys.hls_to_rgb(h, l, sat)
    return '#%02x%02x%02x' % (round(r * 255), round(g * 255), round(b * 255))

palette_theme = {}
for k in ['white', 'black', 'accent', 'lightAccent', 'darkAccent', 'safeLightAccent', 'safeDarkAccent']:
    v = theme.get(f'--{k}-hsl')
    if v: palette_theme[k] = {'hsl': v, 'hex': hsl_to_hex(v)}

def rgb_hex(c):
    m = re.match(r'rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)', c)
    if not m: return c
    h = '#%02x%02x%02x' % tuple(int(m.group(i)) for i in (1, 2, 3))
    return h if m.group(4) in (None, '1') else f'{h} @ {m.group(4)}'

# ---- typography: merge across pages, per viewport
def merge_type(vp):
    agg = {}
    for slug, d in raw['viewports'][vp].items():
        for t in d['typeMap']:
            if t['selector'] in ('body', 'footer') or (t['sample'] or '').startswith(('.fe-', '#block', '\n')): continue
            k = json.dumps([t['selector'], t['fontFamily'], t['fontSize'], t['fontWeight'], t['fontStyle'], t['lineHeight'], t['letterSpacing'], t['textTransform'], t['color']])
            a = agg.setdefault(k, {**{x: t[x] for x in ('selector', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textTransform', 'color', 'textDecoration')}, 'count': 0, 'pages': set(), 'sample': t['sample']})
            a['count'] += t['count']; a['pages'].add(slug)
    out = []
    for a in sorted(agg.values(), key=lambda x: -x['count']):
        a['pages'] = len(a['pages']); a['colorHex'] = rgb_hex(a['color']); out.append(a)
    return out

typography = {vp: merge_type(vp) for vp in raw['viewports']}

# ---- colours across pages
def merge_colours(key):
    c = Counter()
    for vp in raw['viewports'].values():
        for d in vp.values():
            for col, n in d[key].items(): c[col] += n
    return [{'value': k, 'hex': rgb_hex(k), 'count': n} for k, n in c.most_common()]

# ---- layout per viewport (home + a project + about)
layout = {vp: {slug: raw['viewports'][vp][slug]['layout'] for slug in ('home', 'about', 'design-motion', 'citi') if slug in raw['viewports'][vp]} for vp in raw['viewports']}
grids = {vp: {slug: raw['viewports'][vp][slug]['grids'] for slug in ('home', 'about', 'design-motion', 'citi')} for vp in raw['viewports']}

# ---- breakpoints
media = Counter()
for vp in raw['viewports'].values():
    for d in vp.values():
        for q in d['media']: media[q] += 1
bps = sorted(media)

# ---- fonts
faces = {}
for vp in raw['viewports'].values():
    for d in vp.values():
        for f in d['fontFaces']:
            fam = f['family'].strip('"')
            src = re.search(r'url\("([^"]+)"\)', f['src'])
            url = src.group(1) if src else None
            host = re.sub(r'^https?://([^/]+)/.*', r'\1', url) if url else None
            faces[(fam, f['weight'], f['style'])] = {'family': fam, 'weight': f['weight'], 'style': f['style'], 'host': host, 'sampleUrl': url}
fonts_loaded = sorted(faces.values(), key=lambda x: (x['family'], x['weight'], x['style']))

tokens = {
    'generated': raw['generated'],
    'source': 'https://www.doughindson.com (Squarespace 7.1, fluid engine)',
    'viewports': ['1440', '390'],
    'notes': [
        'Values are computed styles (px) read from the live site by Playwright, plus Squarespace theme variables from site.css.',
        'The body copy font-size on the live site is fluid (18px base * theme multipliers), so sizes differ between 1440 and 390.',
        'Headings use Squarespace “Europa” via Adobe Fonts; UI labels use “proxima-nova” (Adobe Fonts) — see fonts[].',
    ],
    'colors': {
        'theme': palette_theme,
        'siteBackground': raw['viewports']['1440']['home']['bodyBg'],
        'bodyText': raw['viewports']['1440']['home']['bodyColor'],
        'textColorsUsed': merge_colours('colours'),
        'backgroundsUsed': merge_colours('bgs'),
        'bordersUsed': merge_colours('borders'),
    },
    'typography': typography,
    'themeVariables': core,
    'layout': layout,
    'grids': grids,
    'breakpoints': {'mediaQueries': bps, 'mainBreakpointPx': 767, 'note': 'Squarespace switches to mobile styles at max-width: 767px; (min-width: 768px) is desktop'},
    'maxWidths': {'siteMaxWidth': theme.get('--sqs-site-max-width') or '1500px (from fluid-engine grid CSS: var(--sqs-site-max-width, 1500px))'},
    'hover': raw['hover'],
    'mobileMenu': raw.get('mobileMenu'),
    'fonts': fonts_loaded,
    'customCss': open('reference/css/custom.css').read(),
}
json.dump(tokens, open('reference/design-tokens.json', 'w'), indent=2, ensure_ascii=False)
print('themeVars', len(core)); print(json.dumps(palette_theme, indent=1)); print(bps)
for vp in typography:
    print('==', vp)
    for t in typography[vp][:16]: print(t['selector'].ljust(14), t['fontFamily'].ljust(12), t['fontSize'].ljust(9), t['fontWeight'], t['lineHeight'].ljust(10), t['letterSpacing'].ljust(8), t['colorHex'], t['count'], '|', t['sample'][:30])
print(fonts_loaded)
print({k: v for k, v in core.items() if 'size' in k and 'value' not in k and ('text' in k or 'meta' in k)})
print({k: resolve(v) for k, v in core.items() if re.match(r'--(heading-1|body|paragraph-1)-font-(font-family|font-size|line-height|letter-spacing|font-weight)', k)})
