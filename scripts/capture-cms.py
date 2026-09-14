"""Capture real studio surfaces for a human visual review; no image synthesis."""
import ast
import importlib.util
import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('cms_qa',ROOT/'tests/cms-browser.py')
m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
OUT=ROOT/'output/visual/studio';OUT.mkdir(parents=True,exist_ok=True)
report=m.Reporter(ROOT/'output/logs/cms-capture.log')
audit=next(ast.literal_eval(node.value) for node in ast.parse((ROOT/'tests/contrast.py').read_text()).body if isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id=='SCRIPT' for target in node.targets))
contrast=[];timings=[]
def capture(page,name):
 page.evaluate('''async()=>{await Promise.all([...document.images].filter(img=>{const r=img.getBoundingClientRect();return r.width&&r.height&&r.top<innerHeight&&r.bottom>0}).map(img=>img.decode().catch(()=>{})))}''')
 page.mouse.move(5,5);page.screenshot(path=str(OUT/f'{name}.png'));report.note('captured '+name)
 data=page.evaluate(audit);contrast.append({'view':name,**data})
with sync_playwright() as p:
 b=p.chromium.launch();qa=m.CMSBrowserQA(b,report)
 for width,height,label in [(1440,900,'desktop'),(390,844,'mobile')]:
  c=b.new_context(viewport={'width':width,'height':height});page=c.new_page();page.goto(m.BASE_URL+'/login/');capture(page,'login-'+label);c.close()
  started=time.perf_counter();c,page,errors=qa.admin_page({'width':width,'height':height},label);timings.append({'viewport':label,'readyMs':round((time.perf_counter()-started)*1000),'includesHarnessWaitMs':1100})
  capture(page,'editor-'+label)
  if width<500:
   page.locator('[data-action=toggle-pages]').click();capture(page,'pages-mobile');page.locator('[data-action=toggle-pages]').click()
   page.locator('[data-action=toggle-properties]').click();capture(page,'properties-mobile');page.locator('[data-action=toggle-properties]').click()
  else:
   qa.frame(page).locator('h1').click();capture(page,'typography')
   page.locator('[data-inspector=layers]').click();capture(page,'layers')
   page.locator('[data-inspector=blocks]').click();capture(page,'blocks')
   page.locator('[data-action=theme]').click();capture(page,'theme')
   page.locator('[data-action=runtime]').click();capture(page,'runtime-texts')
   page.locator('[data-library=assets]').click();capture(page,'media-library')
   page.locator('#file-input').set_input_files(str(ROOT/'public/mail/omar-smile.png'))
   page.locator('#asset-name').wait_for(state='visible');page.locator('#asset-name').fill('Omars glada figur');page.locator('#asset-alt').fill('Gul leende figur på blå bakgrund');page.locator('[data-action=save-asset]').click();capture(page,'asset-details')
   page.locator('[data-special=wins]').click();capture(page,'wins-library')
   page.locator('[data-win-id]').first.click();qa.wait_canvas(page);capture(page,'win-design')
   page.locator('[data-action=lock]').click();expect(page.frame_locator('#preview-stage iframe').locator('#cms-win-preview .win-design')).to_be_visible(timeout=20000);capture(page,'win-locked')
   page.locator('[data-action=edit]').click()
   page.locator('[data-action=history]').click();page.locator('[data-review-version]').first.wait_for();capture(page,'history')
   page.locator('[data-review-version="0"]').click();expect(page.locator('#preview-stage iframe')).to_be_visible(timeout=20000);capture(page,'history-review')
   page.locator('[data-action=edit]').click();qa.wait_canvas(page)
   page.locator('[data-device=compare]').click();expect(page.locator('#preview-stage iframe')).to_have_count(2);page.wait_for_timeout(700);capture(page,'compare')
   page.locator('[data-action=edit]').click();qa.wait_canvas(page)
   page.locator('[data-action=collapse-left]').click();capture(page,'canvas-expanded');page.locator('[data-action=expand-left]').click()
  # Every direct main section, including the middle of long pages.
  for entry in qa.discover_pages(page):
   qa.open_page(page,entry);frame=qa.frame(page)
   sections=frame.locator('main > section, main > div > section, main .legal-content > section')
   for index in range(sections.count()):
    section=sections.nth(index)
    if not section.is_visible():continue
    section.evaluate('(el)=>el.scrollIntoView({block:"start"})')
    page.wait_for_timeout(80)
    capture(page,f'section-{entry["id"]}-{label}-{index+1:02}')
  m.assert_clean(errors,label);c.close()
 b.close()
(ROOT/'output/perf/admin-ready.json').write_text(json.dumps(timings,indent=2))
failures=[{'view':item['view'],**row} for item in contrast for row in item['rows'] if not row['pass']]
(ROOT/'output/perf/admin-contrast.json').write_text(json.dumps({'failures':failures,'views':contrast},ensure_ascii=False,indent=2))
report.note(f'contrast checked {sum(len(x["rows"]) for x in contrast)}; failures {len(failures)}')
report.summary()
