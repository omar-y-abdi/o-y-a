"""PR #2 regressions, through the real editor and isolated Worker/D1/R2.

Fixture setup uses the authenticated API; edits, recovery and replacement use
the shipped UI. Fault injection changes transport/storage outcomes, not code.
"""
import copy
import importlib.util
import json
import os
import sys
import uuid
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('cms_review_qa', ROOT/'tests/cms-browser.py')
qa = importlib.util.module_from_spec(spec); sys.modules[spec.name] = qa; spec.loader.exec_module(qa)
BASE = qa.BASE_URL
assert qa.loopback_base(BASE), 'Only an isolated local Worker is allowed'
ENGINE = os.environ.get('CMS_BROWSER', 'chromium')
OUT = ROOT/'output/visual/review'/ENGINE; OUT.mkdir(parents=True, exist_ok=True)
report = qa.Reporter(ROOT/f'output/logs/cms-review-{ENGINE}.log')

def api(context, path, data=None):
    url = BASE+'/admin/api/'+path
    return context.request.get(url) if data is None else context.request.post(url, data=data, headers={'Origin': BASE, 'X-CMS-Request': '1'})

def publish(context, project):
    state = api(context, 'state').json()
    result = api(context, 'save', {'project': project, 'baseVersion': state['version'], 'requestId': str(uuid.uuid4())})
    assert result.ok, (result.status, result.text()[:1000])
    return result.json()

def ready(page):
    qa.CMSBrowserQA.wait_canvas(page)
    expect(page.locator('#page-description')).to_be_visible()

def admin(context):
    page = context.new_page(); page.on('dialog', lambda dialog: dialog.accept())
    page.goto(BASE+'/admin/'); ready(page)
    return page

def save(page):
    page.locator('[data-action=save]').click(); qa.CMSBrowserQA.wait_saved(page)

def shot(page, name):
    page.mouse.move(3, 3); page.screenshot(path=str(OUT/f'{name}.png'))

def records(page):
    return page.evaluate("""() => new Promise((resolve,reject) => {
      const open=indexedDB.open('oy-portfolio-studio',1);
      open.onerror=()=>reject(open.error);
      open.onsuccess=()=>{const db=open.result;const tx=db.transaction('drafts');const q=tx.objectStore('drafts').getAll();q.onsuccess=()=>{resolve(q.result.filter(x=>x.project&&!x.deleted));db.close()};};
    })""")

def backup_settled(page):
    expect(page.locator('#backup-status')).to_contain_text('sparat för denna flik', timeout=10000)

def restore_prompt(page):
    expect(page.locator('#dialog-content')).to_contain_text('En idé väntar')
    page.locator('[data-confirm=yes]').click()
    expect(page.locator('#studio-dialog')).to_be_hidden(timeout=20000)
    ready(page)

with sync_playwright() as pw:
    browser = getattr(pw, ENGINE).launch()
    def context():
        ctx = browser.new_context(storage_state=str(qa.STATE_PATH), viewport={'width':1440,'height':900}, reduced_motion='reduce')
        publish(ctx, api(ctx, 'revision/0').json()['project'])
        return ctx

    def independent_tabs():
        for order in ('A', 'B'):
            ctx = context()
            try:
                a, b = admin(ctx), admin(ctx)
                a.locator('#page-description').fill('Tab A independent valuable draft')
                backup_settled(a)
                b.locator('#page-description').fill('Tab B published version')
                save(b)
                assert any(r['project']['pages'][0]['description']=='Tab A independent valuable draft' for r in records(a))
                # Revert B's next edit must only acknowledge B's own generation.
                b.locator('#page-description').fill('Tab B disposable edit'); backup_settled(b)
                b.locator('[data-action=revert]').click(); b.locator('[data-confirm=yes]').click()
                expect(b.locator('#page-description')).to_have_value('Tab B published version')
                expect(b.locator('#backup-status')).to_have_text('Reservutkast redo')
                if order == 'B': b.close()
                a.reload(); ready(a); restore_prompt(a)
                expect(a.locator('#page-description')).to_have_value('Tab A independent valuable draft')
                a.locator('[data-action=backups]').click()
                expect(a.locator('#backup-export')).to_be_visible()
                shot(a, 'independent-tab-recovery-'+order)
            finally: ctx.close()

    def incomplete_and_export():
        ctx = context()
        try:
            page = admin(ctx)
            page.locator('#page-description').fill('Valuable incomplete draft survives')
            page.locator('#page-title').fill(''); backup_settled(page)
            page.reload(); ready(page); restore_prompt(page)
            expect(page.locator('#page-title')).to_have_value('')
            expect(page.locator('#page-description')).to_have_value('Valuable incomplete draft survives')
            expect(page.locator('#studio-toast')).to_contain_text('Rätta före Save')
            shot(page, 'incomplete-draft-restored')
            page.locator('[data-action=backups]').click()
            with page.expect_download() as download: page.locator('#backup-export').click()
            exported = OUT/'incomplete-draft.json'; download.value.save_as(exported)
            data = json.loads(exported.read_text()); assert data['format']=='oy-portfolio-draft'
            assert data['project']['pages'][0]['title']==''
            # An unsafe imported draft remains downloadable and gets a visible error.
            data['project']['pages'][0]['css']='body{background:url(https://evil.example/leak)}'
            unsafe = OUT/'unsafe-import.json'; unsafe.write_text(json.dumps(data))
            page.locator('#backup-file').set_input_files(str(unsafe))
            page.locator('[data-confirm=yes]').click()
            expect(page.locator('#dialog-content')).to_contain_text('Utkastet kunde inte läsas säkert')
            expect(page.locator('#export-rejected')).to_be_visible()
            with page.expect_download() as rejected: page.locator('#export-rejected').click()
            rejected.value.save_as(OUT/'rejected-original.json')
            assert json.loads((OUT/'rejected-original.json').read_text())['project']==data['project']
            shot(page, 'unsafe-backup-visible-error')
        finally: ctx.close()

    def failed_recovery_keeps_original():
        ctx = context()
        try:
            page = admin(ctx); page.locator('#page-description').fill('Session expiry must not destroy this'); backup_settled(page)
            page.route('**/admin/api/recover', lambda route: route.fulfill(status=401, content_type='application/json', body='{"error":"Sessionen har gått ut."}'))
            page.reload(); ready(page); page.locator('[data-confirm=yes]').click()
            expect(page.locator('#dialog-content')).to_contain_text('Sessionen har gått ut')
            assert any(r['project']['pages'][0]['description']=='Session expiry must not destroy this' for r in records(page))
            shot(page, 'expired-session-recovery')
        finally: ctx.close()

    def save_outcomes():
        ctx = context()
        try:
            page=admin(ctx); calls=[]
            def reject(route):
                data=route.request.post_data_json; calls.append(data)
                if len(calls)==1: route.fulfill(status=413, content_type='text/plain', body='Content too large')
                else: route.continue_()
            page.route('**/admin/api/save', reject)
            page.locator('#page-description').fill('Rejected payload')
            with page.expect_response(lambda r:r.url.endswith('/admin/api/save')): page.locator('[data-action=save]').click()
            expect(page.locator('#save-status')).not_to_contain_text('Sparar')
            page.locator('#page-description').fill('Corrected payload'); save(page)
            assert calls[0]['requestId']!=calls[1]['requestId'] and calls[1]['project']['pages'][0]['description']=='Corrected payload'
            page.unroute('**/admin/api/save'); calls=[]
            def lose(route):
                calls.append(route.request.post_data_json)
                if len(calls)==1:
                    response=route.fetch(); assert response.ok
                    route.abort('failed')
                else: route.continue_()
            page.route('**/admin/api/save', lose)
            page.locator('#page-description').fill('Committed but response lost')
            page.locator('[data-action=save]').click()
            expect(page.locator('#studio-toast')).to_contain_text('Kontakten bröts')
            page.locator('#studio-dialog [data-action=close-dialog]').click()
            page.locator('#page-description').fill('Newer correction after unknown outcome')
            save(page)
            assert calls[0]==calls[1], 'Unknown commit must replay the exact ID and payload'
            assert len(calls)==3 and calls[2]['requestId']!=calls[1]['requestId']
            assert api(ctx,'state').json()['project']['pages'][0]['description']=='Newer correction after unknown outcome'
            shot(page,'save-rejection-and-replay')
        finally: ctx.close()

    def metadata_conflict():
        ctx=context()
        try:
            a=admin(ctx); a.locator('#file-input').set_input_files(str(ROOT/'public/mail/omar-smile.png'))
            expect(a.locator('#asset-name')).to_be_visible()
            src=a.locator('#special-stage img').get_attribute('src'); asset_id=src.split('/')[-1].split('.')[0]
            b=admin(ctx); b.locator('[data-library=assets]').click(); b.locator(f'[data-asset-id="{asset_id}"]').click()
            a.locator('[data-action=archive-asset]').click(); a.locator('[data-confirm=yes]').click()
            b.locator('#asset-name').fill('Renamed without reversing archive')
            b.locator('#asset-alt').fill('Concurrent alternative text')
            b.locator('[data-action=save-asset]').click()
            expect(b.locator('#dialog-content')).to_contain_text('Granska innan du skriver över')
            expect(b.locator('#asset-name')).to_have_value('Renamed without reversing archive')
            shot(b,'asset-metadata-conflict')
            b.locator('#retry-asset').click()
            expect(b.locator('[data-action=unarchive-asset]')).to_be_visible()
            item=next(x for x in api(ctx,'state').json()['assets'] if x['id']==asset_id)
            assert item['archived'] and item['name']=='Renamed without reversing archive' and item['alt']=='Concurrent alternative text'
        finally: ctx.close()

    def linked_clone():
        ctx=context()
        try:
            state=api(ctx,'state').json(); project=state['project']
            markup='<section id="copy-section" aria-labelledby="copy-target" style="padding:19px;color:rgb(201,32,17)"><h2 id="copy-target">Local clone target</h2><a href="#copy-target">Local clone link</a><a href="/kontakt/">External target</a><svg viewBox="0 0 10 10" width="40" height="40"><defs><clipPath id="copy-clip"><circle cx="5" cy="5" r="5"></circle></clipPath></defs><rect width="10" height="10" clip-path="url(#copy-clip)"></rect></svg></section>'
            project['pages'].append({**state['blank'],'id':'review-clone','sourceId':'blank','path':'/review-clone/','html':state['blank']['html'].replace('</main>',markup+'</main>')})
            publish(ctx,project)
            page=admin(ctx); page.locator('[data-page-id=review-clone]').click(); ready(page)
            frame=page.frame_locator('#editor iframe.gjs-frame')
            frame.get_by_text('Local clone target',exact=True).click(); page.locator('#select-parent').click(); page.locator('#duplicate-element').click()
            expect(frame.get_by_text('Local clone target',exact=True)).to_have_count(2)
            save(page); page.reload(); ready(page)
            public=browser.new_page(); public.goto(BASE+'/review-clone/')
            values=public.locator('section:has(h2)').filter(has=public.get_by_text('Local clone target',exact=True)).evaluate_all("""ss=>ss.map(s=>({id:s.id,heading:s.querySelector('h2').id,link:s.querySelector('a').getAttribute('href'),label:s.getAttribute('aria-labelledby'),clip:s.querySelector('clipPath').id,clipRef:s.querySelector('rect').getAttribute('clip-path'),padding:getComputedStyle(s).padding,color:getComputedStyle(s).color}))""")
            assert len(values)==2 and values[0]['id']!=values[1]['id'],values
            for value in values:
                assert value['link']=='#'+value['heading'] and value['label']==value['heading'],value
                assert value['clipRef']=='url(#'+value['clip']+')',value
                assert value['padding']=='19px' and value['color']=='rgb(201, 32, 17)',value
                public.locator('#'+value['id']+' a').first.click()
                assert public.url.endswith('#'+value['heading'])
            shot(public,'clone-semantic-references'); public.close()
            # Removing the original no longer strands the cloned references.
            page.locator('[data-page-id=review-clone]').click(); ready(page)
            frame=page.frame_locator('#editor iframe.gjs-frame'); frame.get_by_text('Local clone target',exact=True).first.click()
            page.locator('#select-parent').click(); page.locator('#delete-element').click()
            if page.locator('[data-confirm=yes]').is_visible(): page.locator('[data-confirm=yes]').click()
            save(page)
            assert api(ctx,'validate',{'project':api(ctx,'state').json()['project']}).ok
        finally: ctx.close()

    def resource_slots():
        ctx=context()
        try:
            page=admin(ctx)
            for slot in ['social','icon','emailStatic','emailAnimated']:
                assets=api(ctx,'state').json()['assets']; builtin=next(x for x in assets if x.get('slot')==slot)
                page.locator('[data-library=assets]').click(); page.locator('[data-special=media]').click()
                page.locator(f'[data-asset-id="{builtin["id"]}"]').click()
                page.locator('[data-action=replace-asset]').click()
                page.locator('#file-input').set_input_files(str(ROOT/'public/social/omar-yusuf.png'))
                expect(page.locator('#studio-toast')).to_contain_text('referenser är ersatta',timeout=20000)
                save(page)
                state=api(ctx,'state').json(); src=state['project']['resources'][slot]
                assert src.startswith('/media/')
                anonymous=browser.new_context()
                response=anonymous.request.get(BASE+src); assert response.status==200 and response.body()==(ROOT/'public/social/omar-yusuf.png').read_bytes()
                html=anonymous.request.get(BASE+'/').text()
                if slot=='social': assert f'property="og:image" content="{BASE+src}"' in html
                if slot=='icon': assert f'rel="apple-touch-icon" href="{src}"' in html
                anonymous.close()
                shot(page,'resource-slot-'+slot)
        finally: ctx.close()

    cases=[('independent-tabs-save-revert-reload',independent_tabs),('incomplete-recovery-export-unsafe-import',incomplete_and_export),('expired-session-keeps-backup',failed_recovery_keeps_original),('definitive-rejection-and-unknown-replay',save_outcomes),('metadata-cas-explicit-retry',metadata_conflict),('clone-anchor-aria-svg-style-delete-original',linked_clone),('builtin-resource-publication',resource_slots)]
    selected=os.environ.get('CMS_REVIEW_CASE')
    for name,run in cases:
        if not selected or selected in name: report.run(name,run)
    browser.close()
raise SystemExit(report.summary())
