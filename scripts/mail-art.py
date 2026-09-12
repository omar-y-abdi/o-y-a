"""Render the site's own CSS character into the email GIF. Optional art tooling.
Needs Python Pillow + Playwright and Chromium; normal build needs none of these.
"""
from pathlib import Path
import os,re,io,shutil
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/mail';OUT.mkdir(parents=True,exist_ok=True)
face=re.search(r'<button[^>]*data-face[\s\S]*?</button>',(ROOT/'dist/index.html').read_text())[0]
css='\n'.join((ROOT/f'src/styles/{name}.css').read_text() for name in ('base','home','toys'))
html=f'''<!doctype html><html><head><meta charset="UTF-8"><style>{css}
html,body{{width:192px;height:192px;min-height:0;margin:0;padding:0;overflow:hidden;background:#234ce7}}
.machine-stage{{width:192px!important;height:192px!important;min-height:0!important;max-width:none!important;margin:0!important;position:relative!important;transform:none!important}}
.joy-ball{{width:158px!important;height:158px!important;left:17px!important;top:17px!important;transform:none!important;animation:none!important;box-shadow:inset -8px -9px 0 #deb330,5px 8px 0 #1b3bb6}}
</style></head><body><div class="machine-stage" data-mood="">{face}</div></body></html>'''
frames=[];durations=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':192,'height':192},device_scale_factor=1)
 page.set_content(html)
 def frame(duration=80):
  frames.append(Image.open(io.BytesIO(page.screenshot())).convert('RGB'));durations.append(duration)
 frame(1100)
 for mood in ('wink','','surprised','love',''):
  page.locator('.machine-stage').evaluate('(e,m)=>e.dataset.mood=m',mood)
  for i in range(5):page.wait_for_timeout(55);frame(80)
  durations[-1]=650
 durations[-1]=2000
 b.close()
frames[0].save(OUT/'omar-smile.png')
# One repeated pass, then a readable still; no endless motion inside an email.
palette=frames[0].quantize(colors=128)
indexed=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
indexed[0].save(OUT/'omar-smile.gif',save_all=True,append_images=indexed[1:],duration=durations,loop=1,optimize=True,disposal=1)
print('Email GIF:',(OUT/'omar-smile.gif').stat().st_size,'bytes;',len(frames),'captured frames; finite replay.')
