"""usage: upload-list.py file — lines 'uuid key'; POST key's image to Figma upload URL"""
import sys, json, subprocess, concurrent.futures as cf
S='/private/tmp/claude-501/-Users-doug-Developer-doughindson-com/7fc3fb03-1687-448e-92f5-5c646f296b5c/scratchpad'
imgs={i[0]:i for i in json.load(open(f'{S}/figma-spec.json'))['imgs']}
pairs=[l.split() for l in open(sys.argv[1]) if l.strip()]
def post(p):
    u,k=p
    for attempt in range(1):
        r=subprocess.run(['curl','-s','-m','180','-o','/dev/null','-w','%{http_code}','-F',f'file=@{imgs[k][1]}',f'https://mcp.figma.com/mcp/upload/{u}/submit?scaleMode=FILL&currentPageId=3%3A95'],capture_output=True,text=True)
        if r.stdout=='200': return k,'200'
    return k,r.stdout
with cf.ThreadPoolExecutor(1) as ex: res=list(ex.map(post,pairs))
print(len(res),'posted; non-200:',[r for r in res if r[1]!='200'])
