"""Real DOM/animation integration with explicit test-only network/origin adapters.

Managed Chromium in this sandbox blocks URL navigation. This script does not
modify that policy. Run tests/browser.py against the real server elsewhere too.
"""
from pathlib import Path
import json,os,shutil,sys,time,traceback
from playwright.sync_api import sync_playwright,expect
from render_support import load
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence/revision/browser';OUT.mkdir(parents=True,exist_ok=True)
results=[]
def check(name,fn):
 try:
  details=fn();results.append({'name':name,'status':'PASS','details':details});print('PASS',name,flush=True)
 except Exception as error:
  results.append({'name':name,'status':'FAIL','error':str(error)});print('FAIL',name,str(error),flush=True);traceback.print_exc(limit=2)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox'])
 def page_for(path='/',width=1440,motion='reduce',**kw):
  context=browser.new_context(viewport={'width':width,'height':1000 if width>500 else 844},reduced_motion=motion,device_scale_factor=1)
  page=context.new_page();page.set_default_timeout(6000);page.errors=[];page.on('pageerror',lambda e:page.errors.append(str(e)))
  load(page,path,**kw);return context,page
 def snap(page,name,selector=None,full=True):
  path=str(OUT/(name+'.png'))
  if selector or full:
   # Capture from document zero so offscreen fixed skip links stay offscreen.
   page.evaluate('scrollTo({top:0,behavior:"instant"})')
   if selector:
    page.screenshot(path=path,full_page=True,clip=page.locator(selector).bounding_box())
   else:
    page.screenshot(path=path,full_page=True)
  else:
   page.screenshot(path=path)
 def clean(page):assert not page.errors,page.errors
 for width in (320,390,768,1440):
  for motion in ('reduce','no-preference'):
   def top(width=width,motion=motion):
    ctx,page=page_for('/',width,motion)
    try:
     page.evaluate('scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})')
     assert page.evaluate('scrollY')>500
     page.locator('[data-back-top]').click();page.wait_for_function('scrollY===0')
     assert page.evaluate('scrollY')==0
     if width in (390,1440) and motion=='reduce':snap(page,f'top-{width}',full=False)
     clean(page);return {'scrollY':page.evaluate('scrollY'),'width':width,'motion':motion}
    finally:ctx.close()
   check(f'Footer reaches scrollY=0 at {width}, {motion}',top)
 for width in (390,1440):
  def identity(width=width):
   ctx,page=page_for('/',width)
   try:
    assert page.locator('.id-monogram').count()==0
    expect(page.locator('.human-card .curiosity-drawing')).to_be_visible()
    snap(page,f'identity-{width}', '.about-teaser')
    snap(page,f'projects-{width}', '#byggen')
    assert page.locator('.project-grid article').count()==4
    assert page.locator('a[href="/projekt/blade-blend/"]').count()>=2
    assert page.locator('a[href="/projekt/backhaul/"]').count()>=2
    assert '/data/cards.json' not in page.evaluate('__oyRequests')
    clean(page)
   finally:ctx.close()
  check(f'Actual identity, projects and lazy bank {width}',identity)
  def printer(width=width):
   ctx,page=page_for('/verkstad/',width,'no-preference')
   try:
    stage=page.locator('[data-machine]');receipt=page.locator('[data-receipt]');button=page.locator('[data-print]')
    stage.scroll_into_view_if_needed()
    assert page.locator('[data-face],.printer-top').count()==0
    assert page.locator('.joy-ball').evaluate('(e)=>e.tagName')=='DIV'
    assert page.locator('.machine-display').get_attribute('aria-hidden')=='true'
    bounds=stage.bounding_box()
    page.mouse.move(bounds['x']+bounds['width']*.8,bounds['y']+bounds['height']*.3)
    page.wait_for_function('document.querySelector(".eye i").style.transform !== ""')
    assert page.locator('.eye i').first.evaluate('(e)=>e.style.transform').startswith('translate(')
    page.mouse.move(0,0)
    page.wait_for_function('document.querySelector(".eye i").style.transform === ""')
    face=page.locator('.joy-ball').bounding_box()
    page.mouse.click(face['x']+face['width']/2,face['y']+face['height']/2)
    assert stage.get_attribute('data-mood') is None
    assert page.locator('[data-machine-status]').inner_text()==''
    page.locator('input[value="joke"]').check()
    button.click()
    expect(button).to_be_disabled()
    assert receipt.is_hidden()
    assert stage.get_attribute('data-print-phase') is None
    expect(receipt).to_be_visible()
    animation=receipt.evaluate('(e)=>({name:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration,origin:getComputedStyle(e).transformOrigin})')
    assert animation['name']=='receipt-in',animation
    assert animation['duration']=='0.55s',animation
    snap(page,f'printer-original-enter-{width}',full=False)
    expect(button).to_be_enabled()
    page.wait_for_timeout(600);snap(page,f'printer-finished-{width}',full=False)
    assert stage.get_attribute('data-mood') is None
    assert stage.get_attribute('data-print-phase') is None
    assert not receipt.evaluate('(e)=>e.inert')
    first=page.locator('[data-card-message]').inner_text().strip();assert first
    rect=receipt.bounding_box()
    assert rect['x']>=0 and rect['x']+rect['width']<=width,rect
    assert page.evaluate('__oyRequests.filter(x=>x==="/data/cards.json").length')==1
    page.locator('[data-receipt-close]').click();expect(button).to_be_focused()
    button.click();assert receipt.is_hidden()
    page.locator('[data-motion-toggle]').click()
    expect(button).to_be_enabled();expect(receipt).to_be_visible()
    assert page.locator('[data-card-message]').inner_text().strip()!=first
    assert stage.get_attribute('data-mood') is None
    assert stage.get_attribute('data-print-phase') is None
    page.wait_for_timeout(650)
    assert not stage.evaluate('(e)=>e.classList.contains("is-working")')
    clean(page);return {'animation':animation,'receiptBounds':rect,'eyeTracking':True,'noClickEmotes':True,'pauseCompletesPrint':True}
   finally:ctx.close()
  check(f'Original receipt, eye-only face, pause and bounds {width}',printer)
  def contact(width=width):
   ctx,page=page_for('/kontakt/',width,contact=True)
   try:
    assert '/api/contact/config' not in page.evaluate('__oyRequests')
    snap(page,f'contact-closed-{width}')
    page.locator('.envelope').click();expect(page.locator('[data-contact-send]')).to_be_enabled()
    snap(page,f'contact-open-{width}')
    assert '@chalmers.se' not in page.content()
    assert 'När du öppnar kuvertet laddas' not in page.locator('main').inner_text()
    page.locator('[data-contact-send]').click()
    expect(page.locator('#contact-name')).to_be_focused()
    page.locator('#contact-name').fill('Mira Test')
    page.locator('#contact-email').fill('mira@example.org')
    page.locator('[data-contact-send]').click()
    expect(page.locator('[data-contact-success]')).to_be_visible()
    assert page.evaluate('__oyContacts.length')==1
    assert page.evaluate('__oyContacts[0].message')==''
    snap(page,f'contact-success-{width}')
    clean(page)
   finally:ctx.close()
  check(f'Contact required fields, optional message, no leakage {width}',contact)
 def retry():
  ctx,page=page_for('/kontakt/',390,contact=True,contact_error=True)
  try:
   page.locator('.envelope').click();expect(page.locator('[data-contact-send]')).to_be_enabled()
   page.locator('#contact-name').fill('Mira Test');page.locator('#contact-email').fill('mira@example.org');page.locator('#contact-message').fill('En fråga som ska finnas kvar.')
   page.locator('[data-contact-send]').click();expect(page.locator('[data-contact-status]')).to_contain_text('Dina rader finns kvar')
   expect(page.locator('#contact-message')).to_have_value('En fråga som ska finnas kvar.')
   expect(page.locator('[data-contact-success]')).to_be_hidden();snap(page,'contact-error-390')
   first=page.evaluate('__oyContacts[0].submission');page.evaluate('__contactFailure=false')
   expect(page.locator('[data-contact-send]')).to_be_enabled();page.locator('[data-contact-send]').click();expect(page.locator('[data-contact-success]')).to_be_visible()
   assert page.evaluate('__oyContacts[1].submission')==first
   clean(page)
  finally:ctx.close()
 check('Contact error retains input and retry reuses idempotency ID',retry)
 def bubble():
  ctx,page=page_for('/verkstad/',1440,'no-preference')
  try:
   buttons=page.locator('[data-bubble]');buttons.first.scroll_into_view_if_needed()
   buttons.nth(0).click();page.wait_for_timeout(70);snap(page,'bubble-burst-1440',full=False)
   assert page.locator('.pop-drop').count()>0
   page.locator('[data-bubble-reset]').click();buttons.nth(0).click();buttons.nth(1).click();assert 'avgångstid' in page.locator('[data-bubble-status]').inner_text()
   page.locator('[data-bubble-reset]').click();buttons.nth(0).click();page.wait_for_timeout(2600);buttons.nth(1).click()
   assert 'fylla år' in page.locator('[data-bubble-status]').inner_text()
   page.wait_for_timeout(450);assert page.locator('.pop-drop,.pop-ring').count()==0
   clean(page)
  finally:ctx.close()
 check('Bubbles visibly burst and adapt to measured fast/slow clicks',bubble)
 def memory():
  ctx,page=page_for('/verkstad/',390)
  try:
   grid=page.locator('[data-memory-grid]');buttons=grid.locator('button');assert buttons.count()==12
   answers=buttons.evaluate_all('(bs)=>bs.map(b=>b.querySelector(".memory-front").className)')
   other=next(i for i,v in enumerate(answers) if v!=answers[0]);buttons.nth(0).click();buttons.nth(other).click()
   page.locator('[data-memory-reset]').click();page.wait_for_timeout(1100);assert page.locator('.memory-card.is-open').count()==0
   answers=buttons.evaluate_all('(bs)=>bs.map(b=>b.querySelector(".memory-front").className)')
   for answer in set(answers):
    for i,v in enumerate(answers):
     if v==answer:buttons.nth(i).focus();page.keyboard.press('Enter')
   assert page.locator('.memory-card.is-matched').count()==12
   expect(page.locator('[data-memory-status]')).to_contain_text('Alla hittade hem på 6 försök')
   snap(page,'memory-complete-390','.memory-section');clean(page)
  finally:ctx.close()
 check('Memory mismatch/reset race, six pairs, keyboard completion',memory)
 def fika():
  ctx,page=page_for('/verkstad/',1440)
  try:
   button=page.locator('[data-fika-button]');button.focus();page.keyboard.press('Enter');page.wait_for_timeout(5000);page.keyboard.press('Enter')
   value=float(page.locator('[data-fika-result]').inner_text().replace(',','.').replace(' s',''))
   assert 4.8<=value<=5.6,value
   expect(page.locator('[data-fika-status]')).to_contain_text('äggklocka')
   snap(page,'fika-result-1440','.fika-section')
   button.click();page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"))')
   assert 'fliken' in page.locator('[data-fika-status]').inner_text()
   clean(page);return {'measuredSeconds':value,'backgroundAbort':'document visibility adapter'}
  finally:ctx.close()
 check('Fika uses actual elapsed time and aborts on background event',fika)
 def deferred_hidden():
  ctx,page=page_for('/',1440,'no-preference')
  try:
   page.evaluate('()=>{window.__oyCardGate=new Promise(r=>window.__releaseCards=r)}')
   page.locator('[data-print]').click()
   page.evaluate('Object.defineProperty(document,"hidden",{value:true,configurable:true});document.dispatchEvent(new Event("visibilitychange"));window.__releaseCards()')
   page.wait_for_timeout(100)
   assert page.locator('[data-machine]').get_attribute('data-print-phase') is None
   expect(page.locator('[data-print]')).to_be_enabled();clean(page)
  finally:ctx.close()
 check('Delayed card load after tab leaves does not restart animation',deferred_hidden)
 def nojs_top():
  ctx=browser.new_context(viewport={'width':390,'height':844},java_script_enabled=False,reduced_motion='reduce');page=ctx.new_page()
  try:
   load(page,'/',js=False);page.evaluate('scrollTo(0,document.documentElement.scrollHeight)')
   page.locator('[data-back-top]').click();page.wait_for_function('scrollY===0')
   return {'scrollY':page.evaluate('scrollY'),'javascript':False}
  finally:ctx.close()
 check('Native back-to-top anchor also reaches zero without application JavaScript',nojs_top)
 browser.close()
report={'mode':'rendered-document integration; contact/Turnstile adapters; not hosted E2E','passed':sum(x['status']=='PASS' for x in results),'failed':sum(x['status']=='FAIL' for x in results),'checks':results}
(OUT.parent/'browser-revision.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='checks'}));sys.exit(bool(report['failed']))
