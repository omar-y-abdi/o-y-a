"""Local document rendering when managed Chromium forbids all URL navigation.

This is NOT an E2E substitute: CSS/HTML are the built files, scripts are the real
source modules flattened for injection. Only origin, cookie storage, clipboard,
and network transport are adapters. Use browser.py without --render-only for
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
    css = '\n'.join(file.read_text() for file in (ROOT / 'dist/assets').glob('*.css'))
    html = re.sub(r'<link[^>]+rel="stylesheet"[^>]*>', lambda _: '<style>' + css + '</style>', html)
    html = re.sub(r'<script[^>]+src=[^>]+></script>', '', html)
    html = re.sub(r'<link[^>]+(?:icon|preload)[^>]*>', '', html)
    return html


def inject(page, path: str, *, analytics=False, cookie='', blocked_cookie=False, gpc=False, dnt=False):
    """Use actual DOM behavior with explicitly isolated transport/origin adapters."""
    page.evaluate('''options => {
      window.__oyEvents = []; window.__oyCookieBlocked = options.blocked;
      const jar = new Map(options.cookie.split(';').filter(Boolean).map(x => x.trim().split('=')));
      Object.defineProperty(window, '__oyTestCookie', {
        get: () => [...jar].map(([k,v]) => k+'='+v).join('; '),
        set: value => { if (!window.__oyCookieBlocked) { const [k,v] = value.split(';')[0].split('='); jar.set(k,v); } }
      });
      Object.defineProperty(navigator, 'globalPrivacyControl', { configurable:true, value:options.gpc });
      Object.defineProperty(navigator, 'doNotTrack', { configurable:true, value:options.dnt ? '1' : '0' });
      window.__oyTransport = async (url, init={}) => {
        if (url === '/api/config') return new Response(JSON.stringify({analytics:options.analytics}), {status:200});
        if (url === '/api/event') {
          window.__oyEvents.push({body: JSON.parse(init.body), cookie: window.__oyTestCookie, headers: init.headers});
          return new Response(null,{status:204});
        }
        throw new Error('Unexpected request: '+url);
      };
    }''', {'analytics': analytics, 'cookie': cookie, 'blocked': blocked_cookie, 'gpc': gpc, 'dnt': dnt})
    code = '\n'.join((ROOT / f'src/client/{name}.mjs').read_text() for name in ('privacy', 'cards', 'joy', 'main'))
    code = re.sub(r'^import .*?;\s*$', '', code, flags=re.M)
    code = code.replace('export ', '')
    code = code.replace("import('./joy.mjs')", 'Promise.resolve({ initJoy })')
    code = code.replace('document.cookie', 'window.__oyTestCookie')
    code = 'const location = new URL(' + json.dumps('http://127.0.0.1:4173' + path) + ');\nconst fetch = window.__oyTransport;\n' + code
    page.add_script_tag(type='module', content=code)
    page.wait_for_function("document.documentElement.classList.contains('js-ready')")
    page.wait_for_timeout(80)


def load(page, path, *, js=True, **options):
    page.set_content(document(path), wait_until='load')
    if js:
        inject(page, path, **options)
