"""Real local HTTP checks of the same fetch handler and static output, not workerd."""
import json
import http.client
from pathlib import Path
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET
import re
import gzip
ROOT=Path(__file__).resolve().parents[1]
BASE='127.0.0.1'; PORT=4173
results=[]

def fetch(path, method='GET', headers=None, body=None, port=PORT):
    c=http.client.HTTPConnection(BASE,port,timeout=5)
    c.request(method,path,body=body,headers=headers or {})
    r=c.getresponse(); data=r.read(); code=r.status; hdr=dict((k.lower(),v) for k,v in r.getheaders());c.close()
    return code,hdr,data

def check(name, fn):
    try: fn();results.append({'name':name,'status':'PASS'});print('PASS',name)
    except Exception as e:results.append({'name':name,'status':'FAIL','error':str(e)});print('FAIL',name,str(e))

routes=['/','/verkstad/','/om/','/projekt/furl/','/projekt/blade-blend/','/projekt/backhaul/','/kontakt/','/integritet/','/kakor/','/villkor/','/tillganglighet/']
for path in routes:
    def route(path=path):
        status,h,b=fetch(path)
        assert status==200,(path,status)
        assert 'text/html' in h['content-type']
        assert h['x-content-type-options']=='nosniff'
        assert h['referrer-policy']=='no-referrer'
        assert "frame-ancestors 'none'" in h['content-security-policy']
        assert 'unsafe-eval' not in h['content-security-policy']
        assert len(re.findall(b'<h1(?: |>).*?</h1>',b,re.S))==1
        for href in re.findall(r'(?:href|src)="([^"]+)"',b.decode()):
            if not href.startswith('/') or href.startswith('//'):continue
            target=urlsplit(href).path
            code,headers,body=fetch(target)
            assert code==200,(path,href,code)
            if target.endswith('.mjs'):assert 'javascript' in headers['content-type']
        code,head_headers,head=fetch(path,'HEAD');assert code==200 and head==b''
        assert 'content-length' not in head_headers or int(head_headers['content-length'])==len(b), (path,'HEAD must not advertise a false representation size',head_headers.get('content-length'),len(b))
    check('200, HEAD, security and linked resources '+path,route)

def contact_closed():
    code,h,b=fetch('/api/contact/config');assert code==200 and json.loads(b)=={'enabled':False,'sitekey':None}
    assert h['cache-control']=='no-store'
    code,h,b=fetch('/api/contact/config','HEAD');assert code==200 and b==b''
    code,h,b=fetch('/api/contact','POST',{'Origin':'http://127.0.0.1:4173','Content-Type':'application/json'},json.dumps({'name':'Test','email':'visitor@example.org','message':'','website':'','token':'test','submission':'6c77eb01-9260-4e9c-8a72-262b520ee1b1'}));assert code==503 and json.loads(b)['ok']==False
    assert b'@chalmers.se' not in b
check('Contact configuration is private and unconfigured sending fails closed',contact_closed)

def new_assets():
    code,h,b=fetch('/data/cards.json');assert code==200 and 'application/json' in h['content-type']
    assert len(json.loads(b))==240
    code,h,b=fetch('/mail/omar-smile.gif');assert code==200 and h['content-type']=='image/gif' and b.startswith(b'GIF89a')
check('Joke bank and real email GIF have correct HTTP content types',new_assets)

def missing():
    for path in ['/does-not-exist','/nested/missing/','/404.html']:
        code,h,b=fetch(path)
        assert code==404,(path,code)
        assert b'tog fikapaus' in b
        assert b'noindex' in b
check('Real 404 responses with custom HTML and noindex',missing)

def redirects():
    for path,wanted in [('/verkstad','/verkstad/'),('/om/index.html','/om/'),('/verkstad?kort=k01','/verkstad/?kort=k01')]:
        code,h,_=fetch(path);assert code==308 and h['location']==wanted,(path,code,h)
check('Clean canonical path redirects preserve card ID',redirects)

def xml_and_text():
    code,h,b=fetch('/sitemap.xml');assert code==200
    doc=ET.fromstring(b);locs=[e.text for e in doc.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    assert set(locs)=={'https://omaryusuf.se'+path for path in routes}
    for path in ['/robots.txt','/llms.txt']:
        code,h,b=fetch(path);assert code==200 and 'text/plain' in h['content-type'] and b'omaryusuf.se' in b
check('Sitemap XML parses; robots and llms served as text',xml_and_text)

def compression():
    code,h,b=fetch('/',headers={'Accept-Encoding':'gzip'});assert code==200
    assert h.get('content-encoding')=='gzip'
    assert b'Omar' in gzip.decompress(b)
    assert len(b)<9000
check('Actual gzip transfer and bounded home document size',compression)

def private_assets():
    for path in ['/.env','/.git/config','/assets/main.mjs.map','/%2eenv','/..%2fpackage.json','/_headers']:
        code,h,b=fetch(path);assert code>=400,(path,code)
        assert b'"scripts"' not in b
check('Private paths, traversal and source maps are not served',private_assets)

def analytics():
    code,h,b=fetch('/api/config');assert code==200 and json.loads(b)=={'analytics':False}
    code,h,b=fetch('/api/config',port=4174);assert code==200 and json.loads(b)=={'analytics':True}
    data=json.dumps({'event':'joy','page':'/verkstad/'})
    headers={'Origin':'http://127.0.0.1:4174','Cookie':'oy_privacy=v1.allow','Content-Type':'application/json','X-OY-Consent':'v1'}
    code,h,b=fetch('/api/event','POST',headers,data,4174);assert code==204 and b==b''
    assert h['cache-control']=='no-store'
    headers['Cookie']='oy_privacy=v1.deny'
    code,h,b=fetch('/api/event','POST',headers,data,4174);assert code==403
    headers['Cookie']='oy_privacy=v1.allow';headers['Origin']='https://evil.example'
    code,h,b=fetch('/api/event','POST',headers,data,4174);assert code==403
check('Actual HTTP ingest: availability, accepted consent, deny and cross-origin rejection',analytics)

report={'mode':'real local HTTP with Node adapter (not Cloudflare workerd)','passed':sum(x['status']=='PASS' for x in results),'failed':sum(x['status']=='FAIL' for x in results),'tests':results}
(ROOT/'artifacts/http-tests.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='tests'}))
raise SystemExit(bool(report['failed']))
