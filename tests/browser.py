"""Browser and rendered-document regression checks.

Default: real HTTP navigation, production module loading, browser cookies and CSP.
--render-only: explicit managed-browser fallback. Verifies real HTML/CSS/DOM logic,
not browser URL loading, real cookies, CSP enforcement or hosted Cloudflare.
The output identifies the mode and never labels document rendering as E2E.
"""
from pathlib import Path
import argparse
import json
import os
import shutil
import sys
import traceback
from playwright.sync_api import sync_playwright, expect
from render_support import load as render_load

ROOT = Path(__file__).resolve().parents[1]
PAGES = ['/', '/verkstad/', '/om/', '/projekt/furl/', '/projekt/blade-blend/', '/projekt/backhaul/', '/kontakt/', '/integritet/', '/kakor/', '/villkor/', '/tillganglighet/', '/404.html']
SIZES = [(320,780), (390,844), (768,1024), (1024,900), (1440,1000), (1920,1080)]
parser = argparse.ArgumentParser()
parser.add_argument('--render-only', action='store_true')
parser.add_argument('--base-url', default='http://127.0.0.1:4173')
parser.add_argument('--analytics-url', default='http://127.0.0.1:4174')
parser.add_argument('--section', choices=['pages','interactions','privacy','all'], default='all')
parser.add_argument('--screenshots', action='store_true')
args = parser.parse_args()
OUT = ROOT/'artifacts'
(OUT/'screenshots').mkdir(exist_ok=True,parents=True)
results=[]
mode = 'rendered-document component integration (origin/cookie/network adapters)' if args.render_only else 'HTTP browser E2E'

def check(name, action):
    try:
        details = action()
        results.append({'name':name, 'status':'PASS', 'details':details})
        print('PASS',name, flush=True)
    except Exception as exc:
        results.append({'name':name, 'status':'FAIL','error':str(exc)})
        print('FAIL',name,str(exc)[:600], flush=True)
        traceback.print_exc(limit=2)

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox'])

    def visit(path, width=1440, height=1000, *, js=True, motion='reduce', analytics=False, cookie='', blocked_cookie=False, gpc=False, dnt=False):
        context=browser.new_context(viewport={'width':width,'height':height}, device_scale_factor=1, java_script_enabled=js, reduced_motion=motion, accept_downloads=True)
        errors=[]
        page=context.new_page()
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('console',lambda message:errors.append(message.text) if message.type == 'error' and not (not args.render_only and '404' in message.text and path == '/404.html') else None)
        page._oy_errors=errors
        if args.render_only:
            render_load(page,path,js=js,analytics=analytics,cookie=cookie,blocked_cookie=blocked_cookie,gpc=gpc,dnt=dnt)
        else:
            origin=args.analytics_url if analytics else args.base_url
            if cookie:
                for item in cookie.split(';'):
                    name, value = item.strip().split('=',1)
                    context.add_cookies([{'name':name,'value':value,'url':origin}])
            if blocked_cookie:
                page.add_init_script("const cookieDescriptor=Object.getOwnPropertyDescriptor(Document.prototype,'cookie');Object.defineProperty(document,'cookie',{get:()=>cookieDescriptor.get.call(document),set:()=>{}})")
            if gpc:
                page.add_init_script("Object.defineProperty(navigator,'globalPrivacyControl',{value:true})")
            if dnt:
                page.add_init_script("Object.defineProperty(navigator,'doNotTrack',{value:'1'})")
            page._oy_events=[]
            page.on('request',lambda req: page._oy_events.append(req.post_data_json) if req.url.endswith('/api/event') else None)
            page.goto(origin+path,wait_until='networkidle')
        return context,page

    def events(page):
        return page.evaluate('window.__oyEvents') if args.render_only else page._oy_events

    def no_errors(page):
        assert not page._oy_errors, page._oy_errors

    def screenshot(page,name,full=True):
        if args.screenshots:
            if full:
                page.evaluate('window.scrollTo({top:0,left:0,behavior:"instant"})')
            page.screenshot(path=str(OUT/f'screenshots/{name}.png'),full_page=full,animations='disabled')

    if args.section in ('pages','all'):
        for path in PAGES:
            for width,height in SIZES:
                def page_check(path=path,width=width,height=height):
                    context,page=visit(path,width,height)
                    try:
                        expect(page.locator('h1')).to_have_count(1)
                        assert page.locator('html').get_attribute('lang') == 'sv'
                        assert 'Omar Yusuf' in page.title()
                        overflow=page.evaluate('({viewport:innerWidth,html:document.documentElement.scrollWidth,body:document.body.scrollWidth})')
                        assert max(overflow['html'],overflow['body']) <= width+1, overflow
                        for img in page.locator('img').all():
                            assert img.get_attribute('alt') is not None
                        assert page.locator('main').inner_text().strip()
                        for control in page.locator('button,a,input').all():
                            if not control.is_visible(): continue
                            label=control.get_attribute('aria-label') or control.inner_text().strip() or control.evaluate('(e)=>[...(e.labels || [])].map(label=>label.textContent).join(" " ).trim()')
                            assert label, control.evaluate('(e)=>e.outerHTML')
                        assert page.locator('iframe').count()==0
                        no_errors(page)
                        if width in (390,1440): screenshot(page,(path.strip('/').replace('/','-') or 'home')+f'-{width}')
                        return overflow
                    finally: context.close()
                check(f'{path} at {width}px',page_check)

        for width in (390,1440):
            def nojs(width=width):
                context,page=visit('/',width,844,js=False)
                try:
                    expect(page.locator('h1')).to_contain_text('Omar')
                    assert page.get_by_role('link',name='Människan',exact=True).is_visible()
                    assert page.locator('noscript').inner_text().strip()
                    assert page.locator('[data-print]').is_disabled()
                    screenshot(page,f'home-no-js-{width}')
                finally: context.close()
            check(f'No JavaScript navigation and fallback {width}px',nojs)

    if args.section in ('interactions','all'):
        def machine():
            context,page=visit('/verkstad/',390,844)
            try:
                expect(page.locator('[data-print]')).to_be_enabled()
                messages=[]
                for flavor in ('kind','joke','pause'):
                    page.locator(f'input[value="{flavor}"]').check()
                    for i in range(2):
                        page.locator('[data-print]').click()
                        expect(page.locator('[data-receipt]')).to_be_visible()
                        text=page.locator('[data-card-message]').inner_text()
                        assert text and (not messages or text != messages[-1]), text
                        messages.append(text)
                        expect(page.locator('[data-share]')).to_be_enabled()
                        expect(page.locator('[data-save]')).to_be_enabled()
                        screenshot(page,f'workshop-{flavor}-receipt-390')
                        page.locator('[data-receipt-close]').click()
                        expect(page.locator('[data-print]')).to_be_focused()
                no_errors(page)
                return messages
            finally: context.close()
        check('Machine: all flavors, distinct receipts, close and focus restore',machine)

        def shared():
            context,page=visit('/verkstad/?kort=j01',1440,1000)
            try:
                expect(page.locator('[data-receipt]')).to_be_visible()
                assert page.locator('input[value="joke"]').is_checked()
                screenshot(page,'shared-receipt-1440')
                no_errors(page)
            finally: context.close()
            context,page=visit('/verkstad/?kort=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E')
            try:
                assert page.locator('[data-receipt]').is_hidden()
                assert page.locator('[data-toast]').inner_text().startswith('Det kortet finns inte')
                assert page.locator('img').count()==0
                no_errors(page)
            finally: context.close()
        check('Shared card exact-ID lookup and hostile query rejection',shared)

        def copy_fallback():
            context,page=visit('/verkstad/?kort=k01',390,844)
            try:
                # Force the failure path regardless of the machine clipboard policy.
                page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Blocked')}}})")
                page.locator('[data-share]').click()
                expect(page.locator('[data-copy-fallback]')).to_be_visible()
                assert page.locator('#share-url').input_value().endswith('/verkstad/?kort=k01')
                expect(page.locator('#share-url')).to_be_focused()
                screenshot(page,'clipboard-fallback-390')
                no_errors(page)
            finally: context.close()
        check('Clipboard denial: usable labelled manual copy fallback',copy_fallback)

        def save_card():
            context,page=visit('/verkstad/?kort=p01')
            try:
                # Capture the real canvas output before browser download policy intervenes.
                page.evaluate('''() => {
                  const original=HTMLCanvasElement.prototype.toBlob;
                  window.__savedCard=null;
                  HTMLCanvasElement.prototype.toBlob=function(callback,...rest){window.__savedCard=this.toDataURL('image/png');return original.call(this,callback,...rest)};
                }''')
                page.locator('[data-save]').click()
                page.wait_for_function('window.__savedCard !== null')
                data=page.evaluate('window.__savedCard')
                assert data.startswith('data:image/png;base64,')
                import base64
                (OUT/'screenshots/saved-card.png').write_bytes(base64.b64decode(data.split(',')[1]))
                no_errors(page)
                return 'Real canvas PNG bytes captured. Browser save dialog is a separate host-policy gate.'
            finally: context.close()
        check('Save: actual generated 1200x800 PNG',save_card)

        def bubbles():
            context,page=visit('/verkstad/',390,844)
            try:
                sound=page.locator('[data-sound-toggle]')
                expect(sound).to_have_attribute('aria-pressed','false')
                assert 'av' in sound.inner_text()
                for i in range(12):
                    bubble=page.locator(f'[data-bubble="{i}"]')
                    bubble.focus(); page.keyboard.press('Space')
                    expect(bubble).to_have_attribute('aria-pressed','true')
                assert 'Alla poppade' in page.locator('[data-bubble-status]').inner_text()
                page.locator('[data-bubble="11"]').click()
                assert 'Alla poppade' in page.locator('[data-bubble-status]').inner_text()
                screenshot(page,'bubbles-popped-390')
                page.locator('[data-bubble-reset]').click()
                assert page.locator('[data-bubble][aria-pressed="false"]').count()==12
                page.evaluate('window.AudioContext=undefined;window.webkitAudioContext=undefined')
                sound.click()
                expect(sound).to_have_attribute('aria-pressed','false')
                assert 'Ljud stöds inte' in page.locator('[data-toast]').inner_text()
                no_errors(page)
            finally: context.close()
        check('Bubbles: keyboard, count, duplicate suppression, reset, sound off/failure',bubbles)

        def mobile_menu():
            context,page=visit('/',390,844)
            try:
                page.keyboard.press('Tab')
                assert 'Hoppa' in page.locator(':focus').inner_text()
                toggle=page.locator('[data-menu-toggle]')
                toggle.click()
                expect(page.locator('#mobile-menu')).to_be_visible()
                screenshot(page,'mobile-menu-390')
                page.keyboard.press('Escape')
                expect(page.locator('#mobile-menu')).to_be_hidden()
                expect(toggle).to_be_focused()
                toggle.click();page.set_viewport_size({'width':1024,'height':900})
                expect(page.locator('#mobile-menu')).to_be_hidden()
                no_errors(page)
            finally: context.close()
        check('Skip link, mobile menu, Escape and resize dismissal',mobile_menu)

        def button_wrapping():
            context,page=visit('/om/',390,844)
            try:
                for selector in ('.hello-link', '.about-cta .button'):
                    control=page.locator(selector)
                    if not control.is_visible(): continue
                    lines=control.evaluate('(e)=>{const r=document.createRange();r.selectNodeContents(e.childNodes[0]);return r.getClientRects().length}')
                    assert lines <= 1, f'{selector} wraps a short label over {lines} lines'
            finally: context.close()
        check('Mobile short action labels do not wrap into cramped pills',button_wrapping)

        def fold():
            context,page=visit('/projekt/furl/')
            try:
                page.locator('[data-fold]').click()
                assert page.locator('.repeat-line:visible').count()==0
                assert page.locator('.folded-line').is_visible()
                screenshot(page,'furl-folded-1440')
                page.locator('[data-fold]').click()
                assert page.locator('.repeat-line:visible').count()==3
                assert page.locator('.folded-line').is_hidden()
                assert 'inte' in page.locator('[data-fold-status]').inner_text()
                no_errors(page)
            finally: context.close()
        check('Furl illustrative fold/unfold preserves and restores all lines',fold)

        def motion():
            context,page=visit('/',motion='reduce')
            try:
                expect(page.locator('html')).to_have_attribute('data-motion','off')
                assert page.locator('[data-motion-toggle]').is_disabled()
                assert page.locator('.joy-ball').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
                page.locator('[data-print]').click()
                expect(page.locator('[data-receipt]')).to_be_visible()
                assert page.locator('.confetti-piece').count()==0
                no_errors(page)
            finally: context.close()
            context,page=visit('/',motion='no-preference')
            try:
                page.locator('[data-motion-toggle]').click()
                expect(page.locator('html')).to_have_attribute('data-motion','off')
                assert page.locator('.joy-ball').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
                if args.render_only: assert 'oy_motion=off' in page.evaluate('window.__oyTestCookie')
                else: assert 'oy_motion=off' in page.evaluate('document.cookie')
                no_errors(page)
            finally: context.close()
        check('System reduced motion and explicit pause, animations actually stopped',motion)

    if args.section in ('privacy','all'):
        def privacy_dialog():
            context,page=visit('/',390,844)
            try:
                button=page.locator('[data-privacy-open]').first
                button.click()
                dialog=page.locator('[data-privacy-dialog]')
                expect(dialog).to_be_visible()
                assert 'inte aktiv' in page.locator('[data-privacy-status]').inner_text()
                assert dialog.locator('[data-consent="allow"]').is_disabled()
                for _ in range(12):
                    page.keyboard.press('Tab')
                    assert page.evaluate('!document.hasFocus() || document.activeElement.closest("dialog") !== null'), 'Focus entered another page control while modal was open'
                screenshot(page,'privacy-dialog-390',full=False)
                page.keyboard.press('Escape')
                expect(dialog).to_be_hidden()
                expect(button).to_be_focused()
                no_errors(page)
            finally: context.close()
        check('Native privacy dialog: disabled unavailable tracking, focus trap and restoration',privacy_dialog)

        def consent():
            context,page=visit('/verkstad/',390,844,analytics=True)
            try:
                page.wait_for_timeout(100)
                assert events(page)==[]
                expect(page.locator('[data-consent-banner]')).to_be_visible()
                screenshot(page,'consent-banner-390',full=False)
                page.locator('[data-consent-banner] [data-consent="allow"]').click()
                page.wait_for_timeout(50)
                assert len(events(page))==1
                page.locator('[data-print]').click();page.wait_for_timeout(50)
                assert len(events(page))==2
                page.locator('[data-receipt-close]').click();page.locator('[data-print]').click();page.wait_for_timeout(50)
                assert len(events(page))==2
                page.locator('[data-privacy-open]').first.click()
                page.locator('dialog [data-consent="deny"]').click()
                for i in range(12):page.locator(f'[data-bubble="{i}"]').click()
                assert len(events(page))==2
                no_errors(page)
                return 'No pre-consent event; page_view and joy once; no bubble event after revocation.'
            finally: context.close()
        check('Consent gates collection and revocation stops new events immediately',consent)

        def revoke_failed_cookie():
            context,page=visit('/',analytics=True,cookie='oy_privacy=v1.allow',blocked_cookie=True)
            try:
                page.wait_for_timeout(50)
                assert len(events(page))==1
                page.locator('[data-privacy-open]').first.click()
                page.locator('dialog [data-consent="deny"]').click()
                page.locator('[data-print]').click();page.wait_for_timeout(50)
                assert len(events(page))==1, 'A refused cookie write must never allow tracking after explicit revocation'
                no_errors(page)
            finally: context.close()
        check('Revocation stops tracking even when overwriting an old allow cookie fails',revoke_failed_cookie)

        for setting in ('gpc','dnt','blocked_cookie'):
            def privacy_reject(setting=setting):
                context,page=visit('/',analytics=True,**{setting:True})
                try:
                    if setting=='blocked_cookie':
                        page.locator('[data-consent-banner] [data-consent="allow"]').click()
                        assert 'sparade inte' in page.locator('[data-toast]').inner_text()
                    else:
                        assert page.locator('[data-consent-banner]').is_hidden()
                        page.locator('[data-privacy-open]').first.click()
                        assert page.locator('dialog [data-consent="allow"]').is_disabled()
                        page.keyboard.press('Escape')
                    page.locator('[data-print]').click();page.wait_for_timeout(50)
                    assert events(page)==[]
                    no_errors(page)
                finally: context.close()
            check(f'Privacy fails closed: {setting}',privacy_reject)
    browser.close()

report={'mode':mode,'section':args.section,'passed':sum(x['status']=='PASS' for x in results),'failed':sum(x['status']=='FAIL' for x in results),'tests':results}
file=OUT/f'browser-{args.section}-{"render" if args.render_only else "http"}.json'
file.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='tests'},ensure_ascii=False),flush=True)
sys.exit(1 if report['failed'] else 0)
