"""usage: upload-batch.py START uuidfile  — POST image iSTART.. to Figma upload URLs (one uuid per line)"""
import sys, json, subprocess, concurrent.futures as cf
S='/private/tmp/claude-501/-Users-doug-Developer-doughindson-com/7fc3fb03-1687-448e-92f5-5c646f296b5c/scratchpad'
imgs={i[0]:i for i in json.load(open(f'{S}/figma-spec.json'))['imgs']}
start=int(sys.argv[1]); uu=[l.strip() for l in open(sys.argv[2]) if l.strip()]
def post(a):
    n,u=a; k=f"i{start+n:03d}"; f=imgs[k][1]
    r=subprocess.run(['curl','-s','-o','/dev/null','-w','%{http_code}','-F',f'file=@{f}',f'https://mcp.figma.com/mcp/upload/{u}/submit?scaleMode=FILL&currentPageId=3%3A95'],capture_output=True,text=True)
    return k,r.stdout
with cf.ThreadPoolExecutor(6) as ex: res=list(ex.map(post,enumerate(uu)))
bad=[r for r in res if r[1]!='200']
print(len(res),'posted; non-200:',bad)
