"""PR #2 regressions, through the real editor and isolated Worker/D1/R2.

Fixture setup uses the authenticated API; edits, recovery and replacement use
the shipped UI. Fault injection changes transport/storage outcomes, not code.
"""
import copy
import importlib.util
import hashlib
import json
import os
import re
import sys
import uuid
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('cms_review_qa', ROOT/'tests/cms-browser.py')
qa = importlib.util.module_from_spec(spec); sys.modules[spec.name] = qa; spec.loader.exec_module(qa)
Q = qa.CMSBrowserQA
BASE = qa.BASE_URL
assert qa.loopback_base(BASE), 'Only an isolated local Worker is allowed'
ENGINE = os.environ.get('CMS_BROWSER', 'chromium')
OUT = ROOT/'output/visual/review'/ENGINE; OUT.mkdir(parents=True, exist_ok=True)
report = qa.Reporter(ROOT/f'output/logs/cms-review-{ENGINE}.log')

def api(context, path, data=None):
    url = BASE+'/admin/api/'+path
    return qa.read_api(context.request, url) if data is None else context.request.post(url, data=data, headers={'Origin': BASE, 'X-CMS-Request': '1'})

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
    browser = qa.launch_browser(pw)
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
                qa.CMSBrowserQA.revert_if_dirty(b)
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
            assert calls[0]['requestId']!=calls[1]['requestId'] and any(page['description']=='Corrected payload' for page in calls[1]['changes']['pages']['upsert'])
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
            expect(page.locator('#studio-toast')).to_contain_text('Anslutningen bröts')
            page.locator('#studio-dialog [data-action=close-dialog]').click()
            page.locator('#page-description').fill('Newer correction after unknown outcome')
            save(page)
            assert calls[0]==calls[1], 'Unknown commit must replay the exact ID and payload'
            assert len(calls)==3 and calls[2]['requestId']!=calls[1]['requestId']
            assert api(ctx,'state').json()['project']['pages'][0]['description']=='Newer correction after unknown outcome'
            shot(page,'save-rejection-and-replay')
        finally: ctx.close()

    def rapid_inline_save_diagnostic():
        ctx=context()
        try:
            page=admin(ctx); requests=[]
            original=next(item for item in api(ctx,'state').json()['project']['pages'] if item.get('id')=='home')
            def capture(route):
                requests.append(route.request.post_data_json)
                route.continue_()
            page.route('**/admin/api/save',capture)
            frame=qa.CMSBrowserQA.frame(page)
            target=frame.locator('#hero-title')
            target.dblclick()
            editable=frame.locator('[contenteditable=true]').first
            editable.wait_for(state='visible',timeout=5000)
            marker=f'RAPID-{uuid.uuid4().hex[:6]}'
            editable.press('ControlOrMeta+A')
            editable.press('Backspace')
            expect(page).to_have_url(BASE+'/admin/')
            expect(editable).to_have_attribute('contenteditable', 'true')
            editable.type(marker)
            with page.expect_response(lambda response:response.url.endswith('/admin/api/save')) as response:
                page.locator('[data-action=save]').click()
            result=response.value
            expect(page.locator('#save-status')).not_to_contain_text('Sparar',timeout=20000)
            page.wait_for_timeout(600)  # let the editor flush and recovery write settle
            state=api(ctx,'state').json()
            rows=records(page)
            row=max(rows,key=lambda item:item.get('updatedAt','')) if rows else None
            payload=requests[0] if requests else {}
            submitted=next((item for item in payload.get('changes',{}).get('pages',{}).get('upsert',[]) if item.get('id')=='home'),{})
            current=next((item for item in state['project']['pages'] if item.get('id')=='home'),{})
            backup=next((item for item in (row or {}).get('project',{}).get('pages',[]) if item.get('id')=='home'),{})
            fields=('title','description','html','css')
            print('RAPID_SAVE_DIAGNOSTIC '+json.dumps({
                'browser':ENGINE,'status':result.status,'requestCount':len(requests),
                'requestBytes':len(json.dumps(payload,separators=(',',':')).encode()),
                'submittedPageFields':sorted(submitted),'serverVersion':state['version'],
                'serverDiffFromSubmitted':[key for key in fields if submitted.get(key)!=current.get(key)],
                'backupDiffFromSubmitted':[key for key in fields if submitted.get(key)!=backup.get(key)] if backup else None,
                'saveStatus':page.locator('#save-status').inner_text(),
                'backupStatus':page.locator('#backup-status').inner_text(),
            },ensure_ascii=False))
            if result.status!=200:
                def fallbacks(value):
                    matches=re.findall(r'<noscript\b[^>]*>[\s\S]*?</noscript>',value.get('html',''),re.I)
                    return {'count':len(matches),'nodes':[{'bytes':len(source.encode()),'sha256':hashlib.sha256(source.encode()).hexdigest(),'source':source[:512]} for source in matches[:2]]}
                print('RAPID_SAVE_FALLBACK_DIAGNOSTIC '+json.dumps({
                    'browser':ENGINE,'original':fallbacks(original),'submitted':fallbacks(submitted),
                    'server':fallbacks(current),'backup':fallbacks(backup),
                },ensure_ascii=False))
            assert len(requests)==1 and result.status==200, 'Expected one successful immediate Save request.'
            assert not (backup and [key for key in fields if backup.get(key)!=submitted.get(key)]), 'A canvas/editor flush changed the draft after Save despite no further user input.'
            assert 'Utkast' not in page.locator('#save-status').inner_text(), 'A single immediate Save should leave this no-further-input draft clean.'
            shot(page,'rapid-inline-save-diagnostic')
        finally: ctx.close()

    def metadata_conflict():
        ctx=context()
        try:
            a=admin(ctx)
            uploaded=qa.CMSBrowserQA.upload_file(a, ROOT/'public/mail/omar-smile.png')
            asset_id=uploaded['id']
            expect(a.locator('#asset-name')).to_be_visible()
            b=admin(ctx)
            Q.open_assets(b)
            row=b.locator(f'#special-stage [data-asset-id="{asset_id}"]')
            row.wait_for(state='visible', timeout=20000)
            row.click()
            expect(b.locator('#asset-name')).to_be_visible(timeout=20000)
            a.locator('[data-action=archive-asset]').click(); a.locator('[data-confirm=yes]').click()
            b.locator('#asset-name').fill('Renamed without reversing archive')
            b.locator('#asset-alt').fill('Concurrent alternative text')
            b.locator('[data-action=save-asset]').click()
            expect(b.locator('#dialog-content')).to_contain_text('Granska innan du skriver över')
            expect(b.locator('#asset-name')).to_have_value('Renamed without reversing archive')
            shot(b,'asset-metadata-conflict')
            b.locator('#retry-asset').click()
            expect(b.locator('[data-action=restore-asset]')).to_be_visible()
            archived=api(ctx,'assets?state=archived').json()['items']
            item=next(x for x in archived if x['id']==asset_id)
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
            saved_state=api(ctx,'state').json()
            saved_page=next(x for x in saved_state['project']['pages'] if x['id']=='review-clone')
            compact_css=saved_page['css'].replace(' ','')
            assert 'padding:19px' in compact_css and 'color:rgb(201,32,17)' in compact_css, saved_page['css']
            assert 'color:black' not in compact_css and 'border:0solidblack' not in compact_css, saved_page['css']
            public=browser.new_page()
            with public.expect_response(lambda response: '/cms-public/v' in response.url and response.url.endswith('/review-clone.css')) as css_info:
                public.goto(BASE+'/review-clone/',wait_until='load')
            css_response=css_info.value
            assert css_response.ok, (css_response.status, css_response.url)
            published_css=css_response.text().replace(' ','')
            assert 'padding:19px' in published_css and 'color:rgb(201,32,17)' in published_css, published_css
            sections=public.locator('section:has(h2)').filter(has=public.get_by_text('Local clone target',exact=True))
            expect(sections).to_have_count(2)
            for index in range(2):
                expect(sections.nth(index)).to_have_css('padding','19px')
                expect(sections.nth(index)).to_have_css('color','rgb(201, 32, 17)')
            values=sections.evaluate_all("""ss=>ss.map(s=>({id:s.id,heading:s.querySelector('h2').id,link:s.querySelector('a').getAttribute('href'),label:s.getAttribute('aria-labelledby'),clip:s.querySelector('clipPath').id,clipRef:s.querySelector('rect').getAttribute('clip-path'),padding:getComputedStyle(s).padding,color:getComputedStyle(s).color}))""")
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
                qa.CMSBrowserQA.open_assets(page)
                page.locator(f'#special-stage [data-asset-id="{builtin["id"]}"]').click()
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

    TAGLINE = '[data-cms-shared="footer.tagline"]'
    def set_tagline(page, text):
        node = Q.frame(page).locator(TAGLINE)
        node.scroll_into_view_if_needed(); node.click(); node.dblclick()
        page.keyboard.press('ControlOrMeta+a'); page.keyboard.type(text)
        page.wait_for_timeout(600)

    def shared_everywhere(ctx, text):
        project = api(ctx, 'state').json()['project']
        assert text in project['frame']['html'], project['frame']
        assert all('data-cms-shared="footer.tagline"' not in item['html'] for item in project['pages']), project['pages']
        return project

    def tagline_then_new_page():
        # A3 phase 0: a changed tagline and a page created from the blank template save with 200.
        ctx = context()
        try:
            page = admin(ctx)
            set_tagline(page, 'Ny tagline före ny sida')
            page.locator('[data-action=add-page]').click()
            page.locator('#new-page-name').fill('Tagline-test'); page.locator('#new-page-path').fill('/tagline-test/')
            page.locator('#create-page').click(); Q.wait_canvas(page)
            save(page)
            project = shared_everywhere(ctx, 'Ny tagline före ny sida')
            assert any(item['path'] == '/tagline-test/' for item in project['pages'])
        finally: ctx.close()

    def two_tabs_keep_mine():
        # A3 phase 0: stale tab saves 409, Sammanför + Behåll mina, then Spara is 200 with one tagline on every page.
        ctx = context()
        try:
            a, b = admin(ctx), admin(ctx)
            set_tagline(a, 'Flik A:s tagline'); save(a)
            set_tagline(b, 'Flik B:s tagline')
            b.locator('[data-action=save]').click()
            expect(b.locator('#dialog-content')).to_contain_text('En nyare version finns')
            b.locator('[data-action=reconcile]').click()
            expect(b.locator('#dialog-content')).to_contain_text('Välj dina ändringar')
            Q.confirm_yes(b); Q.wait_canvas(b)
            save(b)
            shared_everywhere(ctx, 'Flik B:s tagline')
        finally: ctx.close()

    def save_error_stays():
        # A7: the last save error stays in #save-status past the 12 s toast until a 200 clears it.
        ctx = context()
        try:
            page = admin(ctx); message = 'Människan: Länken har en otillåten adress.'
            def reject(route): route.fulfill(status=422, content_type='application/json', body=json.dumps({'error': message}))
            page.route('**/admin/api/save', reject)
            page.locator('#page-description').fill('Ett utkast som sparas fel')
            page.locator('[data-action=save]').click()
            expect(page.locator('#save-status')).to_contain_text(message)
            page.wait_for_timeout(13000)
            expect(page.locator('#studio-toast')).to_be_hidden()
            expect(page.locator('#save-status')).to_contain_text(message)
            page.locator('#page-description').fill('Ett utkast som sparas fel igen')
            expect(page.locator('#save-status')).to_contain_text(message)
            page.unroute('**/admin/api/save')
            save(page)
            expect(page.locator('#save-status')).not_to_contain_text(message)
            expect(page.locator('#save-status')).to_contain_text('Alla ändringar sparade')
        finally: ctx.close()

    def empty_link_blocks_save():
        # A4: a link without an address stops Save with the node selected and focus in #element-href; with /om/ Save is 200.
        ctx = context()
        try:
            page = admin(ctx); calls = []
            page.route('**/admin/api/save', lambda route: (calls.append(1), route.continue_()))
            node = Q.frame(page).locator('main p').first
            node.scroll_into_view_if_needed(); node.click(); node.dblclick()
            node.evaluate("""el => { const doc = el.ownerDocument, selection = doc.getSelection(), range = doc.createRange(); el.focus(); range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range); }""")
            page.locator('.gjs-rte-action[title="Link"]').click()
            page.locator('[data-action=save]').click()
            expect(page.locator('#studio-toast')).to_contain_text('Länken saknar adress.')
            expect(page.locator('#element-href')).to_be_focused()
            assert not calls, 'Save must not reach the server with an empty link'
            page.locator('#element-href').fill('/om/'); page.locator('#element-href').press('Tab')
            save(page)
            assert len(calls) == 1
        finally: ctx.close()

    def resize_is_one_undo_step():
        # Batch 2 review: every resize gesture is exactly one toolbar Undo step, never merged with neighbouring edits.
        ctx = context()
        try:
            state = api(ctx, 'state').json(); project = state['project']
            box = '<div id="rbox" style="width:200px;height:100px;background-color:rgb(10,20,30)"></div>'
            project['pages'].append({**state['blank'], 'id': 'review-resize', 'sourceId': 'blank', 'path': '/review-resize/', 'html': state['blank']['html'].replace('</main>', box+'</main>')})
            publish(ctx, project)
            page = admin(ctx); page.locator('[data-page-id=review-resize]').click(); ready(page)
            node = Q.frame(page).locator('#rbox')
            node.scroll_into_view_if_needed(); node.click()
            def width(): return round(node.evaluate('el => el.getBoundingClientRect().width'))
            def resize(dx):
                handle = page.locator('.gjs-resizer-h-br'); expect(handle).to_be_visible()
                box = handle.bounding_box(); x, y = box['x']+box['width']/2, box['y']+box['height']/2
                page.mouse.move(x, y); page.mouse.down(); page.mouse.move(x+dx/2, y, steps=4); page.mouse.move(x+dx, y, steps=4); page.mouse.up()
            def undo():
                page.locator('[data-action=undo]').click(); Q.wait_canvas(page)
                nonlocal node
                node = Q.frame(page).locator('#rbox'); node.scroll_into_view_if_needed(); node.click()
            original = width()
            page.locator('summary', has_text='Fler stilegenskaper').click()
            page.locator('#extra-property').fill('background-color'); page.locator('#extra-value').fill('rgb(200,10,10)')
            page.locator('#apply-property').click()
            expect(page.locator('.gjs-resizer-h-br')).to_be_visible()
            page.wait_for_timeout(100)
            resize(80)
            page.wait_for_timeout(400)
            first = width(); assert first > original, (original, first)
            undo()
            assert width() == original, ('resize must revert alone', original, width())
            assert node.evaluate('el => getComputedStyle(el).backgroundColor') == 'rgb(200, 10, 10)', 'colour edit must survive the undo'
            resize(60); mid = width(); resize(60)
            second = width(); assert original < mid < second, (original, mid, second)
            page.wait_for_timeout(300)
            undo()
            assert width() == mid, ('only the second resize reverts', original, mid, second, width())
        finally: ctx.close()

    def resize_then_immediate_edit(page, locate, select_target):
        # Resize, then at once (no wait) an inspector colour edit: Undo reverts only the colour, a second Undo the size.
        def width(): return round(locate().evaluate('el => el.getBoundingClientRect().width'))
        def colour(): return locate().evaluate('el => getComputedStyle(el).backgroundColor')
        select_target()
        original, original_colour = width(), colour()
        handle = page.locator('.gjs-resizer-h-br'); expect(handle).to_be_visible()
        box = handle.bounding_box(); x, y = box['x']+box['width']/2, box['y']+box['height']/2
        page.mouse.move(x, y); page.mouse.down(); page.mouse.move(x+40, y, steps=4); page.mouse.move(x+80, y, steps=4); page.mouse.up()
        page.locator('summary', has_text='Fler stilegenskaper').click()
        page.locator('#extra-property').fill('background-color'); page.locator('#extra-value').fill('rgb(200,10,10)')
        page.locator('#apply-property').click()
        expect(page.locator('.gjs-resizer-h-br')).to_be_visible()  # handles survive an inspector edit without re-clicking
        resized = width(); assert resized > original, (original, resized)
        page.locator('[data-action=undo]').click(); Q.wait_canvas(page); select_target()
        assert width() == resized and colour() == original_colour, ('first Undo reverts only the colour', original, resized, width(), colour())
        page.locator('[data-action=undo]').click(); Q.wait_canvas(page); select_target()
        assert width() == original, ('second Undo reverts the size', original, width())

    def resize_then_immediate_edit_page():
        ctx = context()
        try:
            state = api(ctx, 'state').json(); project = state['project']
            box = '<div id="rbox2" style="width:200px;height:100px;background-color:rgb(10,20,30)"></div>'
            project['pages'].append({**state['blank'], 'id': 'review-resize2', 'sourceId': 'blank', 'path': '/review-resize2/', 'html': state['blank']['html'].replace('</main>', box+'</main>')})
            publish(ctx, project)
            page = admin(ctx); page.locator('[data-page-id=review-resize2]').click(); ready(page)
            locate = lambda: Q.frame(page).locator('#rbox2')
            def select_target(): locate().scroll_into_view_if_needed(); locate().click()
            resize_then_immediate_edit(page, locate, select_target)
        finally: ctx.close()

    cases=[('independent-tabs-save-revert-reload',independent_tabs),('incomplete-recovery-export-unsafe-import',incomplete_and_export),('expired-session-keeps-backup',failed_recovery_keeps_original),('definitive-rejection-and-unknown-replay',save_outcomes),('rapid-inline-save-diagnostic',rapid_inline_save_diagnostic),('metadata-cas-explicit-retry',metadata_conflict),('clone-anchor-aria-svg-style-delete-original',linked_clone),('builtin-resource-publication',resource_slots)]
    cases+=[('tagline-then-new-page',tagline_then_new_page),('two-tabs-keep-mine',two_tabs_keep_mine),('save-error-stays',save_error_stays),('empty-link-blocks-save',empty_link_blocks_save),('resize-is-one-undo-step',resize_is_one_undo_step),('resize-then-immediate-edit-page',resize_then_immediate_edit_page)]
    selected=os.environ.get('CMS_REVIEW_CASE')
    for name,run in cases:
        if not selected or selected in name: report.run(name,run)
    browser.close()
raise SystemExit(report.summary())
