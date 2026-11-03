"""Build compact page specs + resized upload images for Figma. Output: scratchpad/figma-spec.json"""
import json, re, os, subprocess, sys
S=sys.argv[1]
pg=json.load(open('reference/pages.json'))['pages']
im=json.load(open('reference/images.json'))
byurl={}
for i in im:
    if i['slug'] in ('selected-projects','selected-projects-1'): continue
    byurl.setdefault(i['sourceUrl'],i)
keys={}
def key(url):
    if url not in keys: keys[url]=f"i{len(keys):03d}"
    return keys[url]
def strip(md):
    md=re.sub(r'\[([^\]]*)\]\([^)]*\)',r'\1',md)
    md=md.replace('**','').replace('\\','')
    md=re.sub(r'(?<![\w*])\*([^*\n]+)\*(?![\w*])',r'\1',md)
    return md.replace('  \n','\n').strip()
order=['home','about','design-motion','404']
projects=[p for p in pg if p['route'].startswith('/design-motion/')]
spec={}
P={p['slug']:p for p in pg}
inv=json.load(open('inventory.json'))['pages']
proj_sorted=sorted([i for i in inv if i['type']=='project'],key=lambda i:i['projectOrder'])
def blocks_of(p):
    out=[]; grp=[]
    def flush():
        nonlocal grp
        if not grp: return
        if len(grp)==1: out.append(['i',grp[0]])
        elif len(grp)==2: out.append(['p',grp])
        else: out.append(['g',grp])
        grp=[]
    for b in p['blocks']:
        if b['kind']=='image':
            r=byurl.get(b['url'])
            if not r: continue
            grp.append([key(b['url']),r['width'],r['height']]); continue
        flush()
        if b['kind']=='text':
            md=b['markdown']
            if md.startswith('# ') and not out: out.append(['h1',strip(md[2:])]); continue
            if re.search(r'^\*?(Role|Studio|Client)',md,re.M) and len(md)<300:
                out.append(['c',[strip(l) for l in md.split('\n') if l.strip()]]); continue
            sz='L' if b.get('size')=='large' else 'S' if b.get('size')=='small' else 'M'
            for para in re.split(r'\n\s*\n',md):
                para=strip(para)
                if para: out.append(['t',sz,para])
        elif b['kind']=='video':
            lab='Video'
            if b['provider']=='squarespace-native': lab=f"Video · {round(b['config']['durationSeconds'])}s (Squarespace-hosted)"
            else: lab=f"Video · {b['provider']} {b.get('title') or ''}".strip()
            out.append(['v',lab])
    flush(); return out
for s in order:
    if s=='design-motion':
        cards=[]
        for i in proj_sorted:
            c=[x for x in im if x['slug']==i['slug'] and x['role']=='cover'][0]
            cards.append([P[i['slug']]['title'].replace(' — Doug Hindson — Creative Director',''), key(c['sourceUrl']), c['width'],c['height']])
            byurl.setdefault(c['sourceUrl'],c)
        spec[s]=[['h1','Design & Motion'],['cards',cards]]
    else:
        spec[s]=blocks_of(P[s]) if s!='404' else [['h1',"Hmm, that page doesn't seem to exist…"]]
for i in proj_sorted: spec[i['slug']]=blocks_of(P[i['slug']])
# home slideshow = images
inv_keys={v:k for k,v in keys.items()}
# resize
imgs=[]
for url,k in keys.items():
    r=byurl[url]; src=r['file']; ext=os.path.splitext(src)[1].lower()
    dst=f"{S}/figma-img/{k}{ext}"
    if not os.path.exists(dst):
        subprocess.run(['sips','-Z','1600',src,'--out',dst],capture_output=True)
    sz=os.path.getsize(dst)
    imgs.append([k,dst,r['width'],r['height'],sz])
json.dump({'spec':spec,'imgs':imgs},open(f'{S}/figma-spec.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(imgs),'images; max size MB',max(i[4] for i in imgs)/1e6)
print({k:len(v) for k,v in spec.items()})
print(len(json.dumps(spec,ensure_ascii=False,separators=(',',':'))))
