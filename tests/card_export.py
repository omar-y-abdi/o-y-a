"""Rendered-document test of all card exports; does not test browser save dialogs."""
import sys,json,base64,os,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
os.chdir(ROOT)
sys.path.insert(0,str(ROOT/'tests'))
from render_support import load
from playwright.sync_api import sync_playwright
OUT=Path('artifacts/cards');OUT.mkdir(exist_ok=True,parents=True)
BANK=json.loads(Path('public/data/cards.json').read_text())
KEEP={card['id'] for card in sorted(BANK,key=lambda c:len(c['text']),reverse=True)[:4]} | {'k01','k02','j01','j02','p01','p02','r01','r02'}
checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox'])
 for card in BANK:
   key=card['id'];page=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
   load(page,'/verkstad/?kort='+key)
   page.evaluate('''() => {const original=HTMLCanvasElement.prototype.toBlob; window.__saved=null;window.__bounds=[];const text=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,x,y){const m=this.measureText(t);window.__bounds.push({text:t,left:x,right:x+m.width,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent});return text.call(this,t,x,y)};HTMLCanvasElement.prototype.toBlob=function(callback,...rest){window.__saved=this.toDataURL();return original.call(this,callback,...rest)}}''')
   page.locator('[data-save]').click();page.wait_for_function('window.__saved!==null')
   bounds=page.evaluate('window.__bounds')
   assert all(x['left']>=0 and x['right']<=1200 and x['top']>=0 and x['bottom']<=800 for x in bounds),bounds
   data=page.evaluate('window.__saved')
   if key in KEEP:(OUT/(key+'.png')).write_bytes(base64.b64decode(data.split(',')[1]))
   rect=page.locator('[data-receipt]').bounding_box();assert rect['x']>=0 and rect['x']+rect['width']<=390
   checks.append({'id':key,'canvasBounds':'PASS','mobileReceiptBounds':'PASS'})
   page.close()
 b.close()
Path('artifacts/cards.json').write_text(json.dumps({'mode':'rendered-document canvas export tests','cards':checks},indent=2))
print(f'All {len(checks)} card canvases and mobile receipt boundaries passed.')
