"""Cross-engine visual fidelity check for managed SVG sources.

The SVG and existing raster derivative are rendered by the same browser.  The
metric is normalized RGB mean absolute error so antialiasing differences across
Chromium/Firefox/WebKit do not masquerade as a design regression.  A deliberate
palette mutation is required to miss the budget by a wide margin.
"""
import base64
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

def data_uri(path: Path) -> str:
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode()

fixtures = {
    'iconPngData': data_uri(ROOT / 'public/apple-touch-icon.png'),
    'iconSvg': (ROOT / 'public/favicon.svg').read_text(),
    'mailPngData': data_uri(ROOT / 'public/mail/omar-smile.png'),
    'mailSvg': (ROOT / 'public/mail/omar-smile.svg').read_text(),
}

with sync_playwright() as pw:
    engine = os.environ.get('CMS_BROWSER', 'chromium')
    options = {'executable_path': os.environ['CMS_BROWSER_EXECUTABLE']} if os.environ.get('CMS_BROWSER_EXECUTABLE') else {}
    browser = getattr(pw, engine).launch(**options)
    page = browser.new_page(viewport={'width': 600, 'height': 400})
    try:
        page.set_content('<!doctype html><canvas id="a"></canvas><canvas id="b"></canvas>')
        result = page.evaluate("""async fixture=>{
          async function image(src){const img=new Image();img.src=src;await img.decode();return img}
          async function compare(pngData,svg,width,height){
            const blob=new Blob([svg],{type:'image/svg+xml'}), url=URL.createObjectURL(blob);
            try {
              const [a,b]=await Promise.all([image(pngData),image(url)]), ca=document.querySelector('#a'), cb=document.querySelector('#b');
              ca.width=cb.width=width;ca.height=cb.height=height;
              ca.getContext('2d').drawImage(a,0,0,width,height);cb.getContext('2d').drawImage(b,0,0,width,height);
              const x=ca.getContext('2d').getImageData(0,0,width,height).data, y=cb.getContext('2d').getImageData(0,0,width,height).data;
              let total=0;for(let i=0;i<x.length;i+=4)total+=Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2]);
              return total/(width*height*3*255);
            } finally {URL.revokeObjectURL(url)}
          }
          const icon=await compare(fixture.iconPngData,fixture.iconSvg,180,180);
          const mail=await compare(fixture.mailPngData,fixture.mailSvg,192,192);
          const changedIcon=await compare(fixture.iconPngData,fixture.iconSvg.replace('#ffda44','#00aa88'),180,180);
          return {icon,mail,changedIcon};
        }""", fixtures)
        assert result['icon'] < .006, result
        assert result['mail'] < .02, result
        assert result['changedIcon'] > .05, result
        print('PASS managed-svg-cross-engine-fidelity ' + json.dumps(result, sort_keys=True), flush=True)
    finally:
        page.close()
        browser.close()
