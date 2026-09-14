"""Navigational acceptance tests for R14-R21 and recovery failures.

Runs only against the isolated signed-identity Worker started by test-cms.mjs.
No product code, browser policy, CSP or authentication is disabled.
"""
import copy
import importlib.util
import json
import os
import struct
import sys
import uuid
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('cms_final_qa', ROOT/'tests/cms-browser.py')
qa = importlib.util.module_from_spec(spec); sys.modules[spec.name] = qa; spec.loader.exec_module(qa)
BASE = qa.BASE_URL
assert qa.loopback_base(BASE), 'Use only the isolated local Worker'
ENGINE = os.environ.get('CMS_BROWSER', 'chromium')
OUT = ROOT/'output/visual/review-final'/ENGINE; OUT.mkdir(parents=True, exist_ok=True)
report = qa.Reporter(ROOT/f'output/logs/cms-review-final-{ENGINE}.log')


def api(context, path, data=None):
    url = BASE+'/admin/api/'+path
    return qa.read_api(context.request, url) if data is None else context.request.post(url, data=data, headers={'Origin': BASE, 'X-CMS-Request': '1'})


def publish(context, project):
    state = api(context, 'state').json()
    result = api(context, 'save', {'project': project, 'baseVersion': state['version'], 'requestId': str(uuid.uuid4())})
    assert result.ok, (result.status, result.text()[:500])
    return result.json()


def frame(page):
    return page.frame_locator('#editor iframe.gjs-frame')


def ready(page):
    qa.CMSBrowserQA.wait_canvas(page)


def saved(page):
    page.locator('[data-action=save]').click()
    qa.CMSBrowserQA.wait_saved(page)


def records(page):
    return page.evaluate("""()=>new Promise((resolve,reject)=>{const q=indexedDB.open('oy-portfolio-studio',1);q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result;const tx=db.transaction('drafts');const r=tx.objectStore('drafts').getAll();r.onsuccess=()=>{resolve(r.result);db.close()}}})""")


with sync_playwright() as pw:
    browser = qa.launch_browser(pw)

    def setup(markup=None, css='', init=None):
        ctx = browser.new_context(storage_state=str(qa.STATE_PATH), viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce', accept_downloads=True)
        if init: ctx.add_init_script(init)
        baseline = api(ctx, 'revision/0').json()['project']
        state = api(ctx, 'state').json()
        if markup is not None:
            page_data = copy.deepcopy(state['blank'])
            page_data.update(id='final-acceptance', sourceId='blank', path='/final-acceptance/', css=css)
            page_data['html'] = page_data['html'].replace('</main>', markup+'</main>')
            baseline['pages'].append(page_data)
        publish(ctx, baseline)
        page = ctx.new_page(); page.on('dialog', lambda dialog: dialog.accept())
        page.goto(BASE+'/admin/'); ready(page)
        if markup is not None:
            page.locator('[data-page-id=final-acceptance]').click(); ready(page)
        return ctx, page

    def active_text():
        ctx, page = setup('<p id="live-copy">Original editable paragraph</p>')
        try:
            target = frame(page).locator('#live-copy'); target.dblclick()
            expect(target).to_have_attribute('contenteditable', 'true')
            target.press('ControlOrMeta+A'); target.press('Backspace'); target.press_sequentially('Still typing before blur', delay=20)
            target.press('Shift+Enter'); target.press_sequentially('Second line', delay=20)
            expect(page.locator('[data-action=save]')).to_be_enabled()
            expect(page.locator('#backup-status')).to_contain_text('sparat för denna flik', timeout=10000)
            assert target.evaluate('el=>el.isContentEditable')
            assert any('Still typing before blur' in json.dumps(row.get('project', {})) for row in records(page))
            page.reload(); ready(page)
            expect(page.locator('#dialog-content')).to_contain_text('En idé väntar')
            page.locator('[data-confirm=yes]').click(); expect(page.locator('#studio-dialog')).to_be_hidden(timeout=20000); ready(page)
            page.locator('[data-page-id=final-acceptance]').click(); ready(page)
            expect(frame(page).locator('#live-copy')).to_have_text('Still typing before blurSecond line')
            saved(page)
            public = browser.new_page(); public.goto(BASE+'/final-acceptance/')
            expect(public.locator('#live-copy')).to_have_text('Still typing before blurSecond line')
            assert public.locator('#live-copy br').count() == 1
            public.screenshot(path=str(OUT/'active-text-public.png')); public.close()
        finally: ctx.close()

    def rich_inspector():
        markup = '<p id="rich-copy">Hello <span id="accent-word" class="accent">world</span>, <em>today</em> <a href="/om/">about</a>.<br>Next line</p>'
        ctx, page = setup(markup, '.accent{color:rgb(201,32,17);font-weight:700}')
        try:
            target = frame(page).locator('#rich-copy'); target.click(position={'x': 8, 'y': 8})
            expect(page.locator('#element-text')).to_be_visible()
            page.locator('#element-text').fill('Hello world, today about.!\nNext line')
            expect(frame(page).locator('#accent-word')).to_have_text('world')
            assert frame(page).locator('#accent-word').evaluate('el=>getComputedStyle(el).color') == 'rgb(201, 32, 17)'
            saved(page); page.reload(); ready(page)
            page.locator('[data-page-id=final-acceptance]').click(); ready(page)
            expect(frame(page).locator('#rich-copy em')).to_have_text('today')
            expect(frame(page).locator('#rich-copy a')).to_have_attribute('href', '/om/')
            public = browser.new_page(); public.goto(BASE+'/final-acceptance/')
            expect(public.locator('#accent-word')).to_have_text('world')
            assert public.locator('#accent-word').evaluate('el=>getComputedStyle(el).color') == 'rgb(201, 32, 17)'
            expect(public.locator('#rich-copy')).to_have_text('Hello world, today about.!Next line')
            public.screenshot(path=str(OUT/'rich-text-public.png')); public.close()
        finally: ctx.close()

    def locked_preview():
        ctx, page = setup()
        try:
            page.locator('#page-description').fill('Unpublished preview metadata')
            page.locator('[data-action=lock]').click()
            preview = page.frame_locator('#preview-stage iframe').first
            expect(preview.locator('script[type=module][src*="/assets/main."]')).to_have_count(1)
            expect(preview.locator('head > script#cms-preview-data')).to_have_count(1)
            assert preview.locator('body').get_attribute('data-cms-preview') == 'true'
            for _ in range(3):
                page.locator('[data-action=edit]').click(); ready(page)
                page.locator('[data-action=lock]').click()
                expect(page.frame_locator('#preview-stage iframe').first.locator('script[type=module][src*="/assets/main."]')).to_have_count(1)
            page.screenshot(path=str(OUT/'locked-preview-scripts.png'))
        finally: ctx.close()

    def card_preview_export():
        ctx, page = setup()
        try:
            project = api(ctx, 'state').json()['project']
            card = project['cards'][0]
            card['text'] = 'Visible card text\nSecond line'
            card['design'] = {'html': '<article class="rotated-card"><p data-card-text></p></article>', 'css': '.rotated-card{width:400px;height:180px;padding:20px;box-sizing:border-box;background:rgb(250,200,30);transform:rotate(12deg) translate(18px,-10px)}', 'project': None}
            publish(ctx, project); card = api(ctx, 'state').json()['project']['cards'][0]; page.reload(); ready(page)
            qa.CMSBrowserQA.open_assets(page, 'wins')
            page.locator(f'#special-stage [data-win-id="{card["id"]}"]').click(); ready(page)
            page.locator('[data-action=lock]').click()
            preview = page.frame_locator('#preview-stage iframe').first
            root = preview.locator('#cms-win-preview .rotated-card')
            expect(root).to_be_visible(timeout=20000)
            assert root.evaluate('el=>getComputedStyle(el).transform') not in ['none', 'matrix(1, 0, 0, 1, 0, 0)']
            expect(preview.locator('#cms-win-preview [data-card-text]')).to_have_text('Visible card textSecond line')
            page.locator('[data-action=edit]').click(); ready(page)
            with page.expect_download() as pending: page.locator('[data-action=export-win]').click()
            path = OUT/'rotated-card.png'; pending.value.save_as(path)
            data = path.read_bytes(); assert data[:8] == b'\x89PNG\r\n\x1a\n'
            width, height = struct.unpack('>II', data[16:24]); assert width > 800 and height > 360
            # Published card data uses the same design as the locked preview.
            bank = qa.read_api(ctx.request, BASE+'/data/cards.json').json()
            assert next(item for item in bank if item['id'] == card['id'])['design']['html'] == card['design']['html']
        finally: ctx.close()

    def font_replacement():
        ctx, page = setup('<p id="font-copy">A font replacement with two different files</p>')
        try:
            old_file = ROOT/'tests/fixtures/dm-sans-latin-400-normal.woff2'
            new_file = ROOT/'tests/fixtures/dm-sans-latin-700-normal.woff2'
            assert old_file.read_bytes() != new_file.read_bytes()
            old = qa.CMSBrowserQA.upload_file(page, old_file)
            expect(page.locator('#asset-name')).to_be_visible(timeout=20000)
            page.locator('[data-action=theme]').click()
            page.locator('#theme-font').select_option('cms-font-'+old['id'])
            page.locator('[data-page-id=final-acceptance]').click(); ready(page)
            frame(page).locator('#font-copy').click()
            page.locator('details.advanced-style summary').click()
            page.locator('#extra-property').fill('font-family')
            page.locator('#extra-value').fill('"cms-font-'+old['id']+'"')
            page.locator('#apply-property').click(); saved(page)
            previous = api(ctx, 'state').json()['project']
            assert previous['theme']['fontFamily'] == 'cms-font-'+old['id']
            qa.CMSBrowserQA.open_assets(page)
            page.locator(f'#special-stage [data-asset-id="{old["id"]}"]').click()
            page.locator('[data-action=replace-asset]').click()
            replacement = qa.CMSBrowserQA.upload_file(page, new_file)
            expect(page.locator('#studio-toast')).to_contain_text('referenser är ersatta', timeout=20000)
            saved(page)
            state = api(ctx, 'state').json()['project']
            assert state['theme']['fontFamily'] == 'cms-font-'+replacement['id']
            target = next(item for item in state['pages'] if item['id'] == 'final-acceptance')
            assert 'cms-font-'+replacement['id'] in target['css']
            public = browser.new_page(); public.goto(BASE+'/final-acceptance/')
            public.evaluate('document.fonts.ready')
            assert 'cms-font-'+replacement['id'] in public.locator('#font-copy').evaluate('el=>getComputedStyle(el).fontFamily')
            assert qa.read_api(public.request, BASE+replacement['src']).body() == new_file.read_bytes()
            assert qa.read_api(public.request, BASE+old['src']).body() == old_file.read_bytes()
            publish(ctx, previous); public.reload(); public.evaluate('document.fonts.ready')
            assert 'cms-font-'+old['id'] in public.locator('#font-copy').evaluate('el=>getComputedStyle(el).fontFamily')
            public.screenshot(path=str(OUT/'font-replaced-and-restored.png')); public.close()
        finally: ctx.close()

    def quota_export():
        fail_writes = """(()=>{const original=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(stores,mode,...args){if(mode==='readwrite')throw new DOMException('Test quota','QuotaExceededError');return original.call(this,stores,mode,...args)}})()"""
        ctx, page = setup(init=fail_writes)
        try:
            page.locator('#page-description').fill('Valuable text despite rejected local storage')
            expect(page.locator('#backup-status')).to_contain_text('kunde inte sparas', timeout=10000)
            expect(page.locator('[data-action=save]')).to_be_enabled()
            page.locator('[data-action=backups]').click()
            with page.expect_download() as pending: page.locator('#backup-export').click()
            path = OUT/'quota-backup.json'; pending.value.save_as(path)
            assert json.loads(path.read_text())['project']['pages'][0]['description'] == 'Valuable text despite rejected local storage'
            page.screenshot(path=str(OUT/'storage-quota-visible.png'))
        finally: ctx.close()

    for name, case in [('active-input-backup-reload-publish', active_text), ('rich-inspector-structure-reload-public', rich_inspector), ('preview-srcdoc-script-readiness', locked_preview), ('custom-card-visible-transform-export', card_preview_export), ('distinct-font-replacement-and-history', font_replacement), ('storage-quota-visible-export', quota_export)]:
        report.run(name, case)
    browser.close()
raise SystemExit(report.summary())
