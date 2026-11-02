"""Compare the published snapshot with the latest upstream release before rebuilding."""
import json,os,urllib.request

def read(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'CalpinoUno freshness checker','Cache-Control':'no-cache'}),timeout=30) as response:return json.load(response)
release=read('https://api.github.com/repos/f1db/f1db/releases/latest')
try:published=read('https://vchaillo.github.io/calpino-uno/data/statistics-meta.json')
except Exception:published={}
changed=release['tag_name']!=published.get('version')
print(f"Latest release: {release['tag_name']}; published: {published.get('version','unknown')}; refresh: {changed}")
with open(os.environ['GITHUB_OUTPUT'],'a') as output:output.write(f'changed={str(changed).lower()}\n')
