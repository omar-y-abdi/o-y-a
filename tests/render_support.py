"""Local document rendering when managed Chromium forbids all URL navigation.

This is NOT an E2E substitute: CSS/HTML are the built files, scripts are the real
source modules flattened for injection. Only origin, cookie storage, clipboard,
network transport, and secure-context UUID generation are adapters. Use browser.py without --render-only for
real URL/module/CSP/cookie navigation tests in an unrestricted test browser.
No Chromium policy or security setting is modified.
"""
from pathlib import Path
import re
import json

ROOT = Path(__file__).resolve().parents[1]


def document(path: str) -> str:
    target = ROOT / 'dist' / ('index.html' if path.split('?')[0] == '/' else path.split('?')[0].lstrip('/'))
    if target.is_dir():
        target /= 'index.html'
    if not target.is_file():
        target = ROOT / 'dist/404.html'
    html = target.read_text()
    html = re.sub(r'<link[^>]+rel="stylesheet" href="([^"]+)"[^>]*>', lambda m: '<style>' + (ROOT / 'dist' / m[1].lstrip('/')).read_text() + '</style>', html)
    html = re.sub(r'<script[^>]+src=[^>]+></script>', '', html)
    html = re.sub(r'<link[^>]+(?:icon|preload)[^>]*>', '', html)
    return html


def inject(page, path: str, *, analytics=False, cookie='', blocked_cookie=False, gpc=False, dnt=False, contact=False, contact_error=False):
    """Use actual DOM behavior with explicitly isolated transport/origin adapters."""
    page.evaluate('''options => {
      window.__oyEvents = []; window.__oyRequests=[]; window.__oyContacts=[]; window.__contactFailure=options.contact_error; window.__oyCookieBlocked = options.blocked;
      const jar = new Map(options.cookie.split(';').filter(Boolean).map(x => x.trim().split('=')));
      Object.defineProperty(window, '__oyTestCookie', {
        get: () => [...jar].map(([k,v]) => k+'='+v).join('; '),
        set: value => { if (!window.__oyCookieBlocked) { const [k,v] = value.split(';')[0].split('='); jar.set(k,v); } }
      });
      Object.defineProperty(navigator, 'globalPrivacyControl', { configurable:true, value:options.gpc });
      Object.defineProperty(navigator, 'doNotTrack', { configurable:true, value:options.dnt ? '1' : '0' });
      window.__oyTestUUID=()=>{
        const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
        const h=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
      };
      if(options.contact) {
        let callback;
        window.turnstile={
          render:(_element,config)=>{callback=config.callback;setTimeout(()=>callback('render-test-token'),30);return 'test-widget';},
          reset:()=>setTimeout(()=>callback('render-test-renewed-token'),30),remove:()=>{}
        };
      }
      window.__oyTransport = async (url, init={}) => {
        window.__oyRequests.push(url);
        if(url==='/data/cards.json') { if(window.__oyCardGate)await window.__oyCardGate; return new Response(JSON.stringify(options.cards),{status:200}); }
        if(url==='/api/contact/config') return new Response(JSON.stringify({enabled:options.contact,sitekey:options.contact?'test-site-key':null}),{status:200});
        if(url==='/api/contact') {
          window.__oyContacts.push(JSON.parse(init.body));
          return new Response(JSON.stringify(window.__contactFailure?{ok:false,message:'Posten kom inte hela vägen. Dina rader finns kvar. Försök igen.'}:{ok:true}),{status:window.__contactFailure?503:200});
        }
        if (url === '/api/config') return new Response(JSON.stringify({analytics:options.analytics}), {status:200});
        if (url === '/api/event') {
          window.__oyEvents.push({body: JSON.parse(init.body), cookie: window.__oyTestCookie, headers: init.headers});
          return new Response(null,{status:204});
        }
        throw new Error('Unexpected request: '+url);
      };
    }''', {'analytics': analytics, 'cookie': cookie, 'blocked': blocked_cookie, 'gpc': gpc, 'dnt': dnt, 'contact':contact, 'contact_error':contact_error,'cards':json.loads((ROOT/'public/data/cards.json').read_text())})
    code = '\n'.join((ROOT / f'src/client/{name}.mjs').read_text() for name in ('privacy', 'cards', 'playlogic', 'games', 'contact', 'joy', 'main'))
    code = re.sub(r'^import .*?;\s*$', '', code, flags=re.M)
    code = code.replace('export ', '')
    code = code.replace("import('./joy.mjs')", 'Promise.resolve({ initJoy })')
    code = code.replace("import('./games.mjs')", 'Promise.resolve({ initGames })')
    code = code.replace("import('./contact.mjs')", 'Promise.resolve({ initContact })')
    code = code.replace('document.cookie', 'window.__oyTestCookie')
    code = 'const crypto = {randomUUID: () => window.__oyTestUUID()};\n' + code
    code = 'const location = new URL(' + json.dumps('http://127.0.0.1:4173' + path) + ');\nconst fetch = window.__oyTransport;\n' + code
    page.add_script_tag(type='module', content=code)
    page.wait_for_function("document.documentElement.classList.contains('js-ready')")
    page.wait_for_timeout(80)


def load(page, path, *, js=True, **options):
    page.set_content(document(path), wait_until='load')
    if js:
        inject(page, path, **options)
