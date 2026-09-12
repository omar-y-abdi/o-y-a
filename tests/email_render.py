"""Render the actual transactional templates locally. Not a mailbox-delivery test."""
from pathlib import Path
import base64
import json
import os
import shutil
import subprocess
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evidence/revision/email'
OUT.mkdir(parents=True, exist_ok=True)
# JSON keeps the JavaScript fixture's line breaks escaped correctly.
node = "import {acknowledgment,notification} from './src/server/emails.mjs';console.log(JSON.stringify({acknowledgment:acknowledgment(),notification:notification(" + json.dumps({'name':'Mira Test','email':'mira@example.org','message':'Hej Omar!\nJag vill bolla en idé för ett litet projekt.\n\nHälsningar,\nMira'}) + ")}));"
result = subprocess.run(['node', '--input-type=module', '-e', node], cwd=ROOT, check=True, capture_output=True, text=True)
templates = json.loads(result.stdout)
gif = 'data:image/gif;base64,' + base64.b64encode((ROOT/'public/mail/omar-smile.gif').read_bytes()).decode()
checks = []
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'), args=['--no-sandbox'])
    try:
        for name, template in templates.items():
            (OUT/(name+'.html')).write_text(template['html'])
            (OUT/(name+'.txt')).write_text(template['text'])
            for width in (360, 680):
                page = browser.new_page(viewport={'width':width, 'height':1000}, reduced_motion='reduce')
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.set_content(template['html'].replace('https://omaryusuf.se/mail/omar-smile.gif', gif), wait_until='load')
                overflow = page.evaluate('document.documentElement.scrollWidth>innerWidth')
                assert not overflow, (name, width)
                assert not errors, errors
                page.screenshot(path=str(OUT/f'{name}-{width}.png'), full_page=True)
                checks.append({'template':name,'width':width,'overflow':overflow,'errors':errors})
                page.close()
    finally:
        browser.close()
(OUT/'checks.json').write_text(json.dumps({'mode':'Chromium HTML mail layout, exact GIF inlined for local rendering; not email-client delivery test','checks':checks}, indent=2))
print(f'{len(checks)} email layouts passed. No emails sent.')
